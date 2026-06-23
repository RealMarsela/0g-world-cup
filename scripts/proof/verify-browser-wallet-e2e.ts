import { createPublicClient, http, keccak256, parseEther, parseEventLogs, toBytes } from "viem";
import { loadLocalEnv, writeProofArtifact } from "./env";

loadLocalEnv();

const { zeroGGalileo, CONTRACTS } = await import("../../src/config/chain");
const { completeDraft, createRoomFromId, roomReceipt, simulate } = await import("../../src/worldcup/game");

const proofAbi = [
  {
    type: "event",
    name: "LineupCommitted",
    inputs: [
      { name: "roomId", type: "bytes32", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "snapshotHash", type: "bytes32", indexed: false },
      { name: "lineupHash", type: "bytes32", indexed: false },
      { name: "wagerAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "roomId", type: "bytes32", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "commitments",
    stateMutability: "view",
    inputs: [
      { name: "", type: "bytes32" },
      { name: "", type: "address" },
    ],
    outputs: [
      { name: "player", type: "address" },
      { name: "snapshotHash", type: "bytes32" },
      { name: "lineupHash", type: "bytes32" },
      { name: "wagerAmount", type: "uint256" },
      { name: "exists", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "hasDeposited",
    stateMutability: "view",
    inputs: [
      { name: "", type: "bytes32" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
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
] as const;

function asBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value as `0x${string}` : keccak256(toBytes(value));
}

function sameHex(left?: string, right?: string) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

const roomId = process.env.BROWSER_E2E_ROOM_ID || "room-testnet-wager-1v1-e2e";
const wallet = process.env.BROWSER_E2E_WALLET || "0x23761115c5f38ca51f0d425d00DE6E34029239EC";
const commitTxHash =
  process.env.BROWSER_E2E_COMMIT_TX ||
  "0xed5c6244d5976be40f2b35d2f7f41d8777864b707b5385eb45cd972d4f37cffe";
const depositTxHash =
  process.env.BROWSER_E2E_DEPOSIT_TX ||
  "0x03318f31c16c56f9536a0236d06e4fe64fc978f6501cf3e484f9b44892ce815b";
const wagerAmount = parseEther(process.env.BROWSER_E2E_WAGER_OG || "0.01");
const requiredDeposits = BigInt(process.env.BROWSER_E2E_REQUIRED_DEPOSITS || "2");

const room = completeDraft(createRoomFromId(roomId));
const result = simulate(room);
const receipt = roomReceipt(room, result);
const roomHash = asBytes32(roomId);
const snapshotHash = asBytes32(receipt.playerSnapshotHash);
const lineupHash = asBytes32(receipt.lineupHash);

const client = createPublicClient({
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});

const [commitReceipt, depositReceipt, commitment, hasDeposited, escrow, canStart] = await Promise.all([
  client.getTransactionReceipt({ hash: commitTxHash as `0x${string}` }),
  client.getTransactionReceipt({ hash: depositTxHash as `0x${string}` }),
  client.readContract({
    address: CONTRACTS.draft as `0x${string}`,
    abi: proofAbi,
    functionName: "commitments",
    args: [roomHash, wallet as `0x${string}`],
  }),
  client.readContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: proofAbi,
    functionName: "hasDeposited",
    args: [roomHash, wallet as `0x${string}`],
  }),
  client.readContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: proofAbi,
    functionName: "escrows",
    args: [roomHash],
  }),
  client.readContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: proofAbi,
    functionName: "canStart",
    args: [roomHash, requiredDeposits],
  }),
]);

const commitEvents = parseEventLogs({
  abi: proofAbi,
  eventName: "LineupCommitted",
  logs: commitReceipt.logs,
});
const depositEvents = parseEventLogs({
  abi: proofAbi,
  eventName: "Deposited",
  logs: depositReceipt.logs,
});
const commitEvent = commitEvents.find((event) => event.address.toLowerCase() === CONTRACTS.draft.toLowerCase());
const depositEvent = depositEvents.find((event) => event.address.toLowerCase() === CONTRACTS.escrow.toLowerCase());
const [commitPlayer, commitSnapshotHash, commitLineupHash, commitWagerAmount, commitExists] = commitment;
const [totalDeposited, escrowWagerAmount, depositCount, settled] = escrow;
const expectedCanStart = !settled && depositCount >= requiredDeposits && escrowWagerAmount > 0n;

