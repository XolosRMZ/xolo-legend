import { RMZ_STATE_TOKEN_ID, RMZ_TOKEN_ID } from "@/lib/constants";
import { fetchToken } from "@/lib/chronik";

export function requireRmzTokenId() {
  if (!RMZ_TOKEN_ID) {
    throw new Error("RMZ token ID is not configured.");
  }
  return RMZ_TOKEN_ID;
}

export function requireRmzStateTokenId() {
  if (!RMZ_STATE_TOKEN_ID) {
    throw new Error("RMZState token ID is not configured.");
  }
  return RMZ_STATE_TOKEN_ID;
}

export async function fetchRmzTokenInfo() {
  return fetchToken(requireRmzTokenId());
}
