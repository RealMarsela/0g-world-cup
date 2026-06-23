import type { DraftRoom, Player } from "./types";

export type MatchAuthority = "compute" | "deterministic-background" | "blocked";

export type MatchHighlightKind =
  | "goal"
  | "miss"
  | "save"
  | "chance"
  | "turning-point"
  | "tactical-shift"
  | "substitution";

export type MatchHighlight = {
  id: string;
  minute: number;
  teamId: string;
  teamName: string;
  playerId?: string;
  playerName?: string;
  kind: MatchHighlightKind;
  narration: string;
  scoreAfter: [number, number];
};

export type MatchComputeInput = {
  schema: "0g-world-cup-compute-input-v1";
  roomId: string;
  authority: MatchAuthority;
  snapshotHash: string;
  lineupHash: string;
  kickoffSeed: string;
  allowedRecalculations: 2;
  room: DraftRoom;
};

export type MatchComputeReceipt = {
  endpoint: string;
  model: string;
  path?: "router" | "broker";
  provider?: string;
  requestId?: string;
  teeVerified?: boolean | null;
  requestHash: string;
  responseHash: string;
  rawResponseHash: string;
};

export type MatchComputeOutput = {
  schema: "0g-world-cup-compute-output-v1";
  roomId: string;
  authority: MatchAuthority;
  homeScore: number;
  awayScore: number;
  winnerTeamId: string;
  winner: string;
  mvpPlayerId: string;
  mvp?: Player;
  highlights: MatchHighlight[];
  tacticalSummary: string;
  winExplanation: string;
  resultHash: string;
  storageUri: string;
  computeMode: string;
  receipt?: MatchComputeReceipt;
  blocker?: string;
};
