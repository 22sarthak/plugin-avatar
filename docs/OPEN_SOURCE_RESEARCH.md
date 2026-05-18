# Open Source Research

This document records the local read-only review of the reference repositories cloned into `external/`.

The MVP direction is photo-assisted preset matching plus manual customization. None of these repositories should be treated as a drop-in product or as proof that we can do perfect selfie-to-avatar reconstruction.

## Summary

| Repository | Visible license | Reuse posture | Recommended role |
| --- | --- | --- | --- |
| `M3-org/CharacterStudio` | MIT in root `LICENSE` | Safe to reference; small MIT ideas may be reused with attribution, but avoid wholesale copying | Avatar studio, manifest, export, VRM/glTF architecture reference |
| `m3-org/loot-assets` | No root license found locally | Unsafe to copy assets until license is confirmed | Asset-pack manifest/reference only |
| `memelotsqui/character-assets` | No root license found locally | Unsafe to copy assets until license is confirmed | Asset taxonomy/manifest reference only |
| `yeemachine/kalidoface-3d` | Root `LICENSE` contains MIT text; `package.json` says ISC | Reference tracking/rigging ideas only; do not copy sample models | Animation/tracking reference |
| `readyplayerme/visage` | MIT in root `LICENSE` and `package.json` | Safe renderer reference; avoid Ready Player Me product assumptions/assets | R3F/Three reusable renderer reference |
| `wass08/r3f-ultimate-character-configurator` | No root license found locally | Unsafe to copy code/assets directly | Simple configurator UX/state reference only |

## CharacterStudio

- Source: https://github.com/M3-org/CharacterStudio
- Local path: `external/CharacterStudio`
- Purpose: Open web avatar studio for creating glTF/VRM avatars.
- Package structure: Vite React app with `src/components`, `src/context`, `src/library`, `src/pages`, `src/services`, and `public` manifests/assets.
- Rendering approach: Three.js/WebGL with React UI. The README says core logic has moved into a `CharacterManager` class.
- Avatar asset approach: Manifest-driven character and trait packs. `public/manifest.json` points to character manifests, thumbnail manifests, sprite manifests, LoRA manifests, and default animations.
- Export approach: Supports VRM/glB-style export flows in `src/library/VRMExporter.js`, batch export pages, screenshots, and optimization/atlas flows.
- Animation approach: Default animation entries in manifests and an animation manager flow for loading animation files.
- License: Root `LICENSE` is MIT, copyright Atlas Foundation.

What we can reuse:

- Manifest-driven asset-pack concepts.
- Separation between studio UI, character manager, loading utilities, export utilities, and manifest data.
- Export and screenshot capability as architecture inspiration.
- Trait grouping concepts for hair, clothing, accessories, and animation presets.

What we should avoid:

- Do not copy the full app architecture. It includes unrelated blockchain/wallet/security/service concerns.
- Do not assume its asset packs are covered by the CharacterStudio MIT code license.
- Do not ship its bundled or referenced public assets unless each asset license is verified.
- Do not make VRM/glB export a v1 dependency; keep it future-compatible.

Risks:

- Asset references often point to external asset packs with unclear licensing.
- Current code is JavaScript-heavy and app-specific, while our architecture should be TypeScript package-first.
- Some features are beyond our MVP and could distract from the core iframe-first builder.

Recommended role:

- Primary reference for trait manifests, avatar studio architecture, and export vocabulary.
- Use as a design reference, not as a codebase to fork.

## loot-assets

- Source: https://github.com/m3-org/loot-assets
- Local path: `external/loot-assets`
- Purpose: Remixable 3D avatar/game assets inspired by Loot.
- Package structure: Asset directories such as `0N1`, `anata`, `animations`, `blends`, `loot`, `tubbycats`, plus `scripts`, `manifest.json`, and `package.json`.
- Rendering approach: No app renderer. Assets and manifests are intended to be consumed by tools like CharacterStudio.
- Avatar asset approach: Multiple nested manifests for character/avatar packs and animations.
- Export approach: No product export flow found; this is an asset pack.
- Animation approach: Includes an `animations` directory and manifest entries.
- License: No root `LICENSE`, `LICENSE.md`, `COPYING`, or explicit license field found locally.

