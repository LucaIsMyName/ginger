# @lucaismyname/ginger

A headless react audio primitive for music and podcast UIs on the native **`<audio>`** element: a reducer-backed provider, composable **`Ginger.*`** components, and **`useGinger()`** for full control. Many pieces ship sensible defaults (CSS variables, layout helpers); use **`unstyled`** (and related flags below) when you want **behavior and data only**, with your own styling.

**Peer dependencies:** **`react` ≥ 18** (required). **`react-dom` ≥ 18** is listed as a peer for typical DOM apps; it is **optional** in `peerDependenciesMeta`, so setups that do not use `react-dom` can omit it when appropriate.

## Install

```bash
npm install @lucaismyname/ginger
```

## Changelog

Release notes live in [`CHANGELOG.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/CHANGELOG.md) (also **published on npm** next to this readme).

## Quick Start

```tsx
import { Ginger } from "@lucaismyname/ginger";

const tracks = [
  {
    id: "one",
    title: "One",
    artist: "Demo Artist",
    fileUrl: "https://example.com/audio/one.mp3",
    artworkUrl: "https://example.com/art/one.jpg",
  },
  {
    id: "two",
    title: "Two",
    artist: "Demo Artist",
    fileUrl: "https://example.com/audio/two.mp3",
  },
];

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks} initialPlaylistMeta={{ title: "My Playlist" }}>
      <Ginger.Player />
      <Ginger.Current.Title />
      <Ginger.Current.Artist />
      <Ginger.Control.PlayPause />
      <Ginger.Control.Next />
      <Ginger.Playlist />
    </Ginger.Provider>
  );
}
```

Mount **`<Ginger.Player />`** once inside the same provider tree so the hidden audio element exists. Everything else is optional and can be replaced with your own UI (including hooks only).

## Documentation

For docs beyond this README, use the repository links below:

- **Changelog**: [`CHANGELOG.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/CHANGELOG.md)
- **Docs folder map** (Markdown vs generated API): [`docs/README.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/README.md)
- Getting started: [`docs/getting-started.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/getting-started.md)
- Testing guide: [`docs/guides/testing.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/guides/testing.md)
- Recipes: [`docs/guides/recipes.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/guides/recipes.md)
- Accessibility checklist: [`docs/guides/accessibility.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/guides/accessibility.md)
- Streaming adapters: [`docs/guides/streaming-adapters.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/guides/streaming-adapters.md)
- Components reference: [`docs/reference/components.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/reference/components.md)
- Hooks reference: [`docs/reference/hooks.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/reference/hooks.md)
- Subpath exports (waveform, EQ, spatial, transcript, remote, cast, crossfade, …): [`docs/reference/subpaths.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/reference/subpaths.md)
- Generated API docs: [`docs/api/index.html`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/api/index.html)

## Subpath Exports

Optional entrypoints keep the core bundle small. **Copy-paste starters** (full `Ginger.Provider` + `Ginger.Player` + subpath wiring) are in [Subpath copy-paste starters](#subpath-copy-paste-starters) below.

- `@lucaismyname/ginger/client`
- `@lucaismyname/ginger/testing`
- `@lucaismyname/ginger/waveform`
- `@lucaismyname/ginger/equalizer`
- `@lucaismyname/ginger/spatial`
- `@lucaismyname/ginger/transcript`
- `@lucaismyname/ginger/remote`
- `@lucaismyname/ginger/cast`
- `@lucaismyname/ginger/crossfade`
- `@lucaismyname/ginger/experimental-gapless`
- `@lucaismyname/ginger/devtools`

### Subpath Examples

Each snippet is a **single-file starting point**: replace `/your-audio.mp3` (or any `fileUrl`) with a real URL, then layer your UI. Imports use the published package names.

#### <a id="subpath-starter-client"></a> `@lucaismyname/ginger/client`

Same API as the root package, with a `"use client"` directive for React Server Components (for example Next.js App Router).

```tsx
"use client";

import { Ginger } from "@lucaismyname/ginger/client";

const tracks = [{ title: "Demo", fileUrl: "/your-audio.mp3" }];

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      <Ginger.Control.PlayPause />
    </Ginger.Provider>
  );
}
```

#### <a id="subpath-starter-testing"></a> `@lucaismyname/ginger/testing`

Vitest (or Jest) example: `renderGinger` wraps **`Ginger.Provider`** and optionally **`Ginger.Player`**.

```tsx
import type { Track } from "@lucaismyname/ginger";
import { queryAudio, renderGinger } from "@lucaismyname/ginger/testing";
import { describe, expect, it } from "vitest";

const tracks: Track[] = [{ title: "Demo", fileUrl: "/your-audio.mp3" }];

describe("Ginger", () => {
  it("mounts audio", () => {
    const { container } = renderGinger(<p>ok</p>, { tracks });
    expect(queryAudio(container)).toBeTruthy();
  });
});
```

#### <a id="subpath-starter-waveform"></a> `@lucaismyname/ginger/waveform`

`useAudioPeaks` reads the **same** URL as the current track (offline scan; keep files reasonably small).

```tsx
import { Ginger, useGinger } from "@lucaismyname/ginger";
import { useAudioPeaks } from "@lucaismyname/ginger/waveform";

const tracks = [{ title: "Demo", fileUrl: "/your-audio.mp3" }];

function PeaksRow() {
  const { currentTrack } = useGinger();
  const { peaks, isLoading, error } = useAudioPeaks(currentTrack?.fileUrl, 32);
  if (error) return <p>{error}</p>;
  if (isLoading) return <p>Scanning…</p>;
  return (
    <div style={{ display: "flex", gap: 1, height: 24, alignItems: "flex-end" }}>
      {peaks.map((p, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: `${Math.max(2, p * 24)}px`,
            background: "#ea580c",
          }}
        />
      ))}
    </div>
  );
}

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      <Ginger.Control.PlayPause />
      <PeaksRow />
    </Ginger.Provider>
  );
}
```

#### <a id="subpath-starter-equalizer"></a> `@lucaismyname/ginger/equalizer`

```tsx
import { Ginger } from "@lucaismyname/ginger";
import { useGingerEqualizer } from "@lucaismyname/ginger/equalizer";

const tracks = [{ title: "Demo", fileUrl: "/your-audio.mp3" }];

function EqSliders() {
  const { setBandGain, bands, error } = useGingerEqualizer({
    bands: [
      { frequency: 60 },
      { frequency: 250 },
      { frequency: 1000 },
      { frequency: 4000 },
      { frequency: 16000 },
    ],
  });
  return (
    <div>
      {bands.map((band, i) => (
        <input
          key={band.frequency}
          type="range"
          min={-12}
          max={12}
          step={0.5}
          defaultValue={0}
          onChange={(e) => setBandGain(i, Number(e.target.value))}
          aria-label={`${band.frequency} Hz`}
        />
      ))}
      {error && <p>{error}</p>}
    </div>
  );
}

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      <Ginger.Control.PlayPause />
      <EqSliders />
    </Ginger.Provider>
  );
}
```

#### <a id="subpath-starter-spatial"></a> `@lucaismyname/ginger/spatial`

```tsx
import { Ginger } from "@lucaismyname/ginger";
import { useGingerSpatialAudio } from "@lucaismyname/ginger/spatial";

const tracks = [{ title: "Demo", fileUrl: "/your-audio.mp3" }];

function SpatialControls() {
  const { setSourcePosition, error } = useGingerSpatialAudio({
    panningModel: "HRTF",
    position: [2, 0, 0],
    listenerPosition: [0, 0, 0],
  });
  return (
    <div>
      <button type="button" onClick={() => setSourcePosition(0, 0, -2)}>
        Move source
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      <Ginger.Control.PlayPause />
      <SpatialControls />
    </Ginger.Provider>
  );
}
```

#### <a id="subpath-starter-transcript"></a> `@lucaismyname/ginger/transcript`

```tsx
import { Ginger } from "@lucaismyname/ginger";
import { useGingerTranscriptSync } from "@lucaismyname/ginger/transcript";

