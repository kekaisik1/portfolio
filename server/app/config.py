"""Settings, read once from the environment so nothing secret lives in the code."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_ORIGINS = "https://kekaisik1.github.io,http://localhost:4173,http://127.0.0.1:4173"


@dataclass(frozen=True)
class Settings:
    """Everything the API can be told from outside."""

    database_path: Path
    allowed_origins: tuple[str, ...]
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    lanterns_shown: int = 80
    lanterns_per_hour: int = 6
    lanterns_per_day_everyone: int = 2000
    notes_per_hour: int = 3
    notes_per_day_everyone: int = 60

    @classmethod
    def from_env(cls) -> Settings:
        """Build settings from environment variables, with defaults that work on a laptop."""
        origins = tuple(
            o.strip().rstrip("/")
            for o in os.environ.get("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
            if o.strip()
        )
        return cls(
            database_path=Path(os.environ.get("DATABASE_PATH", "portfolio.db")),
            allowed_origins=origins,
            telegram_bot_token=os.environ.get("TELEGRAM_BOT_TOKEN") or None,
            telegram_chat_id=os.environ.get("TELEGRAM_CHAT_ID") or None,
        )
