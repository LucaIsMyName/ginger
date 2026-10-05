import { type Dispatch, type RefObject, useEffect, useRef } from "react";
import type { GingerAction, GingerRetryConfig, GingerState } from "../../types";

type UseGingerMediaRetryOptions = {
  retryOnError: boolean | GingerRetryConfig | undefined;
  state: GingerState;
  dispatch: Dispatch<GingerAction>;
  audioRef: RefObject<HTMLAudioElement | null>;
  onRetryExhausted?: () => void;
};

export function useGingerMediaRetry({
  retryOnError,
  state,
  dispatch,
  audioRef,
  onRetryExhausted,
}: UseGingerMediaRetryOptions): void {
  const retryCountRef = useRef(0);
  const retryTrackUrlRef = useRef<string | undefined>(undefined);
  const retryExhaustedNotifiedRef = useRef(false);

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
      retryExhaustedNotifiedRef.current = false;
    }
  }, [state.currentIndex, state.tracks]);

  useEffect(() => {
    if (!state.errorMessage) {
      retryExhaustedNotifiedRef.current = false;
    }
  }, [state.errorMessage]);

  useEffect(() => {
    if (!retryConfig || !state.errorMessage) return;

    const isRetryable = retryableErrors.some((code) => state.errorMessage?.includes(code));

    if (!isRetryable) {
      if (retrySkipOnUnrecoverable && state.tracks.length > 1) {
        const timer = setTimeout(() => dispatch({ type: "NEXT" }), 500);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (retryCountRef.current >= retryMaxRetries) {
      if (!retryExhaustedNotifiedRef.current) {
        retryExhaustedNotifiedRef.current = true;
        onRetryExhausted?.();
      }
      return;
    }

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
    audioRef,
    dispatch,
    onRetryExhausted,
    retryConfig,
    retryMaxRetries,
    retryDelayMs,
    retryableErrors,
    retrySkipOnUnrecoverable,
    state.errorMessage,
    state.tracks.length,
  ]);
}
