#!/usr/bin/env bash
#
# CivicNet VPS deploy — builds and (re)starts the whole stack with Docker Compose:
#   postgres:16 + Django/Gunicorn backend + nginx SPA frontend (proxies /api).
#
# Usage (on the VPS, from the repo root):
#   cp .env.vps.example .env.vps   # then fill in secrets / domain
#   ./deploy.sh                    # first deploy
#   ./deploy.sh                    # every later deploy (rebuilds + migrates)
#
# Optional extras:
#   ./deploy.sh --createsuperuser  # also create/repair the admin account
#   ./deploy.sh --seed             # also load demo data (dev/demo only)
#
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=".env.vps"

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "missing required command: $1" >&2; exit 1; }
}
need docker

# --- secrets: generate once, reuse afterwards -------------------------------
if [ ! -f "$ENV_FILE" ]; then
  echo "creating $ENV_FILE with generated secrets — edit it before going public"
  POSTGRES_PASSWORD="$(openssl rand -hex 24 2>/dev/null || date +%s%N)"
  SECRET_KEY="$(openssl rand -hex 48 2>/dev/null || date +%s%N)"
  {
    echo "# CivicNet VPS secrets (NEVER commit this file)"
    echo "POSTGRES_DB=civicnet"
    echo "POSTGRES_USER=civicnet"
    echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
    echo "SECRET_KEY=$SECRET_KEY"
    echo ""
    echo "# Public origin of the site (domain or http://VPS-IP). Used for"
    echo "# Django host/CSRF checks. Comma-separated if several."
    echo "ALLOWED_HOSTS=localhost,127.0.0.1"
    echo "CSRF_TRUSTED_ORIGINS=http://localhost"
    echo "CORS_ALLOWED_ORIGINS="
    echo ""
    echo "# Same-origin API via nginx proxy; keep /api unless you split hosts."
    echo "VITE_API_URL=/api"
    echo "VITE_GOOGLE_CLIENT_ID="
    echo "GOOGLE_CLIENT_ID="
    echo ""
    echo "# Host port for the site."
    echo "HTTP_PORT=80"
    echo "# Set True only when TLS terminates in front (nginx-proxy, Caddy...)."
    echo "SECURE_SSL_REDIRECT=False"
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set in $ENV_FILE}"
: "${SECRET_KEY:?SECRET_KEY must be set in $ENV_FILE}"

echo "==> building images"
docker compose --env-file "$ENV_FILE" build

echo "==> starting database"
docker compose --env-file "$ENV_FILE" up -d db
docker compose --env-file "$ENV_FILE" up -d backend frontend

echo "==> running migrations"
docker compose --env-file "$ENV_FILE" run --rm backend python manage.py migrate --noinput

if [ "${1:-}" = "--createsuperuser" ]; then
  echo "==> creating superuser (prompts for details)"
  docker compose --env-file "$ENV_FILE" run --rm backend python manage.py createsuperuser
fi

if [ "${1:-}" = "--seed" ]; then
  echo "==> loading demo data"
  docker compose --env-file "$ENV_FILE" run --rm backend python manage.py populate_sample_data || true
fi

echo "==> health check"
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:${HTTP_PORT:-80}/healthz/" >/dev/null 2>&1; then
    echo "backend is healthy"
    break
  fi
  sleep 2
done
curl -fsS "http://localhost:${HTTP_PORT:-80}/healthz/" || {
  echo "health check FAILED — showing backend logs:" >&2
  docker compose --env-file "$ENV_FILE" logs --tail=50 backend >&2
  exit 1
}

echo "==> done. Site: http://localhost:${HTTP_PORT:-80}/  Admin: http://localhost:${HTTP_PORT:-80}/admin/"
docker compose --env-file "$ENV_FILE" ps
