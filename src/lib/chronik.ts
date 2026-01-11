import type {
  BlockchainInfo,
  ScriptType,
  ScriptUtxos,
  TokenInfo,
  Tx
} from "chronik-client";

import { getChronikClient } from "@/lib/chronikClient";

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

export type ChronikTx = Tx;
export type ChronikUtxo = ScriptUtxos["utxos"][number];
export type ChronikScriptUtxos = ScriptUtxos;
export type ChronikBlockchainInfo = BlockchainInfo;

function toChronikTokenInfo(info: TokenInfo): ChronikTokenInfo {
  const tokenType = info.tokenType as { number?: number; type?: string } | undefined;

  return {
    tokenId: info.tokenId,
    tokenType: tokenType?.number ?? tokenType?.type,
    tokenTicker: info.genesisInfo?.tokenTicker,
    tokenName: info.genesisInfo?.tokenName,
    url: info.genesisInfo?.url,
    decimals: info.genesisInfo?.decimals,
    tokenDocumentHash: info.genesisInfo?.hash
  };
}

export async function fetchToken(tokenId: string): Promise<ChronikTokenInfo> {
  if (!tokenId) {
    throw new Error("Missing tokenId for Chronik token lookup.");
  }
  const chronik = await getChronikClient();
  const info = await chronik.token(tokenId);
  return toChronikTokenInfo(info);
}

export async function fetchTx(txId: string): Promise<ChronikTx> {
  if (!txId) {
    throw new Error("Missing txId for Chronik transaction lookup.");
  }
  const chronik = await getChronikClient();
  return chronik.tx(txId);
}

export async function fetchUtxosByScript(params: {
  type: string;
  payload: string;
}): Promise<ChronikScriptUtxos> {
  const { type, payload } = params;
  if (!type || !payload) {
    throw new Error("Missing script type or payload for Chronik UTXO lookup.");
  }
  const chronik = await getChronikClient();
  return chronik.script(type as ScriptType, payload).utxos();
}

export async function fetchBlockchainInfo(): Promise<ChronikBlockchainInfo> {
  const chronik = await getChronikClient();
  return chronik.blockchainInfo();
}
