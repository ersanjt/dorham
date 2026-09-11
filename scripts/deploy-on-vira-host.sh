#!/usr/bin/env bash
# Dorham production bootstrap on the Vira host (alongside /opt/vira).
# Does NOT bind port 443 (owned by Xray). Use Cloudflare Tunnel for public HTTPS.
set -euo pipefail

DORHAM_DIR="${DORHAM_DIR:-/home/virapanel/dorham}"
WEB_PORT="${WEB_PORT:-3000}"
API_PORT="${API_PORT:-4000}"
DB_PASS="${DB_PASS:-dorham_change_me}"

echo "==> Dorham dir: $DORHAM_DIR"

if [[ ! -d "$DORHAM_DIR/.git" ]]; then
  git clone https://github.com/ersanjt/dorham.git "$DORHAM_DIR"
fi

cd "$DORHAM_DIR"
git fetch origin
git checkout main
git pull --ff-only origin main || true

echo "==> System packages"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  postgresql postgresql-contrib redis-server build-essential git curl openssl

echo "==> Postgres role + database"
sudo systemctl enable --now postgresql redis-server
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='dorham'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER dorham WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='dorham'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE dorham OWNER dorham;"
sudo -u postgres psql -c "ALTER USER dorham WITH PASSWORD '${DB_PASS}';" >/dev/null
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dorham TO dorham;" >/dev/null
sudo -u postgres psql -d dorham -c "GRANT ALL ON SCHEMA public TO dorham;" >/dev/null || true

mkdir -p /home/virapanel/dorham-media

if [[ ! -f apps/api/.env ]]; then
  JWT_ACCESS="$(openssl rand -base64 48 | tr -d '\n')"
  JWT_REFRESH="$(openssl rand -base64 48 | tr -d '\n')"
  cat > apps/api/.env <<EOF
NODE_ENV=production
APP_NAME=Dorham
APP_URL=https://dorham.app
API_PUBLIC_URL=https://api.dorham.app
API_PORT=${API_PORT}
CORS_ORIGINS=https://dorham.app,https://www.dorham.app
DATABASE_URL=postgresql://dorham:${DB_PASS}@127.0.0.1:5432/dorham?schema=public
REDIS_URL=redis://127.0.0.1:6379
JWT_ACCESS_SECRET=${JWT_ACCESS}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
DEFAULT_CITY=istanbul
DEFAULT_COUNTRY=TR
MEDIA_DIR=/home/virapanel/dorham-media
EOF
else
  echo "==> Keeping existing apps/api/.env"
fi

cat > apps/web/.env.production.local <<EOF
NEXT_PUBLIC_API_URL=https://api.dorham.app
NEXT_PUBLIC_APP_URL=https://dorham.app
EOF

# shellcheck disable=SC1091
set -a
source apps/api/.env
set +a

echo "==> npm install + build"
npm install
npm run build -w @dorham/shared
npm run prisma:generate -w @dorham/api

(
  cd apps/api
  export DATABASE_URL
  npx prisma migrate deploy
  npx tsx prisma/seed.ts
)

npm run build -w @dorham/api
npm run build -w @dorham/web

API_ENTRY="dist/main.js"
if [[ ! -f apps/api/$API_ENTRY ]]; then
  if [[ -f apps/api/dist/src/main.js ]]; then
    API_ENTRY="dist/src/main.js"
  else
    echo "API build output not found"; ls -la apps/api/dist || true; exit 1
  fi
fi

echo "==> systemd units (API entry: $API_ENTRY)"
sudo tee /etc/systemd/system/dorham-api.service >/dev/null <<EOF
[Unit]
Description=Dorham API
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service

[Service]
Type=simple
User=virapanel
WorkingDirectory=${DORHAM_DIR}/apps/api
Environment=NODE_ENV=production
EnvironmentFile=${DORHAM_DIR}/apps/api/.env
ExecStart=/usr/bin/node ${API_ENTRY}
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
WorkingDirectory=${DORHAM_DIR}
Environment=NODE_ENV=production
Environment=PORT=${WEB_PORT}
Environment=HOSTNAME=127.0.0.1
Environment=NEXT_PUBLIC_API_URL=https://api.dorham.app
Environment=NEXT_PUBLIC_APP_URL=https://dorham.app
ExecStart=/usr/bin/npm run start -w @dorham/web -- -H 127.0.0.1 -p ${WEB_PORT}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now postgresql redis-server
sudo systemctl restart dorham-api
sudo systemctl enable dorham-api
sudo systemctl restart dorham-web
sudo systemctl enable dorham-web

sleep 3
systemctl --no-pager --full status dorham-api | head -20 || true
systemctl --no-pager --full status dorham-web | head -20 || true
curl -fsS "http://127.0.0.1:${API_PORT}/v1/health" && echo || true
curl -fsSI "http://127.0.0.1:${WEB_PORT}/" | head -8 || true

echo
echo "Local OK next: Cloudflare Tunnel (leave Xray on :443 alone)."
echo "  See docs/09-deploy-cloudflare.md"
