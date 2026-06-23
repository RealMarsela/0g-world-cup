import { createPublicClient, createWalletClient, http, keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACTS, zeroGGalileo } from "../../config/chain";
import type { DraftRoom, MatchResult } from "../../worldcup/types";
import { loadLocalEnv } from "../env";

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

export type RoomChainArtifact = {
  status: "submitted" | "existing" | "blocked";
  reason?: string;
  roomId: string;
  txHash?: string;
  contract?: string;
  storageUri?: string;
  readback?: {
    snapshotHash: string;
    lineupHash: string;
    resultHash: string;
    winner: string;
    exists: boolean;
  };
};

function asBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value as `0x${string}` : keccak256(toBytes(value));
}

export async function commitRoomResult(room: DraftRoom, result: MatchResult, storageUri: string): Promise<RoomChainArtifact> {
  loadLocalEnv();
  const privateKey = process.env.OG_PRIVATE_KEY as `0x${string}` | undefined;
  if (!privateKey) {
    return { status: "blocked", roomId: room.id, reason: "Missing OG_PRIVATE_KEY." };
  }
  if (!CONTRACTS.results) {
    return { status: "blocked", roomId: room.id, reason: "Missing VITE_WORLD_CUP_RESULTS_ADDRESS." };
  }

  const account = privateKeyToAccount(privateKey);
  const winner = (process.env.OG_TEST_WINNER_ADDRESS || account.address) as `0x${string}`;
  const publicClient = createPublicClient({
    chain: zeroGGalileo,
    transport: http(zeroGGalileo.rpcUrls.default.http[0]),
  });
  const walletClient = createWalletClient({
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
    return {
      status: "existing",
      roomId: room.id,
      contract: CONTRACTS.results,
      storageUri: existing[3],
      readback: {
        snapshotHash: existing[0],
        lineupHash: existing[1],
        resultHash: existing[2],
        winner: existing[4],
        exists: existing[5],
      },
    };
  }

  const txHash = await walletClient.writeContract({
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
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 });
  return {
    status: "submitted",
    roomId: room.id,
    txHash,
    contract: CONTRACTS.results,
    storageUri,
    readback: {
      snapshotHash: asBytes32(room.snapshotHash),
      lineupHash: asBytes32(result.lineupHash),
      resultHash: asBytes32(result.simulationHash),
      winner,
      exists: receipt.status === "success",
    },
  };
}
