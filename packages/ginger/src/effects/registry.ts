import { createChorusEffect } from "./graphs/chorus";
import { createDelayEffect } from "./graphs/delay";
import { createDistortionEffect } from "./graphs/distortion";
import { createOctaverEffect } from "./graphs/octaver";
import { createPhaserEffect } from "./graphs/phaser";
import { createReverbEffect } from "./graphs/reverb";
import type { EffectFactory } from "./types";
import { BUILTIN_EFFECT_TYPES } from "./types";

const builtins: Record<string, EffectFactory> = {
  delay: createDelayEffect,
  reverb: createReverbEffect,
  distortion: createDistortionEffect,
  phaser: createPhaserEffect,
  chorus: createChorusEffect,
  octaver: createOctaverEffect,
};

const factories = new Map<string, EffectFactory>(Object.entries(builtins));

/**
 * Register or replace an effect factory used by `useGingerEffects`.
 * Built-in types (`delay`, `reverb`, `distortion`, `phaser`, `chorus`, `octaver`)
 * can be overridden; call `unregisterEffect` to restore a built-in.
 */
export function registerEffect(type: string, factory: EffectFactory): void {
  factories.set(type, factory);
}

export function getEffectFactory(type: string): EffectFactory | undefined {
  return factories.get(type);
}

/** Remove a custom factory. Built-in types are restored to the default implementation. */
export function unregisterEffect(type: string): void {
  const builtin = builtins[type];
  if (builtin) {
    factories.set(type, builtin);
    return;
  }
  factories.delete(type);
}

export function isBuiltinEffectType(type: string): boolean {
  return (BUILTIN_EFFECT_TYPES as readonly string[]).includes(type);
}
