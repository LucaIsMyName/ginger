import { afterEach, describe, expect, it } from "vitest";
import { installMockWebAudio } from "../../testing/mockWebAudio";
import { generateImpulseResponse, impulseHasEnergy } from "./impulseResponse";

describe("generateImpulseResponse", () => {
  let restoreWebAudio: (() => void) | null = null;

  afterEach(() => {
    restoreWebAudio?.();
    restoreWebAudio = null;
  });

  it("creates a non-silent stereo buffer", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;
    const context = new window.AudioContext();

    const buffer = generateImpulseResponse(context, 0.2);

    expect(buffer.numberOfChannels).toBe(2);
    expect(buffer.length).toBeGreaterThan(1);
    expect(impulseHasEnergy(buffer)).toBe(true);
  });
});
