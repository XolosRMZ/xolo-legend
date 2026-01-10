export type PaymentUtxo = {
  txId: string;
  vout: number;
  satoshis: number;
};

export type AtomicExecutionParams = {
  offerTxId: string;
  buyerAddress: string;
  paymentUtxos: PaymentUtxo[];
  feeRate: number;
};

export type EcashLib = {
  TxBuilder: new (...args: unknown[]) => unknown;
  P2PKHSignatory: new (...args: unknown[]) => unknown;
  calcTxFee: (...args: unknown[]) => number;
};

export type AtomicExecutionResult = {
  txHex: string;
  fee: number;
};

export function buildAtomicPurchaseTx(
  _params: AtomicExecutionParams,
  _ecashLib?: EcashLib
): AtomicExecutionResult {
  throw new Error("Atomic execution requires ecash-lib integration.");
}
