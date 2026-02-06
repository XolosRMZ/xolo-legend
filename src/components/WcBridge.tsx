"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { initSignClient } from "@/lib/walletconnect";
import {
  addWcOffer,
  clearWcOffers,
  getWcOffers,
  isTonalliOfferPayload,
  subscribeWcOffers
} from "@/state/wcOffersStore";
import { useWcDebug } from "@/lib/wcDebug";

const OFFER_EVENT = "xolos_offer_published";
const CHAIN_ID = "ecash:mainnet";
const DEBUG_EVENTS_MAX = 10;

type DebugEvent = {
  at: number;
  name: string;
  chainId?: string;
  topic?: string;
  payload?: unknown;
};

export function WcBridge() {
  const startedRef = useRef(false);
  const searchParams = useSearchParams();
  const debugEnabled = searchParams?.get("debug") === "1";
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);
  const [sessionTopics, setSessionTopics] = useState<string[]>([]);
  const [offerSummary, setOfferSummary] = useState<{ count: number; lastOfferId: string | null }>({
    count: 0,
    lastOfferId: null
  });
  const { lastBuy } = useWcDebug();
  const pushDebugEvent = useCallback((entry: DebugEvent) => {
    if (!debugEnabled) return;
    setDebugEvents((prev) => [entry, ...prev].slice(0, DEBUG_EVENTS_MAX));
  }, [debugEnabled]);

  useEffect(() => {
    const update = () => {
      const offers = getWcOffers();
      setOfferSummary({
        count: offers.length,
        lastOfferId: offers[0]?.offerId ?? null
      });
    };
    update();
    return subscribeWcOffers(update);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let unsubscribe = () => {};

    const start = async () => {
      try {
        const client = await initSignClient();
        const refreshSessionTopics = () => {
          const topics = client.session.getAll().map((session) => session.topic);
          setSessionTopics(topics);
        };
        refreshSessionTopics();
        const handleSessionEvent = (event: {
          topic: string;
          params?: { chainId?: string; event?: { name?: string; data?: unknown } };
        }) => {
          const name = event.params?.event?.name;
          const data = event.params?.event?.data;
          const chainId = event.params?.chainId;
          console.debug(
            "[XoloLegend][WC][session_event] name=",
            name,
            "topic=",
            event.topic,
            "chainId=",
            chainId,
            "data=",
            data
          );
          pushDebugEvent({
            at: Date.now(),
            name: name ?? "unknown",
            chainId,
            topic: event.topic,
            payload: data
          });
          if (name !== OFFER_EVENT) {
            return;
          }
          if (!event?.topic || !client.session.get(event.topic)) {
            console.debug("[XoloLegend][WC][offer_published][REJECT]", "missing session", data);
            return;
          }
          if (chainId !== CHAIN_ID) {
            console.debug("[XoloLegend][WC][offer_published][REJECT]", "chainId mismatch", data);
            return;
          }
          if (!isTonalliOfferPayload(data)) {
            console.debug(
              "[XoloLegend][WC][offer_published][REJECT]",
              "invalid payload",
              data
            );
            return;
          }
          const result = addWcOffer(data, { topic: event.topic });
          if (!result.ok) {
            console.debug(
              "[XoloLegend][WC][offer_published][REJECT]",
              result.reason,
              data
            );
            return;
          }
          console.debug(
            "[XoloLegend][WC][offer_published][ACCEPT] offerId=",
            result.offer.offerId,
            "kind=",
            result.offer.kind,
            "topic=",
            result.offer.topic
          );
          const currentOffers = getWcOffers();
          console.debug(
            "[XoloLegend][WC][store] size=",
            currentOffers.length,
            "top=",
            currentOffers[0]?.offerId ?? null
          );
          refreshSessionTopics();
        };

        const handleSessionDelete = () => {
          console.debug("[XoloLegend][WC] session_delete");
          clearWcOffers();
          refreshSessionTopics();
        };

        client.on("session_event", handleSessionEvent);
        client.on("session_delete", handleSessionDelete);
        unsubscribe = () => {
          client.off("session_event", handleSessionEvent);
          client.off("session_delete", handleSessionDelete);
        };
      } catch (error) {
        console.debug("[XoloLegend][WC] Failed to init sign client", error);
      }
    };

    void start();

    return () => {
      unsubscribe();
    };
  }, [pushDebugEvent]);

  if (!debugEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[60] w-[340px] space-y-2 rounded-2xl border border-white/10 bg-obsidian-950/95 p-3 text-[11px] text-white/70 shadow-glow">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>WC Debug</span>
        <span>{debugEvents.length} events</span>
      </div>
      <div className="space-y-1">
        <div className="text-white/50">Sessions</div>
        <div className="max-h-[70px] overflow-auto break-all text-white/70">
          {sessionTopics.length ? sessionTopics.join("\n") : "—"}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-white/50">Offers</div>
        <div className="text-white/70">
          {offerSummary.count} total {offerSummary.lastOfferId ? `| last ${offerSummary.lastOfferId}` : ""}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-white/50">Last buy</div>
        <div className="break-all text-white/70">
          {lastBuy
            ? `${lastBuy.status}${lastBuy.txid ? ` txid=${lastBuy.txid}` : ""}${
                lastBuy.error ? ` error=${lastBuy.error}` : ""
              }`
            : "—"}
        </div>
      </div>
      <div className="max-h-[240px] space-y-2 overflow-auto pr-1">
        {debugEvents.length === 0 ? (
          <div className="text-white/40">No events yet.</div>
        ) : (
          debugEvents.map((entry, index) => (
            <div key={`${entry.at}-${index}`} className="rounded-lg border border-white/10 p-2">
              <div className="flex items-center justify-between text-white/50">
                <span>{entry.name}</span>
                <span>{new Date(entry.at).toLocaleTimeString()}</span>
              </div>
              <div className="mt-1 break-all text-white/70">
                {entry.chainId ? `Chain: ${entry.chainId}` : "Chain: —"}
              </div>
              <div className="mt-1 break-all text-white/70">
                {entry.topic ? `Topic: ${entry.topic}` : "Topic: —"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
