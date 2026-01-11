import { fetchTx } from "@/lib/chronik";
import { extractOfferTermsFromOutpoint, type OfferTerms } from "@/lib/offerTerms";
import { parseOfferId } from "@/lib/offerId";

export type VerifiedOffer =
  | {
      availability: "available";
      txid: string;
      vout: number;
      terms?: OfferTerms;
      termsStatus: "onchain" | "manual";
    }
  | { availability: "spent"; txid: string; vout: number; spentBy?: string }
  | { availability: "not_found"; txid: string; vout: number }
  | { availability: "invalid"; error: string };

function isNotFoundError(error: unknown) {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return /404|not found/i.test(message);
}

export async function verifyOfferOutpoint(
  offerId: string
): Promise<VerifiedOffer> {
  const parsed = parseOfferId(offerId);
  if (!parsed) {
    return {
      availability: "invalid",
      error: "Invalid Offer ID. Expected txid:vout"
    };
  }
  try {
    const tx = await fetchTx(parsed.txid);
    const outputs = tx.outputs ?? [];
    if (!Array.isArray(outputs) || outputs.length <= parsed.vout) {
      return {
        availability: "invalid",
        error: "Offer output not found in tx"
      };
    }
    const output = outputs[parsed.vout];
    if (!output || typeof output !== "object") {
      return {
        availability: "invalid",
        error: "Offer output not found in tx"
      };
    }
    const spentByOutput = (output as { spentBy?: { txid?: string; outIdx?: number } })
      .spentBy;
    const hasSpentBy = Boolean(spentByOutput?.txid);
    const spentBy = hasSpentBy
      ? `${spentByOutput?.txid}:${spentByOutput?.outIdx ?? 0}`
      : undefined;
    const isSpentFlag =
      "isSpent" in output ? Boolean((output as { isSpent?: boolean }).isSpent) : false;
    if (hasSpentBy || isSpentFlag) {
      return {
        availability: "spent",
        txid: parsed.txid,
        vout: parsed.vout,
        spentBy
      };
    }
    const terms = await extractOfferTermsFromOutpoint(parsed.txid, parsed.vout);
    const termsStatus: "onchain" | "manual" = terms ? "onchain" : "manual";
    return {
      availability: "available",
      txid: parsed.txid,
      vout: parsed.vout,
      terms: terms ?? undefined,
      termsStatus
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return { availability: "not_found", txid: parsed.txid, vout: parsed.vout };
    }
    return {
      availability: "not_found",
      txid: parsed.txid,
      vout: parsed.vout
    };
  }
}
