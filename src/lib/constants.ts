export const TONALLI_WEB_URL = "https://app.tonalli.cash/";
export const CONNECT_RETURN_PATH = "/connected";

export function getReturnUrl(path = CONNECT_RETURN_PATH): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `https://xololegend.xyz${path}`;
}
