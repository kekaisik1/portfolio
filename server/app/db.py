"""SQLite storage: one small file, two tables."""

from __future__ import annotations

import sqlite3
import threading
from dataclasses import dataclass
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS lanterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    x REAL NOT NULL,
    y REAL NOT NULL,
    s REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    contact TEXT NOT NULL DEFAULT '',
    delivered INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE IF NOT EXISTS now (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    label TEXT NOT NULL,
    at TEXT NOT NULL
);
"""


@dataclass(frozen=True)
class Lantern:
    """Where a lantern hangs, in the page's own 0..1 coordinates."""

    x: float
    y: float
    s: float


class Store:
    """All reads and writes. One connection behind a lock: the traffic is tiny and SQLite likes one writer."""

    def __init__(self, path: Path) -> None:
        if str(path) != ":memory:":
            path.parent.mkdir(parents=True, exist_ok=True)
        self._db = sqlite3.connect(str(path), check_same_thread=False)
        self._lock = threading.Lock()
        with self._lock, self._db:
            self._db.executescript(SCHEMA)

    def add_lantern(self, lantern: Lantern) -> int:
        """Hang a lantern; returns how many there are now."""
        with self._lock, self._db:
            self._db.execute(
                "INSERT INTO lanterns (x, y, s) VALUES (?, ?, ?)", (lantern.x, lantern.y, lantern.s)
            )
            return self._count()

    def lanterns(self, limit: int) -> tuple[int, list[Lantern]]:
        """The total, and the newest `limit` lanterns (oldest of those first)."""
        with self._lock:
            rows = self._db.execute(
                "SELECT x, y, s FROM lanterns ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
            return self._count(), [Lantern(*row) for row in reversed(rows)]

    def add_note(self, text: str, contact: str) -> int:
        """Keep a note; returns its id."""
        with self._lock, self._db:
            cur = self._db.execute("INSERT INTO notes (text, contact) VALUES (?, ?)", (text, contact))
            return int(cur.lastrowid or 0)

    def mark_delivered(self, note_id: int) -> None:
        """Remember that a note reached Telegram, so undelivered ones can be found later."""
        with self._lock, self._db:
            self._db.execute("UPDATE notes SET delivered = 1 WHERE id = ?", (note_id,))

    def undelivered_notes(self) -> int:
        """How many notes are stored but never reached Telegram."""
        with self._lock:
            return int(self._db.execute("SELECT COUNT(*) FROM notes WHERE delivered = 0").fetchone()[0])

    def set_now(self, label: str) -> None:
        """Replace the one "working on" line."""
        with self._lock, self._db:
            self._db.execute(
                "INSERT INTO now (id, label, at) VALUES (1, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) "
                "ON CONFLICT(id) DO UPDATE SET label = excluded.label, at = excluded.at",
                (label,),
            )

    def get_now(self) -> tuple[str, str] | None:
        """The "working on" line and when it was set (UTC, ISO), if there is one."""
        with self._lock:
            row = self._db.execute("SELECT label, at FROM now WHERE id = 1").fetchone()
            return (str(row[0]), str(row[1])) if row else None

    def _count(self) -> int:
        return int(self._db.execute("SELECT COUNT(*) FROM lanterns").fetchone()[0])

    def close(self) -> None:
        """Close the file."""
        with self._lock:
            self._db.close()
