# Hooks reference

Hooks must run under **`Ginger.Provider`** unless documented otherwise (e.g. `createGingerStore` for non-React use).

For **import paths** of EQ, spatial, transcript, remote, crossfade, see [`subpaths.md`](./subpaths.md). For generated signatures, open [`../api/index.html`](../api/index.html).

---

## Core state and actions

| Hook | When to use |
|------|-------------|
| **`useGinger()`** | Default choice: merged **playback + media** state, actions (`play`, `next`, `seek`, …), and `state` for full `GingerState`. Also exposes `dispatch` as an escape hatch for reducer actions. Re-renders on time ticks. |
| **`useGingerState()`** | Same merged snapshot as `useGinger().state`, without actions — recomputes when **either** playback or media context changes (including every time tick). |
| **`useGingerMetadataState()`** | Playback plus volume/mute/rate, **without** subscribing to time ticks. Time fields on the returned state stay at idle values. Used by title, artwork, and queue-meta components. |
| **`useGingerClockState()`** | Playback plus the time slice. Used by elapsed/duration rails and `PlaybackState`. Re-renders on time ticks. |
| **`useGingerPlayback()`** | Only queue, pause, repeat, shuffle, navigation — **fewer re-renders** than full state when the subtree does not need `currentTime` / volume. |
| **`useGingerMedia()`** | Only time, duration, buffer, volume, mute, rate, seek — **fewer re-renders** when the subtree does not need queue/repeat. Re-renders on time ticks. |
| **`useGingerTime()`** | Time slice only: `currentTime`, `duration`, `bufferedFraction`, `isBuffering`, `errorMessage`. |
| **`useGingerMediaControls()`** | Volume, mute, rate, and media actions. Does **not** re-render on time ticks. |

Use **`gingerStateFromContexts(playback, media)`** or **`gingerStateFromContextValues(...)`** when composing tests or non-React code that already has both slices.

---

## Locale

| Hook | Purpose |
|------|---------|
| **`useGingerLocale()`** | Localized strings for controls (play/pause, seek, playback rate labels, …). Override via **`Ginger.Provider`** `locale` prop. |

---

## Control bindings (headless UI)

| Hook | Returns (conceptually) |
|------|-------------------------|
| **`usePlayPauseBinding()`** | `toggle`, `isPaused`, `ariaLabel` for custom play/pause buttons. |
| **`useSeekBarBinding()`** | Range props + `aria` for custom seek sliders. |
| **`useVolumeSlider()`** | Volume range props + mute-related wiring. |

Pair these with your own components to avoid re-rendering prebuilt **`Ginger.Control.*`** trees.

---

## Keyboard and input helpers

| Hook | Purpose |
|------|---------|
| **`useGingerKeyboardShortcuts()`** | Opt-in global key handlers (play/pause, seek, volume, …) driven by a bindings map. |
| **`useSeekDrag()`** | Pointer-driven seek drag state for custom scrubbers (coordinates + commit). |

---

## Chapters and lyrics

| Hook | Purpose |
|------|---------|
| **`useGingerChapters()`** | Parses `Track.chapters`, exposes active chapter by `currentTime`. |
| **`useGingerChapterProgress()`** | Per-chapter progress fractions for UI segments. |
| **`useGingerLyricsSync()`** | Active LRC line from `Track` lyrics + `currentTime`. |

Root also exports **`parseLrc()`** for manual parsing.

---

## Analyzer (Web Audio)

| Hook / helper | Purpose |
|---------------|---------|
| **`useGingerLiveAnalyzer()`** | Frequency/time-domain byte arrays updated on `requestAnimationFrame` (mutated buffers; use `frame` counter to re-render). |
| **`attachLiveAnalyser` / `detachLiveAnalyser`** | Tap the shared media-element graph. Detaching the last analyser keeps the `AudioContext` open and routes the source to the destination. |
| **`setProcessingSlot`** | Set the `eq`, `spatial`, or `user` slot. Slots concatenate in that order. |
| **`setProcessingChain`** | Set the `user` slot only. Does not clear EQ or spatial. |

---

## Optional product features

| Hook | Purpose |
|------|---------|
| **`useGingerSleepTimer()`** | Pause after `durationMs` and/or `stopAfterTracks` forward advances (next, natural end, repeat-all wrap). Previous and shuffle do not count. |
| **`useGingerDebugLog()`** | Structured console logging of state transitions (dev tooling). |
| **`useNextTrackPrefetch()`** | Hint next resource load for faster track changes. |
| **`useGingerPlaybackHistory()`** | Append-only history of played tracks for “recently played” UIs. |
| **`useGingerVolumeFade()`** | Smooth volume ramps with `requestAnimationFrame`. |

---

## Framework-agnostic store

| Export | Purpose |
|--------|---------|
| **`createGingerStore()`** | **`GingerStore`**: same reducer as React, usable in workers or tests without `Ginger.Provider`. See [`store.test.ts`](../../src/store.test.ts). |

---

## Subpath-only hooks

Imported from **`@lucaismyname/ginger/<subpath>`** — see [`subpaths.md`](./subpaths.md).

| Module | Hook |
|--------|------|
| `equalizer` | **`useGingerEqualizer()`** |
| `spatial` | **`useGingerSpatialAudio()`** |
| `transcript` | **`useGingerTranscriptSync()`** (+ parsers) |
| `remote` | **`useGingerRemote()`** |
| `crossfade` | **`useGingerCrossfade()`** (+ graph helpers) |
| `experimental-gapless` | **`useExperimentalGapless()`** (capability only) |

---

## Utilities (root package)

| Export | Purpose |
|--------|---------|
| **`clampPlaybackRate()` / `clampVolume()`** | Same clamps as the provider. |
| **`derivePlaybackUiState()`** | Maps `GingerState` to a compact UI enum for `data-ginger-playback` and styling. |
| **`parseLrc()`** | LRC → timed lines. |
