import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Ginger } from "../ginger";
import { installMockWebAudio } from "../testing/mockWebAudio";
import type { Track } from "../types";
import { useGingerEqualizer } from "./useGingerEqualizer";

const tracks: Track[] = [{ id: "eq", title: "EQ", fileUrl: "/eq.mp3" }];

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      {children}
    </Ginger.Provider>
  );
}

describe("useGingerEqualizer", () => {
  let restoreWebAudio: (() => void) | null = null;

  afterEach(() => {
    restoreWebAudio?.();
    restoreWebAudio = null;
  });

  it("creates filters and updates gain without rebuilding", async () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const { result } = renderHook(
      () =>
        useGingerEqualizer({
          bands: [{ frequency: 60 }, { frequency: 250 }],
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(webAudio.contexts[0]?.biquadFilters.length).toBe(2);
    });

    const context = webAudio.contexts[0]!;
    expect(context.biquadFilters[0]?.frequency.value).toBe(60);
    expect(context.biquadFilters[1]?.frequency.value).toBe(250);

    act(() => {
      result.current.setBandGain(1, 6);
    });

    expect(context.biquadFilters[1]?.gain.value).toBe(6);
    expect(result.current.bands[1]?.gain).toBe(6);

    act(() => {
      result.current.setBands([
        { frequency: 60, gain: -3 },
        { frequency: 250, gain: 4 },
      ]);
    });

    expect(context.biquadFilters).toHaveLength(2);
    expect(context.biquadFilters[0]?.gain.value).toBe(-3);
    expect(context.biquadFilters[1]?.gain.value).toBe(4);
    expect(result.current.bands[0]?.gain).toBe(-3);
  });

  it("tears down processing chain when disabled", async () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const { rerender } = renderHook(
      ({ enabled }) =>
        useGingerEqualizer({
          enabled,
          bands: [{ frequency: 1000 }],
        }),
      {
        wrapper: Wrapper,
        initialProps: { enabled: true },
      },
    );

    await waitFor(() => {
      expect(webAudio.contexts).toHaveLength(1);
      expect(webAudio.contexts[0]?.biquadFilters.length).toBe(1);
    });

    rerender({ enabled: false });

    await waitFor(() => {
      const context = webAudio.contexts[0]!;
      expect(context.closeCalls).toBe(0);
      expect(context.sources[0]?.connections).toEqual([context.destination]);
    });
  });
});
