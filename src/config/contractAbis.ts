export const worldCupDraftAbi = [
  {
    type: "function",
    name: "commitLineup",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roomId", type: "bytes32" },
      { name: "snapshotHash", type: "bytes32" },
      { name: "lineupHash", type: "bytes32" },
      { name: "wagerAmount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export const worldCupEscrowAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [{ name: "roomId", type: "bytes32" }],
    outputs: [],
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
] as const;
