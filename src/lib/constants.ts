export const TONALLI_WEB_URL =
  process.env.NEXT_PUBLIC_TONALLI_URL ?? "https://app.tonalli.cash";
export const CONNECT_RETURN_PATH = "/connected";
export const CHRONIK_URL =
  process.env.NEXT_PUBLIC_CHRONIK_URL ?? "https://chronik.xolosarmy.xyz";
export const RMZ_TOKEN_ID = process.env.NEXT_PUBLIC_RMZ_TOKEN_ID ?? "";
export const RMZ_STATE_TOKEN_ID = process.env.NEXT_PUBLIC_RMZ_STATE_TOKEN_ID ?? "";

export function getReturnUrl(path = CONNECT_RETURN_PATH): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `https://xololegend.xyz${path}`;
}
