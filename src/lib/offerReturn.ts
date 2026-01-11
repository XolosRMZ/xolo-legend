import { parseOfferId } from "@/lib/offerId";

type OfferReturnResult = {
  offerId?: string;
  error?: string;
  consumed: boolean;
};

const OFFER_ID_KEYS = ["offerId", "offer_id", "offer"];
const TXID_KEYS = ["txid", "txId"];
const VOUT_KEYS = ["vout"];

function firstParam(params: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = params.get(key);
    if (value) {
      return value;
    }
  }
  return null;
}

export function parseOfferReturnParams(params: URLSearchParams): OfferReturnResult {
  const offerValue = firstParam(params, OFFER_ID_KEYS);
  if (offerValue) {
    const parsed = parseOfferId(offerValue);
    if (parsed) {
      return { offerId: parsed.raw, consumed: true };
    }
    return { error: "Invalid Offer ID returned from Tonalli.", consumed: true };
  }

  const txid = firstParam(params, TXID_KEYS);
  const vout = firstParam(params, VOUT_KEYS);
  if (txid || vout) {
    if (!txid || !vout) {
      return { error: "Missing txid or vout from Tonalli.", consumed: true };
    }
    const parsed = parseOfferId(`${txid}:${vout}`);
    if (parsed) {
      return { offerId: parsed.raw, consumed: true };
    }
    return { error: "Invalid txid or vout returned from Tonalli.", consumed: true };
  }

  return { consumed: false };
}
