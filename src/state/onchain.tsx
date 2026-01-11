"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { ReactNode } from "react";
import { decodeCashAddress } from "ecashaddrjs";

import type { ChronikTokenInfo } from "@/lib/chronik";
import { fetchUtxosByScript } from "@/lib/chronik";
import { fetchRmzTokenInfo, requireRmzTokenId } from "@/lib/rmz";
import { loadOfferById } from "@/lib/agora";
import { RMZ_STATE_TOKEN_ID, RMZ_TOKEN_ID } from "@/lib/constants";
import { useWallet } from "@/lib/wallet";

export type OfferStatusType =
  | "available"
  | "spent"
  | "invalid"
  | "not_found"
  | "unknown";

export type OfferStatus = {
  status: OfferStatusType;
  offerTxId: string;
  priceSats?: number;
  tokenId?: string;
  amountAtoms?: string;
  isPartial?: boolean;
  isChecking?: boolean;
  updatedAt: number;
  error?: string;
};

type OnChainState = {
  walletAddress?: string;
  rmzAtoms?: string;
  rmzFormatted?: string;
  rmzTokenInfo?: ChronikTokenInfo | null;
  offerStatusCache: Record<string, OfferStatus>;
  configWarning?: string;
  refreshRmzInfo: () => Promise<void>;
  refreshRmzBalance: (address?: string) => Promise<void>;
  verifyOffer: (offerTxId: string) => Promise<OfferStatus | null>;
  verifyListing: (listing: { offerId?: string }) => Promise<OfferStatus | null>;
};

