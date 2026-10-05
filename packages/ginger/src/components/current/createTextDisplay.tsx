import type { ReactElement, ReactNode } from "react";
import { useGingerMetadataState } from "../../context/GingerSplitContexts";
import { getCurrentTrack } from "../../internal/selectors";
import type { DisplayBaseProps, GingerState, Track } from "../../types";

export type TextDisplayProps = DisplayBaseProps & {
  children?: (value: string, state: GingerState) => ReactNode;
};

export function createTextDisplay(
  displayName: string,
  select: (state: GingerState) => string | undefined,
): (props: TextDisplayProps) => ReactElement | null {
  function Comp(props: TextDisplayProps) {
    const state = useGingerMetadataState();
    const raw = select(state) ?? "";
    const value = raw.trim();
    const { className, style, fallback, empty, children } = props;
    if (!value) {
      const node = empty ?? fallback ?? null;
      return node ? (
        <span className={className} style={style}>
          {node}
        </span>
      ) : null;
    }
    if (children)
      return (
        <span className={className} style={style}>
          {children(value, state)}
        </span>
      );
    return (
      <span className={className} style={style}>
        {value}
      </span>
    );
  }
  Comp.displayName = displayName;
  return Comp;
}

export function createTrackFieldDisplay(
  displayName: string,
  select: (track: Track | null) => string | undefined,
): (props: TextDisplayProps) => ReactElement | null {
  return createTextDisplay(displayName, (state) => select(getCurrentTrack(state)));
}
