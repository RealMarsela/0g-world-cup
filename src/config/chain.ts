import { defineChain } from "viem";
import { envValue, hasEnv } from "./runtimeEnv";

export const zeroGGalileo = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: {
      http: [envValue("VITE_OG_RPC_URL") || envValue("OG_RPC_URL") || "https://evmrpc-testnet.0g.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "0G ChainScan Galileo",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
  testnet: true,
});

export const CONTRACTS = {
  draft: envValue("VITE_WORLD_CUP_DRAFT_ADDRESS") || "",
  escrow: envValue("VITE_WORLD_CUP_ESCROW_ADDRESS") || "",
  results: envValue("VITE_WORLD_CUP_RESULTS_ADDRESS") || "",
  agentId: envValue("VITE_WORLD_CUP_AGENT_ID_ADDRESS") || "",
} as const;

export const ZERO_G = {
  chainId: zeroGGalileo.id,
  rpcUrl: zeroGGalileo.rpcUrls.default.http[0],
  explorer: zeroGGalileo.blockExplorers.default.url,
  faucet: "https://faucet.0g.ai",
  storageIndexer:
    envValue("VITE_OG_STORAGE_INDEXER_URL") ||
    envValue("OG_STORAGE_INDEXER_URL") ||
    "https://indexer-storage-testnet-turbo.0g.ai",
  computeMode: hasEnv("VITE_OG_COMPUTE_API_KEY") || hasEnv("OG_COMPUTE_API_KEY") || hasEnv("ZEROG_ROUTER_API_KEY")
    ? "0G Compute Router"
    : "deterministic fallback",
  computeEndpoint:
    envValue("VITE_OG_COMPUTE_ENDPOINT") ||
    envValue("OG_COMPUTE_ENDPOINT") ||
    envValue("ZEROG_COMPUTE_ROUTER") ||
    "https://router-api-testnet.integratenetwork.work/v1",
};

export const PRIVY_APP_ID: string =
  envValue("VITE_PRIVY_APP_ID") || envValue("NEXT_PUBLIC_PRIVY_APP_ID") || "";
export const PRIVY_CLIENT_ID: string =
  envValue("VITE_PRIVY_CLIENT_ID") || envValue("NEXT_PUBLIC_PRIVY_CLIENT_ID") || "";
export const HAS_PRIVY = Boolean(PRIVY_APP_ID);

export const GAS_FLOOR_WEI = 100_000_000_000_000n;
export const EXPLORER = ZERO_G.explorer;
export const FAUCET_URL = ZERO_G.faucet;

export function explorerTx(hash: string) {
  return `${EXPLORER}/tx/${hash}`;
}

export function explorerAddress(addr: string) {
  return `${EXPLORER}/address/${addr}`;
}
