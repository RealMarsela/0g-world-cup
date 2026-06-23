import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathFor, sha256, readJson, sqlString, writeJson } from "./shared.mjs";

const rated = await readJson("data/work/rated.json");
const snapshotHash = sha256(rated);
const version = rated.snapshotVersion;
const storageReady = Boolean(process.env.OG_PRIVATE_KEY && process.env.OG_STORAGE_INDEXER_URL);
const cloudflareReady = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID);

await writeJson(`data/published/${version}.json`, rated);
const zeroGStorageUri = storageReady
  ? `0g://upload-ready/${snapshotHash.slice(2)}`
  : `0g://local-demo/${snapshotHash.slice(2)}`;
await writeJson(`data/published/${version}.receipt.json`, {
  version,
  snapshotHash,
  playerCount: rated.players.length,
  publishedAt: new Date().toISOString(),
  cloudflare: cloudflareReady
    ? "credentials-present-run-wrangler-d1-r2-kv"
    : "local-only-missing-cloudflare-credentials",
  zeroGStorage: storageReady
    ? "credentials-present-run-0g-storage-upload"
    : "local-uri-only-missing-0g-storage-credentials",
  zeroGStorageUri,
  r2ObjectKey: `snapshots/${version}.json`,
  kvActiveSnapshotKey: "active-player-snapshot",
});

const sql = [
  "BEGIN TRANSACTION;",
  `INSERT OR REPLACE INTO player_snapshots(version, snapshot_hash, formula_version, source_attribution, player_count, zero_g_storage_uri, created_at) VALUES (${sqlString(version)}, ${sqlString(snapshotHash)}, ${sqlString(rated.formulaVersion)}, ${sqlString(rated.sourceAttribution)}, ${rated.players.length}, ${sqlString(zeroGStorageUri)}, ${sqlString(new Date().toISOString())});`,
  ...rated.players.map((player) =>
    `INSERT OR REPLACE INTO players(id, snapshot_version, name, short_name, country, country_code, squad, shirt_number, position, detailed_position, age, height, club, stats_source, rating_source, world_rating, attributes_json, provider_ids_json, source_attribution) VALUES (${sqlString(player.id)}, ${sqlString(version)}, ${sqlString(player.name)}, ${sqlString(player.shortName)}, ${sqlString(player.country)}, ${sqlString(player.countryCode)}, ${sqlString(player.squad)}, ${player.shirtNumber}, ${sqlString(player.position)}, ${sqlString(player.detailedPosition)}, ${player.age ?? "NULL"}, ${player.height ?? "NULL"}, ${sqlString(player.club)}, ${sqlString(player.statsSource)}, ${sqlString(player.ratingSource)}, ${player.worldRating}, ${sqlString(JSON.stringify(player.attributes))}, ${sqlString(JSON.stringify(player.providerIds))}, ${sqlString(player.sourceAttribution)});`,
  ),
  "COMMIT;",
  "",
].join("\n");
const seedPath = pathFor(`data/published/${version}.d1.sql`);
await mkdir(dirname(seedPath), { recursive: true });
await writeFile(seedPath, sql);

await writeJson(`data/published/${version}.cloudflare-manifest.json`, {
  d1Seed: `data/published/${version}.d1.sql`,
  r2ObjectKey: `snapshots/${version}.json`,
  kv: {
    key: "active-player-snapshot",
    value: { version, snapshotHash, r2ObjectKey: `snapshots/${version}.json` },
  },
});

console.log(`Published ${version}`);
console.log(`Snapshot hash ${snapshotHash}`);
