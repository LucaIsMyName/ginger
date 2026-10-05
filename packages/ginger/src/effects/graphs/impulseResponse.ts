import { clamp } from "../params";

/**
 * Stereo decaying-noise impulse response. No IR files are shipped with the package.
 */
export function generateImpulseResponse(context: AudioContext, decaySeconds: number): AudioBuffer {
  const decay = clamp(decaySeconds, 0.05, 12);
  const sampleRate = context.sampleRate || 44_100;
  const length = Math.max(1, Math.floor(sampleRate * decay));
  const buffer = context.createBuffer(2, length, sampleRate);
  const tau = decay / 3;

  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t / tau);
    }
  }

  return buffer;
}

export function impulseHasEnergy(buffer: AudioBuffer): boolean {
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      if ((data[i] ?? 0) !== 0) return true;
    }
  }
  return false;
}
