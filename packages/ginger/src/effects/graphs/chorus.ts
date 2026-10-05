import { clamp, disconnectQuietly, readBoolean, readNumber } from "../params";
import type { EffectInstance } from "../types";
import { createDryWet } from "./dryWet";
import { createLfo } from "./lfo";

export function createChorusEffect(
  context: AudioContext,
  params: Record<string, unknown>,
): EffectInstance {
  const dryWet = createDryWet(
    context,
    readNumber(params, "mix", 0.25),
    readBoolean(params, "enabled", true),
  );

  const voices = Math.round(clamp(readNumber(params, "voices", 2), 1, 3));
  const baseDelay = clamp(readNumber(params, "delay", 0.03), 0.005, 0.08);
  const depth = clamp(readNumber(params, "depth", 0.004), 0.0005, 0.02);
  const lfo = createLfo(context, clamp(readNumber(params, "rate", 1.2), 0.05, 8), depth);

  const delays: DelayNode[] = [];
  const voiceGains: GainNode[] = [];

  for (let i = 0; i < voices; i += 1) {
    const delay = context.createDelay(0.1);
    const voiceGain = context.createGain();
    delay.delayTime.value = baseDelay + i * 0.007;
    voiceGain.gain.value = 1 / voices;
    lfo.depth.connect(delay.delayTime);
    dryWet.wetInput.connect(delay);
    delay.connect(voiceGain);
    voiceGain.connect(dryWet.wetGain);
    delays.push(delay);
    voiceGains.push(voiceGain);
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
        lfo.setRate(clamp(value, 0.05, 8));
        return;
      }
      if (key === "depth" && typeof value === "number") {
        lfo.setDepth(clamp(value, 0.0005, 0.02));
        return;
      }
      if (key === "delay" && typeof value === "number") {
        const next = clamp(value, 0.005, 0.08);
        delays.forEach((delay, index) => {
          delay.delayTime.value = next + index * 0.007;
        });
      }
    },
    setEnabled: dryWet.setEnabled,
    dispose() {
      for (const delay of delays) disconnectQuietly(delay);
      for (const gain of voiceGains) disconnectQuietly(gain);
      lfo.dispose();
      dryWet.dispose();
    },
  };
}
