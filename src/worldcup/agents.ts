import type { RoomMode } from "./types";

export type RegisteredAgent = {
  id: string;
  ownerWallet: string;
  displayName: string;
  imageUrl: string;
  agenticTokenId?: string;
  agenticStatus: "ready-to-mint" | "minted" | "blocked";
  bankroll: string;
  maxWagerPerMatch: string;
  maxGamesPerDay: number;
  maxGamesPerOpponent: number;
  stopLoss: string;
  allowedModes: RoomMode[];
  record: {
    wins: number;
    losses: number;
    profit: string;
  };
  challengeFee: string;
  computePolicy: string;
  draftPolicy: string;
  riskPolicy: string;
  policyHash: string;
};

export const registeredAgents: RegisteredAgent[] = [
  {
    id: "agent-zero-nine",
    ownerWallet: "0x3D325E51934AE5c7EBf9f37a8Ddf772F48F766Fb",
    displayName: "ZeroNine Scout",
    imageUrl: "/agents/agent-1.jpg",
    agenticTokenId: "2",
    agenticStatus: "minted",
    bankroll: "250 testnet 0G",
    maxWagerPerMatch: "5 testnet 0G",
    maxGamesPerDay: 24,
    maxGamesPerOpponent: 3,
    stopLoss: "20 testnet 0G",
    allowedModes: ["human-vs-agent", "agent-vs-agent", "testnet-wager-1v1"],
    record: { wins: 18, losses: 7, profit: "+31.4 testnet 0G" },
    challengeFee: "0.05 testnet 0G",
    computePolicy: "0G Compute draft reasoning only; no deterministic fallback is allowed for real agent fixtures.",
    draftPolicy: "Exploit position scarcity, captain clutch, and opponent formation denial before raw rating.",
    riskPolicy: "Accept only testnet wagers inside bankroll, daily cap, opponent cap, and stop-loss.",
    policyHash: "0xdc106aea7be9c83d9a94ad439e265f4fc4975b66fc159cbaf99a2c233ff5553a",
  },
  {
    id: "agent-keepernet",
    ownerWallet: "0x3D325E51934AE5c7EBf9f37a8Ddf772F48F766Fb",
    displayName: "KeeperNet Oracle",
    imageUrl: "/agents/agent-2.jpg",
    agenticTokenId: "3",
    agenticStatus: "minted",
    bankroll: "180 testnet 0G",
    maxWagerPerMatch: "3 testnet 0G",
    maxGamesPerDay: 18,
    maxGamesPerOpponent: 2,
    stopLoss: "12 testnet 0G",
    allowedModes: ["agent-vs-agent", "testnet-wager-1v1"],
    record: { wins: 11, losses: 9, profit: "+8.2 testnet 0G" },
    challengeFee: "0.03 testnet 0G",
    computePolicy: "0G Compute keeper/value model only; blocked Compute must block real agent fixtures.",
    draftPolicy: "Anchor defense and goalkeeper value early, then counterpick forwards with high clutch.",
    riskPolicy: "Prefer low-variance matches and stop after two losses against the same opponent.",
    policyHash: "0xbb95ff95ff15463bf88402d9c22df3e29f833b79faa1ecd4963c3072a75e3420",
  },
];

export const defaultAgent = registeredAgents[0];
export const rivalAgent = registeredAgents[1];
