export type ParsedOfferId = { txid: string; vout: number; raw: string };

export function parseOfferId(raw: string): ParsedOfferId | null {
  const s = raw.trim();
  if (!s) {
    return null;
  }
  const parts = s.split(":");
  if (parts.length !== 2) {
    return null;
  }
  const txid = parts[0].trim().toLowerCase();
  const voutStr = parts[1].trim();
  if (!/^[0-9a-f]{64}$/.test(txid)) {
    return null;
  }
  if (!/^\d+$/.test(voutStr)) {
    return null;
  }
  const vout = Number(voutStr);
  if (!Number.isSafeInteger(vout) || vout < 0) {
    return null;
  }
  return { txid, vout, raw: `${txid}:${vout}` };
}

export function isTxidOnly(raw: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(raw.trim());
}
