import { existsSync, readFileSync } from "node:fs";
import { createPublicClient, http, keccak256, toBytes } from "viem";
import { loadLocalEnv, writeProofArtifact } from "./env";

loadLocalEnv();

const { zeroGGalileo, CONTRACTS } = await import("../../src/config/chain");

type ChainArtifact = Record<string, unknown> & {
  contract?: string;
  roomId?: string;
  storageUri?: string;
};

type AgenticArtifact = Record<string, unknown> & {
  contract?: string;
  encryptedMetadataHash?: string;
  owner?: string;
  storageUri?: string;
  tokenId?: string;
};

const resultAbi = [
  {
    type: "function",
    name: "results",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "snapshotHash", type: "bytes32" },
      { name: "lineupHash", type: "bytes32" },
      { name: "resultHash", type: "bytes32" },
      { name: "storageUri", type: "string" },
      { name: "winner", type: "address" },
      { name: "exists", type: "bool" },
    ],
  },
] as const;

const agentIdAbi = [
  {
    type: "function",
    name: "agents",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "encryptedMetadataHash", type: "bytes32" },
      { name: "storageUri", type: "string" },
      { name: "displayName", type: "string" },
      { name: "authorizedExecutor", type: "address" },
      { name: "exists", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function readArtifact<T>(name: string): T {
  const path = `proof-artifacts/${name}`;
  if (!existsSync(path)) throw new Error(`Missing ${name}.`);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function asBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value as `0x${string}` : keccak256(toBytes(value));
}

async function codeStatus(client: ReturnType<typeof createPublicClient>, address: string) {
  if (!address) return { address, hasCode: false };
  const code = await client.getCode({ address: address as `0x${string}` });
  return { address, hasCode: Boolean(code && code !== "0x"), byteLength: code ? (code.length - 2) / 2 : 0 };
}

const chain = readArtifact<ChainArtifact>("chain-result-latest.json");
const agentic = readArtifact<AgenticArtifact>("agentic-id-latest.json");
if (!chain.roomId) throw new Error("chain-result-latest.json missing roomId.");
if (!chain.storageUri) throw new Error("chain-result-latest.json missing storageUri.");
if (!agentic.tokenId) throw new Error("agentic-id-latest.json missing tokenId.");
if (!agentic.encryptedMetadataHash) throw new Error("agentic-id-latest.json missing encryptedMetadataHash.");
if (!agentic.storageUri) throw new Error("agentic-id-latest.json missing storageUri.");

const client = createPublicClient({
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});

const [draftCode, escrowCode, resultsCode, agentIdCode] = await Promise.all([
  codeStatus(client, CONTRACTS.draft),
  codeStatus(client, CONTRACTS.escrow),
  codeStatus(client, CONTRACTS.results),
  codeStatus(client, CONTRACTS.agentId),
]);

const resultReceipt = await client.readContract({
  address: CONTRACTS.results as `0x${string}`,
  abi: resultAbi,
  functionName: "results",
  args: [asBytes32(chain.roomId)],
});

const agentToken = await client.readContract({
  address: CONTRACTS.agentId as `0x${string}`,
  abi: agentIdAbi,
  functionName: "agents",
  args: [BigInt(agentic.tokenId)],
});

const nextTokenId = await client.readContract({
  address: CONTRACTS.agentId as `0x${string}`,
  abi: agentIdAbi,
  functionName: "nextTokenId",
});

const checks = {
  contractsHaveCode: [draftCode, escrowCode, resultsCode, agentIdCode].every((item) => item.hasCode),
  resultExists: resultReceipt[5],
  resultStorageMatches: resultReceipt[3] === chain.storageUri,
  agentTokenExists: agentToken[5],
  agentMetadataMatches: agentToken[1].toLowerCase() === agentic.encryptedMetadataHash.toLowerCase(),
  agentStorageMatches: agentToken[2] === agentic.storageUri,
};

const artifact = {
  status: Object.values(checks).every(Boolean) ? "live" : "mismatch",
  chainId: zeroGGalileo.id,
  blockNumber: (await client.getBlockNumber()).toString(),
  contracts: {
    draft: draftCode,
    escrow: escrowCode,
    results: resultsCode,
    agentId: agentIdCode,
  },
  resultReadback: {
    roomId: chain.roomId,
    roomHash: asBytes32(chain.roomId),
    snapshotHash: resultReceipt[0],
    lineupHash: resultReceipt[1],
    resultHash: resultReceipt[2],
    storageUri: resultReceipt[3],
    winner: resultReceipt[4],
    exists: resultReceipt[5],
  },
  agenticReadback: {
    tokenId: agentic.tokenId,
    owner: agentToken[0],
    encryptedMetadataHash: agentToken[1],
    storageUri: agentToken[2],
    displayName: agentToken[3],
    authorizedExecutor: agentToken[4],
    exists: agentToken[5],
    nextTokenId: nextTokenId.toString(),
  },
  checks,
};

writeProofArtifact("chain-readback-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
