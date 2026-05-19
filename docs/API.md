# API

Base URL for local development: `http://localhost:4000`.

Write and private read endpoints require:

```http
x-avatar-api-key: dev_avatar_platform_key
```

The API stores avatar JSON config only. It does not accept selfie uploads.

## GET /health

Returns service and database status.

```json
{
  "status": "ok",
  "service": "avatar-api",
  "database": "ok"
}
```

## POST /v1/avatars

Auth required.

```json
{
  "externalUserId": "site-user-123",
  "displayName": "Local Demo User",
  "config": {
    "id": "local-avatar",
    "version": 1,
    "skinTone": "amber",
    "faceShape": "oval",
    "eyeShape": "almond",
    "eyeColor": "#2f1d14",
    "eyebrowStyle": "soft-arch",
    "hairStyle": "short-textured",
    "hairColor": "#15110f",
    "facialHairStyle": "none",
    "outfit": "studio-hoodie",
    "accessoryIds": ["round-glasses"],
    "animation": "idle_breathing",
    "createdAt": "2026-05-18T00:00:00.000Z",
    "updatedAt": "2026-05-18T00:00:00.000Z"
  }
}
```

Response:

```json
{
  "avatarId": "clx...",
  "publicEmbedId": "emb_...",
  "externalUserId": "site-user-123",
  "config": {},
  "previewImageUrl": null,
  "createdAt": "2026-05-18T12:00:00.000Z",
  "updatedAt": "2026-05-18T12:00:00.000Z"
}
```

## GET /v1/avatars/:id

Auth required. Returns an avatar owned by the authenticated client.

## PUT /v1/avatars/:id

Auth required.

```json
{
  "config": {},
  "previewImageUrl": "https://example.com/preview.png"
}
```

Validates config, updates the avatar, and records an `updated` event.

## GET /v1/embed/:publicEmbedId

Public endpoint. Returns public-safe avatar data only.

```json
{
  "publicEmbedId": "emb_...",
  "config": {},
  "previewImageUrl": null,
  "updatedAt": "2026-05-18T12:00:00.000Z"
}
```

The public embed response intentionally omits private avatar IDs, client records, API key hashes, event history, and internal metadata.

## GET /v1/assets

Public endpoint returning current trait metadata from `avatar-core`.

## Error Examples

Missing API key:

```json
{
  "error": "missing_api_key",
  "message": "x-avatar-api-key header is required."
}
```

Invalid config:

```json
{
  "error": "invalid_avatar_config",
  "message": "Avatar config is invalid.",
  "details": ["skinTone Invalid option..."]
}
```

Unauthorized:

```json
{
  "error": "invalid_api_key",
  "message": "API key is invalid or inactive."
}
```

Not found:

```json
{
  "error": "avatar_not_found",
  "message": "Avatar was not found for this client."
}
```
