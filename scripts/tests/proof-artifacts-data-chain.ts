import assert from "node:assert/strict";
import type { ProofArtifact } from "./proof-artifacts.ts";

type DataChainArtifacts = {
  dataPipeline: ProofArtifact;
  playerSnapshot: ProofArtifact;
  integrationMatrix: ProofArtifact;
  storage: ProofArtifact;
  storageBundle: ProofArtifact;
  storageReadback: ProofArtifact;
  chain: ProofArtifact;
  chainReadback: ProofArtifact;
  chainEvents: ProofArtifact;
  escrowReadiness: ProofArtifact;
  browserWallet: ProofArtifact;
  wagerSettlement: ProofArtifact;
};

export function assertDataChainArtifacts(artifacts: DataChainArtifacts) {
  const {
    playerSnapshot,
    dataPipeline,
    integrationMatrix,
    storage,
    storageBundle,
    storageReadback,
    chain,
    chainReadback,
    chainEvents,
    escrowReadiness,
    browserWallet,
    wagerSettlement,
  } = artifacts;

  assert.ok(
    dataPipeline.status === "verified",
    "data pipeline proof must verify import, normalize, rate, publish, and historical 0G mirror",
  );
  assert.equal(dataPipeline.schema, "0g-world-cup-data-pipeline-proof-v1", "data pipeline proof schema");
  assert.match(String(dataPipeline.pipelineHash), /^0x[a-f0-9]{64}$/i, "data pipeline hash");
  assert.ok(Number(dataPipeline.workPlayerCount) >= 22, "data pipeline local player count");
  assert.equal((dataPipeline.checks as { selectedSourceProducedRows?: boolean }).selectedSourceProducedRows, true, "data pipeline selected source");
  assert.equal((dataPipeline.checks as { normalizedMatchesImported?: boolean }).normalizedMatchesImported, true, "data pipeline normalized import");
  assert.equal((dataPipeline.checks as { ratedMatchesNormalized?: boolean }).ratedMatchesNormalized, true, "data pipeline rated normalized");
  assert.equal((dataPipeline.checks as { publishedHashMatchesReceipt?: boolean }).publishedHashMatchesReceipt, true, "data pipeline published receipt");
  assert.equal((dataPipeline.checks as { d1SeedExists?: boolean }).d1SeedExists, true, "data pipeline D1 seed");
  assert.equal((dataPipeline.checks as { cloudflareManifestExists?: boolean }).cloudflareManifestExists, true, "data pipeline Cloudflare manifest");
  assert.equal((dataPipeline.checks as { historical0GStorageLive?: boolean }).historical0GStorageLive, true, "data pipeline historical 0G storage");

  assert.ok(
    playerSnapshot.status === "live" || playerSnapshot.status === "pending-finality",
    "historical player snapshot must be live or submitted pending finality on 0G Storage",
  );
  assert.equal(playerSnapshot.snapshotVersion, "0g-world-cup-history-1970-2022", "historical snapshot version");
  assert.ok(Number(playerSnapshot.playerCount) >= 8000, "historical snapshot player count");
  assert.ok(Number(playerSnapshot.teamCount) >= 300, "historical snapshot team count");
  assert.match(String(playerSnapshot.snapshotHash), /^0x[a-f0-9]{64}$/i, "historical snapshot hash");
  assert.match(String(playerSnapshot.rootHash), /^0x[a-f0-9]{64}$/i, "historical snapshot storage root");
  assert.match(String(playerSnapshot.txHash), /^0x[a-f0-9]{64}$/i, "historical snapshot tx hash");
  assert.match(String(playerSnapshot.storageUri), /^0g:\/\/storage\/0x[a-f0-9]{64}$/i, "historical snapshot storage URI");

  assert.equal(integrationMatrix.schema, "0g-world-cup-integration-matrix-v1", "integration matrix schema");
  assert.ok(
    integrationMatrix.status === "verified" ||
      integrationMatrix.status === "externally-blocked" ||
      integrationMatrix.status === "incomplete",
    "integration matrix status",
  );
  assert.match(String(integrationMatrix.coverageHash), /^0x[a-f0-9]{64}$/i, "integration matrix hash");
  const coverage = integrationMatrix.coverage as { id?: string; status?: string; uiSurface?: string }[];
  for (const id of [
    "data-pipeline-import-publish",
    "historical-player-snapshot",
    "storage-proof-packet",
    "storage-product-bundle",
    "chain-contracts",
    "chain-result-commitment",
    "browser-wallet-wager-actions",
    "wager-settlement",
    "compute-router",
    "compute-broker",
    "runtime-compute-authority",
    "runtime-finalization-guard",
    "da-byte-ready-batch",
    "da-local-stack",
    "da-sidecar-submit",
    "cloudflare-tunnel-bridge",
    "agentic-id-mint",
    "agentic-registry",
    "agentic-storage-readback",
    "agent-manager-live-readback",
  ]) {
    assert.equal(coverage.some((entry) => entry.id === id), true, `integration matrix includes ${id}`);
  }
  assert.equal(
    coverage.some(
      (entry) =>
        entry.id === "compute-router" &&
        (entry.status === "verified" || entry.status === "external-blocked"),
    ),
    true,
    "integration matrix must show compute router as live or honestly externally blocked",
  );
  assert.equal(
    coverage.some((entry) => entry.id === "compute-broker" && entry.status === "external-blocked"),
    true,
    "integration matrix must expose current direct compute broker blocker",
  );
  assert.equal(
    coverage.some((entry) => entry.id === "runtime-finalization-guard" && entry.status === "verified"),
    true,
    "integration matrix must verify runtime finalization guard",
  );
  assert.equal(
    coverage.some((entry) => entry.id === "cloudflare-tunnel-bridge" && entry.status === "local-only"),
    true,
    "integration matrix must expose current tunnel mode",
  );

  assert.equal(storage.status, "live", "storage must be live");
  assert.match(String(storage.rootHash), /^0x[a-f0-9]{64}$/i, "storage root hash");
  assert.match(String(storage.txHash), /^0x[a-f0-9]{64}$/i, "storage tx hash");

  assert.equal(storageBundle.status, "live", "storage bundle must be live");
  assert.match(String(storageBundle.rootHash), /^0x[a-f0-9]{64}$/i, "storage bundle root hash");
  assert.match(String(storageBundle.txHash), /^0x[a-f0-9]{64}$/i, "storage bundle tx hash");
  assert.match(String(storageBundle.bundleHash), /^0x[a-f0-9]{64}$/i, "storage bundle hash");
  assert.deepEqual(storageBundle.items, [
    "player-snapshot",
    "draft-log",
    "match-transcript",
    "share-metadata",
    "proof-receipt",
  ], "storage bundle item list");

  assert.equal(storageReadback.status, "live", "storage readback must be live");
  assert.match(String(storageReadback.contentHash), /^0x[a-f0-9]{64}$/i, "storage readback content hash");
  assert.equal((storageReadback.checks as { proofMerkleRootMatches?: boolean }).proofMerkleRootMatches, true, "proof readback merkle root");
  assert.equal((storageReadback.checks as { proofRoomMatches?: boolean }).proofRoomMatches, true, "proof readback room");
  assert.equal((storageReadback.checks as { bundleMerkleRootMatches?: boolean }).bundleMerkleRootMatches, true, "bundle readback merkle root");
  assert.equal((storageReadback.checks as { bundleHashMatches?: boolean }).bundleHashMatches, true, "bundle readback content hash");
  assert.equal((storageReadback.checks as { bundleItemHashesMatch?: boolean }).bundleItemHashesMatch, true, "bundle readback item hashes");

  assert.equal(chain.status, "submitted", "chain result must be submitted");
  assert.match(String(chain.txHash), /^0x[a-f0-9]{64}$/i, "chain tx hash");
  assert.match(String(chain.storageUri), /^0g:\/\/storage\/0x[a-f0-9]{64}$/i, "chain storage URI");

  assert.equal(chainReadback.status, "live", "chain readback must be live");
  assert.equal((chainReadback.checks as { contractsHaveCode?: boolean }).contractsHaveCode, true, "chain contracts code");
  assert.equal((chainReadback.checks as { resultExists?: boolean }).resultExists, true, "result readback exists");
  assert.equal((chainReadback.checks as { resultStorageMatches?: boolean }).resultStorageMatches, true, "result storage readback");
  assert.equal((chainReadback.checks as { agentTokenExists?: boolean }).agentTokenExists, true, "agentic token exists");
  assert.equal((chainReadback.checks as { agentMetadataMatches?: boolean }).agentMetadataMatches, true, "agentic metadata readback");
  assert.equal((chainReadback.checks as { agentStorageMatches?: boolean }).agentStorageMatches, true, "agentic storage readback");

  assert.equal(chainEvents.status, "live", "chain event proof must be live");
  assert.equal((chainEvents.checks as { resultEventFound?: boolean }).resultEventFound, true, "result event found");
  assert.equal((chainEvents.checks as { resultRoomMatches?: boolean }).resultRoomMatches, true, "result event room");
  assert.equal((chainEvents.checks as { resultStorageMatches?: boolean }).resultStorageMatches, true, "result event storage");
  assert.equal((chainEvents.checks as { agentEventFound?: boolean }).agentEventFound, true, "agent event found");
  assert.equal((chainEvents.checks as { agentTokenMatches?: boolean }).agentTokenMatches, true, "agent event token");
  assert.equal((chainEvents.checks as { agentMetadataMatches?: boolean }).agentMetadataMatches, true, "agent event metadata");
  assert.equal((chainEvents.checks as { registryAgentEventsFound?: boolean }).registryAgentEventsFound, true, "registry agent events found");
  assert.equal((chainEvents.checks as { registryAgentTokensMatch?: boolean }).registryAgentTokensMatch, true, "registry agent token events");
  assert.equal((chainEvents.checks as { registryAgentMetadataMatches?: boolean }).registryAgentMetadataMatches, true, "registry agent metadata events");

  assert.equal(escrowReadiness.status, "live", "escrow readiness readback must be live");
  assert.match(String(escrowReadiness.contract), /^0x[a-f0-9]{40}$/i, "escrow readiness contract");
  assert.match(String(escrowReadiness.roomHash), /^0x[a-f0-9]{64}$/i, "escrow readiness room hash");
  assert.equal(escrowReadiness.requiredDeposits, "2", "escrow readiness requires two deposits");
  assert.equal(typeof escrowReadiness.canStart, "boolean", "escrow readiness canStart boolean");
  assert.equal((escrowReadiness.checks as { escrowHasCode?: boolean }).escrowHasCode, true, "escrow readiness contract code");
  assert.equal((escrowReadiness.checks as { canStartMatchesContractState?: boolean }).canStartMatchesContractState, true, "escrow readiness matches contract state");
  assert.equal((escrowReadiness.checks as { notStartReadyWithoutTwoDeposits?: boolean }).notStartReadyWithoutTwoDeposits, true, "escrow start gate before two deposits");

  assert.equal(browserWallet.status, "live", "browser wallet E2E proof must be live");
  assert.match(String(browserWallet.wallet), /^0x[a-f0-9]{40}$/i, "browser wallet address");
  assert.match(String(browserWallet.roomHash), /^0x[a-f0-9]{64}$/i, "browser wallet room hash");
  assert.match(String((browserWallet.transactions as { commit?: string }).commit), /^0x[a-f0-9]{64}$/i, "browser wallet commit tx");
  assert.match(String((browserWallet.transactions as { deposit?: string }).deposit), /^0x[a-f0-9]{64}$/i, "browser wallet deposit tx");
  assert.equal((browserWallet.checks as { commitTxSucceeded?: boolean }).commitTxSucceeded, true, "browser commit tx succeeded");
  assert.equal((browserWallet.checks as { commitEventFound?: boolean }).commitEventFound, true, "browser commit event found");
  assert.equal((browserWallet.checks as { commitEventLineupMatches?: boolean }).commitEventLineupMatches, true, "browser commit lineup event");
  assert.equal((browserWallet.checks as { commitmentExists?: boolean }).commitmentExists, true, "browser commitment state exists");
  assert.equal((browserWallet.checks as { depositTxSucceeded?: boolean }).depositTxSucceeded, true, "browser deposit tx succeeded");
  assert.equal((browserWallet.checks as { depositEventFound?: boolean }).depositEventFound, true, "browser deposit event found");
  assert.equal((browserWallet.checks as { depositEventAmountMatches?: boolean }).depositEventAmountMatches, true, "browser deposit amount event");
  assert.equal((browserWallet.checks as { hasDeposited?: boolean }).hasDeposited, true, "browser wallet has deposited state");
  assert.equal((browserWallet.checks as { canStartMatchesContractState?: boolean }).canStartMatchesContractState, true, "browser escrow start state");

  assert.equal(wagerSettlement.status, "settled", "wager settlement proof must be settled");
  assert.match(String(wagerSettlement.contract), /^0x[a-f0-9]{40}$/i, "wager settlement contract");
  assert.match(String((wagerSettlement.transactions as { secondDeposit?: string }).secondDeposit), /^0x[a-f0-9]{64}$/i, "second deposit tx");
  assert.match(String((wagerSettlement.transactions as { settle?: string }).settle), /^0x[a-f0-9]{64}$/i, "settle tx");
  assert.equal((wagerSettlement.checks as { secondDepositTxSucceeded?: boolean }).secondDepositTxSucceeded, true, "second deposit tx succeeded");
  assert.equal((wagerSettlement.checks as { secondDepositEventFound?: boolean }).secondDepositEventFound, true, "second deposit event found");
  assert.equal((wagerSettlement.checks as { escrowWasStartReadyBeforeSettle?: boolean }).escrowWasStartReadyBeforeSettle, true, "escrow ready before settlement");
  assert.equal((wagerSettlement.checks as { settleTxSucceeded?: boolean }).settleTxSucceeded, true, "settle tx succeeded");
  assert.equal((wagerSettlement.checks as { settledEventFound?: boolean }).settledEventFound, true, "settled event found");
  assert.equal((wagerSettlement.checks as { settledWinnerMatches?: boolean }).settledWinnerMatches, true, "settled winner matches");
  assert.equal((wagerSettlement.checks as { winnerReceivedPayout?: boolean }).winnerReceivedPayout, true, "winner payout received");
  assert.equal((wagerSettlement.checks as { canStartClosedAfterSettle?: boolean }).canStartClosedAfterSettle, true, "canStart closed after settlement");
}
