import { afterEach, describe, expect, it, vi } from "vitest";
import { installMockWebAudio } from "../testing/mockWebAudio";
import { analyzeAudioBuffer, analyzeAudioFile } from "./analyzeAudioFile";

describe("analyzeAudioBuffer", () => {
  it("returns amplitudeGrid with requested dimensions and optional spectrogram", () => {
    const install = installMockWebAudio();
    const ctx = new window.AudioContext();
    const buffer = ctx.createBuffer(1, 8_192, 44_100);
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < ch.length; i += 1) {
      ch[i] = Math.sin((i / 100) * Math.PI * 2) * 0.8;
    }

    const out = analyzeAudioBuffer(buffer, {
      timeSlices: 8,
      samplesPerSlice: 4,
      spectrogram: true,
      fftSize: 256,
      frequencyBins: 32,
    });

    expect(out.duration).toBeGreaterThan(0);
    expect(out.sampleRate).toBe(44_100);
    expect(out.amplitudeGrid.length).toBe(8);
    expect(out.amplitudeGrid[0]!.length).toBe(4);
    expect(out.spectrogram?.length).toBe(8);
    expect(out.spectrogram?.[0]?.length).toBe(32);

    void ctx.close();
    install.restore();
  });
});

describe("analyzeAudioFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })),
    );
    await expect(analyzeAudioFile("https://example.com/missing.mp3")).rejects.toThrow(
      /Fetch failed/,
    );
  });

  it("throws when Web Audio is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      })),
    );
    const install = installMockWebAudio();
    install.restore();
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      configurable: true,
      value: undefined,
    });
    await expect(analyzeAudioFile("/local.mp3")).rejects.toThrow(/not available/);
  });
});
