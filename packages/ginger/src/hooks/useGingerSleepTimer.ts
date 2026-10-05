import { useEffect, useRef } from "react";
import { useGingerPlayback } from "../context/GingerSplitContexts";
import { computeNextIndex } from "../core/transitions";

export type GingerSleepTimerOptions = {
  durationMs?: number;
  /**
   * Pause after this many forward advances (next, natural end, or repeat-all wrap).
   * Previous, shuffle, and other index jumps do not count.
   */
  stopAfterTracks?: number;
  respectPause?: boolean;
  enabled?: boolean;
  onFire?: () => void;
};

export function useGingerSleepTimer(options: GingerSleepTimerOptions): void {
  const { durationMs, stopAfterTracks, respectPause = true, enabled = true, onFire } = options;
  const { currentIndex, pause, isPaused, tracks, repeatMode, playbackMode } = useGingerPlayback();
  const remainingTracksRef = useRef(stopAfterTracks ?? 0);
  const prevIndexRef = useRef(currentIndex);

  // Remaining milliseconds for the duration-based timer; carried across pause/resume cycles.
  const remainingMsRef = useRef(durationMs ?? 0);
  // Timestamp when the current timer segment started (set when playback resumes).
  const segmentStartRef = useRef<number | null>(null);

  useEffect(() => {
    remainingTracksRef.current = stopAfterTracks ?? 0;
  }, [stopAfterTracks]);

  // Keep remainingMsRef in sync when durationMs changes while the timer is inactive.
  const prevDurationMsRef = useRef(durationMs);
  useEffect(() => {
    if (prevDurationMsRef.current !== durationMs) {
      remainingMsRef.current = durationMs ?? 0;
      prevDurationMsRef.current = durationMs;
    }
  }, [durationMs]);

  useEffect(() => {
    if (!enabled || !durationMs || durationMs <= 0) {
      // Reset remaining when disabled or no duration
      remainingMsRef.current = durationMs ?? 0;
      segmentStartRef.current = null;
      return;
    }

    if (respectPause && isPaused) {
      // Snapshot how much time is left before pausing
      if (segmentStartRef.current !== null) {
        const elapsed = Date.now() - segmentStartRef.current;
        remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
        segmentStartRef.current = null;
      }
      return;
    }

    // Playing: start (or continue) the countdown from remainingMsRef
    segmentStartRef.current = Date.now();
    const id = setTimeout(() => {
      remainingMsRef.current = 0;
      segmentStartRef.current = null;
      pause();
      onFire?.();
    }, remainingMsRef.current);

    return () => {
      clearTimeout(id);
      // Snapshot remaining when effect cleans up (e.g. isPaused or deps changed)
      if (segmentStartRef.current !== null) {
        const elapsed = Date.now() - segmentStartRef.current;
        remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
        segmentStartRef.current = null;
      }
    };
  }, [durationMs, enabled, isPaused, onFire, pause, respectPause]);

  useEffect(() => {
    if (!enabled || !stopAfterTracks || stopAfterTracks <= 0) return;
    const prev = prevIndexRef.current;
    prevIndexRef.current = currentIndex;
    if (currentIndex === prev) return;
    const expected = computeNextIndex({
      tracks,
      currentIndex: prev,
      repeatMode,
      playbackMode,
    });
    if (currentIndex !== expected) return;
    remainingTracksRef.current -= 1;
    if (remainingTracksRef.current <= 0) {
      pause();
      onFire?.();
    }
  }, [currentIndex, enabled, onFire, pause, playbackMode, repeatMode, stopAfterTracks, tracks]);
}
