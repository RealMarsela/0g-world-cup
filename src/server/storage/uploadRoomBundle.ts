import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { roomReceipt } from "../../worldcup/game";
import type { DraftRoom, MatchResult } from "../../worldcup/types";
import { loadLocalEnv } from "../env";

export type RoomStorageArtifact = {
  status: "live" | "blocked";
  reason?: string;
  roomId: string;
  bundleHash: string;
  rootHash?: string;
  txHash?: string;
  storageUri?: string;
  indexerRpc: string;
  items: string[];
  itemHashes: Record<string, string>;
};

function readJson(path: string) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown> : null;
}

function hashJson(value: unknown) {
  return `0x${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function buildBundle(room: DraftRoom, result: MatchResult) {
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
  return {
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
      authority: result.computeAuthority ?? "deterministic-background",
      score: `${result.home} ${result.homeScore}-${result.awayScore} ${result.away}`,
      winner: result.winner,
      mvp: result.mvp,
      events: result.events,
      highlights: result.highlights,
      tacticalSummary: result.tacticalSummary,
      winExplanation: result.winExplanation,
      computeReceipt: result.computeReceipt,
      table: result.table,
      matches: result.matches,
    },
    shareMetadata,
    proofReceipt: {
      roomReceipt: roomReceipt(room, result),
      proofPacket: result.proofPacket,
    },
  };
}

export async function uploadRoomBundle(room: DraftRoom, result: MatchResult): Promise<RoomStorageArtifact> {
  loadLocalEnv();
  const privateKey = process.env.OG_PRIVATE_KEY;
  const rpc = process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
  const indexerRpc =
    process.env.OG_STORAGE_INDEXER_URL ||
    process.env.VITE_OG_STORAGE_INDEXER_URL ||
    "https://indexer-storage-testnet-turbo.0g.ai";
  const bundle = buildBundle(room, result);
  const bundleBytes = new TextEncoder().encode(JSON.stringify(bundle, null, 2));
  const bundleHash = `0x${createHash("sha256").update(bundleBytes).digest("hex")}`;
  const itemHashes = {
    snapshot: hashJson(bundle.snapshot),
    draftLog: hashJson(bundle.draftLog),
    matchTranscript: hashJson(bundle.matchTranscript),
    shareMetadata: hashJson(bundle.shareMetadata),
    proofReceipt: hashJson(bundle.proofReceipt),
  };
  const base = {
    roomId: room.id,
    bundleHash,
    indexerRpc,
    items: ["player-snapshot", "draft-log", "match-transcript", "share-metadata", "proof-receipt"],
    itemHashes,
  };

  if (!privateKey) {
    return {
      status: "blocked",
      reason: "Missing OG_PRIVATE_KEY.",
      ...base,
    };
  }

  const memData = new MemData(bundleBytes);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`Merkle tree failed: ${treeErr}`);
  if (!tree) throw new Error("Merkle tree failed: empty tree.");
  const rootHash = tree.rootHash();
  if (!rootHash) throw new Error("Merkle tree failed: missing root hash.");
  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(privateKey, provider);
  const indexer = new Indexer(indexerRpc);
  const [tx, uploadErr] = await indexer.upload(memData, rpc, signer);
  if (uploadErr !== null) throw new Error(`0G Storage room bundle upload failed: ${uploadErr}`);
  const txHash = (("txHash" in tx ? tx.txHash : tx.txHashes?.[0]) || undefined) ?? undefined;
  return {
    status: "live",
    ...base,
    rootHash,
    txHash,
    storageUri: `0g://storage/${rootHash}`,
  };
}
