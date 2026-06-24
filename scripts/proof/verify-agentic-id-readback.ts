import { createDecipheriv, createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { defaultAgent, registeredAgents } from "../../src/worldcup/agents";
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

type RegistryArtifact = {
  agents?: AgenticArtifact[];
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

function decryptPayload(payload: EncryptedPayload, agent: (typeof registeredAgents)[number]) {
  if (!payload.iv || !payload.tag || !payload.ciphertext) {
    throw new Error("Downloaded Agentic ID payload is missing encrypted fields.");
  }
  const key = createHash("sha256").update(`0g-world-cup:${agent.id}`).digest();
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
const registry = existsSync("proof-artifacts/agentic-registry-latest.json")
  ? readJson<RegistryArtifact>("proof-artifacts/agentic-registry-latest.json")
  : { agents: [] };
const indexerRpc =
  agentic.indexerRpc ||
  process.env.OG_STORAGE_INDEXER_URL ||
  process.env.VITE_OG_STORAGE_INDEXER_URL ||
  "https://indexer-storage-testnet-turbo.0g.ai";

const sources = registry.agents?.length ? registry.agents : [agentic];
const missingUploads = sources.filter((source) => !source.encryptedMetadataHash || !source.storageUri || !source.rootHash);
if (missingUploads.length > 0) {
  const artifact = {
    status: "blocked",
    reason: "Agentic ID readback requires uploaded metadata artifacts for every registered agent.",
    env: publicEnvSummary(),
  };
  writeProofArtifact("agentic-id-readback-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

const tempDir = mkdtempSync(join(tmpdir(), "0g-world-cup-agentic-readback-"));

try {
  const indexer = new Indexer(indexerRpc);
  const agents = [];

  for (const source of sources) {
    const agent = registeredAgents.find((candidate) => candidate.id === source.agentId);
    if (!agent) throw new Error(`Unknown Agentic ID source agent ${source.agentId}.`);
    const rootHash = expectRootHash(source.rootHash);
    const outputFile = join(tempDir, `${agent.id}-metadata.json`);
    const err = await indexer.download(rootHash, outputFile, true);
    if (err !== null) throw new Error(`0G Agentic ID readback failed for ${agent.id} ${rootHash}: ${err.message}`);

    const bytes = readFileSync(outputFile);
    const downloadedMerkleRoot = await merkleRoot(bytes);
    const encryptedContentHash = sha256(bytes);
    const encryptedPayload = JSON.parse(bytes.toString("utf8")) as EncryptedPayload;
    const decrypted = decryptPayload(encryptedPayload, agent);

    const checks = {
      merkleRootMatches: downloadedMerkleRoot.toLowerCase() === rootHash.toLowerCase(),
      encryptedMetadataHashMatches: encryptedContentHash.toLowerCase() === String(source.encryptedMetadataHash).toLowerCase(),
      storageUriMatches: source.storageUri === `0g://storage/${rootHash}`,
      decryptedAgentMatches: decrypted.agentId === agent.id,
      decryptedNameMatches: decrypted.displayName === agent.displayName,
      decryptedPolicyMatches: decrypted.intelligence?.riskPolicy === agent.riskPolicy,
    };

    agents.push({
      agentId: source.agentId,
      displayName: source.displayName,
      tokenId: source.tokenId,
      contract: source.contract,
      indexerRpc,
      rootHash,
      storageUri: source.storageUri,
      encryptedMetadataHash: source.encryptedMetadataHash,
      contentHash: encryptedContentHash,
      byteCount: bytes.length,
      downloadedMerkleRoot,
      decryptedSchema: decrypted.schema,
      decryptedAllowedModes: decrypted.publicLimits?.allowedModes ?? [],
      checks,
    });
  }

  const defaultReadback = agents.find((agent) => agent.agentId === defaultAgent.id) ?? agents[0];
  const checks = {
    everyAgentDownloaded: agents.length === registeredAgents.length,
    everyMerkleRootMatches: agents.every((agent) => agent.checks.merkleRootMatches),
    everyEncryptedMetadataHashMatches: agents.every((agent) => agent.checks.encryptedMetadataHashMatches),
    everyStorageUriMatches: agents.every((agent) => agent.checks.storageUriMatches),
    everyDecryptedAgentMatches: agents.every((agent) => agent.checks.decryptedAgentMatches),
    everyDecryptedPolicyMatches: agents.every((agent) => agent.checks.decryptedPolicyMatches),
    merkleRootMatches: defaultReadback?.checks.merkleRootMatches === true,
    encryptedMetadataHashMatches: defaultReadback?.checks.encryptedMetadataHashMatches === true,
    decryptedAgentMatches: defaultReadback?.checks.decryptedAgentMatches === true,
    decryptedPolicyMatches: defaultReadback?.checks.decryptedPolicyMatches === true,
  };

  const artifact = {
    status: Object.values(checks).every(Boolean) ? "live" : "mismatch",
    agentId: defaultReadback?.agentId,
    displayName: defaultReadback?.displayName,
    tokenId: defaultReadback?.tokenId,
    contract: defaultReadback?.contract,
    indexerRpc,
    rootHash: defaultReadback?.rootHash,
    storageUri: defaultReadback?.storageUri,
    encryptedMetadataHash: defaultReadback?.encryptedMetadataHash,
    contentHash: defaultReadback?.contentHash,
    byteCount: agents.reduce((total, agent) => total + agent.byteCount, 0),
    downloadedMerkleRoot: defaultReadback?.downloadedMerkleRoot,
    decryptedSchema: defaultReadback?.decryptedSchema,
    decryptedAllowedModes: defaultReadback?.decryptedAllowedModes ?? [],
    agents,
    checks,
  };

  writeProofArtifact("agentic-id-readback-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
} finally {
  rmSync(tempDir, { force: true, recursive: true });
}
