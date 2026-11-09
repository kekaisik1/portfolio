#!/usr/bin/env python3
# ruff: noqa: E501, SIM105
"""Claude Code SessionStart hook: keep the portfolio in step with the real work.

Two things, both driven by ~/.claude/portfolio-now.json:

1. "projects" maps folders to public labels. When a Claude session starts in a listed folder, that label
   ("Emberquill", "BookForge") becomes the site's "last seen working on …" line.
2. "growth" maps folders to the site's project names. Their commits are counted (all, last 7 days, last 24
   hours) and those three numbers are sent, so each project's drawing on the site grows with the work.

Only labels and numbers from those lists are ever sent: never a path, a prompt, a commit message or anything
from the session. A folder that is not listed sends nothing, so private work stays private by default.

Modes (the "mode" key in the config):
  observe  write "would send …" to ~/.claude/portfolio-now.log and send nothing (the default)
  live     send to the API

It prints nothing and always exits 0, so it can never slow down or break a session.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HOME = Path.home() / ".claude"
CONFIG = HOME / "portfolio-now.json"
LOG = HOME / "portfolio-now.log"
STATE = HOME / "portfolio-now.state.json"
QUIET_FOR_S = 30 * 60  # the same thing is not sent again within half an hour


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


def read_state() -> dict[str, float]:
    try:
        state = json.loads(STATE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if not isinstance(state, dict):
        return {}
    return {str(k): float(v) for k, v in state.items() if isinstance(v, (int, float))}


def recently_sent(what: str, mode: str) -> bool:
    """True if this was already handled in this mode within the last half hour."""
    return time.time() - read_state().get(f"{mode}:{what}", 0.0) < QUIET_FOR_S


def remember(what: str, mode: str) -> None:
    state = {k: v for k, v in read_state().items() if time.time() - v < QUIET_FOR_S}
    state[f"{mode}:{what}"] = time.time()
    try:
        STATE.write_text(json.dumps(state), encoding="utf-8")
    except OSError:
        pass


def commits(folder: Path, since: str | None = None) -> int | None:
    """How many commits the repository in `folder` has (optionally only since e.g. "7 days ago")."""
    cmd = ["git", "-C", str(folder), "rev-list", "--count"]
    if since:
        cmd.append(f"--since={since}")
    cmd.append("HEAD")
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=3, check=False)  # noqa: S603
    except (OSError, subprocess.SubprocessError):
        return None
    text = out.stdout.strip()
    return int(text) if out.returncode == 0 and text.isdigit() else None


def measure(growth: dict[str, str]) -> list[dict[str, object]]:
    """Commit counts for every listed folder that is a git repository."""
    items: list[dict[str, object]] = []
    for folder, slug in growth.items():
        root = Path(folder).expanduser()
        total = commits(root)
        if total is None:
            continue
        week, day = commits(root, "7 days ago") or 0, commits(root, "24 hours ago") or 0
        items.append({"slug": slug, "total": total, "week": week, "day": day})
    return items


def send(api: str, token: str, path: str, body: dict[str, object]) -> str:
    """POST `body` to the API; returns a short description of what happened (never the token)."""
    req = urllib.request.Request(  # noqa: S310 - the address comes from the user's own config
        api.rstrip("/") + path,
        data=json.dumps(body).encode(),
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
    cwd = str(event.get("cwd") or os.getcwd()) if isinstance(event, dict) else os.getcwd()

    try:
        config = json.loads(CONFIG.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        log(f"skipped: cannot read {CONFIG} ({type(exc).__name__})")
        return
    if not isinstance(config, dict):
        log(f"skipped: {CONFIG} is not a JSON object")
        return

    mode = "live" if config.get("mode") == "live" else "observe"
    api, token = str(config.get("api") or ""), ""
    if mode == "live":
        token_file = config.get("token_file")
        if token_file:
            try:
                token = Path(str(token_file)).expanduser().read_text(encoding="utf-8").strip()
            except OSError:
                token = ""
        if not api.startswith(("https://", "http://localhost", "http://127.0.0.1")) or not token:
            if not recently_sent("misconfigured", mode):
                log(f'live: nothing sent: set "api" (https) and "token_file" in {CONFIG}')
                remember("misconfigured", mode)
            return

    # 1. what I'm working on: only when this session's folder is on the list
    projects = config.get("projects")
    match = (
        label_for(cwd, {str(k): str(v) for k, v in projects.items()}) if isinstance(projects, dict) else None
    )
    if match is not None and not recently_sent("now:" + match[1], mode):
        root, label = match
        if mode == "observe":
            log(f'observe: would set now to "{label}" because the session started in {root}')
        else:
            log(f'live: now "{label}" {send(api, token, "/api/now", {"label": label})}')
        remember("now:" + label, mode)

    # 2. how much each project has grown: commit counts, at most once every half hour
    growth = config.get("growth")
    if isinstance(growth, dict) and growth and not recently_sent("growth", mode):
        items = measure({str(k): str(v) for k, v in growth.items()})
        if items:
            summary = ", ".join(f"{i['slug']} {i['total']}/{i['week']}/{i['day']}" for i in items)
            if mode == "observe":
                log(f"observe: would send growth (all/week/day): {summary}")
            else:
                log(f"live: growth ({summary}) {send(api, token, '/api/growth', {'projects': items})}")
            remember("growth", mode)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - last line of defence: a hook must never break a session
        log(f"error: {type(exc).__name__}")
    sys.exit(0)
