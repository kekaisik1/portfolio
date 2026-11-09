# Portfolio API

The small backend behind the portfolio. Two things:

- **Lanterns** — a lantern lit on the night beach is saved here, so the next visitor sees it in the sky, with a count.
- **Notes** — "or leave a note" on the last screen stores the note and forwards it to Kaisar's Telegram.

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
| `GET /healthz` | `{ok, undelivered_notes}` |

Visitors' addresses are used only for the rate limit, hashed, in memory. Nothing about a visitor is written to the database.

## Deploy on Railway

1. New project → deploy from the `portfolio` GitHub repo, **root directory `server`** (it builds from the Dockerfile).
2. Add a **volume** mounted at `/data`. Without it the lanterns reset on every deploy.
3. Variables (see `.env.example`):
   - `ALLOWED_ORIGINS=https://kekaisik1.github.io`
   - `TELEGRAM_BOT_TOKEN` — make a bot with @BotFather, paste its token.
   - `TELEGRAM_CHAT_ID` — send the bot any message, then open `https://api.telegram.org/bot<token>/getUpdates` and copy `message.chat.id`.
4. Generate a public domain for the service, then put it in `index.html`:
   `<meta name="portfolio-api" content="https://<your-service>.up.railway.app">` and push.

Until the two Telegram variables are set, notes are stored but not forwarded; `/healthz` shows how many are waiting.
To read stored notes: `sqlite3 /data/portfolio.db "select created_at, text, contact from notes"`.
