import { describe, expect, it } from "vitest";
import { computeCrossfadeTrigger } from "./crossfadeTrigger";

describe("computeCrossfadeTrigger", () => {
  it("does not start at track beginning when track is longer than configured duration", () => {
    expect(computeCrossfadeTrigger(0, 10, 3)).toEqual({
      shouldStart: false,
      fadeLengthSeconds: 0,
    });
    expect(computeCrossfadeTrigger(5, 10, 3)).toEqual({
      shouldStart: false,
      fadeLengthSeconds: 0,
    });
  });

  it("starts in the final configured seconds of a long track", () => {
    expect(computeCrossfadeTrigger(7, 10, 3)).toEqual({
      shouldStart: true,
      fadeLengthSeconds: 3,
    });
    expect(computeCrossfadeTrigger(9, 10, 3)).toEqual({
      shouldStart: true,
      fadeLengthSeconds: 1,
    });
  });

  it("uses full track length when track is shorter than configured duration", () => {
    expect(computeCrossfadeTrigger(0, 2, 3)).toEqual({
      shouldStart: true,
      fadeLengthSeconds: 2,
    });
  });

  it("does not start after track ended", () => {
    expect(computeCrossfadeTrigger(10, 10, 3)).toEqual({
      shouldStart: false,
      fadeLengthSeconds: 0,
    });
  });
});
