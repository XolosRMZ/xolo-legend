"use client";

import type { ChronikTx } from "@/lib/chronik";
import { parseOfferId } from "@/lib/offerId";

type Outpoint = string;

export class SpentOutpointTracker {
  private liveOutpoints = new Set<Outpoint>();
  private offerIdToOutpoint = new Map<string, Outpoint>();
  private outpointToOfferIds = new Map<Outpoint, Set<string>>();

  register(offerId: string) {
    const parsed = parseOfferId(offerId);
    if (!parsed) return;
    const outpoint = parsed.raw;
    const existing = this.offerIdToOutpoint.get(parsed.raw);
    if (existing === outpoint) return;
    if (existing) {
      this.removeOfferFromOutpoint(parsed.raw, existing);
    }
    this.offerIdToOutpoint.set(parsed.raw, outpoint);
    this.liveOutpoints.add(outpoint);
    const ids = this.outpointToOfferIds.get(outpoint) ?? new Set<string>();
    ids.add(parsed.raw);
    this.outpointToOfferIds.set(outpoint, ids);
  }

  hasLiveOutpoints() {
    return this.liveOutpoints.size > 0;
  }

  unregister(offerId: string) {
    const parsed = parseOfferId(offerId);
    if (!parsed) return;
    const outpoint = this.offerIdToOutpoint.get(parsed.raw);
    if (!outpoint) return;
    this.removeOfferFromOutpoint(parsed.raw, outpoint);
  }

  onWsTx(tx: ChronikTx): string[] {
    if (!tx?.inputs?.length || this.liveOutpoints.size === 0) {
      return [];
    }
    const spentOfferIds = new Set<string>();
    const spentOutpoints: Outpoint[] = [];

    tx.inputs.forEach((input) => {
      const prev = input?.prevOut;
      if (!prev?.txid || typeof prev.outIdx !== "number") return;
      const outpoint = `${prev.txid.toLowerCase()}:${prev.outIdx}`;
      if (!this.liveOutpoints.has(outpoint)) return;
      spentOutpoints.push(outpoint);
      const offerIds = this.outpointToOfferIds.get(outpoint);
      offerIds?.forEach((offerId) => spentOfferIds.add(offerId));
    });

    spentOutpoints.forEach((outpoint) => {
      const offerIds = this.outpointToOfferIds.get(outpoint);
      if (!offerIds) return;
      offerIds.forEach((offerId) => this.offerIdToOutpoint.delete(offerId));
      this.outpointToOfferIds.delete(outpoint);
      this.liveOutpoints.delete(outpoint);
    });

    return Array.from(spentOfferIds);
  }

  private removeOfferFromOutpoint(offerId: string, outpoint: Outpoint) {
    this.offerIdToOutpoint.delete(offerId);
    const ids = this.outpointToOfferIds.get(outpoint);
    if (!ids) return;
    ids.delete(offerId);
    if (ids.size === 0) {
      this.outpointToOfferIds.delete(outpoint);
      this.liveOutpoints.delete(outpoint);
    } else {
      this.outpointToOfferIds.set(outpoint, ids);
    }
  }
}

export const spentOutpointTracker = new SpentOutpointTracker();
