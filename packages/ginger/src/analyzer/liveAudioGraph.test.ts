import { afterEach, describe, expect, it } from "vitest";
import { installMockWebAudio } from "../testing/mockWebAudio";
import {
  attachLiveAnalyser,
  beginElementCrossfade,
  detachLiveAnalyser,
  endElementCrossfade,
  setProcessingSlot,
} from "./liveAudioGraph";

const options = {
  fftSize: 1024,
  smoothingTimeConstant: 0.72,
  minDecibels: -90,
  maxDecibels: -20,
};

describe("liveAudioGraph", () => {
  let restoreWebAudio: (() => void) | null = null;

  afterEach(() => {
    restoreWebAudio?.();
    restoreWebAudio = null;
  });

  it("creates one source per element and makes the first analyser audible", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const element = document.createElement("audio");
    const attached = attachLiveAnalyser(element, options);
    const context = webAudio.contexts[0]!;
    const analyser = context.analysers[0]!;

    expect(webAudio.contexts).toHaveLength(1);
    expect(attached.id).toBe(0);
    expect(attached.context).toBe(context);
    expect(attached.analyser).toBe(analyser);
    expect(context.sources).toHaveLength(1);
    expect(context.analysers).toHaveLength(1);
    expect(analyser.fftSize).toBe(1024);
    expect(analyser.smoothingTimeConstant).toBe(0.72);
    expect(analyser.minDecibels).toBe(-90);
    expect(analyser.maxDecibels).toBe(-20);
    expect(context.sources[0]?.connections).toEqual([analyser]);
    expect(analyser.connections).toEqual([context.destination]);
  });

  it("shares the source for multiple consumers without duplicating playback wiring", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const element = document.createElement("audio");
    const first = attachLiveAnalyser(element, options);
    const second = attachLiveAnalyser(element, { ...options, fftSize: 2048 });
    const context = webAudio.contexts[0]!;

    expect(webAudio.contexts).toHaveLength(1);
    expect(first.id).toBe(0);
    expect(second.id).toBe(1);
    expect(context.sources).toHaveLength(1);
    expect(context.analysers).toHaveLength(2);
    expect(context.sources[0]?.connections).toEqual(context.analysers);
    expect(context.analysers[0]?.connections).toEqual([context.destination]);
    expect(context.analysers[1]?.connections).toEqual([]);
  });

  it("promotes another consumer to playback sink when the active sink detaches", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const element = document.createElement("audio");
    const first = attachLiveAnalyser(element, options);
    attachLiveAnalyser(element, options);
    const context = webAudio.contexts[0]!;
    const firstAnalyser = context.analysers[0]!;
    const secondAnalyser = context.analysers[1]!;

    detachLiveAnalyser(element, first.id);

    // First analyser must be fully disconnected and no longer in the graph
    expect(firstAnalyser.connections).toEqual([]);
    expect(firstAnalyser.disconnectCalls).toBeGreaterThanOrEqual(1);
    // Second analyser should now be the playback sink (connected to destination)
    expect(secondAnalyser.connections).toEqual([context.destination]);
    expect(secondAnalyser.connectCalls).toContain(context.destination);
    expect(context.state).toBe("running");
  });

  it("keeps the context alive and routes the source to the destination when the last consumer detaches", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const element = document.createElement("audio");
    const attached = attachLiveAnalyser(element, options);
    const context = webAudio.contexts[0]!;

    detachLiveAnalyser(element, attached.id);

    expect(context.sources[0]?.disconnectCalls).toBeGreaterThanOrEqual(1);
    expect(context.closeCalls).toBe(0);
    expect(context.state).toBe("running");
    expect(context.sources[0]?.connections).toEqual([context.destination]);

    attachLiveAnalyser(element, options);
    expect(webAudio.contexts).toHaveLength(1);
    expect(context.sources).toHaveLength(1);
  });

  it("composes eq and spatial slots without dropping either", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const element = document.createElement("audio");
    attachLiveAnalyser(element, options);
    const context = webAudio.contexts[0]!;
    const eq = context.createBiquadFilter();
    const panner = context.createPanner();
    setProcessingSlot(element, "eq", [eq]);
    setProcessingSlot(element, "spatial", [panner]);

    expect(context.sources[0]?.connections).toEqual([eq]);
    expect(context.biquadFilters[0]?.connections).toEqual([panner]);
    expect(context.panners[0]?.connections).toEqual([context.analysers[0]]);
  });

  it("composes eq, spatial, effects units, and user without wiping internals", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const element = document.createElement("audio");
    attachLiveAnalyser(element, options);
    const context = webAudio.contexts[0]!;

    const eq = context.createBiquadFilter();
    const panner = context.createPanner();
    const user = context.createGain();
    const input = context.createGain();
    const output = context.createGain();
    const internal = context.createGain();
    const feedback = context.createGain();

    input.connect(internal);
    internal.connect(output);
    internal.connect(feedback);
    feedback.connect(internal);

    setProcessingSlot(element, "eq", [eq]);
    setProcessingSlot(element, "spatial", [panner]);
    setProcessingSlot(element, "effects", [{ input, output }]);
    setProcessingSlot(element, "user", [user]);

    // createGain order: user, input, output, internal, feedback
    const mockUser = context.gains[0];
    const mockOutput = context.gains[2];
    const mockInternal = context.gains[3];
    const mockFeedback = context.gains[4];

    expect(mockInternal?.connections).toEqual([output, feedback]);
    expect(mockFeedback?.connections).toEqual([internal]);
    expect(context.sources[0]?.connections).toEqual([eq]);
    expect(context.biquadFilters[0]?.connections).toEqual([panner]);
    expect(context.panners[0]?.connections).toEqual([input]);
    expect(mockOutput?.connections).toEqual([user]);
    expect(mockUser?.connections).toEqual([context.analysers[0]]);

    const laterEq = context.createBiquadFilter();
    setProcessingSlot(element, "eq", [laterEq]);

    expect(mockInternal?.connections).toEqual([output, feedback]);
    expect(mockFeedback?.connections).toEqual([internal]);
    expect(context.sources[0]?.connections).toEqual([laterEq]);
    expect(context.biquadFilters[1]?.connections).toEqual([panner]);
    expect(mockOutput?.connections).toEqual([user]);
  });

  it("crossfades on the existing context and restores the route without closing it", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const main = document.createElement("audio");
    const incoming = document.createElement("audio");
    const attached = attachLiveAnalyser(main, options);
    const context = webAudio.contexts[0]!;

    const fade = beginElementCrossfade(main, incoming);
    expect(fade.context).toBe(context);
    expect(webAudio.contexts).toHaveLength(1);
    expect(context.sources).toHaveLength(2);
    expect(context.closeCalls).toBe(0);

    endElementCrossfade(main);
    expect(context.closeCalls).toBe(0);
    expect(context.state).toBe("running");
    detachLiveAnalyser(main, attached.id);
    expect(context.sources[0]?.connections).toEqual([context.destination]);
  });

  it("throws a clear error when Web Audio is unavailable", () => {
    const previousAudioContext = window.AudioContext;
    const previousWebkitAudioContext = (
      window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext;

    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    try {
      expect(() => attachLiveAnalyser(document.createElement("audio"), options)).toThrow(
        "Web Audio API is not available",
      );
    } finally {
      Object.defineProperty(window, "AudioContext", {
        configurable: true,
        writable: true,
        value: previousAudioContext,
      });
      Object.defineProperty(window, "webkitAudioContext", {
        configurable: true,
        writable: true,
        value: previousWebkitAudioContext,
      });
    }
  });
});
