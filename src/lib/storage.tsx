"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

// Minimal localStorage-backed state for client persistence.
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const initialRef = useRef(initialValue);

  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        setValue(JSON.parse(stored));
      } catch {
        setValue(initialRef.current);
      }
    } else {
      setValue(initialRef.current);
    }
  }, [key]);

  const updateValue = useCallback(
    (next: T) => {
      setValue(next);
      window.localStorage.setItem(key, JSON.stringify(next));
    },
    [key]
  );

  return [value, updateValue] as const;
}

export function useTxid(listingId: string) {
  const key = `xololegend:txid:${listingId}`;
  const [txid, setTxid] = useLocalStorageState<string>(key, "");
  return { txid, setTxid };
}

interface FavoritesContextValue {
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const key = "xololegend:favorites";
  const [favorites, setFavorites] = useLocalStorageState<string[]>(key, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      const next = favorites.includes(id)
        ? favorites.filter((fav) => fav !== id)
        : [...favorites, id];
      setFavorites(next);
    },
    [favorites, setFavorites]
  );

  const value = useMemo(() => ({ favorites, toggleFavorite }), [favorites, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
