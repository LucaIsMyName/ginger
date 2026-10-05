/**
 * One MediaElementAudioSourceNode per HTMLAudioElement. The context is kept for the
 * lifetime of that element: closing it would leave the element silent, because the
 * browser will not create a second MediaElementAudioSourceNode.
 *
 * Named processing slots (`eq`, `spatial`, `user`) are concatenated in that order.
 * An optional crossfade gain sits after the chain. Analyser consumers tap the tail.
 */

export type LiveAnalyserOptions = {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
};

/** Fixed slot order. Earlier slots are closer to the media element source. */
export const PROCESSING_SLOT_ORDER = ["eq", "spatial", "user"] as const;

export type ProcessingSlot = (typeof PROCESSING_SLOT_ORDER)[number];

type Consumer = {
  analyser: AnalyserNode;
};

type CrossfadeNodes = {
  outGain: GainNode;
  inGain: GainNode;
  inSource: MediaElementAudioSourceNode;
};

type ElementEntry = {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  consumers: Map<number, Consumer>;
  nextId: number;
  slots: Record<ProcessingSlot, AudioNode[]>;
  crossfade: CrossfadeNodes | null;
};

const entries = new WeakMap<HTMLAudioElement, ElementEntry>();

function clampFftSize(n: number): number {
  const p = 2 ** Math.round(Math.log2(n));
  return Math.min(32768, Math.max(32, p));
}

function emptySlots(): Record<ProcessingSlot, AudioNode[]> {
  return { eq: [], spatial: [], user: [] };
}

function activeChain(entry: ElementEntry): AudioNode[] {
  const nodes: AudioNode[] = [];
  for (const slot of PROCESSING_SLOT_ORDER) {
    nodes.push(...entry.slots[slot]);
  }
  return nodes;
}

function disconnectNode(node: AudioNode): void {
  try {
    node.disconnect();
  } catch {
    // ignore
  }
}

/**
 * Rebuild all graph connections from scratch.
 * Call after any structural change (add/remove consumer, change a processing slot, crossfade).
 */
function rebuildGraph(entry: ElementEntry): void {
  const { source, consumers, context, crossfade } = entry;
  const chain = activeChain(entry);

  disconnectNode(source);
  for (const node of chain) disconnectNode(node);
  if (crossfade) disconnectNode(crossfade.outGain);

  for (const { analyser } of consumers.values()) {
    try {
      analyser.disconnect(context.destination);
    } catch {
      // ignore
    }
  }

  if (chain.length > 0) {
    source.connect(chain[0]!);
    for (let i = 0; i < chain.length - 1; i++) {
      chain[i]!.connect(chain[i + 1]!);
    }
  }

  const tail: AudioNode = chain.length > 0 ? chain[chain.length - 1]! : source;
  const output: AudioNode = crossfade ? crossfade.outGain : tail;
  if (crossfade) tail.connect(crossfade.outGain);

  if (consumers.size === 0) {
    output.connect(context.destination);
  } else {
    let isFirst = true;
    for (const { analyser } of consumers.values()) {
      output.connect(analyser);
      if (isFirst) {
        analyser.connect(context.destination);
        isFirst = false;
      }
    }
  }
}

function getAudioContextConstructor():
  | (new (
      options?: AudioContextOptions,
    ) => AudioContext)
  | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

function getOrCreateEntry(element: HTMLAudioElement): ElementEntry {
  let entry = entries.get(element);
  if (!entry) {
    const Context = getAudioContextConstructor();
    if (!Context) {
      throw new Error("Web Audio API is not available");
    }
    const context = new Context();
    const source = context.createMediaElementSource(element);
    entry = {
      context,
      source,
      consumers: new Map(),
      nextId: 0,
      slots: emptySlots(),
      crossfade: null,
    };
    entries.set(element, entry);
    rebuildGraph(entry);
  }
  return entry;
}

export function attachLiveAnalyser(
  element: HTMLAudioElement,
  options: LiveAnalyserOptions,
): { id: number; context: AudioContext; analyser: AnalyserNode } {
  const entry = getOrCreateEntry(element);
  const { context } = entry;

  const analyser = context.createAnalyser();
  analyser.fftSize = clampFftSize(options.fftSize);
  analyser.smoothingTimeConstant = options.smoothingTimeConstant;
  analyser.minDecibels = options.minDecibels;
  analyser.maxDecibels = options.maxDecibels;

  const id = entry.nextId;
  entry.nextId += 1;
  entry.consumers.set(id, { analyser });

  rebuildGraph(entry);

  return { id, context, analyser };
}

export function detachLiveAnalyser(element: HTMLAudioElement, id: number): void {
  const entry = entries.get(element);
  if (!entry) return;

  const consumer = entry.consumers.get(id);
  if (!consumer) return;

  disconnectNode(consumer.analyser);
  entry.consumers.delete(id);
  rebuildGraph(entry);
}

/**
 * Replace one named processing slot. Other slots stay in place and are reconnected
 * in `eq` → `spatial` → `user` order. Pass an empty array to clear the slot.
 *
 * The AudioContext is not closed. Once a media element is captured, routing falls
 * back to source → destination so playback stays audible.
 */
export function setProcessingSlot(
  element: HTMLAudioElement,
  slot: ProcessingSlot,
  nodes: AudioNode[],
): void {
  if (typeof window === "undefined") return;

  if (nodes.length === 0) {
    const entry = entries.get(element);
    if (!entry) return;
    entry.slots[slot] = [];
    rebuildGraph(entry);
    return;
  }

  const entry = getOrCreateEntry(element);
  entry.slots[slot] = nodes;
  rebuildGraph(entry);
}

/**
 * Replace the `user` slot. Does not clear `eq` or `spatial`.
 * Pass an empty array to remove only the user slot.
 */
export function setProcessingChain(element: HTMLAudioElement, nodes: AudioNode[]): void {
  setProcessingSlot(element, "user", nodes);
}

export type ElementCrossfadeHandle = {
  context: AudioContext;
  outGain: GainNode;
  inGain: GainNode;
  outSource: MediaElementAudioSourceNode;
  inSource: MediaElementAudioSourceNode;
};

/**
 * Route `main` (already captured, or captured now) and `incoming` through gain nodes
 * in the element's long-lived AudioContext. Does not close that context.
 */
export function beginElementCrossfade(
  main: HTMLAudioElement,
  incoming: HTMLAudioElement,
): ElementCrossfadeHandle {
  const entry = getOrCreateEntry(main);
  if (entry.crossfade) endElementCrossfade(main);

  const { context } = entry;
  const inSource = context.createMediaElementSource(incoming);
  const outGain = context.createGain();
  const inGain = context.createGain();
  outGain.gain.value = 1;
  inGain.gain.value = 0;

  entry.crossfade = { outGain, inGain, inSource };
  rebuildGraph(entry);
  inSource.connect(inGain);
  inGain.connect(context.destination);

  return {
    context,
    outGain,
    inGain,
    outSource: entry.source,
    inSource,
  };
}

/** Disconnect the incoming element and restore the main element's normal route. */
export function endElementCrossfade(main: HTMLAudioElement): void {
  const entry = entries.get(main);
  if (!entry?.crossfade) return;
  const { outGain, inGain, inSource } = entry.crossfade;
  disconnectNode(inSource);
  disconnectNode(inGain);
  disconnectNode(outGain);
  entry.crossfade = null;
  rebuildGraph(entry);
}
