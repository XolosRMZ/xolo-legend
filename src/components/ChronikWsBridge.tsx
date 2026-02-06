"use client";

import { useEffect, useRef } from "react";
import type { WsMsgClient } from "chronik-client";
import { fetchTx } from "@/lib/chronik";
import { getChronikClient } from "@/lib/chronikClient";
import { spentOutpointTracker } from "@/lib/SpentOutpointTracker";
import { removeWcOffer } from "@/state/wcOffersStore";

export function ChronikWsBridge() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let active = true;
    let ws: { close: () => void } | null = null;
    const seenTxids = new Set<string>();

    const handleMessage = async (msg: WsMsgClient) => {
      if (!active || !msg || msg.type !== "Tx") return;
      const txid = msg.txid?.toLowerCase();
      if (!txid || seenTxids.has(txid)) return;
      if (!spentOutpointTracker.hasLiveOutpoints()) return;
      seenTxids.add(txid);

      try {
        const tx = await fetchTx(txid);
        const spentOfferIds = spentOutpointTracker.onWsTx(tx);
        if (!spentOfferIds.length) return;
        spentOfferIds.forEach((offerId) => {
          removeWcOffer(offerId);
          console.debug(
            "[XoloLegend][Chronik][spent] offerId=",
            offerId,
            "spendingTxid=",
            tx.txid
          );
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[XoloLegend][Chronik] Failed to load tx", error);
        }
      }
    };

    const start = async () => {
      try {
        const chronik = await getChronikClient();
        const endpoint = chronik.ws({
          onMessage: handleMessage
        });
        ws = endpoint;
        await endpoint.waitForOpen();
        endpoint.subscribeToTxs();
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[XoloLegend][Chronik] WS init failed", error);
        }
      }
    };

    void start();

    return () => {
      active = false;
      ws?.close();
    };
  }, []);

  return null;
}
