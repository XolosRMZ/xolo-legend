"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";

import { copyText } from "@/lib/clipboard";
import {
  connectWalletConnect,
  initSignClient,
  requestAddresses
} from "@/lib/walletconnect";
import { setWalletConnectAddress, type WalletConnectSession } from "@/lib/wallet";

type ConnectRMZModalProps = {
  open: boolean;
  onClose: () => void;
  onConnected: (session: WalletConnectSession) => void;
};

export function ConnectRMZModal({ open, onClose, onConnected }: ConnectRMZModalProps) {
  const [uri, setUri] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState(220);
  const clientRef = useRef<SignClient | null>(null);
  const approveRef = useRef<Promise<SessionTypes.Struct> | null>(null);
  const cancelledRef = useRef(false);

  const projectId = useMemo(
    () => process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    []
  );

  useEffect(() => {
    if (!open) {
      setUri("");
      setError("");
      setLoading(false);
      setCopied(false);
      approveRef.current = null;
      cancelledRef.current = false;
      return;
    }

    cancelledRef.current = false;
    if (!projectId) {
      setError("Falta NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID en el entorno.");
      setLoading(false);
      return;
    }

    const start = async () => {
      setLoading(true);
      setError("");
      try {
        const client = clientRef.current ?? (await initSignClient());
        clientRef.current = client;
        const { uri: nextUri, approval } = await connectWalletConnect(client, {
          events: ["xolos_offer_published"]
        });
        if (cancelledRef.current) {
          return;
        }
        setUri(nextUri);
        setLoading(false);
        approveRef.current = approval();
        const session = await approveRef.current;
        if (cancelledRef.current) {
          return;
        }
        const addresses = await requestAddresses(session.topic);
        if (cancelledRef.current) {
          return;
        }
        const [firstAddress] = addresses ?? [];
        const payload: WalletConnectSession = {
          type: "walletconnect",
          wallet: "rmzwallet",
          chain: "ecash:mainnet",
          topic: session.topic,
          pairingTopic: session.pairingTopic,
          peer: {
            name: session.peer.metadata?.name,
            url: session.peer.metadata?.url,
            icons: session.peer.metadata?.icons
          },
          connectedAt: new Date().toISOString(),
          address: firstAddress || undefined
        };
        onConnected(payload);
        if (firstAddress) {
          setWalletConnectAddress(firstAddress);
        }
        onClose();
      } catch (err) {
        if (cancelledRef.current) {
          return;
        }
        setError("No se pudo iniciar WalletConnect.");
        setLoading(false);
      }
    };

    void start();

    return () => {
      cancelledRef.current = true;
    };
  }, [open, onClose, onConnected, projectId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const calcQrSize = () => {
      const next = Math.floor(Math.min(window.innerWidth, 520) * 0.5);
      const clamped = Math.max(180, Math.min(next, 260));
      setQrSize(clamped);
    };
    calcQrSize();
    window.addEventListener("resize", calcQrSize);
    return () => window.removeEventListener("resize", calcQrSize);
  }, [open]);

  const handleCopy = async () => {
    if (!uri) {
      return;
    }
    const success = await copyText(uri);
    if (!success) {
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-dvh w-full items-center justify-center p-4">
        <div className="flex w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#07070a] shadow-xl max-h-[85dvh]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Connect RMZWallet</h2>
            <p className="mt-1 text-xs text-white/60">
              Escanea este QR con RMZWallet (WalletConnect).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Cerrar
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {error ? (
            <div className="rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold">
              {error}
            </div>
          ) : null}
          {loading ? (
            <div className="text-sm text-white/70">Generando QR…</div>
          ) : null}
          {!loading && uri ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center">
                <div className="inline-flex p-3 rounded-xl border border-white/10 bg-white">
                  <QRCodeSVG value={uri} size={qrSize} bgColor="#ffffff" fgColor="#0b0b0b" />
                </div>
              </div>
              <div className="w-full space-y-2">
                <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  URI WalletConnect
                </label>
                <div className="flex items-start gap-2">
                  <textarea
                    readOnly
                    value={uri}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white/70"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-full border border-jade/40 bg-jade/10 px-3 py-2 text-[11px] text-jade transition hover:bg-jade/20"
                  >
                    {copied ? "Copiado" : "Copy URI"}
                  </button>
                </div>
              </div>
              <p className="text-xs text-white/50">
                Si estás en desktop, también puedes copiar el URI wc: y pegarlo en
                RMZWallet.
              </p>
            </div>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
