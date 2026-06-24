import assert from "node:assert/strict";
import type { ProofArtifact } from "./proof-artifacts.ts";

type AgenticArtifacts = {
  agentic: ProofArtifact;
  agenticRegistry: ProofArtifact;
  agenticReadback: ProofArtifact;
  agentManagerReadback: ProofArtifact;
};

export function assertAgenticArtifacts({
  agentic,
  agenticRegistry,
  agenticReadback,
  agentManagerReadback,
}: AgenticArtifacts) {
  assert.ok(agentic.status === "live" || agentic.status === "minted", "Agentic metadata must be live or minted");
  assert.match(String(agentic.encryptedMetadataHash), /^0x[a-f0-9]{64}$/i, "agentic metadata hash");
  assert.match(String(agentic.storageUri), /^0g:\/\/storage\/0x[a-f0-9]{64}$/i, "agentic storage URI");
  if (agentic.status === "minted") {
    assert.match(String(agentic.contract), /^0x[a-f0-9]{40}$/i, "agentic contract address");
    assert.match(String(agentic.mintTxHash), /^0x[a-f0-9]{64}$/i, "agentic mint tx");
    assert.match(String(agentic.tokenId), /^\d+$/i, "agentic token id");
  }

  assert.ok(agenticRegistry.status === "live" || agenticRegistry.status === "minted", "Agentic registry metadata must be live or minted");
  assert.equal(agenticRegistry.count, 2, "Agentic registry must include exactly two agents");
  for (const agent of agenticRegistry.agents as Record<string, unknown>[]) {
    assert.match(String(agent.agentId), /^agent-/, "registry agent id");
    assert.match(String(agent.imageUrl), /^\/agents\/agent-[12]\.jpg$/, "registry agent image");
    assert.match(String(agent.policyHash), /^0x[a-f0-9]{64}$/i, "registry policy hash");
    assert.match(String(agent.encryptedMetadataHash), /^0x[a-f0-9]{64}$/i, "registry encrypted metadata hash");
    assert.match(String(agent.rootHash), /^0x[a-f0-9]{64}$/i, "registry root hash");
    assert.match(String(agent.txHash), /^0x[a-f0-9]{64}$/i, "registry tx hash");
    assert.match(String(agent.storageUri), /^0g:\/\/storage\/0x[a-f0-9]{64}$/i, "registry storage URI");
    assert.equal(agent.agenticStatus, "minted", "registry agent must have minted Agentic ID");
    assert.match(String(agent.agenticTokenId), /^\d+$/i, "registry agent token id");
    assert.match(String(agent.mintTxHash), /^0x[a-f0-9]{64}$/i, "registry mint tx");
  }

  assert.equal(agenticReadback.status, "live", "Agentic ID readback must be live");
  assert.match(String(agenticReadback.contentHash), /^0x[a-f0-9]{64}$/i, "agentic readback content hash");
  assert.equal((agenticReadback.checks as { merkleRootMatches?: boolean }).merkleRootMatches, true, "agentic readback merkle root");
  assert.equal((agenticReadback.checks as { encryptedMetadataHashMatches?: boolean }).encryptedMetadataHashMatches, true, "agentic readback metadata hash");
  assert.equal((agenticReadback.checks as { decryptedAgentMatches?: boolean }).decryptedAgentMatches, true, "agentic readback decrypted agent");
  assert.equal((agenticReadback.checks as { decryptedPolicyMatches?: boolean }).decryptedPolicyMatches, true, "agentic readback decrypted policy");
  assert.equal((agenticReadback.checks as { everyAgentDownloaded?: boolean }).everyAgentDownloaded, true, "agentic readback every agent downloaded");
  assert.equal((agenticReadback.checks as { everyEncryptedMetadataHashMatches?: boolean }).everyEncryptedMetadataHashMatches, true, "agentic readback every metadata hash");
  assert.equal((agenticReadback.checks as { everyDecryptedAgentMatches?: boolean }).everyDecryptedAgentMatches, true, "agentic readback every decrypted agent");
  assert.equal((agenticReadback.agents as Record<string, unknown>[]).length, 2, "Agentic ID readback must include two agents");
  for (const agent of agenticReadback.agents as Record<string, unknown>[]) {
    assert.match(String(agent.agentId), /^agent-/, "agentic readback agent id");
    assert.match(String(agent.contentHash), /^0x[a-f0-9]{64}$/i, "agentic readback content hash");
    assert.equal((agent.checks as { decryptedPolicyMatches?: boolean }).decryptedPolicyMatches, true, "agentic readback agent policy");
  }

  assert.equal(agentManagerReadback.status, "live", "Agent Manager readback must be live");
  assert.equal(agentManagerReadback.count, 2, "Agent Manager readback must include two agents");
  assert.match(String(agentManagerReadback.readbackHash), /^0x[a-f0-9]{64}$/i, "Agent Manager readback hash");
  assert.equal((agentManagerReadback.checks as { everyAgentMinted?: boolean }).everyAgentMinted, true, "Agent Manager agents minted");
  assert.equal((agentManagerReadback.checks as { everyAgentHasChainEvent?: boolean }).everyAgentHasChainEvent, true, "Agent Manager chain events");
  assert.equal((agentManagerReadback.checks as { defaultAgentTokenReadback?: boolean }).defaultAgentTokenReadback, true, "Agent Manager token readback");
  assert.equal((agentManagerReadback.checks as { defaultAgentMetadataReadback?: boolean }).defaultAgentMetadataReadback, true, "Agent Manager metadata readback");
  assert.equal((agentManagerReadback.checks as { allAgentTokenReadback?: boolean }).allAgentTokenReadback, true, "Agent Manager all token readback");
  assert.equal((agentManagerReadback.checks as { allAgentMetadataReadback?: boolean }).allAgentMetadataReadback, true, "Agent Manager all metadata readback");
  for (const agent of agentManagerReadback.agents as Record<string, unknown>[]) {
    assert.equal(agent.fullTokenReadback, true, "Agent Manager agent token readback");
    assert.equal(agent.metadataReadback, true, "Agent Manager agent metadata readback");
  }
}
