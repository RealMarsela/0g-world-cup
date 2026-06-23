import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { pathFor, readJson, writeJson } from "./shared.mjs";

function loadLocalEnv(path = ".env.local") {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ||= value;
  }
}

function publicEnvSummary() {
  return {
    rpc: process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai",
    storageIndexer:
      process.env.OG_STORAGE_INDEXER_URL ||
      process.env.VITE_OG_STORAGE_INDEXER_URL ||
      "https://indexer-storage-testnet-turbo.0g.ai",
    hasStorageSigner: Boolean(process.env.OG_PRIVATE_KEY),
  };
}

async function writeProofArtifact(name, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  await mkdir("proof-artifacts", { recursive: true });
  await mkdir("public/proof-artifacts", { recursive: true });
  await writeFile(`proof-artifacts/${name}`, body);
  await writeFile(`public/proof-artifacts/${name}`, body);
}

loadLocalEnv();

const snapshot = await readJson("src/worldcup/worldcupHistory.json");
const bytes = new TextEncoder().encode(JSON.stringify(snapshot, null, 2));
const contentHash = `0x${createHash("sha256").update(bytes).digest("hex")}`;
const privateKey = process.env.OG_PRIVATE_KEY;
const rpc = process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const indexerRpc =
  process.env.OG_STORAGE_INDEXER_URL ||
  process.env.VITE_OG_STORAGE_INDEXER_URL ||
  "https://indexer-storage-testnet-turbo.0g.ai";
const base = {
  snapshotVersion: snapshot.snapshotVersion,
  snapshotHash: snapshot.hash,
  contentHash,
  playerCount: snapshot.players.length,
  teamCount: snapshot.teams.length,
  sourceAttribution: snapshot.sourceAttribution,
  indexerRpc,
};

if (!privateKey) {
  const artifact = {
    status: "blocked",
    ...base,
    reason: "Missing OG_PRIVATE_KEY; historical snapshot was not uploaded to 0G Storage.",
    env: publicEnvSummary(),
  };
  await writeProofArtifact("player-snapshot-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

const memData = new MemData(bytes);
const [tree, treeErr] = await memData.merkleTree();
if (treeErr !== null) throw new Error(`Merkle tree failed: ${treeErr}`);
if (!tree) throw new Error("Merkle tree failed: empty tree.");
const rootHash = tree.rootHash();
if (!rootHash) throw new Error("Merkle tree failed: missing root hash.");

const previous = existsSync("proof-artifacts/player-snapshot-latest.json")
  ? JSON.parse(readFileSync("proof-artifacts/player-snapshot-latest.json", "utf8"))
  : {};
const indexer = new Indexer(indexerRpc);
let txHash = previous.rootHash === rootHash ? previous.txHash || "" : "";
let reused = "";
try {
  const locations = await indexer.getFileLocations(rootHash);
  if (locations.length > 0 && txHash) reused = "Existing historical snapshot root is discoverable; skipped duplicate upload.";
} catch (error) {
  if (!String(error instanceof Error ? error.message : error).includes("file not found")) throw error;
}

if (!reused) {
  const signer = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(rpc));
  const [tx, uploadErr] = await indexer.upload(memData, rpc, signer, {
    finalityRequired: process.env.OG_STORAGE_WAIT_FOR_FINALITY === "1",
  });
  if (uploadErr !== null) throw new Error(`0G historical snapshot upload failed: ${uploadErr}`);
  txHash = ("txHash" in tx ? tx.txHash : tx.txHashes?.[0]) || txHash;
}

const artifact = {
  status: "live",
  ...base,
  rootHash,
  txHash,
  storageUri: `0g://storage/${rootHash}`,
  reused: reused || undefined,
};
await writeProofArtifact("player-snapshot-latest.json", artifact);
await mkdir(dirname(pathFor(`data/published/${snapshot.snapshotVersion}.receipt.json`)), { recursive: true });
await writeJson(`data/published/${snapshot.snapshotVersion}.receipt.json`, {
  version: snapshot.snapshotVersion,
  snapshotHash: snapshot.hash,
  playerCount: snapshot.players.length,
  teamCount: snapshot.teams.length,
  publishedAt: new Date().toISOString(),
  zeroGStorage: "live",
  zeroGStorageUri: artifact.storageUri,
  rootHash,
  txHash,
  contentHash,
});
console.log(JSON.stringify(artifact, null, 2));
