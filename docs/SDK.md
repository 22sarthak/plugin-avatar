# JavaScript SDK

The SDK is a React-free wrapper around the existing iframe embed routes. It creates iframes, listens for validated `postMessage` events, and cleans up listeners when destroyed. It does not call private API endpoints, expose API keys, store selfies, or create a separate persistence layer.

## Browser Script

Build the SDK first:

```bash
pnpm --filter @avatar-platform/avatar-sdk build
```

Then load the browser bundle from a plain HTML page:

```html
<div id="avatar" style="height:720px"></div>
<script src="./packages/avatar-sdk/dist/avatar-studio.iife.js"></script>
<script>
  const handle = AvatarStudio.init({
    container: "#avatar",
    clientId: "demo",
    externalUserId: "user_123",
    studioBaseUrl: "http://localhost:5173",
    onAvatarCreated: (event) => {
      console.log("Created avatar", event.publicEmbedId);
    },
    onError: (error) => {
      console.error(error.message);
    }
  });

  // Later, remove the iframe and postMessage listener.
  handle.destroy();
</script>
```

## ESM Usage

```ts
import { AvatarStudio } from "@avatar-platform/avatar-sdk";

const handle = AvatarStudio.init({
  container: document.querySelector("#avatar")!,
  clientId: "demo",
  externalUserId: "user_123",
  studioBaseUrl: "http://localhost:5173",
  onAvatarCreated: (event) => {
    console.log(event.avatarId, event.publicEmbedId);
  }
});
```

## Inline Creator

```ts
const creator = AvatarStudio.init({
  container: "#creator",
  clientId: "demo",
  externalUserId: "user_123",
  mode: "create",
  theme: "light",
  studioBaseUrl: "http://localhost:5173",
  onAvatarCreated: (event) => {
    console.log(event.config);
  }
});
```

The creator iframe uses:

```text
http://localhost:5173/embed/create?clientId=demo&externalUserId=user_123&theme=light
```

## Modal Creator

```ts
const modal = AvatarStudio.openModal({
  clientId: "demo",
  externalUserId: "user_123",
  theme: "light",
  studioBaseUrl: "http://localhost:5173",
  onAvatarCreated: (event) => {
    console.log(event.publicEmbedId);
  },
  onClose: () => {
    console.log("Modal closed");
  }
});

modal.close();
```

## Public Avatar Viewer

```ts
const viewer = AvatarStudio.renderAvatar({
  container: "#viewer",
  publicEmbedId: "public_embed_id",
  studioBaseUrl: "http://localhost:5174",
  animation: "idle",
  controls: true
});
```

The viewer iframe uses the public embed route:

```text
http://localhost:5174/embed/avatar/public_embed_id?animation=idle&controls=true
```

That route loads avatar data through `GET /v1/embed/:publicEmbedId`. No API key is required.

## Event Shape

The creator iframe sends this event after a successful API save:

```json
{
  "type": "AVATAR_CREATED",
  "payload": {
    "avatarId": "avatar_database_id",
    "publicEmbedId": "public_embed_id",
    "config": {},
    "previewUrl": null
  }
}
```

SDK callbacks receive `payload` directly:

```ts
onAvatarCreated: (event) => {
  console.log(event.avatarId);
}
```

`previewUrl` is currently `null` because screenshot/preview persistence is not part of the MVP.

## Options

`AvatarStudio.init` accepts:

- `container`: CSS selector or `HTMLElement`.
- `clientId`: required for creator mode.
- `externalUserId`: optional host user ID.
- `mode`: `"create"` or `"viewer"`; defaults to `"create"`.
- `publicEmbedId`: required for viewer mode.
- `theme`: `"light"` or `"dark"`.
- `studioBaseUrl`: base URL for the iframe route.
- `animation`: `"idle"`, `"bounce"`, or `"wave"` for viewer mode.
- `controls`: viewer orbit controls.
- `onAvatarCreated`, `onAvatarUpdated`, `onError`: callbacks.

## Security Notes

- The SDK validates `AVATAR_CREATED` message shape before invoking callbacks.
- The SDK checks the message source against its managed iframe.
- Localhost origins are allowed for development.
- Production should enforce per-client allowed origins from `Client.allowedOrigins` and replace wildcard iframe postMessage behavior in Studio with an exact parent origin.
- The SDK never exposes dev API keys. Saving is handled inside the Studio iframe through the existing API integration.
