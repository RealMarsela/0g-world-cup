import rawHistory from "./worldcupHistory.json";
import type { Formation, Position, TacticalStyle } from "./types";

export type HistoryPlayer = {
  id: string;
  year: number;
  tournamentId: string;
  teamName: string;
  teamCode: string;
  playerId: string;
  name: string;
  shortName: string;
  shirtNumber: number;
  position: Position;
  detailedPosition: string;
  age: number | null;
  rating: number;
  sourceAttribution: string;
};

export type HistoryTeam = {
  year: number;
  teamName: string;
  teamCode: string;
  playerCount: number;
};

export type FormationSlot = {
  id: string;
  label: string;
  position: Position;
  x: number;
  y: number;
};

export type DraftPick = {
  player: HistoryPlayer;
  slotId: string;
  role: "starter" | "sub";
};

export type HistoryMatchEvent = {
  minute: number;
  text: string;
  tone: "accent" | "ok" | "warn" | "default";
  kind?: "goal" | "miss" | "save" | "info";
  player?: string;
  team?: string;
};

export type HistoryMatchState = {
  minute: number;
  homeScore: number;
  awayScore: number;
  events: HistoryMatchEvent[];
  complete: boolean;
};

type HistorySnapshot = {
  snapshotVersion: string;
  formulaVersion: string;
  sourceAttribution: string;
  createdAt: string;
  hash: string;
  teams: HistoryTeam[];
  players: HistoryPlayer[];
};

export const historySnapshot = rawHistory as HistorySnapshot;
export const benchSize = 3;

export const eligibleTeams = historySnapshot.teams.filter((team) => team.playerCount >= 16);

const formationSlots: Record<Formation, FormationSlot[]> = {
  "4-3-3": [
    { id: "gk", label: "GK", position: "GK", x: 50, y: 88 },
    ...line("df", "DF", 72, [18, 39, 61, 82]),
    ...line("mf", "MF", 50, [30, 50, 70]),
    ...line("fw", "FW", 23, [18, 50, 82]),
  ],
  "4-2-3-1": [
    { id: "gk", label: "GK", position: "GK", x: 50, y: 88 },
    ...line("df", "DF", 72, [18, 39, 61, 82]),
    ...line("dm", "DM", 55, [38, 62], "MF"),
    ...line("am", "AM", 38, [22, 50, 78], "MF"),
    { id: "fw-1", label: "ST", position: "FW", x: 50, y: 20 },
  ],
  "3-5-2": [
    { id: "gk", label: "GK", position: "GK", x: 50, y: 88 },
    ...line("df", "DF", 72, [27, 50, 73]),
    ...line("mf", "MF", 49, [13, 32, 50, 68, 87]),
    ...line("fw", "FW", 22, [38, 62]),
  ],
  "4-4-2": [
    { id: "gk", label: "GK", position: "GK", x: 50, y: 88 },
    ...line("df", "DF", 72, [18, 39, 61, 82]),
    ...line("mf", "MF", 49, [18, 39, 61, 82]),
    ...line("fw", "FW", 22, [38, 62]),
  ],
};

function line(prefix: string, label: string, y: number, xs: number[], position = label as Position) {
  return xs.map((x, index) => ({
    id: `${prefix}-${index + 1}`,
    label,
    position,
    x,
    y,
  }));
}

export function slotsForFormation(formation: Formation) {
  return formationSlots[formation];
}

export function playersForTeam(team: HistoryTeam) {
  return historySnapshot.players
    .filter((player) => player.year === team.year && player.teamCode === team.teamCode)
    .sort((a, b) => positionOrder(a.position) - positionOrder(b.position) || a.shirtNumber - b.shirtNumber);
}

export function rollHistoryTeam(excludeKey = "") {
  const pool = eligibleTeams.filter((team) => teamKey(team) !== excludeKey);
  return pool[Math.floor(Math.random() * pool.length)] ?? eligibleTeams[0];
}

export function rollingPreview(count = 18) {
  return Array.from({ length: count }, () => rollHistoryTeam());
}

export function teamKey(team: HistoryTeam) {
  return `${team.year}:${team.teamCode}`;
}

