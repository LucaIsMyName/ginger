import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Ginger } from "../ginger";
import { installMockWebAudio } from "../testing/mockWebAudio";
import type { Track } from "../types";
import { useGingerSpatialAudio } from "./useGingerSpatialAudio";

const tracks: Track[] = [{ id: "s", title: "Spatial", fileUrl: "/s.mp3" }];

function SpatialProbe({ enabled = true }: { enabled?: boolean }) {
  const spatial = useGingerSpatialAudio({
    enabled,
    position: [1, 2, 3],
    listenerPosition: [4, 5, 6],
  });

  return (
    <div>
      <span data-testid="error">{spatial.error ?? "none"}</span>
      <button
        type="button"
        data-testid="set-source"
        onClick={() => spatial.setSourcePosition(10, 20, 30)}
      >
        src
      </button>
      <button
        type="button"
        data-testid="set-listener"
        onClick={() => spatial.setListenerPosition(7, 8, 9)}
      >
        lst
      </button>
    </div>
  );
}

function SpatialHarness({
  withPlayer = true,
  enabled = true,
}: { withPlayer?: boolean; enabled?: boolean }) {
  return (
    <Ginger.Provider initialTracks={tracks}>
      {withPlayer ? <Ginger.Player /> : null}
      <SpatialProbe enabled={enabled} />
    </Ginger.Provider>
  );
}

describe("useGingerSpatialAudio", () => {
  let restoreWebAudio: (() => void) | null = null;

  afterEach(() => {
    cleanup();
    restoreWebAudio?.();
    restoreWebAudio = null;
  });

  it("installs a panner and sets initial positions", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    render(<SpatialHarness />);

    expect(screen.getByTestId("error").textContent).toBe("none");
    expect(webAudio.contexts).toHaveLength(1);
    const ctx = webAudio.contexts[0]!;
    expect(ctx.panners).toHaveLength(1);
    const panner = ctx.panners[0]!;
    expect(panner.positionX.value).toBe(1);
    expect(panner.positionY.value).toBe(2);
    expect(panner.positionZ.value).toBe(3);
    const listener = ctx.listener as unknown as {
      positionX: { value: number };
      positionY: { value: number };
      positionZ: { value: number };
    };
    expect(listener.positionX.value).toBe(4);
    expect(listener.positionY.value).toBe(5);
    expect(listener.positionZ.value).toBe(6);
  });

  it("updates source and listener positions imperatively", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    render(<SpatialHarness />);

    const ctx = webAudio.contexts[0]!;
    const panner = ctx.panners[0]!;

    act(() => {
      screen.getByTestId("set-source").click();
    });

    expect(panner.positionX.value).toBe(10);
    expect(panner.positionY.value).toBe(20);
    expect(panner.positionZ.value).toBe(30);

    act(() => {
      screen.getByTestId("set-listener").click();
    });

    const listener = ctx.listener as unknown as {
      positionX: { value: number };
      positionY: { value: number };
      positionZ: { value: number };
    };
    expect(listener.positionX.value).toBe(7);
    expect(listener.positionY.value).toBe(8);
    expect(listener.positionZ.value).toBe(9);
  });

  it("clears processing chain when disabled", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const view = render(<SpatialHarness enabled />);

    expect(webAudio.contexts[0]!.panners.length).toBeGreaterThan(0);

    view.rerender(<SpatialHarness enabled={false} />);

    expect(webAudio.contexts[0]!.closeCalls).toBe(0);
    expect(webAudio.contexts[0]!.sources[0]?.connections).toEqual([
      webAudio.contexts[0]!.destination,
    ]);
  });
});
