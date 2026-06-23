import { createPublicClient, http, keccak256, toBytes } from "viem";
import { loadLocalEnv, writeProofArtifact } from "./env";

loadLocalEnv();

const { zeroGGalileo, CONTRACTS } = await import("../../src/config/chain");

const escrowAbi = [
  {
    type: "function",
    name: "escrows",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "totalDeposited", type: "uint256" },
      { name: "wagerAmount", type: "uint256" },
      { name: "depositCount", type: "uint256" },
      { name: "settled", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "canStart",
    stateMutability: "view",
    inputs: [
      { name: "roomId", type: "bytes32" },
      { name: "minDeposits", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "protocolFeeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

function asBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value as `0x${string}` : keccak256(toBytes(value));
}

async function codeStatus(client: ReturnType<typeof createPublicClient>, address: string) {
  if (!address) return { address, hasCode: false };
  const code = await client.getCode({ address: address as `0x${string}` });
  return {
    address,
    hasCode: Boolean(code && code !== "0x"),
    byteLength: code ? (code.length - 2) / 2 : 0,
    codeHash: code && code !== "0x" ? keccak256(code) : null,
  };
}

const roomId = process.env.ESCROW_PROOF_ROOM_ID || "room-testnet-wager-1v1-e2e";
const requiredDeposits = BigInt(process.env.ESCROW_PROOF_MIN_DEPOSITS || "2");
const roomHash = asBytes32(roomId);

const client = createPublicClient({
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});

const [escrowCode, owner, protocolFeeBps, roomEscrow, canStart] = await Promise.all([
  codeStatus(client, CONTRACTS.escrow),
  client.readContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: escrowAbi,
    functionName: "owner",
  }),
  client.readContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: escrowAbi,
    functionName: "protocolFeeBps",
  }),
  client.readContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: escrowAbi,
    functionName: "escrows",
    args: [roomHash],
  }),
  client.readContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: escrowAbi,
    functionName: "canStart",
    args: [roomHash, requiredDeposits],
  }),
]);

const [totalDeposited, wagerAmount, depositCount, settled] = roomEscrow;
const expectedCanStart = !settled && depositCount >= requiredDeposits && wagerAmount > 0n;
const checks = {
  escrowHasCode: escrowCode.hasCode,
  canStartMatchesContractState: canStart === expectedCanStart,
  requiresTwoDeposits: requiredDeposits === 2n,
  notStartReadyWithoutTwoDeposits: depositCount < requiredDeposits ? canStart === false : true,
};

const artifact = {
  status: Object.values(checks).every(Boolean) ? "live" : "mismatch",
  chainId: zeroGGalileo.id,
  blockNumber: (await client.getBlockNumber()).toString(),
  contract: CONTRACTS.escrow,
  roomId,
  roomHash,
  owner,
  protocolFeeBps: protocolFeeBps.toString(),
  requiredDeposits: requiredDeposits.toString(),
  canStart,
  escrow: {
    totalDepositedWei: totalDeposited.toString(),
    wagerAmountWei: wagerAmount.toString(),
    depositCount: depositCount.toString(),
    settled,
  },
  checks,
};

writeProofArtifact("escrow-readiness-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
