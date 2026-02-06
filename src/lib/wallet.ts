"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getReturnUrl } from "@/lib/constants";
import { openTonalliConnect } from "@/lib/tonalli";
import { requestAddresses, validateSession } from "@/lib/walletconnect";

type WalletStatus = "disconnected" | "connecting" | "connected";

export type TonalliSession = {
  type: "tonalli";
  wallet: "tonalli";
  chain: "ecash";
  address: string;
  pubkey?: string;
  signature?: string;
  requestId?: string;
  nonce?: string;
  ts?: string;
  origin?: string;
  connectedAt?: string;
};

export type WalletConnectSession = {
  type: "walletconnect";
  wallet: "rmzwallet";
  chain: "ecash:mainnet";
  topic: string;
  pairingTopic?: string;
  peer?: { name?: string; url?: string; icons?: string[] };
  address?: string;
  pubkey?: string;
  connectedAt: string;
};

export type WalletSession = TonalliSession | WalletConnectSession;

type WalletState = {
  status: WalletStatus;
  session: WalletSession | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

export const WALLET_SESSION_STORAGE_KEY = "xololegend_wallet_session";
const CONNECTING_SINCE_KEY = "xololegend_wallet_connecting_since";
const CONNECT_TIMEOUT_MS = 30_000;
const LEGACY_STATUS_KEY = "xololegend_wallet_status";
const SESSION_EVENT = "xololegend_wallet_session_updated";

type WalletRecord = Record<string, unknown>;

function isRecord(value: unknown): value is WalletRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeTonalliSession(record: WalletRecord): TonalliSession | null {
  if (record.wallet !== "tonalli" && record.type !== "tonalli") {
    return null;
  }
  if (typeof record.address !== "string" || !record.address) {
    return null;
  }
  const connectedAt =
    typeof record.connectedAt === "string" ? record.connectedAt : new Date().toISOString();
  const session: TonalliSession = {
    type: "tonalli",
    wallet: "tonalli",
    chain: "ecash",
    address: record.address,
    connectedAt
  };

  if (typeof record.pubkey === "string") {
    session.pubkey = record.pubkey;
  }
  if (typeof record.signature === "string") {
    session.signature = record.signature;
  }
  if (typeof record.requestId === "string") {
    session.requestId = record.requestId;
  }
  if (typeof record.nonce === "string") {
    session.nonce = record.nonce;
  }
  if (typeof record.ts === "string") {
    session.ts = record.ts;
  }
  if (typeof record.origin === "string") {
    session.origin = record.origin;
  }

  return session;
}

function normalizeWalletConnectSession(record: WalletRecord): WalletConnectSession | null {
  if (record.wallet !== "rmzwallet" && record.type !== "walletconnect") {
    return null;
  }
  if (typeof record.topic !== "string" || !record.topic) {
    return null;
  }
  const connectedAt =
    typeof record.connectedAt === "string" ? record.connectedAt : new Date().toISOString();
  const session: WalletConnectSession = {
    type: "walletconnect",
    wallet: "rmzwallet",
    chain: "ecash:mainnet",
    topic: record.topic,
    connectedAt
  };

  if (typeof record.address === "string") {
    session.address = record.address;
  }
  if (typeof record.pubkey === "string") {
    session.pubkey = record.pubkey;
  }
  if (typeof record.pairingTopic === "string") {
    session.pairingTopic = record.pairingTopic;
  }
  if (isRecord(record.peer)) {
    const peer: WalletConnectSession["peer"] = {};
    if (typeof record.peer.name === "string") {
      peer.name = record.peer.name;
    }
    if (typeof record.peer.url === "string") {
      peer.url = record.peer.url;
    }
    if (Array.isArray(record.peer.icons)) {
      peer.icons = record.peer.icons.filter((value) => typeof value === "string");
    }
    if (peer.name || peer.url || peer.icons?.length) {
      session.peer = peer;
    }
  }

  return session;
}

export function getStoredSession(): WalletSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(WALLET_SESSION_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }
    if (parsed.type === "walletconnect") {
      return normalizeWalletConnectSession(parsed);
    }
    if (parsed.type === "tonalli") {
      return normalizeTonalliSession(parsed);
    }
    if (parsed.wallet === "rmzwallet") {
      return normalizeWalletConnectSession(parsed);
    }
    if (parsed.wallet === "tonalli") {
      return normalizeTonalliSession(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

export function getSession(): WalletSession | null {
  return getStoredSession();
}

export function getSessionType(
  session?: WalletSession | null
): WalletSession["type"] | null {
  return session?.type ?? null;
}

export function getActiveAddress(session?: WalletSession | null): string | null {
  if (!session) {
    return null;
  }
  if (session.type === "tonalli") {
    return session.address;
  }
  if (session.type === "walletconnect") {
    return session.address ?? null;
  }
  return null;
}

export function setStoredSession(session: WalletSession) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(WALLET_SESSION_STORAGE_KEY, JSON.stringify(session));
  notifyWalletSessionUpdated();
}

export function clearStoredSession(type?: WalletSession["type"]) {
  if (typeof window === "undefined") {
    return;
  }
  if (!type) {
    window.localStorage.removeItem(WALLET_SESSION_STORAGE_KEY);
    notifyWalletSessionUpdated();
    return;
  }
  const existing = getStoredSession();
  if (!existing || existing.type !== type) {
    return;
  }
  window.localStorage.removeItem(WALLET_SESSION_STORAGE_KEY);
  notifyWalletSessionUpdated();
}

export function setWalletConnectAddress(address: string) {
  if (typeof window === "undefined") {
    return;
  }
  const trimmed = address.trim();
  if (!trimmed) {
    return;
  }
  const existing = getStoredSession();
  if (!existing || existing.type !== "walletconnect") {
    return;
  }
  if (existing.address === trimmed) {
    return;
  }
  setStoredSession({ ...existing, address: trimmed });
}

let restorePromise: Promise<void> | null = null;

export async function restoreWalletSession() {
  if (restorePromise) {
    return restorePromise;
  }
  restorePromise = (async () => {
    if (typeof window === "undefined") {
      return;
    }
    if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
      return;
    }
    const stored = getStoredSession();
    if (!stored || stored.type !== "walletconnect") {
      return;
    }
    const result = await validateSession(stored.topic);
    if (!result.ok) {
      clearStoredSession("walletconnect");
      return;
    }
    const peerMetadata = result.session.peer?.metadata;
    const nextPeer =
      peerMetadata
        ? {
            name: peerMetadata.name,
            url: peerMetadata.url,
            icons: peerMetadata.icons
          }
        : undefined;
    const prevPeer = stored.peer;
    const peerChanged =
      (nextPeer?.name ?? "") !== (prevPeer?.name ?? "") ||
      (nextPeer?.url ?? "") !== (prevPeer?.url ?? "") ||
      JSON.stringify(nextPeer?.icons ?? []) !== JSON.stringify(prevPeer?.icons ?? []);

    if (peerChanged) {
      setStoredSession({
        ...stored,
        peer: nextPeer
      });
    }

    if (!stored.address) {
      const addresses = await requestAddresses(stored.topic);
      const [first] = addresses ?? [];
      if (first) {
        setWalletConnectAddress(first);
      }
    }
  })();
  return restorePromise;
}

function readConnectingSince(): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(CONNECTING_SINCE_KEY);
  if (!stored) {
    return null;
  }
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : null;
}

