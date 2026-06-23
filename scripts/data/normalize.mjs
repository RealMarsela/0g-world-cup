import { playerId, readJson, writeJson } from "./shared.mjs";

const imported = await readJson("data/work/imported.json");

const players = imported.rows.map((raw, index) => {
  const [name, shortName, country, countryCode, shirtNumber, position, detailedPosition, age, height, club] = raw;
  return {
    id: playerId(countryCode, index),
    providerIds: { local: `${imported.snapshotVersion}:${index + 1}` },
    name,
    shortName,
    country,
    countryCode,
    squad: country,
    shirtNumber,
    position,
    detailedPosition,
    age,
    dateOfBirth: null,
    height,
    club,
    statsSource: imported.selectedSource,
    ratingSource: "pending",
    snapshotVersion: imported.snapshotVersion,
    sourceAttribution: imported.sourceAttribution,
  };
});

await writeJson("data/work/normalized.json", {
  snapshotVersion: imported.snapshotVersion,
  sourceAttribution: imported.sourceAttribution,
  players,
});

console.log(`Normalized ${players.length} players.`);
