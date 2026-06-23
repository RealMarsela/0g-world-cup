import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readArtifact(name: string) {
  return JSON.parse(readFileSync(`public/proof-artifacts/${name}`, "utf8")) as Record<string, unknown>;
}

const storage = readArtifact("storage-latest.json");
const playerSnapshot = readArtifact("player-snapshot-latest.json");
const storageBundle = readArtifact("storage-bundle-latest.json");
const storageReadback = readArtifact("storage-readback-latest.json");
const chain = readArtifact("chain-result-latest.json");
const chainReadback = readArtifact("chain-readback-latest.json");
const chainEvents = readArtifact("chain-events-latest.json");
const escrowReadiness = readArtifact("escrow-readiness-latest.json");
const browserWallet = readArtifact("browser-wallet-latest.json");
const wagerSettlement = readArtifact("wager-settlement-latest.json");
const compute = readArtifact("compute-latest.json");
const computeBroker = readArtifact("compute-broker-latest.json");
const computeRuntime = readArtifact("compute-runtime-latest.json");
const infraDiagnostics = readArtifact("infra-diagnostics-latest.json");
const da = readArtifact("da-latest.json");
const daPayload = readArtifact("da-batch-payload-latest.json");
const daStack = readArtifact("da-stack-readiness-latest.json");
const daSidecar = readArtifact("da-sidecar-latest.json");
const agentic = readArtifact("agentic-id-latest.json");
const agenticRegistry = readArtifact("agentic-registry-latest.json");
const agenticReadback = readArtifact("agentic-id-readback-latest.json");

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

if (compute.status === "live") {
  assert.ok(compute.response, "live compute response required");
  assert.match(String(compute.model), /^[\w./-]+$/i, "live compute model");
  assert.match(
    String(((compute.response as Record<string, unknown>).x_0g_trace as { provider?: string } | undefined)?.provider),
    /^0x[a-f0-9]{40}$/i,
    "live compute provider",
  );
} else {
  assert.equal(compute.status, "blocked", "compute must be live or honestly blocked");
  assert.match(String(compute.reason), /Missing OG_COMPUTE_API_KEY|0G Compute|Router|provider|balance/i, "compute blocker reason");
  assert.equal(typeof (compute.env as { hasComputeKey?: boolean }).hasComputeKey, "boolean", "compute key truth");
}

assert.ok(
  computeBroker.status === "ready" || computeBroker.status === "blocked",
  "compute broker diagnostics must be ready or honestly blocked",
);
assert.equal(
  (computeBroker.sdk as { installed?: boolean }).installed,
  true,
  "compute broker SDK must be installed",
);
assert.equal(
  (computeBroker.sdk as { package?: string }).package,
  "@0gfoundation/0g-compute-ts-sdk",
  "compute broker SDK package",
);
assert.match(String((computeBroker.wallet as { address?: string | null }).address), /^0x[a-f0-9]{40}$/i, "compute broker wallet");
assert.equal(
  typeof (computeBroker.wallet as { canFundMinimumLedger?: boolean }).canFundMinimumLedger,
  "boolean",
  "compute broker funding truth",
);
assert.equal(
  typeof (computeBroker.checks as { brokerInitialized?: boolean }).brokerInitialized,
  "boolean",
  "compute broker initialization truth",
);
assert.equal(
  typeof (computeBroker.checks as { servicesListed?: boolean }).servicesListed,
  "boolean",
  "compute broker service listing truth",
);
assert.match(String(computeBroker.reason), /0G Compute|broker|ledger|provider|wallet|fund/i, "compute broker reason");

assert.ok(
  computeRuntime.status === "live" || computeRuntime.status === "blocked",
  "runtime compute must be live or honestly blocked",
);
assert.equal(
  (computeRuntime.output as { schema?: string }).schema,
  "0g-world-cup-compute-output-v1",
  "runtime compute output schema",
);
if (computeRuntime.status === "live") {
  assert.equal((computeRuntime.output as { authority?: string }).authority, "compute", "runtime compute authority");
  assert.match(
    String((computeRuntime.output as { receipt?: { path?: string } }).receipt?.path),
    /router|broker/,
    "runtime compute path",
  );
} else {
  assert.equal((computeRuntime.output as { authority?: string }).authority, "blocked", "runtime compute blocked authority");
  assert.match(String(computeRuntime.reason), /Router|broker|ledger|balance|fund|0G Compute/i, "runtime compute blocker");
}

