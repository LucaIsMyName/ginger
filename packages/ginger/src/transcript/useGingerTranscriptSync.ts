import { useMemo } from "react";
import { useGingerMedia } from "../context/GingerSplitContexts";
import { type TranscriptCue, parseSrt, parseTranscriptAuto, parseVtt } from "./parseTranscript";

export type UseGingerTranscriptSyncOptions = {
  transcript: string | TranscriptCue[];
  /** Default: `"auto"` (WEBVTT header → VTT, else SRT). Ignored when `transcript` is a cue array. */
  format?: "vtt" | "srt" | "auto";
};

export type GingerTranscriptSyncState = {
  cues: TranscriptCue[];
  /** Last cue index where `startTime <= currentTime` (same scan as lyrics sync). */
  activeIndex: number;
  activeCue: TranscriptCue | null;
  /** All cues active at `currentTime` (`startTime <= t < endTime`), including overlaps. */
  activeCues: TranscriptCue[];
};

function parseString(transcript: string, format: "vtt" | "srt" | "auto"): TranscriptCue[] {
  if (format === "vtt") return parseVtt(transcript);
  if (format === "srt") return parseSrt(transcript);
  return parseTranscriptAuto(transcript);
}

function findLastCueIndexAtOrBeforeTime(cues: TranscriptCue[], currentTime: number): number {
  let low = 0;
  let high = cues.length - 1;
  let best = -1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    const cue = cues[mid];
    if (!cue) break;
    if (cue.startTime <= currentTime) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

/**
 * Syncs SRT / WebVTT transcript cues to the current Ginger playback time.
 *
 * ```ts
 * import { useGingerTranscriptSync } from "@lucaismyname/ginger/transcript";
 * ```
 */
export function useGingerTranscriptSync(
  options: UseGingerTranscriptSyncOptions,
): GingerTranscriptSyncState {
  const { transcript, format = "auto" } = options;
  const { currentTime } = useGingerMedia();

  const cues = useMemo(() => {
    if (Array.isArray(transcript)) {
      return [...transcript]
        .filter(
          (c) =>
            Number.isFinite(c.startTime) &&
            Number.isFinite(c.endTime) &&
            c.startTime >= 0 &&
            c.endTime >= c.startTime,
        )
        .sort((a, b) => a.startTime - b.startTime);
    }
    return parseString(transcript, format);
  }, [transcript, format]);

  const activeIndex = useMemo(() => {
    return findLastCueIndexAtOrBeforeTime(cues, currentTime);
  }, [currentTime, cues]);

  const activeCues = useMemo(() => {
    if (activeIndex < 0) return [];
    return cues
      .slice(0, activeIndex + 1)
      .filter((c) => currentTime >= c.startTime && currentTime < c.endTime);
  }, [currentTime, cues, activeIndex]);

  return {
    cues,
    activeIndex,
    activeCue: activeCues.length > 0 ? (activeCues[activeCues.length - 1] ?? null) : null,
    activeCues,
  };
}
