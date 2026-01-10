"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getReturnUrl } from "@/lib/constants";
import { openTonalliConnect } from "@/lib/tonalli";

type WalletStatus = "disconnected" | "connecting" | "connected";

export type WalletSession = {
  wallet: "tonalli";
  chain: string;
  address?: string;
  pubkey?: string;
  connectedAt: string;
};

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

function readWalletSession(): WalletSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(WALLET_SESSION_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as WalletSession;
  } catch {
    return null;
  }
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
        const nextSession = readWalletSession();
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
      const nextSession = readWalletSession();
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
    openTonalliConnect({ returnUrl: getReturnUrl("/connected") });
    connectInFlightRef.current = false;
  }, [scheduleConnectTimeout, status]);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setSession(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(WALLET_SESSION_STORAGE_KEY);
      window.localStorage.removeItem(CONNECTING_SINCE_KEY);
    }
    clearConnectTimeout();
  }, [clearConnectTimeout]);

  return { status, session, connect, disconnect };
}
