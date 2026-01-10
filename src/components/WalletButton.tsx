"use client";

import { useEffect, useRef, useState } from "react";

import { copyText } from "@/lib/clipboard";
import { formatAddressShort, useWallet } from "@/lib/wallet";

type WalletButtonProps = {
  className?: string;
};

export function WalletButton({ className }: WalletButtonProps) {
  const { status, session, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

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

  const handleClick = () => {
    if (status === "disconnected") {
      setMenuOpen(false);
      void connect();
      return;
    }

    if (status === "connected") {
      setMenuOpen((prev) => !prev);
    }
  };

  const handleDisconnect = () => {
    setMenuOpen(false);
    disconnect();
  };

  const copyValue = session?.address ?? session?.pubkey ?? "";
  const copyLabel = session?.address ? "Copy address" : session?.pubkey ? "Copy pubkey" : "";

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

  const connectedDetail = session?.address
    ? formatAddressShort(session.address)
    : session?.pubkey
      ? formatAddressShort(session.pubkey)
      : null;

  const label =
    status === "connected"
      ? connectedDetail
        ? `Connected · ${connectedDetail}`
        : "Connected"
      : status === "connecting"
        ? "Esperando Tonalli…"
        : "Connect wallet";

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button onClick={handleClick} disabled={status === "connecting"} className={className}>
        <span className="inline-flex items-center gap-2">
          {status === "connected" ? (
            <span className="h-2 w-2 rounded-full bg-jade shadow-[0_0_8px_rgba(46,230,163,0.8)]" />
          ) : null}
          {label}
        </span>
      </button>
      {status === "connecting" ? (
        <button
          type="button"
          onClick={() => void connect()}
          className="ml-3 text-xs text-white/60 transition hover:text-white"
        >
          Reintentar
        </button>
      ) : null}
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
          <button
            onClick={handleDisconnect}
            className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
