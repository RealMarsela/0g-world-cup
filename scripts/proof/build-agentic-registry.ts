import { createCipheriv, createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { registeredAgents } from "../../src/worldcup/agents";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const privateKey = process.env.OG_PRIVATE_KEY;
const rpc = process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const indexerRpc =
  process.env.OG_STORAGE_INDEXER_URL ||
  process.env.VITE_OG_STORAGE_INDEXER_URL ||
  "https://indexer-storage-testnet-turbo.0g.ai";

function encryptedAgentPayload(agent: (typeof registeredAgents)[number]) {
  const metadata = {
    schema: "0g-world-cup-agentic-id-v1",
    agentId: agent.id,
    displayName: agent.displayName,
    ownerWallet: agent.ownerWallet,
    imageUrl: agent.imageUrl,
    policyHash: agent.policyHash,
    encryptedFields: ["draftPolicy", "riskPolicy", "challengePolicy"],
    publicLimits: {
      bankroll: agent.bankroll,
      maxWagerPerMatch: agent.maxWagerPerMatch,
      maxGamesPerDay: agent.maxGamesPerDay,
      maxGamesPerOpponent: agent.maxGamesPerOpponent,
      stopLoss: agent.stopLoss,
      allowedModes: agent.allowedModes,
    },
    intelligence: {
      draftPolicy: agent.draftPolicy,
      riskPolicy: agent.riskPolicy,
      challengePolicy: `Challenge fee ${agent.challengeFee}; stop before ${agent.stopLoss}.`,
    },
  };
  const key = createHash("sha256").update(`0g-world-cup:${agent.id}`).digest();
  const iv = createHash("sha256").update(`0g-world-cup:${agent.id}:agentic-id-demo-iv`).digest().subarray(0, 12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(metadata), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const encryptedPayload = {
    schema: "0g-world-cup-agentic-id-encrypted-v1",
    algorithm: "aes-256-gcm-demo-deterministic-key",
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    ciphertext: encrypted.toString("hex"),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(encryptedPayload));
  return {
    bytes,
    encryptedMetadataHash: `0x${createHash("sha256").update(bytes).digest("hex")}`,
  };
}

const previous = existsSync("proof-artifacts/agentic-registry-latest.json")
  ? JSON.parse(readFileSync("proof-artifacts/agentic-registry-latest.json", "utf8")) as { agents?: Record<string, unknown>[] }
  : {};

const indexer = privateKey ? new Indexer(indexerRpc) : null;
const signer = privateKey ? new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(rpc)) : null;
const agents = [];

for (const agent of registeredAgents) {
  const { bytes, encryptedMetadataHash } = encryptedAgentPayload(agent);
  const memData = new MemData(bytes);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`Merkle tree failed for ${agent.id}: ${treeErr}`);
  const rootHash = tree.rootHash();
  const old = previous.agents?.find((item) => item.agentId === agent.id && item.rootHash === rootHash);
  let txHash = String(old?.txHash || "");
  let status = privateKey ? "live" : "blocked";
  let reused = "";

  if (indexer && signer) {
    let locations: unknown[] = [];
    try {
      locations = await indexer.getFileLocations(rootHash);
    } catch (error) {
      if (!String(error instanceof Error ? error.message : error).includes("file not found")) throw error;
    }
    if (locations.length > 0 && txHash) {
      reused = "Existing 0G Storage Agentic ID metadata root is already discoverable.";
    } else {
      const [tx, uploadErr] = await indexer.upload(memData, rpc, signer);
      if (uploadErr !== null) throw new Error(`0G Agentic ID metadata upload failed for ${agent.id}: ${uploadErr}`);
      txHash = ("txHash" in tx ? tx.txHash : tx.txHashes?.[0]) || txHash;
    }
  }

  if (!privateKey) status = "blocked";
  agents.push({
    status,
    agentId: agent.id,
    displayName: agent.displayName,
    ownerWallet: agent.ownerWallet,
    imageUrl: agent.imageUrl,
    policyHash: agent.policyHash,
    agenticTokenId: String(old?.agenticTokenId || agent.agenticTokenId || ""),
    agenticStatus: old?.agenticStatus === "minted" ? "minted" : agent.agenticStatus,
    encryptedMetadataHash,
    rootHash,
    txHash,
    storageUri: `0g://storage/${rootHash}`,
    mintTxHash: old?.mintTxHash || undefined,
    mintBlockNumber: old?.mintBlockNumber || undefined,
    contract: old?.contract || undefined,
    owner: old?.owner || undefined,
    reused: reused || undefined,
  });
}

const artifact = {
  status: privateKey ? "live" : "blocked",
  schema: "0g-world-cup-agentic-registry-v1",
  count: agents.length,
  agents,
  env: publicEnvSummary(),
  reason: privateKey ? undefined : "Missing OG_PRIVATE_KEY; encrypted metadata built but not uploaded to 0G Storage.",
};

writeProofArtifact("agentic-registry-latest.json", artifact);
console.log(JSON.stringify({ status: artifact.status, count: artifact.count }, null, 2));
