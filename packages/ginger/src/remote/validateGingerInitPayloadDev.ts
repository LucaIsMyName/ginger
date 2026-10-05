import type { GingerInitPayload } from "../types";

const repeatOk = (v: unknown): v is "off" | "all" | "one" =>
  v === "off" || v === "all" || v === "one";

const playbackModeOk = (v: unknown): v is "playlist" | "single" =>
  v === "playlist" || v === "single";

/**
 * Structural check for remote `STATE_SNAPSHOT` payloads. Used in development to catch
 * malformed cross-tab messages; production callers still rely on same-origin `BroadcastChannel`.
 */
export function validateGingerInitPayloadDev(snapshot: unknown): snapshot is GingerInitPayload {
  if (!snapshot || typeof snapshot !== "object") return false;
  const s = snapshot as Record<string, unknown>;
  if (!Array.isArray(s.tracks)) return false;
  for (const t of s.tracks) {
    if (!t || typeof t !== "object") return false;
    const tr = t as Record<string, unknown>;
    if (typeof tr.title !== "string" || typeof tr.fileUrl !== "string") return false;
  }
  if (s.currentIndex !== undefined && typeof s.currentIndex !== "number") return false;
  if (s.isPaused !== undefined && typeof s.isPaused !== "boolean") return false;
  if (s.isShuffled !== undefined && typeof s.isShuffled !== "boolean") return false;
  if (s.repeatMode !== undefined && !repeatOk(s.repeatMode)) return false;
  if (s.playbackMode !== undefined && !playbackModeOk(s.playbackMode)) return false;
  if (s.volume !== undefined && typeof s.volume !== "number") return false;
  if (s.muted !== undefined && typeof s.muted !== "boolean") return false;
  if (s.playbackRate !== undefined && typeof s.playbackRate !== "number") return false;
  if (s.currentTime !== undefined && typeof s.currentTime !== "number") return false;
  if (
    s.playlistMeta !== undefined &&
    s.playlistMeta !== null &&
    typeof s.playlistMeta !== "object"
  ) {
    return false;
  }
  return true;
}
