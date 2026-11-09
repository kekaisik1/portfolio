"""The portfolio's API: lanterns everyone can see, and notes that reach Kaisar."""

from __future__ import annotations

import logging

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.config import Settings
from app.db import Lantern, Store
from app.notify import LogOnlyNotifier, Notifier, TelegramNotifier
from app.ratelimit import RateLimiter

log = logging.getLogger(__name__)

HOUR, DAY = 3600.0, 86400.0
MAX_BODY = 4096


class LanternIn(BaseModel):
    """A lantern as the page sends it: sky position (x, y) and how far along the journey it was lit (s)."""

    model_config = ConfigDict(extra="forbid")
    x: float = Field(ge=0, le=1, allow_inf_nan=False)
    y: float = Field(ge=0, le=0.5, allow_inf_nan=False)
    s: float = Field(ge=0, le=1, allow_inf_nan=False)


class NoteIn(BaseModel):
    """A visitor's note. `website` is a trap: people never see it, bots fill it in."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    text: str = Field(min_length=1, max_length=600)
    contact: str = Field(default="", max_length=120)
    website: str = Field(default="", max_length=200)

    @field_validator("text", "contact")
    @classmethod
    def no_control_chars(cls, v: str) -> str:
        return "".join(ch for ch in v if ch in "\n\t" or ch.isprintable())


def client_ip(request: Request) -> str:
    """The visitor's address as the proxy reports it (Railway sets X-Real-IP), else the socket's."""
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def create_app(settings: Settings, store: Store | None = None, notifier: Notifier | None = None) -> FastAPI:
    """Build the app. Storage and the notifier can be passed in: that is how the tests run offline."""
    db = store or Store(settings.database_path)
    if notifier is None:
        if settings.telegram_bot_token and settings.telegram_chat_id:
            notifier = TelegramNotifier(settings.telegram_bot_token, settings.telegram_chat_id)
        else:
            notifier = LogOnlyNotifier()
    out: Notifier = notifier

    lantern_each = RateLimiter(settings.lanterns_per_hour, HOUR)
    lantern_all = RateLimiter(settings.lanterns_per_day_everyone, DAY)
    note_each = RateLimiter(settings.notes_per_hour, HOUR)
    note_all = RateLimiter(settings.notes_per_day_everyone, DAY)

    app = FastAPI(title="Portfolio API", docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_methods=["GET", "POST"],
        allow_headers=["content-type"],
        max_age=86400,
    )

    @app.middleware("http")
    async def small_bodies_only(request: Request, call_next):  # type: ignore[no-untyped-def]
        length = request.headers.get("content-length", "0")
        if not length.isdigit() or int(length) > MAX_BODY:
            return Response(status_code=413)
        return await call_next(request)

    def deliver(note_id: int, text: str) -> None:
        if out.send(note_id, text):
            db.mark_delivered(note_id)

    @app.get("/healthz")
    def healthz() -> dict[str, object]:
        return {"ok": True, "undelivered_notes": db.undelivered_notes()}

    @app.get("/api/lanterns")
    def get_lanterns(response: Response) -> dict[str, object]:
        count, lanterns = db.lanterns(settings.lanterns_shown)
        response.headers["Cache-Control"] = "public, max-age=15"
        return {"count": count, "lanterns": [{"x": ln.x, "y": ln.y, "s": ln.s} for ln in lanterns]}

    @app.post("/api/lanterns", status_code=201)
    def post_lantern(body: LanternIn, request: Request) -> dict[str, object]:
        if not lantern_each.allow(client_ip(request)) or not lantern_all.allow("everyone"):
            raise HTTPException(429, "That's a lot of lanterns. The sky needs a rest; try again in an hour.")
        return {"count": db.add_lantern(Lantern(body.x, body.y, body.s))}

    @app.post("/api/notes", status_code=201)
    def post_note(body: NoteIn, request: Request, tasks: BackgroundTasks) -> dict[str, object]:
        if body.website:
            # a bot: answer as if it worked, keep nothing
            return {"ok": True}
        if not note_each.allow(client_ip(request)) or not note_all.allow("everyone"):
            raise HTTPException(429, "That's a lot of notes. Try again in an hour, or send an email instead.")
        note_id = db.add_note(body.text, body.contact)
        message = "A note from the portfolio:\n\n" + body.text
        if body.contact:
            message += "\n\nAnswer to: " + body.contact
        tasks.add_task(deliver, note_id, message)
        return {"ok": True}

    return app


def app_from_env() -> FastAPI:
    """Entry point for uvicorn: `uvicorn app.main:app_from_env --factory`."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    return create_app(Settings.from_env())
