import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/ToastProvider";
import { FavoritesProvider } from "@/lib/storage";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "XOLOLEGEND | Marketplace de Leyendas",
  description: "NFT + RMZ token marketplace for XOLOLEGEND."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${spaceGrotesk.className} bg-hero-glow`}>
        <ToastProvider>
          <FavoritesProvider>
            <Header />
            <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10">
              {children}
            </main>
          </FavoritesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
