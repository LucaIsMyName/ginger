export const NPM_CMD = "npm i @lucaismyname/ginger@latest";
export const NPM_URL = "https://www.npmjs.com/package/@lucaismyname/ginger";
export const REPO_URL = "https://github.com/lucaismyname/ginger";
/** Author / project link shown in the landing “Links” row. */
export const PERSONAL_WEBSITE_URL = "https://lucamack.com";

export const TOOLTIP_EXAMPLE_SNIPPET = `import { Ginger } from "@lucaismyname/ginger";
const tracks = [
  {
    title: "Track 1",
    artist: "Artist 1",
    fileUrl: "https://example.com/audio/track1.mp3",
  },
];
// custom player with chapters + controls
<Ginger.Provider initialTracks={tracks}>
  <Ginger.Player />
  <Ginger.Current.Title className="font-semibold" />
  <Ginger.Control.SeekBar className="h-1" />
  <Ginger.Control.Volume className="w-24" />
</Ginger.Provider>`;
