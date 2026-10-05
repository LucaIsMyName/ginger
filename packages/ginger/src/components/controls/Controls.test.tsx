import { cleanup, fireEvent, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderGinger } from "../../testing";
import type { Track } from "../../types";
import {
  Mute,
  Next,
  PlayPause,
  PlaybackRate,
  Previous,
  Repeat,
  SeekBar,
  Shuffle,
  Volume,
} from "./Controls";

afterEach(cleanup);

const tracks: Track[] = [
  { id: "a", title: "Alpha", fileUrl: "/a.mp3" },
  { id: "b", title: "Beta", fileUrl: "/b.mp3" },
];

describe("PlayPause", () => {
  it("renders with default play icon when paused", () => {
    const { container } = renderGinger(<PlayPause />, { tracks });
    const view = within(container);
    const btn = view.getByRole("button", { name: "Play" });
    expect(btn.querySelector("svg")).toBeTruthy();
  });

  it("calls consumer onClick alongside internal handler", () => {
    const spy = vi.fn();
    const { container } = renderGinger(<PlayPause onClick={spy} />, { tracks });
    fireEvent.click(within(container).getByRole("button"));
    expect(spy).toHaveBeenCalledOnce();
  });

  it("uses string play and pause labels for accessible names", () => {
    const { container } = renderGinger(<PlayPause playLabel="Go" pauseLabel="Stop" />, { tracks });
    expect(within(container).getByRole("button", { name: "Go" })).toBeTruthy();
  });
});

describe("Next", () => {
  it("renders with default skip-forward icon", () => {
    const { container } = renderGinger(<Next />, { tracks });
    const btn = within(container).getByRole("button", { name: "Next track" });
    expect(btn.querySelector("svg")).toBeTruthy();
  });

  it("calls consumer onClick alongside internal handler", () => {
    const spy = vi.fn();
    const { container } = renderGinger(<Next onClick={spy} />, { tracks });
    fireEvent.click(within(container).getByRole("button"));
    expect(spy).toHaveBeenCalledOnce();
  });

  it("accepts custom aria labels", () => {
    const { container } = renderGinger(<Next ariaLabel="Skip forward" />, { tracks });
    expect(within(container).getByRole("button", { name: "Skip forward" })).toBeTruthy();
  });
});

describe("Previous", () => {
  it("renders with default skip-back icon", () => {
    const { container } = renderGinger(<Previous />, { tracks });
    const btn = within(container).getByRole("button", { name: "Previous track" });
    expect(btn.querySelector("svg")).toBeTruthy();
  });

  it("calls consumer onClick alongside internal handler", () => {
    const spy = vi.fn();
    const { container } = renderGinger(<Previous onClick={spy} />, { tracks });
    fireEvent.click(within(container).getByRole("button"));
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("Shuffle", () => {
  it("renders with aria-pressed", () => {
    const { container } = renderGinger(<Shuffle />, { tracks });
    const btn = within(container).getByRole("button", { name: "Shuffle" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("calls consumer onClick alongside internal handler", () => {
    const spy = vi.fn();
    const { container } = renderGinger(<Shuffle onClick={spy} />, { tracks });
    fireEvent.click(within(container).getByRole("button"));
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("Repeat", () => {
  it("renders with repeat mode aria label and icon", () => {
    const { container } = renderGinger(<Repeat />, { tracks });
    const btn = within(container).getByRole("button", { name: "Repeat off" });
    expect(btn.querySelector("svg")).toBeTruthy();
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("calls consumer onClick alongside internal handler", () => {
    const spy = vi.fn();
    const { container } = renderGinger(<Repeat onClick={spy} />, { tracks });
    fireEvent.click(within(container).getByRole("button"));
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("Mute", () => {
  it("renders with aria-pressed false and volume icon by default", () => {
    const { container } = renderGinger(<Mute />, { tracks });
    const btn = within(container).getByRole("button", { name: "Mute" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(btn.querySelector("svg")).toBeTruthy();
  });

  it("calls consumer onClick alongside internal handler", () => {
    const spy = vi.fn();
    const { container } = renderGinger(<Mute onClick={spy} />, { tracks });
    fireEvent.click(within(container).getByRole("button"));
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("Range and select controls", () => {
  it("supports custom aria labels for seek and volume", () => {
    const { container } = renderGinger(
      <>
        <SeekBar ariaLabel="Timeline" />
        <Volume ariaLabel="Gain" />
      </>,
      { tracks },
    );
    const view = within(container);
    expect(view.getByRole("slider", { name: "Timeline" })).toBeTruthy();
    expect(view.getByRole("slider", { name: "Gain" })).toBeTruthy();
  });

  it("supports custom aria labels for playback rate", () => {
    const { container } = renderGinger(<PlaybackRate ariaLabel="Speed selector" />, { tracks });
    expect(within(container).getByRole("combobox", { name: "Speed selector" })).toBeTruthy();
  });
});
