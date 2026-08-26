# Central Support

Centralized multi-project customer support MVP built as a pnpm Turborepo monorepo.

## Stack

- Next.js App Router + TypeScript dashboard in `apps/frontend`
- NestJS + Fastify API in `apps/backend`
- PostgreSQL + Prisma, Redis, BullMQ, Socket.IO-ready realtime service
- TanStack Query for server state, Zustand for UI state
- React Hook Form + Zod, Tailwind CSS, shadcn-style shared UI primitives

## Verified Versions

- pnpm: `10.29.3`
- Next.js registry latest checked during implementation: `16.3.1`
- Other package versions are pinned as stable semver ranges in each package manifest and resolved by `pnpm-lock.yaml`.

## Development

```bash
pnpm install
docker compose up -d
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:migrate
pnpm --filter backend seed
pnpm dev
```

Useful commands:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter frontend dev
pnpm --filter backend dev
```

Development login:

- Email: `admin@example.com`
- Password: `SupportHub123!`
- Integration project key: `teledoctor`
- Integration secret: `dev-integration-secret`

## Security Notes

Dashboard refresh tokens are stored in HttpOnly cookies. Access tokens stay in memory only and are never written to localStorage or sessionStorage. Project-scoped dashboard queries verify membership on the backend, and integration message ingress authenticates with the project integration secret rather than trusting a project ID.
