"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Listing } from "@/lib/types";
import { Tabs } from "@/components/Tabs";
import { FilterBar } from "@/components/FilterBar";
import { ListingCard } from "@/components/ListingCard";
import { useFavorites } from "@/lib/storage";

const tabs = [
  { id: "nft", label: "NFTs" },
  { id: "rmz", label: "RMZ Token" },
  { id: "favorites", label: "Favoritos" }
];

interface MarketplaceClientProps {
  listings: Listing[];
}

export function MarketplaceClient({ listings }: MarketplaceClientProps) {
  const searchParams = useSearchParams();
  const initialCollection = searchParams.get("collection") ?? "";
  const { favorites } = useFavorites();
  const [activeTab, setActiveTab] = useState("nft");
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState(initialCollection);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    if (initialCollection) {
      setCollection(initialCollection);
    }
  }, [initialCollection]);

  const initialTabRef = useRef(true);

  useEffect(() => {
    if (initialTabRef.current) {
      initialTabRef.current = false;
      return;
    }
    setCollection("");
  }, [activeTab]);

  const collections = useMemo(() => {
    const scoped = listings.filter((listing) =>
      activeTab === "favorites" ? true : listing.type === activeTab
    );
    const unique = new Set(scoped.map((listing) => listing.collection));
    return Array.from(unique);
  }, [activeTab, listings]);

  // Filter + sort entirely client-side for fast iteration.
  const filteredListings = useMemo(() => {
    const lowered = search.toLowerCase();
    let next = listings.filter((listing) => {
      if (activeTab === "favorites" && !favorites.includes(listing.id)) {
        return false;
      }
      if (activeTab !== "favorites" && listing.type !== activeTab) {
        return false;
      }
      if (collection && listing.collection !== collection) {
        return false;
      }
      if (!lowered) return true;
      return (
        listing.name.toLowerCase().includes(lowered) ||
        listing.collection.toLowerCase().includes(lowered) ||
        listing.offerId.toLowerCase().includes(lowered)
      );
    });

    if (sort === "price-asc") {
      next = [...next].sort((a, b) => a.price.amount - b.price.amount);
    }
    if (sort === "price-desc") {
      next = [...next].sort((a, b) => b.price.amount - a.price.amount);
    }

    return next;
  }, [activeTab, collection, favorites, listings, search, sort]);

  const handleClear = () => {
    setSearch("");
    setCollection("");
    setSort("newest");
  };

  return (
    <section className="space-y-6">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <FilterBar
        search={search}
        collection={collection}
        sort={sort}
        collections={collections}
        onSearchChange={setSearch}
        onCollectionChange={setCollection}
        onSortChange={setSort}
        onClear={handleClear}
      />
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{filteredListings.length} resultados</span>
        {collection ? <span>Filtrado por {collection}</span> : null}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      {filteredListings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-obsidian-900/50 p-6 text-center text-white/60">
          No encontramos ofertas con esos filtros.
        </div>
      ) : null}
    </section>
  );
}
