import Link from "next/link";
import { CollectionInfo } from "@/lib/types";

interface CollectionCardProps {
  collection: CollectionInfo;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link
      href={`/?collection=${encodeURIComponent(collection.name)}`}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-obsidian-900/70 p-5 transition hover:border-jade/40 hover:shadow-glow"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-white/40">Colección</span>
        <span className="text-xs text-jade">Ver ofertas →</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-white">{collection.name}</h3>
      <p className="mt-2 text-sm text-white/70">{collection.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-white/60">
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-white/30">Supply</span>
          <span className="text-white">{collection.supply}</span>
        </div>
        <div>
          <span className="block text-xs uppercase tracking-[0.2em] text-white/30">Floor</span>
          <span className="text-white">{collection.floor}</span>
        </div>
      </div>
    </Link>
  );
}
