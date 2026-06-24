import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

type Json = Record<string, unknown>;

function readJson(path: string) {
  if (!existsSync(path)) throw new Error(`Missing ${path}. Run data import/normalize/rate/publish first.`);
  return JSON.parse(readFileSync(path, "utf8")) as Json;
}

function sha256(value: unknown) {
  return `0x${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function fileInfo(path: string) {
  if (!existsSync(path)) return { path, exists: false, bytes: 0, sha256: "" };
  const bytes = readFileSync(path);
  return {
    path,
    exists: true,
    bytes: bytes.length,
    sha256: `0x${createHash("sha256").update(bytes).digest("hex")}`,
  };
}

function positionCounts(players: Json[]) {
  return players.reduce<Record<string, number>>((acc, player) => {
    const position = String(player.position ?? "unknown");
    acc[position] = (acc[position] ?? 0) + 1;
    return acc;
  }, {});
}

function hasPositions(players: Json[]) {
  const counts = positionCounts(players);
  return ["GK", "DF", "MF", "FW"].every((position) => Number(counts[position] ?? 0) > 0);
}

const imported = readJson("data/work/imported.json");
const normalized = readJson("data/work/normalized.json");
const rated = readJson("data/work/rated.json");
const ratedPlayers = (rated.players ?? []) as Json[];
const importedRows = (imported.rows ?? []) as unknown[];
const normalizedPlayers = (normalized.players ?? []) as Json[];
const version = String(rated.snapshotVersion ?? "");
const published = readJson(`data/published/${version}.json`);
const receipt = readJson(`data/published/${version}.receipt.json`);
const manifest = readJson(`data/published/${version}.cloudflare-manifest.json`);
const history = readJson("src/worldcup/worldcupHistory.json");
const historyReceipt = readJson("data/published/0g-world-cup-history-1970-2022.receipt.json");
const historyProof = readJson("proof-artifacts/player-snapshot-latest.json");
const d1Seed = fileInfo(String(manifest.d1Seed ?? ""));
const publishedFile = fileInfo(`data/published/${version}.json`);
const cloudflareManifest = fileInfo(`data/published/${version}.cloudflare-manifest.json`);
const adapterAttempts = (imported.adapters ?? []) as Json[];
const publishedHash = sha256(published);
const ratedHash = sha256(rated);
const historyPlayers = (history.players ?? []) as Json[];
const historyTeams = (history.teams ?? []) as Json[];
const historyYears = new Set(historyPlayers.map((player) => Number(player.year)));
const ratedIds = new Set(ratedPlayers.map((player) => String(player.id)));
const historyIds = new Set(historyPlayers.map((player) => String(player.id)));

const checks = {
  adapterAttemptsRecorded: adapterAttempts.length >= 5,
  selectedSourceProducedRows: String(imported.selectedSource ?? "none") !== "none" && importedRows.length >= 22,
  normalizedMatchesImported: normalizedPlayers.length === importedRows.length,
  ratedMatchesNormalized: ratedPlayers.length === normalizedPlayers.length,
  ratedIdsUnique: ratedIds.size === ratedPlayers.length,
  ratedPositionsComplete: hasPositions(ratedPlayers),
  ratingFormulaDocumented: String(rated.formulaVersion ?? "") === "ogr-v1" && String(rated.ratingFormula ?? "").includes("no EA/FIFA"),
  publishedHashMatchesReceipt: publishedHash === receipt.snapshotHash,
  publishedMatchesRated: ratedHash === publishedHash,
  d1SeedExists: d1Seed.exists && d1Seed.bytes > 0,
  cloudflareManifestExists: cloudflareManifest.exists && Boolean(manifest.kv) && Boolean(manifest.r2ObjectKey),
  receiptHasZeroGPointer: String(receipt.zeroGStorageUri ?? "").startsWith("0g://"),
  historicalSnapshotDeep: historyPlayers.length >= 8000 && historyTeams.length >= 300,
  historicalIdsUnique: historyIds.size === historyPlayers.length,
  historicalPositionsComplete: hasPositions(historyPlayers),
  historicalCovers1970To2022: historyYears.has(1970) && historyYears.has(2022) && !historyYears.has(2026),
  historicalHashMatchesPlayers: history.hash === sha256(historyPlayers),
  historicalReceiptMatches: historyReceipt.snapshotHash === history.hash && historyReceipt.playerCount === historyPlayers.length,
  historical0GStorageLive:
    historyProof.status === "live" &&
    historyProof.snapshotVersion === history.snapshotVersion &&
    historyProof.rootHash === historyReceipt.rootHash &&
    String(historyProof.storageUri ?? "").startsWith("0g://storage/"),
};

const artifact = {
  schema: "0g-world-cup-data-pipeline-proof-v1",
  status: Object.values(checks).every(Boolean) ? "verified" : "mismatch",
  selectedSource: imported.selectedSource,
  adapterAttempts,
  workSnapshotVersion: version,
  workPlayerCount: ratedPlayers.length,
  workSnapshotHash: ratedHash,
  publishedSnapshotHash: publishedHash,
  publishedReceipt: {
    version: receipt.version,
    snapshotHash: receipt.snapshotHash,
    zeroGStorageUri: receipt.zeroGStorageUri,
    cloudflare: receipt.cloudflare,
    zeroGStorage: receipt.zeroGStorage,
  },
  cloudflareManifest: {
    d1Seed,
    r2ObjectKey: manifest.r2ObjectKey,
    kv: manifest.kv,
    manifestFile: cloudflareManifest,
  },
  historicalSnapshot: {
    version: history.snapshotVersion,
    playerCount: historyPlayers.length,
    teamCount: historyTeams.length,
    snapshotHash: history.hash,
    storageUri: historyProof.storageUri,
    rootHash: historyProof.rootHash,
    txHash: historyProof.txHash,
  },
  checks,
  pipelineHash: sha256({ selectedSource: imported.selectedSource, version, publishedHash, historyHash: history.hash, checks }),
  env: publicEnvSummary(),
};

writeProofArtifact("data-pipeline-latest.json", artifact);
console.log(JSON.stringify({ status: artifact.status, pipelineHash: artifact.pipelineHash }, null, 2));
