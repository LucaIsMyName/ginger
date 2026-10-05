import type { CSSProperties, ReactNode } from "react";

export type RepeatMode = "off" | "all" | "one";
export type PlaybackMode = "playlist" | "single";

/** Default control strings; override via `Ginger.Provider` `locale` prop. */
export type GingerLocaleMessages = {
  seek: string;
  volume: string;
  playbackSpeed: string;
  /** Accessible name for the chapter list (`Ginger.Current.Chapters`). */
  chaptersList: string;
  /** Accessible name for the synced lyrics list (`Ginger.Current.LyricsSynced`). */
  syncedLyricsList: string;
  nextTrack: string;
  previousTrack: string;
  shuffle: string;
  mute: string;
  unmute: string;
  play: string;
  pause: string;
  repeat: Record<RepeatMode, string>;
  playbackRateNormal: string;
  playbackRateTimes: (rate: number) => string;
};

/** A single chapter marker within a track. */
export type TrackChapter = {
  title: string;
  startSeconds: number;
};

/** A single time-stamped lyric line; used for `lyricsTimed` and LRC parsing output. */
export type TrackLyricLine = {
  time: number;
  text: string;
};

export type Track = {
  /** Optional stable identity for duplicate URLs / queue mutations */
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
  lyricsTimed?: TrackLyricLine[];
  chapters?: TrackChapter[];
  /** Hint before metadata loads; never overrides finite media duration */
  durationSeconds?: number;
  /** App-specific data for custom UI; not read by Ginger core */
  metadata?: Record<string, unknown>;
};

export type PlaylistMeta = {
  id?: string;
  title?: string;
  subtitle?: string;
  artworkUrl?: string;
  copyright?: string;
  description?: string;
  /** App-specific data for custom UI; not read by Ginger core */
  metadata?: Record<string, unknown>;
};

export type PlaybackUiState = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

/** High-frequency time/progress fields updated on every time tick. */
export type GingerTimeSlice = {
  currentTime: number;
  duration: number;
  bufferedFraction: number;
  isBuffering: boolean;
  errorMessage: string | null;
};

/** Low-frequency media control fields (volume, rate). */
export type GingerMediaControlSlice = {
  /** 0…1, mirrored on HTMLMediaElement.volume */
  volume: number;
  /** Mirrored on HTMLMediaElement.muted */
  muted: boolean;
  /** Mirrored on HTMLMediaElement.playbackRate (typically 0.25–4) */
  playbackRate: number;
};

export type GingerMediaSlice = GingerTimeSlice & GingerMediaControlSlice;

export type GingerPlaybackSlice = {
  tracks: Track[];
  currentIndex: number;
  playbackMode: PlaybackMode;
  isPaused: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  /** Canonical order before shuffle was enabled; null when shuffle is off */
  originalTracks: Track[] | null;
  playlistMeta: PlaylistMeta | null;
};

export type GingerState = GingerPlaybackSlice & GingerMediaSlice;

export type GingerAction =
  | {
      type: "INIT";
      payload: {
        tracks: Track[];
        currentIndex?: number;
        playlistMeta?: PlaylistMeta | null;
        isPaused?: boolean;
        isShuffled?: boolean;
        repeatMode?: RepeatMode;
        playbackMode?: PlaybackMode;
        volume?: number;
        muted?: boolean;
        playbackRate?: number;
        /** Restored playback position. Omitted values still start at 0. */
        currentTime?: number;
      };
    }
  | { type: "SET_QUEUE"; payload: { tracks: Track[]; currentIndex?: number } }
  | { type: "UPDATE_TRACK_DETAILS"; payload: { tracks: Track[] } }
  | { type: "INSERT_TRACK"; payload: { track: Track; index?: number; autoPlay?: boolean } }
  | { type: "REMOVE_TRACK"; payload: { index: number } }
  | { type: "MOVE_TRACK"; payload: { fromIndex: number; toIndex: number } }
  | { type: "ADD_NEXT"; payload: { track: Track } }
  | { type: "SET_INDEX"; payload: { index: number; autoPlay?: boolean } }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TOGGLE_PAUSE" }
  | { type: "SET_REPEAT"; payload: RepeatMode }
  | { type: "CYCLE_REPEAT" }
  | { type: "TOGGLE_SHUFFLE" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | {
      type: "MEDIA_TIME_UPDATE";
      payload: { currentTime: number; duration: number; bufferedFraction: number };
    }
  | { type: "MEDIA_LOADED_METADATA"; payload: { duration: number; bufferedFraction: number } }
  | { type: "SET_PLAYLIST_META"; payload: PlaylistMeta | null }
  | { type: "SET_PLAYBACK_MODE"; payload: PlaybackMode }
  | { type: "MEDIA_SOURCE_CLEARED" }
  | { type: "MEDIA_ERROR"; payload: { message: string } }
  | { type: "MEDIA_WAITING" }
  | { type: "MEDIA_CANPLAY" }
  | { type: "MEDIA_PLAY" }
  | { type: "MEDIA_PAUSE" }
  | { type: "RESET_MEDIA_TIMES" }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_MUTED"; payload: boolean }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_PLAYBACK_RATE"; payload: number }
  | { type: "MEDIA_VOLUME_SYNC"; payload: { volume: number; muted: boolean } };

