import { formatEther } from "viem";

export function shortAddr(addr?: string, size = 4): string {
  if (!addr) return "—";
  return `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`;
}

export function formatToken(wei?: bigint, dp = 4): string {
  if (wei === undefined) return "—";
  const n = Number(formatEther(wei));
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return n.toFixed(dp).replace(/\.?0+$/, "");
}

export function humanError(e: unknown): string {
  const msg =
    (e as { shortMessage?: string; message?: string })?.shortMessage ??
    (e as Error)?.message ??
    "Something went wrong";
  if (/user rejected|denied/i.test(msg)) return "Signature rejected";
  if (/insufficient funds/i.test(msg)) return "Not enough testnet 0G for gas";
  return msg.length > 120 ? msg.slice(0, 117) + "…" : msg;
}
