import { getEffectFactory } from "./registry";
import type { CustomEffectSpec, EffectInstance, GingerEffectSpec } from "./types";

export function createEffect(context: AudioContext, spec: GingerEffectSpec): EffectInstance {
  if (spec.type === "custom") {
    const custom = spec as CustomEffectSpec;
    if (typeof custom.create !== "function") {
      throw new Error("custom effect requires a create() function");
    }
    const instance = custom.create(context);
    instance.setEnabled(custom.enabled !== false);
    return instance;
  }

  const factory = getEffectFactory(spec.type);
  if (!factory) {
    throw new Error(`Unknown effect type: ${spec.type}`);
  }

  return factory(context, spec as unknown as Record<string, unknown>);
}
