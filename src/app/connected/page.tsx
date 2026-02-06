"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { copyText } from "@/lib/clipboard";
import {
  setStoredSession,
  type TonalliSession
} from "@/lib/wallet";

type ConnectResult = {
  status: "success" | "error";
  message: string;
};

const ADDRESS_PREFIX = /^(ecash:|etoken:)/i;
const HEX_KEY = /^[0-9a-fA-F]+$/;
const PUBKEY_LENGTHS = new Set([64, 66]);

function parseHashParams(): URLSearchParams | null {
  if (typeof window === "undefined") {
    return null;
  }
  const hash = window.location.hash || "";
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes("?")) {
    const [, after] = trimmed.split("?", 2);
    return after ? new URLSearchParams(after) : null;
  }
  if (trimmed.includes("=")) {
    return new URLSearchParams(trimmed);
  }
  return null;
}

export default function ConnectedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<ConnectResult>({
    status: "error",
    message: "Waiting for Tonalli response..."
  });
  const [redirecting, setRedirecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const redirectTimerRef = useRef<number | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  const parsed = useMemo(() => {
    // Tonalli callback contract (accepted formats):
    // Option A: ?address=<ecash address or token address>&chain=ecash
    // Option B: ?pubkey=<hex>&chain=ecash
    // Option C: ?address=...&pubkey=...&chain=ecash
    // Optional: ?wallet=tonalli
    // Accepted URL formats:
    // - /connected?address=...
    // - /connected#?address=...
    const hashParams = parseHashParams();
    const getParam = (key: string) =>
      hashParams?.get(key) || searchParams.get(key) || "";

    const rawAddress = getParam("address").trim();
    const rawPubkey = getParam("pubkey").trim();
    const address = ADDRESS_PREFIX.test(rawAddress) ? rawAddress : "";
    const pubkey =
      HEX_KEY.test(rawPubkey) && PUBKEY_LENGTHS.has(rawPubkey.length) ? rawPubkey : "";
    const chain = getParam("chain").trim();
    const wallet = getParam("wallet").trim() || "tonalli";
    const status = getParam("status").trim();
    const requestId = getParam("requestId").trim();
    const nonce = getParam("nonce").trim();
    const ts = getParam("ts").trim();
    const origin = getParam("origin").trim();
    const signature = getParam("signature").trim();

    return {
      address,
      pubkey,
      chain,
      wallet,
      status,
      requestId,
      nonce,
      ts,
      origin,
      signature
    };
  }, [searchParams]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[connected] params=", parsed);
    }
  }, [parsed]);

  useEffect(() => {
    if (parsed.status && parsed.status !== "ok") {
      setResult({
        status: "error",
        message: "Tonalli connection failed."
      });
      return () => {
        if (redirectTimerRef.current !== null) {
          window.clearTimeout(redirectTimerRef.current);
          redirectTimerRef.current = null;
        }
      };
    }

    if (parsed.origin && parsed.origin !== window.location.origin) {
      setResult({
        status: "error",
        message: "Origin mismatch in Tonalli response."
      });
      return () => {
        if (redirectTimerRef.current !== null) {
          window.clearTimeout(redirectTimerRef.current);
          redirectTimerRef.current = null;
        }
      };
    }

    if (parsed.ts) {
      const parsedTs = Number(parsed.ts);
      if (!Number.isFinite(parsedTs)) {
        setResult({
          status: "error",
          message: "Invalid timestamp in Tonalli response."
        });
        return () => {
          if (redirectTimerRef.current !== null) {
            window.clearTimeout(redirectTimerRef.current);
            redirectTimerRef.current = null;
          }
        };
      }
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (nowSeconds - parsedTs > 300) {
        setResult({
          status: "error",
          message: "Tonalli response expired."
        });
        return () => {
          if (redirectTimerRef.current !== null) {
            window.clearTimeout(redirectTimerRef.current);
            redirectTimerRef.current = null;
          }
        };
      }
    }

    if (!parsed.address) {
      setResult({
        status: "error",
        message: "No address received."
      });
      return () => {
        if (redirectTimerRef.current !== null) {
          window.clearTimeout(redirectTimerRef.current);
          redirectTimerRef.current = null;
        }
      };
    }

    const session: TonalliSession = {
      type: "tonalli",
      wallet: "tonalli",
      chain: "ecash",
      address: parsed.address,
      connectedAt: new Date().toISOString()
    };

    if (parsed.pubkey) {
      session.pubkey = parsed.pubkey;
    }

    if (parsed.signature) {
      session.signature = parsed.signature;
    }

    if (parsed.requestId) {
      session.requestId = parsed.requestId;
    }

    if (parsed.nonce) {
      session.nonce = parsed.nonce;
    }

    if (parsed.ts) {
      session.ts = parsed.ts;
    }

    if (parsed.origin) {
      session.origin = parsed.origin;
    }

    setStoredSession(session);
    window.history.replaceState({}, "", "/connected");
    setResult({
      status: "success",
      message: "Tonalli wallet connected."
    });
    setRedirecting(true);
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
    }
    redirectTimerRef.current = window.setTimeout(() => {
      router.push("/");
    }, 1800);

    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [parsed, router]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = null;
      }
    };
  }, []);

  const badgeClasses =
    result.status === "success"
      ? "border-jade/40 text-jade bg-jade/10"
      : "border-gold/40 text-gold bg-gold/10";

  const copyValue = parsed.address || parsed.pubkey;
  const copyLabel = parsed.address ? "Copy address" : parsed.pubkey ? "Copy pubkey" : "";

  const handleCopy = async () => {
    if (!copyValue) {
      return;
    }
    const success = await copyText(copyValue);
    if (!success) {
      return;
    }
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    setRedirecting(false);
    setCopied(true);
    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, 1200);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-obsidian-900/60 px-6 py-12 shadow-glow">
      <div className="absolute inset-0 bg-hero-glow opacity-70" />
      <div className="relative z-10 max-w-2xl space-y-6">
        <div className={`inline-flex rounded-full border px-4 py-1 text-xs ${badgeClasses}`}>
          {result.status === "success" ? "Connected" : "Connection issue"}
        </div>
        <h1 className="text-3xl font-semibold text-white">Wallet connection</h1>
        <p className="text-sm text-white/70">{result.message}</p>
        {result.status === "success" ? (
          <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 p-4 text-xs text-white/70">
            <div>Wallet: Tonalli</div>
            <div>Chain: {parsed.chain || "ecash"}</div>
            {parsed.address ? <div>Address: {parsed.address}</div> : null}
            {parsed.pubkey ? <div>Pubkey: {parsed.pubkey}</div> : null}
            {copyValue ? (
              <button
                type="button"
                onClick={handleCopy}
                className="mt-3 rounded-full border border-jade/40 bg-jade/10 px-4 py-2 text-[11px] text-jade shadow-glow transition hover:bg-jade/20"
              >
                {copied ? "Copied ✓" : copyLabel}
              </button>
            ) : null}
          </div>
        ) : null}
        {result.status === "success" && redirecting ? (
          <p className="text-xs text-white/60">Redirigiendo…</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-5 py-2 text-xs text-white/70 transition hover:border-white/30"
          >
            Back to marketplace
          </Link>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-white/10 px-5 py-2 text-xs text-white/70 transition hover:border-white/30"
          >
            Ir al Marketplace ahora
          </button>
          <Link
            href="/how-to-buy"
            className="rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-xs text-jade shadow-glow transition hover:bg-jade/20"
          >
            How to buy
          </Link>
        </div>
      </div>
    </section>
  );
}