const tracks = [{ title: "Demo", fileUrl: "/your-audio.mp3" }];

const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hello from VTT
`;

function TranscriptPanel() {
  const { activeCue, activeCues } = useGingerTranscriptSync({
    transcript: vtt,
    format: "auto",
  });
  return (
    <div>
      <p>Now: {activeCue?.text ?? "—"}</p>
      <p>Overlapping: {activeCues.map((c) => c.text).join(" · ")}</p>
    </div>
  );
}

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      <Ginger.Control.PlayPause />
      <TranscriptPanel />
    </Ginger.Provider>
  );
}
```

#### <a id="subpath-starter-remote"></a> `@lucaismyname/ginger/remote`

```tsx
import { Ginger } from "@lucaismyname/ginger";
import { useGingerRemote } from "@lucaismyname/ginger/remote";

const tracks = [{ title: "Demo", fileUrl: "/your-audio.mp3" }];

function RemoteShell() {
  const { isLeader, isPending, error } = useGingerRemote({
    channelName: "my-app-ginger",
  });
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {isLeader && <Ginger.Player />}
      {isPending && <p>Connecting to other tabs…</p>}
    </>
  );
}

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <RemoteShell />
      {/* Transport controls still work in every tab */}
      <Ginger.Control.PlayPause />
    </Ginger.Provider>
  );
}
```

#### <a id="subpath-starter-cast"></a> `@lucaismyname/ginger/cast`

Cast needs **HTTPS** in production; use a real HTTPS `fileUrl` the receiver can fetch.

```tsx
import { Ginger } from "@lucaismyname/ginger";
import { useGingerCast } from "@lucaismyname/ginger/cast";

const tracks = [{ title: "Demo", fileUrl: "https://your.cdn/your-audio.mp3" }];

function CastShell() {
  const { isCasting, requestSession, endSession, error } = useGingerCast();
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={() => void requestSession()}>
        Cast
      </button>
      <button type="button" onClick={endSession}>
        Stop casting
      </button>
      {!isCasting && <Ginger.Player />}
    </>
  );
}

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <CastShell />
      <Ginger.Control.PlayPause />
    </Ginger.Provider>
  );
}
```

#### <a id="subpath-starter-crossfade"></a> `@lucaismyname/ginger/crossfade`

```tsx
import { Ginger } from "@lucaismyname/ginger";
import { useGingerCrossfade } from "@lucaismyname/ginger/crossfade";

const tracks = [
  { title: "A", fileUrl: "/your-audio-a.mp3" },
  { title: "B", fileUrl: "/your-audio-b.mp3" },
];

function CrossfadeReadout() {
  const { status, error } = useGingerCrossfade({
    enabled: true,
    duration: 1.2,
  });
  return (
    <div>
      <p>Crossfade: {status}</p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      <Ginger.Control.PlayPause />
      <Ginger.Control.Next />
      <CrossfadeReadout />
    </Ginger.Provider>
  );
}
```

#### <a id="subpath-starter-experimental-gapless"></a> `@lucaismyname/ginger/experimental-gapless`

Probe only; does **not** change playback.

```tsx
import { Ginger } from "@lucaismyname/ginger";
import { useExperimentalGapless } from "@lucaismyname/ginger/experimental-gapless";

const tracks = [{ title: "Demo", fileUrl: "/your-audio.mp3" }];

function GaplessProbe() {
  const { supported, reason, gingerGaplessPlayback, preloadedTrackIds } =
    useExperimentalGapless();
  return (
    <pre style={{ fontSize: 12 }}>
      {JSON.stringify(
        { supported, reason, gingerGaplessPlayback, preloadedTrackIds },
        null,
        2,
      )}
    </pre>
  );
}

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      <Ginger.Control.PlayPause />
      <GaplessProbe />
    </Ginger.Provider>
  );
}
```

#### <a id="subpath-starter-devtools"></a> `@lucaismyname/ginger/devtools`

`GingerDevtools` may sit **outside** `Ginger.Provider`; it discovers all registered players.

```tsx
import { Ginger } from "@lucaismyname/ginger";
import { GingerDevtools } from "@lucaismyname/ginger/devtools";

const tracks = [{ title: "Demo", fileUrl: "/your-audio.mp3" }];

export function App() {
  return (
    <>
      <Ginger.Provider debugLabel="Main" initialTracks={tracks}>
        <Ginger.Player />
        <Ginger.Control.PlayPause />
      </Ginger.Provider>
      <GingerDevtools />
    </>
  );
}
```

### Equalizer

