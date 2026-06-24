import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { registeredAgents } from "../../src/worldcup/agents";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

type Json = Record<string, unknown>;

function readJson(path: string) {
  if (!existsSync(path)) throw new Error(`Missing ${path}. Run the matching proof first.`);
  return JSON.parse(readFileSync(path, "utf8")) as Json;
}

function hash(value: unknown) {
  return `0x${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

const registry = readJson("proof-artifacts/agentic-registry-latest.json");
const chainReadback = readJson("proof-artifacts/chain-readback-latest.json");
const chainEvents = readJson("proof-artifacts/chain-events-latest.json");
const metadataReadback = readJson("proof-artifacts/agentic-id-readback-latest.json");

const registryAgents = (registry.agents ?? []) as Json[];
const registryEvents = ((chainEvents.events as { registryAgentMinted?: Json[] } | undefined)?.registryAgentMinted ?? []) as Json[];
const defaultToken = (chainReadback.agenticReadback ?? {}) as Json;
const defaultReadbackTokenId = String(defaultToken.tokenId ?? "");
const tokenReadbacks = (chainReadback.agenticTokensReadback ?? []) as Json[];
const metadataReadbacks = (metadataReadback.agents ?? []) as Json[];

const agents = registeredAgents.map((agent) => {
  const registryAgent = registryAgents.find((item) => item.agentId === agent.id) ?? {};
  const chainEvent = registryEvents.find((item) => item.agentId === agent.id) ?? {};
  const event = (chainEvent.event ?? {}) as Json;
  const tokenId = String(registryAgent.agenticTokenId ?? agent.agenticTokenId ?? "");
  const tokenReadback = tokenReadbacks.find((item) => String(item.tokenId ?? "") === tokenId || item.agentId === agent.id);
  const tokenChecks = (tokenReadback?.checks ?? {}) as Json;
  const metadataAgentReadback = metadataReadbacks.find((item) => item.agentId === agent.id);
  const metadataChecks = (metadataAgentReadback?.checks ?? {}) as Json;
  const hasDefaultTokenReadback = tokenId !== "" && tokenId === defaultReadbackTokenId;
  const hasFullTokenReadback =
    tokenChecks.tokenExists === true &&
    tokenChecks.metadataMatches === true &&
    tokenChecks.storageMatches === true;
  const hasMetadataReadback =
    metadataReadback.status === "live" &&
    metadataChecks.merkleRootMatches === true &&
    metadataChecks.encryptedMetadataHashMatches === true &&
    metadataChecks.storageUriMatches === true &&
    metadataChecks.decryptedAgentMatches === true &&
    metadataChecks.decryptedPolicyMatches === true;
  return {
    agentId: agent.id,
    displayName: agent.displayName,
    imageUrl: agent.imageUrl,
    tokenId,
    agenticStatus: registryAgent.agenticStatus ?? agent.agenticStatus,
    contract: registryAgent.contract ?? registry.contract,
    onChainOwner: tokenReadback?.owner ?? (hasDefaultTokenReadback ? defaultToken.owner : event.owner ?? registryAgent.owner),
    authorizedExecutor: tokenReadback?.authorizedExecutor ?? (hasDefaultTokenReadback ? defaultToken.authorizedExecutor : null),
    encryptedMetadataHash: registryAgent.encryptedMetadataHash,
    storageUri: registryAgent.storageUri,
    storageRoot: registryAgent.rootHash,
    policyHash: registryAgent.policyHash ?? agent.policyHash,
    eventTxHash: chainEvent.transaction,
    eventBlockNumber: chainEvent.blockNumber,
    fullTokenReadback: hasFullTokenReadback,
    metadataReadback: hasMetadataReadback,
    checks: {
      registryMinted: registryAgent.agenticStatus === "minted",
      chainEventFound: chainEvent.eventFound === true,
      chainEventTokenMatches: chainEvent.tokenMatches === true,
      chainEventOwnerMatches: chainEvent.ownerMatches === true,
      chainEventMetadataMatches: chainEvent.metadataMatches === true,
      chainEventStorageMatches: chainEvent.storageMatches === true,
      fullTokenReadback: hasFullTokenReadback,
      metadataReadback: hasMetadataReadback,
    },
  };
});

const checks = {
  registryCountMatches: registry.count === registeredAgents.length,
  registryLive: registry.status === "live" || registry.status === "minted",
  chainReadbackLive: chainReadback.status === "live",
  chainEventsLive: chainEvents.status === "live",
  everyAgentMinted: agents.every((agent) => agent.checks.registryMinted),
  everyAgentHasChainEvent: agents.every((agent) => agent.checks.chainEventFound),
  everyChainEventMatches: agents.every(
    (agent) =>
      agent.checks.chainEventTokenMatches &&
      agent.checks.chainEventOwnerMatches &&
      agent.checks.chainEventMetadataMatches &&
      agent.checks.chainEventStorageMatches,
  ),
  defaultAgentTokenReadback: agents.some((agent) => agent.agentId === "agent-zero-nine" && agent.checks.fullTokenReadback),
  defaultAgentMetadataReadback: agents.some((agent) => agent.agentId === "agent-zero-nine" && agent.checks.metadataReadback),
  allAgentTokenReadback: agents.every((agent) => agent.checks.fullTokenReadback),
  allAgentMetadataReadback: agents.every((agent) => agent.checks.metadataReadback),
};

const artifact = {
  schema: "0g-world-cup-agent-manager-readback-v1",
  status: Object.values(checks).every(Boolean) ? "live" : "mismatch",
  count: agents.length,
  agents,
  readbackHash: hash({ agents, checks }),
  checks,
  env: publicEnvSummary(),
};

writeProofArtifact("agent-manager-readback-latest.json", artifact);
console.log(JSON.stringify({ status: artifact.status, count: artifact.count, readbackHash: artifact.readbackHash }, null, 2));
