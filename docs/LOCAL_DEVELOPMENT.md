# Local Development

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- Docker Desktop for local PostgreSQL

## Install

```sh
pnpm install
```

Copy local env files:

```sh
cp services/api/.env.example services/api/.env
cp apps/studio/.env.example apps/studio/.env
```

PowerShell:

```powershell
Copy-Item services/api/.env.example services/api/.env
Copy-Item apps/studio/.env.example apps/studio/.env
```

The API env uses the Docker Compose Postgres port:

```env
DATABASE_URL="postgresql://avatar_user:avatar_password@localhost:5433/avatar_platform?schema=public"
API_PORT=4000
DEV_API_KEY="dev_avatar_platform_key"
```

## Start PostgreSQL

```sh
pnpm db:up
```

Generate Prisma, migrate, and seed:

```sh
pnpm --filter @avatar-platform/api prisma:generate
pnpm db:migrate
pnpm db:seed
```

Seed creates the local `demo` client and stores only a SHA-256 hash of `dev_avatar_platform_key`.

## Run Services

```sh
pnpm dev:api
pnpm dev:studio
pnpm dev:demo
```

URLs:

- API: `http://localhost:4000`
- Studio: `http://localhost:5173`
- Demo: `http://localhost:5174`

Health check:

```sh
curl http://localhost:4000/health
```

Expected healthy response:

```json
{
  "status": "ok",
  "service": "avatar-api",
  "database": "ok"
}
```

## Save And Embed Flow

1. Start Postgres, migrate, and seed.
2. Start API and Studio.
3. Customize an avatar in Studio.
4. Use `Save Avatar to API`.
5. Copy the `publicEmbedId`.
6. Start Demo and load the public embed ID, or open `/embed/avatar/:publicEmbedId`.

## Verification

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @avatar-platform/api exec prisma validate
```

API integration tests are real Postgres tests and are opt-in:

```sh
RUN_API_INTEGRATION_TESTS=1 pnpm --filter @avatar-platform/api test
```

PowerShell:

```powershell
$env:RUN_API_INTEGRATION_TESTS="1"; pnpm --filter @avatar-platform/api test
```

## Reference Repositories

`external/` is gitignored and reference-only. Do not copy source or assets from it into product packages unless the license and reuse path are explicitly confirmed.

## Notes

- PostgreSQL + Prisma is the only active persistence path.
- SQLite is not used in this project.
- Selfies are not uploaded to the backend.
- Vite may warn about large chunks because Three.js and React Three Fiber are bundled into the apps.
