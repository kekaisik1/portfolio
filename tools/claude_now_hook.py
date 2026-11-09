#!/usr/bin/env python3
# ruff: noqa: E501, SIM105
"""Claude Code SessionStart hook: tell the portfolio what Kaisar is working on.

When a Claude session starts in a folder that is on the list in ~/.claude/portfolio-now.json, the folder's
public label ("Emberquill", "BookForge") becomes the site's "last seen working on …" line.

Only labels from that list are ever sent: never a path, a prompt or anything from the session. A folder that
is not on the list sends nothing, so private work stays private by default.

Modes (the "mode" key in the config):
  observe  write "would set …" to ~/.claude/portfolio-now.log and send nothing (the default)
  live     send the label to the API

It prints nothing and always exits 0, so it can never slow down or break a session.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HOME = Path.home() / ".claude"
CONFIG = HOME / "portfolio-now.json"
LOG = HOME / "portfolio-now.log"
STATE = HOME / "portfolio-now.state.json"
QUIET_FOR_S = 30 * 60  # the same label is not sent again within half an hour


def log(line: str) -> None:
    """Append one dated line to the log, keeping it from growing without end."""
    stamp = time.strftime("%Y-%m-%dT%H:%M:%S%z")
    try:
        if LOG.exists() and LOG.stat().st_size > 200_000:
            LOG.write_text(
                "".join(LOG.read_text(encoding="utf-8").splitlines(keepends=True)[-400:]), encoding="utf-8"
            )
        with LOG.open("a", encoding="utf-8") as f:
            f.write(f"{stamp} {line}\n")
    except OSError:
        pass  # a hook must never fail a session over its own log


def label_for(cwd: str, projects: dict[str, str]) -> tuple[str, str] | None:
    """The public label for `cwd`: the longest listed folder that contains it (worktrees and subfolders count)."""
    here = Path(cwd).expanduser().resolve()
    best: tuple[str, str] | None = None
    for folder, label in projects.items():
        root = Path(folder).expanduser().resolve()
        if (here == root or root in here.parents) and (best is None or len(str(root)) > len(best[0])):
            best = (str(root), label)
    return best


def recently_sent(label: str, mode: str) -> bool:
    """True if this label was already handled in this mode a moment ago."""
    try:
        state = json.loads(STATE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    return (
        state.get("label") == label
        and state.get("mode") == mode
        and time.time() - float(state.get("at", 0)) < QUIET_FOR_S
    )


def remember(label: str, mode: str) -> None:
    try:
        STATE.write_text(json.dumps({"label": label, "mode": mode, "at": time.time()}), encoding="utf-8")
    except OSError:
        pass


def send(api: str, token: str, label: str) -> str:
    """POST the label; returns a short description of what happened (never the token)."""
    req = urllib.request.Request(  # noqa: S310 - the address comes from the user's own config
        api.rstrip("/") + "/api/now",
        data=json.dumps({"label": label}).encode(),
        headers={"content-type": "application/json", "authorization": f"Bearer {token}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as res:  # noqa: S310
            return f"sent (HTTP {res.status})"
    except urllib.error.HTTPError as exc:
        return (
            f"not sent: the API answered {exc.code}; check the token and that NOW_TOKEN is set on the server"
        )
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return f"not sent: {type(exc).__name__}; is the API address right and the service up?"


def main() -> None:
    try:
        event = json.load(sys.stdin)
    except ValueError:
        event = {}
    cwd = str(event.get("cwd") or os.getcwd())

    try:
        config = json.loads(CONFIG.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        log(f"skipped: cannot read {CONFIG} ({type(exc).__name__})")
        return
    projects = config.get("projects")
    if not isinstance(projects, dict):
        log(f'skipped: {CONFIG} has no "projects" list')
        return

    match = label_for(cwd, {str(k): str(v) for k, v in projects.items()})
    if match is None:
        return  # not a listed folder: say nothing, log nothing
    root, label = match
    mode = "live" if config.get("mode") == "live" else "observe"
    if recently_sent(label, mode):
        return

    if mode == "observe":
        log(f'observe: would set now to "{label}" because the session started in {root}')
    else:
        api = str(config.get("api") or "")
        token = ""
        token_file = config.get("token_file")
        if token_file:
            try:
                token = Path(str(token_file)).expanduser().read_text(encoding="utf-8").strip()
            except OSError:
                token = ""
        if not api.startswith(("https://", "http://localhost", "http://127.0.0.1")) or not token:
            log(f'live: not sent "{label}": set "api" (https) and "token_file" in {CONFIG}')
            return
        log(f'live: "{label}" {send(api, token, label)}')
    remember(label, mode)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - last line of defence: a hook must never break a session
        log(f"error: {type(exc).__name__}")
    sys.exit(0)
