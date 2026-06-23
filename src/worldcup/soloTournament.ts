import { flagForTeamCode } from "./flags";
import {
  eligibleTeams,
  starterPicks,
  teamRating,
  type DraftPick,
  type HistoryMatchEvent,
  type HistoryTeam,
} from "./historyDraft";
import type { TacticalStyle } from "./types";

export type CupTeam = {
  id: string;
  name: string;
  flag: string;
  rating: number;
  isUser?: boolean;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export type CupGroup = { id: string; teams: CupTeam[] };
export type CupRound = "Round of 32" | "Round of 16" | "Quarterfinals" | "Semifinals" | "Final";
export type CupStage = "group" | "knockout" | "complete" | "eliminated";

export type BracketMatch = {
  round: CupRound;
  home: string;
  away: string;
  score: string;
  winner: string;
  status: "pending" | "played";
  isUser?: boolean;
  penalties?: string;
};

export type SoloTournament = {
  groups: CupGroup[];
  bracket: BracketMatch[];
  userOpponent: CupTeam;
  finalized: boolean;
  stage: CupStage;
  groupMatchday: number;
  groupOpponentIds: string[];
  groupFixtureIds: string[][];
  currentRoundIndex: number;
  awaitingNext: boolean;
  needsPenalties: boolean;
  statusText: string;
  champion?: string;
};

export type LiveMatch = {
  minute: number;
  homeScore: number;
  awayScore: number;
  complete: boolean;
  events: HistoryMatchEvent[];
};

export const cupRounds: CupRound[] = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final"];

export function createSoloTournament(teamName: string, picks: DraftPick[], tactic: TacticalStyle): SoloTournament {
  const user: CupTeam = {
    id: "user",
    name: teamName,
    flag: "🏆",
    rating: Math.round(teamRating(picks, tactic)),
    isUser: true,
    ...blankRecord(),
  };
  const selected = shuffle(eligibleTeams).slice(0, 31).map(cupTeamFromHistory);
  const teams = [user, ...selected];
  const groups = Array.from({ length: 8 }, (_, index) => ({
    id: String.fromCharCode(65 + index),
    teams: teams.slice(index * 4, index * 4 + 4),
  }));
  return {
    groups,
    bracket: [],
    userOpponent: groups[0].teams[1],
    finalized: false,
    stage: "group",
    groupMatchday: 0,
    groupOpponentIds: groups[0].teams.slice(1).map((team) => team.id),
    groupFixtureIds: groups.map((group) => group.teams.map((team) => team.id)),
    currentRoundIndex: 0,
    awaitingNext: false,
    needsPenalties: false,
    statusText: "Group A · Matchday 1",
  };
}

export function initialLiveMatch(): LiveMatch {
  return { minute: 0, homeScore: 0, awayScore: 0, complete: false, events: [] };
}

export function advanceLiveMatch(args: {
  match: LiveMatch;
  picks: DraftPick[];
  tactic: TacticalStyle;
  teamName: string;
  opponent: CupTeam;
  minutes?: number;
}) {
  let next = args.match;
  const minutes = args.minutes ?? 1;
  for (let i = 0; i < minutes && !next.complete; i += 1) {
    next = advanceOneMinute({ ...args, match: next });
  }
  return next;
}

export function blankRecord() {
  return { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

export function applyCupResult(home: CupTeam, away: CupTeam, homeGoals: number, awayGoals: number) {
  home.played += 1;
  away.played += 1;
  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;
  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;
  if (homeGoals === awayGoals) {
    home.draws += 1;
    away.draws += 1;
    home.points += 1;
    away.points += 1;
    return;
  }
  const winner = homeGoals > awayGoals ? home : away;
  const loser = winner === home ? away : home;
  winner.wins += 1;
  winner.points += 3;
  loser.losses += 1;
}

export function simulatedScore(home: CupTeam, away: CupTeam, noDraw = false) {
  let homeGoals = Math.max(0, Math.floor((home.rating - 780) / 90 + Math.random() * 3));
  let awayGoals = Math.max(0, Math.floor((away.rating - 800) / 92 + Math.random() * 3));
  if (noDraw && homeGoals === awayGoals) {
    if (home.rating >= away.rating) homeGoals += 1;
    else awayGoals += 1;
  }
  return { homeGoals, awayGoals };
}

export function goalDiff(team: CupTeam) {
  return team.goalsFor - team.goalsAgainst;
}

function advanceOneMinute(args: {
  match: LiveMatch;
  picks: DraftPick[];
  tactic: TacticalStyle;
  teamName: string;
  opponent: CupTeam;
}) {
  const minute = Math.min(90, args.match.minute + 1);
  const homePower = teamRating(args.picks, args.tactic);
  const swing = homePower - args.opponent.rating + (Math.random() - 0.5) * 95;
  const roll = Math.random();
  const events = [...args.match.events];
  let homeScore = args.match.homeScore;
  let awayScore = args.match.awayScore;

  if (roll > 0.91 || [13, 27, 44, 61, 76, 88].includes(minute)) {
    const homeMoment = swing > -30 && Math.random() > 0.35;
    const goal = Math.random() > 0.62 + (homeMoment ? 0 : 0.1);
    if (goal && homeMoment) homeScore += 1;
    if (goal && !homeMoment) awayScore += 1;
    const narrative = homeMoment
      ? homeNarrative(args.picks, args.tactic, goal)
      : awayNarrative(args.opponent, goal);
    events.unshift({
      minute,
      tone: goal ? (homeMoment ? "ok" : "warn") : "default",
      kind: goal ? "goal" : "miss",
      team: homeMoment ? args.teamName : args.opponent.name,
      player: narrative.player,
      text: narrative.text,
    });
  }

  if (minute === 45) {
    events.unshift({
      minute,
      tone: "accent",
      kind: "info",
      team: args.teamName,
      text: `Halftime: ${args.teamName} adjust the ${args.tactic.toLowerCase()} triggers.`,
    });
  }

  return { minute, homeScore, awayScore, events: events.slice(0, 18), complete: minute >= 90 };
}

function homeNarrative(picks: DraftPick[], tactic: TacticalStyle, goal: boolean) {
  const xi = starterPicks(picks).map((pick) => pick.player);
  const passer = sample(xi.filter((player) => player.position !== "GK")) ?? xi[0];
  const finisher = sample(xi.filter((player) => player.position === "FW")) ?? sample(xi);
  const miss = [
    `${passer?.shortName} threads a pass into the channel; ${finisher?.shortName} shoots across goal, just wide.`,
    `${finisher?.shortName} wins a penalty, steps up, and the keeper guesses right to push it away.`,
    `${passer?.shortName} bends a free kick over the wall, clipping the top netting.`,
  ];
  const score = [
    `${passer?.shortName} dribbles past one, slips in ${finisher?.shortName}, and the finish is buried low into the corner.`,
    `${finisher?.shortName} attacks the cross and powers the header in. ${tactic} pays off.`,
    `${passer?.shortName} whips a free kick through traffic and ${finisher?.shortName} gets the final touch. Goal.`,
  ];
  return { player: finisher?.shortName ?? passer?.shortName, text: sample(goal ? score : miss) ?? "A chance flashes through the box." };
}

function awayNarrative(opponent: CupTeam, goal: boolean) {
  return {
    player: opponent.name,
    text: goal
      ? `${opponent.flag} ${opponent.name} break quickly, square the pass, and finish from six yards.`
      : `${opponent.flag} ${opponent.name} create a clean look, but the shot rises over the bar.`,
  };
}

function cupTeamFromHistory(team: HistoryTeam): CupTeam {
  return {
    id: `${team.year}:${team.teamCode}`,
    name: `${team.year} ${team.teamName}`,
    flag: flagForTeamCode(team.teamCode),
    rating: 835 + Math.floor(Math.random() * 170),
    ...blankRecord(),
  };
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function sample<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}
