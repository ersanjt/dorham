#!/usr/bin/env bash
# Update an existing Dorham VPS from origin/main.
# Does not create the database, does not change the database password, and does not overwrite apps/api/.env.
set -euo pipefail

DORHAM_DIR="${DORHAM_DIR:-/home/virapanel/dorham}"
WEB_PORT="${WEB_PORT:-3000}"
API_PORT="${API_PORT:-4000}"

cd "$DORHAM_DIR"
git fetch origin main
git checkout main
git pull --ff-only origin main

export PATH="/usr/local/bin:/usr/bin:${PATH}"

npm install
npm run build -w @dorham/shared
npm run prisma:generate -w @dorham/api

set -a
# shellcheck disable=SC1091
source apps/api/.env
set +a

(
  cd apps/api
  npx prisma migrate deploy
)

npm run build -w @dorham/api
npm run build -w @dorham/web

sudo -n systemctl restart dorham-api
sudo -n systemctl restart dorham-web

sleep 3
curl -fsS "http://127.0.0.1:${API_PORT}/v1/health"
echo
curl -fsS -o /dev/null -w "web %{http_code}\n" "http://127.0.0.1:${WEB_PORT}/"
