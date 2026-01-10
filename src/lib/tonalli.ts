import { TONALLI_WEB_URL } from "@/lib/constants";

type OpenTonalliOfferArgs = {
  offerId: string;
  deepLink?: string;
  fallbackUrl?: string;
  openInNewTab?: boolean;
};

export function openTonalliOffer({
  offerId,
  deepLink,
  fallbackUrl,
  openInNewTab
}: OpenTonalliOfferArgs) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const trimmedOfferId = offerId.trim();

  if (!trimmedOfferId) {
    return;
  }

  const encodedOfferId = encodeURIComponent(trimmedOfferId);
  const deep = deepLink ?? `tonalli://offer/${encodedOfferId}`;
  const fallbackBase = fallbackUrl ?? TONALLI_WEB_URL;
  const fallback = `${fallbackBase}${fallbackBase.includes("?") ? "&" : "?"}offerId=${encodedOfferId}`;

  let timerId: number | undefined;

  const cleanup = () => {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timerId = undefined;
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      cleanup();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.location.href = deep;

  timerId = window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      if (openInNewTab) {
        window.open(fallback, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = fallback;
      }
    }
    cleanup();
  }, 900);
}

type OpenTonalliAppArgs = {
  fallbackUrl?: string;
};

// MVP / UX-only opener for Tonalli.
export function openTonalliApp({ fallbackUrl }: OpenTonalliAppArgs = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const deep = "tonalli://open";
  const fallback = fallbackUrl ?? TONALLI_WEB_URL;

  let timerId: number | undefined;

  const cleanup = () => {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timerId = undefined;
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      cleanup();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.location.href = deep;

  timerId = window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      window.location.href = fallback;
    }
    cleanup();
  }, 900);
}

type OpenTonalliConnectArgs = {
  returnUrl: string;
};

export function openTonalliConnect({ returnUrl }: OpenTonalliConnectArgs) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const encodedReturnUrl = encodeURIComponent(returnUrl);
  const deep = `tonalli://connect?returnUrl=${encodedReturnUrl}&app=xololegend`;
  const fallback = `${TONALLI_WEB_URL}?action=connect&returnUrl=${encodedReturnUrl}`;

  let timerId: number | undefined;

  const cleanup = () => {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timerId = undefined;
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      cleanup();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.location.href = deep;

  timerId = window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      window.location.href = fallback;
    }
    cleanup();
  }, 900);
}
