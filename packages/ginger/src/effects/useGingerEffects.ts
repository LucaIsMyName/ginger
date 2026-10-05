import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  attachLiveAnalyser,
  detachLiveAnalyser,
  setProcessingSlot,
} from "../analyzer/liveAudioGraph";
import { useGinger } from "../hooks/useGinger";
import { createEffect } from "./createEffect";
import type { EffectInstance, GingerEffectSpec } from "./types";

export type UseGingerEffectsOptions = {
  /** When false, the effects slot is cleared. Default: true. */
  enabled?: boolean;
  /** Ordered effect rack. Duplicates of the same type are allowed. */
  chain?: GingerEffectSpec[];
};

export type UseGingerEffectsResult = {
  /** Current specs (auto-assigned `id`s when omitted). */
  chain: GingerEffectSpec[];
  /** Replace the whole rack (rebuilds when types/order/ids change). */
  setChain: (next: GingerEffectSpec[]) => void;
  /** Patch one effect by `id` or index. Param-only patches do not rebuild. */
  setEffect: (idOrIndex: string | number, patch: Record<string, unknown>) => void;
  /** Bypass one effect without removing it from the rack. */
  setEffectEnabled: (idOrIndex: string | number, enabled: boolean) => void;
  /** Error string if Web Audio is unavailable or an effect failed to create. */
  error: string | null;
};

let nextAutoId = 0;

function assignIds(chain: GingerEffectSpec[]): GingerEffectSpec[] {
  return chain.map((spec) => {
    if (typeof spec.id === "string" && spec.id.length > 0) return spec;
    nextAutoId += 1;
    return { ...spec, id: `fx-${nextAutoId}` };
  });
}

function structureToken(spec: GingerEffectSpec): string {
  const id = spec.id ?? "";
  if (spec.type === "phaser") {
    const stages = "stages" in spec ? spec.stages : undefined;
    return `${id}:phaser:${stages ?? 4}`;
  }
  if (spec.type === "chorus") {
    const voices = "voices" in spec ? spec.voices : undefined;
    return `${id}:chorus:${voices ?? 2}`;
  }
  return `${id}:${spec.type}`;
}

function applyParams(instance: EffectInstance, spec: GingerEffectSpec): void {
  instance.setEnabled(spec.enabled !== false);
  for (const [key, value] of Object.entries(spec)) {
    if (key === "id" || key === "type" || key === "enabled" || key === "create") continue;
    instance.setParam(key, value);
  }
}

/**
 * Inserts a serial effects rack into the Web Audio graph for the active Ginger media element.
 *
 * Effects occupy the `effects` slot (`eq` → `spatial` → `effects` → `user`) and share the
 * same `AudioContext` as the equalizer, spatial panner, and live analyser.
 *
 * ```ts
 * import { useGingerEffects } from "@lucaismyname/ginger/effects";
 * ```
 */
export function useGingerEffects(options: UseGingerEffectsOptions = {}): UseGingerEffectsResult {
  const { enabled = true, chain: initialChain = [] } = options;
  const { audioRef, state } = useGinger();

  const [chain, setChainState] = useState<GingerEffectSpec[]>(() => assignIds(initialChain));
  const [error, setError] = useState<string | null>(null);

  const instancesRef = useRef<EffectInstance[]>([]);
  const chainRef = useRef(chain);
  chainRef.current = chain;

  const structureKey = useMemo(() => chain.map(structureToken).join("|"), [chain]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: structureKey and currentIndex must re-run graph setup; specs read via chainRef
  useEffect(() => {
    const el = audioRef.current;
    if (!el || typeof window === "undefined") {
      return;
    }

    if (!enabled) {
      setProcessingSlot(el, "effects", []);
      for (const instance of instancesRef.current) instance.dispose();
      instancesRef.current = [];
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

      const instances = chainRef.current.map((spec) => createEffect(context, spec));
      instancesRef.current = instances;

      setProcessingSlot(
        el,
        "effects",
        instances.map((instance) => ({ input: instance.input, output: instance.output })),
      );
      detachLiveAnalyser(el, tempId);

      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create effects";
      setError(msg);
      for (const instance of instancesRef.current) instance.dispose();
      instancesRef.current = [];
    }

    return () => {
      const element = audioRef.current;
      if (element) {
        setProcessingSlot(element, "effects", []);
      }
      for (const instance of instancesRef.current) instance.dispose();
      instancesRef.current = [];
    };
  }, [enabled, structureKey, audioRef, state.currentIndex]);

  useEffect(() => {
    chain.forEach((spec, index) => {
      const instance = instancesRef.current[index];
      if (instance) applyParams(instance, spec);
    });
  }, [chain]);

  const setChain = useCallback((next: GingerEffectSpec[]) => {
    setChainState(assignIds(next));
  }, []);

  const setEffect = useCallback((idOrIndex: string | number, patch: Record<string, unknown>) => {
    setChainState((prev) =>
      prev.map((spec, index) => {
        const match = spec.id === idOrIndex || index === idOrIndex;
        if (!match) return spec;
        const nextType = typeof patch.type === "string" ? patch.type : spec.type;
        return { ...spec, ...patch, id: spec.id, type: nextType };
      }),
    );
  }, []);

  const setEffectEnabled = useCallback(
    (idOrIndex: string | number, nextEnabled: boolean) => {
      setEffect(idOrIndex, { enabled: nextEnabled });
    },
    [setEffect],
  );

  return { chain, setChain, setEffect, setEffectEnabled, error };
}
