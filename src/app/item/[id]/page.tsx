"use client";

import { useEffect, useState } from "react";
import { loadRegistry, type RegistryListing } from "@/lib/registry";
import { ListingDetails } from "@/components/ListingDetails";

interface ItemPageProps {
  params: { id: string };
}

export default function ItemPage({ params }: ItemPageProps) {
  const [listing, setListing] = useState<RegistryListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistry().then((listings) => {
      const found = listings.find((l) => l.id === params.id);
      setListing(found || null);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-center">Cargando templo...</div>;
  }

  if (!listing) {
    return <div className="p-8 text-center">Listado no encontrado.</div>;
  }

  return (
    <div className="container py-8">
      <ListingDetails listing={listing} />
    </div>
  );
}
