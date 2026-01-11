import { fetchToken, fetchTx } from "@/lib/chronik";
import { RMZ_TOKEN_ID } from "@/lib/constants";
import { fetchRmzTokenInfo } from "@/lib/rmz";

export type OfferTerms =
  | {
      kind: "token";
      tokenId: string;
      sellAtoms: bigint;
      minAcceptedAtoms?: bigint;
      priceNanoSatsPerAtom: bigint;
      totalSats: bigint;
      xecTotal: string;
      xecPerToken: string;
      tokenAmount: string;
      source?: "askedSats" | "derived";
    }
  | { kind: "nft"; tokenId: string; priceSats: bigint; xecTotal: string };

function formatDecimal(value: bigint, decimals: number) {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  if (decimals <= 0) {
    return `${negative ? "-" : ""}${abs.toString()}`;
  }
  const raw = abs.toString().padStart(decimals + 1, "0");
  const whole = raw.slice(0, -decimals);
  const fraction = raw.slice(-decimals).replace(/0+$/, "");
  const result = fraction ? `${whole}.${fraction}` : whole;
  return negative ? `-${result}` : result;
}

function formatXecFromSats(sats: bigint) {
  return formatDecimal(sats, 2);
}

function formatTokenAmount(atoms: bigint, decimals: number) {
  return formatDecimal(atoms, decimals);
}

function formatXecPerToken(totalSats: bigint, sellAtoms: bigint, decimals: number) {
  if (sellAtoms === 0n) {
    return "0.0000";
  }
  const scale = 10n ** 6n;
  const numerator = totalSats * 10n ** BigInt(decimals) * scale;
  const denominator = 100n * sellAtoms;
  const scaled = numerator / denominator;
  const fixed = formatDecimal(scaled, 6);
  const parts = fixed.split(".");
  if (parts.length === 1) {
    return `${fixed}.0000`;
  }
  let fraction = parts[1];
  if (fraction.length < 4) {
    fraction = fraction.padEnd(4, "0");
  }
  return `${parts[0]}.${fraction}`;
}

async function fetchTokenDecimals(tokenId: string) {
  if (!tokenId) {
    return 0;
  }
  try {
    if (RMZ_TOKEN_ID && tokenId.toLowerCase() === RMZ_TOKEN_ID.toLowerCase()) {
      const rmzInfo = await fetchRmzTokenInfo();
      if (typeof rmzInfo.decimals === "number") {
        return rmzInfo.decimals;
      }
    }
    const info = await fetchToken(tokenId);
    if (typeof info.decimals === "number") {
      return info.decimals;
    }
  } catch (error) {
    console.warn("Token decimals lookup failed", error);
  }
  return 0;
}

