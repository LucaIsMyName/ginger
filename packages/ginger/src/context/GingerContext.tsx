import { type Dispatch, type MutableRefObject, createContext, useContext } from "react";
import type {
  GingerAction,
  GingerInitPayload,
  GingerState,
  PlaybackMode,
  PlaylistMeta,
  RepeatMode,
  Track,
} from "../types";

export type GingerContextValue = {
  state: GingerState;
  dispatch: Dispatch<GingerAction>;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  notifyEnded: () => void;
  /** Full reset to match `createInitialState` / provider `initial*` props. */
  init: (payload: GingerInitPayload) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (timeSeconds: number, durationHint?: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  next: () => void;
  prev: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  setQueue: (tracks: Track[], currentIndex?: number) => void;
  insertTrackAt: (track: Track, index?: number, autoPlay?: boolean) => void;
  removeTrackAt: (index: number) => void;
  moveTrack: (fromIndex: number, toIndex: number) => void;
  enqueueNext: (track: Track) => void;
  playTrackAt: (index: number) => void;
  selectTrackAt: (index: number) => void;
  setPlaylistMeta: (meta: PlaylistMeta | null) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
};

const GingerContext = createContext<GingerContextValue | null>(null);

export function useGingerContext(): GingerContextValue {
  const ctx = useContext(GingerContext);
  if (!ctx) throw new Error("Ginger components must be used within <Ginger.Provider>");
  return ctx;
}

export { GingerContext };
