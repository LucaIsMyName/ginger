import { afterEach, describe, expect, it } from "vitest";
import { installMockWebAudio } from "../testing/mockWebAudio";
import { createEffect } from "./createEffect";
import { registerEffect, unregisterEffect } from "./registry";
import type { EffectInstance } from "./types";

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

describe("createEffect", () => {
  let restoreWebAudio: (() => void) | null = null;

  afterEach(() => {
    restoreWebAudio?.();
    restoreWebAudio = null;
    unregisterEffect("test-boost");
  });

  it("builds built-in and custom effects", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;
    const context = new window.AudioContext();

    const delay = createEffect(context, { type: "delay", time: 0.2 });
    expect(webAudio.contexts[0]?.delays).toHaveLength(1);
    expect(delay.input).toBeTruthy();

    let created = false;
    const custom = createEffect(context, {
      type: "custom",
      create: (ctx) => {
        created = true;
        return passthrough(ctx);
      },
    });
    expect(created).toBe(true);
    expect(custom.input).toBe(custom.output);
  });

  it("uses registerEffect for unknown types", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;
    const context = new window.AudioContext();
    let invoked = false;

    registerEffect("test-boost", (ctx) => {
      invoked = true;
      return passthrough(ctx);
    });

    createEffect(context, { type: "test-boost" });
    expect(invoked).toBe(true);
  });

  it("throws on unknown types", () => {
    const webAudio = installMockWebAudio();
    restoreWebAudio = webAudio.restore;
    const context = new window.AudioContext();

    expect(() => createEffect(context, { type: "missing-fx" })).toThrow("Unknown effect type");
    expect(() => createEffect(context, { type: "custom" })).toThrow("create() function");
  });
});
