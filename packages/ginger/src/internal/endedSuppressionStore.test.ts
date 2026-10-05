import { describe, expect, it } from "vitest";
import { createEndedSuppressionStore } from "./endedSuppressionStore";

describe("createEndedSuppressionStore", () => {
  it("isolates suppression per store instance", () => {
    const a = createEndedSuppressionStore();
    const b = createEndedSuppressionStore();
    const elA = document.createElement("audio");
    elA.src = "https://example.com/a.mp3";
    const elB = document.createElement("audio");
    elB.src = "https://example.com/b.mp3";

    a.beginEndedSuppression(elA);
    expect(a.shouldIgnoreEnded(elA)).toBe(true);
    expect(b.shouldIgnoreEnded(elA)).toBe(false);
  });

  it("clearEndedSuppression drops active suppression", () => {
    const store = createEndedSuppressionStore();
    const el = document.createElement("audio");
    el.src = "/t.mp3";
    store.beginEndedSuppression(el);
    store.clearEndedSuppression();
    expect(store.shouldIgnoreEnded(el)).toBe(false);
  });
});
