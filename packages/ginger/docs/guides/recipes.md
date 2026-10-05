# Recipes

Short patterns that come up often when integrating Ginger beyond the minimal example in [`getting-started.md`](../getting-started.md).

---

## Update the queue after mount

Use **`useGinger().setQueue()`** (or `useGingerPlayback()` which exposes the same action) to replace tracks and optionally reset the current index.

```tsx
const ginger = useGinger();
ginger.setQueue([{ id: "next", title: "Next", fileUrl: "/next.mp3" }], 0);
```

The second argument is **`currentIndex`** (optional). Omit it to keep the current index when the new list is compatible.

---

## Declarative queue in JSX (`Ginger.Tracks` / `Ginger.Track`)

As an alternative to passing every track in the **`initialTracks`** array, mount **`Ginger.Tracks`** and one **`Ginger.Tracks.Track`** per row (props mirror **`Track`**; **`src`** aliases **`fileUrl`**). Use **`merge="append"`** (default) to append after **`initialTracks`**, **`prepend`** to put declarative tracks first, or **`replace`** for a JSX-only queue. Updates when you add, remove, or reorder **`Ginger.Track`** children.

Imperative **`insertTrack`**, **`removeTrack`**, and **`setQueue()`** stay in place while **`Ginger.Tracks`** is mounted. The declarative list is reapplied only when **`Ginger.Track`** children or **`initialTracks`** change. That membership change dispatches **`SET_QUEUE`**, which clears shuffle and resets timing. Field-only updates (artwork, chapters, lyrics) patch the existing rows and keep the playhead. See [`reference/components.md`](../reference/components.md#gingertracks-and-gingertrack).

---

## Duplicate URLs safely

When multiple **`Track`** rows share the same **`fileUrl`**, assign **distinct `id`** values (or stable unique keys your app uses). Queue mutation, identity helpers, and persistence resume keys all rely on stable per-track identity; duplicate URLs without IDs can make “which row is active” ambiguous.

---

## Handle blocked autoplay

Browsers often block **`audio.play()`** until a user gesture. Ginger surfaces this through:

- **`beforePlay`** — async gate: return `false` to keep paused (e.g. paywall or consent).
- **`onPlayBlocked`** — called when `play()` rejects after the user pressed play.

Configure both on **`Ginger.Provider`** so UI can show a “Tap to enable audio” state without throwing unhandled promise rejections.

---

## Persist and hydrate playback state

Pass a **`persistence`** adapter (get/set for volume, mute, rate, repeat, index, …) and set **`hydrateOnMount`** when you want the provider to **`INIT`** from storage on first paint. Writes wait until that hydration has been applied, so the first save does not overwrite stored values with defaults. Pair with **`resumeOnTrackChange`** if you want per-track resume positions.

---

## Media Session (lock screen / OS controls)

Enable **`mediaSession`** on **`Ginger.Provider`** (boolean or options object). Ginger updates metadata and action handlers when the active track and transport state change. Test with the helpers in [`testing.md`](./testing.md) (`installNavigatorMediaSession`).

---

## Chromecast (`@lucaismyname/ginger/cast`)

Use **`useGingerCast`** after **`loadCastFramework()`** (the hook loads CAF when enabled). Call **`requestSession()`** from a button to pick a Cast device; the hook **`loadMedia`** calls for the current Ginger track and mirrors play/pause/seek on the **Default Media Receiver** (or your own `receiverApplicationId`).

**HTTPS** is required in production (localhost is fine for dev). URLs must be valid for the **Cast device** — check **CORS** and **mixed content** (no HTTP audio on HTTPS pages).

Gate the local element so it does not play in parallel with the TV:

```tsx
import { Ginger } from "@lucaismyname/ginger";
import { useGingerCast } from "@lucaismyname/ginger/cast";

function CastingShell() {
  const { isCasting, requestSession, endSession, error } = useGingerCast();
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={() => void requestSession()}>Cast</button>
      <button type="button" onClick={endSession}>Stop casting</button>
      {!isCasting && <Ginger.Player />}
    </>
  );
}
```

Optional **`syncLocalAudio: "pause-mute"`** keeps a mounted **`Ginger.Player`** muted on the local device while connected. Use **`receiverCurrentTime`** / **`receiverDuration`** from the hook when the local `<audio>` is not driving progress.

---

## Keyboard shortcuts

Call **`useGingerKeyboardShortcuts()`** with a **`bindings`** map and optional **`enabled`** flag. Keeps hotkeys out of control components so you can match your app’s shortcut scheme.

---

## Chapters, lyrics, prefetch, sleep timer, drag seek

| Feature | Entry points |
|---------|----------------|
| Chapters on `Track` | **`useGingerChapters()`**, **`Ginger.Current.Chapters`**, **`useGingerChapterProgress()`** |
| LRC lyrics | **`useGingerLyricsSync()`**, **`parseLrc()`** |
| Prefetch next resource | **`useNextTrackPrefetch()`** |
| Sleep timer | **`useGingerSleepTimer()`** — `durationMs` and/or `stopAfterTracks` (forward advances only) |
| Custom scrubber | **`useSeekDrag()`** |
| Playback history | **`useGingerPlaybackHistory()`** |
| Volume fade | **`useGingerVolumeFade()`** |

Full lists: [`../reference/hooks.md`](../reference/hooks.md).

---

## Queue-end behavior and `onQueueEnd`

**`onQueueEnd`** runs when playback reaches an `ended` transition that resolves to **stop** (not replay-next).

- In **`playbackMode="playlist"`**, that is typically the **last** track when repeat is **`off`**.
- In **`playbackMode="single"`**, that is typically **any** track end unless **`repeatMode`** is **`one`**.
- In **`repeatMode="one"`**, the same track replays and **`onQueueEnd`** does **not** run for that replay.

Use it for “end of album” UX, analytics, or returning to a browse screen.
