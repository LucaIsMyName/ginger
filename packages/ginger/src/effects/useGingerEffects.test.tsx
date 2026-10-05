import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Ginger } from "../ginger";
import { installMockWebAudio } from "../testing/mockWebAudio";
import type { Track } from "../types";
import { registerEffect, unregisterEffect } from "./registry";
import type { EffectInstance } from "./types";
import { useGingerEffects } from "./useGingerEffects";

const tracks: Track[] = [{ id: "fx", title: "FX", fileUrl: "/fx.mp3" }];

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      {children}
    </Ginger.Provider>
  );
}

function passthrough(context: AudioContext): EffectInstance {
  const node = context.createGain();
  return {
    input: node,
    output: node,
    setParam() {},
    setEnabled() {},
    dispose() {},
  };
}

describe("useGingerEffects", () => {
  let restoreWebAudio: (() => void) | null = null;

  afterEach(() => {
    restoreWebAudio?.();
    restoreWebAudio = null;
    unregisterEffect("hook-gain");
  });

  it("builds a multi-effect chain and updates params without rebuilding", async () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const { result } = renderHook(
      () =>
        useGingerEffects({
          chain: [
            { id: "d1", type: "delay", time: 0.2, mix: 0.3 },
            { id: "r1", type: "reverb", decay: 1.2, mix: 0.2 },
            { type: "distortion", amount: 0.3 },
            { type: "phaser", rate: 0.4, stages: 4 },
            { type: "chorus", voices: 2 },
            { type: "octaver", mode: "down" },
          ],
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      const context = webAudio.contexts[0];
      expect(context?.delays.length).toBeGreaterThanOrEqual(1);
      expect(context?.convolvers).toHaveLength(1);
      expect(context?.waveShapers.length).toBeGreaterThanOrEqual(1);
      expect(context?.oscillators.length).toBeGreaterThanOrEqual(1);
    });

    const context = webAudio.contexts[0]!;
    const delayCount = context.delays.length;
    const convolverCount = context.convolvers.length;

    act(() => {
      result.current.setEffect("d1", { time: 0.45, mix: 0.5 });
    });

    expect(context.delays).toHaveLength(delayCount);
    expect(context.convolvers).toHaveLength(convolverCount);
    expect(context.delays[0]?.delayTime.value).toBe(0.45);
    expect(result.current.chain[0]).toMatchObject({ id: "d1", time: 0.45, mix: 0.5 });
  });

  it("tears down the effects slot when disabled", async () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const { rerender } = renderHook(
      ({ enabled }) =>
        useGingerEffects({
          enabled,
          chain: [{ type: "delay", time: 0.25 }],
        }),
      {
        wrapper: Wrapper,
        initialProps: { enabled: true },
      },
    );

    await waitFor(() => {
      expect(webAudio.contexts[0]?.delays.length).toBeGreaterThanOrEqual(1);
    });

    rerender({ enabled: false });

    await waitFor(() => {
      const context = webAudio.contexts[0]!;
      expect(context.closeCalls).toBe(0);
      expect(context.sources[0]?.connections).toEqual([context.destination]);
    });
  });

  it("invokes custom and registered factories", async () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;
    let customCalls = 0;
    let registeredCalls = 0;

    registerEffect("hook-gain", (ctx) => {
      registeredCalls += 1;
      return passthrough(ctx);
    });

    renderHook(
      () =>
        useGingerEffects({
          chain: [
            {
              type: "custom",
              create: (ctx) => {
                customCalls += 1;
                return passthrough(ctx);
              },
            },
            { type: "hook-gain" },
          ],
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(customCalls).toBe(1);
      expect(registeredCalls).toBe(1);
    });
  });

  it("rebuilds when the chain structure changes", async () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;

    const { result } = renderHook(
      () => useGingerEffects({ chain: [{ id: "only", type: "delay", time: 0.2 }] }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(webAudio.contexts[0]?.delays.length).toBeGreaterThanOrEqual(1);
    });

    const before = webAudio.contexts[0]!.delays.length;

    act(() => {
      result.current.setChain([
        { id: "a", type: "delay", time: 0.15 },
        { id: "b", type: "delay", time: 0.4 },
      ]);
    });

    await waitFor(() => {
      expect(webAudio.contexts[0]!.delays.length).toBeGreaterThan(before);
    });
    expect(result.current.chain).toHaveLength(2);
  });
});
