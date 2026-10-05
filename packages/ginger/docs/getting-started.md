# Getting Started

## Install

```bash
npm install @lucaismyname/ginger
```

Peer dependencies: **React 18+** and **react-dom** (optional peer for non-DOM environments).

## Minimal setup

```tsx
import { Ginger } from "@lucaismyname/ginger";

const tracks = [
  { id: "one", title: "One", fileUrl: "/audio/one.mp3" },
  { id: "two", title: "Two", fileUrl: "/audio/two.mp3" },
];

export function BasicPlayer() {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      <Ginger.Control.PlayPause />
      <Ginger.Control.SeekBar />
      <Ginger.Control.Volume />
      <Ginger.Current.Title fallback="No track selected" />
    </Ginger.Provider>
  );
}
```

### Track shape

Each queue item is a **`Track`**: at minimum supply a stable identity and a playable URL.

- **`fileUrl`** — HTTP(S) URL or app-served path to the audio resource (MP3, AAC, etc.).
- **`id`** — Strongly recommended when URLs repeat or when you use persistence, remote sync, or prefetch; queue logic uses [`trackIdentity`](../src/core/queue.ts) for stable keys.
- Optional metadata (`title`, `artist`, `artworkUrl`, `chapters`, lyrics, …) powers `Ginger.Current.*` and chapters/lyrics hooks.

See the `Track` type in the generated API or [`types.ts`](../src/types.ts).

### Declarative queue (optional)

You can define tracks in JSX with **`Ginger.Tracks`** and **`Ginger.Tracks.Track`** (same fields as **`Track`**; use **`src`** as an alias for **`fileUrl`**). The **`merge`** prop controls how they combine with **`initialTracks`** (`append`, `prepend`, or `replace`). Details and caveats: [`reference/components.md`](./reference/components.md#gingertracks-and-gingertrack).

## Core concepts

| Piece | Role |
|-------|------|
| **`Ginger.Provider`** | Single source of truth: queue, transport (`isPaused`), volume, rate, and reducer-driven media fields (`currentTime`, `duration`, …). |
| **`Ginger.Player`** | Renders the hidden `<audio>` element, wires DOM events into the reducer, and applies `volume` / `muted` / `playbackRate` / `src` from state. **Exactly one** per provider tree in normal apps. |
| **`Ginger.Control.*` / `Ginger.Current.*`** | Optional styled or unstyled building blocks; all read state via context. |
| **`useGinger()`** | Ergonomic hook: merged state + actions for fully custom UI. |

### Context split (performance)

For large UIs, prefer granular hooks so components do not subscribe to the whole tree:

- **`useGingerPlayback()`** — queue, repeat/shuffle, navigation actions.
- **`useGingerMedia()`** — time, duration, volume, mute, playback rate, seek.
- **`useGingerState()`** — merged snapshot (both slices); convenient but updates more often.

See [`reference/hooks.md`](./reference/hooks.md).

### SSR and the App Router

The default entry is server-safe where hooks are not called on the server. For **Next.js App Router** and other RSC setups, import UI from **`@lucaismyname/ginger/client`** so client boundaries get the `"use client"` directive on the barrel. See [`reference/subpaths.md`](./reference/subpaths.md).

## Next steps

- **Changelog** (release history): [`CHANGELOG.md`](../CHANGELOG.md)
- **Recipes** (queue updates, autoplay, persistence): [`guides/recipes.md`](./guides/recipes.md)
- **Testing**: [`guides/testing.md`](./guides/testing.md)
- **Accessibility**: [`guides/accessibility.md`](./guides/accessibility.md)
- **Optional subpaths** (waveform, EQ, effects, spatial, transcript, remote, crossfade, gapless probe): [`reference/subpaths.md`](./reference/subpaths.md)
- **Component / hook lists**: [`reference/components.md`](./reference/components.md), [`reference/hooks.md`](./reference/hooks.md)
- **Docs index** (folder layout, how to open TypeDoc): [`README.md`](./README.md)
