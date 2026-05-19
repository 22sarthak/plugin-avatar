# Animations

Avatar animations are procedural in `packages/avatar-renderer`. They do not use paid APIs, GLB animation clips, webcam tracking, or Kalidoface integration. Kalidoface remains a future reference for VRM/live tracking only.

## Saved Animation Names

New avatar configs should save one of these canonical names in `AvatarConfig.animation`:

- `idle_breathing`
- `small_bounce`
- `tiny_shake`
- `wave`
- `sleep_float`
- `slide_in`
- `slide_out`
- `lean_left`
- `lean_right`

Legacy values are still accepted:

- `idle` maps to `idle_breathing`
- `bounce` maps to `small_bounce`
- `celebrate` maps to `small_bounce`

## One-Shot Previews

Studio can trigger temporary one-shot previews without changing the saved config:

- `wave`
- `tiny_shake`
- `slide_in`
- `slide_out`
- `lean_left`
- `lean_right`

These are passed to `AvatarRenderer` with `oneShotAnimation` and cleared through `onOneShotComplete`.

## Iframe Viewer

The public iframe viewer intentionally keeps a small query API:

```html
<iframe src="http://localhost:5174/embed/avatar/public_embed_id?animation=idle"></iframe>
<iframe src="http://localhost:5174/embed/avatar/public_embed_id?animation=bounce"></iframe>
<iframe src="http://localhost:5174/embed/avatar/public_embed_id?animation=wave"></iframe>
```

The aliases map to renderer animations:

- `idle` -> `idle_breathing`
- `bounce` -> `small_bounce`
- `wave` -> `wave`

## SDK Viewer

```ts
AvatarStudio.renderAvatar({
  container: "#avatar",
  publicEmbedId: "public_embed_id",
  studioBaseUrl: "http://localhost:5174",
  animation: "bounce",
  controls: true
});
```

The SDK uses the same viewer aliases as the iframe route: `idle`, `bounce`, and `wave`.

## Reduced Motion

`AvatarRenderer` checks `prefers-reduced-motion`. Continuous animations become static or very subtle. User-triggered one-shot previews are shortened and reduced, with slide and shake movement dampened.
