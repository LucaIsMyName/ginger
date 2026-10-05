import { useCallback, useEffect, useRef, useState } from "react";
import { useGingerMedia } from "../context/GingerSplitContexts";

export type UseGingerVolumeFadeOptions = {
  /** Target volume to fade to (0–1). */
  targetVolume: number;
  /** Duration of the fade in milliseconds. */
  durationMs: number;
  /** Called when the fade completes normally (not when cancelled). */
  onComplete?: () => void;
};

export type UseGingerVolumeFadeResult = {
  /** Start a volume fade. Cancels any in-progress fade. */
  fadeVolumeTo: (options: UseGingerVolumeFadeOptions) => void;
  /** Cancel the current fade and hold at the current volume. */
  cancelFade: () => void;
  /** True while a fade is in progress. */
  isFading: boolean;
};

/**
 * Smoothly interpolates volume over a given duration using `requestAnimationFrame`.
 * Useful for fade-in on track start, fade-out before sleep timer fires, or crossfade prep.
 */
export function useGingerVolumeFade(): UseGingerVolumeFadeResult {
  const { setVolume, volume } = useGingerMedia();
  const [isFading, setIsFading] = useState(false);

  const rafRef = useRef<number>(0);
  const cancelledRef = useRef(false);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const cancelFade = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    cancelledRef.current = true;
    setIsFading(false);
  }, []);

  const fadeVolumeTo = useCallback(
    ({ targetVolume, durationMs, onComplete }: UseGingerVolumeFadeOptions) => {
      cancelAnimationFrame(rafRef.current);
      cancelledRef.current = false;

      const clamp = (v: number) => Math.min(1, Math.max(0, v));
      const target = clamp(targetVolume);
      const startTime = performance.now();

      // Capture start volume at the moment the fade begins
      let startVolume = volume;

      setIsFading(true);

      const tick = (now: number) => {
        if (cancelledRef.current) return;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / Math.max(1, durationMs));
        const current = startVolume + (target - startVolume) * progress;
        setVolume(clamp(current));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setIsFading(false);
          onComplete?.();
        }
      };

      // Use a small delay so `volume` from closure is the current value
      rafRef.current = requestAnimationFrame((now) => {
        startVolume = volume;
        tick(now);
      });
    },
    [setVolume, volume],
  );

  return { fadeVolumeTo, cancelFade, isFading };
}
