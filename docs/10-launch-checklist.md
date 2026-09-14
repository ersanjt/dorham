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

- Delete orange/grey **A** records for `@` / `www` / `api` that point at the VPS (`92.205.182.99`). Those hit **Xray on :443** and cause **`NET::ERR_CERT_COMMON_NAME_INVALID`** on apex.
- Keep `vpn.dorham.app` as DNS-only **A** → VPS for Vira.
- Prove: `https://dorham.app` and `https://api.dorham.app/v1/health` work. Helper: `powershell -File scripts/verify-public.ps1`.
- Until apex is fixed, invite only with **`https://www.dorham.app`**.

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
2. Promote hosts/mods: `/admin/users` → search member → set role (HOST / MODERATOR / ADMIN).
3. Review venues: `/admin` → انتشار.
4. Review handwritten verification: `/admin/verify`.
5. Triage reports: `/admin`.

## Product surfaces ready

- Web: landing, events, RSVP, door QR, feed, venues, account, legal, get-app
- API: auth + email verify + password reset, events CRUD cancel, venues pending, admin reports/roles
- Mobile: points at `https://api.dorham.app` (EAS when ready)

## Venue visits (not a live grid)

Guests can request presence at a place; **only the venue owner** (or QR door link) verifies it. Verified visits appear on `/account` and public profiles. This is historical trust — not a live “who is at this cafe” disco map (see north star).

## Venue UGC + hang plans

- Reviews and community photos go **PENDING** until moderator/admin publishes them (`/admin`).
- Venue facts (address, hours, cover) stay staff-controlled; members submit new places unpublished.
- **Hang plans** (“I’ll be there Thu 13:00 for lunch”) are future opt-in slots others can see and join — still not live GPS presence.

Dating tab, Boost, swipe decks, Iran market, Iyzico, store listing until first real Friday.
**Not a global launch product in v1** — Istanbul soft-launch first; city expansion only after events fill.
