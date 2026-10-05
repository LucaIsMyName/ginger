# Changelog

All notable changes to `@lucaismyname/ginger` are documented here. The published copy is [`packages/ginger/CHANGELOG.md`](../../../CHANGELOG.md).

## 0.0.65

- **Queue:** `findIndexByTrackIdentity` returns `-1` when a track is missing, so shuffle remove and unshuffle no longer treat a miss as index `0`. Inserting while shuffled places the new track beside its neighbor in the canonical list.
- **`Ginger.Tracks`:** Declarative sync runs when the JSX queue or `initialTracks` change, not when imperative queue edits do. Field updates do not reset playback time.
- **Persistence:** `hydrateOnMount` applies saved settings before the first write.
- **Retry and buffering:** Retries no longer clear the error before `load()` recovers. `timeupdate` no longer clears `isBuffering`.
- **Previous:** Restarting the current track updates reducer `currentTime` immediately.
- **Sleep timer:** `stopAfterTracks` counts forward advances only.
- **Web Audio:** The media-element `AudioContext` stays open. `setProcessingSlot` composes `eq` → `spatial` → `user`. `setBands` applies gain-only updates. Crossfade shares that graph, does not close it, and reports attach failures on `error`.
- **UI:** Metadata components skip time-tick re-renders (`useGingerMetadataState`, `useGingerClockState`). Focus uses `--ginger-focus-ring`. Repeat sets `aria-pressed`.
- **Remote:** Snapshots include `currentTime`, plus a throttled `TIME_SYNC`.

## 0.0.48

- **Documentation:** Refreshed the root monorepo [`README.md`](https://github.com/lucaismyname/ginger/blob/main/README.md), this package [`README.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/README.md), and [`docs/README.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/docs/README.md) (tooling, apps, publishing, docs map).
- **Publishing:** From the monorepo, use `npm run publish:lib` (runs `npm publish` inside `packages/ginger`) so the [npmjs.com package page](https://www.npmjs.com/package/@lucaismyname/ginger) shows **this** `README.md`. Publishing with `npm publish -w @lucaismyname/ginger` from the repo root can attach the **root** readme to registry metadata instead.
- **Repository (not shipped in the npm tarball):** [`CHANGELOG.md`](https://github.com/lucaismyname/ginger/blob/main/packages/ginger/CHANGELOG.md) is included in the published package; the landing app uses bundled audio samples, Prism-based Quick Start highlighting, and refactored components; the demo app aligns on orange accents and includes Playwright smoke tests; Husky + lint-staged and shared Biome formatting apply across workspaces.

## 0.0.45

- Add crossfade module (`@lucaismyname/ginger/crossfade`)
- Adjust hook deps to follow active audio source
- Regenerate API docs with crossfade coverage

## 0.0.44

- Update docs and landing UI controls
- Prevent replay loop at queue end

## 0.0.41

- Polish landing UI
- Add verify script and Biome linting

## 0.0.39

- Exclude ginger from Vite `optimizeDeps` in apps
- Link local ginger package; add docs and experimental gapless probe

## 0.0.37

- Add audio demos and bundled demo MP3s
- Add Radix-based playback rate select
- Add app typechecks and chapter markers on seek bar
- Use ref for EQ bands to avoid effect deps
- Add docs for spatial, transcript, and remote modules

## 0.0.33

- Add remote-control module (`@lucaismyname/ginger/remote`)
- Add spatial audio module (`@lucaismyname/ginger/spatial`)
- Add transcript sync module (`@lucaismyname/ginger/transcript`)
- Add equalizer module (`@lucaismyname/ginger/equalizer`)
- Add `useGingerPlaybackHistory` and `useGingerVolumeFade` hooks

## 0.0.27

- Add `asChild` prop support on control components
- Add locale / i18n context (`useGingerLocale`)
- Add unstyled mode for zero-opinion styling
- Use inline Lucide icons for default controls
- Add live audio analyzer tests and `mockWebAudio` test helper

## 0.0.24

- Add `children` prop to control components
- Add `react-scan` dev tooling

## 0.0.22

- Add waveform player example and fix `playbackRate` bug

## 0.0.20

- Add landing player controls
- Use `@lucaismyname/ginger` in landing app

## 0.0.18

- Add CI workflow (GitHub Actions) and TypeDoc API docs
- Bump package version

## 0.0.17

- Add chapter markers with `TrackChapter` type
- Add synced lyrics (`LyricsSynced`)
- Add `useNextTrackPrefetch` hook

## 0.0.14

- Add test suite and `@lucaismyname/ginger/testing` subpath export
- Add `renderGinger` and `helpers` test utilities

## 0.0.12

- Expose `setPlaybackMode`; clear media source on track removal
- Add live audio analysis (`useGingerLiveAnalyzer`) and FFT utilities

## 0.0.10

- Add ginger-landing Vite app
- Add unstyled mode and playback options
- Add queue actions, playback modes, and persistence hooks
- Split contexts into playback vs media for performance

## 0.0.5

- Add `GingerProvider`, `GingerPlayer`, and core reducer
- Add locale and control binding hooks
- Add init API, a11y improvements, and initial docs

## 0.0.1

- Initialize monorepo with demo app
- Add volume, mute, and playback rate controls
- Add manual playlist mode
