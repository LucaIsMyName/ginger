import { cleanup, render, screen } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useGingerPlayback } from "../../context/GingerSplitContexts";
import { Ginger } from "../../ginger";
import type { Track } from "../../types";

afterEach(cleanup);

function QueueProbe() {
  const { tracks, currentIndex } = useGingerPlayback();
  return (
    <div>
      <span data-testid="queue-len">{tracks.length}</span>
      <span data-testid="current-idx">{currentIndex}</span>
      {tracks.map((t, i) => (
        <span key={`${t.fileUrl}-${i}`} data-testid={`t-${i}`}>
          {t.title}
        </span>
      ))}
    </div>
  );
}

const trackA: Track = { id: "a", title: "Song A", fileUrl: "https://example.com/a.mp3" };

describe("Ginger.Tracks declarative", () => {
  it("append merges initialTracks with declarative Track children", () => {
    render(
      <Ginger.Provider initialTracks={[trackA]}>
        <Ginger.Tracks merge="append">
          <Ginger.Tracks.Track id="b" title="Song B" src="https://example.com/b.mp3" />
        </Ginger.Tracks>
        <QueueProbe />
      </Ginger.Provider>,
    );
    expect(screen.getByTestId("queue-len").textContent).toBe("2");
    expect(screen.getByTestId("t-0").textContent).toBe("Song A");
    expect(screen.getByTestId("t-1").textContent).toBe("Song B");
  });

  it("replace uses only declarative tracks", () => {
    render(
      <Ginger.Provider
        initialTracks={[trackA, { ...trackA, id: "x", title: "X", fileUrl: "/x.mp3" }]}
      >
        <Ginger.Tracks merge="replace">
          <Ginger.Tracks.Track id="p" title="One" src="https://example.com/1.mp3" />
          <Ginger.Tracks.Track id="q" title="Two" src="https://example.com/2.mp3" />
        </Ginger.Tracks>
        <QueueProbe />
      </Ginger.Provider>,
    );
    expect(screen.getByTestId("queue-len").textContent).toBe("2");
    expect(screen.getByTestId("t-0").textContent).toBe("One");
    expect(screen.getByTestId("t-1").textContent).toBe("Two");
  });

  it("removing a declarative Track updates the queue", () => {
    const { rerender } = render(
      <Ginger.Provider initialTracks={[trackA]}>
        <Ginger.Tracks merge="append">
          <Ginger.Tracks.Track id="b" title="Song B" src="https://example.com/b.mp3" />
        </Ginger.Tracks>
        <QueueProbe />
      </Ginger.Provider>,
    );
    expect(screen.getByTestId("queue-len").textContent).toBe("2");

    rerender(
      <Ginger.Provider initialTracks={[trackA]}>
        <Ginger.Tracks merge="append" />
        <QueueProbe />
      </Ginger.Provider>,
    );
    expect(screen.getByTestId("queue-len").textContent).toBe("1");
    expect(screen.getByTestId("t-0").textContent).toBe("Song A");
  });

  it("reordering declarative children changes track order in append mode", () => {
    const { rerender } = render(
      <Ginger.Provider initialTracks={[]}>
        <Ginger.Tracks merge="replace">
          <Ginger.Tracks.Track id="first" title="First" src="https://example.com/1.mp3" />
          <Ginger.Tracks.Track id="second" title="Second" src="https://example.com/2.mp3" />
        </Ginger.Tracks>
        <QueueProbe />
      </Ginger.Provider>,
    );
    expect(screen.getByTestId("t-0").textContent).toBe("First");

    rerender(
      <Ginger.Provider initialTracks={[]}>
        <Ginger.Tracks merge="replace">
          <Ginger.Tracks.Track id="second" title="Second" src="https://example.com/2.mp3" />
          <Ginger.Tracks.Track id="first" title="First" src="https://example.com/1.mp3" />
        </Ginger.Tracks>
        <QueueProbe />
      </Ginger.Provider>,
    );
    expect(screen.getByTestId("t-0").textContent).toBe("Second");
    expect(screen.getByTestId("t-1").textContent).toBe("First");
  });

  it("keeps an imperative insert while declarative tracks stay mounted", () => {
    function InsertOnce() {
      const { insertTrackAt } = useGingerPlayback();
      const once = useRef(false);
      useEffect(() => {
        if (once.current) return;
        once.current = true;
        insertTrackAt({ id: "z", title: "Inserted", fileUrl: "https://example.com/z.mp3" });
      }, [insertTrackAt]);
      return null;
    }

    render(
      <Ginger.Provider initialTracks={[trackA]}>
        <Ginger.Tracks merge="append">
          <Ginger.Tracks.Track id="b" title="Song B" src="https://example.com/b.mp3" />
        </Ginger.Tracks>
        <InsertOnce />
        <QueueProbe />
      </Ginger.Provider>,
    );

    expect(screen.getByText("Inserted")).toBeTruthy();
    expect(screen.getByTestId("queue-len").textContent).toBe("3");
  });

  it("updates artwork without resetting the queue order", () => {
    function ArtworkProbe() {
      const { tracks } = useGingerPlayback();
      return <span data-testid="art">{tracks[1]?.artworkUrl ?? ""}</span>;
    }

    const { rerender } = render(
      <Ginger.Provider initialTracks={[trackA]}>
        <Ginger.Tracks merge="append">
          <Ginger.Tracks.Track id="b" title="Song B" src="https://example.com/b.mp3" />
        </Ginger.Tracks>
        <ArtworkProbe />
        <QueueProbe />
      </Ginger.Provider>,
    );
    expect(screen.getByTestId("art").textContent).toBe("");

    rerender(
      <Ginger.Provider initialTracks={[trackA]}>
        <Ginger.Tracks merge="append">
          <Ginger.Tracks.Track
            id="b"
            title="Song B"
            src="https://example.com/b.mp3"
            artworkUrl="https://example.com/b.jpg"
          />
        </Ginger.Tracks>
        <ArtworkProbe />
        <QueueProbe />
      </Ginger.Provider>,
    );
    expect(screen.getByTestId("art").textContent).toBe("https://example.com/b.jpg");
    expect(screen.getByTestId("queue-len").textContent).toBe("2");
  });
});
