import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

type StorageArtifact = {
  status?: string;
  roomId?: string;
  rootHash?: string;
  txHash?: string;
  storageUri?: string;
  indexerRpc?: string;
};

type StorageBundleArtifact = StorageArtifact & {
  bundleHash?: string;
  items?: string[];
  itemHashes?: Record<string, string>;
};

function readJson<T>(path: string): T {
  if (!existsSync(path)) throw new Error(`Missing ${path}. Run the matching proof script first.`);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function sha256(bytes: Uint8Array | string) {
  return `0x${createHash("sha256").update(bytes).digest("hex")}`;
}

function hashJson(value: unknown) {
  return sha256(JSON.stringify(value));
}

function expectRootHash(value: unknown, label: string): string {
  const rootHash = String(value ?? "");
  if (!/^0x[a-f0-9]{64}$/i.test(rootHash)) throw new Error(`${label} has invalid rootHash.`);
  return rootHash;
}

async function merkleRoot(bytes: Uint8Array) {
  const memData = new MemData(bytes);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`Merkle tree failed during readback: ${treeErr}`);
  return tree.rootHash();
}

async function downloadAndVerify(indexer: Indexer, rootHash: string, outputFile: string) {
  const err = await indexer.download(rootHash, outputFile, true);
  if (err !== null) throw new Error(`0G Storage readback failed for ${rootHash}: ${err.message}`);
  const bytes = readFileSync(outputFile);
  const downloadedMerkleRoot = await merkleRoot(bytes);
  return {
    bytes,
    byteCount: bytes.length,
    contentHash: sha256(bytes),
    downloadedMerkleRoot,
    merkleRootMatches: downloadedMerkleRoot.toLowerCase() === rootHash.toLowerCase(),
  };
}

const storage = readJson<StorageArtifact>("proof-artifacts/storage-latest.json");
const bundle = readJson<StorageBundleArtifact>("proof-artifacts/storage-bundle-latest.json");
const indexerRpc =
  storage.indexerRpc ||
  bundle.indexerRpc ||
  process.env.OG_STORAGE_INDEXER_URL ||
  process.env.VITE_OG_STORAGE_INDEXER_URL ||
  "https://indexer-storage-testnet-turbo.0g.ai";

if (storage.status !== "live" || bundle.status !== "live") {
  const artifact = {
    status: "blocked",
    reason: "0G Storage readback requires live storage-latest and storage-bundle-latest artifacts.",
    env: publicEnvSummary(),
  };
  writeProofArtifact("storage-readback-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

const storageRoot = expectRootHash(storage.rootHash, "storage-latest.json");
const bundleRoot = expectRootHash(bundle.rootHash, "storage-bundle-latest.json");
const tempDir = mkdtempSync(join(tmpdir(), "0g-world-cup-readback-"));

try {
  const indexer = new Indexer(indexerRpc);
  const proofDownload = await downloadAndVerify(indexer, storageRoot, join(tempDir, "proof-packet.json"));
  const bundleDownload = await downloadAndVerify(indexer, bundleRoot, join(tempDir, "storage-bundle.json"));

  const proofPacket = JSON.parse(proofDownload.bytes.toString("utf8")) as Record<string, unknown>;
  const bundlePayload = JSON.parse(bundleDownload.bytes.toString("utf8")) as {
    roomId?: string;
    snapshot?: unknown;
    draftLog?: unknown;
    matchTranscript?: unknown;
    shareMetadata?: unknown;
    proofReceipt?: unknown;
  };

  const itemHashMatches = {
    snapshot: hashJson(bundlePayload.snapshot) === bundle.itemHashes?.snapshot,
    draftLog: hashJson(bundlePayload.draftLog) === bundle.itemHashes?.draftLog,
    matchTranscript: hashJson(bundlePayload.matchTranscript) === bundle.itemHashes?.matchTranscript,
    shareMetadata: hashJson(bundlePayload.shareMetadata) === bundle.itemHashes?.shareMetadata,
    proofReceipt: hashJson(bundlePayload.proofReceipt) === bundle.itemHashes?.proofReceipt,
  };

  const checks = {
    proofMerkleRootMatches: proofDownload.merkleRootMatches,
    proofRoomMatches: proofPacket.room && (proofPacket.room as { id?: string }).id === storage.roomId,
    proofHasReceipt: Boolean(proofPacket.result && proofPacket.proofPacket),
    bundleMerkleRootMatches: bundleDownload.merkleRootMatches,
    bundleHashMatches: bundleDownload.contentHash === bundle.bundleHash,
    bundleRoomMatches: bundlePayload.roomId === bundle.roomId,
    bundleItemHashesMatch: Object.values(itemHashMatches).every(Boolean),
  };

  const artifact = {
    status: Object.values(checks).every(Boolean) ? "live" : "mismatch",
    indexerRpc,
    storageRoot,
    bundleRoot,
    storageUri: storage.storageUri,
    bundleStorageUri: bundle.storageUri,
    downloadedRoots: [storageRoot, bundleRoot],
    byteCount: proofDownload.byteCount + bundleDownload.byteCount,
    contentHash: sha256(`${proofDownload.contentHash}:${bundleDownload.contentHash}`),
    proofPacket: {
      roomId: storage.roomId,
      byteCount: proofDownload.byteCount,
      contentHash: proofDownload.contentHash,
      downloadedMerkleRoot: proofDownload.downloadedMerkleRoot,
    },
    storageBundle: {
      roomId: bundle.roomId,
      byteCount: bundleDownload.byteCount,
      contentHash: bundleDownload.contentHash,
      downloadedMerkleRoot: bundleDownload.downloadedMerkleRoot,
      itemHashMatches,
    },
    checks,
  };

  writeProofArtifact("storage-readback-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
} finally {
  rmSync(tempDir, { force: true, recursive: true });
}
