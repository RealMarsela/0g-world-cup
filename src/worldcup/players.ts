import history from "./worldcupHistory.json";
import type { Player, Position } from "./types";

type HistoryPlayer = {
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

const positionBias = {
  GK: { pace: -24, finishing: -42, passing: -8, control: -6, defense: 9, physical: 5, clutch: 7 },
  DF: { pace: 0, finishing: -28, passing: -6, control: -4, defense: 10, physical: 7, clutch: 1 },
  MF: { pace: -1, finishing: -8, passing: 9, control: 10, defense: -5, physical: 1, clutch: 4 },
  FW: { pace: 8, finishing: 11, passing: -3, control: 6, defense: -34, physical: 0, clutch: 8 },
} as const;

function clamp(n: number) {
  return Math.max(35, Math.min(99, Math.round(n)));
}

function attributesFor(player: HistoryPlayer) {
  const bias = positionBias[player.position];
  const shirtBoost = player.shirtNumber === 10 || player.shirtNumber === 1 ? 3 : 0;
  return {
    pace: clamp(player.rating + bias.pace),
    finishing: clamp(player.rating + bias.finishing),
    passing: clamp(player.rating + bias.passing),
    control: clamp(player.rating + bias.control),
    defense: clamp(player.rating + bias.defense),
    physical: clamp(player.rating + bias.physical),
    clutch: clamp(player.rating + bias.clutch + shirtBoost),
  };
}

export const snapshotVersion = history.snapshotVersion;
export const formulaVersion = history.formulaVersion;
export const sourceAttribution = history.sourceAttribution;
export const playerSnapshotHash = history.hash;

export const players: Player[] = (history.players as HistoryPlayer[]).map((raw) => {
  const attributes = attributesFor(raw);
  const worldRating = clamp(Object.values(attributes).reduce((sum, value) => sum + value, 0) / 7);
  return {
    id: raw.id,
    providerIds: {
      jfjelstul: raw.playerId,
      tournament: raw.tournamentId,
      history: raw.id,
    },
    name: raw.name,
    shortName: raw.shortName,
    country: raw.teamName,
    countryCode: raw.teamCode,
    squad: `${raw.year} ${raw.teamName}`,
    shirtNumber: raw.shirtNumber,
    position: raw.position,
    detailedPosition: raw.detailedPosition,
    age: raw.age ?? 0,
    dateOfBirth: undefined,
    height: 0,
    club: "World Cup squad",
    statsSource: "jfjelstul-worldcup-history",
    ratingSource: `${history.formulaVersion} original 0G World Rating derived from open historical squad data`,
    worldRating,
    attributes,
    snapshotVersion,
    sourceAttribution: raw.sourceAttribution,
  };
});

export const countries = Array.from(new Set(players.map((player) => player.country)));
