import { type Dispatch, type MutableRefObject, createContext, useContext, useMemo } from "react";
import type {
  GingerAction,
  GingerInitPayload,
  GingerMediaControlSlice,
  GingerMediaSlice,
  GingerPlaybackSlice,
  GingerState,
  GingerTimeSlice,
  PlaybackMode,
  PlaylistMeta,
  RepeatMode,
  Track,
} from "../types";

export type GingerPlaybackActions = {
  init: (payload: GingerInitPayload) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  next: () => void;
  prev: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  setQueue: (tracks: Track[], currentIndex?: number) => void;
  insertTrackAt: (track: Track, index?: number, autoPlay?: boolean) => void;
  removeTrackAt: (index: number) => void;
  moveTrack: (fromIndex: number, toIndex: number) => void;
  enqueueNext: (track: Track) => void;
  playTrackAt: (index: number) => void;
  selectTrackAt: (index: number) => void;
  setPlaylistMeta: (meta: PlaylistMeta | null) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  dispatch: Dispatch<GingerAction>;
};

export type GingerPlaybackContextValue = GingerPlaybackSlice & GingerPlaybackActions;

export type GingerMediaActions = {
  seek: (timeSeconds: number, durationHint?: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  notifyEnded: () => void;
  dispatch: Dispatch<GingerAction>;
};

export type GingerMediaContextValue = GingerMediaSlice & GingerMediaActions;

/** High-frequency time/progress context value. */
export type GingerTimeContextValue = GingerTimeSlice;

/** Low-frequency media control context value (volume, rate, actions). */
export type GingerMediaControlContextValue = GingerMediaControlSlice & GingerMediaActions;

const GingerPlaybackContext = createContext<GingerPlaybackContextValue | null>(null);
const GingerMediaContext = createContext<GingerMediaContextValue | null>(null);
const GingerTimeContext = createContext<GingerTimeContextValue | null>(null);
const GingerMediaControlContext = createContext<GingerMediaControlContextValue | null>(null);

export function useGingerPlayback(): GingerPlaybackContextValue {
  const ctx = useContext(GingerPlaybackContext);
  if (!ctx) throw new Error("Ginger hooks must be used within <Ginger.Provider>");
  return ctx;
}

/**
 * Full media context (time + controls merged). Re-renders on every time tick.
 * Prefer `useGingerTime()` or `useGingerMediaControls()` for narrower subscriptions.
 */
export function useGingerMedia(): GingerMediaContextValue {
  const ctx = useContext(GingerMediaContext);
  if (!ctx) throw new Error("Ginger hooks must be used within <Ginger.Provider>");
  return ctx;
}

/**
 * High-frequency time slice only (currentTime, duration, bufferedFraction, isBuffering, errorMessage).
 * Use when you only need progress/time data and want to avoid re-renders from volume/rate changes.
 */
export function useGingerTime(): GingerTimeContextValue {
  const ctx = useContext(GingerTimeContext);
  if (!ctx) throw new Error("Ginger hooks must be used within <Ginger.Provider>");
  return ctx;
}

/**
 * Low-frequency media controls (volume, muted, playbackRate, seek, setVolume, etc.).
 * Does NOT re-render on time ticks — only when volume, mute, or playback rate changes.
 */
export function useGingerMediaControls(): GingerMediaControlContextValue {
  const ctx = useContext(GingerMediaControlContext);
  if (!ctx) throw new Error("Ginger hooks must be used within <Ginger.Provider>");
  return ctx;
}

const IDLE_TIME: GingerTimeSlice = {
  currentTime: 0,
  duration: 0,
  bufferedFraction: 0,
  isBuffering: false,
  errorMessage: null,
};

function mediaValueFrom(
  time: GingerTimeSlice,
  controls: GingerMediaControlContextValue,
): GingerMediaContextValue {
  return {
    ...time,
    volume: controls.volume,
    muted: controls.muted,
    playbackRate: controls.playbackRate,
    seek: controls.seek,
    setVolume: controls.setVolume,
    setMuted: controls.setMuted,
    toggleMute: controls.toggleMute,
    setPlaybackRate: controls.setPlaybackRate,
    audioRef: controls.audioRef,
    notifyEnded: controls.notifyEnded,
    dispatch: controls.dispatch,
  };
}

/**
 * Playback and media controls only. Does not re-render on time ticks.
 * Time fields on the returned state stay at their idle values.
 */
export function useGingerMetadataState(): GingerState {
  const pb = useGingerPlayback();
  const controls = useGingerMediaControls();
  return useMemo(
    () => gingerStateFromContextValues(pb, mediaValueFrom(IDLE_TIME, controls)),
    [pb, controls],
  );
}

/** Playback plus the high-frequency time slice. Use for clocks, rails, and playback status. */
export function useGingerClockState(): GingerState {
  const pb = useGingerPlayback();
  const time = useGingerTime();
  const controls = useGingerMediaControls();
  return useMemo(
    () => gingerStateFromContextValues(pb, mediaValueFrom(time, controls)),
    [pb, time, controls],
  );
}

/** Full merged state; prefer over `useGingerContext().state` so updates follow playback vs media splits. */
export function useGingerState(): GingerState {
  const pb = useGingerPlayback();
  const md = useGingerMedia();
  return useMemo(() => gingerStateFromContextValues(pb, md), [pb, md]);
}

/** Merge playback + media slices (for selectors and `useGinger`). */
export function gingerStateFromContexts(
  playback: GingerPlaybackSlice,
  media: GingerMediaSlice,
): GingerState {
  return { ...playback, ...media };
}

/** Merge full context values into `GingerState` (strips action fields). */
export function gingerStateFromContextValues(
  pb: GingerPlaybackContextValue,
  md: GingerMediaContextValue,
): GingerState {
  const {
    init: _i,
    play: _p,
    pause: _pa,
    togglePlayPause: _t,
    next: _n,
    prev: _pr,
    setRepeatMode: _sr,
    cycleRepeat: _cr,
    toggleShuffle: _ts,
    setQueue: _sq,
    insertTrackAt: _ita,
    removeTrackAt: _rta,
    moveTrack: _mt,
    enqueueNext: _en,
    playTrackAt: _pta,
    selectTrackAt: _sta,
    setPlaylistMeta: _spm,
    setPlaybackMode: _spbm,
    dispatch: _d1,
    ...playbackRest
  } = pb;
  const {
    seek: _sk,
    setVolume: _sv,
    setMuted: _sm,
    toggleMute: _tm,
    setPlaybackRate: _spr,
    audioRef: _ar,
    notifyEnded: _ne,
    dispatch: _d2,
    ...mediaRest
  } = md;
  return { ...playbackRest, ...mediaRest };
}

export { GingerPlaybackContext, GingerMediaContext, GingerTimeContext, GingerMediaControlContext };
