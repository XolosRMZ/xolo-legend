import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-10 text-center">
      <h1 className="text-3xl font-semibold text-white">Oferta no encontrada</h1>
      <p className="text-sm text-white/60">
        La leyenda que buscas no existe o fue retirada.
      </p>
      <Link
        href="/"
        className="inline-flex rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-sm text-jade"
      >
        Volver al marketplace
      </Link>
    </div>
  );
}