export function pickForSlot(picks: DraftPick[], slotId: string) {
  return picks.find((pick) => pick.slotId === slotId && pick.role === "starter");
}

export function benchPicks(picks: DraftPick[]) {
  return picks.filter((pick) => pick.role === "sub");
}

export function starterPicks(picks: DraftPick[]) {
  return picks.filter((pick) => pick.role === "starter");
}

export function decidePick(player: HistoryPlayer, picks: DraftPick[], formation: Formation) {
  if (picks.some((pick) => pick.player.id === player.id)) {
    return { kind: "disabled" as const, label: "Picked", reason: "Already in your squad" };
  }
  const slot = slotsForFormation(formation).find(
    (candidate) => candidate.position === player.position && !pickForSlot(picks, candidate.id),
  );
  if (slot) return { kind: "starter" as const, label: slot.label, slot };
  if (benchPicks(picks).length < benchSize) return { kind: "sub" as const, label: "Sub" };
  return { kind: "disabled" as const, label: "Full", reason: `${player.position} slots and bench are full` };
}

export function addHistoryPick(player: HistoryPlayer, picks: DraftPick[], formation: Formation) {
  const decision = decidePick(player, picks, formation);
  if (decision.kind === "disabled") return picks;
  const slotId = decision.kind === "starter" ? decision.slot.id : `sub-${benchPicks(picks).length + 1}`;
  return [...picks, { player, slotId, role: decision.kind }];
}

export function isHistoryDraftComplete(picks: DraftPick[]) {
  return starterPicks(picks).length === 11 && benchPicks(picks).length === benchSize;
}

export function swapHistorySub(picks: DraftPick[], starterId: string, benchId: string) {
  const starter = picks.find((pick) => pick.role === "starter" && pick.player.id === starterId);
  const sub = picks.find((pick) => pick.role === "sub" && pick.player.id === benchId);
  if (!starter || !sub) return picks;
  return picks.map((pick) => {
    if (pick.player.id === starterId) return { ...sub, slotId: starter.slotId, role: "starter" as const };
    if (pick.player.id === benchId) return { ...starter, slotId: sub.slotId, role: "sub" as const };
    return pick;
  });
}

export function teamRating(picks: DraftPick[], tactic: TacticalStyle) {
  const bias = tacticBias[tactic];
  return starterPicks(picks).reduce((sum, pick) => sum + pick.player.rating + (bias[pick.player.position] ?? 0), 0);
}

export function initialHistoryMatch(): HistoryMatchState {
  return { minute: 0, homeScore: 0, awayScore: 0, events: [], complete: false };
}

export function playHistoryPhase(args: {
  match: HistoryMatchState;
  picks: DraftPick[];
  tactic: TacticalStyle;
  teamName: string;
}) {
  if (args.match.complete) return args.match;
  const minute = Math.min(90, args.match.minute + 15);
  const rating = teamRating(args.picks, args.tactic);
  const opponent = 880 + Math.random() * 95;
  const chance = rating - opponent + (Math.random() - 0.5) * 120;
  const homeGoal = chance > 20 && Math.random() > 0.35;
  const awayGoal = chance < -20 && Math.random() > 0.42;
  const events = [...args.match.events];
  let homeScore = args.match.homeScore;
  let awayScore = args.match.awayScore;
  if (homeGoal) {
    homeScore += 1;
    events.unshift({ minute, tone: "ok", text: `${args.teamName} score after a ${args.tactic.toLowerCase()} pattern.` });
  } else if (awayGoal) {
    awayScore += 1;
    events.unshift({ minute, tone: "warn", text: `Default AI punishes the space in minute ${minute}.` });
  } else {
    events.unshift({ minute, tone: "default", text: `${args.tactic} holds shape through minute ${minute}.` });
  }
  return { minute, homeScore, awayScore, events, complete: minute >= 90 };
}

function positionOrder(position: Position) {
  return { GK: 0, DF: 1, MF: 2, FW: 3 }[position];
}

const tacticBias: Record<TacticalStyle, Partial<Record<Position, number>>> = {
  Balanced: {},
  "High Press": { FW: 5, MF: 2 },
  Counter: { FW: 6, DF: 2 },
  Possession: { MF: 6 },
  "Low Block": { GK: 4, DF: 6 },
};
