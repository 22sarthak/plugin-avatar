# Avatar Platform Architecture

This platform is a free-first, plug-and-play, photo-assisted 3D avatar creator. The v1 product is not face reconstruction. It uses a selfie to extract approximate face signals, chooses a close stylized preset, and lets the user finish the avatar manually.

## Monorepo Shape

The repo root is `plugin-avatar`, serving as the `avatar-platform` monorepo.

```text
apps/
  studio/          main avatar creator app
  demo-site/       iframe/widget integration examples
packages/
  avatar-core/     types, schema, feature extraction contracts, preset matching
  avatar-renderer/ React Three Fiber avatar renderer
  avatar-sdk/      embeddable JS SDK and iframe helpers
  ui/              shared Studio/Demo React UI
services/
  api/             backend save/load API
assets/
  avatars/         placeholder/base avatar assets and future licensed packs
  traits/          hair, clothing, accessories, palettes, manifests
  animations/      idle/basic animation clips
docs/
external/
```

Implementation uses TypeScript and pnpm workspaces. The MVP uses Vite React for `apps/studio` and `apps/demo-site`, React Three Fiber + Drei + Three.js for rendering, MediaPipe Tasks Vision for client-side face landmarks, simple React state for builder state, Node/Express for the API, and PostgreSQL + Prisma for local and production-shaped persistence. Local filesystem storage is only for dev assets or future license-cleared previews.

Node/Express is preferred over FastAPI for v1 because the frontend, renderer, SDK, and backend can share TypeScript schemas from `packages/avatar-core`. SQLite is not active in this repo; PostgreSQL is the single persistence target.

## Package Responsibilities

`packages/avatar-core`

- Owns `AvatarConfig`, `AvatarTrait`, `AvatarPreset`, `AssetManifest`, `FaceFeatureVector`, and matching result types.
- Converts MediaPipe landmark output into approximate, normalized feature hints such as face shape, eye spacing, brow/eye/mouth proportions, and confidence.
- Matches feature hints to stylized presets; the matcher must return confidence and editable reasons, not claim identity-level accuracy.
- Provides JSON schema/versioning so saved configs can migrate later.

`packages/avatar-renderer`

- Accepts an `AvatarConfig` and an asset resolver.
- Renders the avatar through React Three Fiber without knowing about Studio routes, API persistence, or selfie processing.
- Supports camera presets, idle animation, basic expression/pose hooks, screenshot capture, and future GLB/VRM export hooks.
- Must work with placeholder primitives first and licensed GLB/VRM assets later.

`packages/avatar-sdk`

- Starts iframe-first embedding with helpers like `createAvatarIframe`, `openAvatarCreator`, and `listenForAvatarEvents`.
- Uses `postMessage` for host-to-iframe and iframe-to-host communication.
- Remains independent of React so any website can embed it.
- Later exposes JS SDK wrappers around the same message protocol.

`packages/ui`

- Contains shared React components used by Studio and Demo only.
- Must not own avatar domain logic or renderer state.

`apps/studio`

- Main builder flow: selfie upload, local face analysis, suggested preset, manual customization, save/load, screenshot/export, and embed config.
- Keeps selfie image data in browser memory only. It does not send selfies to the API.
- Uses `avatar-core` for schemas/matching and `avatar-renderer` for preview.

`apps/demo-site`

- Demonstrates iframe embedding first.
- Later demonstrates JS SDK usage.
- Should be a working integration surface, not a marketing-only landing page.

`services/api`

- Saves and loads avatar JSON config.
- Stores no raw selfie images.
- Uses PostgreSQL locally through Docker Compose, with Prisma migrations and seed data.
- May store generated preview metadata or paths only after the renderer/export stage exists.

## Data Flow

1. User opens Studio directly or inside an iframe.
2. User uploads a selfie in the browser.
3. Studio runs MediaPipe Tasks Vision locally and receives face landmarks.
4. `avatar-core` converts landmarks into an approximate feature vector.
5. `avatar-core` matches the vector to a stylized avatar preset with confidence/reason metadata.
6. Studio applies the suggested preset and shows controls for hair, clothing, accessories, colors, and style.
7. `avatar-renderer` renders the config in 3D and plays idle/basic animations.
8. User saves the final `AvatarConfig` JSON through `services/api`.
9. User exports JSON config, screenshot, and iframe embed code.
10. Host websites load the iframe and receive save/export events through `postMessage`.

The saved source of truth is JSON config, not a final GLB. Future GLB/VRM export should be generated from config and assets, not become the only storage format.

## Embedding Contract

Iframe is the first supported integration path.

- Host creates an iframe pointing at Studio embed route, for example `/embed/avatar-builder`.
- Host may pass safe options such as theme, return URL, initial avatar ID, and allowed origins.
- Iframe posts events such as `avatar:ready`, `avatar:changed`, `avatar:saved`, `avatar:exported`, and `avatar:error`.
- Host posts commands such as `avatar:load`, `avatar:save`, `avatar:set-theme`, and `avatar:request-screenshot`.
- Messages must validate origin and payload shape through `avatar-core` schemas.

The JS SDK is a thin convenience wrapper over the same message contract. It should not be required for basic embedding.

## Asset Strategy

The asset system must be replaceable.

- V1 starts with placeholder primitive/base assets and a small local manifest.
- Each asset has an ID, category, label, tags, compatible body/preset metadata, color slots, file path, source, license, and attribution metadata.
- Unlicensed reference assets from `external/` must not be copied into `assets/`.
- Asset manifests should support later pack replacement without changing `AvatarConfig`.
- Future GLB/VRM export must be treated as a renderer/export capability, not a storage requirement.

## Privacy And Limitations

- No paid API dependency.
- Selfie analysis stays client-side in MVP.
- Do not store raw selfies.
- Store final avatar config JSON and optional generated preview output only.
- Landmark-derived feature vectors are approximate hints, not biometric identity storage.
- The product should say "photo-assisted suggestions" and "manual customization", not "automatic clone", "perfect reconstruction", or "Bitmoji/Snapchat clone".

## Main Risks

- Asset licensing is the largest product risk. Use placeholders until license-cleared packs are available.
- Face feature extraction can be biased or unreliable across lighting, camera quality, head pose, and user appearance. The UI must keep edits manual and reversible.
- Renderer performance depends on asset size and draw calls. Keep v1 assets simple and measure before adding complex GLB/VRM packs.
- iframe embedding requires careful origin validation and a stable message protocol before public use.
