import { createDecipheriv, createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { defaultAgent } from "../../src/worldcup/agents";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

type AgenticArtifact = {
  status?: string;
  agentId?: string;
  displayName?: string;
  encryptedMetadataHash?: string;
  rootHash?: string;
  storageUri?: string;
  indexerRpc?: string;
  tokenId?: string;
  contract?: string;
};

type EncryptedPayload = {
  schema?: string;
  algorithm?: string;
  iv?: string;
  tag?: string;
  ciphertext?: string;
};

function readJson<T>(path: string): T {
  if (!existsSync(path)) throw new Error(`Missing ${path}. Run the matching proof script first.`);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function sha256(bytes: Uint8Array | string) {
  return `0x${createHash("sha256").update(bytes).digest("hex")}`;
}

function expectRootHash(value: unknown) {
  const rootHash = String(value ?? "");
  if (!/^0x[a-f0-9]{64}$/i.test(rootHash)) throw new Error("agentic-id-latest.json has invalid rootHash.");
  return rootHash;
}

async function merkleRoot(bytes: Uint8Array) {
  const memData = new MemData(bytes);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`Merkle tree failed during Agentic ID readback: ${treeErr}`);
  return tree.rootHash();
}

function decryptPayload(payload: EncryptedPayload) {
  if (!payload.iv || !payload.tag || !payload.ciphertext) {
    throw new Error("Downloaded Agentic ID payload is missing encrypted fields.");
  }
  const key = createHash("sha256").update(`0g-world-cup:${defaultAgent.id}`).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "hex"));
  decipher.setAuthTag(Buffer.from(payload.tag, "hex"));
  const clear = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "hex")),
    decipher.final(),
  ]);
  return JSON.parse(clear.toString("utf8")) as {
    schema?: string;
    agentId?: string;
    displayName?: string;
    publicLimits?: { allowedModes?: string[] };
    intelligence?: { riskPolicy?: string };
  };
}

const agentic = readJson<AgenticArtifact>("proof-artifacts/agentic-id-latest.json");
const rootHash = expectRootHash(agentic.rootHash);
const indexerRpc =
  agentic.indexerRpc ||
  process.env.OG_STORAGE_INDEXER_URL ||
  process.env.VITE_OG_STORAGE_INDEXER_URL ||
  "https://indexer-storage-testnet-turbo.0g.ai";

if (!agentic.encryptedMetadataHash || !agentic.storageUri) {
  const artifact = {
    status: "blocked",
    reason: "Agentic ID readback requires an uploaded agentic-id-latest artifact.",
    env: publicEnvSummary(),
  };
  writeProofArtifact("agentic-id-readback-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

const tempDir = mkdtempSync(join(tmpdir(), "0g-world-cup-agentic-readback-"));

try {
  const outputFile = join(tempDir, "agentic-id-metadata.json");
  const indexer = new Indexer(indexerRpc);
  const err = await indexer.download(rootHash, outputFile, true);
  if (err !== null) throw new Error(`0G Agentic ID readback failed for ${rootHash}: ${err.message}`);

  const bytes = readFileSync(outputFile);
  const downloadedMerkleRoot = await merkleRoot(bytes);
  const encryptedContentHash = sha256(bytes);
  const encryptedPayload = JSON.parse(bytes.toString("utf8")) as EncryptedPayload;
  const decrypted = decryptPayload(encryptedPayload);

  const checks = {
    merkleRootMatches: downloadedMerkleRoot.toLowerCase() === rootHash.toLowerCase(),
    encryptedMetadataHashMatches: encryptedContentHash.toLowerCase() === agentic.encryptedMetadataHash.toLowerCase(),
    storageUriMatches: agentic.storageUri === `0g://storage/${rootHash}`,
    decryptedAgentMatches: decrypted.agentId === defaultAgent.id,
    decryptedNameMatches: decrypted.displayName === defaultAgent.displayName,
    decryptedPolicyMatches: decrypted.intelligence?.riskPolicy === defaultAgent.riskPolicy,
  };

  const artifact = {
    status: Object.values(checks).every(Boolean) ? "live" : "mismatch",
    agentId: agentic.agentId,
    displayName: agentic.displayName,
    tokenId: agentic.tokenId,
    contract: agentic.contract,
    indexerRpc,
    rootHash,
    storageUri: agentic.storageUri,
    encryptedMetadataHash: agentic.encryptedMetadataHash,
    contentHash: encryptedContentHash,
    byteCount: bytes.length,
    downloadedMerkleRoot,
    decryptedSchema: decrypted.schema,
    decryptedAllowedModes: decrypted.publicLimits?.allowedModes ?? [],
    checks,
  };

  writeProofArtifact("agentic-id-readback-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
} finally {
  rmSync(tempDir, { force: true, recursive: true });
}
