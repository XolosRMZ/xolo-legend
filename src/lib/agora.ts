import { fetchTx } from "@/lib/chronik";
import { getReturnUrl, TONALLI_WEB_URL } from "@/lib/constants";
import { openTonalliOffer } from "@/lib/tonalli";

let _agoraPromise: Promise<typeof import("ecash-agora")> | null = null;
async function getAgora() {
  if (typeof window === "undefined") {
    throw new Error("Agora client-only");
  }
  if (!_agoraPromise) {
    _agoraPromise = import("ecash-agora");
  }
  return _agoraPromise;
}

export type AgoraOffer = {
  offerTxId: string;
  tokenId?: string;
  amountAtoms?: string;
  priceSats?: number;
  isPartial?: boolean;
  sellerAddress?: string;
};

export type AgoraOfferStatus = "invalid" | "spent" | "not_found";

export type AgoraOfferResult =
  | { ok: true; rawTx: Record<string, unknown>; offer: AgoraOffer; parsed: true }
  | { ok: true; status: "exists"; tx: Record<string, unknown>; parsed: false }
  | {
      ok: false;
      rawTx?: Record<string, unknown>;
      offer?: AgoraOffer;
      status: AgoraOfferStatus;
      error?: string;
    };

async function parseAgoraOfferFromTx(
  tx: Record<string, unknown>
): Promise<{ offer: AgoraOffer; spent: boolean } | null> {
  if (!tx || typeof tx !== "object") {
    return null;
  }
  const { parseAgoraTx } = await getAgora();
  const parsed = parseAgoraTx(tx as Parameters<typeof parseAgoraTx>[0]);
  if (!parsed) {
    return null;
  }
  if (parsed.type !== "ONESHOT") {
    return null;
  }
  const offerTxId = String((tx as { txid?: string }).txid || "");
  const tokenEntries = (tx as { tokenEntries?: Array<{ tokenId?: string }> })
    .tokenEntries;
  const outputs = (tx as {
    outputs?: Array<{ token?: { atoms?: unknown } }>;
  }).outputs;
  const tokenId = tokenEntries?.[0]?.tokenId;
  const atomsValue =
    outputs?.[1]?.token && typeof outputs[1].token === "object"
      ? (outputs[1].token as { atoms?: unknown }).atoms
      : undefined;
  const amountAtoms =
    atomsValue !== undefined && atomsValue !== null ? String(atomsValue) : undefined;
  const askedSats = Number(parsed.params.askedSats());
  return {
    offer: {
      offerTxId,
      tokenId,
      amountAtoms,
      priceSats: Number.isFinite(askedSats) ? askedSats : undefined,
      isPartial: false
    },
    spent: Boolean(parsed.spentBy)
  };
}

export async function loadOfferById(offerTxId: string): Promise<AgoraOfferResult> {
  try {
    const rawTx = await fetchTx(offerTxId);
    if (typeof window === "undefined") {
      return {
        ok: true,
        status: "exists",
        tx: rawTx as Record<string, unknown>,
        parsed: false
      };
    }
    const parsed = await parseAgoraOfferFromTx(rawTx as Record<string, unknown>);
    if (!parsed) {
      return { ok: false, status: "invalid", rawTx: rawTx as Record<string, unknown> };
    }
    if (parsed.spent) {
      return {
        ok: false,
        status: "spent",
        rawTx: rawTx as Record<string, unknown>,
        offer: parsed.offer
      };
    }
    return {
      ok: true,
      rawTx: rawTx as Record<string, unknown>,
      offer: parsed.offer,
      parsed: true
    };
  } catch (error) {
    return {
      ok: false,
      status: "not_found",
      error: error instanceof Error ? error.message : "Chronik error"
    };
  }
}

export async function createSellOfferToken() {
  throw new Error(
    "createSellOfferToken requires ecash-agora/ecash-lib integration."
  );
}

type AcceptOfferByIdArgs = {
  offerId: string;
  returnUrl?: string;
  deepLink?: string;
  fallbackUrl?: string;
};

export async function acceptOfferById({
  offerId,
  returnUrl,
  deepLink,
  fallbackUrl
}: AcceptOfferByIdArgs) {
  const trimmed = offerId.trim();
  if (!trimmed) {
    throw new Error("Missing offerId for acceptOfferById.");
  }
  const encodedOfferId = encodeURIComponent(trimmed);
  const resolvedReturnUrl = returnUrl ?? getReturnUrl(`/tx?offerId=${encodedOfferId}`);
  const encodedReturnUrl = encodeURIComponent(resolvedReturnUrl);
  const attachReturnUrl = (url: string) => {
    if (!url || url.includes("returnUrl=")) {
      return url;
    }
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}returnUrl=${encodedReturnUrl}`;
  };
  const deep = attachReturnUrl(
    deepLink ?? `tonalli://offer/${encodedOfferId}`
  );
  const fallback = attachReturnUrl(
    fallbackUrl ?? `${TONALLI_WEB_URL}?offerId=${encodedOfferId}`
  );
  openTonalliOffer({ offerId: trimmed, deepLink: deep, fallbackUrl: fallback });
}
