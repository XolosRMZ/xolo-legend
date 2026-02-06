"use client";

import { useEffect, useState } from "react";

type BuyDebug = {
  at: number;
  status: "request" | "broadcasted" | "confirmed" | "error";
  offerId?: string;
  txid?: string;
  error?: string;
  expiryTimestamp?: number;
  ttlSeconds?: number;
  nowSeconds?: number;
  topic?: string;
  chainId?: string;
  requestId?: number;
};

type WcDebugState = {
  lastBuy?: BuyDebug;
};

type Listener = () => void;

let state: WcDebugState = {};
const listeners = new Set<Listener>();

export function getWcDebug() {
  return state;
}

export function updateWcDebug(next: Partial<WcDebugState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeWcDebug(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setLastBuyDebug(next: BuyDebug) {
  updateWcDebug({ lastBuy: next });
}

export function useWcDebug() {
  const [current, setCurrent] = useState<WcDebugState>(() => getWcDebug());

  useEffect(() => {
    return subscribeWcDebug(() => setCurrent(getWcDebug()));
  }, []);

  return current;
}
