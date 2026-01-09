import Link from "next/link";

const navLinks = [
  { href: "/", label: "Marketplace" },
  { href: "/collections", label: "Collections" },
  { href: "/rmz", label: "RMZ" },
  { href: "/how-to-buy", label: "How to Buy" },
  { href: "/faq", label: "FAQ" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-obsidian-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-[0.2em] text-white">
            XOLOLEGEND
          </Link>
          <div className="flex gap-2 lg:hidden">
            <a
              href="https://tonalli.app"
              className="rounded-full border border-jade/40 px-3 py-1 text-xs text-jade"
            >
              Open Tonalli
            </a>
            <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
              Connect wallet
            </button>
          </div>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm text-white/70">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden gap-3 lg:flex">
          <a
            href="https://tonalli.app"
            className="rounded-full border border-jade/40 bg-jade/10 px-4 py-2 text-xs text-jade shadow-glow transition hover:bg-jade/20"
          >
            Open Tonalli
          </a>
          <button className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:border-white/30">
            Connect wallet
          </button>
        </div>
      </div>
    </header>
  );
}
