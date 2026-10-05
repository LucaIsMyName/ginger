import { disconnectQuietly } from "../params";

export type LfoHandle = {
  oscillator: OscillatorNode;
  depth: GainNode;
  setRate: (hz: number) => void;
  setDepth: (value: number) => void;
  dispose: () => void;
};

export function createLfo(context: AudioContext, rate: number, depth: number): LfoHandle {
  const oscillator = context.createOscillator();
  const depthGain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = rate;
  depthGain.gain.value = depth;
  oscillator.connect(depthGain);
  oscillator.start();

  return {
    oscillator,
    depth: depthGain,
    setRate(hz) {
      oscillator.frequency.value = hz;
    },
    setDepth(value) {
      depthGain.gain.value = value;
    },
    dispose() {
      try {
        oscillator.stop();
      } catch {
        // already stopped
      }
      disconnectQuietly(oscillator);
      disconnectQuietly(depthGain);
    },
  };
}
