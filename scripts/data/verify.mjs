import { readJson } from "./shared.mjs";

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

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(`Verified ${rated.players.length} players.`);
console.log(`Snapshot ${rated.snapshotVersion}`);
console.log(`Hash ${receipt.snapshotHash}`);
