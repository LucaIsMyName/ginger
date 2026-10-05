import { act, cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Ginger } from "../ginger";
import type { Track } from "../types";
import { useGingerChapterProgress } from "./useGingerChapterProgress";
import { useGingerDebugLog } from "./useGingerDebugLog";
import { useGingerKeyboardShortcuts } from "./useGingerKeyboardShortcuts";
import { useGingerPlaybackHistory } from "./useGingerPlaybackHistory";
import { useGingerVolumeFade } from "./useGingerVolumeFade";

afterEach(cleanup);

const tracks: Track[] = [
  {
    id: "c",
    title: "C",
    fileUrl: "/c.mp3",
    chapters: [
      { title: "Intro", startSeconds: 0 },
      { title: "Main", startSeconds: 60 },
    ],
  },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      {children}
    </Ginger.Provider>
  );
}

describe("useGingerKeyboardShortcuts", () => {
  it("toggles play on space when enabled", () => {
    renderHook(() => useGingerKeyboardShortcuts(true, { playPause: " " }), {
      wrapper: Wrapper,
    });
    act(() => {
      fireEvent.keyDown(window, { key: " ", code: "Space" });
    });
  });
});

describe("useGingerVolumeFade", () => {
  it("exposes fade helpers", () => {
    const { result } = renderHook(() => useGingerVolumeFade(), { wrapper: Wrapper });
    expect(result.current.isFading).toBe(false);
    act(() => {
      result.current.fadeVolumeTo({ targetVolume: 0.5, durationMs: 0, onComplete: vi.fn() });
    });
    expect(result.current.cancelFade).toBeDefined();
  });
});

describe("useGingerChapterProgress", () => {
  it("returns progress fields for chapter track", () => {
    const { result } = renderHook(() => useGingerChapterProgress(), { wrapper: Wrapper });
    expect(result.current.progress).toBeGreaterThanOrEqual(0);
    expect(result.current.elapsed).toBeGreaterThanOrEqual(0);
  });
});

describe("useGingerPlaybackHistory", () => {
  it("records the current track and supports clearHistory", () => {
    const { result } = renderHook(() => useGingerPlaybackHistory(), { wrapper: Wrapper });
    expect(result.current.history.length).toBeGreaterThan(0);
    act(() => {
      result.current.clearHistory();
    });
    expect(result.current.history).toEqual([]);
  });
});

describe("useGingerDebugLog", () => {
  it("does not throw when disabled", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    renderHook(() => useGingerDebugLog(false), { wrapper: Wrapper });
    expect(debug).not.toHaveBeenCalled();
    debug.mockRestore();
  });
});
