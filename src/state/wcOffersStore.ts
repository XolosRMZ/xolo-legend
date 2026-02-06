"use client";

import { useCallback, useEffect, useState } from "react";

export type TonalliOfferKind = "nft" | "rmz" | "etoken" | "mintpass";

export type TonalliOfferEventPayload = {
  version?: number;
  offerId: string;
  txid?: string;
  tokenId?: string;
  seller?: string;
  sellerRaw?: string;
  priceXec?: number;
  amount?: string;
  kind: TonalliOfferKind;
  timestamp: number;
  source: "tonalli";
};

export type WcOfferPayload = TonalliOfferEventPayload & {
  liveFromTonalli: true;
  topic: string;
};

type Listener = () => void;

type WcOffer = WcOfferPayload & {
  dismissed?: boolean;
  status?: "live" | "bought";
  purchaseTxid?: string;
};

type TokenMeta = {
  tokenId: string;
  name?: string;
  ticker?: string;
  image?: string;
  url?: string;
};

type TokenMetaStatus = "idle" | "loading" | "loaded" | "error";

type StoreSnapshot = {
  offers: WcOffer[];
  tokenMeta: Record<string, TokenMeta>;
  tokenMetaStatus: Record<string, TokenMetaStatus>;
};

let offers: WcOffer[] = [];
let tokenMetaById: Record<string, TokenMeta> = {};
let tokenMetaStatusById: Record<string, TokenMetaStatus> = {};
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

const OFFER_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeOfferPayload(
  data: unknown
): { offer: TonalliOfferEventPayload; reason?: undefined } | { offer?: undefined; reason: string } {
  if (!data || typeof data !== "object") {
    return { reason: "invalid payload" };
  }
  const payload = data as {
    version?: unknown;
    offerId?: unknown;
    txid?: unknown;
    tokenId?: unknown;
    seller?: unknown;
    priceXec?: unknown;
    listingType?: unknown;
    kind?: unknown;
    timestamp?: unknown;
    ts?: unknown;
    amount?: unknown;
    source?: unknown;
  };
  if (typeof payload.offerId !== "string" || !payload.offerId.trim()) {
    return { reason: "missing offerId" };
  }
  const ts =
    typeof payload.timestamp === "number"
      ? payload.timestamp
      : typeof payload.ts === "number"
        ? payload.ts
        : null;
  if (ts === null) {
    return { reason: "missing timestamp" };
  }
  const kind =
    typeof payload.listingType === "string"
      ? payload.listingType
      : typeof payload.kind === "string"
        ? payload.kind
        : null;
  let normalizedKind: TonalliOfferKind | null = null;
  if (kind === "nft") {
    normalizedKind = "nft";
  } else if (kind === "rmz") {
    normalizedKind = "rmz";
  } else if (kind === "etoken") {
    normalizedKind = "etoken";
  } else if (kind === "mintpass") {
    normalizedKind = "mintpass";
  }
  if (!normalizedKind) {
    return { reason: "unsupported kind" };
  }
  if (payload.tokenId !== undefined && typeof payload.tokenId !== "string") {
    return { reason: "invalid tokenId" };
  }
  if (payload.seller !== undefined && typeof payload.seller !== "string") {
    return { reason: "invalid seller" };
  }
  if (payload.priceXec !== undefined && typeof payload.priceXec !== "number") {
    return { reason: "invalid priceXec" };
  }
  if (payload.txid !== undefined && typeof payload.txid !== "string") {
    return { reason: "invalid txid" };
  }
  if (
    payload.source !== undefined &&
    !(typeof payload.source === "string" && payload.source === "tonalli")
  ) {
    return { reason: "invalid source" };
  }
  if (payload.amount !== undefined) {
    if (typeof payload.amount !== "string" && typeof payload.amount !== "number") {
      return { reason: "invalid amount" };
    }
  }
  const version = typeof payload.version === "number" ? payload.version : undefined;
  const normalizedTimestamp = ts < 1_000_000_000_000 ? ts * 1000 : ts;
  const sellerRaw = typeof payload.seller === "string" ? payload.seller : undefined;
  const seller =
    sellerRaw && sellerRaw.toLowerCase().startsWith("ecash:")
      ? sellerRaw.slice(6)
      : sellerRaw;
  const amount =
    typeof payload.amount === "number"
      ? payload.amount.toString()
      : typeof payload.amount === "string"
        ? payload.amount.trim() || undefined
        : undefined;

  return {
    offer: {
      version,
      offerId: payload.offerId.trim(),
      kind: normalizedKind,
      timestamp: normalizedTimestamp,
      source: "tonalli",
      txid: typeof payload.txid === "string" ? payload.txid : undefined,
      tokenId: typeof payload.tokenId === "string" ? payload.tokenId : undefined,
      seller,
      sellerRaw,
      priceXec: typeof payload.priceXec === "number" ? payload.priceXec : undefined,
      amount
    }
  };
}

