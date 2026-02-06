"use client";

import SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";

const CLIENT_METADATA = {
  name: "XOLOLEGEND",
  description: "XOLOLEGEND RMZ marketplace",
  url: "https://xololegend.com",
  icons: ["https://xololegend.com/icon.png"]
};

let clientPromise: Promise<SignClient> | null = null;

export async function initSignClient() {
  if (!clientPromise) {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID");
    }
    const metadataUrl =
      process.env.NODE_ENV === "production"
        ? CLIENT_METADATA.url
        : typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin
          : CLIENT_METADATA.url;
    clientPromise = SignClient.init({
      projectId,
      metadata: {
        ...CLIENT_METADATA,
        url: metadataUrl
      }
    });
  }
  const client = await clientPromise;
  return client;
}

export async function validateSession(
  topic: string
): Promise<{ ok: true; session: SessionTypes.Struct } | { ok: false }> {
  try {
    const client = await initSignClient();
    const session = client.session.get(topic);
    if (!session) {
      return { ok: false };
    }
    return { ok: true, session };
  } catch {
    return { ok: false };
  }
}

export async function connectWalletConnect(
  client: SignClient,
  options?: { events?: string[] }
): Promise<{
  uri: string;
  approval: () => Promise<SessionTypes.Struct>;
}> {
  const events = Array.from(
    new Set([...(options?.events ?? []), "xolos_offer_published", "xolos_offer_consumed"])
  );
  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      ecash: {
        chains: ["ecash:mainnet"],
        methods: [
          "ecash_getAddresses",
          "ecash_signAndBroadcastTransaction"
        ],
        events
      }
    }
  });

  if (!uri) {
    throw new Error("WalletConnect did not return a URI.");
  }

  return { uri, approval };
}

export async function requestAddresses(topic: string): Promise<string[] | null> {
  if (!topic) {
    return null;
  }
  try {
    const client = await initSignClient();
    const response = await client.request({
      topic,
      chainId: "ecash:mainnet",
      request: { method: "ecash_getAddresses", params: [] }
    });
    if (Array.isArray(response)) {
      return response.filter((value) => typeof value === "string");
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[walletconnect] requestAddresses failed", error);
    }
    return null;
  }
}

export async function requestSignAndBroadcast({
  topic,
  offerId,
  timeoutMs,
  ttlSeconds,
  requestId
}: {
  topic: string;
  offerId: string;
  timeoutMs?: number;
  ttlSeconds?: number;
  requestId?: number;
}): Promise<unknown> {
  if (!topic) {
    throw new Error("Missing WalletConnect topic.");
  }
  const trimmed = offerId?.trim();
  if (!trimmed) {
    throw new Error("Missing offerId.");
  }
  const client = await initSignClient();
  const ttlSecondsRaw =
    typeof ttlSeconds === "number" && Number.isFinite(ttlSeconds)
      ? Math.floor(ttlSeconds)
      : typeof timeoutMs === "number"
        ? Math.ceil(timeoutMs / 1000)
        : 300;
  const clampedTtlSeconds = Math.min(604800, Math.max(300, ttlSecondsRaw));
  return client.request({
    topic,
    chainId: "ecash:mainnet",
    request: {
      method: "ecash_signAndBroadcastTransaction",
      params: { offerId: trimmed }
    },
    expiry: clampedTtlSeconds
  });
}

export type WalletConnectBuyResponse = {
  txid: string;
};

export function isWalletConnectBuyResponse(
  payload: unknown
): payload is WalletConnectBuyResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const txid = (payload as { txid?: unknown }).txid;
  return typeof txid === "string" && /^[0-9a-fA-F]{64}$/.test(txid);
}

export function extractWalletConnectTxid(payload: unknown): string | null {
  if (typeof payload === "string") {
    return /^[0-9a-fA-F]{64}$/.test(payload) ? payload : null;
  }
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const txid = (payload as { txid?: unknown }).txid;
  return typeof txid === "string" && /^[0-9a-fA-F]{64}$/.test(txid) ? txid : null;
}

export async function disconnectWalletConnect(client: SignClient, topic: string) {
  if (!topic) {
    return;
  }
  const session = client.session.get(topic);
  if (!session) {
    return;
  }
  await client.disconnect({
    topic,
    reason: { code: 6000, message: "User disconnected" }
  });
}
