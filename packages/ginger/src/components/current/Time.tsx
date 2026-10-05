import type { ReactElement, ReactNode } from "react";
import { useGingerClockState } from "../../context/GingerSplitContexts";
import { formatMmSs } from "../../internal/formatTime";
import { effectiveDuration, effectiveRemaining, progressFraction } from "../../internal/selectors";
import type { DisplayBaseProps, GingerState } from "../../types";

export type TimeTextProps = DisplayBaseProps & {
  format?: (seconds: number) => string;
  children?: (value: string, state: GingerState) => ReactNode;
};

function renderTime(
  valueSeconds: number,
  state: GingerState,
  props: TimeTextProps,
): ReactElement | null {
  const { className, style, fallback, empty, children, format = formatMmSs } = props;
  if (!(valueSeconds >= 0) || !Number.isFinite(valueSeconds)) {
    const node = empty ?? fallback ?? null;
    return node ? (
      <span data-ginger-component="TimeText" className={className} style={style}>
        {node}
      </span>
    ) : null;
  }
  const text = format(valueSeconds);
  if (children)
    return (
      <span data-ginger-component="TimeText" className={className} style={style}>
        {children(text, state)}
      </span>
    );
  return (
    <span data-ginger-component="TimeText" className={className} style={style}>
      {text}
    </span>
  );
}

export function Elapsed(props: TimeTextProps) {
  const state = useGingerClockState();
  return renderTime(state.currentTime, state, props);
}

Elapsed.displayName = "Ginger.Current.Elapsed";

export function Duration(props: TimeTextProps) {
  const state = useGingerClockState();
  return renderTime(effectiveDuration(state), state, props);
}

Duration.displayName = "Ginger.Current.Duration";

export function Remaining(props: TimeTextProps) {
  const state = useGingerClockState();
  return renderTime(effectiveRemaining(state), state, props);
}

Remaining.displayName = "Ginger.Current.Remaining";

export type ProgressProps = DisplayBaseProps & {
  children?: (
    value: { fraction: number; currentTime: number; duration: number },
    state: GingerState,
  ) => ReactNode;
};

export function Progress({ className, style, fallback, empty, children }: ProgressProps) {
  const state = useGingerClockState();
  const duration = effectiveDuration(state);
  const fraction = progressFraction(state);
  if (!(duration > 0)) {
    const node = empty ?? fallback ?? null;
    return node ? (
      <span data-ginger-component="Progress" className={className} style={style}>
        {node}
      </span>
    ) : null;
  }
  if (children)
    return (
      <span data-ginger-component="Progress" className={className} style={style}>
        {children({ fraction, currentTime: state.currentTime, duration }, state)}
      </span>
    );
  return (
    <span data-ginger-component="Progress" className={className} style={style}>
      {`${Math.round(fraction * 100)}%`}
    </span>
  );
}

Progress.displayName = "Ginger.Current.Progress";

export type TimeRailProps = DisplayBaseProps & {
  /** 0-1 height in px for the rail */
  height?: number;
  /** When true, shows a buffered range behind the progress fill (uses `bufferedFraction`). */
  showBuffered?: boolean;
  /** Remove default rail styles and render only inline width values. */
  unstyled?: boolean;
};

export function TimeRail({
  className,
  style,
  height = 4,
  showBuffered = false,
  unstyled = false,
}: TimeRailProps) {
  const state = useGingerClockState();
  const progressPct = `${Math.round(progressFraction(state) * 100)}%`;
  const bufPct = `${Math.round(Math.min(1, Math.max(0, state.bufferedFraction)) * 100)}%`;
  return (
    <div
      data-ginger-component="TimeRail"
      className={className}
      style={
        unstyled
          ? { ...style }
          : {
              width: "100%",
              height,
              background: "var(--ginger-muted-color, #e5e7eb)",
              borderRadius: 999,
              overflow: "hidden",
              position: "relative",
              ...style,
            }
      }
      aria-hidden
    >
      {showBuffered ? (
        <div
          data-ginger-component="TimeRail"
          style={{
            position: unstyled ? undefined : "absolute",
            left: unstyled ? undefined : 0,
            top: unstyled ? undefined : 0,
            height: unstyled ? undefined : "100%",
            width: bufPct,
            background: unstyled
              ? undefined
              : "var(--ginger-buffer-color, rgba(107, 114, 128, 0.35))",
          }}
        />
      ) : null}
      <div
        data-ginger-component="TimeRail"
        style={{
          position: unstyled ? undefined : "relative",
          width: progressPct,
          height: unstyled ? undefined : "100%",
          background: unstyled ? undefined : "var(--ginger-primary-color, #111827)",
        }}
      />
    </div>
  );
}

TimeRail.displayName = "Ginger.Current.TimeRail";

export type BufferRailProps = DisplayBaseProps & {
  height?: number;
  /** Remove default rail styles and render only buffered width value. */
  unstyled?: boolean;
};

/** Buffered portion of the timeline (0…`bufferedFraction`); pair with `TimeRail` or use alone. */
export function BufferRail({ className, style, height = 4, unstyled = false }: BufferRailProps) {
  const state = useGingerClockState();
  const bufPct = `${Math.round(Math.min(1, Math.max(0, state.bufferedFraction)) * 100)}%`;
  return (
    <div
      data-ginger-component="BufferRail"
      className={className}
      style={
        unstyled
          ? { ...style }
          : {
              width: "100%",
              height,
              background: "var(--ginger-muted-color, #e5e7eb)",
              borderRadius: 999,
              overflow: "hidden",
              ...style,
            }
      }
      aria-hidden
    >
      <div
        data-ginger-component="BufferRail"
        style={{
          width: bufPct,
          height: unstyled ? undefined : "100%",
          background: unstyled
            ? undefined
            : "var(--ginger-buffer-color, rgba(107, 114, 128, 0.35))",
        }}
      />
    </div>
  );
}

BufferRail.displayName = "Ginger.Current.BufferRail";
