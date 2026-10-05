import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useGingerPlayback } from "../context/GingerSplitContexts";
import { Ginger } from "../ginger";
import type { Track } from "../types";
import { useGingerSleepTimer } from "./useGingerSleepTimer";

afterEach(cleanup);

const tracks: Track[] = [
  { id: "one", title: "One", fileUrl: "/one.mp3" },
  { id: "two", title: "Two", fileUrl: "/two.mp3" },
  { id: "three", title: "Three", fileUrl: "/three.mp3" },
];

function TimerHarness({ onFire }: { onFire: () => void }) {
  const { next, prev } = useGingerPlayback();
  useGingerSleepTimer({ stopAfterTracks: 2, onFire });
  return (
    <>
      <button type="button" onClick={() => next()}>
        next
      </button>
      <button type="button" onClick={() => prev()}>
        prev
      </button>
    </>
  );
}

describe("useGingerSleepTimer", () => {
  it("counts forward advances and ignores previous", () => {
    let fires = 0;
    render(
      <Ginger.Provider initialTracks={tracks}>
        <TimerHarness
          onFire={() => {
            fires += 1;
          }}
        />
      </Ginger.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "next" }));
    fireEvent.click(screen.getByRole("button", { name: "prev" }));
    expect(fires).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    expect(fires).toBe(1);
  });
});
