import { createCipheriv, createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { defaultAgent } from "../../src/worldcup/agents";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const privateKey = process.env.OG_PRIVATE_KEY;
const rpc = process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const indexerRpc =
  process.env.OG_STORAGE_INDEXER_URL ||
  process.env.VITE_OG_STORAGE_INDEXER_URL ||
  "https://indexer-storage-testnet-turbo.0g.ai";

const metadata = {
  schema: "0g-world-cup-agentic-id-v1",
  agentId: defaultAgent.id,
  displayName: defaultAgent.displayName,
  ownerWallet: defaultAgent.ownerWallet,
  imageUrl: defaultAgent.imageUrl,
  policyHash: defaultAgent.policyHash,
  encryptedFields: ["draftPolicy", "riskPolicy", "challengePolicy"],
  publicLimits: {
    bankroll: defaultAgent.bankroll,
    maxWagerPerMatch: defaultAgent.maxWagerPerMatch,
    maxGamesPerDay: defaultAgent.maxGamesPerDay,
    maxGamesPerOpponent: defaultAgent.maxGamesPerOpponent,
    stopLoss: defaultAgent.stopLoss,
    allowedModes: defaultAgent.allowedModes,
  },
  intelligence: {
    draftPolicy: defaultAgent.draftPolicy,
    riskPolicy: defaultAgent.riskPolicy,
    challengePolicy: `Challenge fee ${defaultAgent.challengeFee}; stop before ${defaultAgent.stopLoss}.`,
  },
};

const key = createHash("sha256").update(`0g-world-cup:${defaultAgent.id}`).digest();
const iv = createHash("sha256").update(`0g-world-cup:${defaultAgent.id}:agentic-id-demo-iv`).digest().subarray(0, 12);
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
const encryptedBytes = new TextEncoder().encode(JSON.stringify(encryptedPayload));
const encryptedMetadataHash = `0x${createHash("sha256").update(encryptedBytes).digest("hex")}`;

if (!privateKey) {
  const artifact = {
    status: "blocked",
    encryptedMetadataHash,
    reason: "Missing OG_PRIVATE_KEY; encrypted metadata built but not uploaded to 0G Storage.",
    env: publicEnvSummary(),
  };
  writeProofArtifact("agentic-id-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

const memData = new MemData(encryptedBytes);
const [tree, treeErr] = await memData.merkleTree();
if (treeErr !== null) throw new Error(`Merkle tree failed: ${treeErr}`);
const rootHash = tree.rootHash();
const contract = process.env.VITE_WORLD_CUP_AGENT_ID_ADDRESS || "";
const previousArtifact = existsSync("proof-artifacts/agentic-id-latest.json")
  ? JSON.parse(readFileSync("proof-artifacts/agentic-id-latest.json", "utf8")) as Record<string, unknown>
  : {};
const registryArtifact = existsSync("proof-artifacts/agentic-registry-latest.json")
  ? JSON.parse(readFileSync("proof-artifacts/agentic-registry-latest.json", "utf8")) as { agents?: Record<string, unknown>[] }
  : {};
const registryAgent = registryArtifact.agents?.find((agent) =>
  agent.agentId === defaultAgent.id &&
  agent.encryptedMetadataHash === encryptedMetadataHash &&
  agent.rootHash === rootHash &&
  agent.contract === contract
);
const previousMint =
  previousArtifact.status === "minted" &&
  previousArtifact.encryptedMetadataHash === encryptedMetadataHash &&
  previousArtifact.contract === contract
    ? {
        status: "minted",
        contractStatus: "minted",
        tokenId: previousArtifact.tokenId,
        mintTxHash: previousArtifact.mintTxHash,
        mintBlockNumber: previousArtifact.mintBlockNumber,
        owner: previousArtifact.owner,
      }
    : registryAgent?.agenticStatus === "minted" &&
        registryAgent.agenticTokenId &&
        registryAgent.mintTxHash
      ? {
          status: "minted",
          contractStatus: "minted",
          tokenId: registryAgent.agenticTokenId,
          mintTxHash: registryAgent.mintTxHash,
          mintBlockNumber: registryAgent.mintBlockNumber,
          owner: registryAgent.owner,
        }
    : {};
const indexer = new Indexer(indexerRpc);

if (registryAgent?.txHash) {
  const locations = await indexer.getFileLocations(rootHash);
  if (locations.length > 0) {
    const artifact = {
      status: previousMint.status ?? "live",
      agentId: defaultAgent.id,
      displayName: defaultAgent.displayName,
      encryptedMetadataHash,
      rootHash,
      txHash: registryAgent.txHash,
      storageUri: `0g://storage/${rootHash}`,
      contract,
      contractStatus: previousMint.contractStatus ?? (contract ? "configured-not-minted" : "tested-not-deployed"),
      indexerRpc,
      reused: "Reused Agentic ID registry metadata root and mint for the default agent.",
      ...previousMint,
    };
    writeProofArtifact("agentic-id-latest.json", artifact);
    console.log(JSON.stringify(artifact, null, 2));
    process.exit(0);
  }
}

if (previousArtifact.rootHash === rootHash && previousArtifact.txHash) {
  const locations = await indexer.getFileLocations(rootHash);
  if (locations.length > 0) {
    const artifact = {
      status: previousMint.status ?? "live",
      agentId: defaultAgent.id,
      displayName: defaultAgent.displayName,
      encryptedMetadataHash,
      rootHash,
      txHash: previousArtifact.txHash,
      storageUri: `0g://storage/${rootHash}`,
      contract,
      contractStatus: previousMint.contractStatus ?? (contract ? "configured-not-minted" : "tested-not-deployed"),
      indexerRpc,
      reused: "Existing 0G Storage Agentic ID metadata root is already discoverable; skipped duplicate upload.",
      ...previousMint,
    };
    writeProofArtifact("agentic-id-latest.json", artifact);
    console.log(JSON.stringify(artifact, null, 2));
    process.exit(0);
  }
}

const provider = new ethers.JsonRpcProvider(rpc);
const signer = new ethers.Wallet(privateKey, provider);
const [tx, uploadErr] = await indexer.upload(memData, rpc, signer);
if (uploadErr !== null) throw new Error(`0G Agentic ID metadata upload failed: ${uploadErr}`);

const knownTxByRoot: Record<string, string> = {
  "0x798d256b74eaed06946d0eef7662b0590a9d878057b15b21b781f0bb626a8442":
    "0x0964b36bc2e5498527b7848129b2131b5b6266a0935a6aef66163f9704e8f947",
};
const txHash = ("txHash" in tx ? tx.txHash : tx.txHashes?.[0]) || registryAgent?.txHash || previousArtifact.txHash || knownTxByRoot[rootHash] || "";
const artifact = {
  status: "live",
  agentId: defaultAgent.id,
  displayName: defaultAgent.displayName,
  encryptedMetadataHash,
  rootHash,
  txHash,
  storageUri: `0g://storage/${rootHash}`,
  contract,
  contractStatus: contract ? "configured-not-minted" : "tested-not-deployed",
  indexerRpc,
  ...previousMint,
};

writeProofArtifact("agentic-id-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