function clearConnectingSince() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(CONNECTING_SINCE_KEY);
}

function setConnectingSince(timestamp: number) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CONNECTING_SINCE_KEY, String(timestamp));
}

export function notifyWalletSessionUpdated() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function formatAddressShort(value: string) {
  if (value.length > 18) {
    return `${value.slice(0, 10)}…${value.slice(-4)}`;
  }
  return value;
}

// MVP / UX-only connector state (no signing or address retrieval).
export function useWallet(): WalletState {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [session, setSession] = useState<WalletSession | null>(null);
  const connectInFlightRef = useRef(false);
  const connectTimeoutRef = useRef<number | null>(null);

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current !== null) {
      window.clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  const scheduleConnectTimeout = useCallback(
    (remainingMs: number) => {
      clearConnectTimeout();
      connectTimeoutRef.current = window.setTimeout(() => {
        const nextSession = getStoredSession();
        if (!nextSession) {
          setStatus("disconnected");
          setSession(null);
          clearConnectingSince();
        }
        clearConnectTimeout();
      }, remainingMs);
    },
    [clearConnectTimeout]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_STATUS_KEY);
    }

    const sync = () => {
      const nextSession = getStoredSession();
      setSession(nextSession);
      if (nextSession) {
        setStatus("connected");
        clearConnectingSince();
        clearConnectTimeout();
        return;
      }

      const connectingSince = readConnectingSince();
      if (connectingSince) {
        const elapsed = Date.now() - connectingSince;
        if (elapsed >= CONNECT_TIMEOUT_MS) {
          clearConnectingSince();
          setStatus("disconnected");
          clearConnectTimeout();
        } else {
          setStatus("connecting");
          scheduleConnectTimeout(CONNECT_TIMEOUT_MS - elapsed);
        }
      } else {
        setStatus("disconnected");
        clearConnectTimeout();
      }
    };

    sync();

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === WALLET_SESSION_STORAGE_KEY ||
        event.key === CONNECTING_SINCE_KEY
      ) {
        sync();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SESSION_EVENT, sync);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SESSION_EVENT, sync);
      clearConnectTimeout();
    };
  }, [clearConnectTimeout, scheduleConnectTimeout]);

  const connect = useCallback(async () => {
    if (status === "connected" || connectInFlightRef.current) {
      return;
    }

    connectInFlightRef.current = true;
    setStatus("connecting");
    setConnectingSince(Date.now());
    scheduleConnectTimeout(CONNECT_TIMEOUT_MS);
    const returnUrl = getReturnUrl("/connected");
    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet] returnUrl=", returnUrl);
    }
    openTonalliConnect({ returnUrl });
    connectInFlightRef.current = false;
  }, [scheduleConnectTimeout, status]);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setSession(null);
    clearStoredSession();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CONNECTING_SINCE_KEY);
    }
    clearConnectTimeout();
  }, [clearConnectTimeout]);

  return { status, session, connect, disconnect };
}
