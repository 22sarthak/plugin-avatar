# Avatar Platform

A reusable, free-first, photo-assisted 3D avatar creation platform for embedding into websites.

The MVP lets a user manually customize a stylized procedural avatar, optionally start from an approximate client-side selfie suggestion, save validated avatar JSON to a PostgreSQL/Prisma API, render a public iframe viewer by `publicEmbedId`, and integrate through a React-free JavaScript SDK.

## What This Is Not

- Not a Snapchat, Bitmoji, or perfect face reconstruction clone.
- Not a paid avatar API wrapper.
- Not a backend selfie processing service.
- Not a production GLB/VRM exporter yet.

The source of truth is `AvatarConfig` JSON. Selfie analysis is approximate, editable preset matching that runs in the browser.

## Workspace

```text
apps/studio              Avatar creator and embedded creator route
apps/demo-site           Integration demo and public iframe viewer route
packages/avatar-core     Types, schemas, validation, presets, matching helpers
packages/avatar-renderer Reusable React Three Fiber renderer
packages/avatar-sdk      React-free iframe SDK
packages/ui              Shared UI primitives
services/api             Express + Prisma + PostgreSQL API
assets/                  Placeholder asset folders
docs/                    Product, API, database, SDK, embed, and privacy docs
external/                Local reference repos only, gitignored
```

## Requirements

- Node.js 20+
- pnpm 10+
- Docker Desktop, for local PostgreSQL

## Fresh Clone Setup

```sh
pnpm install
cp services/api/.env.example services/api/.env
cp apps/studio/.env.example apps/studio/.env
pnpm db:up
pnpm --filter @avatar-platform/api prisma:generate
pnpm db:migrate
pnpm db:seed
```

On Windows PowerShell:

```powershell
Copy-Item services/api/.env.example services/api/.env
Copy-Item apps/studio/.env.example apps/studio/.env
```

Local Postgres is exposed on `localhost:5433` by `docker-compose.yml`.

## Run Locally

```sh
pnpm dev:api
pnpm dev:studio
pnpm dev:demo
```

Local URLs:

- API: `http://localhost:4000`
- Studio: `http://localhost:5173`
- Demo site: `http://localhost:5174`

Health check:

```sh
curl http://localhost:4000/health
```

## Verification

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @avatar-platform/api prisma:generate
pnpm --filter @avatar-platform/api exec prisma validate
```

API integration tests require a running Postgres database and are opt-in:

```sh
RUN_API_INTEGRATION_TESTS=1 pnpm --filter @avatar-platform/api test
```

PowerShell:

```powershell
$env:RUN_API_INTEGRATION_TESTS="1"; pnpm --filter @avatar-platform/api test
```

## Embedding

Creator iframe:

```html
<iframe
  src="http://localhost:5173/embed/create?clientId=demo&externalUserId=user_123&theme=light"
  title="Create your avatar"
  style="width:100%;height:720px;border:0;border-radius:16px;"
></iframe>
```

Viewer iframe:

```html
<iframe
  src="http://localhost:5174/embed/avatar/emb_public_id?animation=idle&controls=true"
  title="Avatar viewer"
  style="width:100%;height:520px;border:0;border-radius:16px;"
></iframe>
```

JS SDK:

```html
<script src="./packages/avatar-sdk/dist/avatar-studio.iife.js"></script>
<script>
  AvatarStudio.openModal({
    clientId: "demo",
    externalUserId: "user_123",
    studioBaseUrl: "http://localhost:5173",
    onAvatarCreated: (event) => console.log(event)
  });
</script>
```

## Privacy And Security Defaults

- No paid services are required.
- Selfies are processed in the browser for the MVP.
- The backend stores avatar JSON config, not raw selfies.
- Public embed reads use `publicEmbedId` and return public-safe avatar data only.
- API keys are used by the Studio/API local dev flow and are not exposed by SDK public snippets.
- `.env` files are ignored. Commit only `.env.example`.

## More Docs

- [Local development](docs/LOCAL_DEVELOPMENT.md)
- [API](docs/API.md)
- [Database](docs/DATABASE.md)
- [SDK](docs/SDK.md)
- [Embedding](docs/EMBEDDING.md)
- [Animations](docs/ANIMATIONS.md)
- [Privacy](docs/PRIVACY.md)
- [Limitations](docs/LIMITATIONS.md)
- [GLB/VRM feasibility](docs/GLB_EXPORT_FEASIBILITY.md)
