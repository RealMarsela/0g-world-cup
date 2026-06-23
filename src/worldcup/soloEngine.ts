import type { Formation, Player, Position, TacticalStyle } from "./types";
import { players } from "./players";

export type MatchEvent = {
  minute: number;
  text: string;
  tone: "accent" | "ok" | "warn" | "default";
};

export type SoloMatchState = {
  minute: number;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  complete: boolean;
};

export const benchSize = 3;

const formationNeeds: Record<Formation, Record<Position, number>> = {
  "4-3-3": { GK: 1, DF: 4, MF: 3, FW: 3 },
  "4-2-3-1": { GK: 1, DF: 4, MF: 5, FW: 1 },
  "3-5-2": { GK: 1, DF: 3, MF: 5, FW: 2 },
  "4-4-2": { GK: 1, DF: 4, MF: 4, FW: 2 },
};

const tacticBias: Record<TacticalStyle, Partial<Record<Position, number>>> = {
  Balanced: {},
  "High Press": { FW: 4, MF: 2 },
  Counter: { FW: 5, DF: 2 },
  Possession: { MF: 5 },
  "Low Block": { GK: 3, DF: 5 },
};

export function positionsForFormation(formation: Formation) {
  const needs = formationNeeds[formation];
  return (Object.entries(needs) as [Position, number][])
    .flatMap(([position, count]) => Array.from({ length: count }, () => position));
}

export function nextDraftPosition(formation: Formation, picks: Player[]) {
  if (picks.length >= 11) return "Bench";
  return positionsForFormation(formation)[picks.length];
}

export function isDraftComplete(picks: Player[]) {
  return picks.length >= 11 + benchSize;
}

export function availablePlayers(draftedIds: Set<string>, position: Position | "Bench") {
  return players
    .filter((player) => !draftedIds.has(player.id))
    .filter((player) => position === "Bench" || player.position === position)
    .sort((a, b) => b.worldRating - a.worldRating)
    .slice(0, 10);
}

export function autoPick(draftedIds: Set<string>, position: Position | "Bench") {
  const candidates = availablePlayers(draftedIds, position);
  return candidates[Math.floor(Math.random() * Math.min(4, candidates.length))] ?? candidates[0];
}

export function starters(picks: Player[]) {
  return picks.slice(0, 11);
}

export function bench(picks: Player[]) {
  return picks.slice(11, 14);
}

export function swapSub(picks: Player[], starterId: string, benchId: string) {
  const next = [...picks];
  const starterIndex = next.findIndex((player) => player.id === starterId);
  const benchIndex = next.findIndex((player) => player.id === benchId);
  if (starterIndex < 0 || benchIndex < 11) return picks;
  [next[starterIndex], next[benchIndex]] = [next[benchIndex], next[starterIndex]];
  return next;
}

export function teamPower(picks: Player[], tactic: TacticalStyle) {
  return starters(picks).reduce((sum, player) => {
    const bias = tacticBias[tactic][player.position] ?? 0;
    const actionScore =
      tactic === "Low Block"
        ? player.attributes.defense + player.attributes.physical
        : tactic === "Possession"
          ? player.attributes.passing + player.attributes.control
          : tactic === "Counter"
            ? player.attributes.pace + player.attributes.finishing
            : tactic === "High Press"
              ? player.attributes.physical + player.attributes.clutch
              : player.worldRating * 2;
    return sum + player.worldRating + actionScore / 5 + bias;
  }, 0);
}

function scorer(picks: Player[]) {
  const forwards = starters(picks).filter((player) => player.position === "FW");
  const attackers = forwards.length ? forwards : starters(picks);
  return attackers[Math.floor(Math.random() * attackers.length)];
}

export function initialMatch(): SoloMatchState {
  return {
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    events: [],
    complete: false,
  };
}

export function playPhase({
  match,
  homePicks,
  awayPicks,
  homeTactic,
  awayTactic,
  teamName,
}: {
  match: SoloMatchState;
  homePicks: Player[];
  awayPicks: Player[];
  homeTactic: TacticalStyle;
  awayTactic: TacticalStyle;
  teamName: string;
}) {
  if (match.complete) return match;
  const nextMinute = Math.min(90, match.minute + 15);
  const homePower = teamPower(homePicks, homeTactic);
  const awayPower = teamPower(awayPicks, awayTactic);
  const swing = homePower - awayPower + (Math.random() - 0.5) * 85;
  const chanceRoll = Math.random();
  const events = [...match.events];
  let homeScore = match.homeScore;
  let awayScore = match.awayScore;

  if (chanceRoll > 0.42) {
    const homeGoal = swing >= 0 ? Math.random() > 0.28 : Math.random() > 0.68;
    if (homeGoal) {
      homeScore += 1;
      const player = scorer(homePicks);
      events.unshift({
        minute: nextMinute,
        tone: "ok",
        text: `${teamName} goal: ${player.shortName} finishes from a ${homeTactic.toLowerCase()} pattern.`,
      });
    } else {
      awayScore += 1;
      const player = scorer(awayPicks);
      events.unshift({
        minute: nextMinute,
        tone: "warn",
        text: `Default Simulation goal: ${player.shortName} punishes the space against ${homeTactic.toLowerCase()}.`,
      });
    }
  } else {
    events.unshift({
      minute: nextMinute,
      tone: "default",
      text: `${homeTactic} shape holds through minute ${nextMinute}; no clean finish in this phase.`,
    });
  }

  return {
    minute: nextMinute,
    homeScore,
    awayScore,
    events,
    complete: nextMinute >= 90,
  };
}
