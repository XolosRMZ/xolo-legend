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
  verification?:
    | "available"
    | "spent"
    | "invalid"
    | "not_found"
    | "unknown";
};

// URL de tu Backend en el VPS de Hostinger
const API_URL = "http://72.62.161.240:3001/listings";

export function isRegistryPersistent() {
  return true; // Ahora es globalmente persistente
}

/**
 * Carga los listados desde el VPS (Global)
 */
export async function loadRegistry(): Promise<RegistryListing[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error al obtener datos");
    return await response.json();
  } catch (error) {
    console.error("Error cargando el registro global:", error);
    return [];
  }
}

/**
 * Guarda un listado nuevo en el VPS (Global)
 */
export async function addListing(listing: RegistryListing): Promise<void> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listing),
    });
    if (!response.ok) throw new Error("Error al guardar listado");
  } catch (error) {
    console.error("Error al publicar listado global:", error);
    throw error;
  }
}

/**
 * Nota: La eliminación requiere implementar DELETE en el backend.
 * Por ahora, devolvemos la lista vacía o local para no romper el tipo.
 */
export function removeListing(id: string): RegistryListing[] {
  console.warn("La eliminación global debe implementarse en el backend.");
  return [];
}
