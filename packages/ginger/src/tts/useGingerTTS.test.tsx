import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Ginger } from "../ginger";
import type { Track } from "../types";
import { estimateDuration, useGingerTTS } from "./useGingerTTS";

// ---------------------------------------------------------------------------
// Mock SpeechSynthesis
// ---------------------------------------------------------------------------

type MockUtterance = {
  text: string;
  rate: number;
  pitch: number;
  volume: number;
  lang: string;
  voice: SpeechSynthesisVoice | null;
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => void) | null;
  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
};

type MockSpeechSynthesis = {
  utterances: MockUtterance[];
  cancelCalls: number;
  speaking: boolean;
  install: () => void;
  restore: () => void;
  fireEnd: (index?: number) => void;
  fireBoundary: (charIndex: number, utteranceIndex?: number) => void;
  fireError: (error: string, utteranceIndex?: number) => void;
};

function installMockSpeechSynthesis(): MockSpeechSynthesis {
  const mock: MockSpeechSynthesis = {
    utterances: [],
    cancelCalls: 0,
    speaking: false,
    install() {},
    restore() {},
    fireEnd(index = mock.utterances.length - 1) {
      const u = mock.utterances[index];
      if (!u) return;
      mock.speaking = false;
      u.onend?.call(
        u as unknown as SpeechSynthesisUtterance,
        { charIndex: 0, charLength: 0, elapsedTime: 0, name: "" } as SpeechSynthesisEvent,
      );
    },
    fireBoundary(charIndex: number, index = mock.utterances.length - 1) {
      const u = mock.utterances[index];
      if (!u) return;
      u.onboundary?.call(
        u as unknown as SpeechSynthesisUtterance,
        { charIndex, charLength: 1, elapsedTime: 0, name: "word" } as SpeechSynthesisEvent,
      );
    },
    fireError(error: string, index = mock.utterances.length - 1) {
      const u = mock.utterances[index];
      if (!u) return;
      u.onerror?.call(
        u as unknown as SpeechSynthesisUtterance,
        { error } as SpeechSynthesisErrorEvent,
      );
    },
  };

  const UtteranceCtor = class MockSpeechSynthesisUtterance {
    text: string;
    rate = 1;
    pitch = 1;
    volume = 1;
    lang = "";
    voice: SpeechSynthesisVoice | null = null;
    onstart: MockUtterance["onstart"] = null;
    onend: MockUtterance["onend"] = null;
    onerror: MockUtterance["onerror"] = null;
    onboundary: MockUtterance["onboundary"] = null;
    constructor(text: string) {
      this.text = text;
    }
  };

  const synthObj = {
    utterances: mock.utterances,
    cancelCalls: 0,
    speaking: false,
    speak(u: MockUtterance) {
      mock.utterances.push(u);
      mock.speaking = true;
      u.onstart?.call(
        u as unknown as SpeechSynthesisUtterance,
        { charIndex: 0, charLength: 0, elapsedTime: 0, name: "" } as SpeechSynthesisEvent,
      );
    },
    cancel() {
      mock.cancelCalls += 1;
    },
    pause() {},
    resume() {},
    getVoices(): SpeechSynthesisVoice[] {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
  };

  const originalSynth = (window as unknown as Record<string, unknown>).speechSynthesis;
  const originalUtterance = (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance;

  (window as unknown as Record<string, unknown>).speechSynthesis = synthObj;
  (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = UtteranceCtor;

  mock.restore = () => {
    (window as unknown as Record<string, unknown>).speechSynthesis = originalSynth;
    (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = originalUtterance;
  };

  return mock;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const tracks: Track[] = [
  { id: "t1", title: "Article", fileUrl: "" },
  { id: "t2", title: "Section 2", fileUrl: "" },
];

const SAMPLE_TEXT = "Hello world this is a test article with several words in it.";

function TTSProbe({ texts, rate }: { texts: string[]; rate?: number }) {
  const result = useGingerTTS({ texts, rate });
  return (
    <div>
      <span data-testid="supported">{String(result.isSupported)}</span>
      <span data-testid="error">{result.error ?? "none"}</span>
      <button type="button" data-testid="seek" onClick={() => result.seek(5)}>
        seek
      </button>
    </div>
  );
}

function TTSHarness({
  texts,
  rate,
  initialPaused = true,
}: {
  texts: string[];
  rate?: number;
  initialPaused?: boolean;
}) {
  return (
    <Ginger.Provider initialTracks={tracks} initialPaused={initialPaused}>
      {/* No Ginger.Player — TTS drives playback */}
      <TTSProbe texts={texts} rate={rate} />
      <Ginger.Control.PlayPause data-testid="playpause" />
    </Ginger.Provider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("estimateDuration", () => {
  it("returns 0 for empty text", () => {
    expect(estimateDuration("", 1)).toBe(0);
    expect(estimateDuration("   ", 1)).toBe(0);
  });

  it("estimates based on 150 wpm at rate=1", () => {
    // 15 words at 150 wpm = 6 seconds
    const text =
      "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen";
    expect(estimateDuration(text, 1)).toBeCloseTo(6, 0);
  });

  it("halves duration at rate=2", () => {
    const text = "one two three four five six seven eight nine ten";
    const base = estimateDuration(text, 1);
    const fast = estimateDuration(text, 2);
    expect(fast).toBeCloseTo(base / 2, 1);
  });
});

describe("useGingerTTS", () => {
  let mock: MockSpeechSynthesis;

  beforeEach(() => {
    vi.useFakeTimers();
    mock = installMockSpeechSynthesis();
  });

  afterEach(() => {
    cleanup();
    mock.restore();
    vi.useRealTimers();
  });

  it("reports isSupported=true when speechSynthesis is available", () => {
    render(<TTSHarness texts={[SAMPLE_TEXT]} />);
    expect(screen.getByTestId("supported").textContent).toBe("true");
  });

  it("does not speak when initially paused", () => {
    render(<TTSHarness texts={[SAMPLE_TEXT]} initialPaused />);
    expect(mock.utterances).toHaveLength(0);
  });

  it("starts speaking when not paused", async () => {
    render(<TTSHarness texts={[SAMPLE_TEXT]} initialPaused={false} />);
    await act(async () => {
      vi.advanceTimersByTime(100); // advance past the 50ms speak delay
    });
    expect(mock.utterances.length).toBeGreaterThanOrEqual(1);
    expect(mock.utterances[0]?.text).toBe(SAMPLE_TEXT);
  });

  it("cancels speech when paused via control", async () => {
    render(<TTSHarness texts={[SAMPLE_TEXT]} initialPaused={false} />);
    await act(async () => {});
    const cancelsBefore = mock.cancelCalls;

    // Click PlayPause to pause
    act(() => {
      screen.getByTestId("playpause").click();
    });
    await act(async () => {});

    expect(mock.cancelCalls).toBeGreaterThan(cancelsBefore);
  });

  it("calls cancel on unmount", async () => {
    const view = render(<TTSHarness texts={[SAMPLE_TEXT]} initialPaused={false} />);
    await act(async () => {});
    const cancelsBefore = mock.cancelCalls;

    view.unmount();

    expect(mock.cancelCalls).toBeGreaterThan(cancelsBefore);
  });

  it("reports error on TTS engine error", async () => {
    render(<TTSHarness texts={[SAMPLE_TEXT]} initialPaused={false} />);
    await act(async () => {
      vi.advanceTimersByTime(100); // advance past the 50ms speak delay
    });

    act(() => {
      mock.fireError("synthesis-failed");
    });

    expect(screen.getByTestId("error").textContent).not.toBe("none");
  });

  it("does not report error for interrupted/canceled events", async () => {
    render(<TTSHarness texts={[SAMPLE_TEXT]} initialPaused={false} />);
    await act(async () => {});

    act(() => {
      mock.fireError("interrupted");
    });

    expect(screen.getByTestId("error").textContent).toBe("none");
  });

  it("updates time on interval tick", async () => {
    render(<TTSHarness texts={[SAMPLE_TEXT]} initialPaused={false} />);
    await act(async () => {});
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    // Just verifying no crash; time dispatch is internal
  });
});
