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

## Origin IP note

If Cloudflare A records point at a VPS (e.g. `92.205.182.99`), that machine must serve HTTP(S) for the Host `dorham.app` / `api.dorham.app`. Empty VPS = orange cloud shows CF IPs in public DNS but the site will fail until nginx/Caddy + app processes are running.

## Mobile production

```powershell
cd apps\mobile
# set EXPO_PUBLIC_* to https://api.dorham.app and https://dorham.app
npx eas build --platform all --profile production
```
