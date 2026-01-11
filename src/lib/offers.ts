import { fetchTx } from "@/lib/chronik";
import { parseOfferId } from "@/lib/offerId";

export type OfferStatus =
  | { ok: true; status: "available"; txid: string; vout: number }
  | { ok: false; status: "spent"; txid: string; vout: number; spentBy?: string }
  | { ok: false; status: "not_found"; txid: string; vout: number }
  | { ok: false; status: "invalid"; error: string };

function isNotFoundError(error: unknown) {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return /404|not found/i.test(message);
}

export async function verifyOfferOutpoint(offerId: string): Promise<OfferStatus> {
  const parsed = parseOfferId(offerId);
  if (!parsed) {
    return { ok: false, status: "invalid", error: "Invalid Offer ID. Expected txid:vout" };
  }
  try {
    const tx = await fetchTx(parsed.txid);
    const outputs = tx.outputs ?? [];
    if (!Array.isArray(outputs) || outputs.length <= parsed.vout) {
      return {
        ok: false,
        status: "invalid",
        error: "Offer output not found in tx"
      };
    }
    const output = outputs[parsed.vout];
    if (!output || typeof output !== "object") {
      return {
        ok: false,
        status: "invalid",
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
        ok: false,
        status: "spent",
        txid: parsed.txid,
        vout: parsed.vout,
        spentBy
      };
    }
    return { ok: true, status: "available", txid: parsed.txid, vout: parsed.vout };
  } catch (error) {
    if (isNotFoundError(error)) {
      return { ok: false, status: "not_found", txid: parsed.txid, vout: parsed.vout };
    }
    return {
      ok: false,
      status: "not_found",
      txid: parsed.txid,
      vout: parsed.vout
    };
  }
}
