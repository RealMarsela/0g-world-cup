import { readJson, writeJson } from "./shared.mjs";

const normalized = await readJson("data/work/normalized.json");

const strength = {
  FRA: 96,
  ARG: 95,
  BRA: 94,
  ENG: 93,
  ESP: 92,
  POR: 91,
  GER: 90,
  USA: 78,
  CAN: 77,
  MEX: 79,
  MAR: 82,
};

const bias = {
  GK: [42, 28, 62, 64, 88, 82, 84],
  DF: [74, 42, 68, 70, 86, 84, 76],
  MF: [72, 68, 86, 88, 72, 78, 82],
  FW: [86, 88, 74, 84, 42, 76, 86],
};

function seed(name, code) {
  return [...`${name}${code}`].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 9;
}

function clamp(value) {
  return Math.max(35, Math.min(99, Math.round(value)));
}

const players = normalized.players.map((player) => {
  const national = strength[player.countryCode] ?? 75;
  const uplift = (national - 75) / 3 + seed(player.name, player.countryCode);
  const base = bias[player.position];
  const values = {
    pace: clamp(base[0] + uplift),
    finishing: clamp(base[1] + uplift + (player.position === "FW" ? 4 : 0)),
    passing: clamp(base[2] + uplift + (player.position === "MF" ? 3 : 0)),
    control: clamp(base[3] + uplift),
    defense: clamp(base[4] + uplift + (player.position === "DF" || player.position === "GK" ? 3 : 0)),
    physical: clamp(base[5] + uplift),
    clutch: clamp(base[6] + uplift + (player.shirtNumber === 10 || player.shirtNumber === 1 ? 3 : 0)),
  };
  const worldRating = clamp(Object.values(values).reduce((sum, value) => sum + value, 0) / 7);
  return {
    ...player,
    ratingSource: "0G World Rating ogr-v1 deterministic formula",
    worldRating,
    attributes: values,
  };
});

await writeJson("data/work/rated.json", {
  snapshotVersion: normalized.snapshotVersion,
  formulaVersion: "ogr-v1",
  ratingFormula:
    "Position baseline + national-team strength uplift + deterministic name seed + small role/captain modifiers; no EA/FIFA game ratings copied.",
  sourceAttribution: normalized.sourceAttribution,
  players,
});

console.log(`Rated ${players.length} players with ogr-v1.`);
