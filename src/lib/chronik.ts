import { CHRONIK_URL } from "@/lib/constants";

export type ChronikTokenInfo = {
  tokenId?: string;
  tokenType?: number | string;
  tokenTicker?: string;
  tokenName?: string;
  url?: string;
  decimals?: number;
  tokenDocumentHash?: string;
  totalSupply?: string;
  genesisInfo?: {
    qty?: string;
  };
};

export type ChronikTx = Record<string, unknown>;
export type ChronikUtxo = Record<string, unknown>;
export type ChronikScriptUtxos = {
  outputScript?: string;
  utxos: ChronikUtxo[];
};

export type ChronikBlockchainInfo = {
  tipHeight: number;
  tipHash: string;
};

function joinChronikUrl(path: string) {
  const base = CHRONIK_URL.replace(/\/+$/, "");
  const trimmed = path.replace(/^\/+/, "");
  return `${base}/${trimmed}`;
}

export async function chronikFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(joinChronikUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Chronik request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

export function getChronikUrl(path = "") {
  return joinChronikUrl(path);
}

export async function fetchToken(tokenId: string): Promise<ChronikTokenInfo> {
  if (!tokenId) {
    throw new Error("Missing tokenId for Chronik token lookup.");
  }
  return chronikFetch<ChronikTokenInfo>(`token/${tokenId}`);
}

export async function fetchTx(txId: string): Promise<ChronikTx> {
  if (!txId) {
    throw new Error("Missing txId for Chronik transaction lookup.");
  }
  return chronikFetch<ChronikTx>(`tx/${txId}`);
}

export async function fetchUtxosByScript(params: {
  type: string;
  payload: string;
}): Promise<ChronikScriptUtxos | ChronikUtxo[]> {
  const { type, payload } = params;
  if (!type || !payload) {
    throw new Error("Missing script type or payload for Chronik UTXO lookup.");
  }
  return chronikFetch<ChronikScriptUtxos | ChronikUtxo[]>(
    `script/${type}/${payload}/utxos`
  );
}

export async function fetchBlockchainInfo(): Promise<ChronikBlockchainInfo> {
  return chronikFetch<ChronikBlockchainInfo>("blockchain-info");
}
