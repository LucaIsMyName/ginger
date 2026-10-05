# API documentation

Ginger ships two complementary documentation layers:

1. **Markdown guides** under [`docs/`](./) (getting started, references, guides).
2. **Generated TypeDoc HTML** under [`docs/api/`](./api/) — open [`api/index.html`](./api/index.html) after running `npm run docs:api` from `packages/ginger`.

The TypeDoc build uses [`typedoc.json`](../typedoc.json), which points its `readme` field at this file and includes the **main** package entry ([`src/index.ts`](../src/index.ts)) plus the resolved subpath entry files. That keeps the generated landing page aligned with the current `package.json` exports for `@lucaismyname/ginger/*`.

## Import map

| Import | Purpose |
|--------|---------|
| `@lucaismyname/ginger` | `Ginger` namespace, hooks, utilities, types |
| `@lucaismyname/ginger/client` | Same public surface with `"use client"` for RSC / Next App Router |
| `@lucaismyname/ginger/testing` | `renderGinger`, media event helpers, queue assertions |
| `@lucaismyname/ginger/waveform` | Peaks, `analyzeAudioFile`, `useAudioPeaks`, … |
| `@lucaismyname/ginger/equalizer` | Parametric EQ (`useGingerEqualizer`) |
| `@lucaismyname/ginger/effects` | Effects rack (`useGingerEffects`, `registerEffect`) |
| `@lucaismyname/ginger/spatial` | HRTF / panning (`useGingerSpatialAudio`) |
| `@lucaismyname/ginger/transcript` | SRT/VTT parsers + `useGingerTranscriptSync` |
| `@lucaismyname/ginger/remote` | Multi-tab sync (`useGingerRemote`) |
| `@lucaismyname/ginger/cast` | Chromecast Web Sender (`useGingerCast`, `loadCastFramework`, `trackToMediaInfo`) |
| `@lucaismyname/ginger/crossfade` | Web Audio crossfade graph helpers + `useGingerCrossfade` |
| `@lucaismyname/ginger/devtools` | `GingerDevtools` overlay for debugging and controlling players (multi-provider aware) |
| `@lucaismyname/ginger/experimental-gapless` | Environment capability probe (single-`<audio>` playback unchanged) |

## Narrative reference

- Release history: [`CHANGELOG.md`](../CHANGELOG.md)
- Subpath behavior and when to use each: canonical [`reference/subpaths.md`](./reference/subpaths.md)
- Package overview and install: root [`README.md`](../README.md)
- Docs folder map: [`README.md`](./README.md)

## Regenerate HTML

```bash
cd packages/ginger
npm run docs:api
```

Output is written to `docs/api/`. The `readme` field in `typedoc.json` points at this file so the TypeDoc landing page stays aligned with the repo.
Files under `docs/api/media/` are support assets for that generated output and should stay minimal when a hand-written canonical page already exists elsewhere in `docs/`.
