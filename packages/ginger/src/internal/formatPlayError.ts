/** Stable, parseable media error strings for retry and UI. */
export function formatPlayRejectionError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return `NotAllowedError: ${error.message || "play() rejected by browser policy"}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Playback failed (e.g. autoplay blocked or unavailable source)";
}

export function isNotAllowedPlayError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}
