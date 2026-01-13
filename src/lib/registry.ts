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

// Endpoint de tu servidor en Hostinger
const API_URL = "http://72.62.161.240:3001/listings";

export function isRegistryPersistent() {
  return true; // Confirmamos que los datos ahora persisten globalmente
}

/**
 * Carga los listados desde la base de datos del VPS.
 */
export async function loadRegistry(): Promise<RegistryListing[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Error de red al cargar el registro global.");
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error cargando el registro global:", error);
    return [];
  }
}

/**
 * Envía un nuevo listado al VPS para que sea visible en todo el mundo.
 */
export async function addListing(listing: RegistryListing): Promise<void> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(listing),
    });
    if (!response.ok) {
      throw new Error("Error al guardar en el servidor global.");
    }
    console.log("Listado publicado exitosamente en el servidor.");
  } catch (error) {
    console.error("Error al publicar listado global:", error);
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
