import { useCallback, useEffect, useRef, useState } from "react";
import { useGingerMedia, useGingerPlayback } from "../context/GingerSplitContexts";
import { computeEndedTransition } from "../core/transitions";
import { beginEndedSuppression, clearEndedSuppression } from "../internal/suppressNaturalEnded";
import {
  type CrossfadeCurve,
  type CrossfadeGraph,
  attachCrossfadeGraph,
  scheduleCrossfade,
  teardownCrossfadeGraph,
} from "./crossfadeGraph";

export type { CrossfadeCurve };

export type UseGingerCrossfadeOptions = {
  /**
   * Duration of the crossfade in seconds.
   * The hook begins the fade when `timeRemaining ≤ duration`.
   * @default 3
   */
  duration?: number;
  /**
   * Gain curve shape applied to both gain nodes.
   * `"equal-power"` uses a cosine/sine curve to maintain consistent perceived
   * loudness; `"linear"` is a straight ramp that may dip slightly at the midpoint.
   * @default "equal-power"
   */
  curve?: CrossfadeCurve;
  /**
   * `crossOrigin` attribute for the incoming `<audio>` element.
   * Match this to the `crossOrigin` prop on `Ginger.Player` when serving
   * cross-origin audio so the browser can reuse the cached resource.
   */
  crossOrigin?: "" | "anonymous" | "use-credentials";
  /**
   * When `false`, crossfade is completely disabled and playback falls back to
   * the default hard-cut transition.
   * @default true
   */
  enabled?: boolean;
};

export type UseGingerCrossfadeResult = {
  /** `true` while a crossfade transition is actively in progress. */
  isCrossfading: boolean;
  /**
   * Progress of the current crossfade from `0` (start) to `1` (complete).
   * Always `0` when idle.
   */
  crossfadeProgress: number;
  /** Set when the shared audio graph cannot be attached. `null` while idle or fading. */
  error: string | null;
};

function releaseIncoming(audio: HTMLAudioElement) {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
}

type CrossfadeSession = {
  graph: CrossfadeGraph;
  incomingAudio: HTMLAudioElement;
  startedAtIndex: number;
  startTime: number;
  fadeDurationMs: number;
  timeoutId: ReturnType<typeof setTimeout>;
  rafId: number;
  aborted: boolean;
  /** Set once this session has committed the queue advance, so index changes are not treated as a user skip. */
  committed: boolean;
  releaseEnded: () => void;
};

/**
 * Smoothly crossfades between consecutive tracks using the Web Audio API.
 *
 * When the remaining time on the current track falls below `duration`, the hook:
 * 1. Creates a hidden `<audio>` element and begins loading the next track.
 * 2. Routes both the outgoing and incoming elements through `GainNode`s in a
 *    shared `AudioContext`.
 * 3. Schedules gain ramps so the outgoing track fades out while the incoming
 *    track fades in simultaneously.
 * 4. Dispatches `SET_INDEX` once the ramp completes so the Ginger queue
 *    advances to the new track.
 *
 * **Limitations:**
 * - Uses the same `AudioContext` as the equalizer, spatial panner, and live analyzer.
 *   The outgoing track runs through that processing chain; the incoming track is gained
 *   directly to the destination for the duration of the fade.
 * - Requires a prior user gesture before `AudioContext` can be resumed (standard
 *   Web Audio policy).
 * - When `repeatMode` is `"one"`, the crossfade replays the same track from the
 *   beginning, matching the standard `notifyEnded` behaviour.
 *
 * Available as a subpath import:
 * ```ts
 * import { useGingerCrossfade } from "@lucaismyname/ginger/crossfade";
 * ```
 */
