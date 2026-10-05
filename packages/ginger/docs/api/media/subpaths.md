# Subpath exports

Optional entrypoints keep the default bundle focused while advanced features opt in via dedicated imports.

## `@lucaismyname/ginger/client`

Client-compatible entrypoint with `"use client"` for SSR frameworks (for example Next.js App Router).

## `@lucaismyname/ginger/testing`

Testing utilities for rendering providers, querying media elements, simulating audio events, and asserting queue state.

See [`guides/testing.md`](../guides/testing.md).

## `@lucaismyname/ginger/waveform`

Waveform and analysis utilities for visualizations and offline audio analysis:

- `useAudioFileAnalysis`, `analyzeAudioFile`, `analyzeAudioBuffer`
- `useAudioPeaks` for a lightweight single row of peaks (supports `maxBuckets` and `maxSamplesPerBucket` guardrails for large files)

## `@lucaismyname/ginger/equalizer`

Parametric EQ via `useGingerEqualizer`: inserts `BiquadFilterNode`s into the `eq` processing slot of the shared Web Audio graph. That graph is the same `AudioContext` and `MediaElementAudioSourceNode` used by `useGingerLiveAnalyzer`, `useGingerSpatialAudio`, and crossfade. The context stays open for the life of the `<audio>` element.

`setBandGain` and gain-only `setBands` updates write the filter gain directly. Changing frequency, type, or Q rebuilds the filter nodes. EQ, spatial, and effects compose (`eq` → `spatial` → `effects` → `user`); none replaces the others.

## `@lucaismyname/ginger/effects`

Declarative effects rack via `useGingerEffects`. Inserts wet/dry subgraphs into the `effects` slot of the shared Web Audio graph (after spatial, before `user` and analyser taps).

Built-in types: `delay`, `reverb` (generated stereo impulse response, or `impulseBuffer`), `distortion`, `phaser`, `chorus`, and `octaver` (analog-style rectifier / Chebyshev — not a clean pitch shifter). The chain can hold any number of effects, including duplicates.

- Param updates (`setEffect`, mix, time, …) write `AudioParam`s in place.
- Add / remove / reorder / type change rebuilds only the `effects` slot.
- Per-effect `enabled: false` is a dry bypass.
- `registerEffect(type, factory)` and `{ type: "custom", create }` add more types.

Applies to local `<audio>` playback only (not Chromecast). Incoming crossfade audio still bypasses the processing chain. Requires `Ginger.Player crossOrigin="anonymous"` for cross-origin `fileUrl`s.

## `@lucaismyname/ginger/spatial`

3D / HRTF spatial audio via `useGingerSpatialAudio`:

- Inserts a `PannerNode` in the `spatial` slot, after EQ filters and before `effects` / `user` (same graph as EQ and the live analyser).
- Options include `panningModel` (default `"HRTF"`), `distanceModel`, `refDistance`, `position`, and `listenerPosition`.
- Imperative updates: `setSourcePosition`, `setListenerPosition`, `setPanningModel`.

Useful for games, immersive players, or any UI that needs directional audio without leaving the native `<audio>` pipeline.

## `@lucaismyname/ginger/transcript`

Podcast- and caption-oriented timed text:

| Export | Purpose |
|--------|---------|
| `parseSrt` | Parse SubRip (`.srt`) strings into `TranscriptCue[]` |
| `parseVtt` | Parse WebVTT (`.vtt`) strings into `TranscriptCue[]` |
| `parseTranscriptAuto` | Detect VTT (`WEBVTT` header) vs SRT |
| `parseTimestampToSeconds` | Low-level timestamp helper |
| `useGingerTranscriptSync` | React hook: `activeCue`, `activeCues` (overlaps), `activeIndex`, synced to `currentTime` |

Cue text has HTML tags stripped (typical WebVTT markup). For in-track **LRC** lyrics on `Track`, the main package still provides `useGingerLyricsSync` and `parseLrc()`.

## `@lucaismyname/ginger/remote`

Multi-tab coordination with `BroadcastChannel` and `useGingerRemote`:

- **Leader election** — PING / PONG, `LEADER_ANNOUNCE` with deterministic tie-break (lexicographic `tabId`).
- **State sync** — Leader broadcasts `STATE_SNAPSHOT` payloads (`INIT`, including `currentTime`) and a throttled `TIME_SYNC` (`currentTime` + `duration`) about once a second while playback position moves. Followers apply snapshots with `init()` and time updates with `seek()`.
- **Single audio element** — Mount `Ginger.Player` only when `isLeader` is true so one tab owns playback.

