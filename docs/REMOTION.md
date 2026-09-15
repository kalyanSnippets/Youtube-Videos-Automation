# Remotion

`packages/remotion` is a standalone Remotion workspace (`pnpm --filter @yaos/remotion dev` opens
Remotion Studio). It exists so the Edit Director can select a **component key**, never hand-roll
a scene from scratch: `packages/remotion/src/catalog.ts` is the single registry of every motion
template, and `packages/database`'s `motion_templates` table mirrors it (seeded from the same
catalog array — see `packages/seed-scripts/src/index.ts`).

## Catalog

31 templates are catalogued (`MOTION_TEMPLATE_CATALOG`), each with a `category`
(`hook | typography | evidence | structure | transition | cta | on_camera`) and a
`defaultIntensity` (`LOW | MEDIUM | HIGH`). 19 have real components today (`implemented: true`);
the rest are reserved keys with a defined intent, visible in the Motion Templates page as
"Planned":

**Implemented**: `HyperHook`, `HyperTitle`, `KeywordBurst`, `BrowserFrame`, `ScoreCard`,
`StatCounter`, `WarningReveal`, `Comparison`, `RankingStack`, `Checklist`, `CTA`, `EndScreen`,
`TalkingHeadFrame`, `PictureInPicture`, `CreatorLowerThird`, `CreatorReaction`,
`ScreenAndFaceSplit`, `PunchIn`, `ArollToDemoTransition`

**Planned**: `BrowserZoom`, `CursorCallout`, `FeatureTag`, `ProductIntro`, `PriceCard`, `Timeline`,
`MiniChart`, `ResultReveal`, `BeforeAfter`, `SplitScreen`, `QuoteCard`, `SectionTransition`

The `on_camera` category (`TalkingHeadFrame` through `PunchIn`, plus the `transition`-categorized
`ArollToDemoTransition`) exists specifically for `FACE_LED`/`HYBRID` production — see
`docs/PRESENTATION-MODES.md`. Every one of them accepts its video content as `children`/named
content props rather than fabricating footage; without real content supplied they render a
labeled placeholder frame so the composition still previews sensibly in Remotion Studio.

Building one of the planned templates means adding a component under `src/components/`, adding
its entry to `catalog.ts` with `implemented: true`, registering a `<Composition>` in `Root.tsx`,
and re-running the seed (or updating the `motion_templates` row) so the Edit Director can select it.

## Component conventions

All components share `src/primitives.tsx`:

- `THEME` — the same cyan/purple/dark palette as the web app, so a rendered video visually
  matches the control-centre brand.
- `SafeArea` — wraps content in the 80px title/action-safe padding used by every template.
- `useEnter(delayFrames, springConfig)` — a `spring()`-based 0-1 entrance progress value.
- `fadeSlideStyle(progress, distancePx)` — the standard fade+slide-up treatment.

Animation is frame-based (`useCurrentFrame()`, `interpolate()`, `spring()`) and deterministic —
no CSS transitions, no `setTimeout`, no reliance on wall-clock time — so a render is reproducible
frame-for-frame. Every component takes typed props (see each file's `*Props` interface) and is
parameterized rather than hardcoding copy.

## Resolutions

Compositions are registered at 1920×1080 (16:9) today. Shorts (1080×1920) is planned as an
independent composition set per template rather than a crop of the 16:9 version — see the
product spec's Shorts Pipeline section; a vertical composition needs its own framing, caption
sizing, and split-screen layout, not just different `width`/`height` on the same JSX.

## Type-checking `<Composition>`

Remotion's `Composition` component is generic over a Zod `Schema` and a `Props` type
(`CompositionProps<Schema, Props>`). Since these components don't use Remotion's Zod-schema-props
feature, every `<Composition>` usage in `Root.tsx` passes explicit type arguments
(`<Composition<any, any> ...>`) — without them, TypeScript can't infer `Props` from `component`
alone and every `defaultProps` object fails to type-check against `Record<string, unknown>`.

## Rendering (Phase 6, planned)

`render()` on the local worker's `RenderProvider` implementation will call
`@remotion/renderer`'s `renderMedia()` against the `entry.tsx` bundle, passing the edit plan's
resolved component keys and props, then mux the result with processed narration audio via
`@yaos/ffmpeg`'s `muxVideoAudio()`. See `docs/LOCAL-WORKER.md`.
