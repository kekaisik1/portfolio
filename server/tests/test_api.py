from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.db import Store
from app.main import create_app
from app.ratelimit import RateLimiter

ORIGIN = "https://kekaisik1.github.io"


class FakeNotifier:
    def __init__(self, works: bool = True) -> None:
        self.works = works
        self.sent: list[tuple[int, str]] = []

    def send(self, note_id: int, text: str) -> bool:
        self.sent.append((note_id, text))
        return self.works


def make(notifier: FakeNotifier | None = None, **overrides: int) -> tuple[TestClient, Store, FakeNotifier]:
    settings = Settings(database_path=Path(":memory:"), allowed_origins=(ORIGIN,), **overrides)
    store = Store(settings.database_path)
    fake = notifier or FakeNotifier()
    return TestClient(create_app(settings, store, fake)), store, fake


def test_lit_lantern_is_stored_and_listed_with_the_count() -> None:
    client, _, _ = make()

    res = client.post("/api/lanterns", json={"x": 0.4, "y": 0.2, "s": 0.8})
    listed = client.get("/api/lanterns").json()

    assert res.status_code == 201
    assert res.json() == {"count": 1}
    assert listed == {"count": 1, "lanterns": [{"x": 0.4, "y": 0.2, "s": 0.8}]}


def test_list_returns_only_the_newest_lanterns_but_counts_all() -> None:
    client, _, _ = make(lanterns_shown=2, lanterns_per_hour=10)

    for i in range(3):
        client.post("/api/lanterns", json={"x": i / 10, "y": 0.1, "s": 0.5})
    listed = client.get("/api/lanterns").json()

    assert listed["count"] == 3
    assert [ln["x"] for ln in listed["lanterns"]] == [0.1, 0.2]


@pytest.mark.parametrize(
    "body",
    [
        {"x": 1.5, "y": 0.2, "s": 0.5},
        {"x": 0.5, "y": 0.9, "s": 0.5},
        {"x": "NaN", "y": 0.2, "s": 0.5},
        {"x": 0.5, "y": 0.2},
        {"x": 0.5, "y": 0.2, "s": 0.5, "extra": "<script>"},
    ],
)
def test_lantern_outside_the_sky_is_rejected(body: dict[str, object]) -> None:
    client, _, _ = make()

    res = client.post("/api/lanterns", json=body)

    assert res.status_code == 422
    assert client.get("/api/lanterns").json()["count"] == 0


def test_too_many_lanterns_from_one_visitor_are_refused_but_others_can_still_light() -> None:
    client, _, _ = make(lanterns_per_hour=2)
    body = {"x": 0.5, "y": 0.2, "s": 0.5}

    first = [
        client.post("/api/lanterns", json=body, headers={"x-real-ip": "1.1.1.1"}).status_code
        for _ in range(3)
    ]
    other = client.post("/api/lanterns", json=body, headers={"x-real-ip": "2.2.2.2"}).status_code

    assert first == [201, 201, 429]
    assert other == 201


def test_note_is_stored_forwarded_and_marked_delivered() -> None:
    client, store, fake = make()

    res = client.post("/api/notes", json={"text": "  hi, liked the lighthouse  ", "contact": "@someone"})

    assert res.status_code == 201
    assert fake.sent == [(1, "A note from the portfolio:\n\nhi, liked the lighthouse\n\nAnswer to: @someone")]
    assert store.undelivered_notes() == 0


def test_note_survives_when_telegram_is_down() -> None:
    client, store, _ = make(FakeNotifier(works=False))

    res = client.post("/api/notes", json={"text": "hello"})

    assert res.status_code == 201
    assert store.undelivered_notes() == 1
    assert client.get("/healthz").json() == {"ok": True, "undelivered_notes": 1}


@pytest.mark.parametrize(
    "body", [{"text": ""}, {"text": "   "}, {"text": "x" * 601}, {"text": "ok", "contact": "c" * 121}, {}]
)
def test_empty_or_oversized_note_is_rejected(body: dict[str, object]) -> None:
    client, _, fake = make()

    res = client.post("/api/notes", json=body)

    assert res.status_code == 422
    assert fake.sent == []


def test_bot_filling_the_hidden_field_gets_a_polite_nothing() -> None:
    client, store, fake = make()

    res = client.post("/api/notes", json={"text": "buy pills", "website": "http://spam.example"})

    assert res.status_code == 201
    assert fake.sent == []
    assert store.undelivered_notes() == 0


def test_too_many_notes_are_refused_with_a_message_that_says_what_to_do() -> None:
    client, _, fake = make(notes_per_hour=1)

    codes = [client.post("/api/notes", json={"text": "hi"}) for _ in range(2)]

    assert [c.status_code for c in codes] == [201, 429]
    assert "email" in codes[1].json()["detail"]
    assert len(fake.sent) == 1


def test_control_characters_are_stripped_from_notes() -> None:
    client, _, fake = make()

    client.post("/api/notes", json={"text": "line one\nline\x00 two\x1b[31m"})

    assert fake.sent[0][1].endswith("line one\nline two[31m")


def test_oversized_body_is_refused_before_parsing() -> None:
    client, _, _ = make()

    res = client.post("/api/notes", content=b"x" * 5000, headers={"content-type": "application/json"})

    assert res.status_code == 413


def test_only_the_portfolio_origin_is_allowed_by_cors() -> None:
    client, _, _ = make()

    ours = client.get("/api/lanterns", headers={"origin": ORIGIN})
    theirs = client.get("/api/lanterns", headers={"origin": "https://evil.example"})

    assert ours.headers.get("access-control-allow-origin") == ORIGIN
    assert "access-control-allow-origin" not in theirs.headers


def test_rate_limiter_forgets_hits_after_the_window() -> None:
    now = [0.0]
    limiter = RateLimiter(limit=1, window_s=10, clock=lambda: now[0])

    first, second = limiter.allow("a"), limiter.allow("a")
    now[0] = 10.0
    third = limiter.allow("a")

    assert (first, second, third) == (True, False, True)