What we can reuse:

- Manifest shape and asset-pack organization as a reference.
- Naming/category patterns for trait packs.

What we should avoid:

- Do not copy or ship any meshes, textures, thumbnails, portraits, animation files, or blend files until license and provenance are confirmed.
- Do not imply that "remixable" is enough for commercial/product reuse.

Risks:

- No local license file means default copyright rules apply.
- It may contain third-party models or collections with different rights.
- NFT/Loot-related references may introduce brand or provenance complexity.

Recommended role:

- Reference only for asset-pack layout.
- Use placeholder primitive assets in our repo until a license-cleared asset source is chosen.

## character-assets

- Source: https://github.com/memelotsqui/character-assets
- Local path: `external/character-assets`
- Purpose: 3D assets for Webaverse-style characters, with generated manifests.
- Package structure: `drophunter`, `neurohacker`, `_utilities`, `manifest.json`, `personality.json`, and `Manifest-Creation.md`.
- Rendering approach: No app renderer. Assets are referenced through manifests.
- Avatar asset approach: Character manifests point to VRM-like packs and trait categories.
- Export approach: No product export flow found; this is an asset pack.
- Animation approach: Not a primary focus in the top-level structure inspected.
- License: No root license file found locally. `Manifest-Creation.md` contains metadata examples including `commercialUssageName`, which reinforces the need to verify permissions.

What we can reuse:

- Manifest generation ideas.
- Character class and trait taxonomy ideas.

What we should avoid:

- Do not copy meshes, textures, icons, portraits, generated manifests, or personality data into our product until license is confirmed.
- Do not rely on this as a production asset source for v1.

Risks:

- No visible root license.
- Fork/provenance chain may include Webaverse assets with separate rights.
- Metadata mentions commercial-usage concepts, so reuse may vary per asset.

Recommended role:

- Reference only for manifest and category structure.
- Treat all assets as unsafe for direct reuse unless a future license audit clears them.

## kalidoface-3d

- Source: https://github.com/yeemachine/kalidoface-3d
- Local path: `external/kalidoface-3d`
- Purpose: Web app for face/body tracking and driving VRM avatars.
- Package structure: Vite/Svelte-style app with `index.html`, `docs`, `package.json`, and a Glitch-oriented setup.
- Rendering approach: Three.js and `@pixiv/three-vrm`, with MediaPipe scripts loaded in `index.html`.
- Avatar asset approach: User can drag and drop VRM models; README says models are saved locally.
- Export approach: No avatar builder export path for our use case; the app focuses on live tracking and presentation.
- Animation approach: Uses MediaPipe Holistic/Face Mesh and Kalidokit-style rigging for live tracking.
- License: Root `LICENSE` includes MIT text. `package.json` says `ISC`, so there is a local license mismatch to note.

What we can reuse:

- Concepts for mapping face/body landmarks to VRM rig/expression motion.
- Browser-only tracking privacy posture.
- Ideas for local model handling and live avatar animation.

What we should avoid:

- Do not copy sample VRM models. README says sample VRMs are not owned by the repo author and credits belong to Vroid Hub creators.
- Do not adopt its older dependency stack directly. It uses older MediaPipe packages, TFJS packages, Svelte tooling, and Glitch-era assumptions.
- Do not make live webcam VTubing part of the v1 photo-assisted builder.

Risks:

- License mismatch between root license and `package.json`.
- Sample avatar/model rights are explicitly uncertain.
- Live tracking is a different product surface than our selfie-assisted preset matching.

Recommended role:

