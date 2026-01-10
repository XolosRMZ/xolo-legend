"use client";

import { useEffect, useMemo } from "react";

import { openTonalliApp } from "@/lib/tonalli";
import { useOnChain } from "@/state/onchain";

export function RmzOnChainSection() {
  const {
    walletAddress,
    rmzFormatted,
    rmzTokenInfo,
    configWarning,
    refreshRmzInfo,
    refreshRmzBalance
  } = useOnChain();

  useEffect(() => {
    refreshRmzInfo();
  }, [refreshRmzInfo]);

  useEffect(() => {
    if (walletAddress) {
      refreshRmzBalance(walletAddress);
    }
  }, [refreshRmzBalance, walletAddress]);

  const supplyDisplay = useMemo(() => {
    const supply = rmzTokenInfo?.totalSupply ?? rmzTokenInfo?.genesisInfo?.qty;
    if (!supply) {
      return "—";
    }
    return supply;
  }, [rmzTokenInfo?.genesisInfo?.qty, rmzTokenInfo?.totalSupply]);

  return (
    <section className="rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            RMZ Token
          </p>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            On-chain RMZ
          </h1>
          <p className="max-w-2xl text-sm text-white/70">
            Datos reales desde Chronik. Conecta Tonalli para ver tu balance RMZ.
          </p>
          {configWarning ? (
            <div className="mt-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-2 text-xs text-gold">
              {configWarning}. Actions disabled until env vars are set.
            </div>
          ) : null}
        </div>
        <button
          type="button"
          disabled={Boolean(configWarning)}
          onClick={() => openTonalliApp()}
          className="rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-xs text-jade shadow-glow transition hover:border-jade hover:bg-jade/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
        >
          Go to Tonalli
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Name</p>
          <p className="mt-2 text-lg text-white">
            {rmzTokenInfo?.tokenName ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Symbol</p>
          <p className="mt-2 text-lg text-white">
            {rmzTokenInfo?.tokenTicker ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Decimals</p>
          <p className="mt-2 text-lg text-white">
            {rmzTokenInfo?.decimals ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Supply</p>
          <p className="mt-2 text-lg text-white">{supplyDisplay}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Balance</p>
          <p className="mt-2 text-lg text-white">
            {walletAddress ? rmzFormatted ?? "—" : "Connect wallet"}
          </p>
          {walletAddress ? (
            <button
              type="button"
              onClick={() => refreshRmzBalance(walletAddress)}
              className="mt-2 text-[11px] text-jade underline decoration-white/30 underline-offset-4"
            >
              Refresh balance
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
