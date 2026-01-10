"use client";

interface FilterBarProps {
  search: string;
  collection: string;
  sort: string;
  collections: string[];
  showDemo: boolean;
  onSearchChange: (value: string) => void;
  onCollectionChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onShowDemoChange: (value: boolean) => void;
  onClear: () => void;
}

export function FilterBar({
  search,
  collection,
  sort,
  collections,
  showDemo,
  onSearchChange,
  onCollectionChange,
  onSortChange,
  onShowDemoChange,
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
        <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-xs text-white/70 md:w-auto">
          <span>Show demo/invalid</span>
          <button
            onClick={() => onShowDemoChange(!showDemo)}
            type="button"
            className={`relative h-5 w-9 rounded-full border transition ${
              showDemo
                ? "border-jade/60 bg-jade/30"
                : "border-white/20 bg-obsidian-900/80"
            }`}
            aria-pressed={showDemo}
            aria-label="Show demo and invalid listings"
          >
            <span
              className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white transition ${
                showDemo ? "left-5" : "left-1"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
