import { useMemo } from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { useGingerLocale } from "../../context/GingerLocaleContext";
import { useGingerMedia, useGingerPlayback } from "../../context/GingerSplitContexts";
import {
  usePlayPauseBinding,
  useSeekBarBinding,
  useVolumeSlider,
} from "../../hooks/useControlBindings";
import {
  Pause,
  Play,
  RepeatGlyph,
  ShuffleIcon,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "../icons";

export type PlayPauseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** When `children` is omitted, defaults are Lucide-style icons; string labels feed `playAriaLabel` / `pauseAriaLabel` fallbacks. */
  playLabel?: ReactNode;
  pauseLabel?: ReactNode;
  /** Screen-reader label when paused (playing would start); defaults to match `playLabel` when it is a string */
  playAriaLabel?: string;
  /** Screen-reader label when playing (action would pause); defaults to match `pauseLabel` when it is a string */
  pauseAriaLabel?: string;
  children?: ReactNode;
};

export function PlayPause({
  playLabel = "Play",
  pauseLabel = "Pause",
  playAriaLabel,
  pauseAriaLabel,
  children,
  type = "button",
  onClick,
  ...rest
}: PlayPauseProps) {
  const locale = useGingerLocale();
  const defaultPlayAria = typeof playLabel === "string" ? playLabel : locale.play;
  const defaultPauseAria = typeof pauseLabel === "string" ? pauseLabel : locale.pause;
  const b = usePlayPauseBinding({
    playAriaLabel: playAriaLabel ?? defaultPlayAria,
    pauseAriaLabel: pauseAriaLabel ?? defaultPauseAria,
  });
  return (
    <button
      data-ginger-component="PlayPause"
      {...rest}
      type={type}
      aria-label={b.ariaLabel}
      onClick={(e) => {
        b.toggle();
        onClick?.(e);
      }}
    >
      {children ?? (b.isPaused ? <Play /> : <Pause />)}
    </button>
  );
}

PlayPause.displayName = "Ginger.Control.PlayPause";

export type RepeatProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel?: string;
  children?: ReactNode;
};

export function Repeat({ type = "button", ariaLabel, onClick, children, ...rest }: RepeatProps) {
  const { repeatMode, cycleRepeat } = useGingerPlayback();
  const locale = useGingerLocale();
  const label = locale.repeat[repeatMode];
  return (
    <button
      data-ginger-component="Repeat"
      {...rest}
      type={type}
      aria-label={ariaLabel ?? label}
      aria-pressed={repeatMode === "off" ? false : repeatMode === "one" ? "mixed" : true}
      onClick={(e) => {
        cycleRepeat();
        onClick?.(e);
      }}
    >
      {children ?? <RepeatGlyph mode={repeatMode} />}
    </button>
  );
}

Repeat.displayName = "Ginger.Control.Repeat";

export type NextProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel?: string;
};
export function Next({ type = "button", children, ariaLabel, onClick, ...rest }: NextProps) {
  const { next } = useGingerPlayback();
  const locale = useGingerLocale();
  return (
    <button
      data-ginger-component="Next"
      {...rest}
      type={type}
      aria-label={ariaLabel ?? locale.nextTrack}
      onClick={(e) => {
        next();
        onClick?.(e);
      }}
    >
      {children ?? <SkipForward />}
    </button>
  );
}
Next.displayName = "Ginger.Control.Next";

export type PreviousProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel?: string;
};
export function Previous({
  type = "button",
  children,
  ariaLabel,
  onClick,
  ...rest
}: PreviousProps) {
  const { prev } = useGingerPlayback();
  const locale = useGingerLocale();
  return (
    <button
      data-ginger-component="Previous"
      {...rest}
      type={type}
      aria-label={ariaLabel ?? locale.previousTrack}
      onClick={(e) => {
        prev();
        onClick?.(e);
      }}
    >
      {children ?? <SkipBack />}
    </button>
  );
}
Previous.displayName = "Ginger.Control.Previous";

export type ShuffleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel?: string;
};
export function Shuffle({ type = "button", children, ariaLabel, onClick, ...rest }: ShuffleProps) {
  const { isShuffled, toggleShuffle } = useGingerPlayback();
  const locale = useGingerLocale();
  return (
    <button
      data-ginger-component="Shuffle"
      {...rest}
      type={type}
      aria-pressed={isShuffled}
      aria-label={ariaLabel ?? locale.shuffle}
      onClick={(e) => {
        toggleShuffle();
        onClick?.(e);
      }}
    >
      {children ?? <ShuffleIcon />}
    </button>
  );
}
Shuffle.displayName = "Ginger.Control.Shuffle";

