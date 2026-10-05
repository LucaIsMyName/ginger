import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type CrossfadeGraph,
  attachCrossfadeGraph,
  scheduleCrossfade,
  teardownCrossfadeGraph,
} from "./crossfadeGraph";

const beginElementCrossfade = vi.fn();
const endElementCrossfade = vi.fn();

vi.mock("../analyzer/liveAudioGraph", () => ({
  beginElementCrossfade: (...args: unknown[]) => beginElementCrossfade(...args),
  endElementCrossfade: (...args: unknown[]) => endElementCrossfade(...args),
}));

describe("crossfadeGraph", () => {
  beforeEach(() => {
    beginElementCrossfade.mockReset();
    endElementCrossfade.mockReset();
  });

  it("attachCrossfadeGraph wires outgoing and incoming elements", () => {
    const outGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setValueCurveAtTime: vi.fn(),
      },
    };
    const inGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setValueCurveAtTime: vi.fn(),
      },
    };
    const context = { currentTime: 0 };
    const outgoing = document.createElement("audio");
    const incoming = document.createElement("audio");
    beginElementCrossfade.mockReturnValue({
      context,
      outGain,
      inGain,
      outSource: {},
      inSource: {},
    });

    const graph = attachCrossfadeGraph(outgoing, incoming);
    expect(beginElementCrossfade).toHaveBeenCalledWith(outgoing, incoming);
    expect(graph.mainElement).toBe(outgoing);

    scheduleCrossfade(graph as CrossfadeGraph, 2, "linear");
    expect(outGain.gain.linearRampToValueAtTime).toHaveBeenCalled();

    teardownCrossfadeGraph(graph);
    expect(endElementCrossfade).toHaveBeenCalledWith(outgoing);
  });
});