const checks = {
  commitTxSucceeded: commitReceipt.status === "success",
  commitTxToDraft: sameHex(commitReceipt.to ?? undefined, CONTRACTS.draft),
  commitTxFromWallet: sameHex(commitReceipt.from, wallet),
  commitEventFound: Boolean(commitEvent),
  commitEventRoomMatches: commitEvent?.args.roomId === roomHash,
  commitEventPlayerMatches: sameHex(commitEvent?.args.player, wallet),
  commitEventSnapshotMatches: sameHex(commitEvent?.args.snapshotHash, snapshotHash),
  commitEventLineupMatches: sameHex(commitEvent?.args.lineupHash, lineupHash),
  commitEventWagerMatches: commitEvent?.args.wagerAmount === wagerAmount,
  commitmentExists: commitExists,
  commitmentPlayerMatches: sameHex(commitPlayer, wallet),
  commitmentSnapshotMatches: sameHex(commitSnapshotHash, snapshotHash),
  commitmentLineupMatches: sameHex(commitLineupHash, lineupHash),
  commitmentWagerMatches: commitWagerAmount === wagerAmount,
  depositTxSucceeded: depositReceipt.status === "success",
  depositTxToEscrow: sameHex(depositReceipt.to ?? undefined, CONTRACTS.escrow),
  depositTxFromWallet: sameHex(depositReceipt.from, wallet),
  depositEventFound: Boolean(depositEvent),
  depositEventRoomMatches: depositEvent?.args.roomId === roomHash,
  depositEventPlayerMatches: sameHex(depositEvent?.args.player, wallet),
  depositEventAmountMatches: depositEvent?.args.amount === wagerAmount,
  hasDeposited,
  escrowWagerMatches: escrowWagerAmount === wagerAmount,
  escrowContainsDeposit: totalDeposited >= wagerAmount && depositCount >= 1n,
  canStartMatchesContractState: canStart === expectedCanStart,
  twoDepositsRequired: requiredDeposits === 2n,
};

const artifact = {
  status: Object.values(checks).every(Boolean) ? "live" : "mismatch",
  chainId: zeroGGalileo.id,
  wallet,
  roomId,
  roomHash,
  contracts: {
    draft: CONTRACTS.draft,
    escrow: CONTRACTS.escrow,
  },
  transactions: {
    commit: commitTxHash,
    deposit: depositTxHash,
  },
  blockNumbers: {
    commit: commitReceipt.blockNumber.toString(),
    deposit: depositReceipt.blockNumber.toString(),
  },
  expected: {
    snapshotHash,
    lineupHash,
    wagerAmountWei: wagerAmount.toString(),
    requiredDeposits: requiredDeposits.toString(),
  },
  events: {
    lineupCommitted: commitEvent
      ? {
          contract: commitEvent.address,
          roomHash: commitEvent.args.roomId,
          player: commitEvent.args.player,
          snapshotHash: commitEvent.args.snapshotHash,
          lineupHash: commitEvent.args.lineupHash,
          wagerAmountWei: commitEvent.args.wagerAmount.toString(),
        }
      : null,
    deposited: depositEvent
      ? {
          contract: depositEvent.address,
          roomHash: depositEvent.args.roomId,
          player: depositEvent.args.player,
          amountWei: depositEvent.args.amount.toString(),
        }
      : null,
  },
  state: {
    commitment: {
      player: commitPlayer,
      snapshotHash: commitSnapshotHash,
      lineupHash: commitLineupHash,
      wagerAmountWei: commitWagerAmount.toString(),
      exists: commitExists,
    },
    escrow: {
      totalDepositedWei: totalDeposited.toString(),
      wagerAmountWei: escrowWagerAmount.toString(),
      depositCount: depositCount.toString(),
      settled,
      hasDeposited,
      canStart,
    },
  },
  checks,
};

writeProofArtifact("browser-wallet-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
