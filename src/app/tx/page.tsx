"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { fetchBlockchainInfo, fetchTx, type ChronikTx } from "@/lib/chronik";

type TxState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; tx: ChronikTx; confirmations?: number };

function readTxidParam(params: URLSearchParams) {
  return params.get("txid")?.trim() ?? "";
}

export default function TxPage() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId")?.trim() ?? "";
  const initialTxid = readTxidParam(searchParams);
  const [txid, setTxid] = useState(initialTxid);
  const [input, setInput] = useState(initialTxid);
  const [txState, setTxState] = useState<TxState>({ status: "idle" });

  useEffect(() => {
    setTxid(initialTxid);
    setInput(initialTxid);
  }, [initialTxid]);

  useEffect(() => {
    if (!txid) {
      setTxState({ status: "idle" });
      return;
    }
    let active = true;
    const run = async () => {
      setTxState({ status: "loading" });
      try {
        const [tx, chainInfo] = await Promise.all([
          fetchTx(txid),
          fetchBlockchainInfo()
        ]);
        const block = (tx as { block?: { height?: number } }).block;
        const tipHeight = chainInfo?.tipHeight ?? 0;
        const confirmations =
          typeof block?.height === "number" && tipHeight >= block.height
            ? tipHeight - block.height + 1
            : undefined;
        if (active) {
          setTxState({ status: "success", tx, confirmations });
        }
      } catch (error) {
        if (active) {
          setTxState({
            status: "error",
            message: error instanceof Error ? error.message : "Transaction not found"
          });
        }
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [txid]);

  const statusLabel = useMemo(() => {
    if (txState.status === "idle") {
      return "Waiting for transaction";
    }
    if (txState.status === "loading") {
      return "Checking Chronik...";
    }
    if (txState.status === "error") {
      return "Not found";
    }
    return "Confirmed";
  }, [txState.status]);

  return (
    <section className="rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Tx Status</p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            {statusLabel}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {offerId
              ? `Offer ID (txid:vout): ${offerId}`
              : "Paste a txid to verify your purchase."}
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-obsidian-950/70 px-4 py-1 text-xs text-white/60">
          {txState.status === "success" && txState.confirmations !== undefined
            ? `${txState.confirmations} confirmations`
            : "Awaiting txid"}
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-obsidian-950/60 p-4">
        <label className="block text-[11px] uppercase tracking-[0.3em] text-white/40">
          Transaction ID
        </label>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste TXID"
          className="w-full rounded-xl border border-white/10 bg-obsidian-950/70 px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTxid(input.trim())}
            className="rounded-full border border-jade/40 bg-jade/10 px-4 py-2 text-xs text-jade shadow-glow transition hover:border-jade hover:bg-jade/20"
          >
            Verify transaction
          </button>
          {txState.status === "error" ? (
            <span className="text-xs text-gold">{txState.message}</span>
          ) : null}
        </div>
        {txState.status === "success" ? (
          <div className="text-xs text-white/70">
            {txState.confirmations !== undefined
              ? `Confirmed with ${txState.confirmations} confirmations.`
              : "Transaction broadcasted, awaiting confirmations."}
          </div>
        ) : null}
      </div>
    </section>
  );
}
