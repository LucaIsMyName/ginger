import {
  type CSSProperties,
  Children,
  type ReactElement,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { GingerDeclarativeMergeProvider } from "../components/tracks/GingerDeclarativeMergeContext";
import {
  clampPlaybackRate,
  clampVolume,
  createInitialState,
  gingerReducer,
} from "../core/playbackReducer";
import { trackIdentity } from "../core/queue";
import { computeEndedTransition } from "../core/transitions";
import { derivePlaybackUiState } from "../internal/selectors";
import { useMediaSessionBridge } from "../media/useMediaSession";
import type {
  GingerInitPayload,
  GingerProviderProps,
  GingerRetryConfig,
  PlaybackMode,
  PlaylistMeta,
  RepeatMode,
  Track,
} from "../types";
import { GingerContext, type GingerContextValue } from "./GingerContext";
import { GingerLocaleProvider } from "./GingerLocaleContext";
import {
  GingerMediaContext,
  type GingerMediaContextValue,
  GingerMediaControlContext,
  type GingerMediaControlContextValue,
  GingerPlaybackContext,
  type GingerPlaybackContextValue,
  GingerTimeContext,
  type GingerTimeContextValue,
} from "./GingerSplitContexts";

const GINGER_FOCUS_CSS = `[data-ginger-root] :where(button, [role="slider"], input[type="range"], select):focus-visible{outline:none;box-shadow:var(--ginger-focus-ring,0 0 0 2px rgba(59,130,246,.45))}`;

/** Dev-only logging without a Node `process` global. Bundlers may still define it at runtime. */
function isDevEnvironment(): boolean {
  const nodeEnv =
    typeof globalThis !== "undefined" && "process" in globalThis
      ? (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV
      : undefined;
  return nodeEnv != null && nodeEnv !== "production";
}

const defaultProviderStyle: CSSProperties = {
  ["--ginger-primary-color" as string]: "#111827",
  ["--ginger-muted-color" as string]: "#6b7280",
  ["--ginger-font-size" as string]: "14px",
  ["--ginger-font-family" as string]: "system-ui, sans-serif",
  ["--ginger-playlist-row-padding" as string]: "6px 8px",
  ["--ginger-artwork-radius" as string]: "6px",
  ["--ginger-artwork-bg" as string]: "#f3f4f6",
  ["--ginger-playlist-active-bg" as string]: "rgba(17, 24, 39, 0.06)",
  ["--ginger-buffer-color" as string]: "rgba(107, 114, 128, 0.35)",
  ["--ginger-focus-ring" as string]: "0 0 0 2px rgba(59, 130, 246, 0.45)",
};

export function GingerProvider({
  children,
  initialTracks = [],
  initialIndex = 0,
  initialPlaylistMeta = null,
  initialShuffle = false,
  initialRepeatMode = "off",
  initialPlaybackMode = "playlist",
  initialPaused = true,
  initialVolume = 1,
  initialMuted = false,
  initialPlaybackRate = 1,
  initialStateKey,
  locale,
  mediaSession = false,
  beforePlay,
  onPlayBlocked,
  retryOnError,
  persistence,
  hydrateOnMount = false,
  resumeOnTrackChange = false,
  unstyled = false,
  asChild = false,
  className,
  style,
  dir: dirProp,
  prevRestartThresholdSeconds = 3,
  onTrackChange,
  onPlay,
  onPause,
  onQueueEnd,
  onError,
  onVolumeChange,
  onPlaybackRateChange,
  onSeek,
  debugLabel,
}: GingerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, dispatch] = useReducer(gingerReducer, undefined, () =>
    createInitialState({
      tracks: initialTracks,
      currentIndex: initialIndex,
      playlistMeta: initialPlaylistMeta,
      isPaused: initialPaused,
      isShuffled: initialShuffle,
      repeatMode: initialRepeatMode,
      playbackMode: initialPlaybackMode,
      volume: initialVolume,
      muted: initialMuted,
      playbackRate: initialPlaybackRate,
    }),
  );
  const stateRef = useRef(state);

  const latestInitRef = useRef({
    tracks: initialTracks,
    currentIndex: initialIndex,
    playlistMeta: initialPlaylistMeta,
    isPaused: initialPaused,
    isShuffled: initialShuffle,
    repeatMode: initialRepeatMode,
    playbackMode: initialPlaybackMode,
    volume: initialVolume,
    muted: initialMuted,
    playbackRate: initialPlaybackRate,
  });
  latestInitRef.current = {
    tracks: initialTracks,
    currentIndex: initialIndex,
    playlistMeta: initialPlaylistMeta,
    isPaused: initialPaused,
    isShuffled: initialShuffle,
    repeatMode: initialRepeatMode,
    playbackMode: initialPlaybackMode,
    volume: initialVolume,
    muted: initialMuted,
    playbackRate: initialPlaybackRate,
  };

  const prevInitialStateKeyRef = useRef<typeof initialStateKey>(undefined);

  useEffect(() => {
    if (initialStateKey === undefined) {
      prevInitialStateKeyRef.current = undefined;
      return;
    }
    if (prevInitialStateKeyRef.current === undefined) {
      prevInitialStateKeyRef.current = initialStateKey;
      return;
    }
    if (prevInitialStateKeyRef.current === initialStateKey) return;
    prevInitialStateKeyRef.current = initialStateKey;
    const p = latestInitRef.current;
    dispatch({
      type: "INIT",
      payload: {
        tracks: p.tracks,
        currentIndex: p.currentIndex,
        playlistMeta: p.playlistMeta,
        isPaused: p.isPaused,
        isShuffled: p.isShuffled,
        repeatMode: p.repeatMode,
        playbackMode: p.playbackMode,
        volume: p.volume,
        muted: p.muted,
        playbackRate: p.playbackRate,
      },
    });
  }, [initialStateKey]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const currentTrack = state.tracks[state.currentIndex] ?? null;

  useEffect(() => {
    onTrackChange?.(currentTrack, state.currentIndex);
  }, [currentTrack, state.currentIndex, onTrackChange]);

  useEffect(() => {
    if (state.errorMessage) onError?.(state.errorMessage);
  }, [state.errorMessage, onError]);

  const retryCountRef = useRef(0);
  const retryTrackUrlRef = useRef<string | undefined>(undefined);
  const retryConfig: GingerRetryConfig | null = retryOnError
    ? typeof retryOnError === "object"
      ? retryOnError
      : {}
    : null;
  const retryMaxRetries = retryConfig?.maxRetries ?? 3;
  const retryDelayMs = retryConfig?.delayMs ?? 1500;
  const retryableErrors = retryConfig?.retryableErrors ?? ["MEDIA_ERR_NETWORK"];
  const retrySkipOnUnrecoverable = retryConfig?.skipOnUnrecoverable ?? false;

  useEffect(() => {
    const trackUrl = state.tracks[state.currentIndex]?.fileUrl;
    if (retryTrackUrlRef.current !== trackUrl) {
      retryCountRef.current = 0;
      retryTrackUrlRef.current = trackUrl;
    }
  }, [state.currentIndex, state.tracks]);

  useEffect(() => {
    if (!retryConfig || !state.errorMessage) return;

    const isRetryable = retryableErrors.some((code) => state.errorMessage!.includes(code));

    if (!isRetryable) {
      if (retrySkipOnUnrecoverable && state.tracks.length > 1) {
        const timer = setTimeout(() => dispatch({ type: "NEXT" }), 500);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (retryCountRef.current >= retryMaxRetries) return;

    const attempt = retryCountRef.current;
    const delay = retryDelayMs * 2 ** attempt;
    const timer = setTimeout(() => {
      retryCountRef.current = attempt + 1;
      const el = audioRef.current;
      if (!el) return;
      el.load();
      dispatch({ type: "PLAY" });
    }, delay);
    return () => clearTimeout(timer);
  }, [
    retryConfig,
    retryMaxRetries,
    retryDelayMs,
    retryableErrors,
    retrySkipOnUnrecoverable,
    state.errorMessage,
    state.tracks.length,
  ]);

  const prevPausedRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (prevPausedRef.current === undefined) {
      prevPausedRef.current = state.isPaused;
      return;
    }
    if (prevPausedRef.current !== state.isPaused) {
      if (state.isPaused) onPause?.();
      else onPlay?.();
    }
    prevPausedRef.current = state.isPaused;
  }, [state.isPaused, onPause, onPlay]);

  const prevVolumeRef = useRef<number | undefined>(undefined);
  const prevMutedRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (prevVolumeRef.current === undefined || prevMutedRef.current === undefined) {
      prevVolumeRef.current = state.volume;
      prevMutedRef.current = state.muted;
      return;
    }
    if (prevVolumeRef.current !== state.volume || prevMutedRef.current !== state.muted) {
      onVolumeChange?.(state.volume, state.muted);
    }
    prevVolumeRef.current = state.volume;
    prevMutedRef.current = state.muted;
  }, [state.volume, state.muted, onVolumeChange]);

  const prevPlaybackRateRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (prevPlaybackRateRef.current === undefined) {
      prevPlaybackRateRef.current = state.playbackRate;
      return;
    }
    if (prevPlaybackRateRef.current !== state.playbackRate) {
      onPlaybackRateChange?.(state.playbackRate);
    }
    prevPlaybackRateRef.current = state.playbackRate;
  }, [state.playbackRate, onPlaybackRateChange]);

  const play = useCallback(() => {
    dispatch({ type: "PLAY" });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "PAUSE" });
    audioRef.current?.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (stateRef.current.isPaused) play();
    else pause();
  }, [pause, play]);

  const seek = useCallback(
    (timeSeconds: number, durationHint?: number) => {
      if (!Number.isFinite(timeSeconds)) return;
      const t = Math.max(0, timeSeconds);
      const el = audioRef.current;
      if (el) el.currentTime = t;
      const elementDuration = el?.duration;
      const duration =
        typeof durationHint === "number" && Number.isFinite(durationHint)
          ? durationHint
          : typeof elementDuration === "number" &&
              Number.isFinite(elementDuration) &&
              elementDuration > 0
            ? elementDuration
            : stateRef.current.duration;
      dispatch({
        type: "MEDIA_TIME_UPDATE",
        payload: {
          currentTime: t,
          duration,
          bufferedFraction: stateRef.current.bufferedFraction,
        },
      });
      onSeek?.(t);
    },
    [onSeek],
  );

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: "SET_VOLUME", payload: clampVolume(volume) });
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    dispatch({ type: "SET_MUTED", payload: muted });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: "TOGGLE_MUTE" });
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    dispatch({ type: "SET_PLAYBACK_RATE", payload: clampPlaybackRate(rate) });
  }, []);

  const next = useCallback(() => {
    dispatch({ type: "NEXT" });
  }, []);

  const prev = useCallback(() => {
    const el = audioRef.current;
    const threshold = prevRestartThresholdSeconds ?? 3;
    if (el && threshold > 0 && el.currentTime > threshold) {
      seek(0);
    } else {
      dispatch({ type: "PREV" });
    }
  }, [prevRestartThresholdSeconds, seek]);

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    dispatch({ type: "SET_REPEAT", payload: mode });
  }, []);

  const cycleRepeat = useCallback(() => {
    dispatch({ type: "CYCLE_REPEAT" });
  }, []);

  const toggleShuffle = useCallback(() => {
    dispatch({ type: "TOGGLE_SHUFFLE" });
  }, []);

  const setQueue = useCallback((tracks: Track[], currentIndex?: number) => {
    dispatch({ type: "SET_QUEUE", payload: { tracks, currentIndex } });
  }, []);

  const insertTrackAt = useCallback((track: Track, index?: number, autoPlay?: boolean) => {
    dispatch({ type: "INSERT_TRACK", payload: { track, index, autoPlay } });
  }, []);

  const removeTrackAt = useCallback((index: number) => {
    dispatch({ type: "REMOVE_TRACK", payload: { index } });
  }, []);

  const moveTrack = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: "MOVE_TRACK", payload: { fromIndex, toIndex } });
  }, []);

  const enqueueNext = useCallback((track: Track) => {
    dispatch({ type: "ADD_NEXT", payload: { track } });
  }, []);

  const playTrackAt = useCallback((index: number) => {
    dispatch({ type: "SET_INDEX", payload: { index, autoPlay: true } });
  }, []);

  const selectTrackAt = useCallback((index: number) => {
    dispatch({ type: "SET_INDEX", payload: { index, autoPlay: false } });
  }, []);

  const setPlaylistMeta = useCallback((meta: PlaylistMeta | null) => {
    dispatch({ type: "SET_PLAYLIST_META", payload: meta });
  }, []);

  const setPlaybackMode = useCallback((mode: PlaybackMode) => {
    dispatch({ type: "SET_PLAYBACK_MODE", payload: mode });
  }, []);

  const init = useCallback((payload: GingerInitPayload) => {
    dispatch({ type: "INIT", payload });
  }, []);

  const [persistenceReady, setPersistenceReady] = useState(() => !hydrateOnMount || !persistence);

  useEffect(() => {
    if (!persistence || !hydrateOnMount) return;
    try {
      const volume = persistence.get("ginger:volume");
      const muted = persistence.get("ginger:muted");
      const playbackRate = persistence.get("ginger:playbackRate");
      const repeatMode = persistence.get("ginger:repeatMode");
      const currentIndex = persistence.get("ginger:currentIndex");
      const p = latestInitRef.current;
      dispatch({
        type: "INIT",
        payload: {
          tracks: p.tracks,
          playlistMeta: p.playlistMeta,
          isPaused: p.isPaused,
          isShuffled: p.isShuffled,
          playbackMode: p.playbackMode,
          currentIndex: typeof currentIndex === "number" ? currentIndex : p.currentIndex,
          repeatMode:
            repeatMode === "off" || repeatMode === "all" || repeatMode === "one"
              ? repeatMode
              : p.repeatMode,
          volume: typeof volume === "number" ? volume : p.volume,
          muted: typeof muted === "boolean" ? muted : p.muted,
          playbackRate: typeof playbackRate === "number" ? playbackRate : p.playbackRate,
        },
      });
    } catch (e) {
      if (isDevEnvironment()) {
        console.warn("[@lucaismyname/ginger] persistence.get() threw during hydration:", e);
      }
    } finally {
      setPersistenceReady(true);
    }
  }, [hydrateOnMount, persistence]);

  useEffect(() => {
    if (!persistence || !persistenceReady) return;
    try {
      persistence.set("ginger:volume", state.volume);
      persistence.set("ginger:muted", state.muted);
      persistence.set("ginger:playbackRate", state.playbackRate);
      persistence.set("ginger:repeatMode", state.repeatMode);
      persistence.set("ginger:currentIndex", state.currentIndex);
    } catch (e) {
      if (isDevEnvironment()) {
        console.warn("[@lucaismyname/ginger] persistence.set() threw:", e);
      }
    }
  }, [
    persistence,
    persistenceReady,
    state.volume,
    state.muted,
    state.playbackRate,
    state.repeatMode,
    state.currentIndex,
  ]);

  useEffect(() => {
    if (!persistence || !resumeOnTrackChange) return;
    const track = state.tracks[state.currentIndex];
    if (!track) return;
    const key = `ginger:resume:${trackIdentity(track)}`;
    try {
      const saved = persistence.get(key);
      if (typeof saved === "number" && Number.isFinite(saved)) {
        seek(saved);
      }
    } catch (e) {
      if (isDevEnvironment()) {
        console.warn("[@lucaismyname/ginger] persistence.get() threw during resume:", e);
      }
    }
  }, [persistence, resumeOnTrackChange, state.currentIndex, state.tracks, seek]);

  useEffect(() => {
    if (!persistence || !resumeOnTrackChange) return;
    const id = setInterval(() => {
      const s = stateRef.current;
      const track = s.tracks[s.currentIndex];
      if (!track || !(s.currentTime >= 0)) return;
      const key = `ginger:resume:${trackIdentity(track)}`;
      try {
        persistence.set(key, s.currentTime);
      } catch (e) {
        if (isDevEnvironment()) {
          console.warn("[@lucaismyname/ginger] persistence.set() threw during resume save:", e);
        }
      }
    }, 5000);
    return () => clearInterval(id);
  }, [persistence, resumeOnTrackChange]);

  const currentUrl = state.tracks[state.currentIndex]?.fileUrl;

  // biome-ignore lint/correctness/useExhaustiveDependencies: `currentUrl` cancels in-flight play when the active track/source changes; not implied by `state.isPaused` alone.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (state.isPaused) {
      el.pause();
      return;
    }
    // Guard against replay loops when a stale "play" state lands after queue-end.
    if (el.ended && computeEndedTransition(stateRef.current).kind === "stop") {
      dispatch({ type: "PAUSE" });
      return;
    }
    let cancelled = false;
    void (async () => {
      if (beforePlay) {
        let allowed = false;
        try {
          allowed = await beforePlay();
        } catch (error) {
          const message = error instanceof Error ? error.message : "beforePlay rejected";
          dispatch({ type: "MEDIA_ERROR", payload: { message } });
          return;
        }
        if (!allowed) {
          if (!cancelled) {
            dispatch({ type: "PAUSE" });
            onPlayBlocked?.();
          }
          return;
        }
      }
      if (cancelled) return;
      void el.play().catch((e: unknown) => {
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "string"
              ? e
              : "Playback failed (e.g. autoplay blocked or unavailable source)";
        dispatch({ type: "MEDIA_ERROR", payload: { message: msg } });
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [beforePlay, currentUrl, onPlayBlocked, state.isPaused]);

  const notifyEnded = useCallback(() => {
    const transition = computeEndedTransition(stateRef.current);
    if (transition.kind === "replay_same") {
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
      }
      dispatch({ type: "PLAY" });
      return;
    }
    if (transition.kind === "stop") {
      audioRef.current?.pause();
      dispatch({ type: "PAUSE" });
      onQueueEnd?.();
      return;
    }
    const nextIndex = transition.nextIndex;
    dispatch({ type: "SET_INDEX", payload: { index: nextIndex, autoPlay: true } });
  }, [onQueueEnd]);

  const mediaSessionActions = useMemo(
    () => ({ play, pause, next, prev, seek }),
    [play, pause, next, prev, seek],
  );
  const mediaSessionEnabled = typeof mediaSession === "object" ? true : Boolean(mediaSession);
  const mediaSessionBridgeOptions = useMemo(
    () => (typeof mediaSession === "object" ? mediaSession : {}),
    [mediaSession],
  );
  useMediaSessionBridge(mediaSessionEnabled, state, mediaSessionActions, mediaSessionBridgeOptions);

  const providerDir =
    dirProp ?? (locale?.seek && /[\u0590-\u08FF]/.test(locale.seek) ? "rtl" : "ltr");

  const value = useMemo<GingerContextValue>(
    () => ({
      state,
      dispatch,
      audioRef,
      notifyEnded,
      init,
      play,
      pause,
      togglePlayPause,
      seek,
      setVolume,
      setMuted,
      toggleMute,
      setPlaybackRate,
      next,
      prev,
      setRepeatMode,
      cycleRepeat,
      toggleShuffle,
      setQueue,
      insertTrackAt,
      removeTrackAt,
      moveTrack,
      enqueueNext,
      playTrackAt,
      selectTrackAt,
      setPlaylistMeta,
      setPlaybackMode,
    }),
    [
      cycleRepeat,
      init,
      next,
      notifyEnded,
      pause,
      play,
      playTrackAt,
      insertTrackAt,
      removeTrackAt,
      moveTrack,
      enqueueNext,
      selectTrackAt,
      prev,
      seek,
      setMuted,
      setPlaybackRate,
      setQueue,
      setRepeatMode,
      setPlaylistMeta,
      setPlaybackMode,
      setVolume,
      state,
      toggleMute,
      togglePlayPause,
      toggleShuffle,
    ],
  );

  const playbackValue = useMemo<GingerPlaybackContextValue>(
    () => ({
      tracks: state.tracks,
      currentIndex: state.currentIndex,
      isPaused: state.isPaused,
      isShuffled: state.isShuffled,
      repeatMode: state.repeatMode,
      originalTracks: state.originalTracks,
      playlistMeta: state.playlistMeta,
      init,
      play,
      pause,
      togglePlayPause,
      next,
      prev,
      setRepeatMode,
      cycleRepeat,
      toggleShuffle,
      playbackMode: state.playbackMode,
      setQueue,
      insertTrackAt,
      removeTrackAt,
      moveTrack,
      enqueueNext,
      playTrackAt,
      selectTrackAt,
      setPlaylistMeta,
      setPlaybackMode,
      dispatch,
    }),
    [
      state.tracks,
      state.currentIndex,
      state.isPaused,
      state.isShuffled,
      state.repeatMode,
      state.playbackMode,
      state.originalTracks,
      state.playlistMeta,
      init,
      play,
      pause,
      togglePlayPause,
      next,
      prev,
      setRepeatMode,
      cycleRepeat,
      toggleShuffle,
      setQueue,
      insertTrackAt,
      removeTrackAt,
      moveTrack,
      enqueueNext,
      playTrackAt,
      selectTrackAt,
      setPlaylistMeta,
      setPlaybackMode,
    ],
  );

  const mediaValue = useMemo<GingerMediaContextValue>(
    () => ({
      currentTime: state.currentTime,
      duration: state.duration,
      bufferedFraction: state.bufferedFraction,
      isBuffering: state.isBuffering,
      errorMessage: state.errorMessage,
      volume: state.volume,
      muted: state.muted,
      playbackRate: state.playbackRate,
      seek,
      setVolume,
      setMuted,
      toggleMute,
      setPlaybackRate,
      audioRef,
      notifyEnded,
      dispatch,
    }),
    [
      state.currentTime,
      state.duration,
      state.bufferedFraction,
      state.isBuffering,
      state.errorMessage,
      state.volume,
      state.muted,
      state.playbackRate,
      seek,
      setVolume,
      setMuted,
      toggleMute,
      setPlaybackRate,
      notifyEnded,
    ],
  );

  const timeValue = useMemo<GingerTimeContextValue>(
    () => ({
      currentTime: state.currentTime,
      duration: state.duration,
      bufferedFraction: state.bufferedFraction,
      isBuffering: state.isBuffering,
      errorMessage: state.errorMessage,
    }),
    [
      state.currentTime,
      state.duration,
      state.bufferedFraction,
      state.isBuffering,
      state.errorMessage,
    ],
  );

  const mediaControlValue = useMemo<GingerMediaControlContextValue>(
    () => ({
      volume: state.volume,
      muted: state.muted,
      playbackRate: state.playbackRate,
      seek,
      setVolume,
      setMuted,
      toggleMute,
      setPlaybackRate,
      audioRef,
      notifyEnded,
      dispatch,
    }),
    [
      state.volume,
      state.muted,
      state.playbackRate,
      seek,
      setVolume,
      setMuted,
      toggleMute,
      setPlaybackRate,
      notifyEnded,
    ],
  );

  const playbackUi = derivePlaybackUiState(state);

  const mergedStyle = useMemo(
    () => (unstyled ? style : { ...defaultProviderStyle, ...style }),
    [style, unstyled],
  );

  const shellProps = useMemo(
    () => ({
      className,
      style: mergedStyle,
      "data-ginger-playback": playbackUi,
      dir: providerDir,
    }),
    [className, mergedStyle, playbackUi, providerDir],
  );

  // --- Devtools auto-registration (zero-cost when devtools not loaded) ---
  const providerIdRef = useRef<string | null>(null);
  const devtoolsActionsRef = useRef({
    play,
    pause,
    togglePlayPause,
    next,
    prev,
    seek,
    setVolume,
    setMuted,
    toggleMute,
    setPlaybackRate,
    setRepeatMode,
    cycleRepeat,
    toggleShuffle,
    playTrackAt,
    setPlaybackMode,
  });
  devtoolsActionsRef.current = {
    play,
    pause,
    togglePlayPause,
    next,
    prev,
    seek,
    setVolume,
    setMuted,
    toggleMute,
    setPlaybackRate,
    setRepeatMode,
    cycleRepeat,
    toggleShuffle,
    playTrackAt,
    setPlaybackMode,
  };

  useEffect(() => {
    const reg =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>).__GINGER_DEVTOOLS__
        : null;
    if (!reg || typeof (reg as { register?: unknown }).register !== "function") return;
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `ginger-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    providerIdRef.current = id;
    (reg as { register: (id: string, p: Record<string, unknown>) => void }).register(id, {
      label: debugLabel,
      state: stateRef.current,
      actions: devtoolsActionsRef.current,
      audioSrc: audioRef.current?.src ?? null,
    });
    return () => {
      (reg as { unregister: (id: string) => void }).unregister(id);
      providerIdRef.current = null;
    };
  }, [debugLabel]);

  useEffect(() => {
    const reg =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>).__GINGER_DEVTOOLS__
        : null;
    if (!reg || typeof (reg as { update?: unknown }).update !== "function") return;
    const timer = setInterval(() => {
      const pid = providerIdRef.current;
      if (!pid) return;
      (reg as { update: (id: string, p: Record<string, unknown>) => void }).update(pid, {
        state: stateRef.current,
        audioSrc: audioRef.current?.src ?? null,
      });
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const shell = useMemo(() => {
    if (!asChild) {
      return (
        <div
          className={shellProps.className}
          style={shellProps.style}
          data-ginger-root=""
          data-ginger-playback={shellProps["data-ginger-playback"]}
          dir={shellProps.dir}
        >
          {children}
        </div>
      );
    }
    const only = Children.only(children);
    if (!isValidElement(only)) {
      throw new Error("Ginger.Provider asChild expects a single React element child.");
    }
    const child = only as ReactElement<{ className?: string; style?: CSSProperties }>;
    const childStyle = child.props.style;
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      className: mergeClassNames(child.props.className, shellProps.className),
      style:
        childStyle && typeof childStyle === "object"
          ? { ...childStyle, ...shellProps.style }
          : shellProps.style,
      "data-ginger-root": "",
      "data-ginger-playback": shellProps["data-ginger-playback"],
      dir: shellProps.dir,
    });
  }, [asChild, children, shellProps]);

  const declarativeMergeValue = useMemo(
    () => ({
      getInitialTracksSnapshot: () => latestInitRef.current.tracks,
    }),
    [],
  );

  return (
    <GingerLocaleProvider locale={locale}>
      <GingerDeclarativeMergeProvider value={declarativeMergeValue}>
        <GingerPlaybackContext.Provider value={playbackValue}>
          <GingerTimeContext.Provider value={timeValue}>
            <GingerMediaControlContext.Provider value={mediaControlValue}>
              <GingerMediaContext.Provider value={mediaValue}>
                <GingerContext.Provider value={value}>{shell}</GingerContext.Provider>
              </GingerMediaContext.Provider>
            </GingerMediaControlContext.Provider>
          </GingerTimeContext.Provider>
        </GingerPlaybackContext.Provider>
      </GingerDeclarativeMergeProvider>
      <style>{GINGER_FOCUS_CSS}</style>
    </GingerLocaleProvider>
  );
}

function mergeClassNames(a?: string, b?: string): string | undefined {
  const merged = [a, b].filter(Boolean).join(" ");
  return merged === "" ? undefined : merged;
}
