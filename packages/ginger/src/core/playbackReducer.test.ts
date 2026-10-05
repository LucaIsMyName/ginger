import { describe, expect, it, vi } from "vitest";
import type { Track } from "../types";
import { createInitialState, gingerReducer } from "./playbackReducer";
import { findIndexByTrackIdentity, trackIdentity } from "./queue";

const tracks: Track[] = [
  { id: "one", title: "One", fileUrl: "/one.mp3" },
  { id: "two", title: "Two", fileUrl: "/two.mp3" },
  { id: "three", title: "Three", fileUrl: "/three.mp3" },
];

describe("gingerReducer queue behavior", () => {
  it("resets shuffle metadata when replacing the queue", () => {
    const initial = createInitialState({
      tracks,
      currentIndex: 1,
      isShuffled: true,
    });

    const nextQueue: Track[] = [{ id: "fresh", title: "Fresh", fileUrl: "/fresh.mp3" }];
    const next = gingerReducer(initial, {
      type: "SET_QUEUE",
      payload: { tracks: nextQueue },
    });

    expect(next.tracks).toEqual(nextQueue);
    expect(next.isShuffled).toBe(false);
    expect(next.originalTracks).toBeNull();
  });

  it("restores the active track by stable id when disabling shuffle", () => {
    const duplicateUrls: Track[] = [
      { id: "intro", title: "Intro", fileUrl: "/same.mp3" },
      { id: "feature", title: "Feature", fileUrl: "/same.mp3" },
      { id: "outro", title: "Outro", fileUrl: "/other.mp3" },
    ];

    const shuffledState = {
      ...createInitialState({ tracks: duplicateUrls }),
      tracks: [duplicateUrls[1]!, duplicateUrls[2]!, duplicateUrls[0]!],
      currentIndex: 0,
      isShuffled: true,
      originalTracks: duplicateUrls,
    };

    const next = gingerReducer(shuffledState, { type: "TOGGLE_SHUFFLE" });

    expect(next.isShuffled).toBe(false);
    expect(next.currentIndex).toBe(1);
    expect(next.tracks[next.currentIndex]?.id).toBe("feature");
  });
});

describe("NEXT and PREV at boundaries", () => {
  it("NEXT at last track with repeat off keeps index and timing when same", () => {
    const state = createInitialState({
      tracks,
      currentIndex: 2,
      repeatMode: "off",
      isPaused: false,
    });
    const next = gingerReducer(state, { type: "NEXT" });
    expect(next.currentIndex).toBe(2);
    expect(next.isPaused).toBe(false);
  });

  it("NEXT at last track with repeat all wraps to 0", () => {
    const state = createInitialState({
      tracks,
      currentIndex: 2,
      repeatMode: "all",
    });
    const next = gingerReducer(state, { type: "NEXT" });
    expect(next.currentIndex).toBe(0);
    expect(next.isPaused).toBe(false);
  });

  it("PREV at first track with repeat off stays at 0", () => {
    const state = createInitialState({ tracks, currentIndex: 0, repeatMode: "off" });
    const next = gingerReducer(state, { type: "PREV" });
    expect(next.currentIndex).toBe(0);
  });

  it("PREV at first track with repeat all jumps to last", () => {
    const state = createInitialState({ tracks, currentIndex: 0, repeatMode: "all" });
    const next = gingerReducer(state, { type: "PREV" });
    expect(next.currentIndex).toBe(2);
  });
});

