import { type RefObject, useEffect, useRef } from "react";
import type { GingerState } from "../../types";

type DevtoolsActions = {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  next: () => void;
  prev: () => void;
  seek: (timeSeconds: number, durationHint?: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  setRepeatMode: (mode: GingerState["repeatMode"]) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  playTrackAt: (index: number) => void;
  setPlaybackMode: (mode: GingerState["playbackMode"]) => void;
};

type UseGingerDevtoolsRegistrationOptions = {
  debugLabel: string | undefined;
  stateRef: React.MutableRefObject<GingerState>;
  audioRef: RefObject<HTMLAudioElement | null>;
  actions: DevtoolsActions;
};

export function useGingerDevtoolsRegistration({
  debugLabel,
  stateRef,
  audioRef,
  actions,
}: UseGingerDevtoolsRegistrationOptions): void {
  const providerIdRef = useRef<string | null>(null);
  const devtoolsActionsRef = useRef(actions);
  devtoolsActionsRef.current = actions;

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
  }, [audioRef, debugLabel, stateRef]);

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
  }, [audioRef, stateRef]);
}
