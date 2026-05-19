# Privacy

The MVP is privacy-first and photo-assisted.

## Selfies

- Raw selfies are not uploaded to the backend.
- Selfie processing happens client-side in Studio using browser-based MediaPipe.
- The backend has no route for selfie upload or face image storage.
- Studio localStorage stores avatar config JSON only, not the raw selfie image.

## Backend Storage

The API stores:

- validated avatar JSON config
- optional external user ID supplied by the embedding site
- optional display name
- optional preview image URL if a future stage provides one
- public embed ID
- simple created/updated event metadata

The API does not store:

- raw selfies
- face images
- face landmark arrays
- biometric identity data
- race, ethnicity, gender, age, attractiveness, or identity claims

## Public Embed Endpoint

`GET /v1/embed/:publicEmbedId` returns only:

- `publicEmbedId`
- avatar `config`
- optional `previewImageUrl`
- `updatedAt`

It does not expose API keys, client internals, private events, or raw user metadata.

## SDK And Snippets

The public SDK creates creator/viewer iframes and validates `postMessage` payloads. SDK snippets must not include `x-avatar-api-key` or production secrets; private saves are handled inside the Studio/API flow.

## Production TODOs

- API key rotation
- per-client allowed-origin enforcement
- rate limiting
- audit log policy
- S3/R2 preview storage controls
- production database secret management
