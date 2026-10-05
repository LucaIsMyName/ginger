import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Next, PlayPause, Previous } from "../components/controls/Controls";
import { Artist, Title } from "../components/current/texts";
import { Ginger } from "../ginger";
import type { Track } from "../types";

afterEach(cleanup);

const tracks: Track[] = [
  { id: "one", title: "Song One", artist: "Artist A", fileUrl: "/one.mp3" },
  { id: "two", title: "Song Two", artist: "Artist B", fileUrl: "/two.mp3" },
  { id: "three", title: "Song Three", artist: "Artist C", fileUrl: "/three.mp3" },
];

function TestPlayer({
  onTrackChange,
}: { onTrackChange?: (track: Track | null, index: number) => void }) {
  return (
    <Ginger.Provider initialTracks={tracks} onTrackChange={onTrackChange}>
      <Ginger.Player />
      <Title />
      <Artist />
      <PlayPause />
      <Next />
      <Previous />
    </Ginger.Provider>
  );
}

describe("GingerProvider integration", () => {
  it("renders the first track metadata", () => {
    const { container } = render(<TestPlayer />);
    const view = within(container);
    expect(view.getByText("Song One")).toBeTruthy();
    expect(view.getByText("Artist A")).toBeTruthy();
  });

  it("navigates to next track on Next click", async () => {
    const { container } = render(<TestPlayer />);
    const view = within(container);
    await act(() => {
      fireEvent.click(view.getByRole("button", { name: "Next track" }));
    });
    expect(view.getByText("Song Two")).toBeTruthy();
  });

  it("navigates to previous track after going next", async () => {
    const { container } = render(<TestPlayer />);
    const view = within(container);
    await act(() => {
      fireEvent.click(view.getByRole("button", { name: "Next track" }));
    });
    expect(view.getByText("Song Two")).toBeTruthy();
    await act(() => {
      fireEvent.click(view.getByRole("button", { name: "Previous track" }));
    });
    expect(view.getByText("Song One")).toBeTruthy();
  });

  it("renders with no tracks without crashing", () => {
    const { container } = render(
      <Ginger.Provider initialTracks={[]}>
        <Ginger.Player />
        <Title fallback="Nothing playing" />
        <PlayPause />
      </Ginger.Provider>,
    );
    expect(within(container).getByText("Nothing playing")).toBeTruthy();
  });

  it("applies unstyled mode without default CSS variables", () => {
    const { container } = render(
      <Ginger.Provider initialTracks={tracks} unstyled>
        <Ginger.Player />
        <Title />
      </Ginger.Provider>,
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.getPropertyValue("--ginger-primary-color")).toBe("");
  });

  it("sets data-ginger-playback attribute", () => {
    const { container } = render(
      <Ginger.Provider initialTracks={tracks}>
        <Ginger.Player />
      </Ginger.Provider>,
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.getAttribute("data-ginger-playback")).toBeTruthy();
  });

  it("merges shell props onto a single child when asChild", () => {
    const { container } = render(
      <Ginger.Provider asChild initialTracks={tracks} className="wrap" unstyled>
        <div data-testid="shell">
          <Ginger.Player />
        </div>
      </Ginger.Provider>,
    );
    const shell = container.querySelector<HTMLElement>("[data-testid='shell']");
    expect(shell).toBeTruthy();
    expect(shell?.className).toContain("wrap");
    expect(shell?.getAttribute("data-ginger-playback")).toBeTruthy();
    expect(shell?.getAttribute("data-ginger-root")).toBe("");
  });

  it("hydrates persisted volume before the first write", () => {
    const store = new Map<string, unknown>([
      ["ginger:volume", 0.25],
      ["ginger:currentIndex", 1],
    ]);
    const writes: unknown[] = [];
    const persistence = {
      get: (key: string) => store.get(key),
      set: (key: string, value: unknown) => {
        if (key === "ginger:volume") writes.push(value);
        store.set(key, value);
      },
    };
    render(
      <Ginger.Provider
        initialTracks={tracks}
        persistence={persistence}
        hydrateOnMount
        initialVolume={1}
      >
        <Title />
      </Ginger.Provider>,
    );
    expect(writes.includes(1)).toBe(false);
    expect(store.get("ginger:volume")).toBe(0.25);
    expect(within(document.body).getByText("Song Two")).toBeTruthy();
  });

  it("calls onRetryExhausted when retryOnError will not retry further", () => {
    const onRetryExhausted = vi.fn();
    const { container } = render(
      <Ginger.Provider
        initialTracks={tracks}
        retryOnError={{ maxRetries: 0, retryableErrors: ["MEDIA_ERR_NETWORK"] }}
        onRetryExhausted={onRetryExhausted}
      >
        <Ginger.Player />
      </Ginger.Provider>,
    );
    const audio = container.querySelector("audio") as HTMLAudioElement;
    expect(audio).toBeTruthy();
    Object.defineProperty(audio, "error", { configurable: true, value: { code: 2 } });
    act(() => {
      fireEvent.error(audio);
    });
    expect(onRetryExhausted).toHaveBeenCalledTimes(1);
  });
});
