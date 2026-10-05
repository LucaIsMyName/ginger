import { type HTMLAttributes, type ReactNode, useLayoutEffect, useRef } from "react";
import { useGingerPlayback } from "../../context/GingerSplitContexts";
import { trackIdentity } from "../../core/queue";
import type { Track } from "../../types";
import { useGingerDeclarativeMerge } from "./GingerDeclarativeMergeContext";
import { GingerTracksRegistryProvider } from "./GingerTracksRegistryContext";
import type { GingerTracksRegistry } from "./GingerTracksRegistryContext";
import {
  type GingerTracksMergeMode,
  mergeDeclarativeQueue,
  tracksQueueShallowEqual,
} from "./mergeDeclarativeQueue";

export type GingerTracksProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children?: ReactNode;
  /**
   * How to combine declarative `Ginger.Track` entries with `initialTracks` from `Ginger.Provider`.
   * - `append` (default): `[...initialTracks, ...declarative]`
   * - `prepend`: `[...declarative, ...initialTracks]`
   * - `replace`: declarative tracks only (`initialTracks` ignored for this subtree’s sync)
   */
  merge?: GingerTracksMergeMode;
};

function trackSyncSignature(track: Track | undefined): string {
  return track ? JSON.stringify(track) : "";
}

function GingerTracksSync({
  merge,
  registry,
}: {
  merge: GingerTracksMergeMode;
  registry: GingerTracksRegistry;
}) {
  const { dispatch, tracks, currentIndex } = useGingerPlayback();
  const mergeCtx = useGingerDeclarativeMerge();
  const tracksRef = useRef(tracks);
  const indexRef = useRef(currentIndex);
  tracksRef.current = tracks;
  indexRef.current = currentIndex;
  const appliedIdentityRef = useRef<string | null>(null);

  const declarativeSig = registry.order
    .map((id) => trackSyncSignature(registry.slots.get(id)))
    .join("|");

  const initialSnapshot = mergeCtx?.getInitialTracksSnapshot() ?? [];
  const initialSig = initialSnapshot.map((t) => trackSyncSignature(t)).join("|");

  // biome-ignore lint/correctness/useExhaustiveDependencies: declarativeSig/initialSig drive re-sync when JSX or provider initialTracks change; registry ref identity is stable while its contents mutate. Reducer queue edits must not re-enter this effect.
  useLayoutEffect(() => {
    const initial = mergeCtx?.getInitialTracksSnapshot() ?? [];
    const declarative: Track[] = registry.order
      .map((id) => registry.slots.get(id))
      .filter((t): t is Track => t != null);
    const merged = mergeDeclarativeQueue(merge, initial, declarative);
    const identity = merged.map((track) => trackIdentity(track)).join("|");
    const current = tracksRef.current;
    if (tracksQueueShallowEqual(merged, current)) {
      appliedIdentityRef.current = identity;
      return;
    }
    if (appliedIdentityRef.current === identity) {
      dispatch({ type: "UPDATE_TRACK_DETAILS", payload: { tracks: merged } });
      return;
    }
    appliedIdentityRef.current = identity;
    const idx = Math.min(indexRef.current, Math.max(0, merged.length - 1));
    dispatch({ type: "SET_QUEUE", payload: { tracks: merged, currentIndex: idx } });
  }, [merge, declarativeSig, initialSig, mergeCtx, dispatch, registry]);

  return null;
}

/**
 * Declarative queue definition via `Ginger.Track` children. Coexists with `initialTracks` on the
 * provider and imperative APIs; see `merge` for combination rules.
 */
export function GingerTracks({
  children,
  merge = "append",
  style,
  hidden: _hidden,
  ...rest
}: GingerTracksProps) {
  const registryRef = useRef<GingerTracksRegistry | null>(null);
  if (!registryRef.current) {
    registryRef.current = { slots: new Map(), order: [] };
  }
  const registry = registryRef.current;
  registry.slots.clear();
  registry.order.length = 0;

  return (
    <GingerTracksRegistryProvider value={registry}>
      <div data-ginger-component="Tracks" style={{ display: "contents", ...style }} {...rest}>
        {children}
      </div>
      <GingerTracksSync merge={merge} registry={registry} />
    </GingerTracksRegistryProvider>
  );
}

GingerTracks.displayName = "Ginger.Tracks";
