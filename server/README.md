# Portfolio API

The small backend behind the portfolio. Two things:

- **Lanterns** — a lantern lit on the night beach is saved here, so the next visitor sees it in the sky, with a count.
- **Notes** — "or leave a note" on the last screen stores the note and forwards it to Kaisar's Telegram.
- **Weather** — what the sky is doing in Astana right now (from Open-Meteo, asked at most every 15 minutes). When it snows or rains there, it snows or rains in the drawing, and a pencilled line says so.
- **Now** — "last seen working on …", set automatically by a Claude Code hook (see below).

The page works without it: with no API address set (or the API down) lanterns stay in the visitor's own browser and the note button is not shown.

## Run it

```bash
uv run uvicorn app.main:app_from_env --factory --port 8787
```

Then serve the site from the repo root (`python3 -m http.server 4173`). On `localhost` the page looks for the API at `http://localhost:8787` by itself.

```bash
uv run pytest && uv run ruff check . && uv run mypy app
```

## Endpoints

| | |
|---|---|
| `GET /api/lanterns` | `{count, lanterns: [{x, y, s}]}` — the total and the newest 80 |
| `POST /api/lanterns` | `{x, y, s}` (0..1) → `{count}`. 6 an hour per visitor |
| `POST /api/notes` | `{text, contact?}` → `{ok}`. Up to 600 characters, 3 an hour per visitor, 60 a day in total |
| `GET /api/today` | `{weather: {place, temp, kind, day}, now: {label, at}}` — either can be `null` |
| `POST /api/now` | `{label}` with `Authorization: Bearer <NOW_TOKEN>`. Off (404) until `NOW_TOKEN` is set |
| `GET /healthz` | `{ok, undelivered_notes}` |

Visitors' addresses are used only for the rate limit, hashed, in memory. Nothing about a visitor is written to the database.

## Deploy on Railway

1. New project → deploy from the `portfolio` GitHub repo, **root directory `server`** (it builds from the Dockerfile).
2. Add a **volume** mounted at `/data`. Without it the lanterns reset on every deploy.
3. Variables (see `.env.example`):
   - `ALLOWED_ORIGINS=https://kekaisik1.github.io`
   - `TELEGRAM_BOT_TOKEN` — make a bot with @BotFather, paste its token.
   - `TELEGRAM_CHAT_ID` — send the bot any message, then open `https://api.telegram.org/bot<token>/getUpdates` and copy `message.chat.id`.
   - `NOW_TOKEN` — a long random string (`openssl rand -hex 24`), only needed for the "now" line.
4. Generate a public domain for the service, then put it in `index.html`:
   `<meta name="portfolio-api" content="https://<your-service>.up.railway.app">` and push.

Until the two Telegram variables are set, notes are stored but not forwarded; `/healthz` shows how many are waiting.
To read stored notes: `sqlite3 /data/portfolio.db "select created_at, text, contact from notes"`.

## Weather

Nothing to set up: it is on as soon as the API is. To see snow or rain on a clear day, open the page with `?weather=snow` or `?weather=rain`. Another city: `WEATHER_PLACE`, `WEATHER_LAT`, `WEATHER_LON`.

## The "now" line and the Claude hook

`tools/claude_now_hook.py` (installed as `~/.claude/hooks/portfolio_now.py`, run on every Claude Code `SessionStart`) looks at the folder the session started in. If that folder is listed in `~/.claude/portfolio-now.json`, its public label becomes the "last seen working on …" line. Only labels from that list are sent; folders that are not listed send nothing. The page hides the line once it is two weeks old.

It starts in **observe** mode: nothing is sent, and `~/.claude/portfolio-now.log` records what it would have sent. To go live after reading that log:

1. Deploy the API with `NOW_TOKEN` set.
2. Save the same string: `echo '<token>' > ~/.claude/portfolio-now.token && chmod 600 ~/.claude/portfolio-now.token`
3. In `~/.claude/portfolio-now.json` set `"api"` to the service address and `"mode"` to `"live"`.

To stop it, set `"mode"` back to `"observe"`, or remove the `SessionStart` entry from `~/.claude/settings.json`.
