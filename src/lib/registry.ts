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
  verification?: "verified" | "invalid" | "spent" | "not_found" | "unknown";
};

const REGISTRY_KEY = "xololegend_registry_v1";
let memoryCache: RegistryListing[] | null = null;
let storageAvailable: boolean | null = null;

function isClient() {
  return typeof window !== "undefined";
}

function canUseStorage() {
  if (!isClient()) {
    return false;
  }
  if (storageAvailable !== null) {
    return storageAvailable;
  }
  try {
    const testKey = "__xolo_registry_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function isRegistryPersistent() {
  return canUseStorage();
}

export function loadRegistry(): RegistryListing[] {
  if (!isClient()) {
    return [];
  }
  if (memoryCache) {
    return memoryCache;
  }
  if (!canUseStorage()) {
    memoryCache = [];
    return memoryCache;
  }
  const stored = window.localStorage.getItem(REGISTRY_KEY);
  if (!stored) {
    memoryCache = [];
    return memoryCache;
  }
  try {
    const parsed = JSON.parse(stored);
    memoryCache = Array.isArray(parsed) ? (parsed as RegistryListing[]) : [];
  } catch {
    memoryCache = [];
  }
  return memoryCache;
}

export function saveRegistry(list: RegistryListing[]) {
  if (!isClient()) {
    return;
  }
  memoryCache = list;
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(list));
}

export function addListing(listing: RegistryListing) {
  const next = [listing, ...loadRegistry()];
  saveRegistry(next);
  return next;
}

export function removeListing(id: string) {
  const next = loadRegistry().filter((listing) => listing.id !== id);
  saveRegistry(next);
  return next;
}

export function updateListing(
  id: string,
  patch: Partial<RegistryListing>
) {
  const next = loadRegistry().map((listing) =>
    listing.id === id ? { ...listing, ...patch } : listing
  );
  saveRegistry(next);
  return next;
}
