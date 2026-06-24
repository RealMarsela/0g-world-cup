import type { MatchComputeReceipt, MatchHighlight } from "./computeTypes";

export type Position = "GK" | "DF" | "MF" | "FW";
export type Formation = "4-3-3" | "4-2-3-1" | "3-5-2" | "4-4-2";
export type TacticalStyle =
  | "Balanced"
  | "High Press"
  | "Counter"
  | "Possession"
  | "Low Block";
export type RoomMode =
  | "solo-free"
  | "free-1v1"
  | "free-group"
  | "testnet-wager-1v1"
  | "testnet-group-pot"
  | "human-vs-agent"
  | "agent-vs-agent";

export type Player = {
  id: string;
  providerIds: Record<string, string>;
  name: string;
  shortName: string;
  country: string;
  countryCode: string;
  squad: string;
  shirtNumber: number;
  position: Position;
  detailedPosition: string;
  age: number;
  dateOfBirth?: string;
  height: number;
  club: string;
  statsSource: string;
  ratingSource: string;
  worldRating: number;
  attributes: {
    pace: number;
    finishing: number;
    passing: number;
    control: number;
    defense: number;
    physical: number;
    clutch: number;
  };
  snapshotVersion: string;
  sourceAttribution: string;
};

export type DraftTeam = {
  id: string;
  name: string;
  kind: "human" | "agent" | "simulation";
  formation: Formation;
  tacticalStyle: TacticalStyle;
  captainId?: string;
  picks: Player[];
};

export type DraftRoom = {
  id: string;
  mode: RoomMode;
  wagerAmount: string;
  snapshotVersion: string;
  snapshotHash: string;
  turnIndex: number;
  teams: DraftTeam[];
  draftLog: string[];
};

export type MatchResult = {
  type: "match" | "tournament";
  roomId: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  winner: string;
  mvp: Player;
  events: string[];
  tacticalSummary: string;
  winExplanation: string;
  lineupHash: string;
  simulationHash: string;
  storageUri: string;
  computeMode: string;
  computeAuthority?: "compute" | "external-ai-fallback" | "deterministic-background" | "blocked";
  computeReceipt?: MatchComputeReceipt;
  highlights?: MatchHighlight[];
  blocker?: string;
  proofPacket?: ZeroGProofPacket;
  table?: TournamentStanding[];
  matches?: TournamentMatch[];
};

export type TournamentMatch = {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  winner: string;
  simulationHash: string;
};

export type TournamentStanding = {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type ZeroGServiceName = "chain" | "storage" | "compute" | "da" | "agentic-id";
export type ZeroGServiceStatus = "live" | "ready" | "fallback" | "blocked" | "planned";

export type ZeroGServiceProof = {
  name: ZeroGServiceName;
  label: string;
  status: ZeroGServiceStatus;
  summary: string;
  artifact?: string;
  txHash?: string;
  explorerUrl?: string;
};

export type ZeroGProofPacket = {
  schema: "0g-world-cup-proof-v1";
  roomId: string;
  mode: RoomMode;
  generatedAt: string;
  chainId: number;
  snapshotVersion: string;
  snapshotHash: string;
  lineupHash: string;
  resultHash: string;
  storageUri: string;
  receiptHash: string;
  services: ZeroGServiceProof[];
};