describe("SET_PLAYBACK_MODE and MEDIA_SOURCE_CLEARED", () => {
  it("updates playbackMode without resetting queue", () => {
    const s0 = createInitialState({ tracks, currentIndex: 0, playbackMode: "playlist" });
    const s1 = gingerReducer(s0, { type: "SET_PLAYBACK_MODE", payload: "single" });
    expect(s1.playbackMode).toBe("single");
    expect(s1.tracks).toEqual(s0.tracks);
  });

  it("MEDIA_SOURCE_CLEARED resets timing and error like a fresh load", () => {
    const s0 = {
      ...createInitialState({ tracks, currentIndex: 0 }),
      currentTime: 12,
      duration: 120,
      bufferedFraction: 0.4,
      errorMessage: "MEDIA_ERR_NETWORK" as const,
      isBuffering: true,
    };
    const s1 = gingerReducer(s0, { type: "MEDIA_SOURCE_CLEARED" });
    expect(s1.currentTime).toBe(0);
    expect(s1.duration).toBe(0);
    expect(s1.bufferedFraction).toBe(0);
    expect(s1.errorMessage).toBeNull();
    expect(s1.isBuffering).toBe(false);
  });
});

describe("INIT", () => {
  it("replaces state like createInitialState", () => {
    const s0 = createInitialState({ tracks, currentIndex: 1 });
    const s1 = gingerReducer(s0, {
      type: "INIT",
      payload: {
        tracks: [{ id: "x", title: "X", fileUrl: "/x.mp3" }],
        currentIndex: 0,
        isPaused: true,
      },
    });
    expect(s1.tracks).toEqual([{ id: "x", title: "X", fileUrl: "/x.mp3" }]);
    expect(s1.currentIndex).toBe(0);
    expect(s1.isShuffled).toBe(false);
  });
});

