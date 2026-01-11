import { getReturnUrl, TONALLI_WEB_URL } from "@/lib/constants";
import { openTonalliOffer } from "@/lib/tonalli";
import { verifyOfferOutpoint, type OfferStatus } from "@/lib/offers";

export async function loadOfferById(offerId: string): Promise<OfferStatus> {
  return verifyOfferOutpoint(offerId);
}

export async function createSellOfferToken() {
  throw new Error(
    "createSellOfferToken requires ecash-agora/ecash-lib integration."
  );
}

type AcceptOfferByIdArgs = {
  offerId: string;
  returnUrl?: string;
  deepLink?: string;
  fallbackUrl?: string;
};

export async function acceptOfferById({
  offerId,
  returnUrl,
  deepLink,
  fallbackUrl
}: AcceptOfferByIdArgs) {
  const trimmed = offerId.trim();
  if (!trimmed) {
    throw new Error("Missing offerId for acceptOfferById.");
  }
  const encodedOfferId = encodeURIComponent(trimmed);
  const resolvedReturnUrl = returnUrl ?? getReturnUrl(`/tx?offerId=${encodedOfferId}`);
  const encodedReturnUrl = encodeURIComponent(resolvedReturnUrl);
  const attachReturnUrl = (url: string) => {
    if (!url || url.includes("returnUrl=")) {
      return url;
    }
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}returnUrl=${encodedReturnUrl}`;
  };
  const deep = attachReturnUrl(
    deepLink ?? `tonalli://offer/${encodedOfferId}`
  );
  const fallback = attachReturnUrl(
    fallbackUrl ?? `${TONALLI_WEB_URL}?offerId=${encodedOfferId}`
  );
  openTonalliOffer({ offerId: trimmed, deepLink: deep, fallbackUrl: fallback });
}
