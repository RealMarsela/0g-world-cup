import { createPublicClient, http } from "viem";
import { zeroGGalileo } from "../config/chain";

// Shared read client — the chain is the source of truth.
export const publicClient = createPublicClient({
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});
