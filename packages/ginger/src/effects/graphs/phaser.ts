import { clamp, disconnectQuietly, readBoolean, readNumber } from "../params";
import type { EffectInstance } from "../types";
import { createDryWet } from "./dryWet";
import { createLfo } from "./lfo";

const BASE_FREQUENCY = 800;

export function createPhaserEffect(
  context: AudioContext,
  params: Record<string, unknown>,
): EffectInstance {
  const dryWet = createDryWet(
    context,
    readNumber(params, "mix", 0.3),
    readBoolean(params, "enabled", true),
  );

  const stages = Math.round(clamp(readNumber(params, "stages", 4), 2, 8));
  const lfo = createLfo(
    context,
    clamp(readNumber(params, "rate", 0.5), 0.05, 10),
    clamp(readNumber(params, "depth", 600), 20, 4000),
  );
  const feedback = context.createGain();
  feedback.gain.value = clamp(readNumber(params, "feedback", 0.4), 0, 0.9);

  const filters: BiquadFilterNode[] = [];
  let previous: AudioNode = dryWet.wetInput;
  for (let i = 0; i < stages; i += 1) {
    const filter = context.createBiquadFilter();
    filter.type = "allpass";
    filter.frequency.value = BASE_FREQUENCY;
    filter.Q.value = 0.5;
    lfo.depth.connect(filter.frequency);
    previous.connect(filter);
    filters.push(filter);
    previous = filter;
  }

  const last = filters[filters.length - 1];
  if (last) {
    last.connect(dryWet.wetGain);
    last.connect(feedback);
    feedback.connect(filters[0] ?? dryWet.wetInput);
  }

  return {
    input: dryWet.input,
    output: dryWet.output,
    setParam(key, value) {
      if (key === "mix" && typeof value === "number") {
        dryWet.setMix(value);
        return;
      }
      if (key === "rate" && typeof value === "number") {
        lfo.setRate(clamp(value, 0.05, 10));
        return;
      }
      if (key === "depth" && typeof value === "number") {
        lfo.setDepth(clamp(value, 20, 4000));
        return;
      }
      if (key === "feedback" && typeof value === "number") {
        feedback.gain.value = clamp(value, 0, 0.9);
      }
    },
    setEnabled: dryWet.setEnabled,
    dispose() {
      for (const filter of filters) disconnectQuietly(filter);
      disconnectQuietly(feedback);
      lfo.dispose();
      dryWet.dispose();
    },
  };
}
