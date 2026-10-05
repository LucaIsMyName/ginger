import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  attachLiveAnalyser,
  detachLiveAnalyser,
  setProcessingSlot,
} from "../analyzer/liveAudioGraph";
import { useGinger } from "../hooks/useGinger";

export type EqualizerBand = {
  /** Center frequency in Hz (e.g. 60, 250, 1000, 4000, 16000). */
  frequency: number;
  /** Gain in dB. Positive = boost, negative = cut. Typical range: -12 to +12. Default: 0. */
  gain?: number;
  /** Q factor (bandwidth). Higher = narrower. Default: 1. */
  q?: number;
  /** BiquadFilterNode type. Default: "peaking". */
  type?: BiquadFilterType;
};

export type UseGingerEqualizerOptions = {
  /** When false, EQ nodes are detached and the audio path is bypassed. Default: true. */
  enabled?: boolean;
  /** Band definitions. Each band maps to one BiquadFilterNode. */
  bands?: EqualizerBand[];
};

export type UseGingerEqualizerResult = {
  /** Update a single band's gain in dB without rebuilding the filter chain. */
  setBandGain: (bandIndex: number, gainDb: number) => void;
  /** Replace all bands (rebuilds the filter chain). */
  setBands: (bands: EqualizerBand[]) => void;
  /** Current band definitions (reflects the latest `setBands` call). */
  bands: EqualizerBand[];
  /** Error string if Web Audio is unavailable or filter creation failed. */
  error: string | null;
};

const DEFAULT_BANDS: EqualizerBand[] = [
  { frequency: 60 },
  { frequency: 250 },
  { frequency: 1000 },
  { frequency: 4000 },
  { frequency: 16000 },
];

/**
 * Inserts a parametric EQ into the Web Audio graph for the active Ginger media element.
 *
 * Each band is a `BiquadFilterNode` connected in series between the audio source and the
 * speakers. If `useGingerLiveAnalyzer` is also active, the EQ is inserted before the analyser
 * — both share the same `AudioContext` as spatial and effects (the browser allows only one
 * `MediaElementAudioSourceNode` per element).
 *
 * Available as a subpath export:
 * ```ts
 * import { useGingerEqualizer } from "@lucaismyname/ginger/equalizer";
 * ```
 */
export function useGingerEqualizer(
  options: UseGingerEqualizerOptions = {},
): UseGingerEqualizerResult {
  const { enabled = true, bands: initialBands = DEFAULT_BANDS } = options;
  const { audioRef, state } = useGinger();

  const [bands, setBandsState] = useState<EqualizerBand[]>(initialBands);
  const [error, setError] = useState<string | null>(null);

  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  const bandsRef = useRef(bands);
  bandsRef.current = bands;

  /** Rebuild the chain when band frequencies/types change — not on every gain tweak (see setBandGain). */
  const bandStructureKey = useMemo(
    () => bands.map((b) => `${b.frequency}:${b.type ?? "peaking"}:${b.q ?? 1}`).join("|"),
    [bands],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: bandStructureKey and currentIndex must re-run graph setup; bands read via bandsRef
  useEffect(() => {
    const el = audioRef.current;
    if (!el || typeof window === "undefined") {
      return;
    }

    if (!enabled) {
      setProcessingSlot(el, "eq", []);
      filterNodesRef.current = [];
      return;
    }

    try {
      // Attach a temporary analyser solely to get (or create) the shared AudioContext.
      // The graph is rebuilt by liveAudioGraph after we call setProcessingSlot, so this
      // temporary consumer is detached immediately after we have the context reference.
      const attached = attachLiveAnalyser(el, {
        fftSize: 32,
        smoothingTimeConstant: 0,
        minDecibels: -100,
        maxDecibels: 0,
      });
      const { context, id: tempId } = attached;

      const bandsNow = bandsRef.current;
      const filters: BiquadFilterNode[] = bandsNow.map((band) => {
        const node = context.createBiquadFilter();
        node.type = band.type ?? "peaking";
        node.frequency.value = band.frequency;
        node.gain.value = band.gain ?? 0;
        node.Q.value = band.q ?? 1;
        return node;
      });

      filterNodesRef.current = filters;

      // Install processing chain BEFORE removing the temp analyser so the graph stays valid
      setProcessingSlot(el, "eq", filters);
      detachLiveAnalyser(el, tempId);

      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create equalizer";
      setError(msg);
      filterNodesRef.current = [];
    }

    return () => {
      const element = audioRef.current;
      if (element) {
        setProcessingSlot(element, "eq", []);
      }
      filterNodesRef.current = [];
    };
  }, [enabled, bandStructureKey, audioRef, state.currentIndex]);

  const setBandGain = useCallback((bandIndex: number, gainDb: number) => {
    const node = filterNodesRef.current[bandIndex];
    if (node) {
      node.gain.value = gainDb;
    }
    setBandsState((prev) => prev.map((b, i) => (i === bandIndex ? { ...b, gain: gainDb } : b)));
  }, []);

  const setBands = useCallback((nextBands: EqualizerBand[]) => {
    const nodes = filterNodesRef.current;
    const previous = bandsRef.current;
    const structureSame =
      nextBands.length === nodes.length &&
      nextBands.length === previous.length &&
      nextBands.every((band, index) => {
        const prev = previous[index];
        return (
          prev != null &&
          band.frequency === prev.frequency &&
          (band.type ?? "peaking") === (prev.type ?? "peaking") &&
          (band.q ?? 1) === (prev.q ?? 1)
        );
      });
    if (structureSame) {
      nextBands.forEach((band, index) => {
        const node = nodes[index];
        if (node) node.gain.value = band.gain ?? 0;
      });
    }
    setBandsState(nextBands);
  }, []);

  return { setBandGain, setBands, bands, error };
}
