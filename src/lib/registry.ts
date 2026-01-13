// src/lib/registry.ts

// Esta línea lee la variable que configuraste en Vercel
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.xololegend.xyz/listings";

export type RegistryListing = {
  id: string;
  createdAt: number;
  title: string;
  description?: string;
  collection?: string;
  imageUrl?: string;
  offerTxId: string;
  tokenId?: string;
  priceSats?: string;
  amountAtoms?: string;
  verification?: "available" | "spent" | "invalid" | "not_found" | "unknown";
};

/**
 * Indica que el sistema es global
 */
export function isRegistryPersistent() {
  return true;
}

/**
 * Carga los listados globales
 */
export async function loadRegistry(): Promise<RegistryListing[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error en servidor");
    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    // Normalizamos los campos para que el frontend siempre lea 'offerTxId'
    return data.map((item: any) => ({
      ...item,
      offerTxId: item.offerTxId || item.offertxid || "",
      tokenId: item.tokenId || item.tokenid || "",
      priceSats: item.priceSats || item.pricesats || "",
      amountAtoms: item.amountAtoms || item.amountatoms || "",
      verification: item.verification || "unknown"
    }));
  } catch (error) {
    console.error("Error cargando registro:", error);
    return [];
  }
}

/**
 * Publica un listado al VPS de Hostinger
 */
export async function addListing(listing: RegistryListing): Promise<void> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listing),
    });
    if (!response.ok) throw new Error("Error al guardar en el servidor");
  } catch (error) {
    console.error("Error de red al publicar:", error);
    throw error;
  }
}

/**
 * Funciones de mantenimiento (Requieren implementación de DELETE/PUT en el backend)
 */
export function removeListing(id: string): RegistryListing[] {
  console.warn(
    "La eliminación global requiere implementar el método DELETE en el backend."
  );
  return [];
}

export function updateListing(id: string, patch: Partial<RegistryListing>) {
  console.warn(
    "La actualización global requiere implementar el método PUT en el backend."
  );
}
