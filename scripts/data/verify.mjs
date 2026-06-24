import { readJson, sha256 } from "./shared.mjs";

const rated = await readJson("data/work/rated.json");
const receipt = await readJson(`data/published/${rated.snapshotVersion}.receipt.json`);
const manifest = await readJson(`data/published/${rated.snapshotVersion}.cloudflare-manifest.json`);
const ids = new Set(rated.players.map((player) => player.id));
const positions = rated.players.reduce((acc, player) => {
  acc[player.position] = (acc[player.position] ?? 0) + 1;
  return acc;
}, {});

const failures = [];
if (rated.players.length < 22) failures.push("At least 22 players are required for a full 1v1 XI draft.");
if (ids.size !== rated.players.length) failures.push("Player ids must be unique.");
for (const position of ["GK", "DF", "MF", "FW"]) {
  if (!positions[position]) failures.push(`Missing position ${position}.`);
}
if (!receipt.snapshotHash?.startsWith("0x")) failures.push("Missing published snapshot hash.");
if (!receipt.zeroGStorageUri?.startsWith("0g://")) failures.push("Missing 0G storage URI placeholder/upload URI.");
if (!manifest.d1Seed?.endsWith(".sql")) failures.push("Missing Cloudflare D1 seed manifest.");

const history = await readJson("src/worldcup/worldcupHistory.json");
const historyReceipt = await readJson("data/published/0g-world-cup-history-1970-2022.receipt.json");
const historyProof = await readJson("proof-artifacts/player-snapshot-latest.json");
const historyIds = new Set(history.players.map((player) => player.id));
const historyYears = new Set(history.players.map((player) => player.year));
const historyPositions = history.players.reduce((acc, player) => {
  acc[player.position] = (acc[player.position] ?? 0) + 1;
  return acc;
}, {});

if (history.snapshotVersion !== "0g-world-cup-history-1970-2022") {
  failures.push("Historical snapshot version must be 0g-world-cup-history-1970-2022.");
}
if (history.players.length < 8000) failures.push("Historical snapshot must include at least 8,000 players.");
if (history.teams.length < 300) failures.push("Historical snapshot must include at least 300 team-year squads.");
if (historyIds.size !== history.players.length) failures.push("Historical player ids must be unique.");
if (!historyYears.has(1970) || !historyYears.has(2022)) failures.push("Historical snapshot must cover 1970 through 2022.");
if (historyYears.has(2026)) failures.push("Historical snapshot must not include 2026 before final squads exist.");
for (const position of ["GK", "DF", "MF", "FW"]) {
  if (!historyPositions[position]) failures.push(`Historical snapshot missing position ${position}.`);
}
if (history.hash !== sha256(history.players)) failures.push("Historical snapshot player hash does not match its players.");
if (historyReceipt.snapshotHash !== history.hash) failures.push("Historical receipt snapshot hash does not match history JSON.");
if (historyReceipt.playerCount !== history.players.length) failures.push("Historical receipt player count does not match history JSON.");
if (historyReceipt.teamCount !== history.teams.length) failures.push("Historical receipt team count does not match history JSON.");
if (!historyReceipt.zeroGStorageUri?.startsWith("0g://")) failures.push("Historical receipt missing 0G storage URI.");
if (!historyReceipt.rootHash?.startsWith("0x")) failures.push("Historical receipt missing 0G root hash.");
if (historyProof.snapshotVersion !== history.snapshotVersion) failures.push("Proof player snapshot version does not match history JSON.");
if (historyProof.playerCount !== history.players.length) failures.push("Proof player count does not match history JSON.");
if (historyProof.rootHash !== historyReceipt.rootHash) failures.push("Proof root hash does not match historical receipt.");

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(`Verified ${rated.players.length} players.`);
console.log(`Snapshot ${rated.snapshotVersion}`);
console.log(`Hash ${receipt.snapshotHash}`);
console.log(`Verified historical snapshot ${history.snapshotVersion}.`);
console.log(`${history.players.length} players / ${history.teams.length} team-year squads.`);
console.log(`Historical hash ${history.hash}`);
console.log(`0G storage root ${historyReceipt.rootHash}`);
