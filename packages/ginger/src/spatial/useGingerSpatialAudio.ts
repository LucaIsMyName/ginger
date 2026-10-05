import { useCallback, useEffect, useRef, useState } from "react";
import {
  attachLiveAnalyser,
  detachLiveAnalyser,
  setProcessingSlot,
} from "../analyzer/liveAudioGraph";
import { useGinger } from "../hooks/useGinger";

/** `[x, y, z]` in Web Audio space (meters). */
export type SpatialPosition = [number, number, number];

export type UseGingerSpatialAudioOptions = {
  /** When false, the panner is removed and the audio path is bypassed. Default: true. */
  enabled?: boolean;
  /** Default: `"HRTF"`. */
  panningModel?: PanningModelType;
  /** Default: `"inverse"`. */
  distanceModel?: DistanceModelType;
  /** Reference distance for attenuation. Default: `1`. */
  refDistance?: number;
  /** Source position. Default: `[0, 0, 0]`. */
  position?: SpatialPosition;
  /** Listener position. Default: `[0, 0, 0]`. */
  listenerPosition?: SpatialPosition;
};

export type UseGingerSpatialAudioResult = {
  setSourcePosition: (x: number, y: number, z: number) => void;
  setListenerPosition: (x: number, y: number, z: number) => void;
  setPanningModel: (model: PanningModelType) => void;
  error: string | null;
};

function setPannerPosition(panner: PannerNode, x: number, y: number, z: number): void {
  panner.positionX.value = x;
  panner.positionY.value = y;
  panner.positionZ.value = z;
}

function setListenerXYZ(context: AudioContext, x: number, y: number, z: number): void {
  context.listener.positionX.value = x;
  context.listener.positionY.value = y;
  context.listener.positionZ.value = z;
}

/**
 * Inserts an HRTF `PannerNode` into the Web Audio graph for the active Ginger media element.
 *
 * Shares the same `AudioContext` as `useGingerEqualizer` / `useGingerEffects` / `useGingerLiveAnalyzer` — only one
 * `MediaElementAudioSourceNode` per element is allowed by the browser.
 *
 * ```ts
 * import { useGingerSpatialAudio } from "@lucaismyname/ginger/spatial";
 * ```
 */
export function useGingerSpatialAudio(
  options: UseGingerSpatialAudioOptions = {},
): UseGingerSpatialAudioResult {
  const {
    enabled = true,
    panningModel = "HRTF",
    distanceModel = "inverse",
    refDistance = 1,
    position = [0, 0, 0],
    listenerPosition = [0, 0, 0],
  } = options;
  const { audioRef } = useGinger();
  const [error, setError] = useState<string | null>(null);

  const pannerRef = useRef<PannerNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  const [sx, sy, sz] = position;
  const [lx, ly, lz] = listenerPosition;

  useEffect(() => {
    const el = audioRef.current;
    if (!el || typeof window === "undefined") {
      return;
    }

    if (!enabled) {
      setProcessingSlot(el, "spatial", []);
      pannerRef.current = null;
      contextRef.current = null;
      return;
    }

    try {
      const attached = attachLiveAnalyser(el, {
        fftSize: 32,
        smoothingTimeConstant: 0,
        minDecibels: -100,
        maxDecibels: 0,
      });
      const { context, id: tempId } = attached;

      const panner = context.createPanner();
      panner.panningModel = panningModel;
      panner.distanceModel = distanceModel;
      panner.refDistance = refDistance;
      setPannerPosition(panner, sx, sy, sz);
      setListenerXYZ(context, lx, ly, lz);

      pannerRef.current = panner;
      contextRef.current = context;

      setProcessingSlot(el, "spatial", [panner]);
      detachLiveAnalyser(el, tempId);

      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create spatial panner";
      setError(msg);
      pannerRef.current = null;
      contextRef.current = null;
    }

    return () => {
      const element = audioRef.current;
      if (element) {
        setProcessingSlot(element, "spatial", []);
      }
      pannerRef.current = null;
      contextRef.current = null;
    };
  }, [enabled, panningModel, distanceModel, refDistance, sx, sy, sz, lx, ly, lz, audioRef]);

  const setSourcePosition = useCallback((x: number, y: number, z: number) => {
    const panner = pannerRef.current;
    if (panner) {
      setPannerPosition(panner, x, y, z);
    }
  }, []);

  const setListenerPosition = useCallback((x: number, y: number, z: number) => {
    const ctx = contextRef.current;
    if (ctx) {
      setListenerXYZ(ctx, x, y, z);
    }
  }, []);

  const setPanningModel = useCallback((model: PanningModelType) => {
    const panner = pannerRef.current;
    if (panner) {
      panner.panningModel = model;
    }
  }, []);

  return { setSourcePosition, setListenerPosition, setPanningModel, error };
}
