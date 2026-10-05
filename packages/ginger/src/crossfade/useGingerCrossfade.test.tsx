import { act, renderHook, waitFor } from "@testing-library/react";
import { type ReactNode, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Ginger } from "../ginger";
import { useGinger } from "../hooks/useGinger";
import { installMockWebAudio } from "../testing/mockWebAudio";
import type { Track } from "../types";
import { useGingerCrossfade } from "./useGingerCrossfade";

const attachCrossfadeGraph = vi.fn();
const scheduleCrossfade = vi.fn();
const teardownCrossfadeGraph = vi.fn();

vi.mock("./crossfadeGraph", () => ({
  attachCrossfadeGraph: (...args: unknown[]) => attachCrossfadeGraph(...args),
  scheduleCrossfade: (...args: unknown[]) => scheduleCrossfade(...args),
  teardownCrossfadeGraph: (...args: unknown[]) => teardownCrossfadeGraph(...args),
}));

const tracks: Track[] = [
  { id: "a", title: "A", fileUrl: "/a.mp3" },
  { id: "b", title: "B", fileUrl: "/b.mp3" },
];

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <Ginger.Provider initialTracks={tracks} initialPaused={false}>
      <Ginger.Player />
      {children}
    </Ginger.Provider>
  );
}

function useCrossfadeInFadeWindow(enabled: boolean) {
  const { dispatch } = useGinger();
  const crossfade = useGingerCrossfade({ duration: 3, enabled });

  useEffect(() => {
    dispatch({
      type: "MEDIA_TIME_UPDATE",
      payload: { currentTime: 8, duration: 10, bufferedFraction: 0 },
    });
  }, [dispatch]);

  return crossfade;
}

describe("useGingerCrossfade", () => {
  let restoreWebAudio: (() => void) | null = null;

  beforeEach(() => {
    attachCrossfadeGraph.mockReturnValue({
      context: { resume: vi.fn().mockResolvedValue(undefined) },
      mainElement: document.createElement("audio"),
    });
  });

  afterEach(() => {
    restoreWebAudio?.();
    restoreWebAudio = null;
    attachCrossfadeGraph.mockReset();
    scheduleCrossfade.mockReset();
    teardownCrossfadeGraph.mockReset();
  });

  it("starts crossfade only inside the fade window", async () => {
    restoreWebAudio = installMockWebAudio().restore;

    renderHook(() => useCrossfadeInFadeWindow(true), { wrapper: Wrapper });

    await waitFor(() => {
      expect(attachCrossfadeGraph).toHaveBeenCalled();
    });

    expect(scheduleCrossfade).toHaveBeenCalledWith(expect.anything(), 2, "equal-power");
  });

  it("aborts an active session when enabled becomes false", async () => {
    restoreWebAudio = installMockWebAudio().restore;

    const { rerender } = renderHook(({ enabled }) => useCrossfadeInFadeWindow(enabled), {
      wrapper: Wrapper,
      initialProps: { enabled: true },
    });

    await waitFor(() => expect(attachCrossfadeGraph).toHaveBeenCalled());

    await act(async () => {
      rerender({ enabled: false });
    });

    await waitFor(() => {
      expect(teardownCrossfadeGraph).toHaveBeenCalled();
    });
  });
});
