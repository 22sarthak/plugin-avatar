# Build Order

Each major stage should follow this loop: inspect existing code, explain intended changes, implement, run typecheck/build/tests where available, update docs, then summarize what works and what remains limited.

## Stage 0: Research And Documentation

Status: this stage only.

- Clone reference repos into `external/`.
- Verify visible licenses locally.
- Document safe reference areas, unsafe copying risks, and architecture decisions.
- Do not create app implementation code yet.

Acceptance:

- `docs/OPEN_SOURCE_RESEARCH.md`, `docs/ARCHITECTURE.md`, and `docs/BUILD_ORDER.md` exist.
- Unlicensed assets/code are documented as reference-only.
- Architecture explicitly says v1 is photo-assisted preset matching, not perfect reconstruction.

## Stage 1: Monorepo Tooling Scaffold

- Add pnpm workspace, Turborepo config, TypeScript base config, lint/typecheck scripts, and package placeholders.
- Create empty package/app/service directories matching the architecture.
- Add README with local development commands.

Acceptance:

- Workspace installs cleanly.
- `pnpm typecheck` and `pnpm build` have meaningful placeholders or pass where implemented.
- No external source/assets are copied into app packages.

## Stage 2: Core Schema And Preset Matching

- Implement `packages/avatar-core` with versioned avatar config schema, trait taxonomy, asset manifest schema, face feature vector contracts, and preset matcher.
- Add sample presets using only placeholder metadata.
- Add tests for schema validation, config versioning, and deterministic matching.

Acceptance:

- Avatar config can be created, validated, serialized, and loaded.
- Preset matching returns editable suggestions with confidence/reason metadata.
- No raw selfie data is part of persisted config.

## Stage 3: Placeholder Renderer

- Implement `packages/avatar-renderer` with React Three Fiber and primitive placeholder assets.
- Render a config-driven avatar with body, face style, hair, clothing, accessory, color, camera, and idle animation placeholders.
- Add screenshot capture API.

Acceptance:

- Renderer works without Studio/API.
- Avatar updates when config changes.
- Screenshot capture returns an image without storing selfies.

## Stage 4: Studio MVP

- Implement `apps/studio` builder flow: upload selfie, choose suggested preset, customize traits, preview in 3D, export config, and save/load.
- Use MediaPipe Tasks Vision client-side only.
- Keep manual customization as the primary success path.

Acceptance:

- User can complete an avatar without uploading a selfie.
- If a selfie is provided, the app suggests a preset but allows full edits.
- UI copy does not promise perfect reconstruction.

## Stage 5: API Save/Load

- Implement `services/api` with Node/Express, SQLite, and shared validation from `avatar-core`.
- Endpoints should save/load avatar config JSON and optional preview metadata.
- Do not accept raw selfie upload in MVP.

Acceptance:

- Studio can save and reload an avatar by ID.
- Invalid config payloads are rejected.
- Database path can later move to Postgres without changing the public contract.

## Stage 6: Iframe Embed And Demo Site

- Add Studio embed route optimized for iframe usage.
- Implement `postMessage` protocol with validated events and origin checks.
- Build `apps/demo-site` showing iframe integration and saved-avatar loading.

Acceptance:

- A host page can open the builder in an iframe and receive saved/exported avatar events.
- Embed flow works without React in the host page.
- Message payloads are typed and validated.

## Stage 7: JS SDK

- Implement `packages/avatar-sdk` as a React-independent wrapper around iframe creation and `postMessage`.
- Provide helpers for open, close, load, save, screenshot request, and event subscription.
- Add demo usage in `apps/demo-site`.

Acceptance:

- Host websites can integrate with a few lines of plain JavaScript.
- SDK uses the same protocol as iframe-only integration.
- SDK does not import React.

## Stage 8: Export And Animation Hardening

- Add JSON export, screenshot export, and basic animation selection.
- Keep GLB/VRM export behind a clearly documented future or experimental path until asset pipeline is stable.
- Add renderer tests and manual visual checks.

Acceptance:

- User can export config and preview screenshot.
- Idle/basic animation works with placeholder or license-cleared clips.
- Future GLB/VRM path is documented without being overpromised.

## Stage 9: Asset Replacement And License Audit

- Replace placeholder assets only with assets that have explicit compatible licenses.
- Add asset source/license metadata and attribution docs.
- Add checks that every production asset has license metadata.

Acceptance:

- No production asset ships without license metadata.
- Asset packs can be swapped without breaking saved avatar config.
- Docs explain how to add new trait packs safely.
