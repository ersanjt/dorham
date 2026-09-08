# Dorham (دورهم)

Iranian community in Turkey. **Events first. Dating later.**

Read `docs/00-north-star.md` before writing code.

| App | Path | URL |
| --- | --- | --- |
| API | `apps/api` | http://localhost:4000/v1 |
| Website | `apps/web` | http://localhost:3000 |
| Mobile | `apps/mobile` | Expo |

## Windows — first run

Commands **must** be run from the project folder, not `C:\Users\ersan`:

```powershell
cd C:\Users\ersan\Desktop\tinder
npm run dev:setup
```

That script starts a local Postgres (no Docker), migrates, seeds, then runs API + web.

If you prefer two terminals:

```powershell
cd C:\Users\ersan\Desktop\tinder
npm run db:up
```

```powershell
cd C:\Users\ersan\Desktop\tinder
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Docker is optional. If you later install Docker Desktop:

```powershell
cd C:\Users\ersan\Desktop\tinder
docker compose up -d postgres redis
```

OpenAPI (dev): http://localhost:4000/v1/docs

Local seed: `host@dorham.app` / `DorhamHost1`

## Docs

- [North star](docs/00-north-star.md)
- [Business plan](docs/01-business-plan.md)
- [Architecture](docs/02-architecture.md)
- [Roadmap](docs/03-roadmap.md)
- [API conventions](docs/04-api-conventions.md)
- [Security](docs/05-security.md)
- [Naming](docs/06-naming.md)
- [Apps and website](docs/07-apps-and-web.md)