/** Payload for `INIT` / `init()`; replaces queue and media timing like a fresh mount. */
export type GingerInitPayload = Extract<GingerAction, { type: "INIT" }>["payload"];

/** Optional Media Session integrations when `mediaSession` is an object (see `GingerProviderProps`). */
export type GingerMediaSessionOptions = {
  /**
   * When set, registers the `seekforward` action to seek ahead by this many seconds
   * (clamped to duration).
   */
  seekForwardSeconds?: number;
  /**
   * When set, registers the `seekbackward` action to seek back by this many seconds
   * (clamped to zero).
   */
  seekBackwardSeconds?: number;
  /**
   * When true, updates `navigator.mediaSession.setPositionState` from current time,
   * duration, and playback rate (best-effort; not all surfaces show it).
   */
  positionState?: boolean;
};

export type GingerProviderProps = {
  children: ReactNode;
  initialTracks?: Track[];
  initialIndex?: number;
  initialPlaylistMeta?: PlaylistMeta | null;
  /** When true, shuffle starts enabled (still applies shuffle transform on mount if tracks.length > 1) */
  initialShuffle?: boolean;
  initialRepeatMode?: RepeatMode;
  initialPlaybackMode?: PlaybackMode;
  initialPaused?: boolean;
  /** 0…1, default 1 */
  initialVolume?: number;
  initialMuted?: boolean;
  /** Default 1; clamped ~0.25–4 on set */
  initialPlaybackRate?: number;
  /**
   * When set, changing this value dispatches `INIT` with the **current** `initialTracks`, `initialIndex`,
   * and other `initial*` props (same as calling `init()`). First paint still uses the reducer initializer only.
   */
  initialStateKey?: string | number;
  /** Override default English strings on built-in controls */
  locale?: Partial<GingerLocaleMessages>;
  /** `true` enables default Media Session bridge; pass an object for optional seek skips and position state. */
  mediaSession?: boolean | GingerMediaSessionOptions;
  beforePlay?: () => boolean | Promise<boolean>;
  onPlayBlocked?: () => void;
  /**
   * When set, automatically retries playback on transient media errors (e.g. network failures)
   * using exponential backoff. Pass `true` for defaults or an object to configure.
   */
  retryOnError?: boolean | GingerRetryConfig;
  /** Fired once when automatic `retryOnError` attempts are exhausted for the current error. */
  onRetryExhausted?: () => void;
  persistence?: GingerPersistenceAdapter;
  hydrateOnMount?: boolean;
  resumeOnTrackChange?: boolean;
  /** Disable default CSS variable/theme styles on provider root. */
  unstyled?: boolean;
  /**
   * Merge provider props (`className`, `style`, `data-ginger-playback`, `dir`) onto the single child
   * element instead of wrapping in an extra `div`. Use for layout systems that forbid wrapper nodes.
   */
  asChild?: boolean;
  className?: string;
  style?: CSSProperties;
  onTrackChange?: (track: Track | null, index: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onQueueEnd?: () => void;
  onError?: (message: string) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onPlaybackRateChange?: (rate: number) => void;
  /**
   * Called whenever `seek()` is invoked (i.e. a programmatic or user-initiated scrub).
   * Fires with the requested time in seconds.
   */
  onSeek?: (timeSeconds: number) => void;
  /**
   * Explicit layout direction for the provider root. When set, this takes priority over the
   * automatic RTL heuristic derived from locale strings.
   */
  dir?: "ltr" | "rtl" | "auto";
  /**
   * Seconds threshold for "restart current track" on previous action.
   * When `currentTime > prevRestartThresholdSeconds`, pressing previous restarts the track
   * instead of skipping to the prior one. Set to `0` to disable. Default: `3`.
   */
  prevRestartThresholdSeconds?: number;
  /** Human-readable label shown in the devtools tab when multiple providers exist. */
  debugLabel?: string;
};

export type GingerPersistenceAdapter = {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
};

export type GingerRetryConfig = {
  /** Maximum number of retry attempts per track error. Default: 3. */
  maxRetries?: number;
  /** Initial delay in milliseconds before the first retry. Doubles on each subsequent attempt. Default: 1500. */
  delayMs?: number;
  /**
   * Which error codes to retry. Default: `["MEDIA_ERR_NETWORK"]`.
   * Non-retryable errors (e.g. `MEDIA_ERR_SRC_NOT_SUPPORTED`) skip immediately.
   */
  retryableErrors?: string[];
  /** When true, skip to next track on unrecoverable (non-retryable) errors instead of stopping. Default: false. */
  skipOnUnrecoverable?: boolean;
};

export type DisplayBaseProps = {
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  empty?: ReactNode;
};
