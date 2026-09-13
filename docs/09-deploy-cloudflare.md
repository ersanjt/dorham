# 09 — Deploy dorham.app (Cloudflare)

Canonical domain: **dorham.app** (see `06-naming.md`).

## Cloudflare checklist

1. At the **registrar**, set nameservers to the two Cloudflare NS shown on Overview (zone stays *Pending* until this is done).
2. DNS records (once active):

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| A / CNAME | `@` | Origin or Pages target | Proxied |
| CNAME | `www` | `dorham.app` or Pages | Proxied |
| CNAME | `api` | API host (Fly/Railway/VPS) | Proxied or DNS-only |

3. SSL/TLS mode: **Full (strict)** after origin has a real certificate; until then **Full**.
4. Optional later: MX + SPF/DKIM/DMARC for `host@dorham.app` mail.

## Recommended v1 hosting split

| Surface | Host | Public URL |
| --- | --- | --- |
| Website (Next.js) | Cloudflare Pages or Vercel | `https://dorham.app` |
| API (NestJS) | VPS / Railway / Fly | `https://api.dorham.app` |
| Mobile | Expo EAS → stores | deep links → `https://dorham.app` |

Do **not** invent events on the server seed. Seed = real venues + admin tooling account only.

## Env (production)

```env
APP_URL=https://dorham.app
API_PUBLIC_URL=https://api.dorham.app
CORS_ORIGINS=https://dorham.app,https://www.dorham.app
NEXT_PUBLIC_API_URL=https://api.dorham.app
NEXT_PUBLIC_APP_URL=https://dorham.app
EXPO_PUBLIC_API_URL=https://api.dorham.app
EXPO_PUBLIC_WEB_URL=https://dorham.app
```

## Same VPS as Vira VPN (important)

On `92.205.182.99`, **port 443 is owned by Xray** (`vira.service`). Proxied Cloudflare `A` records to that IP send HTTPS to Xray → `Invalid URL` / AkamaiGHost / **`NET::ERR_CERT_COMMON_NAME_INVALID`**.

### Fix apex `dorham.app` cert error (do this in Cloudflare DNS)

Symptom: Chrome shows «Your connection is not private» on `https://dorham.app` while `https://www.dorham.app` works.

Cause (live check): `@` resolves to **`92.205.182.99`** (VPS). `www` resolves to **Cloudflare** (`104.21…` / `172.67…`).

1. Cloudflare → zone **dorham.app** → **DNS**.
2. Delete (or turn off proxy then delete) any **A** / **AAAA** for `@` / `dorham.app` that points to `92.205.182.99`.
3. Cloudflare → **Zero Trust** → **Networks** → **Tunnels** → your dorham tunnel → **Public Hostname**:
   - `dorham.app` → `http://127.0.0.1:3000`
   - `www.dorham.app` → `http://127.0.0.1:3000`
   - `api.dorham.app` → `http://127.0.0.1:4000`
4. Saving a Public Hostname usually creates the right **CNAME** to `*.cfargotunnel.com` (proxied). Do **not** recreate an A to the VPS for web/api.
5. Keep **`vpn.dorham.app`** as DNS-only **A** → `92.205.182.99` for Vira.
6. Prove:
   - `nslookup dorham.app` → Cloudflare IPs (not `92.205.182.99`)
   - `https://dorham.app` loads (no cert warning)
   - `https://dorham.app/v1/health` → JSON
   - `https://api.dorham.app/v1/health` → JSON

| Service | Bind | Notes |
| --- | --- | --- |
| Xray | `:443`, `:8444`, … | Do not replace |
| Vira panel | `:8787` | Keep |
| Dorham API | `127.0.0.1:4000` | systemd `dorham-api` |
| Dorham web | `127.0.0.1:3000` | systemd `dorham-web` |
| Public HTTPS | Cloudflare Tunnel | No conflict with Xray |

Bootstrap script (run as `virapanel` with `GITHUB_TOKEN` set):

```bash
curl -fsSL https://raw.githubusercontent.com/ersanjt/dorham/main/scripts/deploy-on-vira-host.sh -o /tmp/dorham-deploy.sh
# or copy from the repo after clone
bash scripts/deploy-on-vira-host.sh
```

Then install `cloudflared` and map:

- `dorham.app` → `http://127.0.0.1:3000`
- `www.dorham.app` → `http://127.0.0.1:3000`
- `api.dorham.app` → `http://127.0.0.1:4000`

Remove or grey-cloud the old proxied `A` records that send web/api traffic to `:443`.

Set `RESEND_API_KEY` on the API for email verify + password reset. See `docs/10-launch-checklist.md`.

## Mobile production

```powershell
cd apps\mobile
# set EXPO_PUBLIC_* to https://api.dorham.app and https://dorham.app
npx eas build --platform all --profile production
```
