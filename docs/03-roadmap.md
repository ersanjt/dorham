# 03 — Roadmap

We do not skip phases. Dating before events is how this dies.

## Phase 0 — Foundation (this repo)

- Monorepo, docs, CI for GitHub + GitLab
- API: health, auth, me, events
- Web: landing + legal stubs
- Mobile: shell + auth screens
- Docker: Postgres + Redis

**Exit:** `npm run build` for api + web, API `/v1/health` returns ok.

## Phase 1 — Identity

- Email verify (token hashed, 24h; local register returns the token)
- Profile photos via signed upload (local disk now, R2 later)
- Handwritten verification queue (`/admin/verify` for moderator/admin)
- Pause / delete account
- Block / report

**Exit:** a user can be `verified` and appear on an event guest list. **Done in software.**

## Phase 2 — Istanbul events

- Create event (host role) — API + `/events/new`
- Public event page on web — `/events/:id`
- RSVP, capacity, waitlist
- Check-in QR — host door page + guest scan + host manual check-in
- Founder-hosted weekly event — seed event exists; real venue still the founder’s job

**Exit:** 4 real events, not simulated.

## Phase 3 — City feed

- Posts from hosts and verified members
- Comments, report
- No infinite dating cards

**Exit:** people open the app on weekdays, not only Fridays. **Software is in:** `/feed`, `/v1/feed`. Real weekday habit is still the founder’s job.

## Phase 4 — Dating tab (optional)

Only if phase 2–3 work and women ask.

- Opt-in `datingEnabled`
- Small daily intro list (not a deck of 500)
- Mutual consent chat
- Still no Boost

## Phase 5 — Money (**software done**; cash at the door until Iyzico)

- Event tickets: `priceTry` on the event, pay **cash at the door**. Check-in marks the ticket paid. Iyzico / store billing later.
- Verification fee: copy and target price live; still free until a payment rail exists.
- Venue listings: any signed-in user can submit a place with a **required Google Maps URL**, price range, and menu notes. People leave experience notes on the place.
- Public profiles (no email) so a guest list is a city, not a swipe deck.

**Exit still IRL:** first paid Friday, cash collected, guest list used at the door.

**Not in this phase:** matching, likes, live “who is at this cafe today”, disco dating grids.

## Explicit backlog (not now)

- Ankara / Izmir
- Live video rooms
- Iran payments
- Admin console app (use Prisma Studio + SQL until phase 2)
- Microservices
- Machine-learning match
