import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

type Artifact = Record<string, unknown> & {
  reason?: string;
  rootHash?: string;
  txHash?: string;
  blobHash?: string;
  bundleHash?: string;
  contentHash?: string;
  encryptedMetadataHash?: string;
  mintTxHash?: string;
};

function readArtifact(name: string): Artifact {
  return JSON.parse(readFileSync(`public/proof-artifacts/${name}`, "utf8")) as Artifact;
}

function textValue(value: unknown) {
  return String(value ?? "");
}

test("proof page renders live 0G artifacts", async ({ page }) => {
  const storage = readArtifact("storage-latest.json");
  const dataPipeline = readArtifact("data-pipeline-latest.json");
  const integrationMatrix = readArtifact("integration-matrix-latest.json");
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
  const runtimeFinalize = readArtifact("runtime-finalize-latest.json");
  const cloudflareTunnel = readArtifact("cloudflare-tunnel-latest.json");
  const da = readArtifact("da-latest.json");
  const daStack = readArtifact("da-stack-readiness-latest.json");
  const daSidecar = readArtifact("da-sidecar-latest.json");
  const agentic = readArtifact("agentic-id-latest.json");
  const agenticRegistry = readArtifact("agentic-registry-latest.json");
  const agenticReadback = readArtifact("agentic-id-readback-latest.json");
  const agentManagerReadback = readArtifact("agent-manager-readback-latest.json");

  await page.goto("/proof/room-human-vs-agent-chain-1782223853");
  await expect(page.getByTestId("zero-g-proof-stack")).toBeVisible();
  await expect(page.getByTestId("zero-g-proof-stack")).toContainText("Local receipt and 0G hooks");
  await expect(page.getByTestId("zero-g-proof-stack")).toContainText("not the live 0G completion signal");
  await expect(page.getByTestId("zero-g-proof-stack")).toContainText("live 0G Storage proof is shown in the artifact matrix");
  await expect(page.getByTestId("zero-g-proof-stack")).toContainText("live DA submission status is shown in the artifact matrix");
  await expect(page.getByTestId("proof-wallet-state")).toBeVisible();
  const artifacts = page.getByTestId("zero-g-live-artifacts");
  await expect(artifacts).toBeVisible();
  await expect(artifacts.getByRole("heading", { exact: true, name: "0G Player Snapshot" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(playerSnapshot.rootHash));
  await expect(artifacts).toContainText("8379 players");
  await expect(artifacts.getByRole("heading", { name: "Player Data Pipeline" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(dataPipeline.pipelineHash));
  await expect(artifacts).toContainText("selected source");
  await expect(artifacts).toContainText("historical 8379 players");
  await expect(page.getByTestId("integration-summary")).toBeVisible();
  await expect(page.getByTestId("integration-counts")).toContainText(textValue((integrationMatrix.counts as Record<string, unknown>).verified));
  await expect(page.getByTestId("integration-counts")).toContainText(textValue((integrationMatrix.counts as Record<string, unknown>)["external-blocked"]));
  await expect(page.getByTestId("integration-blockers")).toContainText("Direct 0G Compute broker");
  await expect(page.getByTestId("integration-blockers")).toContainText("0G DA sidecar submit");
  await expect(artifacts.getByRole("heading", { name: "0G Integration Matrix" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(integrationMatrix.coverageHash));
  const computeRouterEntry = (integrationMatrix.coverage as Record<string, unknown>[]).find((entry) => entry.id === "compute-router");
  await expect(artifacts).toContainText(`compute-router / compute / ${textValue(computeRouterEntry?.status)}`);
  await expect(artifacts).toContainText("compute-broker / compute / external-blocked");
  await expect(artifacts).toContainText("runtime-finalization-guard / compute / verified");
  await expect(artifacts).toContainText("data-pipeline-import-publish / data / verified");
  await expect(artifacts).toContainText("cloudflare-tunnel-bridge / ui / local-only");
  await expect(artifacts).toContainText("agent-manager-live-readback");
  await expect(artifacts.getByRole("heading", { exact: true, name: "0G Storage" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(storage.rootHash));
  await expect(artifacts.getByRole("heading", { name: "0G Storage Bundle" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(storageBundle.bundleHash));
  await expect(artifacts).toContainText("player-snapshot / draft-log / match-transcript / share-metadata / proof-receipt");
  await expect(artifacts.getByRole("heading", { name: "0G Storage Readback" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(storageReadback.contentHash));
  await expect(artifacts).toContainText("proofMerkleRootMatches:ok");
  await expect(artifacts).toContainText("bundleItemHashesMatch:ok");
  await expect(artifacts.getByRole("heading", { name: "0G Results Contract" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(chain.txHash));
  await expect(artifacts.getByRole("heading", { name: "0G Chain Readback" })).toBeVisible();
  await expect(artifacts).toContainText(`block ${textValue(chainReadback.blockNumber)}`);
  await expect(artifacts).toContainText("contractsHaveCode:ok");
  await expect(artifacts.getByRole("heading", { name: "0G Chain Events" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(chainEvents.transactions && (chainEvents.transactions as Record<string, unknown>).result));
  await expect(artifacts).toContainText("resultEventFound:ok");
  await expect(artifacts).toContainText("agentEventFound:ok");
  await expect(artifacts).toContainText("registryAgentEventsFound:ok");
  await expect(artifacts.getByRole("heading", { name: "0G Escrow Readiness" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(escrowReadiness.contract));
  await expect(artifacts).toContainText(`canStart ${textValue(escrowReadiness.canStart)}`);
  await expect(artifacts).toContainText("requiresTwoDeposits:ok");
  await expect(artifacts.getByRole("heading", { name: "Browser Wallet E2E" })).toBeVisible();
  await expect(artifacts).toContainText(textValue((browserWallet.transactions as Record<string, unknown>).commit));
  await expect(artifacts).toContainText(textValue((browserWallet.transactions as Record<string, unknown>).deposit));
  await expect(artifacts).toContainText("commitEventFound:ok");
  await expect(artifacts).toContainText("depositEventFound:ok");
  await expect(artifacts).toContainText("hasDeposited:ok");
  await expect(artifacts.getByRole("heading", { name: "0G Wager Settlement" })).toBeVisible();
  await expect(artifacts).toContainText(textValue((wagerSettlement.transactions as Record<string, unknown>).secondDeposit));
  await expect(artifacts).toContainText(textValue((wagerSettlement.transactions as Record<string, unknown>).settle));
  await expect(artifacts).toContainText("settledEventFound:ok");
  await expect(artifacts).toContainText("winnerReceivedPayout:ok");
  await expect(artifacts).toContainText("canStartClosedAfterSettle:ok");
  await expect(artifacts.getByRole("heading", { name: "0G Compute Router" })).toBeVisible();
  if (compute.reason) await expect(artifacts).toContainText(compute.reason);
  await expect(artifacts.getByRole("heading", { name: "0G Compute Broker" })).toBeVisible();
  await expect(artifacts).toContainText(textValue((computeBroker.wallet as Record<string, unknown>).address));
  await expect(artifacts).toContainText(`can fund ${textValue((computeBroker.wallet as Record<string, unknown>).canFundMinimumLedger)}`);
  if (computeBroker.reason) await expect(artifacts).toContainText(computeBroker.reason);
  await expect(artifacts.getByRole("heading", { name: "0G Runtime Compute" })).toBeVisible();
  await expect(artifacts).toContainText(`runtime compute ${textValue((computeRuntime.output as Record<string, unknown>).authority)}`);
  if (computeRuntime.reason) await expect(artifacts).toContainText(computeRuntime.reason);
  await expect(artifacts.getByRole("heading", { name: "0G Infra Diagnostics" })).toBeVisible();
  await expect(artifacts).toContainText(textValue((infraDiagnostics.compute as Record<string, unknown>).endpoint));
  await expect(artifacts).toContainText("glm-5.1 status 402 insufficient_balance");
  await expect(artifacts).toContainText("glm-5.2 status 402 insufficient_balance");
  await expect(artifacts).toContainText(
    `51001 ${textValue((infraDiagnostics.da as Record<string, unknown>).daClientListening)}`,
  );
  await expect(artifacts).toContainText(
    `entrance code ${textValue((infraDiagnostics.da as Record<string, unknown>).daEntranceHasCode)}`,
  );
  const daEntrance = (infraDiagnostics.da as { daEntrance?: Record<string, unknown> }).daEntrance;
  if (daEntrance?.address) await expect(artifacts).toContainText(textValue(daEntrance.address));
  await expect(artifacts.getByRole("heading", { name: "Runtime Room Finalization" })).toBeVisible();
  if (runtimeFinalize.reason) await expect(artifacts).toContainText(runtimeFinalize.reason);
  await expect(artifacts).toContainText("rejectedDeterministicResult:ok");
  await expect(artifacts).toContainText("storageSkipped:ok");
  await expect(artifacts).toContainText("chainSkipped:ok");
  await expect(artifacts.getByRole("heading", { name: "Cloudflare Tunnel" })).toBeVisible();
  await expect(artifacts).toContainText(`public ${textValue((cloudflareTunnel.tunnel as Record<string, unknown>).configuredPublicSidecar)}`);
  await expect(artifacts).toContainText("cloudflare paid min $5");
  if (cloudflareTunnel.reason) await expect(artifacts).toContainText(cloudflareTunnel.reason);
  await expect(artifacts.getByRole("heading", { name: "0G DA Batch" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(da.blobHash));
  if (da.reason) await expect(artifacts).toContainText(da.reason);
  await expect(artifacts.getByRole("heading", { name: "0G DA Stack Readiness" })).toBeVisible();
  await expect(artifacts).toContainText(`docker installed ${textValue((daStack.docker as Record<string, unknown>).installed)}`);
  await expect(artifacts).toContainText("da stack grpc");
  if (daStack.reason) await expect(artifacts).toContainText(daStack.reason);
  await expect(artifacts.getByRole("heading", { name: "0G DA Sidecar" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(daSidecar.blobHash));
  if (daSidecar.reason) await expect(artifacts).toContainText(daSidecar.reason);
  await expect(artifacts.getByRole("heading", { exact: true, name: "Agentic ID" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(agentic.encryptedMetadataHash));
  if (agentic.mintTxHash) await expect(artifacts).toContainText(agentic.mintTxHash);
  await expect(artifacts.getByRole("heading", { name: "Agentic ID Registry" })).toBeVisible();
  await expect(artifacts).toContainText(`${textValue(agenticRegistry.count)} agents`);
  await expect(artifacts).toContainText("agent-zero-nine");
  await expect(artifacts).toContainText("agent-keepernet");
  await expect(artifacts.getByRole("heading", { name: "Agentic ID Readback" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(agenticReadback.contentHash));
  await expect(artifacts).toContainText("encryptedMetadataHashMatches:ok");
  await expect(artifacts).toContainText("decryptedAgentMatches:ok");
  await expect(artifacts).toContainText("everyAgentDownloaded:ok");
  await expect(artifacts).toContainText("everyDecryptedAgentMatches:ok");
  await expect(artifacts.getByRole("heading", { name: "Agent Manager Readback" })).toBeVisible();
  await expect(artifacts).toContainText(textValue(agentManagerReadback.readbackHash));
  await expect(artifacts).toContainText("everyAgentHasChainEvent:ok");
  await expect(artifacts).toContainText("allAgentTokenReadback:ok");
  await expect(artifacts).toContainText("allAgentMetadataReadback:ok");
});

test("agents page renders live Agentic ID readback", async ({ page }) => {
  const agentManagerReadback = readArtifact("agent-manager-readback-latest.json");
  await page.goto("/agents");
  const panel = page.getByTestId("agent-manager-readback");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("live");
  await expect(panel).toContainText(textValue(agentManagerReadback.readbackHash));
  await expect(panel).toContainText("agent-zero-nine / token 2");
  await expect(panel).toContainText("agent-keepernet / token 3");
  await expect(panel).toContainText("everyAgentHasChainEvent:ok");
  await expect(panel).toContainText("allAgentTokenReadback:ok");
  await expect(panel).toContainText("allAgentMetadataReadback:ok");
});

test("proof chain actions are wallet-gated before signing", async ({ page }) => {
  await page.goto("/proof/room-testnet-wager-1v1-e2e");
  await expect(page.getByTestId("proof-wallet-state")).toContainText(/Wallet actions|Connect a wallet|Privy/i);
  await expect(page.getByRole("button", { name: "Commit lineup" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Deposit 0.01 0G" })).toBeDisabled();
});

test("simulation does not generate proof before kickoff", async ({ page }) => {
  const computeBroker = readArtifact("compute-broker-latest.json");
  const computeRuntime = readArtifact("compute-runtime-latest.json");
  await page.goto("/simulate/room-human-vs-agent-e2e");
  await expect(page.getByTestId("zero-g-runtime-gate")).toBeVisible();
  await expect(page.getByTestId("zero-g-runtime-gate")).toContainText("Compute-authoritative kickoff");
  await expect(page.getByTestId("zero-g-runtime-gate")).toContainText(textValue((computeBroker.wallet as Record<string, unknown>).address));
  await expect(page.getByTestId("zero-g-runtime-gate")).toContainText(textValue((computeBroker.wallet as Record<string, unknown>).requiredTopUpOg));
  if (computeRuntime.reason) await expect(page.getByTestId("runtime-gate-blocker")).toContainText(computeRuntime.reason);
  await expect(page.getByTestId("pending-simulation")).toBeVisible();
  await expect(page.getByTestId("zero-g-proof-stack")).toHaveCount(0);
  await page.getByTestId("start-simulation").click();
  await expect(page.getByTestId("zero-g-proof-stack").or(page.getByTestId("compute-error"))).toBeVisible({ timeout: 25_000 });
  if (await page.getByTestId("compute-error").count()) {
    await expect(page.getByTestId("compute-error")).toContainText(/0G Compute|Router|balance|blocked/i);
    await expect(page.getByTestId("zero-g-proof-stack")).toHaveCount(0);
  } else {
    await expect(page.getByTestId("simulation-receipt")).toBeVisible();
  }
});