export async function extractOfferTermsFromOutpoint(
  txid: string,
  vout: number
): Promise<OfferTerms | null> {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const tx = await fetchTx(txid);
    const outputs = tx.outputs ?? [];
    if (!Array.isArray(outputs) || outputs.length <= vout) {
      return null;
    }
    const output = outputs[vout];
    if (!output || typeof output !== "object") {
      return null;
    }
    const outputScript = (output as { outputScript?: string }).outputScript;
    if (!outputScript) {
      return null;
    }
    const plugin = (output as { plugins?: Record<string, unknown> }).plugins?.agora as
      | { data?: string[]; groups?: string[] }
      | undefined;
    const token = (output as {
      token?: {
        tokenId?: string;
        atoms?: bigint;
        tokenType?: { protocol?: string; number?: number };
      };
    }).token;
    if (!plugin?.data || plugin.data.length === 0 || !token?.tokenId) {
      return null;
    }

    const agora = await import("ecash-agora");
    const ecash = await import("ecash-lib");
    const { AgoraOneshot, AgoraPartial } = agora;
    const { Bytes, DEFAULT_DUST_SATS, fromHex, readTxOutput, strToBytes, toHex } =
      ecash;

    const covenantVariantHex = plugin.data[0];
    const oneshotHex = toHex(strToBytes(AgoraOneshot.COVENANT_VARIANT));
    const partialHex = toHex(strToBytes(AgoraPartial.COVENANT_VARIANT));

    if (covenantVariantHex === partialHex) {
      const [
        ,
        numAtomsTruncBytesHex,
        numSatsTruncBytesHex,
        atomsScaleFactorHex,
        scaledTruncAtomsPerTruncSatHex,
        minAcceptedScaledTruncAtomsHex,
        enforcedLockTimeHex
      ] = plugin.data;
      if (
        !numAtomsTruncBytesHex ||
        !numSatsTruncBytesHex ||
        !atomsScaleFactorHex ||
        !scaledTruncAtomsPerTruncSatHex ||
        !minAcceptedScaledTruncAtomsHex ||
        !enforcedLockTimeHex
      ) {
        return null;
      }
      const numAtomsTruncBytes = fromHex(numAtomsTruncBytesHex)[0];
      const numSatsTruncBytes = fromHex(numSatsTruncBytesHex)[0];
      const atomsScaleFactor = new Bytes(fromHex(atomsScaleFactorHex)).readU64();
      const scaledTruncAtomsPerTruncSat = new Bytes(
        fromHex(scaledTruncAtomsPerTruncSatHex)
      ).readU64();
      const minAcceptedScaledTruncAtoms = new Bytes(
        fromHex(minAcceptedScaledTruncAtomsHex)
      ).readU64();
      const enforcedLockTime = new Bytes(fromHex(enforcedLockTimeHex)).readU32();

      const pubkeyPrefix = toHex(strToBytes("P"));
      const makerPkGroupHex = plugin.groups?.find((group) =>
        group.startsWith(pubkeyPrefix)
      );
      if (!makerPkGroupHex || !token.tokenType || typeof token.atoms !== "bigint") {
        return null;
      }
      const makerPk = fromHex(makerPkGroupHex.substring(pubkeyPrefix.length));
      const protocol = token.tokenType.protocol;
      if (protocol !== "SLP" && protocol !== "ALP") {
        return null;
      }
      const tokenType = token.tokenType.number ?? 0;
      const truncAtoms =
        token.atoms >> (8n * BigInt(numAtomsTruncBytes));

      const agoraPartial = new AgoraPartial({
        truncAtoms,
        numAtomsTruncBytes,
        atomsScaleFactor,
        scaledTruncAtomsPerTruncSat,
        numSatsTruncBytes,
        makerPk,
        minAcceptedScaledTruncAtoms,
        tokenId: token.tokenId,
        tokenType,
        tokenProtocol: protocol,
        scriptLen: 0x7f,
        enforcedLockTime,
        dustSats: DEFAULT_DUST_SATS
      });
      agoraPartial.updateScriptLen();

      const sellAtoms = agoraPartial.offeredAtoms();
      const minAcceptedAtoms = agoraPartial.minAcceptedAtoms();
      const askedSats = agoraPartial.askedSats(sellAtoms);
      const priceNanoSatsPerAtom = agoraPartial.priceNanoSatsPerAtom(sellAtoms);
      const derivedTotalSats =
        (priceNanoSatsPerAtom * sellAtoms) / 1_000_000_000n;
      const totalSats = askedSats > 0n ? askedSats : derivedTotalSats;
      const decimals = await fetchTokenDecimals(token.tokenId);
      return {
        kind: "token",
        tokenId: token.tokenId,
        sellAtoms,
        minAcceptedAtoms,
        priceNanoSatsPerAtom,
        totalSats,
        xecTotal: formatXecFromSats(totalSats),
        xecPerToken: formatXecPerToken(totalSats, sellAtoms, decimals),
        tokenAmount: formatTokenAmount(sellAtoms, decimals),
        source: askedSats > 0n ? "askedSats" : "derived"
      };
    }

    if (covenantVariantHex === oneshotHex) {
      const outputsSerHex = plugin.data[1];
      if (!outputsSerHex || typeof outputsSerHex !== "string") {
        return null;
      }
      const outputsSerBytes = new Bytes(fromHex(outputsSerHex));
      let totalSats = 0n;
      while (outputsSerBytes.data.length > outputsSerBytes.idx) {
        const enforcedOutput = readTxOutput(outputsSerBytes);
        totalSats += enforcedOutput.sats;
      }
      if (typeof token.atoms !== "bigint" || token.atoms !== 1n) {
        return null;
      }
      return {
        kind: "nft",
        tokenId: token.tokenId,
        priceSats: totalSats,
        xecTotal: formatXecFromSats(totalSats)
      };
    }
  } catch (error) {
    console.warn("Failed to parse offer terms", error);
  }
  return null;
}
