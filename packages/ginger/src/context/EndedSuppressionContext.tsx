import { type ReactNode, createContext, useContext, useRef } from "react";
import {
  type EndedSuppressionStore,
  createEndedSuppressionStore,
} from "../internal/endedSuppressionStore";

const EndedSuppressionContext = createContext<EndedSuppressionStore | null>(null);

export function EndedSuppressionProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<EndedSuppressionStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createEndedSuppressionStore();
  }
  return (
    <EndedSuppressionContext.Provider value={storeRef.current}>
      {children}
    </EndedSuppressionContext.Provider>
  );
}

export function useEndedSuppressionStore(): EndedSuppressionStore {
  const store = useContext(EndedSuppressionContext);
  if (!store) {
    throw new Error(
      "useEndedSuppressionStore must be used within Ginger.Provider (EndedSuppressionProvider).",
    );
  }
  return store;
}

/** Returns null outside Ginger.Provider (e.g. some test setups). */
export function useOptionalEndedSuppressionStore(): EndedSuppressionStore | null {
  return useContext(EndedSuppressionContext);
}
