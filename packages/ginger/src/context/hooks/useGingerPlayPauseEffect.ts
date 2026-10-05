import { type Dispatch, type RefObject, useEffect } from "react";
import { computeEndedTransition } from "../../core/transitions";
import { formatPlayRejectionError, isNotAllowedPlayError } from "../../internal/formatPlayError";
import type { GingerAction, GingerState } from "../../types";

type UseGingerPlayPauseEffectOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  state: GingerState;
  stateRef: React.MutableRefObject<GingerState>;
  dispatch: Dispatch<GingerAction>;
  currentUrl: string | undefined;
  beforePlay: (() => boolean | Promise<boolean>) | undefined;
  onPlayBlocked: (() => void) | undefined;
};

export function useGingerPlayPauseEffect({
  audioRef,
  state,
  stateRef,
  dispatch,
  currentUrl,
  beforePlay,
  onPlayBlocked,
}: UseGingerPlayPauseEffectOptions): void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: `currentUrl` cancels in-flight play when the active track/source changes; not implied by `state.isPaused` alone.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (state.isPaused) {
      el.pause();
      return;
    }
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
        const msg = formatPlayRejectionError(e);
        dispatch({ type: "MEDIA_ERROR", payload: { message: msg } });
        if (isNotAllowedPlayError(e)) {
          onPlayBlocked?.();
        }
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [audioRef, beforePlay, currentUrl, dispatch, onPlayBlocked, state.isPaused, stateRef]);
}
