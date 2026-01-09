import collections from "@/data/collections.json";
import { CollectionCard } from "@/components/CollectionCard";

export default function CollectionsPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-10">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Colecciones</p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
          Explora las leyendas
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Filtra el marketplace por colección y descubre los guardianes disponibles.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </div>
  );
}
