import { existsSync, readFileSync } from "node:fs";
import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const { completeDraft, createRoomFromId, simulate } = await import("../../src/worldcup/game");

const privateKey = process.env.OG_PRIVATE_KEY;
const rpc = process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const indexerRpc =
  process.env.OG_STORAGE_INDEXER_URL ||
  process.env.VITE_OG_STORAGE_INDEXER_URL ||
  "https://indexer-storage-testnet-turbo.0g.ai";

if (!privateKey) {
  const artifact = { status: "blocked", reason: "Missing OG_PRIVATE_KEY.", env: publicEnvSummary() };
  writeProofArtifact("storage-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

const roomId = process.argv[2] || "room-human-vs-agent-storage";
const room = completeDraft(createRoomFromId(roomId));
const result = simulate(room);
const payload = JSON.stringify({ room, result, proofPacket: result.proofPacket }, null, 2);
const memData = new MemData(new TextEncoder().encode(payload));
const [tree, treeErr] = await memData.merkleTree();
if (treeErr !== null) throw new Error(`Merkle tree failed: ${treeErr}`);
const rootHash = tree.rootHash();
const previousArtifact = existsSync("proof-artifacts/storage-latest.json")
  ? JSON.parse(readFileSync("proof-artifacts/storage-latest.json", "utf8")) as Record<string, unknown>
  : {};
const indexer = new Indexer(indexerRpc);

if (previousArtifact.rootHash === rootHash && previousArtifact.txHash) {
  const locations = await indexer.getFileLocations(rootHash);
  if (locations.length > 0) {
    const artifact = {
      ...previousArtifact,
      status: "live",
      roomId: room.id,
      rootHash,
      storageUri: `0g://storage/${rootHash}`,
      indexerRpc,
      reused: "Existing 0G Storage root is already discoverable; skipped duplicate upload.",
    };
    writeProofArtifact("storage-latest.json", artifact);
    console.log(JSON.stringify(artifact, null, 2));
    process.exit(0);
  }
}

const provider = new ethers.JsonRpcProvider(rpc);
const signer = new ethers.Wallet(privateKey, provider);
const [tx, uploadErr] = await indexer.upload(memData, rpc, signer);
if (uploadErr !== null) throw new Error(`0G Storage upload failed: ${uploadErr}`);

const txHash = "txHash" in tx ? tx.txHash : tx.txHashes?.[0];
const artifact = {
  status: "live",
  roomId: room.id,
  rootHash,
  txHash,
  storageUri: `0g://storage/${rootHash}`,
  indexerRpc,
};

writeProofArtifact("storage-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
