# syntax=docker/dockerfile:1

# Minimal Postgres image for quick local development runs.
FROM postgres:16-alpine

# Default credentials; override via environment variables when running.
ENV POSTGRES_DB=intelligence_layers \
    POSTGRES_USER=postgres \
    POSTGRES_PASSWORD=postgres

EXPOSE 5432

CMD ["postgres"]