describe("track identity helpers", () => {
  it("prefers explicit ids over file URLs", () => {
    expect(trackIdentity({ id: "abc", title: "Track", fileUrl: "/same.mp3" })).toBe("id:abc");
  });

  it("falls back to fileUrl when no id is available", () => {
    const duplicateUrls: Track[] = [
      { title: "First", fileUrl: "/same.mp3" },
      { title: "Second", fileUrl: "/same.mp3" },
    ];

    expect(trackIdentity(duplicateUrls[0])).toBe("file:/same.mp3");
    expect(findIndexByTrackIdentity(duplicateUrls, duplicateUrls[1])).toBe(1);
  });

  it("resolves duplicate fileUrl rows by object reference when unshuffling", () => {
    const duplicateUrls: Track[] = [
      { title: "First", fileUrl: "/same.mp3" },
      { title: "Second", fileUrl: "/same.mp3" },
    ];
    expect(findIndexByTrackIdentity(duplicateUrls, duplicateUrls[0])).toBe(0);
  });

  it("returns -1 when the track is not in the queue", () => {
    expect(
      findIndexByTrackIdentity(tracks, { id: "missing", title: "No", fileUrl: "/no.mp3" }),
    ).toBe(-1);
    expect(findIndexByTrackIdentity(tracks, null)).toBe(-1);
  });

  it("warns once when identity is ambiguous (no reference match, duplicate fileUrl)", () => {
    const duplicateUrls: Track[] = [
      { title: "First", fileUrl: "/same.mp3" },
      { title: "Second", fileUrl: "/same.mp3" },
    ];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(
        findIndexByTrackIdentity(duplicateUrls, { title: "Clone", fileUrl: "/same.mp3" }),
      ).toBe(0);
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe("queue mutation actions", () => {
  it("insert track before current index shifts current index", () => {
    const state = createInitialState({
      tracks,
      currentIndex: 1,
    });
    const next = gingerReducer(state, {
      type: "INSERT_TRACK",
      payload: { index: 0, track: { id: "x", title: "X", fileUrl: "/x.mp3" } },
    });
    expect(next.currentIndex).toBe(2);
    expect(next.tracks[0]?.id).toBe("x");
  });

  it("mirrors a shuffled insert beside the neighboring canonical track", () => {
    const shuffled = gingerReducer(createInitialState({ tracks, currentIndex: 0 }), {
      type: "TOGGLE_SHUFFLE",
    });
    const inserted = gingerReducer(shuffled, {
      type: "INSERT_TRACK",
      payload: { index: 1, track: { id: "x", title: "X", fileUrl: "/x.mp3" } },
    });
    const restored = gingerReducer(inserted, { type: "TOGGLE_SHUFFLE" });
    const ids = restored.tracks.map((track) => track.id);
    const insertedAt = ids.indexOf("x");
    const neighbor = shuffled.tracks[1];
    const neighborAt = ids.indexOf(neighbor?.id);
    expect(insertedAt).toBeGreaterThanOrEqual(0);
    expect(neighborAt).toBe(insertedAt + 1);
  });

  it("does not drop the first canonical track when a removed row cannot be identified", () => {
    const state = {
      ...createInitialState({ tracks, currentIndex: 0 }),
      isShuffled: true,
      originalTracks: [{ id: "canon", title: "Canon", fileUrl: "/canon.mp3" }],
    };
    const next = gingerReducer(state, { type: "REMOVE_TRACK", payload: { index: 0 } });
    expect(next.originalTracks?.[0]?.id).toBe("canon");
  });

  it("keeps buffering through a time update until canplay", () => {
    const waiting = gingerReducer(createInitialState({ tracks, currentIndex: 0 }), {
      type: "MEDIA_WAITING",
    });
    const ticked = gingerReducer(waiting, {
      type: "MEDIA_TIME_UPDATE",
      payload: { currentTime: 1, duration: 10, bufferedFraction: 0.2 },
    });
    expect(ticked.isBuffering).toBe(true);
    expect(ticked.currentTime).toBe(1);
    const ready = gingerReducer(ticked, { type: "MEDIA_CANPLAY" });
    expect(ready.isBuffering).toBe(false);
  });

  it("restores currentTime from INIT", () => {
    const next = gingerReducer(createInitialState({ tracks, currentIndex: 0 }), {
      type: "INIT",
      payload: { tracks, currentIndex: 1, currentTime: 12.5 },
    });
    expect(next.currentIndex).toBe(1);
    expect(next.currentTime).toBe(12.5);
  });

  it("remove active track resets timing and clamps index", () => {
    const state = {
      ...createInitialState({
        tracks,
        currentIndex: 2,
      }),
      currentTime: 42,
    };
    const next = gingerReducer(state, {
      type: "REMOVE_TRACK",
      payload: { index: 2 },
    });
    expect(next.currentIndex).toBe(1);
    expect(next.currentTime).toBe(0);
  });

  it("move track keeps active track identity when moved", () => {
    const state = createInitialState({
      tracks,
      currentIndex: 2,
    });
    const next = gingerReducer(state, {
      type: "MOVE_TRACK",
      payload: { fromIndex: 2, toIndex: 0 },
    });
    expect(next.currentIndex).toBe(0);
    expect(next.tracks[0]?.id).toBe("three");
  });

  it("TOGGLE_PAUSE clears error when resuming", () => {
    const state = {
      ...createInitialState({ tracks, currentIndex: 0 }),
      isPaused: true,
      errorMessage: "blocked",
    };
    const next = gingerReducer(state, { type: "TOGGLE_PAUSE" });
    expect(next.isPaused).toBe(false);
    expect(next.errorMessage).toBeNull();
  });

  it("add-next inserts immediately after current track", () => {
    const state = createInitialState({
      tracks,
      currentIndex: 0,
    });
    const next = gingerReducer(state, {
      type: "ADD_NEXT",
      payload: { track: { id: "x", title: "X", fileUrl: "/x.mp3" } },
    });
    expect(next.tracks[1]?.id).toBe("x");
  });

  it("PLAY clears errorMessage while unpausing", () => {
    const state = {
      ...createInitialState({ tracks }),
      errorMessage: "MEDIA_ERR_NETWORK",
      isPaused: true,
    };
    const next = gingerReducer(state, { type: "PLAY" });
    expect(next.isPaused).toBe(false);
    expect(next.errorMessage).toBeNull();
  });
});
