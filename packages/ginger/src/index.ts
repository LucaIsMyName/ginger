/** Compound component namespace for provider, player, controls, queue, and playlist UI primitives. */
export { Ginger } from "./ginger";
/** Lucide-derived inline SVG building blocks; same glyphs as default `Ginger.Control` button content. */
export {
  Pause,
  Play,
  RepeatGlyph,
  ShuffleIcon,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Wrapper,
} from "./components/icons";
/** High-level hook that returns combined state, selectors, and playback actions. */
export { useGinger } from "./hooks/useGinger";

/** Hook for real-time frequency data from the active media element. */
export { useGingerLiveAnalyzer } from "./analyzer/useGingerLiveAnalyzer";
/** Types for configuring and consuming live analyzer output. */
export type {
  UseGingerLiveAnalyzerOptions,
  UseGingerLiveAnalyzerResult,
} from "./analyzer/useGingerLiveAnalyzer";
/** Low-level attach/detach helpers for custom analyzer graph wiring. */
export {
  attachLiveAnalyser,
  detachLiveAnalyser,
  PROCESSING_SLOT_ORDER,
  setProcessingChain,
  setProcessingSlot,
} from "./analyzer/liveAudioGraph";
/** Low-level analyzer graph option type. */
export type {
  LiveAnalyserOptions,
  ProcessingSlot,
  ProcessingSlotNode,
  ProcessingUnit,
} from "./analyzer/liveAudioGraph";

/** Core state and provider public type exports. */
export type {
  DisplayBaseProps,
  GingerAction,
  GingerInitPayload,
  GingerLocaleMessages,
  GingerMediaSessionOptions,
  GingerMediaControlSlice,
  GingerMediaSlice,
  GingerPersistenceAdapter,
  GingerPlaybackSlice,
  GingerProviderProps,
  GingerRetryConfig,
  GingerState,
  PlaybackMode,
  PlaybackUiState,
  PlaylistMeta,
  RepeatMode,
  GingerTimeSlice,
  Track,
  TrackChapter,
  TrackLyricLine,
} from "./types";

/** Clamp helpers used by controls and custom integrations. */
export { clampPlaybackRate, clampVolume } from "./core/playbackReducer";
/** Navigation-focused playback slice type for transition helpers. */
export type { GingerPlaybackNavigationSlice } from "./core/transitions";
/** Selector that derives a normalized UI playback status value. */
export { derivePlaybackUiState } from "./internal/selectors";

/** Split-context hooks and state combiners for advanced composition. */
export {
  gingerStateFromContexts,
  gingerStateFromContextValues,
  useGingerClockState,
  useGingerMedia,
  useGingerMediaControls,
  useGingerMetadataState,
  useGingerPlayback,
  useGingerState,
  useGingerTime,
} from "./context/GingerSplitContexts";
/** Action/context types for split playback and media contexts. */
export type {
  GingerMediaActions,
  GingerMediaContextValue,
  GingerMediaControlContextValue,
  GingerPlaybackActions,
  GingerPlaybackContextValue,
  GingerTimeContextValue,
} from "./context/GingerSplitContexts";

/** Locale defaults and locale hook for control labels. */
export { defaultGingerLocale, useGingerLocale } from "./context/GingerLocaleContext";
/** Binding types for button and slider control hooks. */
export type {
  PlayPauseBinding,
  SeekBarBinding,
  VolumeBinding,
} from "./hooks/useControlBindings";
/** Hooks that expose ergonomic control bindings. */
export {
  usePlayPauseBinding,
  useSeekBarBinding,
  useVolumeSlider,
} from "./hooks/useControlBindings";

/** Keyboard shortcut binding type for custom hotkey UIs. */
export type { GingerKeyboardShortcutBindings } from "./hooks/useGingerKeyboardShortcuts";
/** Hook for keyboard shortcuts tied to Ginger playback actions. */
export { useGingerKeyboardShortcuts } from "./hooks/useGingerKeyboardShortcuts";

