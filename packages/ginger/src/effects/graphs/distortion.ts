import { clamp, disconnectQuietly, readBoolean, readNumber, readString } from "../params";
import type { EffectInstance } from "../types";
import { createDryWet } from "./dryWet";

const CURVE_SAMPLES = 2048;

export function createDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const drive = clamp(amount, 0, 1) * 50 + 1;
  const curve = new Float32Array(new ArrayBuffer(CURVE_SAMPLES * 4));
  for (let i = 0; i < CURVE_SAMPLES; i += 1) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = Math.tanh(x * drive);
  }
  return curve;
}

function asOversample(value: unknown): OverSampleType {
  if (value === "2x" || value === "4x" || value === "none") return value;
  return "none";
}

export function createDistortionEffect(
  context: AudioContext,
  params: Record<string, unknown>,
): EffectInstance {
  const dryWet = createDryWet(
    context,
    readNumber(params, "mix", 0.25),
    readBoolean(params, "enabled", true),
  );

  const preGain = context.createGain();
  const shaper = context.createWaveShaper();
  let amount = clamp(readNumber(params, "amount", 0.4), 0, 1);

  preGain.gain.value = 1 + amount * 2;
  shaper.curve = createDistortionCurve(amount);
  shaper.oversample = asOversample(params.oversample ?? readString(params, "oversample", "none"));

  dryWet.wetInput.connect(preGain);
  preGain.connect(shaper);
  shaper.connect(dryWet.wetGain);

  return {
    input: dryWet.input,
    output: dryWet.output,
    setParam(key, value) {
      if (key === "mix" && typeof value === "number") {
        dryWet.setMix(value);
        return;
      }
      if (key === "amount" && typeof value === "number") {
        amount = clamp(value, 0, 1);
        preGain.gain.value = 1 + amount * 2;
        shaper.curve = createDistortionCurve(amount);
        return;
      }
      if (key === "oversample") {
        shaper.oversample = asOversample(value);
      }
    },
    setEnabled: dryWet.setEnabled,
    dispose() {
      disconnectQuietly(preGain);
      disconnectQuietly(shaper);
      dryWet.dispose();
    },
  };
}
