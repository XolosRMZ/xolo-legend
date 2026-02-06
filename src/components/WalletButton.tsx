"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { copyText } from "@/lib/clipboard";
import { ConnectRMZModal } from "@/components/ConnectRMZModal";
import { disconnectWalletConnect, initSignClient } from "@/lib/walletconnect";
import {
  clearStoredSession,
  formatAddressShort,
  getActiveAddress,
  getSession,
  restoreWalletSession,
  setStoredSession,
  type TonalliSession,
  type WalletConnectSession,
  useWallet
} from "@/lib/wallet";

type WalletButtonProps = {
  className?: string;
};

export function WalletButton({ className }: WalletButtonProps) {
  const { status, session, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [manualError, setManualError] = useState("");
  const [wcModalOpen, setWcModalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const copiedTimerRef = useRef<number | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void restoreWalletSession();
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (manualOpen) {
      manualInputRef.current?.focus();
    }
  }, [manualOpen]);

  const handleClick = () => {
    if (status === "disconnected") {
      setMenuOpen(false);
      setWcModalOpen(true);
      return;
    }

    if (status === "connected") {
      setMenuOpen((prev) => !prev);
    }
  };

  const handleDisconnect = () => {
    setMenuOpen(false);
    if (session?.type === "walletconnect") {
      void handleWalletConnectDisconnect();
      return;
    }
    disconnect();
  };

  const handleManualToggle = () => {
    setManualError("");
    setManualOpen((prev) => !prev);
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = manualValue.trim();
    if (!/^(ecash:|etoken:)/i.test(trimmed)) {
      setManualError("Pega una dirección ecash: o etoken: válida.");
      return;
    }
    const sessionPayload: TonalliSession = {
      type: "tonalli",
      wallet: "tonalli",
      chain: "ecash",
      address: trimmed,
      connectedAt: new Date().toISOString()
    };
    setStoredSession(sessionPayload);
    setManualValue("");
    setManualError("");
    setManualOpen(false);
  };

  const walletConnectSession =
    session?.type === "walletconnect" ? session : null;
  const tonalliSession = session?.type === "tonalli" ? session : null;
  const activeAddress = getActiveAddress(session);

  const copyValue = activeAddress ?? walletConnectSession?.topic ?? "";
  const copyLabel = activeAddress
    ? "Copiar address"
    : walletConnectSession
      ? "Copiar topic"
      : "";

  const handleCopy = async () => {
    if (!copyValue) {
      return;
    }
    const success = await copyText(copyValue);
    if (!success) {
      return;
    }
    setCopied(true);
    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, 1200);
  };

  const connectedDetail = activeAddress
    ? formatAddressShort(activeAddress)
    : walletConnectSession
      ? walletConnectSession.peer?.name ||
        `WC ${formatAddressShort(walletConnectSession.topic)}`
      : tonalliSession?.pubkey
        ? formatAddressShort(tonalliSession.pubkey)
        : null;

  const label =
    status === "connected"
      ? connectedDetail
        ? `Connected · ${connectedDetail}`
        : "Connected"
      : status === "connecting"
        ? "Esperando Tonalli…"
        : "Connect RMZWallet";

  const handleWalletConnectDisconnect = async () => {
    const latest = getSession();
    if (!latest || latest.type !== "walletconnect") {
      return;
    }
    try {
      const client = await initSignClient();
      await disconnectWalletConnect(client, latest.topic);
    } catch (error) {
      console.warn("Failed to disconnect WalletConnect session", error);
    }
    clearStoredSession("walletconnect");
  };

  const handleWalletConnectConnected = (payload: WalletConnectSession) => {
    setStoredSession(payload);
  };

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-3">
          <button onClick={handleClick} disabled={status === "connecting"} className={className}>
            <span className="inline-flex items-center gap-2">
              {status === "connected" ? (
                <span className="h-2 w-2 rounded-full bg-jade shadow-[0_0_8px_rgba(46,230,163,0.8)]" />
              ) : null}
              {label}
              {status === "connected" && walletConnectSession && activeAddress ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/80">
                  RMZWallet
                </span>
              ) : null}
            </span>
          </button>
          {status === "connecting" ? (
            <button
              type="button"
              onClick={() => void connect()}
              className="text-xs text-white/60 transition hover:text-white"
            >
              Reintentar
            </button>
          ) : null}
        </div>
        {status === "disconnected" ? (
          <button
            type="button"
            onClick={() => void connect()}
            className="text-xs text-white/60 transition hover:text-white"
          >
            Conectar Tonalli
          </button>
        ) : null}
        {status === "connecting" ? (
          <div className="text-xs text-white/60">
            Completa el PIN en Tonalli y espera el regreso automático a XOLOLEGEND.
          </div>
        ) : null}
        {status === "connecting" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleManualToggle}
              className="text-xs text-white/60 transition hover:text-white"
            >
              Pegar address manualmente
            </button>
          </div>
        ) : null}
        {status === "connecting" && manualOpen ? (
          <form
            onSubmit={handleManualSubmit}
            className="w-full max-w-xs rounded-xl border border-white/10 bg-obsidian-950/80 p-3 text-xs text-white/70"
          >
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-white/40">
              Address Tonalli
            </label>
            <input
              ref={manualInputRef}
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              placeholder="ecash:..."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-jade/40"
            />
            {manualError ? <p className="mt-2 text-[11px] text-gold">{manualError}</p> : null}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="submit"
                className="rounded-full border border-jade/40 bg-jade/10 px-3 py-1 text-[11px] text-jade transition hover:bg-jade/20"
              >
                Conectar
              </button>
              <button
                type="button"
                onClick={handleManualToggle}
                className="text-[11px] text-white/60 transition hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </div>
      {status === "connected" && menuOpen ? (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-white/10 bg-obsidian-950/95 p-2 text-xs text-white/80 shadow-lg">
          {copyValue ? (
            <button
              onClick={handleCopy}
              className="mb-2 w-full rounded-lg border border-white/10 px-3 py-2 text-left text-white/70 transition hover:border-white/30 hover:text-white"
            >
              {copied ? "Copied ✓" : copyLabel}
            </button>
          ) : null}
          {walletConnectSession?.topic && activeAddress ? (
            <button
              onClick={async () => {
                const success = await copyText(walletConnectSession.topic);
                if (!success) {
                  return;
                }
                setCopied(true);
                if (copiedTimerRef.current !== null) {
                  window.clearTimeout(copiedTimerRef.current);
                }
                copiedTimerRef.current = window.setTimeout(() => {
                  setCopied(false);
                  copiedTimerRef.current = null;
                }, 1200);
              }}
              className="mb-2 w-full rounded-lg border border-white/10 px-3 py-2 text-left text-white/70 transition hover:border-white/30 hover:text-white"
            >
              {copied ? "Copied ✓" : "Copiar topic"}
            </button>
          ) : null}
          <button
            onClick={handleDisconnect}
            className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Desconectar
          </button>
        </div>
      ) : null}
      <ConnectRMZModal
        open={wcModalOpen}
        onClose={() => setWcModalOpen(false)}
        onConnected={handleWalletConnectConnected}
      />
    </div>
  );
}
