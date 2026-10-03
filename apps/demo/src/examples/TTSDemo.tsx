import { Ginger, useGinger } from "@lucaismyname/ginger";
import { useGingerTTS } from "@lucaismyname/ginger/tts";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Sample article sections (no audio files needed)
// ---------------------------------------------------------------------------

const ARTICLES = [
  {
    title: "The Future of the Web",
    body: `The web has changed dramatically over the past three decades. What began as a simple system for sharing academic documents has evolved into the backbone of global commerce, communication, and culture. Today, billions of people rely on it every day — to work, to learn, to connect with friends and family across the globe.

Modern browsers have become remarkably capable platforms. They can run complex applications, render three-dimensional graphics, and now even synthesise speech directly from text without any server round-trip. This opens up entirely new possibilities for accessibility and content consumption.

Imagine a world where every article, every blog post, every piece of long-form writing is instantly available as audio. Not through a costly studio recording or a separate podcast feed, but generated on demand, in the reader's preferred voice and speed, right in the browser.`,
  },
  {
    title: "Why Headless Components Matter",
    body: `For years, developers faced a frustrating choice when building audio interfaces: use an opinionated player that looks the same on every site, or build everything from scratch and spend weeks getting edge cases right.

Headless component libraries offer a third path. They handle the hard parts — state management, keyboard accessibility, media session integration, queue logic — while leaving the visual presentation entirely up to you.

This separation of concerns is powerful. It means the same underlying playback engine can power a minimal podcast widget, a full-featured music platform, or, as we see here, a simple text-to-speech reader. The logic is identical; only the presentation differs.`,
  },
  {
    title: "Accessibility on the Modern Web",
    body: `Accessibility is not a feature you bolt on at the end of a project. It is a fundamental quality of good software, woven into every decision from the earliest stages of design.

Screen readers, keyboard navigation, sufficient colour contrast, descriptive labels — these are not optional extras for a minority of users. They are the baseline expectation for software that serves everyone equally.

Text-to-speech is a natural extension of this philosophy. By letting users listen to content rather than read it, we serve people with visual impairments, dyslexia, or simply those who prefer to consume information while commuting or exercising. The technology is already built into every modern browser; we just need to use it.`,
  },
];

const tracks = ARTICLES.map((a, i) => ({
  id: `article-${i}`,
  title: a.title,
  fileUrl: "",
}));

const texts = ARTICLES.map((a) => a.body);

// ---------------------------------------------------------------------------
// Inner panel — must be mounted inside Ginger.Provider
// ---------------------------------------------------------------------------

function TTSPanel() {
  const g = useGinger();
  const [rate, setRate] = useState(1);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  const { isSupported, voices, setVoice, seek, error } = useGingerTTS({ texts, rate });

  const article = ARTICLES[g.state.currentIndex];

  const currentTime = g.state.currentTime;
  const duration = g.state.duration;
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const fmt = (s: number) => {
    if (!Number.isFinite(s) || s <= 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <strong>Speech synthesis is not available</strong> in this browser or environment. Try
        Chrome, Edge, or Safari on a supported platform.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm ring-1 ring-violet-100">
        <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Text-to-Speech Player
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-violet-900">
          No audio files — powered by{" "}
          <code className="rounded bg-white/80 px-1 font-mono text-[11px]">
            @lucaismyname/ginger/tts
          </code>{" "}
          + the browser's{" "}
          <code className="rounded bg-white/80 px-1 font-mono text-[11px]">SpeechSynthesis</code>{" "}
          API.
        </p>
        {error ? (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            {error}
          </div>
        ) : null}
      </div>

      {/* Article selector / playlist */}
      <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Articles</p>
        <div className="flex flex-col gap-1">
          {ARTICLES.map((a, i) => (
            <button
              key={a.title}
              type="button"
              onClick={() => g.playTrackAt(i)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                g.state.currentIndex === i
                  ? "bg-violet-600 font-semibold text-white shadow"
                  : "text-zinc-700 hover:bg-violet-50 hover:text-violet-900"
              }`}
            >
              {a.title}
            </button>
          ))}
        </div>
      </div>

      {/* Current article text */}
      {article ? (
        <div className="max-h-44 overflow-y-auto rounded-2xl border border-zinc-200 bg-white/60 p-4 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Reading
          </p>
          <h2 className="mb-2 text-base font-semibold text-zinc-900">{article.title}</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-600">
            {article.body}
          </p>
        </div>
      ) : null}

      {/* Progress + controls */}
      <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm">
        {/* Time */}
        <div className="mb-2 flex items-center justify-between font-mono text-xs text-zinc-500">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>

        {/* Seek bar (custom — calls tts.seek) */}
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 1}
          step={1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="mb-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-violet-200 accent-violet-600"
          aria-label="Seek"
        />

        {/* Playback controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Ginger.Control.Previous className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40" />
          <Ginger.Control.PlayPause className="rounded-lg bg-violet-600 px-5 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-violet-700" />
          <Ginger.Control.Next className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40" />
        </div>

        {/* Rate + voice */}
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3">
          <label className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="font-medium">Speed</span>
            <select
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 focus:outline-none"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                <option key={r} value={r}>
                  {r}×
                </option>
              ))}
            </select>
          </label>

          {voices.length > 0 ? (
            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-zinc-600">
              <span className="shrink-0 font-medium">Voice</span>
              <select
                value={selectedVoiceIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSelectedVoiceIndex(idx);
                  const v = voices[idx];
                  if (v) setVoice(v);
                }}
                className="min-w-0 flex-1 truncate rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 focus:outline-none"
              >
                {voices.map((v, i) => (
                  <option key={v.voiceURI} value={i}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="text-xs text-zinc-400">Loading voices…</span>
          )}
        </div>

        {/* Progress bar visual */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-violet-100">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-1 text-right font-mono text-[10px] text-zinc-400">
          {Math.round(progress * 100)}%
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function TTSDemo() {
  return (
    <Ginger.Provider initialTracks={tracks} initialPaused>
      {/* No <Ginger.Player /> — TTS hook drives playback */}
      <TTSPanel />
    </Ginger.Provider>
  );
}
