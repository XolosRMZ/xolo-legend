"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Listing } from "@/lib/types";
import { useFavorites, useTxid } from "@/lib/storage";
import { useToast } from "@/components/ToastProvider";
import { Modal } from "@/components/Modal";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { favorites, toggleFavorite } = useFavorites();
  const { txid, setTxid } = useTxid(listing.id);
  const { showToast } = useToast();
  const [txidInput, setTxidInput] = useState(txid);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFavorite = favorites.includes(listing.id);
  const tonalliUrl = useMemo(
    () => listing.tonalliDeepLink || listing.tonalliFallbackUrl,
    [listing]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(listing.offerId);
    showToast("Offer ID copiado.");
  };

  useEffect(() => {
    if (isModalOpen) {
      setTxidInput(txid);
    }
  }, [isModalOpen, txid]);

  const handleSaveTxid = () => {
    setTxid(txidInput.trim());
    showToast("TXID guardado.");
    setIsModalOpen(false);
  };

  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-obsidian-900/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition hover:border-jade/50 hover:shadow-glow">
      <button
        onClick={() => toggleFavorite(listing.id)}
        aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        className={`absolute right-4 top-4 z-10 rounded-full border px-2.5 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade ${
          isFavorite
            ? "border-jade/60 bg-jade/10 text-jade"
            : "border-white/10 text-white/60 hover:border-jade/40 hover:text-jade"
        }`}
      >
        {isFavorite ? "♥" : "♡"}
      </button>

      <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
        <Image
          src={listing.image}
          alt={listing.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-obsidian-900/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
          {listing.type === "nft" ? "NFT" : "RMZ"}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-jade/30 bg-obsidian-950/70 px-3 py-2 text-xs text-jade">
        <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40">Offer ID</span>
        <span className="mt-1 block break-all font-mono text-[11px] text-white/80">
          {listing.offerId}
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold text-white">{listing.name}</h3>
        <p
          className="mt-2 overflow-hidden text-sm text-white/70"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {listing.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-white/50">Precio</span>
          <span className="text-base font-semibold text-gold">
            {listing.price.amount.toLocaleString(undefined, {
              maximumFractionDigits: 2
            })}{" "}
            {listing.price.symbol}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            aria-label="Copy Offer ID"
            className="rounded-xl border border-white/10 bg-obsidian-950/80 px-3 py-2 text-xs text-white/80 transition hover:border-jade/50 hover:text-jade"
          >
            Copy Offer ID
          </button>
          <a
            href={tonalliUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open offer in Tonalli"
            className="rounded-xl border border-jade/40 bg-jade/10 px-3 py-2 text-center text-xs text-jade shadow-glow transition hover:border-jade hover:bg-jade/20"
          >
            Open in Tonalli
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/60">
          <Link className="underline decoration-white/30 underline-offset-4" href="/how-to-buy">
            ¿Cómo pagar?
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="underline decoration-white/30 underline-offset-4"
          >
            Ya compré → pegar TXID
          </button>
        </div>

        <a
          href={listing.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold transition hover:border-gold hover:bg-gold/20"
        >
          Comprar por WhatsApp (transferencia)
        </a>
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Pegar TXID"
        description="Guarda la confirmación de tu compra para seguimiento."
        onClose={() => setIsModalOpen(false)}
      >
        <div className="space-y-4">
          <input
            value={txidInput}
            onChange={(event) => setTxidInput(event.target.value)}
            placeholder="Ingresa tu TXID"
            className="w-full rounded-xl border border-white/10 bg-obsidian-950/70 px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:border-white/30"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveTxid}
              className="rounded-xl border border-jade/40 bg-jade/10 px-4 py-2 text-xs text-jade transition hover:bg-jade/20"
            >
              Guardar TXID
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
