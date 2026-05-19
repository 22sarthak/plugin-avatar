# Embedding

The MVP supports two iframe modes: a creator iframe for making and saving avatars, and a public viewer iframe for rendering an already-saved avatar. Both use the existing API and PostgreSQL/Prisma persistence. No selfie images are uploaded or stored by these iframe flows.

## Creator Iframe

Local development URL:

```html
<iframe
  src="http://localhost:5173/embed/create?clientId=demo&externalUserId=user_123&theme=light"
  title="Create your avatar"
  style="width:100%;height:720px;border:0;border-radius:16px;"
></iframe>
```

Query parameters:

- `clientId`: client slug or identifier for the host site. In this MVP it is informational; API auth still uses the configured dev API key inside Studio.
- `externalUserId`: optional host-site user ID. Studio sends this to `POST /v1/avatars` so the API can associate the saved avatar with the client user.
- `theme`: `light` or `dark`.

When the user saves successfully, the creator posts this message to the parent window:

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

`previewUrl` is `null` for now because screenshot or preview-image storage is not part of this stage.

## Viewer Iframe

Local development URL:

```html
<iframe
  src="http://localhost:5174/embed/avatar/public_embed_id?animation=idle&controls=true&transparent=false"
  title="Avatar viewer"
  style="width:100%;height:520px;border:0;border-radius:16px;"
></iframe>
```

The viewer loads public-safe avatar data with:

```http
GET http://localhost:4000/v1/embed/:publicEmbedId
```

No API key is required for the public viewer, and the response does not expose client API keys, private client metadata, events, or internal user records.

Query parameters:

- `animation`: `idle`, `bounce`, or `wave`. These are public viewer aliases for `idle_breathing`, `small_bounce`, and `wave`.
- `controls`: `true` or `false`; defaults to `true`.
- `transparent`: `true` or `false`; defaults to `false`.

## Host Page Message Handling

Use the SDK helper to validate message shape before trusting data:

```ts
import { isAvatarCreatedMessage } from "@avatar-platform/avatar-sdk";

window.addEventListener("message", (event) => {
  const origin = new URL(event.origin);
  const isLocalDev = origin.hostname === "localhost" || origin.hostname === "127.0.0.1";

  if (!isLocalDev || !isAvatarCreatedMessage(event.data)) {
    return;
  }

  console.log(event.data.payload.publicEmbedId);
});
```

For MVP local development, localhost origins are allowed. Production should restrict both the Studio `postMessage` target origin and host-page message listeners to the client’s configured allowed origins.

## Production TODOs

- Enforce `Client.allowedOrigins` from the database for creator iframe hosts.
- Replace wildcard `postMessage("*")` with the resolved allowed parent origin.
- Add rate limiting and abuse protection for public embed reads and creator saves.
- Add API key rotation and stronger production key management.
- Add screenshot or preview-image storage through S3/R2 only when needed.
