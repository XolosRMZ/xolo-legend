"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FixedNewListingButton() {
  const pathname = usePathname();

  if (pathname?.startsWith("/create")) {
    return null;
  }

  return (
    <Link
      href="/create"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-jade/40 bg-jade/20 px-5 py-3 text-sm font-semibold text-jade shadow-glow transition hover:bg-jade/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/60"
    >
      ➕ New Listing
    </Link>
  );
}
