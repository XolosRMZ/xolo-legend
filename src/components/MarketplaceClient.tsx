"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Listing } from "@/lib/types";
import { Tabs } from "@/components/Tabs";
import { FilterBar } from "@/components/FilterBar";
import { ListingCard } from "@/components/ListingCard";
import { useFavorites } from "@/lib/storage";
import { useOnChain } from "@/state/onchain";
import { loadRegistry, removeListing, type RegistryListing } from "@/lib/registry";
import { RMZ_TOKEN_ID, TONALLI_WEB_URL } from "@/lib/constants";

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
  const highlightId = searchParams.get("highlight") ?? "";
  const { favorites } = useFavorites();
  const { offerStatusCache, verifyOffer } = useOnChain();
  const [activeTab, setActiveTab] = useState("nft");
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState(initialCollection);
  const [sort, setSort] = useState("newest");
  const [showDemo, setShowDemo] = useState(false);
  const [registryListings, setRegistryListings] = useState<RegistryListing[]>([]);

  useEffect(() => {
    if (initialCollection) {
      setCollection(initialCollection);
    }
  }, [initialCollection]);

  useEffect(() => {
    setRegistryListings(loadRegistry());
  }, []);

  const initialTabRef = useRef(true);

  useEffect(() => {
    if (initialTabRef.current) {
      initialTabRef.current = false;
      return;
    }
    setCollection("");
  }, [activeTab]);

  const registryDisplayListings = useMemo(() => {
    return registryListings.map((listing) => {
      const tokenId = listing.tokenId?.toLowerCase();
      const isRmz =
        Boolean(tokenId) &&
        Boolean(RMZ_TOKEN_ID) &&
        tokenId === RMZ_TOKEN_ID.toLowerCase();
      const priceAmount = listing.priceSats ? Number(listing.priceSats) : 0;
      const whatsappText = encodeURIComponent(
        `Estoy interesado en ${listing.title}`
      );
      return {
        id: listing.id,
        type: isRmz ? "rmz" : "nft",
        collection: listing.collection || "User Listings",
        name: listing.title,
        description: listing.description || "User listing",
        image: listing.imageUrl || "/placeholders/nft-1.svg",
        price: { amount: Number.isFinite(priceAmount) ? priceAmount : 0, symbol: "sats" },
        offerId: listing.offerTxId,
        status: "available",
        tonalliDeepLink: `tonalli://offer/${listing.offerTxId}`,
        tonalliFallbackUrl: TONALLI_WEB_URL,
        whatsappUrl: `https://wa.me/?text=${whatsappText}`,
        source: "registry"
      } satisfies Listing;
    });
  }, [registryListings]);

  const demoListings = useMemo(() => {
    return listings.map((listing) => ({ ...listing, source: "demo" as const }));
  }, [listings]);

  const combinedListings = useMemo(() => {
    return [...registryDisplayListings, ...demoListings];
  }, [demoListings, registryDisplayListings]);

  useEffect(() => {
    const unique = new Set(
      combinedListings.map((listing) => listing.offerId).filter(Boolean)
    );
    unique.forEach((offerId) => {
      verifyOffer(offerId);
    });
  }, [combinedListings, verifyOffer]);

  const collections = useMemo(() => {
    const scoped = combinedListings.filter((listing) =>
      activeTab === "favorites" ? true : listing.type === activeTab
    );
    const unique = new Set(scoped.map((listing) => listing.collection));
    return Array.from(unique);
  }, [activeTab, combinedListings]);

  const isListingVerified = useCallback(
    (listing: Listing) => {
      const status = offerStatusCache[listing.offerId];
      return status?.status === "available";
    },
    [offerStatusCache]
  );

  // Filter + sort entirely client-side for fast iteration.
  const filteredListings = useMemo(() => {
    const lowered = search.toLowerCase();
    let next = combinedListings.filter((listing) => {
      if (activeTab === "favorites" && !favorites.includes(listing.id)) {
        return false;
      }
      if (activeTab !== "favorites" && listing.type !== activeTab) {
        return false;
      }
      if (!showDemo && !isListingVerified(listing)) {
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
  }, [
    activeTab,
    collection,
    favorites,
    combinedListings,
    search,
    sort,
    showDemo,
    isListingVerified
  ]);

  const hasVerifiedListings = useMemo(() => {
    return combinedListings.some((listing) => isListingVerified(listing));
  }, [combinedListings, isListingVerified]);

  const handleRemove = useCallback((id: string) => {
    const next = removeListing(id);
    setRegistryListings(next);
  }, []);

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
        showDemo={showDemo}
        onSearchChange={setSearch}
        onCollectionChange={setCollection}
        onSortChange={setSort}
        onShowDemoChange={setShowDemo}
        onClear={handleClear}
      />
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>{filteredListings.length} resultados</span>
        {collection ? <span>Filtrado por {collection}</span> : null}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isHighlighted={highlightId === listing.id}
            onRemove={listing.source === "registry" ? () => handleRemove(listing.id) : undefined}
          />
        ))}
      </div>
      {!showDemo && !hasVerifiedListings ? (
        <div className="rounded-2xl border border-white/10 bg-obsidian-900/50 p-6 text-center text-white/60">
          No hay ofertas disponibles aún.
          <div className="mt-4">
            <a
              href="/create"
              className="inline-flex items-center rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-sm text-jade shadow-glow transition hover:bg-jade/20"
            >
              Create a real listing
            </a>
          </div>
        </div>
      ) : null}
      {filteredListings.length === 0 && (showDemo || hasVerifiedListings) ? (
        <div className="rounded-2xl border border-white/10 bg-obsidian-900/50 p-6 text-center text-white/60">
          No encontramos ofertas con esos filtros.
        </div>
      ) : null}
    </section>
  );
}
