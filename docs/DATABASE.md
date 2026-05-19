# Database

The API uses PostgreSQL and Prisma for production-shaped persistence from the start.

SQLite is intentionally not used for this stage because the service is meant to become a reusable multi-client avatar platform with hosted API access, public embeds, and future production deployment.

## Local PostgreSQL

Start Postgres:

```sh
pnpm db:up
```

Connection string:

```env
DATABASE_URL="postgresql://avatar_user:avatar_password@localhost:5433/avatar_platform?schema=public"
```

## Prisma

Schema path:

```text
services/api/prisma/schema.prisma
```

Commands:

```sh
pnpm --filter @avatar-platform/api prisma:generate
pnpm db:migrate
pnpm db:seed
```

## Models

- `Client`: tenant/application using the avatar service. Stores a hashed API key, not the raw key.
- `AvatarUser`: optional per-client user record keyed by `clientId + externalUserId`.
- `Avatar`: saved avatar JSON config, public embed ID, status, and optional preview URL.
- `AvatarEvent`: append-only MVP event records for created/updated avatar actions.

Relations:

- `Client` has many `AvatarUser`, `Avatar`, and `AvatarEvent` records.
- `AvatarUser` belongs to `Client` and can own many `Avatar` records.
- `Avatar` belongs to `Client`, optionally belongs to `AvatarUser`, and has many `AvatarEvent` records.
- `AvatarEvent` belongs to `Avatar` and `Client`.

## Production Notes

- Use a production `DATABASE_URL` from the hosting environment.
- Replace local SHA-256 API key handling with stronger key management and rotation.
- Enforce `allowedOrigins` before public rollout.
- Add rate limiting, audit log retention policy, and monitoring.
- Add S3/R2 storage later for generated preview images.
- Redis can be introduced later for rate limiting/cache if needed; it is not part of v1.

## Test Notes

The normal `pnpm test` run includes API test definitions but skips database integration unless explicitly enabled. To run the create/load/update/embed tests against local Postgres:

```sh
RUN_API_INTEGRATION_TESTS=1 pnpm --filter @avatar-platform/api test
```
