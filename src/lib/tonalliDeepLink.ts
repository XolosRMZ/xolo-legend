const TONALLI_DEFAULT_MODE = "offer";
const TONALLI_DEFAULT_NETWORK = "XEC";
const TONALLI_RETURN_LABEL = "Back to XOLOLEGEND";

type TonalliDeepLinkOptions = {
  returnUrl?: string;
  type?: "rmz" | "nft";
  mode?: string;
  network?: string;
  baseUrl?: string;
  returnLabel?: string;
};

function getTonalliBaseUrl() {
  return process.env.NEXT_PUBLIC_TONALLI_URL ?? "https://app.tonalli.cash";
}

export function buildTonalliDeepLink(
  options: TonalliDeepLinkOptions = {}
): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const baseUrl = options.baseUrl ?? getTonalliBaseUrl();
  const returnUrl = options.returnUrl ?? `${window.location.origin}/create`;
  const url = new URL(baseUrl);

  url.searchParams.set("returnUrl", returnUrl);
  url.searchParams.set("returnLabel", options.returnLabel ?? TONALLI_RETURN_LABEL);
  url.searchParams.set("network", options.network ?? TONALLI_DEFAULT_NETWORK);
  url.searchParams.set("mode", options.mode ?? TONALLI_DEFAULT_MODE);
  if (options.type) {
    url.searchParams.set("type", options.type);
  }

  return url.toString();
}
