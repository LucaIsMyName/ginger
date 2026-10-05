/**
 * Crossfade owns the transition that would otherwise be started by `<audio onEnded>`.
 * While a fade is active, and until the outgoing element’s src actually changes,
 * `GingerPlayer` ignores the natural ended event so the queue advances once.
 */

let depth = 0;
let ignoreElement: HTMLAudioElement | null = null;
let ignoreSrc = "";

export function beginEndedSuppression(element: HTMLAudioElement): () => void {
  depth += 1;
  ignoreElement = element;
  ignoreSrc = element.currentSrc || element.getAttribute("src") || "";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    depth = Math.max(0, depth - 1);
  };
}

/** Drop suppression immediately (user skip / pause / unmount). */
export function clearEndedSuppression(): void {
  depth = 0;
  ignoreElement = null;
  ignoreSrc = "";
}

export function shouldIgnoreEnded(element: HTMLAudioElement): boolean {
  if (ignoreElement !== element) return false;
  if (depth > 0) return true;
  const src = element.currentSrc || element.getAttribute("src") || "";
  if (ignoreSrc && src === ignoreSrc) return true;
  ignoreElement = null;
  ignoreSrc = "";
  return false;
}
