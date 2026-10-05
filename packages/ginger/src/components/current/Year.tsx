import { useGingerMetadataState } from "../../context/GingerSplitContexts";
import { getCurrentTrack } from "../../internal/selectors";
import type { TextDisplayProps } from "./createTextDisplay";

export type YearProps = TextDisplayProps & {
  format?: (year: number) => string;
};

export function Year({ className, style, fallback, empty, children, format }: YearProps) {
  const state = useGingerMetadataState();
  const y = getCurrentTrack(state)?.year;
  if (typeof y !== "number" || !Number.isFinite(y)) {
    const node = empty ?? fallback ?? null;
    return node ? (
      <span data-ginger-component="Year" className={className} style={style}>
        {node}
      </span>
    ) : null;
  }
  const text = format ? format(y) : String(y);
  if (children)
    return (
      <span data-ginger-component="Year" className={className} style={style}>
        {children(text, state)}
      </span>
    );
  return (
    <span data-ginger-component="Year" className={className} style={style}>
      {text}
    </span>
  );
}

Year.displayName = "Ginger.Current.Year";
