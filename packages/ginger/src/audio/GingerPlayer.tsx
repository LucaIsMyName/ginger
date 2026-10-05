import { type AudioHTMLAttributes, type CSSProperties, useEffect, useRef, useState } from "react";
import { useGingerContext } from "../context/GingerContext";
import { shouldIgnoreEnded } from "../internal/suppressNaturalEnded";

export type GingerPlayerProps = {
  className?: string;
  style?: CSSProperties;
  preload?: AudioHTMLAttributes<HTMLAudioElement>["preload"];
  crossOrigin?: AudioHTMLAttributes<HTMLAudioElement>["crossOrigin"];
  respectReducedMotion?: boolean;
};

function readBufferedFraction(el: HTMLAudioElement): number {
  const { buffered, duration } = el;
  if (!(duration > 0) || buffered.length === 0) return 0;
  return Math.min(1, buffered.end(buffered.length - 1) / duration);
}

export function GingerPlayer({
  className,
  style,
  preload = "metadata",
  crossOrigin,
  respectReducedMotion = false,
}: GingerPlayerProps) {
  const { audioRef, dispatch, state, notifyEnded } = useGingerContext();
  const url = state.tracks[state.currentIndex]?.fileUrl ?? "";
  const lastTimeSnapshotRef = useRef({
    currentTime: -1,
    duration: -1,
    bufferedFraction: -1,
  });
  /** Avoid MEDIA_SOURCE_CLEARED on first paint with an empty queue (no prior media). */
  const lastActiveUrlRef = useRef("");

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (!respectReducedMotion || typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, [respectReducedMotion]);

  const syncTime = (el: HTMLAudioElement, force = false) => {
    const next = {
      currentTime: el.currentTime,
      duration: el.duration,
      bufferedFraction: readBufferedFraction(el),
    };
    const prev = lastTimeSnapshotRef.current;
    const timeThreshold = reducedMotion ? 0.5 : 0.25;
    const changedEnough =
      Math.abs(next.currentTime - prev.currentTime) >= timeThreshold ||
      Math.abs(next.duration - prev.duration) >= 0.01 ||
      Math.abs(next.bufferedFraction - prev.bufferedFraction) >= 0.01;
    if (!force && !changedEnough) return;
    lastTimeSnapshotRef.current = next;
    dispatch({
      type: "MEDIA_TIME_UPDATE",
      payload: next,
    });
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = state.volume;
    el.muted = state.muted;
  }, [audioRef, state.volume, state.muted]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!url) {
      el.removeAttribute("src");
      lastTimeSnapshotRef.current = { currentTime: -1, duration: -1, bufferedFraction: -1 };
      if (lastActiveUrlRef.current !== "") {
        dispatch({ type: "MEDIA_SOURCE_CLEARED" });
      }
      lastActiveUrlRef.current = "";
      return;
    }
    if (el.getAttribute("src") !== url) {
      el.src = url;
      el.load();
      lastTimeSnapshotRef.current = { currentTime: -1, duration: -1, bufferedFraction: -1 };
    }
    lastActiveUrlRef.current = url;
    // Browsers reset playbackRate to 1.0 when source changes + load() runs; re-apply after load.
    el.playbackRate = state.playbackRate;
  }, [audioRef, dispatch, url, state.playbackRate]);

  return (
    <audio
      data-ginger-component="Player"
      ref={audioRef}
      className={className}
      style={style}
      preload={preload}
      crossOrigin={crossOrigin}
      controls={false}
      playsInline
      onTimeUpdate={(e) => {
        syncTime(e.currentTarget);
      }}
      onLoadedMetadata={(e) => {
        const el = e.currentTarget;
        lastTimeSnapshotRef.current = { currentTime: -1, duration: -1, bufferedFraction: -1 };
        dispatch({
          type: "MEDIA_LOADED_METADATA",
          payload: {
            duration: el.duration,
            bufferedFraction: readBufferedFraction(el),
          },
        });
      }}
      onSeeking={(e) => syncTime(e.currentTarget, true)}
      onSeeked={(e) => syncTime(e.currentTarget, true)}
      onEnded={(e) => {
        if (shouldIgnoreEnded(e.currentTarget)) return;
        notifyEnded();
      }}
      onPlaying={() => dispatch({ type: "MEDIA_CANPLAY" })}
      onPlay={() => dispatch({ type: "MEDIA_PLAY" })}
      onPause={() => dispatch({ type: "MEDIA_PAUSE" })}
      onWaiting={() => dispatch({ type: "MEDIA_WAITING" })}
      onCanPlay={() => dispatch({ type: "MEDIA_CANPLAY" })}
      onProgress={(e) => syncTime(e.currentTarget, true)}
      onVolumeChange={(e) => {
        const el = e.currentTarget;
        dispatch({
          type: "MEDIA_VOLUME_SYNC",
          payload: { volume: el.volume, muted: el.muted },
        });
      }}
      onError={() => {
        const el = audioRef.current;
        const code = el?.error?.code;
        const message =
          code === 1
            ? "MEDIA_ERR_ABORTED"
            : code === 2
              ? "MEDIA_ERR_NETWORK"
              : code === 3
                ? "MEDIA_ERR_DECODE"
                : code === 4
                  ? "MEDIA_ERR_SRC_NOT_SUPPORTED"
                  : "MEDIA_ERR_UNKNOWN";
        dispatch({ type: "MEDIA_ERROR", payload: { message } });
      }}
    />
  );
}
