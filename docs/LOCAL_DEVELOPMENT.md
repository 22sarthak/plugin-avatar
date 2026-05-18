# Local Development

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer

## Install

```sh
pnpm install
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
  "service": "avatar-api"
}
```

## Validate Workspace

```sh
pnpm typecheck
pnpm build
```

## Current Limitations

- No face detection yet.
- No avatar save/load endpoints yet.
- No full iframe message protocol yet.
- No production assets yet.
- `external/` remains reference-only and must not be merged into source packages.
