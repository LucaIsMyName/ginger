import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Ginger } from "../ginger";
import type { Track } from "../types";
import { useGingerCast } from "./useGingerCast";

const tracks: Track[] = [{ id: "a", title: "A", fileUrl: "/a.mp3" }];

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Ginger.Provider initialTracks={tracks}>
      <Ginger.Player />
      {children}
    </Ginger.Provider>
  );
}

describe("useGingerCast", () => {
  it("returns idle state when disabled without loading Cast framework", () => {
    const { result } = renderHook(() => useGingerCast({ enabled: false }), {
      wrapper: Wrapper,
    });
    expect(result.current.isAvailable).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isCasting).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
