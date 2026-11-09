"""A sliding-window limiter kept in memory. Enough for one small instance; no visitor data is stored."""

from __future__ import annotations

import hashlib
import threading
import time
from collections import defaultdict, deque
from collections.abc import Callable


class RateLimiter:
    """Allow at most `limit` hits per `window_s` seconds for each key."""

    def __init__(self, limit: int, window_s: float, clock: Callable[[], float] = time.monotonic) -> None:
        self._limit = limit
        self._window = window_s
        self._clock = clock
        self._hits: defaultdict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        """Record a hit for `key` and say whether it is within the limit."""
        # the key is usually an IP address: keep only a hash of it
        digest = hashlib.sha256(key.encode()).hexdigest()[:24]
        now = self._clock()
        with self._lock:
            hits = self._hits[digest]
            while hits and now - hits[0] >= self._window:
                hits.popleft()
            if len(hits) >= self._limit:
                return False
            hits.append(now)
            if len(self._hits) > 20_000:
                self._prune(now)
            return True

    def _prune(self, now: float) -> None:
        for k in [k for k, v in self._hits.items() if not v or now - v[-1] >= self._window]:
            del self._hits[k]