/** Chapter model and chapter progress hook type. */
export type { GingerChapter, GingerChapterState } from "./hooks/useGingerChapters";
/** Hook for chapter parsing and active chapter tracking. */
export { useGingerChapters } from "./hooks/useGingerChapters";
/** Lyrics synchronization state type. */
export type { GingerLyricsSyncState } from "./hooks/useGingerLyricsSync";
/** Hook for synced lyric line lookup by current playback time. */
export { useGingerLyricsSync } from "./hooks/useGingerLyricsSync";
/** Sleep timer options type. */
export type { GingerSleepTimerOptions } from "./hooks/useGingerSleepTimer";
/** Hook for sleep timer scheduling and cancellation. */
export { useGingerSleepTimer } from "./hooks/useGingerSleepTimer";
/** Hook for structured debug logging of playback state transitions. */
export { useGingerDebugLog } from "./hooks/useGingerDebugLog";
/** Drag state type for custom scrubbing interactions. */
export type { SeekDragState } from "./hooks/useSeekDrag";
/** Hook for pointer-driven seek interactions. */
export { useSeekDrag } from "./hooks/useSeekDrag";
/** Next-track prefetch options type. */
export type { UseNextTrackPrefetchOptions } from "./hooks/useNextTrackPrefetch";
/** Hook for prefetching next track media resources. */
export { useNextTrackPrefetch } from "./hooks/useNextTrackPrefetch";

/** Public player component props type. */
export type { GingerPlayerProps } from "./audio/GingerPlayer";
/** Playlist component and track item prop types. */
export type {
  GingerPlaylistProps,
  GingerPlaylistTrackProps,
} from "./components/playlist/GingerPlaylist";
/** Declarative queue (`Ginger.Tracks` / `Ginger.Track`) prop types. */
export type {
  GingerTrackProps,
  GingerTracksMergeMode,
  GingerTracksProps,
} from "./components/tracks";
/** Current playback status component prop types. */
export type {
  ErrorMessageProps,
  PlaybackStateProps,
} from "./components/current/Playback";
/** Artwork component prop type alias for current-track artwork. */
export type { ArtworkProps as CurrentArtworkProps } from "./components/current/Artwork";
/** Current file URL display prop type. */
export type { FileUrlProps } from "./components/current/FileUrl";
/** Plain lyrics display prop type. */
export type { LyricsProps } from "./components/current/Lyrics";
/** Chapter list component prop type. */
export type { ChaptersProps } from "./components/current/Chapters";
/** Synced lyrics component prop type. */
export type { LyricsSyncedProps } from "./components/current/LyricsSynced";
/** Rich current-track components that require explicit named imports. */
export { Chapters, LyricsSynced } from "./components/current";
/** Time and rail component prop types. */
export type {
  BufferRailProps,
  ProgressProps,
  TimeRailProps,
  TimeTextProps,
} from "./components/current/Time";
/** Queue meta component prop types. */
export type {
  QueueIndexProps,
  QueueLengthProps,
  QueuePositionProps,
} from "./components/current/QueueMeta";
/** Queue artwork component prop type. */
export type { QueueArtworkProps } from "./components/queue/QueueDisplay";
/** Control component prop types for headless buttons/sliders/selects. */
export type {
  MuteProps,
  NextProps,
  PlaybackRateProps,
  PlayPauseProps,
  PreviousProps,
  RepeatProps,
  SeekBarProps,
  ShuffleProps,
  VolumeProps,
} from "./components/controls/Controls";

/** Utility parser for LRC-format lyric text. */
export { parseLrc } from "./internal/lyrics";

/** Framework-agnostic store factory wrapping gingerReducer; usable outside React. */
export { createGingerStore } from "./store";
/** Store type exports. */
export type { GingerStore, GingerStoreOptions } from "./store";

/** Playback history entry and hook types. */
export type {
  GingerPlaybackHistoryEntry,
  UseGingerPlaybackHistoryOptions,
  UseGingerPlaybackHistoryResult,
} from "./hooks/useGingerPlaybackHistory";
/** Hook for recording the chronological track play history. */
export { useGingerPlaybackHistory } from "./hooks/useGingerPlaybackHistory";

/** Volume fade options and result types. */
export type {
  UseGingerVolumeFadeOptions,
  UseGingerVolumeFadeResult,
} from "./hooks/useGingerVolumeFade";
/** Hook for smooth volume transitions using requestAnimationFrame. */
export { useGingerVolumeFade } from "./hooks/useGingerVolumeFade";

/** Chapter progress state type. */
export type { GingerChapterProgress } from "./hooks/useGingerChapterProgress";
/** Hook for per-chapter playback progress fractions. */
export { useGingerChapterProgress } from "./hooks/useGingerChapterProgress";
