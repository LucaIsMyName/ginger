import { clamp, disconnectQuietly, readBoolean, readNumber } from "../params";
import type { EffectInstance } from "../types";
import { createDryWet } from "./dryWet";
import { generateImpulseResponse } from "./impulseResponse";

function asAudioBuffer(value: unknown): AudioBuffer | undefined {
  if (
    value &&
    typeof value === "object" &&
    "getChannelData" in value &&
    typeof (value as AudioBuffer).getChannelData === "function"
  ) {
    return value as AudioBuffer;
  }
  return undefined;
}

export function createReverbEffect(
  context: AudioContext,
  params: Record<string, unknown>,
): EffectInstance {
  const dryWet = createDryWet(
    context,
    readNumber(params, "mix", 0.25),
    readBoolean(params, "enabled", true),
  );

  const convolver = context.createConvolver();
  let decay = clamp(readNumber(params, "decay", 2.2), 0.05, 12);
  let customBuffer = asAudioBuffer(params.impulseBuffer);

  function applyImpulse(): void {
    convolver.buffer = customBuffer ?? generateImpulseResponse(context, decay);
  }

  applyImpulse();

  dryWet.wetInput.connect(convolver);
  convolver.connect(dryWet.wetGain);

  return {
    input: dryWet.input,
    output: dryWet.output,
    setParam(key, value) {
      if (key === "mix" && typeof value === "number") {
        dryWet.setMix(value);
        return;
      }
      if (key === "decay" && typeof value === "number") {
        decay = clamp(value, 0.05, 12);
        if (!customBuffer) applyImpulse();
        return;
      }
      if (key === "impulseBuffer") {
        customBuffer = asAudioBuffer(value);
        applyImpulse();
      }
    },
    setEnabled: dryWet.setEnabled,
    dispose() {
      disconnectQuietly(convolver);
      dryWet.dispose();
    },
  };
}