**Full shell:** [Equalizer starter](#subpath-starter-equalizer) (above). The EQ and `useGingerLiveAnalyzer` share the same `AudioContext` and can be used together. EQ filters are inserted before the analyser in the Web Audio graph.

### Spatial audio (`@lucaismyname/ginger/spatial`)

Inserts an HRTF **`PannerNode`** into the same Web Audio graph as the EQ and live analyser (one `MediaElementAudioSourceNode` per `<audio>`). **Full shell:** [Spatial starter](#subpath-starter-spatial). Use **`setListenerPosition`** and **`setPanningModel`** for runtime updates without rebuilding the graph.

### Transcript (`@lucaismyname/ginger/transcript`)

Parse **SRT** and **WebVTT** captions and sync cues to playback time (podcasts, video-style transcripts). HTML tags in cue text are stripped. **Full shell:** [Transcript starter](#subpath-starter-transcript).

**`useGingerTranscriptSync`** mirrors **`useGingerLyricsSync`** but uses cue **start/end** ranges and exposes **`activeCues`** for overlapping captions. **`parseTranscriptAuto`** chooses VTT when the string starts with `WEBVTT`, otherwise SRT. Parse ahead of time with **`parseSrt`** / **`parseVtt`** when you do not need the hook.

### Multi-tab sync (`@lucaismyname/ginger/remote`)

Elects a **leader** tab via **`BroadcastChannel`** and pushes **`INIT`** snapshots to followers so queue and transport settings stay aligned. Mount **`Ginger.Player`** only on the leader so a single `<audio>` element plays. **Full shell:** [Remote starter](#subpath-starter-remote).

Snapshots send the current queue order with **`isShuffled: false`** so followers do not re-randomize; the visible order matches the leader. **`claimLeadership()`** requests leadership (lexicographically smaller tab IDs win conflicts).

`@lucaismyname/ginger/remote` also exports **`DEFAULT_REMOTE_CHANNEL_NAME`** and the **`RemoteMessage`** type if you need to share protocol constants or type your own channel helpers.

### Chromecast (`@lucaismyname/ginger/cast`)

Loads the **Google Cast Web Sender** (CAF), exposes **`useGingerCast`** for session + **`loadMedia`** sync, and helpers **`loadCastFramework`**, **`trackToMediaInfo`**, **`guessContentTypeFromUrl`**. The default receiver is the **Default Media Receiver**; override with **`receiverApplicationId`**.

**Platform:** Cast requires **HTTPS** in production (localhost is allowed for development). **`Track.fileUrl`** must be fetchable by the **Cast device** with correct **CORS**; avoid **mixed content**.

**Avoid double playback:** render **`{!isCasting && <Ginger.Player />}`** so the browser does not decode the same URLs as the TV. Optional **`syncLocalAudio: "pause-mute"`** mutes the local `<audio>` while connected. **Full shell:** [Cast starter](#subpath-starter-cast).

### Crossfade (`@lucaismyname/ginger/crossfade`)

Adds a Web Audio crossfade graph for **overlap-based** transitions between outgoing and incoming media. This is distinct from the longer-term **gapless** work: crossfade overlaps two sources on purpose, while gapless aims for seamless adjacent track boundaries on a single playback path. **Full shell:** [Crossfade starter](#subpath-starter-crossfade).

For lower-level integrations, the subpath also exports **`attachCrossfadeGraph`**, **`scheduleCrossfade`**, and **`teardownCrossfadeGraph`** plus the related graph/curve types. Like EQ and spatial audio, crossfade attaches to the active Ginger media graph and should be torn down when you unmount or switch playback strategies.

### Devtools (`@lucaismyname/ginger/devtools`)

A debugging overlay for inspecting and controlling Ginger audio players at runtime. Supports **multiple providers** on the same page via a global registry — place a single `<GingerDevtools />` anywhere in your app and it auto-discovers every active `<Ginger.Provider>`. **Full shell:** [Devtools starter](#subpath-starter-devtools).

The overlay provides **bidirectional controls**: you can play/pause, seek, change volume, adjust playback rate, toggle repeat/shuffle, and click tracks in the queue — all changes apply to the live player instantly. State changes from the player are reflected in the devtools panel in real-time.

The panel uses Tailwind CSS via CDN (injected on mount, removed on unmount) and renders in a portal so it does not interfere with your app's layout or styles. Use the `debugLabel` prop on `<Ginger.Provider>` to give each player a human-readable tab name.

### Experimental Notice

`@lucaismyname/ginger/experimental-gapless` is intentionally non-production.
It currently provides capability metadata only and does not alter playback behavior. **Full shell:** [Experimental gapless starter](#subpath-starter-experimental-gapless).

## Release Process

- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
- Release note template: [`.github/release-template.md`](https://github.com/lucaismyname/ginger/blob/main/.github/release-template.md)

Before publishing:

```bash
npm run verify:release
npm run docs:api
```

## Copy/Paste Examples

### Small Audio Player With Tailwind

```tsx
import { Ginger } from "@lucaismyname/ginger";

const tracks = [
  {
    id: "midnight",
    title: "Midnight Walk",
    artist: "Luca",
    album: "Night Notes",
    fileUrl: "https://example.com/audio/midnight-walk.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80",
    durationSeconds: 192,
  },
];

export function TailwindMiniPlayer() {
  return (
    <Ginger.Provider
      initialTracks={tracks}
      initialVolume={0.8}
      className="mx-auto max-w-md"
    >
      <Ginger.Player />

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Ginger.Current.Artwork
            className="h-16 w-16 overflow-hidden rounded-xl bg-zinc-100"
            imgStyle={{ width: "100%", height: "100%" }}
          />

          <div className="min-w-0 flex-1">
            <Ginger.Current.Title className="block truncate text-sm font-semibold text-zinc-900" />
            <Ginger.Current.Artist className="block truncate text-sm text-zinc-500" />
            <div className="mt-2">
              <Ginger.Control.SeekBar className="w-full accent-emerald-600" />
            </div>
            <div className="mt-1 flex justify-between text-xs text-zinc-500">
              <Ginger.Current.Elapsed />
              <Ginger.Current.Duration />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Ginger.Control.Previous className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" />
          <Ginger.Control.PlayPause className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800" />
          <Ginger.Control.Next className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" />
          <Ginger.Control.Mute className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-zinc-500">Volume</span>
          <Ginger.Control.Volume className="flex-1 accent-emerald-600" />
          <Ginger.Control.PlaybackRate className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700" />
        </div>
      </div>
    </Ginger.Provider>
  );
}
```

### Small Audio Player With Vanilla CSS

```tsx
import { Ginger } from "@lucaismyname/ginger";
import "./mini-player.css";

const tracks = [
  {
    id: "shoreline",
    title: "Shoreline",
    artist: "Sea Echo",
    fileUrl: "https://example.com/audio/shoreline.mp3",
    artworkUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
    durationSeconds: 214,
  },
];

export function VanillaMiniPlayer() {
  return (
    <Ginger.Provider initialTracks={tracks} className="ginger-mini-theme">
      <Ginger.Player />

      <div className="mini-player">
        <Ginger.Current.Artwork className="mini-player__artwork" />

        <div className="mini-player__body">
          <Ginger.Current.Title className="mini-player__title" />
          <Ginger.Current.Artist className="mini-player__artist" />

          <div className="mini-player__seek">
            <Ginger.Control.SeekBar />
          </div>

          <div className="mini-player__times">
            <Ginger.Current.Elapsed />
            <Ginger.Current.Duration />
          </div>

          <div className="mini-player__controls">
            <Ginger.Control.Previous className="mini-player__button mini-player__button--ghost" />
            <Ginger.Control.PlayPause className="mini-player__button mini-player__button--primary" />
            <Ginger.Control.Next className="mini-player__button mini-player__button--ghost" />
            <Ginger.Control.Mute className="mini-player__button mini-player__button--ghost" />
          </div>

          <div className="mini-player__footer">
            <label className="mini-player__volume">
              <span>Volume</span>
              <Ginger.Control.Volume />
            </label>

            <Ginger.Control.PlaybackRate className="mini-player__rate" />
          </div>
        </div>
      </div>
    </Ginger.Provider>
  );
}
```

```css
.ginger-mini-theme {
  --ginger-primary-color: #111827;
  --ginger-muted-color: #6b7280;
  --ginger-font-size: 14px;
  --ginger-font-family: Inter, system-ui, sans-serif;
  --ginger-artwork-radius: 14px;
  --ginger-artwork-bg: #f3f4f6;
}

.mini-player {
  display: flex;
  gap: 16px;
  max-width: 420px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.mini-player__artwork {
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
}

.mini-player__body {
  flex: 1;
  min-width: 0;
}

.mini-player__title {
  display: block;
  font-weight: 600;
  color: #111827;
}

.mini-player__artist {
  display: block;
  margin-top: 4px;
  color: #6b7280;
}

.mini-player__seek {
  margin-top: 12px;
}

.mini-player__seek input {
  width: 100%;
}

.mini-player__times {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.mini-player__controls {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.mini-player__button {
  border-radius: 10px;
  padding: 8px 12px;
  font: inherit;
  cursor: pointer;
}

.mini-player__button--ghost {
  border: 1px solid #d1d5db;
  background: white;
  color: #111827;
}

.mini-player__button--primary {
  border: 1px solid #111827;
  background: #111827;
  color: white;
}

.mini-player__footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.mini-player__volume {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  font-size: 12px;
  color: #6b7280;
}

.mini-player__volume input {
  flex: 1;
}

.mini-player__rate {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  padding: 6px 8px;
  color: #111827;
}
```

## Core Concepts

### `Ginger.Provider` owns playback state

The provider stores queue state, playback state, media state, and playlist metadata.

- Props prefixed with **`initial*`** are mount-only defaults.
- To replace the queue after mount, call **`useGinger().setQueue(...)`**.
- If you want provider state to fully reset from parent props, remount the provider with a new `key`.

### `Ginger.Player` creates and syncs the hidden audio element

The player renders the actual **`<audio>`** element and mirrors reducer state into the browser media API.

- You usually render it once near the root of the player subtree.
- It can stay visually hidden; it exists to drive playback.
- All transport and display components depend on it.

### Use components, the hook, or both

- Use **`Ginger.Control.*`**, **`Ginger.Current.*`**, **`Ginger.Queue.*`**, and **`Ginger.Playlist`** for fast composition.
- Use **`useGinger()`** when you want total control over layout and styling.
- Mix both approaches freely in the same provider tree.

## API Reference

### `Ginger.Provider`

Wrap all Ginger UI in a single provider.

```tsx
<Ginger.Provider initialTracks={tracks}>
  <Ginger.Player />
  {/* your UI */}
</Ginger.Provider>
```

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Player UI inside the provider |
| `initialTracks` | `Track[]` | `[]` | Initial queue |
| `initialIndex` | `number` | `0` | Initial current track index |
| `initialPlaylistMeta` | `PlaylistMeta \| null` | `null` | Queue/playlist metadata |
| `initialShuffle` | `boolean` | `false` | Start shuffled |
| `initialRepeatMode` | `"off" \| "all" \| "one"` | `"off"` | Initial repeat mode |
| `initialPlaybackMode` | `"playlist" \| "single"` | `"playlist"` | Playlist wraps/advances vs single-track stop behavior (change after mount with `useGinger().setPlaybackMode`) |
| `initialPaused` | `boolean` | `true` | Start paused or playing |
| `initialVolume` | `number` | `1` | Initial volume, clamped `0..1` |
| `initialMuted` | `boolean` | `false` | Initial muted state |
| `initialPlaybackRate` | `number` | `1` | Initial playback rate, clamped `0.25..4` |
| `initialStateKey` | `string \| number` | `undefined` | Re-dispatches `INIT` when this key changes |
| `locale` | `Partial<GingerLocaleMessages>` | `undefined` | Override built-in strings (controls, chapter list, synced lyrics list, …) |
| `mediaSession` | `boolean \| GingerMediaSessionOptions` | `false` | `true` enables default Media Session bridge; pass `{ seekForwardSeconds, seekBackwardSeconds, positionState }` for optional OS skip controls and timeline sync |
| `beforePlay` | `() => boolean \| Promise<boolean>` | `undefined` | Policy hook run before playback starts |
| `onPlayBlocked` | `() => void` | `undefined` | Called when `beforePlay` returns `false` |
| `retryOnError` | `boolean \| GingerRetryConfig` | `undefined` | Auto-retry on transient media errors (e.g. network failures) with exponential backoff. `true` uses defaults (`maxRetries: 3`, `delayMs: 1500`). |
| `persistence` | `{ get(key): unknown; set(key, value): void }` | `undefined` | Adapter for persisted playback settings and resume state |
| `hydrateOnMount` | `boolean` | `false` | Hydrate persisted values into initial provider state |
| `resumeOnTrackChange` | `boolean` | `false` | Restore/save per-track playback position |
| `unstyled` | `boolean` | `false` | Skip provider default CSS variable/theme styles |
| `asChild` | `boolean` | `false` | Merge shell props (`className`, `style`, `data-ginger-playback`, `dir`) onto the single child element instead of a wrapper `div` |
| `className` | `string` | `undefined` | Class for the provider wrapper (merged when `asChild`) |
| `style` | `CSSProperties` | `undefined` | Inline styles / CSS variables |
| `onTrackChange` | `(track, index) => void` | `undefined` | Fires when current track changes |
| `onPlay` | `() => void` | `undefined` | Fires when state changes to playing |
| `onPause` | `() => void` | `undefined` | Fires when state changes to paused |
| `onQueueEnd` | `() => void` | `undefined` | Fires when playback end resolves to a stop transition (e.g. end of playlist in `playlist` mode, or any track end in `single` mode unless repeat is `one`) |
| `onError` | `(message) => void` | `undefined` | Fires on media/playback errors |
| `onVolumeChange` | `(volume: number, muted: boolean) => void` | `undefined` | Fires when volume or muted state changes |
| `onPlaybackRateChange` | `(rate: number) => void` | `undefined` | Fires when playback speed changes |
| `onSeek` | `(timeSeconds: number) => void` | `undefined` | Fires whenever `seek()` is invoked |
| `dir` | `"ltr" \| "rtl" \| "auto"` | locale-derived | Explicit provider layout direction |
| `prevRestartThresholdSeconds` | `number` | `3` | Previous restarts current track when `currentTime > threshold`; set `0` to always skip |
| `debugLabel` | `string` | `undefined` | Human-readable label shown in devtools tabs when multiple providers exist |

### `Ginger.Player`

Renders the backing audio element.

```tsx
<Ginger.Player preload="metadata" crossOrigin="anonymous" />
```

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Optional class on the `<audio>` element |
| `style` | `CSSProperties` | `undefined` | Optional inline styles |
| `preload` | `AudioHTMLAttributes["preload"]` | `"metadata"` | Native audio preload mode |
| `crossOrigin` | `AudioHTMLAttributes["crossOrigin"]` | `undefined` | Native cross-origin mode |
| `respectReducedMotion` | `boolean` | `false` | Uses lower time-update frequency when user prefers reduced motion |

### `useGinger()`

Low-level hook for building custom UIs.

```tsx
import { useGinger } from "@lucaismyname/ginger";

function CustomPlayer() {
  const {
    state,
    currentTrack,
    playbackUi,
    duration,
    remaining,
    progress,
    play,
    pause,
    togglePlayPause,
    seek,
    next,
    prev,
    setVolume,
  } = useGinger();

  return <div>{currentTrack?.title}</div>;
}
```

Returned values:

| Key | Description |
|-----|-------------|
| `state` | Full `GingerState` object |
| `currentTrack` | Current track or `null` |
| `playbackUi` | Derived UI state: `idle`, `loading`, `playing`, `paused`, `ended`, `error` |
| `duration` | Effective duration using media metadata or `durationSeconds` fallback |
| `remaining` | Remaining seconds |
| `progress` | Fraction from `0..1` |
| `artworkUrl` | Resolved artwork URL |
| `albumLine` | Resolved album/subtitle line |
| `play`, `pause`, `togglePlayPause` | Transport actions |
| `seek` | Seek to a time in seconds |
| `setVolume`, `setMuted`, `toggleMute` | Volume/mute actions |
| `setPlaybackRate` | Set playback speed |
| `next`, `prev` | Queue navigation |
| `setRepeatMode`, `cycleRepeat` | Repeat controls |
| `toggleShuffle` | Toggle shuffle |
| `setQueue` | Replace the queue after mount |
| `insertTrackAt`, `removeTrackAt`, `moveTrack`, `enqueueNext` | Queue mutation actions |
| `playTrackAt`, `selectTrackAt` | Pick a track by index |
| `setPlaylistMeta` | Replace playlist metadata |
| `setPlaybackMode` | `"playlist"` or `"single"` (next/prev/end behavior and repeat-one) |
| `audioRef` | Ref to the underlying `HTMLAudioElement` |
| `dispatch` | Raw reducer dispatch for advanced cases |

## React Components

### `Ginger.Control.*`

Transport and media controls.

| Component | Description | Important props |
|-----------|-------------|-----------------|
| `Ginger.Control.PlayPause` | Toggle play / pause | `playLabel`, `pauseLabel`, native button props |
| `Ginger.Control.Previous` | Go to previous track | native button props |
| `Ginger.Control.Next` | Go to next track | native button props |
| `Ginger.Control.Repeat` | Cycle repeat mode | native button props |
| `Ginger.Control.Shuffle` | Toggle shuffle on/off | native button props |
| `Ginger.Control.SeekBar` | Controlled range input for time | `unstyled`, `inputStyle`, native input props |
| `Ginger.Control.Volume` | Controlled range input for volume `0..1` | `unstyled`, `inputStyle`, native input props |
| `Ginger.Control.Mute` | Toggle mute on/off | `muteLabel`, `unmuteLabel`, native button props |
| `Ginger.Control.PlaybackRate` | Select input for playback speed | `rates`, native select props |

**Default visuals:** `PlayPause`, `Next`, `Previous`, `Shuffle`, `Repeat`, and `Mute` render minimal inline SVGs (path data from [Lucide](https://lucide.dev), no extra npm dependency) when **`children` is omitted**. Pass **`children`** to replace the icon. Screen readers still use **`aria-label`** from locale and bindings; for `PlayPause`, **`playLabel`** / **`pauseLabel`** / **`playAriaLabel`** / **`pauseAriaLabel`** tune accessible names when those labels are strings.

### `Ginger.Icon.*`

The same SVG building blocks exposed for custom layouts: **`Ginger.Icon.Play`**, **`Pause`**, **`SkipForward`**, **`SkipBack`**, **`Shuffle`** (Lucide shuffle glyph), **`Volume2`**, **`VolumeX`**, **`RepeatGlyph`** (pass **`mode`**: `"off"` \| `"all"` \| `"one"`), and **`Wrapper`**. You can also import them by name from the package root (e.g. `import { Play, SkipForward } from "@lucaismyname/ginger"`).

Example:

```tsx
<div className="flex items-center gap-2">
  <Ginger.Control.Previous />
  <Ginger.Control.PlayPause />
  <Ginger.Control.Next />
  <Ginger.Control.Mute />
  <Ginger.Control.Volume />
  <Ginger.Control.PlaybackRate />
</div>
```

### `Ginger.Current.*`

Displays metadata for the current track and current playback state.

Text displays:

- `Title`
- `Artist`
- `Album`
- `Description`
- `Copyright`
- `Genre`
- `Label`
- `Isrc`
- `TrackNumber`
- `Year`

Shared text-display behavior:

- Accept `className`, `style`, `fallback`, `empty`
- Accept render-prop `children?: (value, state) => ReactNode`
- Render `null` when no value exists unless `fallback` or `empty` is provided

Other current-track components:

| Component | Description | Important props |
|-----------|-------------|-----------------|
| `Ginger.Current.Artwork` | Current track artwork or playlist artwork fallback | `unstyled`, `imgStyle`, `sizes`, `loading`, `decoding`, `onError`, display-base props |
| `Ginger.Current.Lyrics` | Track lyrics | `preserveWhitespace`, `unstyled`, render-prop `children` |
| `Ginger.Current.LyricsSynced` | Timed / LRC lyrics with active line | `activeClassName`, `lineClassName`, `unstyled`, render-prop `children` |
| `Ginger.Current.Chapters` | Chapter list; click seeks to `startSeconds` | `formatStart`, `unstyled`, render-prop `children` |
| `Ginger.Current.FileUrl` | Track `fileUrl`, hidden unless explicitly enabled | `visible`, display-base props |
| `Ginger.Current.QueueIndex` | Current queue index | `base`, render-prop `children` |
| `Ginger.Current.QueueLength` | Queue length | render-prop `children` |
| `Ginger.Current.QueuePosition` | Combined index/length label | `base`, `separator`, render-prop `children` |
| `Ginger.Current.Elapsed` | Current time string | `format`, render-prop `children` |
| `Ginger.Current.Duration` | Duration string | `format`, render-prop `children` |
| `Ginger.Current.Remaining` | Remaining time string | `format`, render-prop `children` |
| `Ginger.Current.Progress` | Progress as text or render-prop object | render-prop `children` |
| `Ginger.Current.TimeRail` | Simple visual progress rail | `unstyled`, `height`, `showBuffered`, display-base props |
| `Ginger.Current.BufferRail` | Buffered-only rail | `unstyled`, `height`, display-base props |
| `Ginger.Current.PlaybackState` | Derived state label | render-prop `children` |
| `Ginger.Current.ErrorMessage` | Media error string | `live`, render-prop `children` |

Example:

```tsx
<div>
  <Ginger.Current.Title className="font-semibold" />
  <Ginger.Current.Artist className="text-sm text-zinc-500" />
  <Ginger.Current.Elapsed /> / <Ginger.Current.Duration />
  <Ginger.Current.TimeRail className="mt-2" />
</div>
```

### `Ginger.Queue.*`

Displays queue or playlist metadata from `playlistMeta`.

| Component | Description |
|-----------|-------------|
| `Ginger.Queue.Title` | Playlist title |
| `Ginger.Queue.Subtitle` | Playlist subtitle |
| `Ginger.Queue.Description` | Playlist description |
| `Ginger.Queue.Copyright` | Playlist copyright |
| `Ginger.Queue.Artwork` | Playlist artwork |

These components follow the same fallback/empty behavior as other display components. `Ginger.Queue.Artwork` accepts `unstyled` and `imgStyle`.

### `Ginger.Playlist`

Renders the current queue as a clickable list.

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | `undefined` | Manual mode rows |
| `unstyled` | `boolean` | `false` | Remove default list/row styles for fully custom layout |
| `rowStyle` | `CSSProperties` | `undefined` | Auto-mode button style override |
| `renderTrack` | `(track, index, isActive) => ReactNode` | `undefined` | Auto-mode custom row content |
| `playOnSelect` | `boolean` | `true` | Click plays immediately if true |
| `...rest` | `HTMLAttributes<HTMLUListElement>` | - | Props passed to the root `<ul>` |

Modes:

- **Auto mode:** no `children`; Ginger maps `state.tracks` for you
- **Manual mode:** pass your own rows; usually map `useGinger().state.tracks`

Auto mode example:

```tsx
<Ginger.Playlist
  className="space-y-1"
  renderTrack={(track, index, active) => (
    <span style={{ fontWeight: active ? 600 : 400 }}>
      {index + 1}. {track.title}
    </span>
  )}
/>
```

### `Ginger.Playlist.Track`

Row helper for manual playlist rendering. Must be used inside `Ginger.Playlist`.

Props:

| Prop | Type | Description |
|------|------|-------------|
| `index` | `number` | Queue index for the row |
| `unstyled` | `boolean` | Remove default row button styles |
| `liProps` | `LiHTMLAttributes<HTMLLIElement>` | Props for the wrapper `<li>` |
| `children` | `ReactNode` | Optional custom content |
| `...rest` | `ButtonHTMLAttributes<HTMLButtonElement>` | Props for the row button |

Manual mode example:

```tsx
import { Ginger, useGinger } from "@lucaismyname/ginger";

function PlaylistManual() {
  const { state } = useGinger();

  return (
    <Ginger.Playlist playOnSelect={false}>
      {state.tracks.map((track, i) => (
        <Ginger.Playlist.Track
          key={track.id ?? `${track.fileUrl}-${i}`}
          index={i}
          className="w-full rounded-lg px-3 py-2 text-left"
        >
          {track.title}
        </Ginger.Playlist.Track>
      ))}
    </Ginger.Playlist>
  );
}
```

### `Ginger.Tracks` and `Ginger.Track`

Declare queue entries in JSX instead of (or in addition to) the `initialTracks` array. **`Ginger.Track`** renders nothing; it registers a [`Track`](#track) with the nearest **`Ginger.Tracks`** wrapper, which syncs the merged queue on each update. **`Ginger.Playlist.Track`** remains the **row UI** (it takes an **`index`** into the existing queue); **`Ginger.Track`** is **data only**.

| Prop (`Ginger.Tracks`) | Type | Default | Description |
|--------|------|---------|-------------|
| `merge` | `"append" \| "prepend" \| "replace"` | `"append"` | How to combine declarative tracks with `initialTracks` from `Ginger.Provider`: **`append`** → `[...initialTracks, ...declarative]`; **`prepend`** → `[...declarative, ...initialTracks]`; **`replace`** → declarative tracks only (snapshot of `initialTracks` from props is ignored for this subtree’s sync). |
| `...rest` | `HTMLAttributes<HTMLDivElement>` | - | Passed to a wrapper with `display: contents` (layout-neutral). |

**`Ginger.Track`** accepts the same fields as [`Track`](#track). **`title`** is required; provide **`fileUrl`** or **`src`** (alias for `fileUrl`). Optional **`id`** keeps a stable identity when reordering JSX.

The merge snapshot uses the provider’s latest **`initialTracks` props** (via an internal ref). If you change the queue only with **`setQueue()`** and not via props, a later sync from **`Ginger.Tracks`** can realign the queue with props + declarative children again—prefer updating **`initialTracks`** when mixing approaches, or rely on **`merge="replace"`** with only declarative children.

**Shuffle:** each declarative sync dispatches **`SET_QUEUE`**, which clears shuffle state (same as imperative `setQueue`). Avoid heavy declarative churn while shuffle is on if you need shuffle to persist.

```tsx
<Ginger.Provider initialTracks={[{ id: "a", title: "Intro", fileUrl: "/a.mp3" }]}>
  <Ginger.Tracks merge="append">
    <Ginger.Track title="Main" src="/b.mp3" artist="Band" />
    <Ginger.Track title="Outro" fileUrl="/c.mp3" />
  </Ginger.Tracks>
  <Ginger.Player />
  <Ginger.Playlist />
</Ginger.Provider>
```

## Types

### `Track`

```ts
type Track = {
  id?: string;
  title: string;
  fileUrl: string;
  artist?: string;
  copyright?: string;
  description?: string;
  album?: string;
  artworkUrl?: string;
  genre?: string;
  year?: number;
  label?: string;
  isrc?: string;
  trackNumber?: number;
  lyrics?: string;
  lyricsTimed?: Array<{ time: number; text: string }>;
  chapters?: Array<{ title: string; startSeconds: number }>;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
};
```

Use `id` when possible for stable identity, especially if duplicate `fileUrl` values can appear in a queue.

### `PlaylistMeta`

```ts
type PlaylistMeta = {
  id?: string;
  title?: string;
  subtitle?: string;
  artworkUrl?: string;
  copyright?: string;
  description?: string;
  metadata?: Record<string, unknown>;
};
```

## Styling

Ginger is designed to work with your own CSS. Most components accept `className` and `style`, and the provider wrapper exposes a few CSS variables.

CSS variables available on `Ginger.Provider`:

- `--ginger-primary-color`
- `--ginger-muted-color`
- `--ginger-font-size`
- `--ginger-font-family`
- `--ginger-playlist-row-padding`
- `--ginger-artwork-radius`
- `--ginger-artwork-bg`
- `--ginger-playlist-active-bg` (playlist current row)
- `--ginger-buffer-color` (buffered range in `TimeRail` / `BufferRail`)
- `--ginger-focus-ring` (documented for your own focus styles; native controls vary by browser)

The root element under `Ginger.Provider` sets **`data-ginger-playback`** to one of `idle` \| `loading` \| `playing` \| `paused` \| `ended` \| `error` so you can target themes in CSS (e.g. `[data-ginger-playback="error"]`).

Example:

```tsx
<Ginger.Provider
  initialTracks={tracks}
  style={{
    ["--ginger-primary-color" as string]: "#0f172a",
    ["--ginger-muted-color" as string]: "#64748b",
    ["--ginger-artwork-radius" as string]: "16px",
  }}
>
  <Ginger.Player />
  {/* ... */}
</Ginger.Provider>
```

## Building custom UI

- **`useGinger()`** — One object with merged `state`, derived fields (`duration`, `progress`, `playbackUi`, …), actions, `dispatch`, and `audioRef`. Best default when you want everything in one place.

- **`useGingerPlayback()`** / **`useGingerMedia()`** — Subscribe to queue/transport vs time/volume/buffering separately so dense UIs re-render less often.

- **`useGingerTime()`** / **`useGingerMediaControls()`** — Granular media subscriptions: `useGingerTime()` provides only high-frequency fields (`currentTime`, `duration`, `bufferedFraction`, `isBuffering`, `errorMessage`); `useGingerMediaControls()` provides low-frequency fields (`volume`, `muted`, `playbackRate`) plus actions (`seek`, `setVolume`, etc.). Components that only need volume controls avoid re-renders on every time tick.

- **`useGingerState()`** — Merged `GingerState` only (no actions); use inside custom display components together with hooks above for controls.

- **Headless control bindings** (bind to your own components): **`useSeekBarBinding()`**, **`useVolumeSlider()`**, **`usePlayPauseBinding({ playAriaLabel?, pauseAriaLabel? })`**. Each returns props such as `value`, `min`, `max`, handlers, and `ariaLabel` / `ariaValueText` where relevant.

- **Advanced hooks** — **`useGingerKeyboardShortcuts()`**, **`useGingerSleepTimer()`**, **`useSeekDrag()`**, **`useNextTrackPrefetch()`**, **`useGingerChapters()`**, **`useGingerChapterProgress()`**, **`useGingerLyricsSync()`**, **`useGingerDebugLog()`**, **`useGingerPlaybackHistory()`**, **`useGingerVolumeFade()`** are available for custom UX and diagnostics.

- **Locale** — Pass **`locale={partialMessages}`** on `Ginger.Provider` (type **`GingerLocaleMessages`**) to translate built-in control strings, chapter list labels, and synced lyrics list names; **`useGingerLocale()`** reads the merged messages anywhere under the provider.

- **Track extras** — Optional **`metadata?: Record<string, unknown>`** on **`Track`** (and on **`PlaylistMeta`**) is ignored by core logic; use it for badges, flags, or UI-only fields. Chapter entries and timed lyric lines are now typed as the named exports **`TrackChapter`** and **`TrackLyricLine`** respectively.

- **Buffered UI** — **`Ginger.Current.BufferRail`** shows load progress; **`Ginger.Current.TimeRail`** supports **`showBuffered`** to stack a buffered layer behind the played segment.

- **Audio analyzers** — Live Web Audio data for real-time visuals (**`useGingerLiveAnalyzer`**, main package), parametric EQ (**`useGingerEqualizer`**, `@lucaismyname/ginger/equalizer`), **spatial / HRTF panning** (**`useGingerSpatialAudio`**, `@lucaismyname/ginger/spatial`), and whole-file grids for waveforms or spectrograms (**`useAudioFileAnalysis`** / **`analyzeAudioFile`**, `@lucaismyname/ginger/waveform`). See [Audio analyzers (visualizations)](#audio-analyzers-visualizations).

- **Transcripts** — **SRT / WebVTT** parsing and sync (**`parseSrt`**, **`parseVtt`**, **`useGingerTranscriptSync`**, `@lucaismyname/ginger/transcript`); LRC / in-track lyrics remain **`useGingerLyricsSync`** and **`parseLrc()`** on the main package.

- **Multi-tab** — **`useGingerRemote`** (`@lucaismyname/ginger/remote`) coordinates playback state across browser tabs; see [Subpath exports](#subpath-exports).

Recipes below cover queue lifecycle and media edge cases.

## Audio analyzers (visualizations)

Ginger separates **live** analysis (while the native `<audio>` element plays) from **whole-file** analysis (decode once, build static or seek-independent grids).

### Live: `useGingerLiveAnalyzer`

Import from the main package:

```tsx
import { Ginger, useGingerLiveAnalyzer } from "@lucaismyname/ginger";

function Spectrum() {
  const { frequencyData, frequencyBinCount, error, resume, isSuspended } = useGingerLiveAnalyzer({
    fftSize: 2048,
  });

  if (error) return <p role="alert">{error}</p>;
  if (isSuspended) {
    return (
      <button type="button" onClick={() => void resume()}>
        Enable audio analysis
      </button>
    );
  }

  return (
    <div>
      {/* e.g. map frequencyData[0..frequencyBinCount) to bar heights */}
      <span>{frequencyBinCount} bins</span>
    </div>
  );
}

// Mount <Ginger.Player crossOrigin="anonymous" /> when fileUrl is cross-origin so Web Audio can use the element.
```

Important:

- **CORS** — For cross-origin `fileUrl` values, set **`crossOrigin`** on **`Ginger.Player`** (for example `"anonymous"`) so the media element is usable with **`AudioContext`**.
- **One `MediaElementAudioSourceNode` per `<audio>`** — The library reuses a single Web Audio graph per underlying element. Multiple instances of **`useGingerLiveAnalyzer`** attach extra **`AnalyserNode`**s as taps; only one tap carries audio to **`destination`** so volume stays correct.
- **Autoplay** — The **`AudioContext`** may start **`suspended`** until a user gesture; call **`resume()`** or start playback after interaction.
- **Reading buffers** — `frequencyData` and `timeDomainData` are updated each animation frame while enabled; read them during render after **`frequencyBinCount > 0`** (they are backed by mutable buffers that the hook fills in a `requestAnimationFrame` loop). Because the array _reference_ never changes, use the returned **`frame`** counter as a `useMemo` / `useEffect` dependency to react to new data:

  ```ts
  const { frequencyData, frame } = useGingerLiveAnalyzer();
  const peak = useMemo(() => Math.max(...frequencyData), [frame]);
  ```

### Whole file: `@lucaismyname/ginger/waveform`

Use **`useAudioFileAnalysis`** (React hook) or **`analyzeAudioFile`** / **`analyzeAudioBuffer`** (imperative) for amplitude grids and optional spectrogram rows without playing the track.

```tsx
import { useAudioFileAnalysis } from "@lucaismyname/ginger/waveform";

function FileViz({ url }: { url: string }) {
  const { data, isLoading, error } = useAudioFileAnalysis(url, {
    timeSlices: 128,
    samplesPerSlice: 8,
    spectrogram: true,
    fftSize: 1024,
    frequencyBins: 256,
  });

  if (isLoading) return <p>Loading analysis…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <p>Duration: {data.duration}s</p>
      {/* data.amplitudeGrid: number[][] */}
      {/* data.spectrogram?: number[][] normalized to [0, 1] */}
    </div>
  );
}
```

**`useAudioPeaks`** (same subpath) remains a lightweight helper: a single row of decoded amplitude peaks. For large files, pass `maxBuckets` and `maxSamplesPerBucket` as the third argument to cap compute cost. Prefer **`useAudioFileAnalysis`** when you need a 2D amplitude grid or spectrogram.

## Recipes

### Updating the queue after mount

`initialTracks`, `initialIndex`, and other `initial*` props apply **only on the first mount** of `Ginger.Provider`. To replace the queue from app state, use `setQueue` / `playTrackAt` / `selectTrackAt` from `useGinger()`, or call `init({ tracks, ... })` for a full reset (same as `INIT`).

To re-run initialization when a parent identifier changes (for example switching albums), pass **`initialStateKey`** (e.g. `initialStateKey={albumId}`). When that key changes, Ginger dispatches `INIT` using the **current** `initialTracks`, `initialIndex`, and other `initial*` props.

### Duplicate URLs and stable `id`s

If two tracks share the same `fileUrl`, set a unique **`id`** on each `Track` so shuffle/unshuffle and queue identity resolve the correct row.

### CORS and `<Ginger.Player />`

Cross-origin audio must be served with compatible CORS headers. If you need the browser to treat the response as CORS-enabled (for example when reading certain metadata), pass **`crossOrigin`** on `Ginger.Player` (e.g. `"anonymous"`).

### Autoplay and `play()` failures

If the browser blocks playback (autoplay policy) or `HTMLMediaElement.play()` rejects for another reason, the player dispatches a media error with a short message. **`onError`** still runs (from `errorMessage` in state), and **`Ginger.Current.ErrorMessage`** shows the same string. Associate controls with a visible label using the `id` on `Ginger.Control.SeekBar` and a `<label htmlFor="…">` in your UI.

## New Optional Features

All additions below are opt-in and preserve existing behavior by default.

### Media Session integration

Enable lock-screen and OS media controls:

```tsx
<Ginger.Provider initialTracks={tracks} mediaSession>
  <Ginger.Player />
  {/* ... */}
</Ginger.Provider>
```

### Keyboard shortcuts

```tsx
import { useGingerKeyboardShortcuts } from "@lucaismyname/ginger";

function Hotkeys() {
  useGingerKeyboardShortcuts(true, {
    playPause: " ",
    next: "n",
    previous: "p",
    mute: "m",
    seekForward: "ArrowRight",
    seekBackward: "ArrowLeft",
    seekSeconds: 5,
  });
  return null;
}
```

`mute`, `seekForward`, and `seekBackward` are all optional; keys are lower-cased before comparison. `seekSeconds` defaults to `5` when seek bindings are set.

### Chapters and synced lyrics

```tsx
import { useGingerChapters, useGingerLyricsSync } from "@lucaismyname/ginger";

function ChapterAndLyrics() {
  const chapters = useGingerChapters();
  const lyrics = useGingerLyricsSync();
  return (
    <div>
      <button onClick={() => chapters.seekTo(0)}>Jump to first chapter</button>
      <p>Active lyric: {lyrics.activeLine?.text ?? "None"}</p>
    </div>
  );
}
```

`Track` now supports optional `chapters` and `lyricsTimed` fields. For LRC parsing, use `parseLrc()`.

For ready-made UI, use **`Ginger.Current.Chapters`** and **`Ginger.Current.LyricsSynced`** (same data as the hooks above).

### Next-track prefetch

```tsx
import { Ginger, useNextTrackPrefetch } from "@lucaismyname/ginger";

function PrefetchNext() {
  useNextTrackPrefetch({ crossOrigin: "anonymous" });
  return null;
}

export function App() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player crossOrigin="anonymous" />
      <PrefetchNext />
      {/* ... */}
    </Ginger.Provider>
  );
}
```

The hook preloads the **logical** next track (same rules as the Next button) using a detached `HTMLAudioElement` with `preload="auto"`. Pass **`crossOrigin`** when it matches **`Ginger.Player`** for cross-origin URLs.

### Playback history

```tsx
import { useGingerPlaybackHistory } from "@lucaismyname/ginger";

function RecentTracks() {
  const { history, clearHistory } = useGingerPlaybackHistory({ maxLength: 20 });
  return (
    <ul>
      {history.map((entry, i) => (
        <li key={i}>{entry.track.title}</li>
      ))}
    </ul>
  );
}
```

Records every track change in chronological order (most recent last). Useful for displaying play history or implementing "smart previous" in shuffle mode. History lives in component state and is reset on remount.

### Volume fade

```tsx
import { useGingerVolumeFade } from "@lucaismyname/ginger";

function FadeButton() {
  const { fadeVolumeTo, cancelFade, isFading } = useGingerVolumeFade();
  return (
    <button
      onClick={() => fadeVolumeTo({ targetVolume: 0, durationMs: 1500, onComplete: pause })}
      disabled={isFading}
    >
      Fade out
    </button>
  );
}
```

Smoothly interpolates volume over a given duration using `requestAnimationFrame`. Call `cancelFade()` to hold at the current level.

### Chapter progress

```tsx
import { useGingerChapterProgress } from "@lucaismyname/ginger";

function ChapterBar() {
  const { progress, elapsed, remaining } = useGingerChapterProgress();
  return <progress value={progress} max={1} />;
}
```

Returns `progress` (0–1 fraction through the active chapter), `elapsed` (seconds into it), and `remaining` (seconds until the next chapter or track end). Complements `useGingerChapters` for chapter scrubber UIs.

### Framework-agnostic store

```ts
import { createGingerStore } from "@lucaismyname/ginger";

const store = createGingerStore({ tracks: myTracks });

const unsub = store.subscribe((state) => {
  console.log("current track index:", state.currentIndex);
});

store.dispatch({ type: "NEXT" });
store.init({ tracks: newTracks });
unsub();
```

A pure-JS store wrapping `gingerReducer` with `getState`, `dispatch`, `subscribe`, and `init`. No React required — usable in Svelte, Vue, Node.js testing environments, or server-side rendering.

### Sleep timer and drag seek

```tsx
import { useGingerSleepTimer, useSeekDrag } from "@lucaismyname/ginger";

function Extras({ duration }: { duration: number }) {
  useGingerSleepTimer({ durationMs: 10 * 60 * 1000, enabled: true });
  const drag = useSeekDrag(duration);
  return <div onPointerDown={drag.onPointerDown}>Drag to seek</div>;
}
```

When `respectPause` is `true` (default), pausing stops the countdown and elapsed time is preserved across pause/resume cycles — the timer picks up where it left off rather than restarting from the full duration.

### Persistence + resume

`Ginger.Provider` accepts:

- `persistence?: { get(key): unknown; set(key, value): void }`
- `hydrateOnMount?: boolean`
- `resumeOnTrackChange?: boolean`

This allows persisted volume/rate/repeat/index and optional per-track resume positions. Errors thrown by the adapter are caught and logged as dev-mode warnings so a storage quota error never crashes the player.

### Provider event callbacks

New callbacks available on `Ginger.Provider`:

- `onVolumeChange?: (volume: number, muted: boolean) => void` — fired when volume or mute state changes
- `onPlaybackRateChange?: (rate: number) => void` — fired when playback speed changes
- `onSeek?: (timeSeconds: number) => void` — fired on any `seek()` call

### Provider layout props

- `dir?: "ltr" | "rtl" | "auto"` — explicit layout direction; takes priority over the automatic RTL heuristic derived from locale strings
- `prevRestartThresholdSeconds?: number` — pressing previous restarts the current track when `currentTime > threshold` (default `3`); set to `0` to always skip to the previous track
- `debugLabel?: string` — human-readable label shown in the devtools tab when multiple providers exist

### Queue mutation actions and single-track mode

`useGinger()` and split playback context now include:

- `insertTrackAt(track, index?, autoPlay?)`
- `removeTrackAt(index)`
- `moveTrack(fromIndex, toIndex)`
- `enqueueNext(track)`

Provider supports `initialPlaybackMode?: "playlist" | "single"` (`"playlist"` default). Use `setPlaybackMode("playlist" | "single")` from `useGinger()` or `useGingerPlayback()` to change mode without a full `init()`.

### Reduced motion and blocked-play policy

- `Ginger.Player` supports `respectReducedMotion` to reduce time sync update frequency.
- `Ginger.Provider` supports `beforePlay?: () => boolean | Promise<boolean>` and `onPlayBlocked`.
- If `beforePlay` throws/rejects, Ginger sets `errorMessage` and triggers `onError`.

### Debug logging

Use `useGingerDebugLog(true)` during development to log core state transitions in the console.

### Fully unstyled mode

- `Ginger.Provider unstyled` disables provider theme defaults (CSS variable injection).
- `Ginger.Provider asChild` merges the same shell props onto **one** child element (no extra wrapper `div`).
- `Ginger.Control.SeekBar` and `Ginger.Control.Volume` accept `unstyled`.
- `Ginger.Current.Artwork`, `Ginger.Queue.Artwork`, `Ginger.Current.TimeRail`, and `Ginger.Current.BufferRail` accept `unstyled`.
- `Ginger.Playlist` and `Ginger.Playlist.Track` accept `unstyled`.
- `Ginger.Current.Chapters` and `Ginger.Current.LyricsSynced` accept `unstyled`.
- `Ginger.Current.Lyrics` accepts `unstyled` to skip default `whiteSpace: pre-wrap` when using `preserveWhitespace` (apply typography via `className` / `style` instead).

With `Ginger.Current.TimeRail` / `showBuffered`, **`unstyled`** removes positioning and background layers; you still get percentage widths on inner segments—supply your own layout (e.g. `position: relative` on the rail, bar heights) so the headless variant lays out correctly.

This gives you a pure state+behavior layer while keeping convenience components available.

### Subpath exports

Additional entrypoints:

- `@lucaismyname/ginger/client`
- `@lucaismyname/ginger/testing`
- `@lucaismyname/ginger/waveform`
- `@lucaismyname/ginger/equalizer`
- `@lucaismyname/ginger/spatial`
- `@lucaismyname/ginger/transcript`
- `@lucaismyname/ginger/remote`
- `@lucaismyname/ginger/cast`
- `@lucaismyname/ginger/crossfade`
- `@lucaismyname/ginger/experimental-gapless`
- `@lucaismyname/ginger/devtools`

See [Subpath Exports](#subpath-exports) for the import list, per-feature notes, and **[copy-paste starters](#subpath-copy-paste-starters)** for each subpath. `experimental-gapless` is explicitly non-production and does not alter core playback.

## Notes

### CORS

`fileUrl` must be fetchable by the browser. Cross-origin media must be served with compatible CORS headers.

### SSR

There is no `window` at import time, but playback only starts when the audio element mounts on the client. In frameworks with server rendering, render the player in a client component or mount it after hydration.

### Queue updates after mount

See [Recipes — Updating the queue after mount](#updating-the-queue-after-mount).

## Development priorities

These priorities guide new work in the library; they are not a guarantee of shipping order.

1. **Music libraries and continuous listening** — Features that make track-to-track playback feel better come first: **next-track prefetch** (`useNextTrackPrefetch`), shipped **crossfade** (`@lucaismyname/ginger/crossfade`), ongoing **gapless** capability work (`@lucaismyname/ginger/experimental-gapless`), and first-class **chapter** / **synced lyrics** UI (`Ginger.Current.Chapters`, `Ginger.Current.LyricsSynced`).
2. **Podcasts and live-style streams** — **HLS / DASH** integration is emphasized when a concrete app needs it; the core package stays on native `<audio>` with optional adapters or documentation rather than hard dependencies. **SRT / WebVTT** transcripts are supported via `@lucaismyname/ginger/transcript`.
3. **Embedded or internal players** — **Accessibility**, persistence, and **testing** helpers are favored over heavier ecosystem integrations unless there is a dedicated use case. For **Chromecast**, opt‑in to `@lucaismyname/ginger/cast`. **Multi-tab** web apps can use `@lucaismyname/ginger/remote` (BroadcastChannel) before reaching for OS-level remote playback.

## Monorepo Development

| Path | Purpose |
|------|---------|
| [`packages/ginger`](https://github.com/lucaismyname/ginger/tree/main/packages/ginger) | Publishable library (`@lucaismyname/ginger`) |
| [`apps/demo`](https://github.com/lucaismyname/ginger/tree/main/apps/demo) | Demo app (feature matrix, Playwright smoke tests) |
| [`apps/ginger-landing`](https://github.com/lucaismyname/ginger/tree/main/apps/ginger-landing) | Landing page (live player, bundled samples) |

```bash
npm install --include=dev
npm run build -w @lucaismyname/ginger
npm run dev -w ginger-demo
```

If your npm config sets `omit=dev`, devDependencies may not install. Use `--include=dev` once or adjust your npm config.

## Publish

Do **not** run `npm publish` at the **monorepo root** as if it were the package—the root `package.json` is **`private: true`**.

From the **repository root**, use the helper script (it `cd`s into this folder so npm’s registry metadata picks up **this** `README.md` on [npmjs.com](https://www.npmjs.com/package/@lucaismyname/ginger)):

```bash
npm run publish:lib
```

Avoid `npm publish -w @lucaismyname/ginger` from the root for releases: the tarball contents are correct, but the **package page readme** can incorrectly show the **root** readme. Alternatively run `npm publish --access public` **from `packages/ginger`** after `npm run verify:release`.

`prepublishOnly` runs the library build and checks automatically.
