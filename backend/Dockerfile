FROM python:latest

LABEL authors="Minseok Chu"

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install uv (Package Manager)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
ENV PATH="/app/.venv/bin:${PATH}"

# Compile bytecode
ENV UV_COMPILE_BYTECODE=1

# Uv cache
ENV UV_LINK_MODE=copy

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

ENV PYTHONPATH=/app

COPY ./pyproject.toml ./uv.lock /app/
COPY ./app /app/app

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

CMD ["fastapi", "run", "--workers", "4", "app/main.py"]