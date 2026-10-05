/**
 * Web Audio graph management for crossfade transitions.
 *
 * Both elements are routed through gain nodes on the long-lived context owned by
 * `liveAudioGraph`. The context is never closed here: a `MediaElementAudioSourceNode`
 * permanently captures its element, and closing the context leaves that element silent.
 */

import { beginElementCrossfade, endElementCrossfade } from "../analyzer/liveAudioGraph";

export type CrossfadeCurve = "linear" | "equal-power";

export type CrossfadeGraph = {
  context: AudioContext;
  outGain: GainNode;
  inGain: GainNode;
  outSource: MediaElementAudioSourceNode;
  inSource: MediaElementAudioSourceNode;
  mainElement: HTMLAudioElement;
};

const EQUAL_POWER_CURVE_LENGTH = 256;

function buildEqualPowerCurves(): { outCurve: Float32Array; inCurve: Float32Array } {
  const outCurve = new Float32Array(EQUAL_POWER_CURVE_LENGTH);
  const inCurve = new Float32Array(EQUAL_POWER_CURVE_LENGTH);
  for (let i = 0; i < EQUAL_POWER_CURVE_LENGTH; i++) {
    const t = i / (EQUAL_POWER_CURVE_LENGTH - 1);
    outCurve[i] = Math.cos(t * (Math.PI / 2));
    inCurve[i] = Math.sin(t * (Math.PI / 2));
  }
  return { outCurve, inCurve };
}

/**
 * Connects the outgoing Ginger element and the incoming element to gain nodes
 * on the shared media-element AudioContext.
 *
 * The outgoing gain starts at 1, the incoming gain starts at 0.
 * Call `scheduleCrossfade` immediately after to begin the ramps.
 *
 * @throws `Error` if the Web Audio API is unavailable in this environment.
 */
export function attachCrossfadeGraph(
  outgoing: HTMLAudioElement,
  incoming: HTMLAudioElement,
): CrossfadeGraph {
  const handle = beginElementCrossfade(outgoing, incoming);
  return { ...handle, mainElement: outgoing };
}

/**
 * Schedules gain ramps on both gain nodes so that `outGain` fades from 1 → 0
 * and `inGain` fades from 0 → 1 over `durationSec` seconds starting immediately.
 *
 * For `"equal-power"`, a cosine/sine curve is applied via `setValueCurveAtTime`
 * to maintain consistent perceived loudness throughout the transition.
 */
export function scheduleCrossfade(
  graph: CrossfadeGraph,
  durationSec: number,
  curve: CrossfadeCurve,
): void {
  const { context, outGain, inGain } = graph;
  const startTime = context.currentTime;
  const endTime = startTime + durationSec;

  if (curve === "equal-power") {
    const { outCurve, inCurve } = buildEqualPowerCurves();
    outGain.gain.setValueCurveAtTime(outCurve, startTime, durationSec);
    inGain.gain.setValueCurveAtTime(inCurve, startTime, durationSec);
  } else {
    outGain.gain.setValueAtTime(1, startTime);
    outGain.gain.linearRampToValueAtTime(0, endTime);
    inGain.gain.setValueAtTime(0, startTime);
    inGain.gain.linearRampToValueAtTime(1, endTime);
  }
}

/**
 * Disconnects the incoming element and restores the main element's normal route.
 * Safe to call multiple times. Does not close the AudioContext.
 */
export function teardownCrossfadeGraph(graph: CrossfadeGraph): void {
  endElementCrossfade(graph.mainElement);
}
