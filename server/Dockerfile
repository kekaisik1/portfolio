FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /bin/uv
WORKDIR /srv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY app ./app
# mount a volume at /data so the lanterns survive a redeploy
ENV DATABASE_PATH=/data/portfolio.db
CMD ["sh", "-c", "exec uv run --no-dev uvicorn app.main:app_from_env --factory --host 0.0.0.0 --port ${PORT:-8787}"]
