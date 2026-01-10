"use client";

import { useState } from "react";

import { openTonalliOffer } from "@/lib/tonalli";

export default function HowToBuyPage() {
  const [offerId, setOfferId] = useState("");
  const [error, setError] = useState("");

  const handleQuickBuy = () => {
    const trimmedOfferId = offerId.trim();
    if (!trimmedOfferId) {
      setError("Ingresa un Offer ID.");
      return;
    }
    setError("");
    openTonalliOffer({ offerId: trimmedOfferId, fallbackUrl: "https://app.tonalli.cash/" });
  };

  return (
    <div className="space-y-12 pb-24">
      <section className="rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-10">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Guía</p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Cómo comprar</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Sigue estos pasos rápidos para completar tu compra en Tonalli.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            step: "01",
            title: "Copy Offer ID",
            description: "Localiza el Offer ID debajo de la imagen y cópialo."
          },
          {
            step: "02",
            title: "Open Tonalli",
            description: "Abre Tonalli desde el botón de cada tarjeta."
          },
          {
            step: "03",
            title: "Paste & confirm",
            description: "Pega el Offer ID y confirma la transacción."
          }
        ].map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-white/10 bg-obsidian-900/60 p-6"
          >
            <span className="text-xs uppercase tracking-[0.4em] text-white/40">
              Paso {item.step}
            </span>
            <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-white/70">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 z-20">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-obsidian-900/80 p-4 shadow-glow md:flex-row md:items-center">
          <div className="w-full flex-1">
            <input
              value={offerId}
              onChange={(event) => {
                setOfferId(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Ingresa Offer ID para compra rápida"
              className="w-full rounded-xl border border-white/10 bg-obsidian-950/70 px-4 py-3 text-sm text-white/80 placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
            />
            {error ? <p className="mt-2 text-xs text-gold/80">{error}</p> : null}
          </div>
          <button
            onClick={handleQuickBuy}
            className="rounded-xl border border-jade/40 bg-jade/10 px-5 py-3 text-sm text-jade transition hover:bg-jade/20"
          >
            Open Tonalli
          </button>
        </div>
      </div>
    </div>
  );
}