export type SeekBarProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "onInput" | "min" | "max" | "step"
> & {
  /** Remove default width style for fully custom styling. */
  unstyled?: boolean;
  ariaLabel?: string;
  inputStyle?: CSSProperties;
};

export function SeekBar({ inputStyle, style, unstyled = false, ariaLabel, ...rest }: SeekBarProps) {
  const b = useSeekBarBinding();
  const mergedStyle = unstyled
    ? { ...style, ...inputStyle }
    : { width: "100%", ...style, ...inputStyle };
  return (
    <input
      data-ginger-component="SeekBar"
      {...rest}
      type="range"
      min={b.min}
      max={b.max}
      step={b.step}
      value={b.value}
      aria-label={ariaLabel ?? b.ariaLabel}
      aria-valuetext={b.ariaValueText}
      onInput={b.onSeekInput}
      onChange={b.onSeekChange}
      style={mergedStyle}
    />
  );
}

SeekBar.displayName = "Ginger.Control.SeekBar";

export type VolumeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "onInput" | "min" | "max" | "step"
> & {
  /** Remove default width style for fully custom styling. */
  unstyled?: boolean;
  ariaLabel?: string;
  inputStyle?: CSSProperties;
};

export function Volume({ inputStyle, style, unstyled = false, ariaLabel, ...rest }: VolumeProps) {
  const b = useVolumeSlider();
  const mergedStyle = unstyled
    ? { ...style, ...inputStyle }
    : { width: "100%", ...style, ...inputStyle };
  return (
    <input
      data-ginger-component="Volume"
      {...rest}
      type="range"
      min={b.min}
      max={b.max}
      step={b.step}
      value={b.value}
      aria-label={ariaLabel ?? b.ariaLabel}
      aria-valuetext={b.ariaValueText}
      onInput={b.onVolumeInput}
      onChange={b.onVolumeChange}
      style={mergedStyle}
    />
  );
}

Volume.displayName = "Ginger.Control.Volume";

export type MuteProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel?: string;
  muteLabel?: ReactNode;
  unmuteLabel?: ReactNode;
  children?: ReactNode;
};

export function Mute({
  ariaLabel,
  muteLabel,
  unmuteLabel,
  type = "button",
  onClick,
  children,
  ...rest
}: MuteProps) {
  const { muted, toggleMute } = useGingerMedia();
  const locale = useGingerLocale();
  return (
    <button
      data-ginger-component="Mute"
      {...rest}
      type={type}
      aria-pressed={muted}
      aria-label={ariaLabel ?? (muted ? locale.unmute : locale.mute)}
      onClick={(e) => {
        toggleMute();
        onClick?.(e);
      }}
    >
      {children ?? (muted ? (unmuteLabel ?? <VolumeX />) : (muteLabel ?? <Volume2 />))}
    </button>
  );
}

Mute.displayName = "Ginger.Control.Mute";

const defaultRates = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type PlaybackRateProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange"
> & {
  /** Playback speed options (default: 0.5 … 2) */
  rates?: readonly number[];
  ariaLabel?: string;
  children?: ReactNode;
};

export function PlaybackRate({
  rates = defaultRates,
  style,
  ariaLabel,
  children,
  ...rest
}: PlaybackRateProps) {
  const { playbackRate, setPlaybackRate } = useGingerMedia();
  const locale = useGingerLocale();
  const options = useMemo(
    () => Array.from(new Set([...rates, playbackRate])).sort((a, b) => a - b),
    [rates, playbackRate],
  );
  return (
    <select
      data-ginger-component="PlaybackRate"
      {...rest}
      aria-label={ariaLabel ?? locale.playbackSpeed}
      value={String(playbackRate)}
      style={style}
      onChange={(e) => setPlaybackRate(Number(e.currentTarget.value))}
    >
      {children ??
        options.map((r) => (
          <option key={r} value={String(r)}>
            {r === 1 ? locale.playbackRateNormal : locale.playbackRateTimes(r)}
          </option>
        ))}
    </select>
  );
}

PlaybackRate.displayName = "Ginger.Control.PlaybackRate";
