# === Build stage ===
FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt gunicorn

# === Runtime stage ===
FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/* && \
    adduser --disabled-password --gecos "" --uid 1001 appuser

WORKDIR /app

COPY --from=builder /install /usr/local
COPY . .

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENV WEB_CONCURRENCY=2

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:8080 --workers ${WEB_CONCURRENCY} --timeout 30 run:app"]
