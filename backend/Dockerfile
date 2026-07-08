# Racecraft backend (FastAPI) — production image.
# Build context is the backend/ directory (see render.yaml / docs/DEPLOYMENT.md).
FROM python:3.11-slim

# libgomp1 is required at runtime by XGBoost's OpenMP.
# (psycopg[binary] bundles libpq, so no extra Postgres system libs are needed.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Application code (exclusions in .dockerignore).
COPY . .

# Cloud hosts inject the listening port via $PORT; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000

# Bind to all interfaces on the host-assigned port.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
