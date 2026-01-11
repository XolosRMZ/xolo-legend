import { notFound } from "next/navigation";
import listings from "@/data/listings.json";
import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

interface ItemPageProps {
  params: { id: string };
}

export default function ItemPage({ params }: ItemPageProps) {
  const typedListings = listings as Listing[];
  const listing = typedListings.find((item) => item.id === params.id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-10">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Detalle</p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
          {listing.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70">{listing.description}</p>
      </section>

      <div className="max-w-md">
        <ListingCard listing={listing} />
      </div>
    </div>
  );
}
