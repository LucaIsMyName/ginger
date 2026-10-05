import { type Dispatch, type MutableRefObject, useEffect, useState } from "react";
import type { GingerAction, GingerPersistenceAdapter, GingerProviderProps } from "../../types";
import { isDevEnvironment } from "../gingerProviderUtils";

type LatestInitRef = MutableRefObject<{
  tracks: GingerProviderProps["initialTracks"];
  currentIndex: number;
  playlistMeta: GingerProviderProps["initialPlaylistMeta"];
  isPaused: boolean;
  isShuffled: boolean;
  repeatMode: GingerProviderProps["initialRepeatMode"];
  playbackMode: GingerProviderProps["initialPlaybackMode"];
  volume: number;
  muted: boolean;
  playbackRate: number;
}>;

type UseGingerPersistenceOptions = {
  persistence: GingerPersistenceAdapter | undefined;
  hydrateOnMount: boolean;
  latestInitRef: LatestInitRef;
  dispatch: Dispatch<GingerAction>;
  currentIndex: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  repeatMode: NonNullable<GingerProviderProps["initialRepeatMode"]>;
};

export function useGingerPersistence({
  persistence,
  hydrateOnMount,
  latestInitRef,
  dispatch,
  currentIndex,
  volume,
  muted,
  playbackRate,
  repeatMode,
}: UseGingerPersistenceOptions): boolean {
  const [persistenceReady, setPersistenceReady] = useState(() => !hydrateOnMount || !persistence);

  useEffect(() => {
    if (!persistence || !hydrateOnMount) return;
    try {
      const storedVolume = persistence.get("ginger:volume");
      const storedMuted = persistence.get("ginger:muted");
      const storedPlaybackRate = persistence.get("ginger:playbackRate");
      const storedRepeatMode = persistence.get("ginger:repeatMode");
      const storedCurrentIndex = persistence.get("ginger:currentIndex");
      const p = latestInitRef.current;
      dispatch({
        type: "INIT",
        payload: {
          tracks: p.tracks ?? [],
          playlistMeta: p.playlistMeta,
          isPaused: p.isPaused,
          isShuffled: p.isShuffled,
          playbackMode: p.playbackMode,
          currentIndex:
            typeof storedCurrentIndex === "number" ? storedCurrentIndex : p.currentIndex,
          repeatMode:
            storedRepeatMode === "off" || storedRepeatMode === "all" || storedRepeatMode === "one"
              ? storedRepeatMode
              : p.repeatMode,
          volume: typeof storedVolume === "number" ? storedVolume : p.volume,
          muted: typeof storedMuted === "boolean" ? storedMuted : p.muted,
          playbackRate:
            typeof storedPlaybackRate === "number" ? storedPlaybackRate : p.playbackRate,
        },
      });
    } catch (e) {
      if (isDevEnvironment()) {
        console.warn("[@lucaismyname/ginger] persistence.get() threw during hydration:", e);
      }
    } finally {
      setPersistenceReady(true);
    }
  }, [dispatch, hydrateOnMount, latestInitRef, persistence]);

  useEffect(() => {
    if (!persistence || !persistenceReady) return;
    try {
      persistence.set("ginger:volume", volume);
      persistence.set("ginger:muted", muted);
      persistence.set("ginger:playbackRate", playbackRate);
      persistence.set("ginger:repeatMode", repeatMode);
      persistence.set("ginger:currentIndex", currentIndex);
    } catch (e) {
      if (isDevEnvironment()) {
        console.warn("[@lucaismyname/ginger] persistence.set() threw:", e);
      }
    }
  }, [persistence, persistenceReady, volume, muted, playbackRate, repeatMode, currentIndex]);

  return persistenceReady;
}