const OnChainContext = createContext<OnChainState | null>(null);

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseBigInt(value: unknown): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === "string" && value.length > 0) {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

function formatAtoms(value: bigint, decimals = 0) {
  if (decimals <= 0) {
    return value.toString();
  }
  const raw = value.toString();
  const padded = raw.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function normalizeUtxos(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload as Array<Record<string, unknown>>;
  }
  if (payload && typeof payload === "object" && "utxos" in payload) {
    const utxos = (payload as { utxos?: unknown }).utxos;
    if (Array.isArray(utxos)) {
      return utxos as Array<Record<string, unknown>>;
    }
  }
  return [];
}

export function OnChainProvider({ children }: { children: ReactNode }) {
  const { session } = useWallet();
  const walletAddress = session?.address;

  const [rmzTokenInfo, setRmzTokenInfo] = useState<ChronikTokenInfo | null>(null);
  const [rmzAtoms, setRmzAtoms] = useState<string>();
  const [rmzFormatted, setRmzFormatted] = useState<string>();
  const [offerStatusCache, setOfferStatusCache] = useState<Record<string, OfferStatus>>(
    {}
  );
  const cacheRef = useRef<Record<string, OfferStatus>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  const configWarning = useMemo(() => {
    const missing: string[] = [];
    if (!RMZ_TOKEN_ID) {
      missing.push("NEXT_PUBLIC_RMZ_TOKEN_ID");
    }
    if (!RMZ_STATE_TOKEN_ID) {
      missing.push("NEXT_PUBLIC_RMZ_STATE_TOKEN_ID");
    }
    if (missing.length === 0) {
      return undefined;
    }
    return `Missing env: ${missing.join(", ")}`;
  }, []);

  const refreshRmzInfo = useCallback(async () => {
    if (!RMZ_TOKEN_ID) {
      setRmzTokenInfo(null);
      return;
    }
    try {
      const info = await fetchRmzTokenInfo();
      setRmzTokenInfo(info);
    } catch (error) {
      console.warn("RMZ token lookup failed", error);
      setRmzTokenInfo(null);
    }
  }, []);

  const refreshRmzBalance = useCallback(
    async (address?: string) => {
      const target = address ?? walletAddress;
      if (!target || !RMZ_TOKEN_ID) {
        setRmzAtoms(undefined);
        setRmzFormatted(undefined);
        return;
      }
      let decoded;
      try {
        decoded = decodeCashAddress(target);
      } catch (error) {
        console.warn("Failed to decode address for RMZ balance", error);
        setRmzAtoms(undefined);
        setRmzFormatted(undefined);
        return;
      }
      const scriptType = String(decoded.type || "").toLowerCase();
      const payload = toHex(decoded.hash);
      if (!scriptType || !payload) {
        setRmzAtoms(undefined);
        setRmzFormatted(undefined);
        return;
      }
      try {
        const response = await fetchUtxosByScript({ type: scriptType, payload });
        const utxos = normalizeUtxos(response);
        const tokenId = requireRmzTokenId().toLowerCase();
        let totalAtoms = 0n;
        for (const utxo of utxos) {
          const token = utxo.token as { tokenId?: string; atoms?: unknown } | undefined;
          if (!token?.tokenId) {
            continue;
          }
          if (token.tokenId.toLowerCase() !== tokenId) {
            continue;
          }
          totalAtoms += parseBigInt(token.atoms);
        }
        setRmzAtoms(totalAtoms.toString());
        setRmzFormatted(formatAtoms(totalAtoms, rmzTokenInfo?.decimals ?? 0));
      } catch (error) {
        console.warn("Failed to refresh RMZ balance", error);
        setRmzAtoms(undefined);
        setRmzFormatted(undefined);
      }
    },
    [rmzTokenInfo?.decimals, walletAddress]
  );

  useEffect(() => {
    cacheRef.current = offerStatusCache;
  }, [offerStatusCache]);

  const verifyOffer = useCallback(async (offerTxId: string) => {
    const trimmed = offerTxId?.trim();
    if (!trimmed) {
      return null;
    }
    if (inFlightRef.current.has(trimmed)) {
      return cacheRef.current[trimmed] ?? null;
    }
    inFlightRef.current.add(trimmed);
    setOfferStatusCache((prev) => ({
      ...prev,
      [trimmed]: {
        status: prev[trimmed]?.status ?? "unknown",
        offerTxId: trimmed,
        priceSats: prev[trimmed]?.priceSats,
        tokenId: prev[trimmed]?.tokenId,
        amountAtoms: prev[trimmed]?.amountAtoms,
        isPartial: prev[trimmed]?.isPartial,
        error: prev[trimmed]?.error,
        isChecking: true,
        updatedAt: Date.now()
      }
    }));
    try {
      const result = await loadOfferById(trimmed);
      const errorMessage = result.ok
        ? undefined
        : result.status === "spent"
          ? "spentBy" in result && result.spentBy
            ? `Spent by ${result.spentBy}`
            : "Spent"
          : result.status === "not_found"
            ? `Tx not found: ${result.txid}`
            : result.error;
      const next: OfferStatus = {
        status: result.status,
        offerTxId: trimmed,
        priceSats: cacheRef.current[trimmed]?.priceSats,
        tokenId: cacheRef.current[trimmed]?.tokenId,
        amountAtoms: cacheRef.current[trimmed]?.amountAtoms,
        isPartial: cacheRef.current[trimmed]?.isPartial,
        updatedAt: Date.now(),
        error: errorMessage
      };
      setOfferStatusCache((prev) => ({ ...prev, [trimmed]: next }));
      return next;
    } catch (error) {
      const next: OfferStatus = {
        status: "unknown",
        offerTxId: trimmed,
        updatedAt: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error"
      };
      setOfferStatusCache((prev) => ({ ...prev, [trimmed]: next }));
      return next;
    } finally {
      inFlightRef.current.delete(trimmed);
    }
  }, []);

  const verifyListing = useCallback(
    async (listing: { offerId?: string }) => {
      if (!listing?.offerId) {
        return null;
      }
      return verifyOffer(listing.offerId);
    },
    [verifyOffer]
  );

  useEffect(() => {
    refreshRmzInfo();
  }, [refreshRmzInfo]);

  useEffect(() => {
    if (walletAddress) {
      refreshRmzBalance(walletAddress);
    }
  }, [refreshRmzBalance, walletAddress]);

  useEffect(() => {
    if (rmzAtoms && rmzTokenInfo?.decimals !== undefined) {
      setRmzFormatted(formatAtoms(BigInt(rmzAtoms), rmzTokenInfo.decimals));
    }
  }, [rmzAtoms, rmzTokenInfo?.decimals]);

  const value = useMemo(
    () => ({
      walletAddress,
      rmzAtoms,
      rmzFormatted,
      rmzTokenInfo,
      offerStatusCache,
      configWarning,
      refreshRmzInfo,
      refreshRmzBalance,
      verifyOffer,
      verifyListing
    }),
    [
      walletAddress,
      rmzAtoms,
      rmzFormatted,
      rmzTokenInfo,
      offerStatusCache,
      configWarning,
      refreshRmzInfo,
      refreshRmzBalance,
      verifyOffer,
      verifyListing
    ]
  );

  return <OnChainContext.Provider value={value}>{children}</OnChainContext.Provider>;
}

export function useOnChain() {
  const ctx = useContext(OnChainContext);
  if (!ctx) {
    throw new Error("useOnChain must be used within OnChainProvider.");
  }
  return ctx;
}
