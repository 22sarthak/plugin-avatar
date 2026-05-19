# Limitations

This project is intentionally an MVP avatar platform, not a finished commercial avatar engine.

## Avatar Creation

- Selfie input is photo-assisted preset matching, not perfect face reconstruction.
- Extracted traits are approximate and editable.
- The system does not infer race, ethnicity, gender, age, attractiveness, identity, or other sensitive attributes.
- Manual customization remains the primary correction path.

## Rendering

- The current avatar is procedural React Three Fiber geometry.
- The premium visual pass improves proportions, lighting, materials, hair, clothing, and Studio presentation, but it is still procedural art.
- It is suitable for aesthetic MVP previews, embeds, screenshots, and customization demos.
- It is not a rigged production character asset pipeline.
- Real hair, clothing, accessory meshes, and animation clips require license-cleared assets.
- Some trait combinations may still need art-direction QA before public brand launch.

## Persistence

- PostgreSQL + Prisma is the only active persistence path.
- The API stores validated `AvatarConfig` JSON and public embed metadata.
- Raw selfies, face images, landmark arrays, and backend face processing are not stored or implemented.

## Embedding And SDK

- The iframe creator/viewer and JS SDK are designed for local development and early integration.
- Localhost origins are allowed in MVP development.
- Production must enforce per-client `allowedOrigins` before public rollout.
- The SDK does not expose API keys and does not create a separate storage layer.

## Export

- Supported exports are JSON, public URL, iframe snippets, SDK snippets, and client-side PNG screenshot.
- GLB/VRM export is not implemented.
- See `docs/GLB_EXPORT_FEASIBILITY.md` for the required asset, rigging, licensing, and export work.

## Production TODOs

- Stronger API key management and rotation.
- Per-client allowed-origin enforcement.
- Rate limiting and abuse controls.
- S3/R2 storage for generated previews if previews become persistent.
- Production Postgres connection management and backups.
- Redis later for rate limiting/cache if needed.
- CDN distribution for the SDK bundle.
- Privacy/compliance review before real user rollout.
