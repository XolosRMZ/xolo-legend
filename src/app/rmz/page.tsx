import listings from "@/data/listings.json";
import { ListingCard } from "@/components/ListingCard";

export default function RMZPage() {
  const rmzListings = listings.filter((listing) => listing.type === "rmz");

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-10">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">RMZ Token</p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Ofertas RMZ</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Accede a ofertas verificadas para comprar o vender RMZ. Cada tarjeta incluye un
          Offer ID listo para copiar y abrir en Tonalli.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rmzListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
