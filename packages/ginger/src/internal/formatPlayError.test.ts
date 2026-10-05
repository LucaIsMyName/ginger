import { describe, expect, it } from "vitest";
import { formatPlayRejectionError, isNotAllowedPlayError } from "./formatPlayError";

describe("formatPlayRejectionError", () => {
  it("prefixes NotAllowedError for autoplay policy failures", () => {
    const err = new DOMException("play() failed", "NotAllowedError");
    expect(formatPlayRejectionError(err)).toContain("NotAllowedError");
    expect(isNotAllowedPlayError(err)).toBe(true);
  });

  it("passes through Error message", () => {
    expect(formatPlayRejectionError(new Error("network"))).toBe("network");
  });
});
