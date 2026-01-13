"use client";

import Image from "next/image";
import type { RegistryListing } from "@/lib/registry";

interface ListingDetailsProps {
  listing: RegistryListing;
}

export function ListingDetails({ listing }: ListingDetailsProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-10">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Detalle</p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
          {listing.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          {listing.description || "Sin descripción."}
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-obsidian-950/70">
          <div className="relative aspect-square">
            <Image
              src={listing.imageUrl || "/placeholders/nft-1.svg"}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 420px"
            />
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-white/10 bg-obsidian-950/70 p-6 text-sm text-white/70">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Colección
            </p>
            <p className="mt-2 text-base text-white/90">
              {listing.collection || "User Listings"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Offer TXID
            </p>
            <p className="mt-2 break-all font-mono text-xs text-white/80">
              {listing.offerTxId || "No disponible"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Precio (sats)
              </p>
              <p className="mt-2 text-base text-white/90">
                {listing.priceSats || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Cantidad
              </p>
              <p className="mt-2 text-base text-white/90">
                {listing.amountAtoms || "—"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Token ID
              </p>
              <p className="mt-2 break-all text-xs text-white/80">
                {listing.tokenId || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Verificación
              </p>
              <p className="mt-2 text-base text-white/90">
                {listing.verification || "unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
