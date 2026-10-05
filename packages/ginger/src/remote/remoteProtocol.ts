import type { GingerInitPayload } from "../types";

export const DEFAULT_REMOTE_CHANNEL_NAME = "ginger-remote";

/**
 * Cross-tab messages for {@link useGingerRemote}.
 */
export type RemoteMessage =
  | { type: "PING"; tabId: string }
  | { type: "PONG"; tabId: string; leaderTabId: string }
  | { type: "LEADER_ANNOUNCE"; tabId: string }
  | { type: "LEADER_RESIGN"; tabId: string }
  | { type: "HEARTBEAT"; tabId: string; connectedCount: number }
  | { type: "STATE_SNAPSHOT"; tabId: string; snapshot: GingerInitPayload }
  | { type: "TIME_SYNC"; tabId: string; currentTime: number; duration: number };
