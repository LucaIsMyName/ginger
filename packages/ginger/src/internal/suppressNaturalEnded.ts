/**
 * Crossfade owns the transition that would otherwise be started by `<audio onEnded>`.
 * Implementation lives in {@link createEndedSuppressionStore}; each `Ginger.Provider` mounts its own store.
 */

export {
  createEndedSuppressionStore,
  type EndedSuppressionStore,
} from "./endedSuppressionStore";
