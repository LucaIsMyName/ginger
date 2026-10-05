import { clamp, disconnectQuietly, readBoolean, readNumber } from "../params";
import type { EffectInstance } from "../types";
import { createDryWet } from "./dryWet";

export function createDelayEffect(
  context: AudioContext,
  params: Record<string, unknown>,
): EffectInstance {
  const dryWet = createDryWet(
    context,
    readNumber(params, "mix", 0.3),
    readBoolean(params, "enabled", true),
  );

  const delay = context.createDelay(2);
  const feedback = context.createGain();

  delay.delayTime.value = clamp(readNumber(params, "time", 0.3), 0, 2);
  feedback.gain.value = clamp(readNumber(params, "feedback", 0.35), 0, 0.95);

  dryWet.wetInput.connect(delay);
  delay.connect(dryWet.wetGain);
  delay.connect(feedback);
  feedback.connect(delay);

  return {
    input: dryWet.input,
    output: dryWet.output,
    setParam(key, value) {
      if (key === "mix" && typeof value === "number") {
        dryWet.setMix(value);
        return;
      }
      if (key === "time" && typeof value === "number") {
        delay.delayTime.value = clamp(value, 0, 2);
        return;
      }
      if (key === "feedback" && typeof value === "number") {
        feedback.gain.value = clamp(value, 0, 0.95);
      }
    },
    setEnabled: dryWet.setEnabled,
    dispose() {
      disconnectQuietly(delay);
      disconnectQuietly(feedback);
      dryWet.dispose();
    },
  };
}
