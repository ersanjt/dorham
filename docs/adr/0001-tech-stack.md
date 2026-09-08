# ADR 0001 — Tech stack

Status: accepted
Date: 2026-09-07

## Decision

TypeScript monorepo: NestJS API, Prisma/Postgres, Redis, Next.js web, Expo mobile, Zod contracts.

## Consequences

- Hiring later is easier (one language)
- Mobile + API share validation
- We accept Expo’s native limits instead of two native apps
- We accept Prisma migration discipline

## Revisit if

- A second mobile engineer insists on Flutter and we have time to rewrite
- Event volume needs a queue (then add Redis BullMQ, not a new language)
