import type { PlaylistMeta, Track } from "@lucaismyname/ginger";

/**
 * Bundled same-origin MP3s under `public/samples/` so Web Audio (EQ, spatial, effects) and
 * `fetch` + `decodeAudioData` (file waveform peaks) work without CORS issues.
 *
 * Sources (Internet Archive / netlabels — Creative Commons; see public/samples/README.txt):
 * - Piano: AnthonyB — coffee and piano (skd-1206)
 * - Electric guitar: Tigerberry — Cold Wave (SCL160)
 * - Acoustic guitar: Zak Whitefield — Dorm Room EP (Hfr022)
 */
export const demoAudioUrl = "/samples/piano-sole.mp3";

export const demoTracks: Track[] = [
  {
    id: "piano-sole",
    title: "Sole",
    artist: "AnthonyB",
    fileUrl: "/samples/piano-sole.mp3",
    album: "coffee and piano",
    artworkUrl:
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=320&h=320&q=80",
    description: "Piano (netlabel release on Archive.org).",
    genre: "Piano",
    year: 2012,
  },
  {
    id: "electric-get-out",
    title: "Get Out",
    artist: "Tigerberry",
    fileUrl: "/samples/electric-guitar-get-out.mp3",
    album: "Cold Wave",
    artworkUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=320&h=320&q=80",
    description: "Rock / cold wave — electric guitar (netlabel on Archive.org).",
    genre: "Rock",
    year: 2014,
  },
  {
    id: "acoustic-county",
    title: "County",
    artist: "Zak Whitefield",
    fileUrl: "/samples/acoustic-guitar-county.mp3",
    album: "Dorm Room EP",
    artworkUrl:
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=320&h=320&q=80",
    description: "Modern acoustic singer-songwriter (netlabel on Archive.org).",
    genre: "Acoustic",
    year: 2011,
  },
];

/** SRT cues for the transcript demo — spaced across the first minutes of a typical track. */
export const demoTranscriptSrt = `
1
00:00:00,000 --> 00:00:25,000
Intro — transcript line one (synced to playback time).

2
00:00:25,000 --> 00:01:00,000
Middle section: scrub the seek bar to jump between cues.

3
00:01:00,000 --> 00:02:00,000
Third cue — lines follow Ginger’s current time.

4
00:02:00,000 --> 00:15:00,000
Closing cue (long pad so the last line stays active on longer songs).
`.trim();

export const demoPlaylistMeta: PlaylistMeta = {
  title: "Ginger demo playlist",
  subtitle: "Piano · electric guitar · acoustic (Archive.org netlabels)",
  description: "Queue metadata for `Ginger.Queue.*` components.",
  artworkUrl:
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=320&h=320&q=80",
};
