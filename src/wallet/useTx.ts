import { useCallback } from "react";
import type { Abi, Address } from "viem";
import { publicClient } from "../lib/viem";
import { useXWallet } from "./useXWallet";
import { useToast } from "../components/toast";
import { humanError } from "../lib/format";

export type TxArgs = {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  pending: string;
  success: string;
};

/** Single-write tx: simulate → sign → wait → toast with explorer link. */
export function useTx() {
  const { getWalletClient, address } = useXWallet();
  const toast = useToast();

  return useCallback(
    async (tx: TxArgs): Promise<`0x${string}` | null> => {
      const id = toast.push({ kind: "pending", title: tx.pending });
      try {
        const wallet = await getWalletClient();
        const { request } = await publicClient.simulateContract({
          account: address,
          address: tx.address,
          abi: tx.abi,
          functionName: tx.functionName,
          args: (tx.args ?? []) as never,
          value: tx.value,
        });
        const hash = await wallet.writeContract(request);
        toast.update(id, { detail: "Confirming on 0G Galileo…", hash });
        await publicClient.waitForTransactionReceipt({ hash });
        toast.update(id, {
          kind: "success",
          title: tx.success,
          detail: undefined,
          hash,
        });
        return hash;
      } catch (e) {
        toast.update(id, {
          kind: "error",
          title: "Transaction failed",
          detail: humanError(e),
        });
        return null;
      }
    },
    [getWalletClient, address, toast],
  );
}
