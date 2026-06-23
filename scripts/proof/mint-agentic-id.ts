import { existsSync, readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defaultAgent } from "../../src/worldcup/agents";
import { loadLocalEnv, writeProofArtifact } from "./env";

loadLocalEnv();

const { zeroGGalileo, CONTRACTS } = await import("../../src/config/chain");

const agentIdAbi = [
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "encryptedMetadataHash", type: "bytes32" },
      { name: "storageUri", type: "string" },
      { name: "displayName", type: "string" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
] as const;

type AgenticArtifact = Record<string, unknown> & {
  contract?: string;
  encryptedMetadataHash?: `0x${string}`;
  status?: string;
  storageUri?: string;
};

if (!existsSync("proof-artifacts/agentic-id-latest.json")) {
  throw new Error("Missing agentic-id-latest.json. Run pnpm proof:agentic-id first.");
}

const privateKey = process.env.OG_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) throw new Error("Missing OG_PRIVATE_KEY.");
if (!CONTRACTS.agentId) throw new Error("Missing VITE_WORLD_CUP_AGENT_ID_ADDRESS.");

const current = JSON.parse(readFileSync("proof-artifacts/agentic-id-latest.json", "utf8")) as AgenticArtifact;
if (!current.encryptedMetadataHash || !current.storageUri) {
  throw new Error("Agentic artifact must include encryptedMetadataHash and storageUri.");
}
if (current.status === "minted" && current.contract === CONTRACTS.agentId) {
  console.log(JSON.stringify({ ...current, skipped: "already minted for configured Agentic ID contract" }, null, 2));
  process.exit(0);
}

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});
const walletClient = createWalletClient({
  account,
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});

const tokenId = await publicClient.readContract({
  address: CONTRACTS.agentId as `0x${string}`,
  abi: agentIdAbi,
  functionName: "nextTokenId",
});

const mintTxHash = await walletClient.writeContract({
  address: CONTRACTS.agentId as `0x${string}`,
  abi: agentIdAbi,
  functionName: "mintAgent",
  args: [current.encryptedMetadataHash, current.storageUri, defaultAgent.displayName],
});
const receipt = await publicClient.waitForTransactionReceipt({ hash: mintTxHash });

const artifact = {
  ...current,
  status: "minted",
  contractStatus: "minted",
  contract: CONTRACTS.agentId,
  tokenId: tokenId.toString(),
  mintTxHash,
  mintBlockNumber: receipt.blockNumber.toString(),
  owner: account.address,
};

writeProofArtifact("agentic-id-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
