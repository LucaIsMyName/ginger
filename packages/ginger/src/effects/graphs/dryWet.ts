import { clamp, disconnectQuietly } from "../params";

export type DryWetGraph = {
  input: GainNode;
  output: GainNode;
  wetInput: GainNode;
  dryGain: GainNode;
  wetGain: GainNode;
  setMix: (mix: number) => void;
  setEnabled: (enabled: boolean) => void;
  dispose: () => void;
};

export function createDryWet(context: AudioContext, mix = 1, enabled = true): DryWetGraph {
  const input = context.createGain();
  const output = context.createGain();
  const dryGain = context.createGain();
  const wetGain = context.createGain();
  const wetInput = context.createGain();

  input.connect(dryGain);
  input.connect(wetInput);
  dryGain.connect(output);
  wetGain.connect(output);

  let currentMix = clamp(mix, 0, 1);
  let currentEnabled = enabled;

  function apply(): void {
    const wet = currentEnabled ? currentMix : 0;
    dryGain.gain.value = 1 - wet;
    wetGain.gain.value = wet;
  }

  apply();

  return {
    input,
    output,
    wetInput,
    dryGain,
    wetGain,
    setMix(nextMix) {
      currentMix = clamp(nextMix, 0, 1);
      apply();
    },
    setEnabled(nextEnabled) {
      currentEnabled = nextEnabled;
      apply();
    },
    dispose() {
      disconnectQuietly(input);
      disconnectQuietly(output);
      disconnectQuietly(dryGain);
      disconnectQuietly(wetGain);
      disconnectQuietly(wetInput);
    },
  };
}
