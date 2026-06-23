import { existsSync, readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http, keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadLocalEnv, writeProofArtifact } from "./env";

loadLocalEnv();

const { zeroGGalileo, CONTRACTS } = await import("../../src/config/chain");
const { completeDraft, createRoomFromId, simulate } = await import("../../src/worldcup/game");

const resultAbi = [
  {
    type: "function",
    name: "commitResult",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roomId", type: "bytes32" },
      { name: "snapshotHash", type: "bytes32" },
      { name: "lineupHash", type: "bytes32" },
      { name: "resultHash", type: "bytes32" },
      { name: "storageUri", type: "string" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
  },
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

type ChainResultArtifact = {
  status?: string;
  roomId?: string;
  txHash?: string;
  contract?: string;
  storageUri?: string;
};

function asBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value as `0x${string}` : keccak256(toBytes(value));
}

const privateKey = process.env.OG_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) throw new Error("Missing OG_PRIVATE_KEY.");
if (!CONTRACTS.results) throw new Error("Missing VITE_WORLD_CUP_RESULTS_ADDRESS.");

const previousArtifact = existsSync("proof-artifacts/chain-result-latest.json")
  ? JSON.parse(readFileSync("proof-artifacts/chain-result-latest.json", "utf8")) as ChainResultArtifact
  : {};
const roomId = process.argv[2] || previousArtifact.roomId || "room-human-vs-agent-chain";
const room = completeDraft(createRoomFromId(roomId));
const result = simulate(room);
const storageArtifact = existsSync("proof-artifacts/storage-latest.json")
  ? JSON.parse(readFileSync("proof-artifacts/storage-latest.json", "utf8")) as { storageUri?: string }
  : {};
const storageUri = storageArtifact.storageUri || result.storageUri;
const account = privateKeyToAccount(privateKey);
const winner = (process.env.OG_TEST_WINNER_ADDRESS || account.address) as `0x${string}`;
const publicClient = createPublicClient({
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});
const client = createWalletClient({
  account,
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});

const existing = await publicClient.readContract({
  address: CONTRACTS.results as `0x${string}`,
  abi: resultAbi,
  functionName: "results",
  args: [asBytes32(room.id)],
});

if (existing[5]) {
  const artifact = {
    status: "submitted",
    roomId: room.id,
    txHash: previousArtifact.roomId === room.id ? previousArtifact.txHash : undefined,
    contract: CONTRACTS.results,
    storageUri: existing[3],
    readback: {
      snapshotHash: existing[0],
      lineupHash: existing[1],
      resultHash: existing[2],
      winner: existing[4],
      exists: existing[5],
    },
    note: "Result already exists on 0G Chain; preserved proof artifact without resubmitting.",
  };
  writeProofArtifact("chain-result-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

const hash = await client.writeContract({
  address: CONTRACTS.results as `0x${string}`,
  abi: resultAbi,
  functionName: "commitResult",
  args: [
    asBytes32(room.id),
    asBytes32(room.snapshotHash),
    asBytes32(result.lineupHash),
    asBytes32(result.simulationHash),
    storageUri,
    winner,
  ],
});
await publicClient.waitForTransactionReceipt({ hash });

const artifact = { status: "submitted", roomId: room.id, txHash: hash, contract: CONTRACTS.results, storageUri };
writeProofArtifact("chain-result-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
