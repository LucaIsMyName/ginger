import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGingerContext } from "../context/GingerContext";
import { useGingerMedia, useGingerPlayback } from "../context/GingerSplitContexts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UseGingerTTSOptions = {
  /**
   * Array of plain-text strings to speak, one per Ginger track.
   * `texts[currentIndex]` is spoken when the active track plays.
   *
   * For a single "Listen to this article" use case, pass a 1-element array.
   */
  texts: string[];
  /**
   * `SpeechSynthesisVoice` to use. Defaults to the browser's default voice
   * for the given `lang`.
   */
  voice?: SpeechSynthesisVoice;
  /**
   * Speech rate (0.1–10). Affects duration estimation.
   * @default 1
   */
  rate?: number;
  /**
   * Pitch (0–2).
   * @default 1
   */
  pitch?: number;
  /**
   * BCP-47 language tag, e.g. `"en-US"`. Falls back to browser default when
   * omitted.
   */
  lang?: string;
  /**
   * When `false`, TTS is completely disabled and the hook is a no-op.
   * @default true
   */
  enabled?: boolean;
};

export type UseGingerTTSResult = {
  /**
   * `false` when `window.speechSynthesis` is unavailable (e.g. SSR,
   * unsupported browser) or when `enabled` is `false`.
   */
  isSupported: boolean;
  /** Available synthesis voices filtered to the active `lang`. */
  voices: SpeechSynthesisVoice[];
  /**
   * Switch the synthesis voice. Takes effect on the next utterance (requires
   * cancel + restart for mid-speech changes).
   */
  setVoice: (voice: SpeechSynthesisVoice) => void;
  /**
   * Seek to a target time in seconds within the current track's text.
   * Implemented by slicing the text to the proportional character offset and
   * restarting speech — exact position may vary across TTS engines.
   */
  seek: (timeSeconds: number) => void;
  /** Error message if the TTS engine fires an error event. */
  error: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WORDS_PER_MINUTE = 150;

/**
 * Estimate speech duration from word count and rate.
 * Average speaking pace is ~150 wpm; adjusted by the `rate` multiplier.
 */
export function estimateDuration(text: string, rate: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return (words / WORDS_PER_MINUTE) * 60 * (1 / Math.max(0.1, rate));
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Drives Ginger playback from plain text using the Web Speech API
 * (`SpeechSynthesis`). No audio files required.
 *
 * Mount `Ginger.Provider` **without** `<Ginger.Player />` — this hook takes
 * over the playback role entirely, dispatching the same state actions that
 * `GingerPlayer` would.
 *
 * ```tsx
 * import { useGingerTTS } from "@lucaismyname/ginger/tts";
 *
 * function ArticlePlayer({ text }: { text: string }) {
 *   const { isSupported, voices, setVoice } = useGingerTTS({ texts: [text] });
 *   return (
 *     <Ginger.Provider initialTracks={[{ title: "Article", fileUrl: "" }]}>
 *       <Ginger.Controls.PlayPause />
 *       {!isSupported && <p>TTS not available</p>}
 *     </Ginger.Provider>
 *   );
 * }
 * ```
 *
 * **Limitations:**
 * - Seek is approximated via text slicing; accuracy depends on the TTS engine.
 * - `SpeechSynthesis.pause()` is unreliable on mobile; the hook always
 *   cancels and restarts from the last known character offset instead.
 * - Volume changes take effect on the next utterance (system TTS ignores
 *   mid-utterance volume changes on most platforms).
 * - Requires a prior user gesture before `SpeechSynthesis.resume()` is
 *   allowed (standard browser policy).
 * - SSR: returns `isSupported: false` with no side effects.
 *
 * Available as a subpath import:
 * ```ts
 * import { useGingerTTS } from "@lucaismyname/ginger/tts";
 * ```
 */
export function useGingerTTS(options: UseGingerTTSOptions): UseGingerTTSResult {
  const { texts, rate = 1, pitch = 1, lang, enabled = true, voice: voiceProp } = options;

  const { dispatch, notifyEnded } = useGingerContext();
  const { isPaused, currentIndex } = useGingerPlayback();
  const { volume, muted } = useGingerMedia();

  const synth = getSpeechSynthesis();
  const isSupported = enabled && synth !== null;

  const [voiceOverride, setVoiceOverride] = useState<SpeechSynthesisVoice | undefined>(voiceProp);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Stable refs used inside effects / callbacks
  const charIndexRef = useRef(0);
  const estimatedDurationRef = useRef(0);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const currentTextRef = useRef("");
  const currentText = texts[currentIndex] ?? "";
  currentTextRef.current = currentText;

  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(voiceOverride ?? voiceProp);
  voiceRef.current = voiceOverride ?? voiceProp;

  const rateRef = useRef(rate);
  rateRef.current = rate;
  const pitchRef = useRef(pitch);
  pitchRef.current = pitch;
  const langRef = useRef(lang);
  langRef.current = lang;

  // Key incremented to force the play effect to restart mid-session (e.g. seek).
  const [restartKey, setRestartKey] = useState(0);

  // ---------------------------------------------------------------------------
  // Voice list: populate on mount and on voiceschanged
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupported || !synth) return;

    const updateVoices = () => {
      const all = synth.getVoices();
      setVoices(lang ? all.filter((v) => v.lang.startsWith(lang.split("-")[0]!)) : all);
    };

    updateVoices();
    synth.addEventListener("voiceschanged", updateVoices);
    return () => synth.removeEventListener("voiceschanged", updateVoices);
  }, [isSupported, synth, lang]);

  // ---------------------------------------------------------------------------
  // Reset char position when track changes (currentIndex or text content)
  // ---------------------------------------------------------------------------
  // biome-ignore lint/correctness/useExhaustiveDependencies: mutating a ref — deps are intentional triggers, not reactive values
  useEffect(() => {
    charIndexRef.current = 0;
  }, [currentIndex, currentText]);

  // ---------------------------------------------------------------------------
  // Dispatch estimated duration when text changes
  // ---------------------------------------------------------------------------
  const estimatedDuration = useMemo(() => estimateDuration(currentText, rate), [currentText, rate]);

  useEffect(() => {
    if (!isSupported || !currentText) return;
    estimatedDurationRef.current = estimatedDuration;
    dispatch({
      type: "MEDIA_LOADED_METADATA",
      payload: { duration: estimatedDuration, bufferedFraction: 1 },
    });
    dispatch({
      type: "MEDIA_TIME_UPDATE",
      payload: { currentTime: 0, duration: estimatedDuration, bufferedFraction: 1 },
    });
  }, [isSupported, currentText, estimatedDuration, dispatch]);

  // ---------------------------------------------------------------------------
  // Main playback effect: start / cancel utterances based on isPaused
  // ---------------------------------------------------------------------------
  // biome-ignore lint/correctness/useExhaustiveDependencies: restartKey triggers re-run for seek; voiceRef/langRef/rateRef/pitchRef read inside
  useEffect(() => {
    if (!isSupported || !synth) return;
    if (!currentText) return;

    if (isPaused) {
      // Cancel any in-progress speech; charIndexRef retains position for resume.
      synth.cancel();
      return;
    }

    // --- Build utterance ---
    const text = currentText;
    const startCharIndex = charIndexRef.current;
    const textSlice = startCharIndex > 0 ? text.slice(startCharIndex) : text;

    if (!textSlice.trim()) {
      // Nothing left to speak (at end of text).
      return;
    }

    const dur = estimatedDurationRef.current;
    const utterance = new SpeechSynthesisUtterance(textSlice);
    utterance.rate = rateRef.current;
    utterance.pitch = pitchRef.current;
    if (langRef.current) utterance.lang = langRef.current;
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.volume = mutedRef.current ? 0 : Math.min(1, Math.max(0, volumeRef.current));

    // Whether this utterance has been intentionally cancelled by the hook.
    let aborted = false;

    // Interval-based time tracking (fallback when boundary events are absent,
    // e.g. Safari). Also provides sub-boundary granularity.
    const startedAt = performance.now();
    const intervalId = setInterval(() => {
      const elapsedSec = (performance.now() - startedAt) / 1000;
      // Time = time already spoken (from startCharIndex) + elapsed this utterance
      const timeFromStart = (startCharIndex / text.length) * dur;
      const currentTime = Math.min(dur, timeFromStart + elapsedSec * rateRef.current);
      dispatch({
        type: "MEDIA_TIME_UPDATE",
        payload: { currentTime, duration: dur, bufferedFraction: 1 },
      });
    }, 250);

    // Boundary events refine charIndex and time when the engine fires them.
    utterance.onboundary = (event) => {
      if (aborted) return;
      const absoluteCharIndex = startCharIndex + event.charIndex;
      charIndexRef.current = absoluteCharIndex;
      const currentTime = (absoluteCharIndex / text.length) * dur;
      dispatch({
        type: "MEDIA_TIME_UPDATE",
        payload: { currentTime, duration: dur, bufferedFraction: 1 },
      });
    };

    utterance.onstart = () => {
      if (aborted) return;
      dispatch({ type: "MEDIA_PLAY" });
    };

    utterance.onend = () => {
      clearInterval(intervalId);
      if (aborted) return;
      // Snap to full duration on natural end.
      dispatch({
        type: "MEDIA_TIME_UPDATE",
        payload: { currentTime: dur, duration: dur, bufferedFraction: 1 },
      });
      charIndexRef.current = 0;
      notifyEnded();
    };

    utterance.onerror = (event) => {
      clearInterval(intervalId);
      if (aborted) return;
      // "interrupted" and "canceled" are not real errors — they happen when
      // cancel() is called, which we do deliberately.
      if (event.error === "interrupted" || event.error === "canceled") return;
      setError(`TTS error: ${event.error}`);
      dispatch({ type: "MEDIA_ERROR", payload: { message: `TTS_${event.error.toUpperCase()}` } });
    };

    // In Chrome, calling speak() immediately after cancel() in the same
    // synchronous tick silently kills the new utterance (cancel is processed
    // asynchronously and races with the queued speak). A small delay lets
    // the cancel settle before the new utterance is enqueued.
    synth.cancel();
    let speakTimeoutId: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      speakTimeoutId = null;
      if (!aborted) synth.speak(utterance);
    }, 50);

    return () => {
      aborted = true;
      if (speakTimeoutId !== null) clearTimeout(speakTimeoutId);
      clearInterval(intervalId);
      synth.cancel();
    };
  }, [
    isSupported,
    synth,
    isPaused,
    currentText,
    estimatedDuration,
    restartKey,
    dispatch,
    notifyEnded,
  ]);

  // ---------------------------------------------------------------------------
  // Seek
  // ---------------------------------------------------------------------------
  const seek = useCallback(
    (timeSeconds: number) => {
      const text = currentTextRef.current;
      const dur = estimatedDurationRef.current;
      if (!dur || !text) return;

      const clamped = Math.min(dur, Math.max(0, timeSeconds));
      const newCharIndex = Math.floor((clamped / dur) * text.length);
      charIndexRef.current = newCharIndex;

      const newTime = (newCharIndex / text.length) * dur;
      dispatch({
        type: "MEDIA_TIME_UPDATE",
        payload: { currentTime: newTime, duration: dur, bufferedFraction: 1 },
      });

      // If currently playing, restart from the new position.
      if (!isPausedRef.current) {
        setRestartKey((k) => k + 1);
      }
    },
    [dispatch],
  );

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional unmount-only cleanup
  useEffect(
    () => () => {
      if (isSupported && synth) synth.cancel();
    },
    [],
  );

  return {
    isSupported,
    voices,
    setVoice: setVoiceOverride,
    seek,
    error,
  };
}