Options: `channelName` (default `"ginger-remote"`), `heartbeatMs`, `electionTimeoutMs`. Snapshots use `isShuffled: false` with the leader’s current `tracks` array so follower queue order matches without re-shuffling.

Requires `BroadcastChannel` (not available in some SSR environments); the hook sets `error` when unsupported.

The subpath also exports **`DEFAULT_REMOTE_CHANNEL_NAME`** and the **`RemoteMessage`** type for apps that want to share channel constants or type custom protocol helpers.

## `@lucaismyname/ginger/cast`

Chromecast **Web Sender** (Cast Application Framework) integration:

- **`loadCastFramework()`** — idempotent loader for Google’s sender script; call before using Cast APIs.
- **`useGingerCast()`** — session lifecycle (`requestSession`, `endSession`), sender-driven **`loadMedia`** for the current `Track`, and rough play/pause/seek sync via **`RemotePlayer` / `RemotePlayerController`**.
- **`trackToMediaInfo()`** / **`guessContentTypeFromUrl()`** — build `chrome.cast.media.LoadRequest` values from `Track` (advanced use).

**Constraints:** Cast requires **HTTPS** in production (localhost is exempt for development). **`Track.fileUrl`** must be reachable by the **Cast device** with correct **CORS** (browser-only headers are not enough). Avoid **mixed content** (HTTP audio on an HTTPS page).

Prefer **`{!isCasting && <Ginger.Player />}`** so the browser does not decode the same URLs as the TV. Optional **`syncLocalAudio: "pause-mute"`** mutes the local `<audio>` element while connected without changing Ginger state.

## `@lucaismyname/ginger/crossfade`

Web Audio–based **overlap** between outgoing and incoming media (distinct from the long-term **gapless** roadmap in [`GAPLESS_ROADMAP.md`](../GAPLESS_ROADMAP.md), which targets seamless *adjacent* track transitions on a single element).

| Export | Purpose |
|--------|---------|
| **`useGingerCrossfade`** | React hook: fade the active Ginger `<audio>` element into the next track. Returns `isCrossfading`, `crossfadeProgress`, and `error` when the shared graph cannot be attached. |
| **`attachCrossfadeGraph`**, **`scheduleCrossfade`**, **`teardownCrossfadeGraph`** | Imperative helpers (`CrossfadeGraph`, `CrossfadeCurve`). Teardown disconnects the incoming element and restores the main route. It does **not** close the `AudioContext`. |

Crossfade uses the same long-lived context as EQ, spatial audio, effects, and the live analyzer. The outgoing track runs through that processing chain; the incoming track is a second `<audio>` element gained straight to the destination for the length of the fade. While a fade is active, `Ginger.Player` ignores the outgoing element’s `ended` event so the queue advances once, when the ramp finishes. Call `teardownCrossfadeGraph` if you attached a graph yourself and need to abort it.

## `@lucaismyname/ginger/devtools`

Development-only debugging overlay: import **`GingerDevtools`** from **`@lucaismyname/ginger/devtools`** and render it once anywhere in the app (even outside **`Ginger.Provider`**). It discovers every active provider via a small global registry, supports multiple players (tabs / **`debugLabel`** on **`Ginger.Provider`**), and can drive playback actions (play/pause, seek, volume, queue) in addition to showing state. Styling uses Tailwind via CDN injected on mount. See the root [`README.md`](../../README.md) for usage.

## `@lucaismyname/ginger/experimental-gapless`

Gapless **environment** probe (Milestone 1); Ginger playback is still a single `<audio>` via `Ginger.Player`.

- `probeGaplessCapability()` — pure function, safe on SSR (returns unsupported when `window` is missing).
- `useExperimentalGapless()` — React hook combining the probe with `preloadedTrackIds` from the current queue.

## Generated API

The TypeDoc build includes the main [`src/index.ts`](../../src/index.ts) entry **and** subpath entry files (see [`typedoc.json`](../../typedoc.json)), including **`cast`**, **`crossfade`**, and **`effects`**. The docs landing page is [`api-overview.md`](../api-overview.md). This file is the canonical hand-written reference for subpaths; import paths match [`package.json` `exports`](../../package.json).

---

## Docs layout

For a map of everything under `docs/` (Markdown vs generated HTML), see [`README.md`](../README.md).
