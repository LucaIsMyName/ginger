import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Ginger } from "../ginger";
import { installMockWebAudio } from "../testing/mockWebAudio";
import type { Track } from "../types";
import type { UseGingerLiveAnalyzerResult } from "./useGingerLiveAnalyzer";
import { useGingerLiveAnalyzer } from "./useGingerLiveAnalyzer";

const tracks: Track[] = [{ id: "wave", title: "Wave", fileUrl: "/wave.mp3" }];

type HarnessProps = {
  withPlayer?: boolean;
  enabled?: boolean;
};

let latestAnalyzer: UseGingerLiveAnalyzerResult | null = null;

function AnalyzerProbe({ enabled = true }: { enabled?: boolean }) {
  const analyzer = useGingerLiveAnalyzer({
    enabled,
    fftSize: 1024,
    smoothingTimeConstant: 0.72,
    minDecibels: -90,
    maxDecibels: -20,
  });

  latestAnalyzer = analyzer;

  return (
    <div>
      <span data-testid="frequency-bin-count">{analyzer.frequencyBinCount}</span>
      <span data-testid="sample-rate">{analyzer.sampleRate}</span>
      <span data-testid="is-suspended">{analyzer.isSuspended ? "yes" : "no"}</span>
      <span data-testid="error">{analyzer.error ?? "none"}</span>
      <span data-testid="frequency-values">
        {analyzer.frequencyData[0] ?? -1}:{analyzer.frequencyData[1] ?? -1}
      </span>
      <span data-testid="time-values">
        {analyzer.timeDomainData[0] ?? -1}:{analyzer.timeDomainData[1] ?? -1}
      </span>
      <span data-testid="time-length">{analyzer.timeDomainData.length}</span>
    </div>
  );
}

function AnalyzerHarness({ withPlayer = true, enabled = true }: HarnessProps) {
  return (
    <Ginger.Provider initialTracks={tracks}>
      {withPlayer ? <Ginger.Player /> : null}
      <AnalyzerProbe enabled={enabled} />
    </Ginger.Provider>
  );
}

describe("useGingerLiveAnalyzer", () => {
  let restoreWebAudio: (() => void) | null = null;

  afterEach(() => {
    cleanup();
    restoreWebAudio?.();
    restoreWebAudio = null;
    latestAnalyzer = null;
  });

  it("retries attaching until the player audio element exists", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const view = render(<AnalyzerHarness withPlayer={false} />);

    expect(screen.getByTestId("frequency-bin-count").textContent).toBe("0");
    expect(webAudio.contexts).toHaveLength(0);
    expect(webAudio.pendingAnimationFrameCount()).toBe(1);

    act(() => {
      webAudio.flushAnimationFrame();
    });

    expect(webAudio.contexts).toHaveLength(0);

    view.rerender(<AnalyzerHarness withPlayer />);

    act(() => {
      webAudio.flushAnimationFrame();
    });

    expect(webAudio.contexts).toHaveLength(1);
    expect(screen.getByTestId("frequency-bin-count").textContent).toBe("512");
    expect(screen.getByTestId("sample-rate").textContent).toBe("44100");
    expect(screen.getByTestId("error").textContent).toBe("none");
  });

  it("initializes metadata and populates analyzer buffers on animation frames", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    render(<AnalyzerHarness />);

    expect(screen.getByTestId("frequency-bin-count").textContent).toBe("512");
    expect(screen.getByTestId("sample-rate").textContent).toBe("44100");
    expect(screen.getByTestId("time-length").textContent).toBe("1024");
    expect(screen.getByTestId("frequency-values").textContent).toBe("0:0");

    act(() => {
      webAudio.flushAnimationFrame();
      webAudio.flushAnimationFrame();
      webAudio.flushAnimationFrame();
    });

    expect(screen.getByTestId("frequency-values").textContent).toBe("17:34");
    expect(screen.getByTestId("time-values").textContent).toBe("128:129");
  });

  it("exposes suspended state and resumes the audio context", async () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    render(<AnalyzerHarness />);

    const context = webAudio.contexts[0]!;
    act(() => {
      context.setStateForTest("suspended");
    });

    expect(screen.getByTestId("is-suspended").textContent).toBe("yes");

    await act(async () => {
      await latestAnalyzer?.resume();
    });

    expect(context.resumeCalls).toBe(1);
    expect(screen.getByTestId("is-suspended").textContent).toBe("no");
  });

  it("detaches the analyzer and resets exposed metadata when disabled", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const view = render(<AnalyzerHarness enabled />);

    act(() => {
      webAudio.flushAnimationFrame();
      webAudio.flushAnimationFrame();
      webAudio.flushAnimationFrame();
    });

    const context = webAudio.contexts[0]!;
    expect(screen.getByTestId("frequency-values").textContent).toBe("17:34");

    view.rerender(<AnalyzerHarness enabled={false} />);

    expect(context.sources[0]?.disconnectCalls).toBeGreaterThanOrEqual(1);
    expect(context.closeCalls).toBe(0);
    expect(context.sources[0]?.connections).toEqual([context.destination]);
    expect(screen.getByTestId("frequency-bin-count").textContent).toBe("0");
    expect(screen.getByTestId("sample-rate").textContent).toBe("0");
    expect(screen.getByTestId("time-length").textContent).toBe("0");
    expect(screen.getByTestId("frequency-values").textContent).toBe("-1:-1");
  });
});
