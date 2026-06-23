import { existsSync, readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
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

type RegistryAgent = Record<string, unknown> & {
  agenticStatus?: string;
  agenticTokenId?: string;
  displayName?: string;
  encryptedMetadataHash?: `0x${string}`;
  storageUri?: string;
};

if (!existsSync("proof-artifacts/agentic-registry-latest.json")) {
  throw new Error("Missing agentic-registry-latest.json. Run pnpm proof:agentic-registry first.");
}

const privateKey = process.env.OG_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) throw new Error("Missing OG_PRIVATE_KEY.");
if (!CONTRACTS.agentId) throw new Error("Missing VITE_WORLD_CUP_AGENT_ID_ADDRESS.");

const registry = JSON.parse(readFileSync("proof-artifacts/agentic-registry-latest.json", "utf8")) as {
  agents?: RegistryAgent[];
};
if (!Array.isArray(registry.agents) || registry.agents.length === 0) {
  throw new Error("Agentic registry artifact must include agents.");
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

async function waitForReceipt(hash: `0x${string}`) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    try {
      return await publicClient.getTransactionReceipt({ hash });
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
  throw new Error(`Timed out waiting for Agentic registry mint receipt ${hash}`);
}

for (const agent of registry.agents) {
  if (agent.agenticStatus === "minted" && agent.agenticTokenId && agent.contract === CONTRACTS.agentId) continue;
  if (!agent.encryptedMetadataHash || !agent.storageUri || !agent.displayName) {
    throw new Error(`Registry agent ${String(agent.agentId)} is missing metadata needed for mint.`);
  }
  const tokenId = await publicClient.readContract({
    address: CONTRACTS.agentId as `0x${string}`,
    abi: agentIdAbi,
    functionName: "nextTokenId",
  });
  const mintTxHash = await walletClient.writeContract({
    address: CONTRACTS.agentId as `0x${string}`,
    abi: agentIdAbi,
    functionName: "mintAgent",
    args: [agent.encryptedMetadataHash, agent.storageUri, agent.displayName],
  });
  const receipt = await waitForReceipt(mintTxHash);
  agent.agenticStatus = "minted";
  agent.agenticTokenId = tokenId.toString();
  agent.mintTxHash = mintTxHash;
  agent.mintBlockNumber = receipt.blockNumber.toString();
  agent.contract = CONTRACTS.agentId;
  agent.owner = account.address;
}

const artifact = {
  ...registry,
  status: "minted",
  contract: CONTRACTS.agentId,
  owner: account.address,
};

writeProofArtifact("agentic-registry-latest.json", artifact);
console.log(JSON.stringify({
  status: artifact.status,
  agents: artifact.agents?.map((agent) => ({
    agentId: agent.agentId,
    agenticTokenId: agent.agenticTokenId,
    agenticStatus: agent.agenticStatus,
  })),
}, null, 2));
