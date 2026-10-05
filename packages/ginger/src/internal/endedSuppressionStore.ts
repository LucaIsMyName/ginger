/**
 * Per–GingerProvider store for crossfade ended suppression.
 * Each provider instance owns its own store so multiple players on one page do not interfere.
 */

export type EndedSuppressionStore = {
  beginEndedSuppression: (element: HTMLAudioElement) => () => void;
  clearEndedSuppression: () => void;
  shouldIgnoreEnded: (element: HTMLAudioElement) => boolean;
};

export function createEndedSuppressionStore(): EndedSuppressionStore {
  let depth = 0;
  let ignoreElement: HTMLAudioElement | null = null;
  let ignoreSrc = "";

  function beginEndedSuppression(element: HTMLAudioElement): () => void {
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

  function clearEndedSuppression(): void {
    depth = 0;
    ignoreElement = null;
    ignoreSrc = "";
  }

  function shouldIgnoreEnded(element: HTMLAudioElement): boolean {
    if (ignoreElement !== element) return false;
    if (depth > 0) return true;
    const src = element.currentSrc || element.getAttribute("src") || "";
    if (ignoreSrc && src === ignoreSrc) return true;
    ignoreElement = null;
    ignoreSrc = "";
    return false;
  }

  return {
    beginEndedSuppression,
    clearEndedSuppression,
    shouldIgnoreEnded,
  };
}
