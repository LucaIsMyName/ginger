# Components reference

The **`Ginger`** namespace groups the provider, the hidden `<audio>` implementation, controls, current-track displays, queue metadata, optional **declarative queue** definitions, playlist building blocks, and optional inline icons. All components assume a **`Ginger.Provider`** ancestor unless noted.

For hook-level APIs and headless patterns, see [`hooks.md`](./hooks.md). For per-prop TypeDoc, open the generated [`../api/index.html`](../api/index.html).

---

## Provider and player

| Export | Description |
|--------|-------------|
| **`Ginger.Provider`** | React context provider: queue, playback (`isPaused`), volume, mute, playback rate, reducer-driven media fields, and lifecycle props (`onPlay`, `onPause`, `mediaSession`, `persistence`, …). |
| **`Ginger.Player`** | Renders `<audio>` with `ref` wiring, time/buffer sync, and `src` updates from the active track. Mount **once** per provider. |

---

## `Ginger.Control.*`

Headless (or minimally styled) transport and mixing controls. Pass **`className`**, **`style`**, and native element props through like any button or range input.

| Export | Description |
|--------|-------------|
| **`PlayPause`** | Toggles play/pause; icon defaults when `children` omitted. |
| **`Repeat`** | Cycles repeat mode (`off` → `all` → `one`). `aria-pressed` is `false` (off), `true` (all), or `mixed` (one). |
| **`Next` / `Previous`** | Queue navigation; previous may seek to start when far into the track (see provider `prevRestartThresholdSeconds`). |
| **`Shuffle`** | Toggles shuffle; `aria-pressed` when on. |
| **`SeekBar`** | Range input bound to position + seek. |
| **`Volume`** | Volume slider (`input[type=range]`). |
| **`Mute`** | Mute toggle. |
| **`PlaybackRate`** | Playback speed `<select>` using locale strings. |

---

## `Ginger.Current.*`

Read-only views of the **active** track and playback state. Most accept **`fallback`** / **`empty`** text when data is missing.

Metadata (title, artist, artwork, queue index) subscribes to playback state and does **not** re-render on every time tick. Elapsed time, rails, and `PlaybackState` follow the clock.

### Metadata

| Export | Description |
|--------|-------------|
| **`Title`**, **`Artist`**, **`Album`**, **`Description`**, **`Copyright`**, **`Genre`**, **`Label`**, **`Isrc`**, **`TrackNumber`**, **`Year`** | Plain text from `Track` metadata. |
| **`Lyrics`**, **`LyricsSynced`**, **`Chapters`** | Richer blocks; **`Chapters`** / **`LyricsSynced`** are also available as root exports for bundlers that prefer named imports. |
| **`FileUrl`** | Displays the resolved file URL when useful for debugging or power users. |
| **`Artwork`** | `<img>` for `artworkUrl` with sensible loading/decoding defaults. |

### Queue position (current track in queue)

| Export | Description |
|--------|-------------|
| **`QueueIndex`**, **`QueueLength`**, **`QueuePosition`** | Human-readable indices / counts (1-based vs length depends on component; see types). |

### Time and progress

| Export | Description |
|--------|-------------|
| **`Elapsed`**, **`Duration`**, **`Remaining`** | Formatted time strings. |
| **`Progress`** | Fraction or percentage of progress (see props). |
| **`TimeRail`**, **`BufferRail`** | Thin progress / buffer indicators for custom skins. |

### Status

| Export | Description |
|--------|-------------|
| **`PlaybackState`**, **`ErrorMessage`** | High-level playing/buffering/error copy from state. |

---

## `Ginger.Queue.*`

Metadata for the **queue as a whole** (not only the current row): titles, subtitles, artwork, etc. Use for chrome around the playlist.

---

## `Ginger.Tracks` and `Ginger.Track`

Declare queue entries in JSX instead of (or in addition to) the **`initialTracks`** array on **`Ginger.Provider`**.

| Export | Description |
|--------|-------------|
| **`Ginger.Tracks`** | Wrapper with a **`merge`** prop: **`append`** (default), **`prepend`**, or **`replace`**. Combines declarative children with the provider’s **`initialTracks`** snapshot. Re-syncs when those children or `initialTracks` change, including artwork, chapters, and lyrics. Imperative `insertTrack`, `removeTrack`, and `setQueue` are left in place while the declarative list is unchanged. A declarative reorder or membership change dispatches `SET_QUEUE`, which clears shuffle and resets timing. Renders a layout-neutral wrapper (`display: contents`). |
| **`Ginger.Track`** | Data-only: renders **nothing**. Registers one **`Track`**; requires **`title`** and **`fileUrl`** or **`src`**. Optional **`id`** keeps identity stable when reordering siblings. Must appear under **`Ginger.Tracks`**. |

Typical flow: define the queue with **`Ginger.Tracks`** / **`Ginger.Track`**, then render the list with auto **`Ginger.Playlist`** (no `children`) or manual **`Ginger.Playlist.Track`** rows by **`index`**.

**Not the same as `Ginger.Playlist.Track`:** the playlist row component takes an **`index`** into **`state.tracks`** (display + click-to-play). **`Ginger.Track`** declares **what** is in the queue; **`Ginger.Playlist.Track`** renders **where** a row appears in the UI.

See also: [`guides/recipes.md`](../guides/recipes.md) (imperative vs declarative queue), and the root [`README.md`](../../README.md) for merge semantics and caveats (`SET_QUEUE` / shuffle).

---

## `Ginger.Playlist` and `Ginger.Playlist.Track`

Composable list UI: render the queue with **`Ginger.Playlist`** and one row per track via **`Ginger.Playlist.Track`**, passing render props / class names as documented in the generated API.

---

## `Ginger.Icon.*`

Lucide-style SVG building blocks (**`Play`**, **`Pause`**, **`SkipForward`**, **`SkipBack`**, **`Shuffle`**, **`Volume2`**, **`VolumeX`**, **`RepeatGlyph`**, **`Wrapper`**) — same visuals as default control icons when you build fully custom buttons.