export function isTonalliOfferPayload(data: unknown): data is TonalliOfferEventPayload {
  const normalized = normalizeOfferPayload(data);
  return Boolean(normalized && "offer" in normalized && normalized.offer);
}

function cleanupOldOffers(reference = Date.now()) {
  const next = offers.filter((offer) => reference - offer.timestamp <= OFFER_TTL_MS);
  if (next.length !== offers.length) {
    offers = next;
  }
}

export function getWcOffers() {
  return offers;
}

export function getTonalliOffersAll() {
  return getWcOffers();
}

export function getTonalliOffersByKind(kind: TonalliOfferKind) {
  return getWcOffers().filter((offer) => offer.kind === kind);
}

export function addWcOffer(
  raw: unknown,
  meta?: { topic?: string }
): { ok: true; offer: WcOffer } | { ok: false; reason: string } {
  const normalized = normalizeOfferPayload(raw);
  if (!normalized || !("offer" in normalized) || !normalized.offer) {
    const reason = normalized && "reason" in normalized ? normalized.reason : "invalid payload";
    return { ok: false, reason };
  }
  const topic =
    typeof meta?.topic === "string" && meta.topic.trim() ? meta.topic.trim() : "unknown";
  const offer: WcOffer = {
    ...normalized.offer,
    topic,
    liveFromTonalli: true,
    dismissed: false,
    status: "live"
  };
  const matchesSameKey = (item: WcOffer) =>
    item.offerId === offer.offerId && item.topic === offer.topic;
  offers = [
    offer,
    ...offers
      .filter((item) => !matchesSameKey(item))
      .map((item) => ({ ...item }))
  ].sort((a, b) => b.timestamp - a.timestamp);
  cleanupOldOffers();
  notify();
  return { ok: true, offer };
}

export function dismissWcOffer(offerId: string, topic?: string) {
  if (!offerId) return;
  const hasTopic = typeof topic === "string" && topic.trim();
  const next = offers.map((item) =>
    item.offerId === offerId && (!hasTopic || item.topic === topic)
      ? { ...item, dismissed: true }
      : item
  );
  offers = next;
  notify();
}

export function markWcOfferBought(offerId: string) {
  if (!offerId) return;
  const next = offers.map((item) =>
    item.offerId === offerId ? { ...item, status: "bought" as const } : item
  );
  offers = next;
  notify();
}

export function markWcOfferSold(offerId: string, txid?: string) {
  if (!offerId) return;
  const next = offers.map((item) =>
    item.offerId === offerId
      ? { ...item, status: "bought" as const, purchaseTxid: txid }
      : item
  );
  offers = next;
  notify();
}

export function removeWcOffer(offerId: string) {
  if (!offerId) return;
  const next = offers.filter((item) => item.offerId !== offerId);
  if (next.length === offers.length) return;
  offers = next;
  notify();
}

export function clearWcOffers() {
  if (!offers.length) return;
  offers = [];
  notify();
}

export function getTokenMeta() {
  return tokenMetaById;
}

export function getTokenMetaStatus() {
  return tokenMetaStatusById;
}

export function setTokenMeta(tokenId: string, meta: TokenMeta) {
  if (!tokenId) return;
  tokenMetaById = { ...tokenMetaById, [tokenId]: meta };
  tokenMetaStatusById = { ...tokenMetaStatusById, [tokenId]: "loaded" };
  notify();
}

export function setTokenMetaStatus(tokenId: string, status: TokenMetaStatus) {
  if (!tokenId) return;
  tokenMetaStatusById = { ...tokenMetaStatusById, [tokenId]: status };
  notify();
}

export function subscribeWcOffers(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useWcOffers() {
  const [current, setCurrent] = useState<StoreSnapshot>(() => ({
    offers: getTonalliOffersAll(),
    tokenMeta: getTokenMeta(),
    tokenMetaStatus: getTokenMetaStatus()
  }));

  useEffect(() => {
    return subscribeWcOffers(() => {
      setCurrent({
        offers: getTonalliOffersAll(),
        tokenMeta: getTokenMeta(),
        tokenMetaStatus: getTokenMetaStatus()
      });
    });
  }, []);

  const markBought = useCallback((offerId: string, txid?: string) => {
    markWcOfferSold(offerId, txid);
  }, []);

  const dismissOffer = useCallback((offerId: string, topic?: string) => {
    dismissWcOffer(offerId, topic);
  }, []);

  const removeOffer = useCallback((offerId: string) => {
    removeWcOffer(offerId);
  }, []);

  return {
    offers: current.offers,
    tokenMeta: current.tokenMeta,
    tokenMetaStatus: current.tokenMetaStatus,
    markBought,
    dismissOffer,
    removeOffer
  };
}
