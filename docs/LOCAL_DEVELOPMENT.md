# Local Development

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer

## Install

```sh
pnpm install
```

Copy local API env:

```sh
cp services/api/.env.example services/api/.env
cp apps/studio/.env.example apps/studio/.env
```

On Windows PowerShell:

```powershell
Copy-Item services/api/.env.example services/api/.env
Copy-Item apps/studio/.env.example apps/studio/.env
```

## Start PostgreSQL

```sh
pnpm db:up
```

Generate Prisma client, run migrations, and seed the demo client:

```sh
pnpm --filter @avatar-platform/api prisma:generate
pnpm db:migrate
pnpm db:seed
```

## Run Studio

```sh
pnpm dev:studio
```

Studio runs at http://localhost:5173.

## Run Demo Site

```sh
pnpm dev:demo
```

Demo site runs at http://localhost:5174.

## Run API

```sh
pnpm dev:api
```

API runs at http://localhost:4000.

Health check:

```sh
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "avatar-api",
  "database": "ok"
}
```

## Save / Load Flow

1. Start Postgres with `pnpm db:up`.
2. Run Prisma migration and seed commands above.
3. Start API with `pnpm dev:api`.
4. Start Studio with `pnpm dev:studio`.
5. In Studio, customize an avatar and use `Save Avatar to API`.
6. Copy the `publicEmbedId`.
7. Start Demo with `pnpm dev:demo` and load that `publicEmbedId`.

## Validate Workspace

```sh
pnpm typecheck
pnpm build
```

## Current Limitations

- No full iframe message protocol yet.
- No production assets yet.
- No backend selfie upload or processing.
- `external/` remains reference-only and must not be merged into source packages.
