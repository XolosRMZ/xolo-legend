import { fetchTx } from "@/lib/chronik";

export type AgoraOffer = {
  offerTxId: string;
  tokenId?: string;
  tokenAmountAtoms?: string;
  priceSatoshis?: string;
  sellerAddress?: string;
};

export type AgoraOfferResult = {
  rawTx: Record<string, unknown>;
  offer: AgoraOffer | null;
};

function parseAgoraOfferFromTx(tx: Record<string, unknown>): AgoraOffer | null {
  // Placeholder: real parsing should use ecash-agora or equivalent modules.
  if (!tx || typeof tx !== "object") {
    return null;
  }
  return null;
}

export async function loadOfferById(offerTxId: string): Promise<AgoraOfferResult> {
  const rawTx = await fetchTx(offerTxId);
  const offer = parseAgoraOfferFromTx(rawTx as Record<string, unknown>);
  return { rawTx: rawTx as Record<string, unknown>, offer };
}

export async function createSellOfferToken() {
  throw new Error(
    "createSellOfferToken requires ecash-agora/ecash-lib integration."
  );
}

export async function acceptOfferById() {
  throw new Error("acceptOfferById requires ecash-agora/ecash-lib integration.");
}
