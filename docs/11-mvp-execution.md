# 11 — MVP execution and virtual team

This does **not** replace `docs/01-business-plan.md` (locked) or `docs/00-north-star.md`. It is the 90-day operating layer: what the Istanbul MVP is, how work is split, and what is still founder-only.

## Pitch (locked)

دورهم جایی است که ایرانی‌های یک شهر — اول استانبول — دور هم جمع می‌شوند، نه جایی که بی‌نهایت کارت سوایپ می‌کنند.

Primary customer: Iranian women and men, 22–40, living in Istanbul. Not v1: users physically in Iran.

Revenue order: cash door tickets → verification fee → cafe listing → extras. Never lock discovery. Year-1 base if Istanbul sticks: **$3k–$15k / month**. Lifestyle business. Do not raise a Tinder story.

## MVP (software vs IRL)

| Slice | Software | Still human |
| --- | --- | --- |
| Identity, verify, block/report | Done | Resend on VPS; moderator reviews handwritten photos |
| Events, RSVP, waitlist, door QR | Done | Publish a real Friday via `/events/new` |
| Feed | Done | Hosts write on weekdays |
| Venues, hang plans, visits | Done | Claim real cafes |
| Web FA/EN + public-profile safety | Done | — |
| Mobile five tabs + forgot password + visits | Done | EAS after first Friday |
| Iyzico, stores, dating tab | Out | After 4 attended events |

**Exit:** a woman can register, verify email, RSVP to a real Istanbul Friday, and find an Iranian place — without a swipe deck.

## Virtual team (lanes, not headcount)

Year-1 is one founder. Lanes are how agents and contractors attach without drifting:

| Lane | Owns | Must not |
| --- | --- | --- |
| Founder / product | Friday, women-first list, host roles | Boost, Iran market, Hornet grid |
| DevOps | `.env`, Postgres, Tunnel, systemd, `/v1/health` | Kubernetes, extra datastores |
| Web design + web | Event SEO, tea-paper UI, FA/EN chrome, safety | Login wall on Instagram event URLs |
| Mobile design + mobile | Five tabs, RTL, city homepage | Camera permissions; store submit before Friday |
| API / contracts | `/v1`, Zod, Prisma | Like/Match tables |
| Trust / optimization | Reports, verify queue, rate limits, empty states | ML matching |

## 90 days

1. **1–14:** Book venue, publish first Friday, wire Resend + Cloudflare, dry-run door QR.
2. **15–45:** Fridays 2–3, woman co-host, no ads.
3. **46–90:** Fourth Friday, cash at the door, guest list used. Only then EAS.

Milestones stay those in `docs/01-business-plan.md` (M3 / M6 / M12 / M18).

## Backlog that waits

Ankara/Izmir, live video, Iran payments, admin console app, microservices, Iyzico, App Store, dating tab.
