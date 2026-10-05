import { clamp, disconnectQuietly, readBoolean, readNumber, readString } from "../params";
import type { EffectInstance, OctaverMode } from "../types";
import { createDryWet } from "./dryWet";

const CURVE_SAMPLES = 2048;

export function createRectifyCurve(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(CURVE_SAMPLES * 4));
  for (let i = 0; i < CURVE_SAMPLES; i += 1) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = Math.abs(x);
  }
  return curve;
}

/** Chebyshev T2 — analog-style octave-up, not a clean pitch shifter. */
export function createOctaveUpCurve(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(CURVE_SAMPLES * 4));
  for (let i = 0; i < CURVE_SAMPLES; i += 1) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = 2 * x * x - 1;
  }
  return curve;
}

function asMode(value: unknown): OctaverMode {
  if (value === "up" || value === "both" || value === "down") return value;
  return "down";
}

function applyModeGains(mode: OctaverMode, downGain: GainNode, upGain: GainNode): void {
  if (mode === "down") {
    downGain.gain.value = 1;
    upGain.gain.value = 0;
    return;
  }
  if (mode === "up") {
    downGain.gain.value = 0;
    upGain.gain.value = 1;
    return;
  }
  downGain.gain.value = 0.7;
  upGain.gain.value = 0.7;
}

export function createOctaverEffect(
  context: AudioContext,
  params: Record<string, unknown>,
): EffectInstance {
  const dryWet = createDryWet(
    context,
    readNumber(params, "mix", 0.4),
    readBoolean(params, "enabled", true),
  );

  const downShaper = context.createWaveShaper();
  const upShaper = context.createWaveShaper();
  const lowpass = context.createBiquadFilter();
  const highpass = context.createBiquadFilter();
  const downGain = context.createGain();
  const upGain = context.createGain();

  downShaper.curve = createRectifyCurve();
  upShaper.curve = createOctaveUpCurve();
  lowpass.type = "lowpass";
  lowpass.frequency.value = clamp(readNumber(params, "tone", 400), 80, 2000);
  highpass.type = "highpass";
  highpass.frequency.value = 200;

  let mode = asMode(params.mode ?? readString(params, "mode", "down"));
  applyModeGains(mode, downGain, upGain);

  dryWet.wetInput.connect(downShaper);
  downShaper.connect(lowpass);
  lowpass.connect(downGain);
  downGain.connect(dryWet.wetGain);

  dryWet.wetInput.connect(upShaper);
  upShaper.connect(highpass);
  highpass.connect(upGain);
  upGain.connect(dryWet.wetGain);

  return {
    input: dryWet.input,
    output: dryWet.output,
    setParam(key, value) {
      if (key === "mix" && typeof value === "number") {
        dryWet.setMix(value);
        return;
      }
      if (key === "tone" && typeof value === "number") {
        lowpass.frequency.value = clamp(value, 80, 2000);
        return;
      }
      if (key === "mode") {
        mode = asMode(value);
        applyModeGains(mode, downGain, upGain);
      }
    },
    setEnabled: dryWet.setEnabled,
    dispose() {
      disconnectQuietly(downShaper);
      disconnectQuietly(upShaper);
      disconnectQuietly(lowpass);
      disconnectQuietly(highpass);
      disconnectQuietly(downGain);
      disconnectQuietly(upGain);
      dryWet.dispose();
    },
  };
}
