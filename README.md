# Dorham (دورهم)

Iranian community product for people living in Turkey. **Events and the city first. Dating later — never the homepage.**

Canonical public domain: **[dorham.app](https://dorham.app)** (not `dorham.com` — that is a premium aftermarket listing; see [`docs/06-naming.md`](docs/06-naming.md)).

## Stack

| Layer | Path | Local URL |
| --- | --- | --- |
| API (NestJS `/v1`) | `apps/api` | http://localhost:4000/v1 |
| Website (Next.js) | `apps/web` | http://localhost:3000 |
| Mobile (Expo) | `apps/mobile` | Metro / emulator |
| Contracts (Zod) | `packages/shared` | — |

## Windows — first run

Run from the **repo root**:

```powershell
cd C:\Users\ersan\Desktop\tinder
npm run dev:setup
```

That starts local Postgres (no Docker required), migrates, seeds real venues + a dev admin, then runs API + web.

Two terminals alternative:

```powershell
npm run db:up
```

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

OpenAPI (dev): http://localhost:4000/v1/docs

**Dev login after seed:** `host@dorham.app` / `DorhamHost1`  
(Admin tooling account only — not a public persona.)

### Mobile (emulator)

```powershell
cd apps\mobile
npx expo start --lan --port 8081
# separate terminal, with ANDROID_HOME set:
npx expo run:android --no-bundler
```

Emulator API base: `http://10.0.2.2:4000` (set `EXPO_PUBLIC_API_URL`). Phone on LAN: use your PC LAN IP in `app.json` `extra.apiUrl`.

## Data policy

Seed loads a **real Istanbul Iranian venue directory**. It does **not** invent Friday events or feed posts. See [`docs/08-data-policy.md`](docs/08-data-policy.md).

## Docs

- [North star](docs/00-north-star.md)
- [Business plan](docs/01-business-plan.md)
- [Architecture](docs/02-architecture.md)
- [Roadmap](docs/03-roadmap.md)
- [API conventions](docs/04-api-conventions.md)
- [Security](docs/05-security.md)
- [Naming & domains](docs/06-naming.md)
- [Apps and website](docs/07-apps-and-web.md)
- [Real data policy](docs/08-data-policy.md)
- [Agent contract](AGENTS.md)

## Do not drift

No Tinder swipe decks, Boost, Super Like, like-paywalls, or Iran (+98) as a v1 market. Public HTTP stays under `/v1`. TypeScript only.
