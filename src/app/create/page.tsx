"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useOnChain, type OfferStatus } from "@/state/onchain";
import { addListing, isRegistryPersistent, type RegistryListing } from "@/lib/registry";
import { RMZ_TOKEN_ID, TONALLI_WEB_URL } from "@/lib/constants";

type Step = 1 | 2 | 3;

function buildId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `listing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { offerStatusCache, verifyOffer, configWarning } = useOnChain();
  const [step, setStep] = useState<Step>(1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collection, setCollection] = useState("");
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  const [offerTxId, setOfferTxId] = useState("");
  const [verification, setVerification] = useState<OfferStatus | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPersistent, setIsPersistent] = useState(true);

  useEffect(() => {
    setIsPersistent(isRegistryPersistent());
  }, []);

  useEffect(() => {
    const trimmed = offerTxId.trim();
    if (!trimmed) {
      setVerification(undefined);
      return;
    }
    const cached = offerStatusCache[trimmed];
    if (cached) {
      setVerification(cached);
    }
  }, [offerTxId, offerStatusCache]);

  const previewImage =
    imageMode === "upload" ? imageDataUrl : imageUrl;

  const canAdvanceFromDetails = title.trim().length > 0;
  const isVerified = verification?.status === "verified";
  const canPublish = isVerified;

  const tokenMismatch = useMemo(() => {
    if (!isVerified || !verification?.tokenId || !RMZ_TOKEN_ID) {
      return false;
    }
    return verification.tokenId.toLowerCase() !== RMZ_TOKEN_ID.toLowerCase();
  }, [isVerified, verification?.tokenId]);

  const verificationLabel = useMemo(() => {
    if (!offerTxId.trim()) {
      return "Paste an Offer ID to verify.";
    }
    if (isVerifying || verification?.isChecking) {
      return "Checking…";
    }
    if (!verification) {
      return "Ready to verify.";
    }
    if (verification.status === "verified") {
      return "✅ Verified on-chain";
    }
    if (verification.status === "spent") {
      return "⚠️ Spent offer";
    }
    if (verification.status === "not_found") {
      return "⚠️ Offer not found";
    }
    if (verification.status === "invalid") {
      return "⚠️ Invalid offer";
    }
    return "⚠️ Unknown";
  }, [isVerifying, offerTxId, verification]);

  const handleVerify = async () => {
    const trimmed = offerTxId.trim();
    if (!trimmed) {
      return;
    }
    setIsVerifying(true);
    const result = await verifyOffer(trimmed);
    if (result) {
      setVerification(result);
    }
    setIsVerifying(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImageDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = () => {
    if (!canPublish) {
      return;
    }
    const trimmed = offerTxId.trim();
    const listing: RegistryListing = {
      id: buildId(),
      createdAt: Date.now(),
      title: title.trim(),
      description: description.trim() || undefined,
      collection: collection.trim() || undefined,
      imageUrl: previewImage || undefined,
      offerTxId: trimmed,
      tokenId: verification?.tokenId,
      priceSats:
        verification?.priceSats !== undefined
          ? String(verification.priceSats)
          : undefined,
      amountAtoms: verification?.amountAtoms,
      verification: verification?.status ?? "unknown"
    };
    addListing(listing);
    router.push(`/?highlight=${listing.id}`);
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-obsidian-900/70 px-6 py-8 shadow-glow">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          Creator Flow
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
          Create a verified listing.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Add listing details, verify an Agora Offer ID on-chain, and publish it to
          the marketplace instantly.
        </p>
        {!isPersistent ? (
          <p className="mt-4 text-xs text-gold">
            Saved locally for this session only.
          </p>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <div
            className={`rounded-2xl border bg-obsidian-900/60 p-6 ${
              step === 1 ? "border-jade/40" : "border-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Step 1 · Listing details</h2>
              <span className="text-xs text-white/50">Required: title</span>
            </div>
            <div className="mt-4 grid gap-4">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                className="w-full rounded-xl border border-white/10 bg-obsidian-950/70 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-obsidian-950/70 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
              />
              <input
                value={collection}
                onChange={(event) => setCollection(event.target.value)}
                placeholder="Collection"
                className="w-full rounded-xl border border-white/10 bg-obsidian-950/70 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
              />
              <div className="rounded-xl border border-white/10 bg-obsidian-950/60 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                  <button
                    onClick={() => setImageMode("url")}
                    className={`rounded-full border px-3 py-1 transition ${
                      imageMode === "url"
                        ? "border-jade/50 bg-jade/10 text-jade"
                        : "border-white/10 text-white/60 hover:border-white/30"
                    }`}
                    type="button"
                  >
                    Image URL
                  </button>
                  <button
                    onClick={() => setImageMode("upload")}
                    className={`rounded-full border px-3 py-1 transition ${
                      imageMode === "upload"
                        ? "border-jade/50 bg-jade/10 text-jade"
                        : "border-white/10 text-white/60 hover:border-white/30"
                    }`}
                    type="button"
                  >
                    Upload file
                  </button>
                </div>
                {imageMode === "url" ? (
                  <input
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://image.url/..."
                    className="mt-3 w-full rounded-xl border border-white/10 bg-obsidian-900/80 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
                  />
                ) : (
                  <div className="mt-3 flex flex-col gap-2 text-xs text-white/60">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full rounded-xl border border-white/10 bg-obsidian-900/80 px-4 py-3 text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-jade/10 file:px-3 file:py-1 file:text-xs file:text-jade"
                    />
                    <span>Stored as data URL in localStorage.</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canAdvanceFromDetails}
                  className="rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-xs text-jade shadow-glow transition hover:bg-jade/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
                >
                  Continue to Offer ID
                </button>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border bg-obsidian-900/60 p-6 ${
              step === 2 ? "border-jade/40" : "border-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Step 2 · Offer ID</h2>
              <span className="text-xs text-white/50">Required: txid</span>
            </div>
            <div className="mt-4 grid gap-4">
              <input
                value={offerTxId}
                onChange={(event) => setOfferTxId(event.target.value)}
                placeholder="Paste Agora Offer ID"
                className="w-full rounded-xl border border-white/10 bg-obsidian-950/70 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-jade"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleVerify}
                  disabled={!offerTxId.trim() || isVerifying}
                  className="rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-xs text-jade shadow-glow transition hover:bg-jade/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
                >
                  Verify on-chain
                </button>
                <span className="text-xs text-white/60">{verificationLabel}</span>
              </div>
              {configWarning ? (
                <p className="text-xs text-gold">On-chain config missing.</p>
              ) : null}
              {verification?.status === "verified" ? (
                <div className="rounded-xl border border-jade/30 bg-obsidian-950/70 px-4 py-3 text-xs text-white/70">
                  <div>Price: {verification.priceSats?.toLocaleString() ?? "—"} sats</div>
                  <div>Amount: {verification.amountAtoms ?? "—"} atoms</div>
                  <div>Token ID: {verification.tokenId ?? "—"}</div>
                </div>
              ) : null}
              {tokenMismatch ? (
                <p className="text-xs text-gold">
                  This offer tokenId does not match RMZ. You can still publish.
                </p>
              ) : null}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-full border border-white/10 px-5 py-2 text-xs text-white/60 transition hover:border-white/30"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!isVerified}
                  className="rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-xs text-jade shadow-glow transition hover:bg-jade/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
                >
                  Continue to publish
                </button>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border bg-obsidian-900/60 p-6 ${
              step === 3 ? "border-jade/40" : "border-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Step 3 · Publish listing</h2>
              <span className="text-xs text-white/50">Verified only</span>
            </div>
            <div className="mt-4 grid gap-4">
              <div className="rounded-xl border border-white/10 bg-obsidian-950/70 px-4 py-3 text-xs text-white/70">
                <p>Offer ID: {offerTxId.trim() || "—"}</p>
                <p>Status: {verification?.status ?? "unknown"}</p>
                <p>Tonalli: {TONALLI_WEB_URL}</p>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-full border border-white/10 px-5 py-2 text-xs text-white/60 transition hover:border-white/30"
                >
                  Back
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className="rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-xs text-jade shadow-glow transition hover:bg-jade/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
                >
                  Publish listing
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-obsidian-900/60 p-6">
            <h3 className="text-base font-semibold text-white">Live preview</h3>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-obsidian-950/70">
              <div className="aspect-square overflow-hidden border-b border-white/10 bg-obsidian-900/80">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/40">
                    Preview image
                  </div>
                )}
              </div>
              <div className="p-4 text-sm text-white/80">
                <div className="text-base font-semibold text-white">
                  {title || "Listing title"}
                </div>
                <div className="mt-2 text-xs text-white/60">
                  {collection || "Collection"}
                </div>
                <p className="mt-3 text-xs text-white/60">
                  {description || "Listing description"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-obsidian-900/60 p-6 text-xs text-white/60">
            <p className="text-white/80">Tips</p>
            <ul className="mt-3 space-y-2">
              <li>Use a clear title for easier discovery.</li>
              <li>Verify the Offer ID before publishing.</li>
              <li>Listings show only when verified by default.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
