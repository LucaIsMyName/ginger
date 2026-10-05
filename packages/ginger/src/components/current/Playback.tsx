import type { ReactNode } from "react";
import { useGingerClockState } from "../../context/GingerSplitContexts";
import { derivePlaybackUiState } from "../../internal/selectors";
import type { DisplayBaseProps, GingerState, PlaybackUiState } from "../../types";

export type PlaybackStateProps = DisplayBaseProps & {
  children?: (value: PlaybackUiState, state: GingerState) => ReactNode;
};

export function PlaybackState({
  className,
  style,
  fallback: _fallback,
  empty: _empty,
  children,
}: PlaybackStateProps) {
  const state = useGingerClockState();
  const value = derivePlaybackUiState(state);
  if (children)
    return (
      <span data-ginger-component="PlaybackState" className={className} style={style}>
        {children(value, state)}
      </span>
    );
  return (
    <span data-ginger-component="PlaybackState" className={className} style={style}>
      {value}
    </span>
  );
}

PlaybackState.displayName = "Ginger.Current.PlaybackState";

export type ErrorMessageProps = DisplayBaseProps & {
  live?: "polite" | "assertive" | "off";
  children?: (value: string, state: GingerState) => ReactNode;
};

export function ErrorMessage({
  className,
  style,
  fallback,
  empty,
  live = "polite",
  children,
}: ErrorMessageProps) {
  const state = useGingerClockState();
  const value = state.errorMessage ?? "";
  if (!value) {
    const node = empty ?? fallback ?? null;
    return node ? (
      <span data-ginger-component="ErrorMessage" className={className} style={style}>
        {node}
      </span>
    ) : null;
  }
  if (children) {
    return (
      <span
        data-ginger-component="ErrorMessage"
        className={className}
        style={style}
        aria-live={live}
      >
        {children(value, state)}
      </span>
    );
  }
  return (
    <span data-ginger-component="ErrorMessage" className={className} style={style} aria-live={live}>
      {value}
    </span>
  );
}

ErrorMessage.displayName = "Ginger.Current.ErrorMessage";