export function useGingerCrossfade(
  options: UseGingerCrossfadeOptions = {},
): UseGingerCrossfadeResult {
  const { duration = 3, curve = "equal-power", crossOrigin, enabled = true } = options;

  const { tracks, currentIndex, isPaused, repeatMode, playbackMode, dispatch } =
    useGingerPlayback();
  const { currentTime, duration: trackDuration, audioRef, muted, volume } = useGingerMedia();

  const [isCrossfading, setIsCrossfading] = useState(false);
  const [crossfadeProgress, setCrossfadeProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<CrossfadeSession | null>(null);

  const abort = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.aborted = true;
    clearTimeout(session.timeoutId);
    cancelAnimationFrame(session.rafId);
    teardownCrossfadeGraph(session.graph);
    session.releaseEnded();
    clearEndedSuppression();
    releaseIncoming(session.incomingAudio);
    sessionRef.current = null;
    setIsCrossfading(false);
    setCrossfadeProgress(0);
  }, []);

  // Abort if the user pauses or manually changes the track mid-fade.
  // A committed session already advanced the queue; do not tear that down.
  useEffect(() => {
    const session = sessionRef.current;
    if (!session || session.committed) return;
    if (isPaused || currentIndex !== session.startedAtIndex) {
      abort();
    }
  }, [isPaused, currentIndex, abort]);

  // Clean up on unmount.
  // biome-ignore lint/correctness/useExhaustiveDependencies: abort is stable; intentional unmount-only cleanup
  useEffect(() => () => abort(), []);

  // Keep the incoming element's volume/muted in sync with Ginger state so that
  // the user's volume control applies to the incoming track during the fade.
  useEffect(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.incomingAudio.volume = volume;
    session.incomingAudio.muted = muted;
  }, [volume, muted]);

  // Refs for polling-based crossfade trigger (avoids re-running the effect on every time tick).
  const mediaRef = useRef({ currentTime: 0, trackDuration: 0 });
  mediaRef.current = { currentTime, trackDuration };

  const crossfadeConfigRef = useRef({
    tracks,
    currentIndex,
    repeatMode,
    playbackMode,
    volume,
    muted,
  });
  crossfadeConfigRef.current = { tracks, currentIndex, repeatMode, playbackMode, volume, muted };

  // Main trigger: poll at a reasonable interval to detect when crossfade should start.
  useEffect(() => {
    if (!enabled || isPaused || typeof window === "undefined") return;

    const POLL_INTERVAL_MS = 250;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const tryStartCrossfade = () => {
      if (sessionRef.current) return;

      const { currentTime: ct, trackDuration: td } = mediaRef.current;
      if (!(td > 0)) return;

      const timeRemaining = td - ct;
      if (timeRemaining > duration || timeRemaining <= 0) return;

      const {
        tracks: tr,
        currentIndex: ci,
        repeatMode: rm,
        playbackMode: pm,
        volume: v,
        muted: m,
      } = crossfadeConfigRef.current;

      const transition = computeEndedTransition({
        tracks: tr,
        currentIndex: ci,
        repeatMode: rm,
        playbackMode: pm,
      });
      if (transition.kind === "stop") return;

      const nextIndex = transition.kind === "replay_same" ? ci : transition.nextIndex;
      const nextTrack = tr[nextIndex];
      if (!nextTrack?.fileUrl) return;

      const mainEl = audioRef.current;
      if (!mainEl) return;

      const incomingAudio = document.createElement("audio");
      incomingAudio.preload = "auto";
      incomingAudio.volume = v;
      incomingAudio.muted = m;
      if (crossOrigin) incomingAudio.crossOrigin = crossOrigin;
      incomingAudio.src = nextTrack.fileUrl;

      let graph: CrossfadeGraph;
      try {
        graph = attachCrossfadeGraph(mainEl, incomingAudio);
        setError(null);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to attach crossfade graph";
        setError(message);
        incomingAudio.pause();
        incomingAudio.removeAttribute("src");
        incomingAudio.load();
        return;
      }

      const releaseEnded = beginEndedSuppression(mainEl);

      void graph.context.resume();

      incomingAudio.load();
      void incomingAudio.play().catch(() => {
        // Autoplay may be blocked; gain ramps continue regardless.
      });

      scheduleCrossfade(graph, timeRemaining, curve);

      const startTime = performance.now();
      const fadeDurationMs = timeRemaining * 1000;

      setIsCrossfading(true);
      setCrossfadeProgress(0);

      const session: CrossfadeSession = {
        graph,
        incomingAudio,
        startedAtIndex: ci,
        startTime,
        fadeDurationMs,
        timeoutId: 0 as unknown as ReturnType<typeof setTimeout>,
        rafId: 0,
        aborted: false,
        committed: false,
        releaseEnded,
      };

      const tick = () => {
        if (session.aborted) return;
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / fadeDurationMs);
        setCrossfadeProgress(progress);
        if (progress < 1) {
          session.rafId = requestAnimationFrame(tick);
        }
      };
      session.rafId = requestAnimationFrame(tick);

      session.timeoutId = setTimeout(() => {
        if (session.aborted || sessionRef.current !== session) return;
        session.committed = true;
        dispatch({ type: "SET_INDEX", payload: { index: nextIndex, autoPlay: true } });
        teardownCrossfadeGraph(graph);
        session.releaseEnded();
        releaseIncoming(incomingAudio);
        sessionRef.current = null;
        setIsCrossfading(false);
        setCrossfadeProgress(0);
      }, fadeDurationMs);

      sessionRef.current = session;

      if (pollId != null) {
        clearInterval(pollId);
        pollId = null;
      }
    };

    pollId = setInterval(tryStartCrossfade, POLL_INTERVAL_MS);
    tryStartCrossfade();

    return () => {
      if (pollId != null) clearInterval(pollId);
    };
  }, [enabled, isPaused, duration, curve, crossOrigin, audioRef, dispatch]);

  return { isCrossfading, crossfadeProgress, error };
}
