# 10 — Soft-launch checklist (Istanbul v1)

Product is **community first**. Dating stays off. Soft-launch = real people can register, verify email, RSVP to a real Friday, and find Iranian venues.

## Same-origin web API (recommended)

The website should call `/v1/*` on `www.dorham.app`. Next.js rewrites those to `http://127.0.0.1:4000`. That way login works even if `api.dorham.app` is still mis-pointed at Xray.

Keep a tunnel hostname for `api.dorham.app` for mobile / Expo.

## Cloudflare Tunnel (must work before inviting anyone)

| Public hostname | Origin |
| --- | --- |
| `dorham.app` | `http://127.0.0.1:3000` |
| `www.dorham.app` | `http://127.0.0.1:3000` |
| `api.dorham.app` | `http://127.0.0.1:4000` |

- Delete orange/grey **A** records for `@` / `www` / `api` that point at the VPS (`92.205.182.99`). Those hit **Xray on :443**.
- Keep `vpn.dorham.app` as DNS-only **A** → VPS for Vira.
- Prove: `https://api.dorham.app/v1/health` returns JSON, not «Invalid URL».

## Server env

In `apps/api/.env` on the VPS:

```env
APP_URL=https://dorham.app
API_PUBLIC_URL=https://api.dorham.app
API_HOST=127.0.0.1
CORS_ORIGINS=https://dorham.app,https://www.dorham.app
RESEND_API_KEY=re_xxx
MAIL_FROM=Dorham <noreply@dorham.app>
```

Then rebuild/restart:

```bash
cd /home/virapanel/dorham
git pull
bash scripts/deploy-on-vira-host.sh
# or: npm run build -w @dorham/shared && npm run build -w @dorham/api && npm run build -w @dorham/web
sudo systemctl restart dorham-api dorham-web
```

Rotate seed password `DorhamHost1` after first login.

## Founder ops (not automatable)

1. Log in as admin → `/events/new` → publish first real Istanbul gathering.
2. Promote other hosts: `/admin` → شناسه کاربر → میزبان.
3. Review venues: `/admin` → انتشار.
4. Review handwritten verification: `/admin/verify`.
5. Triage reports: `/admin`.

## Product surfaces ready

- Web: landing, events, RSVP, door QR, feed, venues, account, legal, get-app
- API: auth + email verify + password reset, events CRUD cancel, venues pending, admin reports/roles
- Mobile: points at `https://api.dorham.app` (EAS when ready)

## Venue visits (not a live grid)

Guests can request presence at a place; **only the venue owner** (or QR door link) verifies it. Verified visits appear on `/account` and public profiles. This is historical trust — not a live “who is at this cafe” disco map (see north star).

Dating tab, Boost, swipe decks, Iran market, Iyzico, store listing until first real Friday.
