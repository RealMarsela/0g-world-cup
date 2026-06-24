import { createPublicClient, createWalletClient, formatEther, http, keccak256, parseEther, parseEventLogs, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadLocalEnv, writeProofArtifact } from "./env";

loadLocalEnv();

const { zeroGGalileo, CONTRACTS } = await import("../../src/config/chain");

const escrowAbi = [
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
    type: "event",
    name: "Settled",
    inputs: [
      { name: "roomId", type: "bytes32", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "payout", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [{ name: "roomId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roomId", type: "bytes32" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
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

const privateKey = process.env.OG_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) throw new Error("Missing OG_PRIVATE_KEY.");
if (!CONTRACTS.escrow) throw new Error("Missing VITE_WORLD_CUP_ESCROW_ADDRESS.");

const account = privateKeyToAccount(privateKey);
const roomId = process.env.WAGER_SETTLEMENT_ROOM_ID || process.env.BROWSER_E2E_ROOM_ID || "room-testnet-wager-1v1-e2e";
const browserWallet =
  (process.env.WAGER_SETTLEMENT_WINNER || process.env.BROWSER_E2E_WALLET || "0x23761115c5f38ca51f0d425d00DE6E34029239EC") as `0x${string}`;
const wagerAmount = parseEther(process.env.WAGER_SETTLEMENT_WAGER_OG || process.env.BROWSER_E2E_WAGER_OG || "0.01");
const roomHash = asBytes32(roomId);
const logFromBlock = BigInt(process.env.WAGER_SETTLEMENT_FROM_BLOCK || "40355951");

const publicClient = createPublicClient({
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});
const walletClient = createWalletClient({
  account,
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});

async function readState() {
  const [owner, feeBps, browserDeposited, projectDeposited, escrow, canStart, projectBalance, winnerBalance] =
    await Promise.all([
      publicClient.readContract({
        address: CONTRACTS.escrow as `0x${string}`,
        abi: escrowAbi,
        functionName: "owner",
      }),
      publicClient.readContract({
        address: CONTRACTS.escrow as `0x${string}`,
        abi: escrowAbi,
        functionName: "protocolFeeBps",
      }),
      publicClient.readContract({
        address: CONTRACTS.escrow as `0x${string}`,
        abi: escrowAbi,
        functionName: "hasDeposited",
        args: [roomHash, browserWallet],
      }),
      publicClient.readContract({
        address: CONTRACTS.escrow as `0x${string}`,
        abi: escrowAbi,
        functionName: "hasDeposited",
        args: [roomHash, account.address],
      }),
      publicClient.readContract({
        address: CONTRACTS.escrow as `0x${string}`,
        abi: escrowAbi,
        functionName: "escrows",
        args: [roomHash],
      }),
      publicClient.readContract({
        address: CONTRACTS.escrow as `0x${string}`,
        abi: escrowAbi,
        functionName: "canStart",
        args: [roomHash, 2n],
      }),
      publicClient.getBalance({ address: account.address }),
      publicClient.getBalance({ address: browserWallet }),
    ]);
  const [totalDeposited, escrowWagerAmount, depositCount, settled] = escrow;
  return {
    owner,
    feeBps,
    browserDeposited,
    projectDeposited,
    canStart,
    projectBalance,
    winnerBalance,
    escrow: {
      totalDeposited,
      wagerAmount: escrowWagerAmount,
      depositCount,
      settled,
    },
  };
}

async function waitForReceipt(hash: `0x${string}`) {
  for (let attempt = 0; attempt < 18; attempt += 1) {
    try {
      return await publicClient.getTransactionReceipt({ hash });
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  }
  return await publicClient.waitForTransactionReceipt({ hash, timeout: 90_000 });
}

async function findDepositReceipt(player: `0x${string}`) {
  const latest = await publicClient.getBlockNumber();
  const logs = await publicClient.getLogs({
    address: CONTRACTS.escrow as `0x${string}`,
    fromBlock: logFromBlock,
    toBlock: latest,
  });
  const deposits = parseEventLogs({
    abi: escrowAbi,
    eventName: "Deposited",
    logs,
  });
  const match = deposits.find((event) =>
    event.args.roomId === roomHash &&
    sameHex(event.args.player, player) &&
    event.args.amount === wagerAmount
  );
  return match ? publicClient.getTransactionReceipt({ hash: match.transactionHash }) : null;
}

async function findSettlementReceipt() {
  const latest = await publicClient.getBlockNumber();
  const logs = await publicClient.getLogs({
    address: CONTRACTS.escrow as `0x${string}`,
    fromBlock: logFromBlock,
    toBlock: latest,
  });
  const settlements = parseEventLogs({
    abi: escrowAbi,
    eventName: "Settled",
    logs,
  });
  const match = settlements.find((event) => event.args.roomId === roomHash && sameHex(event.args.winner, browserWallet));
  return match ? publicClient.getTransactionReceipt({ hash: match.transactionHash }) : null;
}

const before = await readState();
if (!sameHex(before.owner, account.address)) {
  throw new Error(`OG_PRIVATE_KEY wallet ${account.address} is not escrow owner ${before.owner}.`);
}
if (!before.browserDeposited) {
  throw new Error(`Browser wallet ${browserWallet} has not deposited into ${roomId}. Run browser wallet E2E first.`);
}
if (before.escrow.wagerAmount !== wagerAmount) {
  throw new Error(`Escrow wager amount ${before.escrow.wagerAmount} does not match expected ${wagerAmount}.`);
}

let secondDepositTx: `0x${string}` | null = null;
let secondDepositReceipt = null as Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>> | null;
let readyAfterSecondDeposit = before.canStart;

if (!before.projectDeposited && !before.escrow.settled) {
  if (before.projectBalance < wagerAmount) {
    throw new Error(`Project wallet balance ${formatEther(before.projectBalance)} 0G is below wager ${formatEther(wagerAmount)} 0G.`);
  }
  secondDepositTx = await walletClient.writeContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: escrowAbi,
    functionName: "deposit",
    args: [roomHash],
    value: wagerAmount,
  });
  secondDepositReceipt = await waitForReceipt(secondDepositTx);
  readyAfterSecondDeposit = await publicClient.readContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: escrowAbi,
    functionName: "canStart",
    args: [roomHash, 2n],
  });
} else if (before.projectDeposited) {
  secondDepositReceipt = await findDepositReceipt(account.address);
  secondDepositTx = secondDepositReceipt?.transactionHash ?? null;
}

const afterSecondDeposit = await readState();
let settleTx: `0x${string}` | null = null;
let settleReceipt = null as Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>> | null;

if (!afterSecondDeposit.escrow.settled) {
  settleTx = await walletClient.writeContract({
    address: CONTRACTS.escrow as `0x${string}`,
    abi: escrowAbi,
    functionName: "settle",
    args: [roomHash, browserWallet],
  });
  settleReceipt = await waitForReceipt(settleTx);
} else {
  settleReceipt = await findSettlementReceipt();
  settleTx = settleReceipt?.transactionHash ?? null;
}

const afterSettlement = await readState();
const depositEvent = secondDepositReceipt
  ? parseEventLogs({
      abi: escrowAbi,
      eventName: "Deposited",
      logs: secondDepositReceipt.logs,
    }).find((event) => event.address.toLowerCase() === CONTRACTS.escrow.toLowerCase())
  : null;
const settledEvent = settleReceipt
  ? parseEventLogs({
      abi: escrowAbi,
      eventName: "Settled",
      logs: settleReceipt.logs,
    }).find((event) => event.address.toLowerCase() === CONTRACTS.escrow.toLowerCase())
  : null;
const expectedFee = (afterSecondDeposit.escrow.totalDeposited * BigInt(before.feeBps)) / 10_000n;
const expectedPayout = afterSecondDeposit.escrow.totalDeposited - expectedFee;
const winnerDelta = afterSettlement.winnerBalance - before.winnerBalance;
const payoutVerified =
  before.escrow.settled
    ? Boolean(settledEvent && settledEvent.args.payout === expectedPayout)
    : winnerDelta >= expectedPayout;

const checks = {
  ownerMatchesProjectWallet: sameHex(before.owner, account.address),
  browserWalletWasFirstDepositor: before.browserDeposited,
  projectWalletDeposited: afterSecondDeposit.projectDeposited,
  secondDepositTxSucceeded: secondDepositReceipt ? secondDepositReceipt.status === "success" : before.projectDeposited,
  secondDepositEventFound: secondDepositReceipt ? Boolean(depositEvent) : before.projectDeposited,
  secondDepositRoomMatches: depositEvent ? depositEvent.args.roomId === roomHash : before.projectDeposited,
  secondDepositPlayerMatches: depositEvent ? sameHex(depositEvent.args.player, account.address) : before.projectDeposited,
  secondDepositAmountMatches: depositEvent ? depositEvent.args.amount === wagerAmount : before.projectDeposited,
  escrowWasStartReadyBeforeSettle: readyAfterSecondDeposit === true || before.escrow.settled,
  settleTxSucceeded: settleReceipt ? settleReceipt.status === "success" : before.escrow.settled,
  settledEventFound: settleReceipt ? Boolean(settledEvent) : before.escrow.settled,
  settledRoomMatches: settledEvent ? settledEvent.args.roomId === roomHash : before.escrow.settled,
  settledWinnerMatches: settledEvent ? sameHex(settledEvent.args.winner, browserWallet) : before.escrow.settled,
  settledPayoutMatches: settledEvent ? settledEvent.args.payout === expectedPayout : before.escrow.settled,
  settledFeeMatches: settledEvent ? settledEvent.args.fee === expectedFee : before.escrow.settled,
  escrowSettledState: afterSettlement.escrow.settled,
  escrowDepositCountTwo: afterSettlement.escrow.depositCount >= 2n,
  winnerReceivedPayout: payoutVerified,
  canStartClosedAfterSettle: afterSettlement.canStart === false,
};

const artifact = {
  status: Object.values(checks).every(Boolean) ? "settled" : "mismatch",
  chainId: zeroGGalileo.id,
  roomId,
  roomHash,
  contract: CONTRACTS.escrow,
  projectWallet: account.address,
  winner: browserWallet,
  wagerAmountWei: wagerAmount.toString(),
  protocolFeeBps: before.feeBps.toString(),
  transactions: {
    secondDeposit: secondDepositTx,
    settle: settleTx,
  },
  blockNumbers: {
    secondDeposit: secondDepositReceipt?.blockNumber.toString() ?? null,
    settle: settleReceipt?.blockNumber.toString() ?? null,
  },
  balances: {
    projectBefore0g: formatEther(before.projectBalance),
    projectAfter0g: formatEther(afterSettlement.projectBalance),
    winnerBefore0g: formatEther(before.winnerBalance),
    winnerAfter0g: formatEther(afterSettlement.winnerBalance),
    winnerDeltaWei: winnerDelta.toString(),
  },
  events: {
    secondDeposit: depositEvent
      ? {
          contract: depositEvent.address,
          roomHash: depositEvent.args.roomId,
          player: depositEvent.args.player,
          amountWei: depositEvent.args.amount.toString(),
        }
      : null,
    settled: settledEvent
      ? {
          contract: settledEvent.address,
          roomHash: settledEvent.args.roomId,
          winner: settledEvent.args.winner,
          payoutWei: settledEvent.args.payout.toString(),
          feeWei: settledEvent.args.fee.toString(),
        }
      : null,
  },
  state: {
    before: {
      browserDeposited: before.browserDeposited,
      projectDeposited: before.projectDeposited,
      canStart: before.canStart,
      totalDepositedWei: before.escrow.totalDeposited.toString(),
      wagerAmountWei: before.escrow.wagerAmount.toString(),
      depositCount: before.escrow.depositCount.toString(),
      settled: before.escrow.settled,
    },
    afterSecondDeposit: {
      browserDeposited: afterSecondDeposit.browserDeposited,
      projectDeposited: afterSecondDeposit.projectDeposited,
      canStart: afterSecondDeposit.canStart,
      totalDepositedWei: afterSecondDeposit.escrow.totalDeposited.toString(),
      wagerAmountWei: afterSecondDeposit.escrow.wagerAmount.toString(),
      depositCount: afterSecondDeposit.escrow.depositCount.toString(),
      settled: afterSecondDeposit.escrow.settled,
    },
    afterSettlement: {
      browserDeposited: afterSettlement.browserDeposited,
      projectDeposited: afterSettlement.projectDeposited,
      canStart: afterSettlement.canStart,
      totalDepositedWei: afterSettlement.escrow.totalDeposited.toString(),
      wagerAmountWei: afterSettlement.escrow.wagerAmount.toString(),
      depositCount: afterSettlement.escrow.depositCount.toString(),
      settled: afterSettlement.escrow.settled,
    },
  },
  payout: {
    totalDepositedWei: afterSecondDeposit.escrow.totalDeposited.toString(),
    expectedFeeWei: expectedFee.toString(),
    expectedPayoutWei: expectedPayout.toString(),
  },
  checks,
};

writeProofArtifact("wager-settlement-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
