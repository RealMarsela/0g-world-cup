import { existsSync, readFileSync } from "node:fs";
import { createPublicClient, http, keccak256, parseEventLogs, toBytes } from "viem";
import { loadLocalEnv, writeProofArtifact } from "./env";

loadLocalEnv();

const { zeroGGalileo, CONTRACTS } = await import("../../src/config/chain");

type ChainArtifact = {
  roomId?: string;
  txHash?: string;
  contract?: string;
  storageUri?: string;
  readback?: {
    snapshotHash?: string;
    lineupHash?: string;
    resultHash?: string;
    winner?: string;
  };
};

type AgenticArtifact = {
  tokenId?: string;
  mintTxHash?: string;
  contract?: string;
  owner?: string;
  encryptedMetadataHash?: string;
  storageUri?: string;
};

type RegistryAgent = {
  agentId?: string;
  agenticTokenId?: string;
  mintTxHash?: string;
  owner?: string;
  encryptedMetadataHash?: string;
  storageUri?: string;
};

type AgenticRegistryArtifact = {
  agents?: RegistryAgent[];
};

const eventAbi = [
  {
    type: "event",
    name: "ResultCommitted",
    inputs: [
      { name: "roomId", type: "bytes32", indexed: true },
      { name: "snapshotHash", type: "bytes32", indexed: false },
      { name: "lineupHash", type: "bytes32", indexed: false },
      { name: "resultHash", type: "bytes32", indexed: false },
      { name: "storageUri", type: "string", indexed: false },
      { name: "winner", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "AgentMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "encryptedMetadataHash", type: "bytes32", indexed: false },
      { name: "storageUri", type: "string", indexed: false },
    ],
  },
] as const;

function readArtifact<T>(name: string): T {
  const path = `proof-artifacts/${name}`;
  if (!existsSync(path)) throw new Error(`Missing ${name}.`);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function asBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value as `0x${string}` : keccak256(toBytes(value));
}

function sameHex(left?: string, right?: string) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

const chain = readArtifact<ChainArtifact>("chain-result-latest.json");
const agentic = readArtifact<AgenticArtifact>("agentic-id-latest.json");
const agenticRegistry = existsSync("proof-artifacts/agentic-registry-latest.json")
  ? readArtifact<AgenticRegistryArtifact>("agentic-registry-latest.json")
  : { agents: [] };

if (!chain.roomId || !chain.txHash || !chain.storageUri || !chain.readback) {
  throw new Error("chain-result-latest.json must include roomId, txHash, storageUri, and readback.");
}
if (!agentic.tokenId || !agentic.mintTxHash || !agentic.owner || !agentic.encryptedMetadataHash || !agentic.storageUri) {
  throw new Error("agentic-id-latest.json must include tokenId, mintTxHash, owner, encryptedMetadataHash, and storageUri.");
}

const client = createPublicClient({
  chain: zeroGGalileo,
  transport: http(zeroGGalileo.rpcUrls.default.http[0]),
});

const [resultReceipt, agentReceipt] = await Promise.all([
  client.getTransactionReceipt({ hash: chain.txHash as `0x${string}` }),
  client.getTransactionReceipt({ hash: agentic.mintTxHash as `0x${string}` }),
]);

const registryAgents = (agenticRegistry.agents ?? []).filter((agent) =>
  Boolean(agent.agenticTokenId && agent.mintTxHash && agent.owner && agent.encryptedMetadataHash && agent.storageUri),
);
const registryReceipts = await Promise.all(
  registryAgents.map((agent) => client.getTransactionReceipt({ hash: agent.mintTxHash as `0x${string}` })),
);

const resultEvents = parseEventLogs({
  abi: eventAbi,
  eventName: "ResultCommitted",
  logs: resultReceipt.logs,
});
const agentEvents = parseEventLogs({
  abi: eventAbi,
  eventName: "AgentMinted",
  logs: agentReceipt.logs,
});

const resultEvent = resultEvents.find((event) => event.address.toLowerCase() === CONTRACTS.results.toLowerCase());
const agentEvent = agentEvents.find((event) => event.address.toLowerCase() === CONTRACTS.agentId.toLowerCase());
const registryEventProofs = registryAgents.map((agent, index) => {
  const receipt = registryReceipts[index];
  const parsed = parseEventLogs({
    abi: eventAbi,
    eventName: "AgentMinted",
    logs: receipt.logs,
  });
  const event = parsed.find((entry) => entry.address.toLowerCase() === CONTRACTS.agentId.toLowerCase());
  const args = event?.args;
  return {
    agentId: agent.agentId,
    transaction: agent.mintTxHash,
    blockNumber: receipt.blockNumber.toString(),
    txSucceeded: receipt.status === "success",
    txToContract: sameHex(receipt.to ?? undefined, CONTRACTS.agentId),
    eventFound: Boolean(event),
    tokenMatches: args?.tokenId?.toString() === agent.agenticTokenId,
    ownerMatches: sameHex(args?.owner, agent.owner),
    metadataMatches: sameHex(args?.encryptedMetadataHash, agent.encryptedMetadataHash),
    storageMatches: args?.storageUri === agent.storageUri,
    event: event
      ? {
          contract: event.address,
          tokenId: args?.tokenId?.toString(),
          owner: args?.owner,
          encryptedMetadataHash: args?.encryptedMetadataHash,
          storageUri: args?.storageUri,
        }
      : null,
  };
});

const expectedRoomHash = asBytes32(chain.roomId);
const resultArgs = resultEvent?.args;
const agentArgs = agentEvent?.args;

const checks = {
  resultTxSucceeded: resultReceipt.status === "success",
  resultTxToContract: sameHex(resultReceipt.to ?? undefined, CONTRACTS.results),
  resultEventFound: Boolean(resultEvent),
  resultRoomMatches: resultArgs?.roomId === expectedRoomHash,
  resultSnapshotMatches: sameHex(resultArgs?.snapshotHash, chain.readback.snapshotHash),
  resultLineupMatches: sameHex(resultArgs?.lineupHash, chain.readback.lineupHash),
  resultHashMatches: sameHex(resultArgs?.resultHash, chain.readback.resultHash),
  resultStorageMatches: resultArgs?.storageUri === chain.storageUri,
  resultWinnerMatches: sameHex(resultArgs?.winner, chain.readback.winner),
  agentTxSucceeded: agentReceipt.status === "success",
  agentTxToContract: sameHex(agentReceipt.to ?? undefined, CONTRACTS.agentId),
  agentEventFound: Boolean(agentEvent),
  agentTokenMatches: agentArgs?.tokenId?.toString() === agentic.tokenId,
  agentOwnerMatches: sameHex(agentArgs?.owner, agentic.owner),
  agentMetadataMatches: sameHex(agentArgs?.encryptedMetadataHash, agentic.encryptedMetadataHash),
  agentStorageMatches: agentArgs?.storageUri === agentic.storageUri,
  registryAgentEventsFound: registryEventProofs.length === 2 && registryEventProofs.every((proof) => proof.eventFound),
  registryAgentTxsSucceeded: registryEventProofs.length === 2 && registryEventProofs.every((proof) => proof.txSucceeded),
  registryAgentTxsToContract: registryEventProofs.length === 2 && registryEventProofs.every((proof) => proof.txToContract),
  registryAgentTokensMatch: registryEventProofs.length === 2 && registryEventProofs.every((proof) => proof.tokenMatches),
  registryAgentOwnersMatch: registryEventProofs.length === 2 && registryEventProofs.every((proof) => proof.ownerMatches),
  registryAgentMetadataMatches: registryEventProofs.length === 2 && registryEventProofs.every((proof) => proof.metadataMatches),
  registryAgentStorageMatches: registryEventProofs.length === 2 && registryEventProofs.every((proof) => proof.storageMatches),
};

const artifact = {
  status: Object.values(checks).every(Boolean) ? "live" : "mismatch",
  chainId: zeroGGalileo.id,
  blockNumbers: {
    result: resultReceipt.blockNumber.toString(),
    agentic: agentReceipt.blockNumber.toString(),
    registryAgents: registryEventProofs.map((proof) => proof.blockNumber),
  },
  transactions: {
    result: chain.txHash,
    agentic: agentic.mintTxHash,
    registryAgents: registryEventProofs.map((proof) => String(proof.transaction)),
  },
  events: {
    resultCommitted: resultEvent
      ? {
          contract: resultEvent.address,
          roomHash: resultArgs?.roomId,
          snapshotHash: resultArgs?.snapshotHash,
          lineupHash: resultArgs?.lineupHash,
          resultHash: resultArgs?.resultHash,
          storageUri: resultArgs?.storageUri,
          winner: resultArgs?.winner,
        }
      : null,
    agentMinted: agentEvent
      ? {
          contract: agentEvent.address,
          tokenId: agentArgs?.tokenId?.toString(),
          owner: agentArgs?.owner,
          encryptedMetadataHash: agentArgs?.encryptedMetadataHash,
          storageUri: agentArgs?.storageUri,
        }
      : null,
    registryAgentMinted: registryEventProofs,
  },
  checks,
};

writeProofArtifact("chain-events-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
