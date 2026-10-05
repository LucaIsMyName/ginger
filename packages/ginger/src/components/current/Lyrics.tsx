import type { CSSProperties, ReactNode } from "react";
import { useGingerMetadataState } from "../../context/GingerSplitContexts";
import { getCurrentTrack } from "../../internal/selectors";
import type { DisplayBaseProps, GingerState } from "../../types";

export type LyricsProps = DisplayBaseProps & {
  children?: (value: string, state: GingerState) => ReactNode;
  /** When true, preserves internal newlines; trims only leading/trailing whitespace */
  preserveWhitespace?: boolean;
  /** When true, skips default `whiteSpace: pre-wrap` when `preserveWhitespace` is true (use `className` / `style` instead). */
  unstyled?: boolean;
};

export function Lyrics({
  className,
  style,
  fallback,
  empty,
  children,
  preserveWhitespace = true,
  unstyled = false,
}: LyricsProps) {
  const state = useGingerMetadataState();
  const raw = getCurrentTrack(state)?.lyrics ?? "";
  const value = preserveWhitespace ? raw.replace(/^\s+|\s+$/g, "") : raw.trim();
  if (!value) {
    const node = empty ?? fallback ?? null;
    return node ? (
      <span data-ginger-component="Lyrics" className={className} style={style}>
        {node}
      </span>
    ) : null;
  }
  const whiteStyle: CSSProperties | undefined =
    !unstyled && preserveWhitespace ? { whiteSpace: "pre-wrap" } : undefined;
  if (children)
    return (
      <span className={className} style={{ ...whiteStyle, ...style }}>
        {children(value, state)}
      </span>
    );
  return (
    <span className={className} style={{ ...whiteStyle, ...style }}>
      {value}
    </span>
  );
}

Lyrics.displayName = "Ginger.Current.Lyrics";
