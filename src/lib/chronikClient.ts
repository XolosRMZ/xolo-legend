import type { ChronikClient } from "chronik-client";

import { CHRONIK_URL } from "@/lib/constants";

let chronikPromise: Promise<ChronikClient> | null = null;

export async function getChronikClient(): Promise<ChronikClient> {
  if (typeof window === "undefined") {
    throw new Error("Chronik client is only available in the browser.");
  }
  if (!chronikPromise) {
    chronikPromise = (async () => {
      const { ChronikClient } = await import("chronik-client");
      return new ChronikClient(CHRONIK_URL);
    })();
  }
  return chronikPromise;
}
