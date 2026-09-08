# Dorham agent contract

You are working on **Dorham** (دورهم): an Iranian community product for people living in Turkey. Events and local gathering come first. Dating is a later tab, never the homepage.

## Do not drift

- Do not turn this into a Tinder / Sheytoon / Azizam swipe clone.
- Do not add Boost, Super Like, “see who liked you”, or like-paywalls.
- Do not build a Hornet-style queer grid as a Turkey-hosted v1.
- Do not treat users physically in Iran as a launch market (sanctions, payments, +98).
- Do not introduce a second language in the backend. TypeScript only across api, web, mobile, shared.
- Do not add a new datastore without an ADR in `docs/adr/`.
- Public HTTP is versioned under `/v1`. No unversioned resources.

## Locked stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript 5 |
| API | NestJS + Fastify |
| Contracts | Zod in `@dorham/shared` |
| Data | PostgreSQL 16 + Prisma |
| Cache / rate limit | Redis |
| Web | Next.js App Router |
| Mobile | Expo (iOS + Android) |
| Monorepo | npm workspaces + Turborepo |

## Where to change what

- Product rules, naming, roadmap: `docs/`
- API request/response shapes: `packages/shared` first, then controllers
- Persistence: `apps/api/prisma/schema.prisma`
- Website: `apps/web`
- Mobile: `apps/mobile`

If a change would move us off “community first, Istanbul first, verified humans”, stop and update `docs/00-north-star.md` before coding.
