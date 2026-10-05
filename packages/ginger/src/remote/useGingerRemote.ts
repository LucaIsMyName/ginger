import { useCallback, useEffect, useRef, useState } from "react";
import { useGinger } from "../hooks/useGinger";
import type { GingerInitPayload } from "../types";
import { DEFAULT_REMOTE_CHANNEL_NAME, type RemoteMessage } from "./remoteProtocol";
import { validateGingerInitPayloadDev } from "./validateGingerInitPayloadDev";

export type UseGingerRemoteOptions = {
  /** BroadcastChannel name. Default: `"ginger-remote"`. */
  channelName?: string;
  /** Leader heartbeat interval in ms. Default: `2000`. */
  heartbeatMs?: number;
  /** Time to wait for an existing leader before claiming leadership. Default: `300`. */
  electionTimeoutMs?: number;
};

export type UseGingerRemoteResult = {
  isLeader: boolean;
  isFollower: boolean;
  /** True until a leader is elected or this tab becomes leader. */
  isPending: boolean;
  connectedTabs: number;
  /** Request leadership (other tabs may win if their `tabId` is lexicographically smaller). */
  claimLeadership: () => void;
  error: string | null;
};

function makeTabId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ginger-tab-${Math.random().toString(36).slice(2)}`;
}

/**
 * Multi-tab coordination via `BroadcastChannel`: elects a single leader tab and syncs
 * playback state to followers with `INIT` snapshots.
 *
 * Mount `Ginger.Player` only on the leader tab so one `<audio>` element plays:
 *
 * ```tsx
 * const { isLeader } = useGingerRemote();
 * return <>{isLeader && <Ginger.Player />}</>;
 * ```
 *
 * ```ts
 * import { useGingerRemote } from "@lucaismyname/ginger/remote";
 * ```
 *
 * **Limitations:** Followers receive coarse `STATE_SNAPSHOT` updates plus `TIME_SYNC` roughly
 * every second when drift exceeds ~0.5s — not sample-accurate lockstep. Media errors and
 * buffering state are not replicated; only the leader should mount `Ginger.Player`. Queue order
 * in snapshots is authoritative; `isShuffled` reflects the leader UI flag.
 */
export function useGingerRemote(options: UseGingerRemoteOptions = {}): UseGingerRemoteResult {
  const {
    channelName = DEFAULT_REMOTE_CHANNEL_NAME,
    heartbeatMs = 2000,
    electionTimeoutMs = 300,
  } = options;

  const { state, init, seek } = useGinger();

  const tabIdRef = useRef<string>("");
  if (tabIdRef.current === "") {
    tabIdRef.current = makeTabId();
  }

  const [role, setRole] = useState<"pending" | "leader" | "follower">("pending");
  const [connectedTabs, setConnectedTabs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const roleRef = useRef(role);
  roleRef.current = role;

  const initRef = useRef(init);
  initRef.current = init;
  const seekRef = useRef(seek);
  seekRef.current = seek;
  const stateRef = useRef(state);
  stateRef.current = state;

  const channelRef = useRef<BroadcastChannel | null>(null);
  const knownTabsRef = useRef<Set<string>>(new Set());
  const lastHeartbeatAtRef = useRef<number>(Date.now());
  const electionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const leaderWatchRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const post = useCallback((msg: RemoteMessage) => {
    channelRef.current?.postMessage(msg);
  }, []);

  const clearElectionTimer = useCallback(() => {
    if (electionTimerRef.current) {
      clearTimeout(electionTimerRef.current);
      electionTimerRef.current = null;
    }
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      setError("BroadcastChannel is not available in this environment");
      return;
    }

    setError(null);
    const ch = new BroadcastChannel(channelName);
    channelRef.current = ch;
    knownTabsRef.current = new Set([tabIdRef.current]);

    const postMsg = (msg: RemoteMessage) => {
      ch.postMessage(msg);
    };

    const startLeaderHeartbeat = () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      heartbeatTimerRef.current = setInterval(() => {
        const leaderId = tabIdRef.current;
        knownTabsRef.current.add(leaderId);
        const count = knownTabsRef.current.size;
        setConnectedTabs(count);
        postMsg({ type: "HEARTBEAT", tabId: leaderId, connectedCount: count });
      }, heartbeatMs);
    };

    const becomeFollower = () => {
      clearElectionTimer();
      stopHeartbeat();
      setRole("follower");
      roleRef.current = "follower";
    };

    const becomeLeaderFromRemote = () => {
      clearElectionTimer();
      setRole("leader");
      roleRef.current = "leader";
      knownTabsRef.current.add(tabIdRef.current);
      postMsg({ type: "LEADER_ANNOUNCE", tabId: tabIdRef.current });
      startLeaderHeartbeat();
    };

    const scheduleElection = () => {
      clearElectionTimer();
      electionTimerRef.current = setTimeout(() => {
        if (roleRef.current === "pending") {
          setRole("leader");
          roleRef.current = "leader";
          knownTabsRef.current.add(tabIdRef.current);
          postMsg({ type: "LEADER_ANNOUNCE", tabId: tabIdRef.current });
          startLeaderHeartbeat();
        }
      }, electionTimeoutMs);
    };

    const onMessage = (ev: MessageEvent<RemoteMessage>) => {
      const msg = ev.data;
      if (!msg || typeof msg !== "object" || !("type" in msg)) return;

      const myId = tabIdRef.current;

      switch (msg.type) {
        case "PING": {
          knownTabsRef.current.add(msg.tabId);
          if (roleRef.current === "leader") {
            postMsg({ type: "PONG", tabId: myId, leaderTabId: myId });
          }
          break;
        }
        case "PONG": {
          if (msg.leaderTabId && msg.leaderTabId !== myId) {
            becomeFollower();
            lastHeartbeatAtRef.current = Date.now();
          }
          break;
        }
        case "LEADER_ANNOUNCE": {
          if (msg.tabId === myId) break;
          knownTabsRef.current.add(msg.tabId);
          if (msg.tabId < myId) {
            becomeFollower();
            lastHeartbeatAtRef.current = Date.now();
          } else if (
            msg.tabId > myId &&
            (roleRef.current === "pending" || roleRef.current === "leader")
          ) {
            becomeLeaderFromRemote();
          }
          break;
        }
        case "LEADER_RESIGN": {
          if (msg.tabId === myId) break;
          lastHeartbeatAtRef.current = Date.now();
          if (roleRef.current === "follower") {
            setRole("pending");
            roleRef.current = "pending";
            postMsg({ type: "PING", tabId: myId });
            scheduleElection();
          }
          break;
        }
        case "HEARTBEAT": {
          if (roleRef.current === "follower") {
            lastHeartbeatAtRef.current = Date.now();
            setConnectedTabs(msg.connectedCount);
          }
          break;
        }
        case "STATE_SNAPSHOT": {
          if (roleRef.current === "follower" && msg.tabId !== myId) {
            const nodeEnv =
              typeof globalThis !== "undefined" && "process" in globalThis
                ? (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
                    ?.NODE_ENV
                : undefined;
            if (!validateGingerInitPayloadDev(msg.snapshot)) {
              if (nodeEnv != null && nodeEnv !== "production") {
                console.warn(
                  "[@lucaismyname/ginger] ignored STATE_SNAPSHOT: invalid GingerInitPayload",
                );
              }
              break;
            }
            initRef.current(msg.snapshot);
          }
          break;
        }
        case "TIME_SYNC": {
          if (
            roleRef.current === "follower" &&
            msg.tabId !== myId &&
            Number.isFinite(msg.currentTime)
          ) {
            seekRef.current(msg.currentTime, msg.duration);
          }
          break;
        }
        default:
          break;
      }
    };

    ch.addEventListener("message", onMessage);

    postMsg({ type: "PING", tabId: tabIdRef.current });

    electionTimerRef.current = setTimeout(() => {
      if (roleRef.current === "pending") {
        setRole("leader");
        roleRef.current = "leader";
        knownTabsRef.current.add(tabIdRef.current);
        postMsg({ type: "LEADER_ANNOUNCE", tabId: tabIdRef.current });
        startLeaderHeartbeat();
      }
    }, electionTimeoutMs);

    leaderWatchRef.current = setInterval(() => {
      if (roleRef.current !== "follower") return;
      if (Date.now() - lastHeartbeatAtRef.current > heartbeatMs * 2) {
        setRole("pending");
        roleRef.current = "pending";
        postMsg({ type: "PING", tabId: tabIdRef.current });
        scheduleElection();
      }
    }, heartbeatMs);

    const onPageHide = () => {
      if (roleRef.current === "leader") {
        postMsg({ type: "LEADER_RESIGN", tabId: tabIdRef.current });
      }
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      clearElectionTimer();
      stopHeartbeat();
      if (leaderWatchRef.current) {
        clearInterval(leaderWatchRef.current);
        leaderWatchRef.current = null;
      }
      ch.removeEventListener("message", onMessage);
      if (roleRef.current === "leader") {
        postMsg({ type: "LEADER_RESIGN", tabId: tabIdRef.current });
      }
      ch.close();
      channelRef.current = null;
    };
  }, [channelName, clearElectionTimer, electionTimeoutMs, heartbeatMs, stopHeartbeat]);

  useEffect(() => {
    if (role !== "leader") return;
    const latest = stateRef.current;
    const snapshot: GingerInitPayload = {
      tracks: state.tracks,
      currentIndex: state.currentIndex,
      playlistMeta: state.playlistMeta,
      isPaused: state.isPaused,
      /** Queue order in `tracks` is canonical; flag mirrors leader UI state. */
      isShuffled: state.isShuffled,
      repeatMode: state.repeatMode,
      playbackMode: state.playbackMode,
      volume: state.volume,
      muted: state.muted,
      playbackRate: state.playbackRate,
      currentTime: latest.currentTime,
    };
    post({
      type: "STATE_SNAPSHOT",
      tabId: tabIdRef.current,
      snapshot,
    });
  }, [
    role,
    state.tracks,
    state.currentIndex,
    state.isPaused,
    state.isShuffled,
    state.repeatMode,
    state.playbackMode,
    state.playlistMeta,
    state.volume,
    state.muted,
    state.playbackRate,
    post,
  ]);

  useEffect(() => {
    if (role !== "leader") return;
    let lastSent = stateRef.current.currentTime;
    const id = setInterval(() => {
      const latest = stateRef.current;
      if (Math.abs(latest.currentTime - lastSent) < 0.5) return;
      lastSent = latest.currentTime;
      post({
        type: "TIME_SYNC",
        tabId: tabIdRef.current,
        currentTime: latest.currentTime,
        duration: latest.duration,
      });
    }, 1000);
    return () => clearInterval(id);
  }, [role, post]);

  const claimLeadership = useCallback(() => {
    clearElectionTimer();
    stopHeartbeat();
    setRole("leader");
    roleRef.current = "leader";
    knownTabsRef.current.add(tabIdRef.current);
    post({ type: "LEADER_ANNOUNCE", tabId: tabIdRef.current });
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    heartbeatTimerRef.current = setInterval(() => {
      const leaderId = tabIdRef.current;
      knownTabsRef.current.add(leaderId);
      const count = knownTabsRef.current.size;
      setConnectedTabs(count);
      post({ type: "HEARTBEAT", tabId: leaderId, connectedCount: count });
    }, heartbeatMs);
  }, [clearElectionTimer, heartbeatMs, post, stopHeartbeat]);

  return {
    isLeader: role === "leader",
    isFollower: role === "follower",
    isPending: role === "pending",
    connectedTabs,
    claimLeadership,
    error,
  };
}