assert.ok(
  infraDiagnostics.status === "live" || infraDiagnostics.status === "blocked",
  "infra diagnostics must be live or honestly blocked",
);
assert.match(String((infraDiagnostics.compute as { endpoint?: string }).endpoint), /^https:\/\/.+/i, "infra compute endpoint");
assert.equal(typeof (infraDiagnostics.compute as { hasKey?: boolean }).hasKey, "boolean", "infra compute key truth");
assert.equal(
  ((infraDiagnostics.compute as { probes?: { model?: string }[] }).probes ?? []).some((probe) => probe.model === "glm-5.1"),
  true,
  "infra diagnostics must probe glm-5.1",
);
assert.equal(
  ((infraDiagnostics.compute as { probes?: { model?: string }[] }).probes ?? []).some((probe) => probe.model === "glm-5.2"),
  true,
  "infra diagnostics must probe glm-5.2",
);
assert.equal(
  (infraDiagnostics.da as { sidecar?: { reachable?: boolean } }).sidecar?.reachable,
  true,
  "infra diagnostics must reach local DA sidecar",
);
assert.equal(
  (infraDiagnostics.da as { daClientListening?: boolean }).daClientListening,
  false,
  "infra diagnostics must prove missing local DA client",
);

assert.equal(da.blobReady, true, "DA blob must be byte-ready");
assert.match(String(da.blobHash), /^0x[a-f0-9]{64}$/i, "DA blob hash");
assert.equal(
  (daPayload.entries as { kind?: string }[]).some((entry) => entry.kind === "escrow-readiness"),
  true,
  "DA batch must include escrow readiness evidence",
);
assert.equal(
  (daPayload.entries as { kind?: string }[]).some((entry) => entry.kind === "browser-wallet-e2e"),
  true,
  "DA batch must include browser wallet E2E evidence",
);
assert.equal(
  (daPayload.entries as { kind?: string }[]).some((entry) => entry.kind === "wager-settlement"),
  true,
  "DA batch must include wager settlement evidence",
);
assert.equal(
  (daPayload.entries as { kind?: string }[]).some((entry) => entry.kind === "infra-diagnostics"),
  true,
  "DA batch must include infra diagnostics evidence",
);
assert.equal(
  (daPayload.entries as { kind?: string }[]).some((entry) => entry.kind === "compute-broker"),
  true,
  "DA batch must include direct compute broker evidence",
);
assert.equal(
  (daPayload.entries as { kind?: string }[]).some((entry) => entry.kind === "compute-runtime"),
  true,
  "DA batch must include runtime compute evidence",
);
assert.equal(
  (daPayload.entries as { kind?: string }[]).some((entry) => entry.kind === "da-stack-readiness"),
  true,
  "DA batch must include DA stack readiness evidence",
);

assert.ok(
  daStack.status === "ready" || daStack.status === "blocked",
  "DA stack readiness must be ready or honestly blocked",
);
assert.equal(
  (daStack.officialDocs as { maxBlobBytes?: number }).maxBlobBytes,
  32505852,
  "DA stack max blob bytes must match 0G docs",
);
assert.equal(
  typeof (daStack.checks as { dockerInstalled?: boolean }).dockerInstalled,
  "boolean",
  "DA stack docker installed truth",
);
assert.equal(
  typeof (daStack.checks as { daClientListening?: boolean }).daClientListening,
  "boolean",
  "DA stack client listening truth",
);
assert.equal(
  typeof (daStack.checks as { encoderListening?: boolean }).encoderListening,
  "boolean",
  "DA stack encoder listening truth",
);
assert.equal(
  typeof (daStack.checks as { retrieverListening?: boolean }).retrieverListening,
  "boolean",
  "DA stack retriever listening truth",
);
assert.match(String(daStack.reason), /DA|Docker|Client|Encoder|Retriever|51001/i, "DA stack readiness reason");

assert.equal(daSidecar.blobReady, true, "DA sidecar blob must be byte-ready");
assert.match(String(daSidecar.blobHash), /^0x[a-f0-9]{64}$/i, "DA sidecar blob hash");
assert.equal(daSidecar.blobHash, da.blobHash, "DA sidecar must submit the exact byte-ready DA batch");
assert.equal(daSidecar.expectedBlobHash, da.blobHash, "DA sidecar expected hash must match DA batch");
assert.ok(
  daSidecar.status === "submitted" || daSidecar.status === "live" || daSidecar.status === "blocked",
  "DA sidecar must be submitted, live, or honestly blocked",
);
if (daSidecar.status === "blocked") {
  assert.match(String(daSidecar.reason), /sidecar|DA Client|OG_DA_CLIENT_GRPC_URL|Encoder|Retriever|reachable/i, "DA sidecar blocker reason");
} else {
  assert.match(String(daSidecar.requestId), /^0x[a-f0-9]+$/i, "DA sidecar request id");
}

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

console.log("proof artifacts ok: player snapshot, storage, chain, compute, DA, sidecar, agentic registry");
