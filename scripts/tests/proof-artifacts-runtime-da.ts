import assert from "node:assert/strict";
import type { ProofArtifact } from "./proof-artifacts.ts";

type RuntimeDaArtifacts = {
  compute: ProofArtifact;
  computeBroker: ProofArtifact;
  computeRuntime: ProofArtifact;
  infraDiagnostics: ProofArtifact;
  runtimeFinalize: ProofArtifact;
  cloudflareTunnel: ProofArtifact;
  da: ProofArtifact;
  daPayload: ProofArtifact;
  daStack: ProofArtifact;
  daSidecar: ProofArtifact;
};

export function assertRuntimeDaArtifacts(artifacts: RuntimeDaArtifacts) {
  const {
    compute,
    computeBroker,
    computeRuntime,
    infraDiagnostics,
    runtimeFinalize,
    cloudflareTunnel,
    da,
    daPayload,
    daStack,
    daSidecar,
  } = artifacts;

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

  assert.ok(computeBroker.status === "ready" || computeBroker.status === "blocked", "compute broker diagnostics must be ready or honestly blocked");
  assert.equal((computeBroker.sdk as { installed?: boolean }).installed, true, "compute broker SDK must be installed");
  assert.equal((computeBroker.sdk as { package?: string }).package, "@0gfoundation/0g-compute-ts-sdk", "compute broker SDK package");
  assert.match(String((computeBroker.wallet as { address?: string | null }).address), /^0x[a-f0-9]{40}$/i, "compute broker wallet");
  assert.equal(typeof (computeBroker.wallet as { canFundMinimumLedger?: boolean }).canFundMinimumLedger, "boolean", "compute broker funding truth");
  assert.equal(typeof (computeBroker.checks as { brokerInitialized?: boolean }).brokerInitialized, "boolean", "compute broker initialization truth");
  assert.equal(typeof (computeBroker.checks as { servicesListed?: boolean }).servicesListed, "boolean", "compute broker service listing truth");
  assert.match(String(computeBroker.reason), /0G Compute|broker|ledger|provider|wallet|fund/i, "compute broker reason");

  assert.ok(
    computeRuntime.status === "live" || computeRuntime.status === "fallback" || computeRuntime.status === "blocked",
    "runtime compute must be live, fallback, or honestly blocked",
  );
  assert.equal((computeRuntime.output as { schema?: string }).schema, "0g-world-cup-compute-output-v1", "runtime compute output schema");
  if (computeRuntime.status === "live") {
    assert.equal((computeRuntime.output as { authority?: string }).authority, "compute", "runtime compute authority");
    assert.match(String((computeRuntime.output as { receipt?: { path?: string } }).receipt?.path), /router|broker/, "runtime compute path");
  } else if (computeRuntime.status === "fallback") {
    assert.equal((computeRuntime.output as { authority?: string }).authority, "external-ai-fallback", "runtime fallback authority");
    assert.match(String((computeRuntime.output as { receipt?: { path?: string } }).receipt?.path), /sarvam/, "runtime fallback path");
    assert.match(String(computeRuntime.reason), /0G Compute|Router|broker|ledger|balance|fund/i, "runtime fallback must retain 0G blocker reason");
  } else {
    assert.equal((computeRuntime.output as { authority?: string }).authority, "blocked", "runtime compute blocked authority");
    assert.match(String(computeRuntime.reason), /Router|broker|ledger|balance|fund|0G Compute|Sarvam/i, "runtime compute blocker");
  }

  assert.ok(infraDiagnostics.status === "live" || infraDiagnostics.status === "blocked", "infra diagnostics must be live or honestly blocked");
  assert.match(String((infraDiagnostics.compute as { endpoint?: string }).endpoint), /^https:\/\/.+/i, "infra compute endpoint");
  assert.equal(typeof (infraDiagnostics.compute as { hasKey?: boolean }).hasKey, "boolean", "infra compute key truth");
  assert.equal(((infraDiagnostics.compute as { probes?: { model?: string }[] }).probes ?? []).some((probe) => probe.model === "glm-5.1"), true, "infra diagnostics must probe glm-5.1");
  assert.equal(((infraDiagnostics.compute as { probes?: { model?: string }[] }).probes ?? []).some((probe) => probe.model === "glm-5.2"), true, "infra diagnostics must probe glm-5.2");
  assert.equal(typeof (infraDiagnostics.da as { sidecar?: { reachable?: boolean } }).sidecar?.reachable, "boolean", "infra diagnostics must report local DA sidecar reachability");
  if ((infraDiagnostics.da as { sidecar?: { reachable?: boolean } }).sidecar?.reachable === false) {
    assert.match(String((infraDiagnostics.da as { sidecar?: { reason?: string } }).sidecar?.reason), /fetch|connect|refused|timeout/i, "infra diagnostics must explain unreachable DA sidecar");
  }
  assert.equal(typeof (infraDiagnostics.da as { daEntranceHasCode?: boolean }).daEntranceHasCode, "boolean", "infra diagnostics must report DAEntrance bytecode truth");
  assert.match(String((infraDiagnostics.da as { daEntrance?: { address?: string } }).daEntrance?.address), /^0x[a-f0-9]{40}$/i, "infra diagnostics must report DAEntrance address");
  assert.equal(Array.isArray((infraDiagnostics.da as { daEntranceCandidates?: unknown[] }).daEntranceCandidates), true, "infra diagnostics must report documented DAEntrance candidates");
  assert.equal(typeof (infraDiagnostics.da as { daClientListening?: boolean }).daClientListening, "boolean", "infra diagnostics must report local DA client truth");

  assert.ok(runtimeFinalize.status === "live" || runtimeFinalize.status === "blocked", "runtime finalization must be live or honestly blocked");
  assert.equal(runtimeFinalize.schema, "0g-world-cup-runtime-finalize-proof-v1", "runtime finalization proof schema");
  if (runtimeFinalize.status === "blocked") {
    assert.equal(runtimeFinalize.error, "FINALIZE_REQUIRES_COMPUTE_RESULT", "runtime finalization must reject deterministic results");
    assert.match(String(runtimeFinalize.reason), /0G Compute-authoritative/i, "runtime finalization blocker reason");
    assert.equal((runtimeFinalize.checks as { rejectedDeterministicResult?: boolean }).rejectedDeterministicResult, true, "runtime finalization deterministic rejection");
    assert.equal((runtimeFinalize.checks as { storageSkipped?: boolean }).storageSkipped, true, "runtime finalization skips storage when result is not compute-authoritative");
    assert.equal((runtimeFinalize.checks as { chainSkipped?: boolean }).chainSkipped, true, "runtime finalization skips chain when result is not compute-authoritative");
  } else {
    assert.equal(((runtimeFinalize.storage as Record<string, unknown> | undefined)?.status), "live", "runtime finalization live storage");
    assert.ok(["submitted", "existing"].includes(String((runtimeFinalize.chain as Record<string, unknown> | undefined)?.status)), "runtime finalization live chain");
  }

  assert.equal(da.blobReady, true, "DA blob must be byte-ready");
  assert.match(String(da.blobHash), /^0x[a-f0-9]{64}$/i, "DA blob hash");
  for (const [kind, label] of [
    ["escrow-readiness", "escrow readiness"],
    ["browser-wallet-e2e", "browser wallet E2E"],
    ["wager-settlement", "wager settlement"],
    ["infra-diagnostics", "infra diagnostics"],
    ["compute-broker", "direct compute broker"],
    ["compute-runtime", "runtime compute"],
    ["runtime-finalize", "runtime finalization"],
    ["cloudflare-tunnel", "Cloudflare tunnel readiness"],
    ["da-stack-readiness", "DA stack readiness"],
    ["agentic-registry", "Agentic ID registry"],
    ["agent-manager-readback", "Agent Manager readback"],
  ]) {
    assert.equal((daPayload.entries as { kind?: string }[]).some((entry) => entry.kind === kind), true, `DA batch must include ${label} evidence`);
  }
  assert.equal(
    (daPayload.entries as { kind?: string; value?: { schema?: string } }[]).some(
      (entry) =>
        entry.kind === "integration-matrix" &&
        entry.value?.schema === "0g-world-cup-integration-matrix-v1",
    ),
    true,
    "DA batch must include integration matrix evidence",
  );

  assert.equal(cloudflareTunnel.schema, "0g-world-cup-cloudflare-tunnel-proof-v1", "Cloudflare tunnel proof schema");
  assert.ok(cloudflareTunnel.status === "configured" || cloudflareTunnel.status === "local-only", "Cloudflare tunnel proof must be configured or local-only");
  assert.equal(typeof (cloudflareTunnel.checks as { sidecarReachable?: boolean }).sidecarReachable, "boolean", "Cloudflare tunnel proof sidecar reachability");
  assert.equal(typeof (cloudflareTunnel.checks as { cloudflaredInstalled?: boolean }).cloudflaredInstalled, "boolean", "Cloudflare tunnel proof cloudflared truth");
  assert.equal((cloudflareTunnel.costModel as { workersPaidMinimumUsdPerMonth?: number }).workersPaidMinimumUsdPerMonth, 5, "Cloudflare tunnel proof cost model");
  assert.match(String(cloudflareTunnel.reason), /tunnel|localhost|Cloudflare|public/i, "Cloudflare tunnel proof reason");

  assert.ok(daStack.status === "ready" || daStack.status === "blocked", "DA stack readiness must be ready or honestly blocked");
  assert.equal((daStack.officialDocs as { maxBlobBytes?: number }).maxBlobBytes, 32505852, "DA stack max blob bytes must match 0G docs");
  assert.match(String((daStack.officialDocs as { testnetOverviewDaEntrance?: string }).testnetOverviewDaEntrance), /^0x[a-f0-9]{40}$/i, "DA stack must record Testnet overview DAEntrance");
  assert.match(String((daStack.officialDocs as { integrationGuideDaEntrance?: string }).integrationGuideDaEntrance), /^0x[a-f0-9]{40}$/i, "DA stack must record DA integration guide DAEntrance");
  assert.equal(
    ((daStack.endpoints as { daEntranceCandidates?: { address?: string; hasCode?: boolean; codeBytes?: number }[] }).daEntranceCandidates ?? []).length >= 2,
    true,
    "DA stack must probe documented DAEntrance candidates",
  );
  assert.equal(typeof (daStack.endpoints as { anyDocumentedDaEntranceHasCode?: boolean }).anyDocumentedDaEntranceHasCode, "boolean", "DA stack must report if any documented DAEntrance has bytecode");
  assert.equal(typeof (daStack.checks as { dockerInstalled?: boolean }).dockerInstalled, "boolean", "DA stack docker installed truth");
  assert.equal(typeof (daStack.checks as { daClientListening?: boolean }).daClientListening, "boolean", "DA stack client listening truth");
  assert.equal(typeof (daStack.checks as { encoderListening?: boolean }).encoderListening, "boolean", "DA stack encoder listening truth");
  assert.equal(typeof (daStack.checks as { retrieverListening?: boolean }).retrieverListening, "boolean", "DA stack retriever listening truth");
  assert.match(String(daStack.reason), /DA|Docker|Client|Encoder|Retriever|51001/i, "DA stack readiness reason");

  assert.equal(daSidecar.blobReady, true, "DA sidecar blob must be byte-ready");
  assert.match(String(daSidecar.blobHash), /^0x[a-f0-9]{64}$/i, "DA sidecar blob hash");
  assert.equal(daSidecar.blobHash, da.blobHash, "DA sidecar must submit the exact byte-ready DA batch");
  assert.equal(daSidecar.expectedBlobHash, da.blobHash, "DA sidecar expected hash must match DA batch");
  assert.ok(daSidecar.status === "submitted" || daSidecar.status === "live" || daSidecar.status === "blocked", "DA sidecar must be submitted, live, or honestly blocked");
  if (daSidecar.status === "blocked") {
    assert.match(String(daSidecar.reason), /sidecar|DA Client|OG_DA_CLIENT_GRPC_URL|Encoder|Retriever|reachable|DAEntrance|bytecode|RPC/i, "DA sidecar blocker reason");
  } else {
    assert.match(String(daSidecar.requestId), /^0x[a-f0-9]+$/i, "DA sidecar request id");
  }
}
