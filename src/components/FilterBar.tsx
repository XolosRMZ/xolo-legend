"use client";

interface FilterBarProps {
  search: string;
  collection: string;
  sort: string;
  collections: string[];
  onSearchChange: (value: string) => void;
  onCollectionChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClear: () => void;
}

export function FilterBar({
  search,
  collection,
  sort,
  collections,
  onSearchChange,
  onCollectionChange,
  onSortChange,
  onClear
}: FilterBarProps) {
  return (
    <div className="sticky top-16 z-20 border-y border-white/10 bg-obsidian-950/90 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 md:flex-row md:items-center">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nombre, colección u Offer ID"
          aria-label="Buscar"
          className="w-full flex-1 rounded-xl border border-white/10 bg-obsidian-900/80 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
        />
        <select
          value={collection}
          onChange={(event) => onCollectionChange(event.target.value)}
          aria-label="Filtrar por colección"
          className="w-full rounded-xl border border-white/10 bg-obsidian-900/80 px-4 py-3 text-sm text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade md:w-48"
        >
          <option value="">Todas las colecciones</option>
          {collections.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          aria-label="Ordenar"
          className="w-full rounded-xl border border-white/10 bg-obsidian-900/80 px-4 py-3 text-sm text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade md:w-44"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price asc</option>
          <option value="price-desc">Price desc</option>
        </select>
        <button
          onClick={onClear}
          className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:border-jade hover:text-jade md:w-auto"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
