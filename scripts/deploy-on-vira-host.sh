#!/usr/bin/env bash
# Dorham production bootstrap on the Vira host (alongside /opt/vira).
# Does NOT bind port 443 (owned by Xray). Use Cloudflare Tunnel for public HTTPS.
set -euo pipefail

DORHAM_DIR="${DORHAM_DIR:-/home/virapanel/dorham}"
REPO_URL="${REPO_URL:-https://github.com/ersanjt/dorham.git}"
WEB_PORT="${WEB_PORT:-3000}"
API_PORT="${API_PORT:-4000}"

echo "==> Dorham dir: $DORHAM_DIR"

if [[ ! -d "$DORHAM_DIR/.git" ]]; then
  if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    echo "Set GITHUB_TOKEN (PAT with repo scope) to clone the private repo."
    exit 1
  fi
  git clone "https://${GITHUB_TOKEN}@github.com/ersanjt/dorham.git" "$DORHAM_DIR"
fi

cd "$DORHAM_DIR"
git fetch origin
git checkout main
git pull --ff-only origin main

echo "==> System packages (postgres + build tools)"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  postgresql postgresql-contrib build-essential git curl

echo "==> Ensure Postgres role + database"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='dorham'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER dorham WITH PASSWORD 'dorham_change_me';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='dorham'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE dorham OWNER dorham;"
sudo -u postgres psql -c "ALTER USER dorham WITH PASSWORD 'dorham_change_me';" >/dev/null
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dorham TO dorham;" >/dev/null

echo "==> npm install + build"
npm install
npm run build -w @dorham/shared
npm run db:generate -w @dorham/api || npm run prisma:generate -w @dorham/api
(
  cd apps/api
  npx prisma migrate deploy
  npx tsx prisma/seed.ts
)
npm run build -w @dorham/api
npm run build -w @dorham/web

JWT_ACCESS="$(openssl rand -base64 48 | tr -d '\n')"
JWT_REFRESH="$(openssl rand -base64 48 | tr -d '\n')"

cat > apps/api/.env <<EOF
NODE_ENV=production
APP_NAME=Dorham
APP_URL=https://dorham.app
API_PUBLIC_URL=https://api.dorham.app
API_PORT=${API_PORT}
CORS_ORIGINS=https://dorham.app,https://www.dorham.app
DATABASE_URL=postgresql://dorham:dorham_change_me@127.0.0.1:5432/dorham?schema=public
REDIS_URL=
JWT_ACCESS_SECRET=${JWT_ACCESS}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
DEFAULT_CITY=istanbul
DEFAULT_COUNTRY=TR
MEDIA_DIR=/home/virapanel/dorham-media
EOF

mkdir -p /home/virapanel/dorham-media

cat > apps/web/.env.production.local <<EOF
NEXT_PUBLIC_API_URL=https://api.dorham.app
NEXT_PUBLIC_APP_URL=https://dorham.app
EOF

echo "==> systemd units"
sudo tee /etc/systemd/system/dorham-api.service >/dev/null <<EOF
[Unit]
Description=Dorham API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=virapanel
WorkingDirectory=${DORHAM_DIR}/apps/api
Environment=NODE_ENV=production
EnvironmentFile=${DORHAM_DIR}/apps/api/.env
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/dorham-web.service >/dev/null <<EOF
[Unit]
Description=Dorham Web
After=network.target dorham-api.service

[Service]
Type=simple
User=virapanel
WorkingDirectory=${DORHAM_DIR}/apps/web
Environment=NODE_ENV=production
Environment=PORT=${WEB_PORT}
Environment=NEXT_PUBLIC_API_URL=https://api.dorham.app
Environment=NEXT_PUBLIC_APP_URL=https://dorham.app
ExecStart=/usr/bin/npm run start -w @dorham/web -- -p ${WEB_PORT} -H 127.0.0.1
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now postgresql
sudo systemctl enable --now dorham-api
sudo systemctl enable --now dorham-web

sleep 2
curl -fsS "http://127.0.0.1:${API_PORT}/v1/health" || curl -fsS "http://127.0.0.1:${API_PORT}/v1/" || true
curl -fsSI "http://127.0.0.1:${WEB_PORT}/" | head -5 || true

echo
echo "API/web are local-only. Next: Cloudflare Tunnel (do NOT touch Xray :443)."
echo "  cloudflared tunnel login"
echo "  cloudflared tunnel create dorham"
echo "  cloudflared tunnel route dns dorham dorham.app"
echo "  cloudflared tunnel route dns dorham api.dorham.app"
echo "Then point tunnel ingress to 127.0.0.1:${WEB_PORT} and 127.0.0.1:${API_PORT}."
echo "See docs/09-deploy-cloudflare.md"
