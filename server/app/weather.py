"""What the weather is doing where Kaisar is, so the drawing can do the same."""

from __future__ import annotations

import logging
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass

import httpx

log = logging.getLogger(__name__)

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"

# WMO weather codes, folded into the few things the drawing can show
SNOW = {71, 73, 75, 77, 85, 86}
RAIN = {51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99}
FOG = {45, 48}
CLOUD = {2, 3}


@dataclass(frozen=True)
class WeatherNow:
    """The weather, reduced to what the page uses."""

    place: str
    temp: int
    kind: str  # snow | rain | fog | cloud | clear
    day: bool


def kind_for(code: int) -> str:
    """Fold a WMO weather code into snow, rain, fog, cloud or clear."""
    if code in SNOW:
        return "snow"
    if code in RAIN:
        return "rain"
    if code in FOG:
        return "fog"
    if code in CLOUD:
        return "cloud"
    return "clear"


def fetch_open_meteo(lat: float, lon: float) -> dict[str, object]:
    """Ask Open-Meteo (free, no key) for the current conditions."""
    params: dict[str, str | float] = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,weather_code,is_day",
    }
    res = httpx.get(OPEN_METEO, params=params, timeout=6)
    res.raise_for_status()
    data = res.json()
    if not isinstance(data, dict):
        raise ValueError("Open-Meteo answered with something that is not an object")
    return data


class Weather:
    """Current weather, asked for at most once every `ttl_s`. A failed refresh keeps the last answer."""

    def __init__(
        self,
        place: str,
        fetch: Callable[[], dict[str, object]],
        ttl_s: float = 900,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._place = place
        self._fetch = fetch
        self._ttl = ttl_s
        self._clock = clock
        self._lock = threading.Lock()
        self._value: WeatherNow | None = None
        self._asked_at: float | None = None

    def current(self) -> WeatherNow | None:
        """The weather now, or None if it has never been fetched successfully."""
        with self._lock:
            now = self._clock()
            if self._asked_at is not None and now - self._asked_at < self._ttl:
                return self._value
            self._asked_at = now
            try:
                cur = self._fetch()["current"]
                if not isinstance(cur, dict):
                    raise ValueError("no 'current' block")
                self._value = WeatherNow(
                    place=self._place,
                    temp=round(float(cur["temperature_2m"])),
                    kind=kind_for(int(cur["weather_code"])),
                    day=bool(cur["is_day"]),
                )
            except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
                log.warning("weather not refreshed (%s); showing the last known weather", type(exc).__name__)
            return self._value
