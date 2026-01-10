import { MarketplaceClient } from "@/components/MarketplaceClient";
import listings from "@/data/listings.json";
import { TONALLI_WEB_URL } from "@/lib/links";

export default function MarketplacePage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-obsidian-900/60 px-6 py-10 shadow-glow">
        <div className="absolute inset-0 bg-hero-glow opacity-80" />
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">XOLOLEGEND</p>
          <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">
            Marketplace de Leyendas.
          </h1>
          <p className="mt-4 text-base text-white/70">
            Compra NFTs y ofertas de RMZ token con un flujo directo hacia Tonalli. Cada
            oferta incluye su ID, botones rápidos y seguimiento de TXID.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={TONALLI_WEB_URL}
              className="rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-sm text-jade shadow-glow transition hover:bg-jade/20"
            >
              Open Tonalli
            </a>
            <a
              href="/how-to-buy"
              className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-white/30"
            >
              Ver guía de compra
            </a>
          </div>
        </div>
      </section>

      <MarketplaceClient listings={listings} />
    </div>
  );
}
