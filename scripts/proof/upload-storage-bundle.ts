import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const { completeDraft, createRoomFromId, roomReceipt, simulate } = await import("../../src/worldcup/game");

const privateKey = process.env.OG_PRIVATE_KEY;
const rpc = process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const indexerRpc =
  process.env.OG_STORAGE_INDEXER_URL ||
  process.env.VITE_OG_STORAGE_INDEXER_URL ||
  "https://indexer-storage-testnet-turbo.0g.ai";

function readJson(path: string) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown> : null;
}

function hashJson(value: unknown) {
  return `0x${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

const roomId = process.argv[2] || "room-human-vs-agent-storage-bundle";
const room = completeDraft(createRoomFromId(roomId));
const result = simulate(room);
const snapshot = readJson(`data/published/${room.snapshotVersion}.json`);
const snapshotReceipt = readJson(`data/published/${room.snapshotVersion}.receipt.json`);

const shareMetadata = {
  schema: "0g-world-cup-share-metadata-v1",
  roomId: room.id,
  title: `${result.winner} win ${result.homeScore}-${result.awayScore}`,
  description: `${result.mvp.shortName} MVP. ${result.winExplanation}`,
  imageAlt: `${result.winner} 0G World Cup result card`,
  xText: `0G World Cup: ${result.winner} win ${result.homeScore}-${result.awayScore}. MVP ${result.mvp.shortName}. Proof ${result.simulationHash.slice(0, 10)}.`,
};

const bundle = {
  schema: "0g-world-cup-storage-bundle-v1",
  generatedAt: new Date(0).toISOString(),
  roomId: room.id,
  snapshot: {
    version: room.snapshotVersion,
    hash: room.snapshotHash,
    receipt: snapshotReceipt,
    data: snapshot,
  },
  draftLog: room.draftLog,
  matchTranscript: {
    type: result.type,
    score: `${result.home} ${result.homeScore}-${result.awayScore} ${result.away}`,
    winner: result.winner,
    mvp: result.mvp,
    events: result.events,
    tacticalSummary: result.tacticalSummary,
    winExplanation: result.winExplanation,
    table: result.table,
    matches: result.matches,
  },
  shareMetadata,
  proofReceipt: {
    roomReceipt: roomReceipt(room, result),
    proofPacket: result.proofPacket,
  },
};

const bundleBytes = new TextEncoder().encode(JSON.stringify(bundle, null, 2));
const bundleHash = `0x${createHash("sha256").update(bundleBytes).digest("hex")}`;

if (!privateKey) {
  const artifact = {
    status: "blocked",
    reason: "Missing OG_PRIVATE_KEY.",
    roomId: room.id,
    bundleHash,
    env: publicEnvSummary(),
  };
  writeProofArtifact("storage-bundle-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

const memData = new MemData(bundleBytes);
const [tree, treeErr] = await memData.merkleTree();
if (treeErr !== null) throw new Error(`Merkle tree failed: ${treeErr}`);

const rootHash = tree.rootHash();
const previousArtifact = existsSync("proof-artifacts/storage-bundle-latest.json")
  ? JSON.parse(readFileSync("proof-artifacts/storage-bundle-latest.json", "utf8")) as Record<string, unknown>
  : {};
const provider = new ethers.JsonRpcProvider(rpc);
const signer = new ethers.Wallet(privateKey, provider);
const indexer = new Indexer(indexerRpc);
const [tx, uploadErr] = await indexer.upload(memData, rpc, signer);
if (uploadErr !== null) throw new Error(`0G Storage bundle upload failed: ${uploadErr}`);

const txHash = ("txHash" in tx ? tx.txHash : tx.txHashes?.[0]) || (
  previousArtifact.rootHash === rootHash ? previousArtifact.txHash : ""
) || "";
const artifact = {
  status: "live",
  roomId: room.id,
  bundleHash,
  rootHash,
  txHash,
  storageUri: `0g://storage/${rootHash}`,
  indexerRpc,
  items: [
    "player-snapshot",
    "draft-log",
    "match-transcript",
    "share-metadata",
    "proof-receipt",
  ],
  itemHashes: {
    snapshot: hashJson(bundle.snapshot),
    draftLog: hashJson(bundle.draftLog),
    matchTranscript: hashJson(bundle.matchTranscript),
    shareMetadata: hashJson(bundle.shareMetadata),
    proofReceipt: hashJson(bundle.proofReceipt),
  },
};

writeProofArtifact("storage-bundle-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
