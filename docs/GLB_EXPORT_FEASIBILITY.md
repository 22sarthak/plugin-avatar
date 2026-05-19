# GLB / VRM Export Feasibility

## Current Decision

GLB/VRM export is not implemented in this MVP. The current product exports avatar JSON config, public embed URLs, iframe snippets, SDK snippets, and PNG screenshots. That is intentional: our current renderer is a procedural React Three Fiber avatar made from primitive geometry, not a license-cleared, rigged, trait-based mesh pipeline.

## What CharacterStudio Supports

The local `external/CharacterStudio` reference describes an avatar studio that can export GLB/VRM avatars and screenshots. Its library includes relevant building blocks such as:

- `characterManager.js` for character loading and customization.
- `VRMExporter.js` and `VRMExporterv0.js` for VRM export.
- `download-utils.js` for download/export flows.
- `screenshotManager.js` for screenshot capture.
- mesh and texture utilities such as `merge-geometry.js`, `create-texture-atlas.js`, and KTX tooling.

Those ideas are useful architectural references, but they are not a drop-in fit for this MVP.

## Why Our MVP Is Different

Our avatar source of truth is `AvatarConfig` JSON. It stores trait choices such as skin tone, hair style, outfit, accessories, and animation. The renderer interprets that config into procedural runtime geometry.

A saved config is not the same thing as a generated GLB/VRM file:

- JSON config is small, editable, and embed-friendly.
- Procedural R3F primitives are runtime scene objects, not a stable production asset package.
- A production GLB/VRM needs mesh assets, skeletons, materials, textures, metadata, and export QA.
- VRM export especially needs rig, humanoid bone mapping, spring bones, expressions, and compatible avatar metadata.

## What Is Needed For Real Export

A safe GLB/VRM export pipeline would need:

- License-cleared trait assets for all hair, clothing, face, accessory, and body parts.
- Shared skeleton/rig compatibility across every trait combination.
- A trait manifest that maps `AvatarConfig` values to mesh/material/texture assets.
- A renderer/exporter path that assembles meshes without relying on ad hoc runtime primitives.
- Material and texture constraints that survive GLB/VRM export.
- Animation compatibility with the rig and target format.
- Thumbnail/screenshot generation for exported assets.
- Automated QA for invalid combinations, clipping, missing bones, broken materials, and file size.
- Clear license records for every shipped mesh, texture, animation, and thumbnail.

## Future Implementation Steps

1. Define an asset manifest schema for trait-based GLB/VRM parts.
2. Create or license a small starter asset pack with explicit usage rights.
3. Build a non-React asset assembler that maps `AvatarConfig` to a Three.js scene graph.
4. Add screenshot and thumbnail generation for assembled assets.
5. Prototype GLB export first with `GLTFExporter`.
6. Add VRM only after rig, humanoid metadata, expressions, and spring bone requirements are clear.
7. Add validation and tests for every supported trait combination.
8. Document exactly which export formats are production-ready and which remain experimental.

Until that pipeline exists, this platform should continue to describe GLB/VRM export as future work, not a current feature.
