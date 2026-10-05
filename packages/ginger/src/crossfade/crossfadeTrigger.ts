/**
 * Pure trigger logic for when a crossfade should start and how long the fade should run.
 */
export function computeCrossfadeTrigger(
  currentTime: number,
  trackDuration: number,
  configuredDuration: number,
): { shouldStart: boolean; fadeLengthSeconds: number } {
  if (!(trackDuration > 0) || !(configuredDuration > 0)) {
    return { shouldStart: false, fadeLengthSeconds: 0 };
  }

  const fadeSeconds = Math.min(configuredDuration, trackDuration);
  const timeRemaining = trackDuration - currentTime;
  if (timeRemaining <= 0) {
    return { shouldStart: false, fadeLengthSeconds: 0 };
  }

  const fadeWindowStart = trackDuration - fadeSeconds;
  const inFadeWindow = currentTime >= fadeWindowStart && timeRemaining <= fadeSeconds;
  if (!inFadeWindow) {
    return { shouldStart: false, fadeLengthSeconds: 0 };
  }

  const fadeLengthSeconds = Math.min(fadeSeconds, timeRemaining);
  return { shouldStart: true, fadeLengthSeconds };
}
