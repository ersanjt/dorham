# 02 — Architecture

## System map

```
                    ┌──────────────┐
   iOS / Android    │  Expo app    │
                    └──────┬───────┘
                           │ HTTPS / JSON /v1
                    ┌──────▼───────┐         ┌─────────────┐
   Browser          │  Next.js web │────────▶│  Marketing  │
   (SSR + public    │  dorham.app  │         │  event pages│
    event pages)    └──────┬───────┘         └─────────────┘
                           │
                    ┌──────▼────────┐
                    │ NestJS API    │
                    │ Fastify /v1   │
                    └───┬───────┬───┘
                        │       │
               ┌────────▼─┐  ┌──▼─────┐
               │ Postgres │  │ Redis  │
               │ Prisma   │  │ limit  │
               └──────────┘  │ session│
                             └────────┘
                        │
               ┌────────▼────────┐
               │ R2 / S3 media   │
               │ signed GET only │
               └─────────────────┘
```

## Monorepo

```
apps/api          public HTTP API + workers later
apps/web          marketing, legal, public events, later account
apps/mobile       Expo iOS + Android
packages/shared   Zod contracts, error codes, city constants
docs/             product lock — do not code against memory
infra/            compose, later k8s
```

## Why this stack

| Choice | Why |
| --- | --- |
| TypeScript everywhere | One language. Shared types. Solo founder can move across layers. |
| NestJS + Fastify | Module boundaries, guards, OpenAPI, faster than Express. |
| Zod in `@dorham/shared` | Mobile, web, and API cannot drift. |
| PostgreSQL + Prisma | Relational data (users, events, RSVP, reports). Migrations are the history. |
| Redis | Rate limit, refresh denylist, later queues. |
| Expo | One mobile codebase, RTL Persian, OTA fixes. |
| Next.js | SEO for events (people come from Instagram). |
| npm workspaces | Already on the machine. No extra package manager. |

Rejected: Flutter (second language), Mongo (weak for relations + reports), Firebase-as-backend (lock-in, weak audit), microservice-per-table (too early).

## API style

- REST, resource nouns, `/v1`
- JSON only
- Idempotency-Key on ticket purchases (later)
- OpenAPI at `/v1/docs` in non-production
- Pagination: `?cursor=&limit=`
- City scope: `?city=istanbul` required on feed/event lists

## Auth

1. Register / login with email + password (Argon2id)
2. Access JWT 15 minutes
3. Refresh token 30 days, stored **hashed**, rotated every use
4. Later: Apple / Google / Telegram — same `User` row
5. Device session row for revoke-all

## Data domains (bounded)

| Domain | Owns |
| --- | --- |
| identity | User, Session, Verification |
| profile | Profile, photos metadata |
| city | Event, EventRsvp |
| trust | Report, Block, AuditLog |
| dating | **empty until phase 4** — do not create Like/Match tables now |

## Environments

| Name | Use |
| --- | --- |
| local | Docker Postgres + Redis |
| staging | later, EU region (Frankfurt) |
| prod | EU region. Turkey users, EU data residency preferred |

Do not host primary user photos on a random VPS disk.

## Scaling path (do not build now)

1. One API process + one Postgres
2. Add worker for image + verify review
3. Read replica if events go national
4. Split dating only if that module becomes its own traffic

## Security baseline

See `docs/05-security.md`. Short version: never store reversible passwords, never return other users’ email/phone, signed media URLs, rate-limit auth, audit admin actions.
