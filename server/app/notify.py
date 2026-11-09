"""Getting a visitor's note to Kaisar."""

from __future__ import annotations

import logging
from typing import Protocol

import httpx

log = logging.getLogger(__name__)


class Notifier(Protocol):
    """Something that can deliver a note."""

    def send(self, note_id: int, text: str) -> bool:
        """Deliver the note; True if it arrived."""
        ...


class LogOnlyNotifier:
    """No Telegram configured: the note stays in the database and the log says one is waiting."""

    def send(self, note_id: int, text: str) -> bool:
        log.info(
            "note %s stored (%s chars); Telegram is not configured, so it was not forwarded",
            note_id,
            len(text),
        )
        return False


class TelegramNotifier:
    """Forward notes to one Telegram chat through a bot."""

    def __init__(self, token: str, chat_id: str, client: httpx.Client | None = None) -> None:
        self._url = f"https://api.telegram.org/bot{token}/sendMessage"
        self._chat_id = chat_id
        self._client = client or httpx.Client(timeout=10)

    def send(self, note_id: int, text: str) -> bool:
        # plain text, no parse_mode: whatever a visitor typed is shown as typed
        payload = {"chat_id": self._chat_id, "text": text[:4000], "disable_web_page_preview": True}
        try:
            res = self._client.post(self._url, json=payload)
        except httpx.HTTPError as exc:
            # the URL holds the bot token, so log the kind of failure and never the exception text
            log.warning(
                "note %s not forwarded: %s talking to Telegram; it is still in the database",
                note_id,
                type(exc).__name__,
            )
            return False
        if res.status_code != 200:
            log.warning(
                "note %s not forwarded: Telegram answered %s; check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID",
                note_id,
                res.status_code,
            )
            return False
        return True
