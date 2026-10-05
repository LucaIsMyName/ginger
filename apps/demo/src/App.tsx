import { useState } from "react";
import { scan } from "react-scan";
import { AlbumGrid } from "./examples/AlbumGrid";
import { CurrentAndQueueGallery } from "./examples/CurrentAndQueueGallery";
import { EffectsDemo } from "./examples/EffectsDemo";
import { EqualizerDemo } from "./examples/EqualizerDemo";
import { FilePeaksWaveform } from "./examples/FilePeaksWaveform";
import { GlassmorphismDeck } from "./examples/GlassmorphismDeck";
import { HeadlessCustomUI } from "./examples/HeadlessCustomUI";
import { ManualPlaylist } from "./examples/ManualPlaylist";
import { NeonConsole } from "./examples/NeonConsole";
import { PlaylistBasic } from "./examples/PlaylistBasic";
import { PodcastTimeline } from "./examples/PodcastTimeline";
import { SingleTrack } from "./examples/SingleTrack";
import { SpatialAudioDemo } from "./examples/SpatialAudioDemo";
import { SpotifyMini } from "./examples/SpotifyMini";
import { TTSDemo } from "./examples/TTSDemo";
import { ThemedCssVars } from "./examples/ThemedCssVars";
import { TranscriptDemo } from "./examples/TranscriptDemo";
import { UnstyledShowcase } from "./examples/UnstyledShowcase";
import { WaveformPlayer } from "./examples/WaveformPlayer";
if (import.meta.env.DEV) {
  scan({
    enabled: true,
    showToolbar: true,
  });
}
const examples = [
  { id: "single", label: "Single track", Component: SingleTrack },
  { id: "playlist", label: "Playlist + controls", Component: PlaylistBasic },
  { id: "manual-playlist", label: "Manual Playlist.Track", Component: ManualPlaylist },
  { id: "headless", label: "useGinger headless", Component: HeadlessCustomUI },
  { id: "theme", label: "CSS variables", Component: ThemedCssVars },
  { id: "spotify", label: "Spotify mini", Component: SpotifyMini },
  { id: "waveform", label: "Waveform (live analyzer)", Component: WaveformPlayer },
  { id: "waveform-file", label: "Waveform (file peaks)", Component: FilePeaksWaveform },
  { id: "spatial", label: "Spatial audio", Component: SpatialAudioDemo },
  { id: "equalizer", label: "Equalizer", Component: EqualizerDemo },
  { id: "effects", label: "Effects", Component: EffectsDemo },
  { id: "tts", label: "Text-to-Speech (TTS)", Component: TTSDemo },
  { id: "transcript", label: "Transcript (SRT)", Component: TranscriptDemo },
  { id: "podcast", label: "Podcast timeline", Component: PodcastTimeline },
  { id: "glass", label: "Glassmorphism deck", Component: GlassmorphismDeck },
  { id: "neon", label: "Neon console", Component: NeonConsole },
  { id: "album-grid", label: "Album card grid", Component: AlbumGrid },
  { id: "unstyled", label: "Unstyled showcase", Component: UnstyledShowcase },
  { id: "gallery", label: "Current + Queue gallery", Component: CurrentAndQueueGallery },
] as const;

export function App() {
  const [id, setId] = useState<(typeof examples)[number]["id"]>("single");
  const active = examples.find((e) => e.id === id) ?? examples[0]!;
  const Body = active.Component;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200/80 bg-white/65 px-4 py-8 shadow-sm backdrop-blur md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-700">
            Ginger UI Playground
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            Audio player styling demos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Examples for{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800">
              @lucaismyname/ginger
            </code>
            . Each block uses its own{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800">
              Ginger.Provider
            </code>
            .
          </p>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:gap-10 md:px-8">
        <nav className="flex shrink-0 flex-col gap-1 md:w-64" aria-label="Examples">
          {examples.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setId(e.id)}
              aria-current={e.id === id ? "page" : undefined}
              className={`rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                e.id === id
                  ? "bg-zinc-900 text-white shadow-md"
                  : "text-zinc-700 hover:bg-white/90 hover:text-zinc-900 hover:shadow-sm"
              }`}
            >
              {e.label}
            </button>
          ))}
        </nav>
        <main className="min-w-0 flex-1 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-sm md:p-6">
          <Body />
        </main>
      </div>
    </div>
  );
}