- Animation and landmark-to-rigging reference only.
- For our MVP, use MediaPipe Tasks Vision for static selfie landmark extraction and keep basic idle animation in the renderer.

## visage

- Source: https://github.com/readyplayerme/visage
- Local path: `external/visage`
- Purpose: React/Three package for displaying Ready Player Me avatars and 3D models on the web.
- Package structure: TypeScript package with `src/components`, `src/services`, `src/types`, `src/state`, Storybook, tests, and package build scripts.
- Rendering approach: React Three Fiber, Drei, Three.js, `three-stdlib`, loaders, camera/canvas components, and model validation.
- Avatar asset approach: Takes GLB/model URLs or binary/blob input, with support for animation and pose source props.
- Export approach: Includes screenshot/capture callbacks in renderer components; not a creator/export pipeline.
- Animation approach: Supports GLB/FBX animation sources, pose sources, effects, and animation loading services.
- License: Root `LICENSE` is MIT, and `package.json` license is MIT.

What we can reuse:

- Renderer package boundaries and typed props.
- Canvas wrapper, validation, screenshot/capture, model loading, animation source handling, and test/story patterns.
- General idea of a renderer that is independent from the avatar-creation workflow.

What we should avoid:

- Do not depend on Ready Player Me APIs, assets, model naming assumptions, or hosted examples.
- Do not copy large renderer internals. Build a smaller renderer around our avatar config contract.

Risks:

- Strong product assumptions around Ready Player Me avatar models.
- Its renderer is display-focused, while our renderer must compose trait selections from JSON config.

Recommended role:

- Best reference for `packages/avatar-renderer` API shape and quality bar.
- Safe to study and cite; reuse small MIT patterns only with attribution if needed.

## r3f-ultimate-character-configurator

- Source: https://github.com/wass08/r3f-ultimate-character-configurator
- Local path: `external/r3f-ultimate-character-configurator`
- Purpose: Tutorial/demo for a React Three Fiber avatar configurator.
- Package structure: Vite React app with `src/components`, `src/assets`, `src/store.js`, and public model assets.
- Rendering approach: React Three Fiber, Drei, Three.js, `GLTFExporter`, `@gltf-transform/*`, and animated scene/camera helpers.
- Avatar asset approach: Zustand store fetches categories/assets from PocketBase, then composes selected assets onto a base skeleton.
- Export approach: `src/components/Avatar.jsx` exports GLB via `GLTFExporter` and GLTF Transform optimizations. `Experience.jsx` performs screenshot capture.
- Animation approach: Loads pose animations from `/models/Poses.glb` and switches actions by state.
- License: No root license file found locally and no license field in `package.json`.

What we can reuse:

- High-level UX ideas for simple categories, selected assets, locked groups, colors, screenshot, and GLB export.
- Zustand state shape as reference material only.

What we should avoid:

- Do not copy code or assets because no license is visible locally.
- Do not adopt PocketBase as a required dependency; our plan uses a minimal Node/Express API and SQLite.
- Do not use tutorial branding, models, images, or hosted demo assumptions.

Risks:

- No visible license means code/assets are unsafe to copy.
- Tutorial code is intentionally compact and less suitable as reusable platform architecture.
- External PocketBase dependency conflicts with our simple local API direction.

Recommended role:

- UX and state-flow inspiration only.
- Rebuild our own typed package boundaries and asset manifest model.

## Asset Reuse Policy For This Project

- Default v1 assets must be placeholder primitives or assets with explicit license files committed alongside them.
- Every imported asset pack must include source URL, license name, author/owner, allowed usage, attribution requirement, and any commercial restrictions.
- If a repo has no visible license, use it only as reference. Do not copy code, models, textures, thumbnails, generated manifests, animation files, or UI assets.
- Code under MIT can be reused with the required notice, but this project should still prefer clean-room implementation of small patterns over broad copying.
- Raw selfies are never stored. Only derived, approximate trait hints and final avatar JSON config are saved.
