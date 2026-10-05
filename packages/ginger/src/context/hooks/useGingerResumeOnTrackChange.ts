import { useEffect, useRef } from "react";
import { trackIdentity } from "../../core/queue";
import type { GingerPersistenceAdapter, Track } from "../../types";
import { isDevEnvironment } from "../gingerProviderUtils";

type UseGingerResumeOnTrackChangeOptions = {
  persistence: GingerPersistenceAdapter | undefined;
  resumeOnTrackChange: boolean;
  tracks: Track[];
  currentIndex: number;
  duration: number;
  currentTime: number;
  seek: (timeSeconds: number, durationHint?: number) => void;
};

/**
 * Restores per-track resume position from persistence after metadata is available,
 * avoiding seeks that race `HTMLMediaElement.load()` on track change.
 */
export function useGingerResumeOnTrackChange({
  persistence,
  resumeOnTrackChange,
  tracks,
  currentIndex,
  duration,
  currentTime,
  seek,
}: UseGingerResumeOnTrackChangeOptions): void {
  const pendingResumeRef = useRef<{ trackKey: string; seconds: number } | null>(null);
  const appliedTrackKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!persistence || !resumeOnTrackChange) return;
    const track = tracks[currentIndex];
    if (!track) return;
    const trackKey = trackIdentity(track);
    if (appliedTrackKeyRef.current === trackKey) return;

    const key = `ginger:resume:${trackKey}`;
    try {
      const saved = persistence.get(key);
      if (typeof saved === "number" && Number.isFinite(saved) && saved > 0) {
        pendingResumeRef.current = { trackKey, seconds: saved };
      } else {
        pendingResumeRef.current = null;
      }
    } catch (e) {
      if (isDevEnvironment()) {
        console.warn("[@lucaismyname/ginger] persistence.get() threw during resume:", e);
      }
    }
  }, [persistence, resumeOnTrackChange, currentIndex, tracks]);

  useEffect(() => {
    const pending = pendingResumeRef.current;
    if (!pending) return;
    const track = tracks[currentIndex];
    if (!track || trackIdentity(track) !== pending.trackKey) return;
    if (!(duration > 0) || !Number.isFinite(duration)) return;

    const target = Math.min(pending.seconds, duration);
    pendingResumeRef.current = null;
    appliedTrackKeyRef.current = pending.trackKey;
    seek(target, duration);
  }, [currentIndex, duration, seek, tracks]);

  useEffect(() => {
    if (!persistence || !resumeOnTrackChange) return;
    const id = setInterval(() => {
      const track = tracks[currentIndex];
      if (!track || !(currentTime >= 0)) return;
      const key = `ginger:resume:${trackIdentity(track)}`;
      try {
        persistence.set(key, currentTime);
      } catch (e) {
        if (isDevEnvironment()) {
          console.warn("[@lucaismyname/ginger] persistence.set() threw during resume save:", e);
        }
      }
    }, 5000);
    return () => clearInterval(id);
  }, [persistence, resumeOnTrackChange, currentIndex, tracks, currentTime]);

  useEffect(() => {
    appliedTrackKeyRef.current = null;
  }, [currentIndex]);
}
