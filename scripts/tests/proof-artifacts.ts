import { readFileSync } from "node:fs";
import { assertDataChainArtifacts } from "./proof-artifacts-data-chain.ts";
import { assertRuntimeDaArtifacts } from "./proof-artifacts-runtime-da.ts";
import { assertAgenticArtifacts } from "./proof-artifacts-agentic.ts";

export type ProofArtifact = Record<string, unknown>;

function readArtifact(name: string) {
  return JSON.parse(readFileSync(`public/proof-artifacts/${name}`, "utf8")) as ProofArtifact;
}

const artifacts = {
  dataPipeline: readArtifact("data-pipeline-latest.json"),
  storage: readArtifact("storage-latest.json"),
  integrationMatrix: readArtifact("integration-matrix-latest.json"),
  playerSnapshot: readArtifact("player-snapshot-latest.json"),
  storageBundle: readArtifact("storage-bundle-latest.json"),
  storageReadback: readArtifact("storage-readback-latest.json"),
  chain: readArtifact("chain-result-latest.json"),
  chainReadback: readArtifact("chain-readback-latest.json"),
  chainEvents: readArtifact("chain-events-latest.json"),
  escrowReadiness: readArtifact("escrow-readiness-latest.json"),
  browserWallet: readArtifact("browser-wallet-latest.json"),
  wagerSettlement: readArtifact("wager-settlement-latest.json"),
  compute: readArtifact("compute-latest.json"),
  computeBroker: readArtifact("compute-broker-latest.json"),
  computeRuntime: readArtifact("compute-runtime-latest.json"),
  infraDiagnostics: readArtifact("infra-diagnostics-latest.json"),
  runtimeFinalize: readArtifact("runtime-finalize-latest.json"),
  cloudflareTunnel: readArtifact("cloudflare-tunnel-latest.json"),
  da: readArtifact("da-latest.json"),
  daPayload: readArtifact("da-batch-payload-latest.json"),
  daStack: readArtifact("da-stack-readiness-latest.json"),
  daSidecar: readArtifact("da-sidecar-latest.json"),
  agentic: readArtifact("agentic-id-latest.json"),
  agenticRegistry: readArtifact("agentic-registry-latest.json"),
  agenticReadback: readArtifact("agentic-id-readback-latest.json"),
  agentManagerReadback: readArtifact("agent-manager-readback-latest.json"),
};

assertDataChainArtifacts(artifacts);
assertRuntimeDaArtifacts(artifacts);
assertAgenticArtifacts(artifacts);

console.log("proof artifacts ok: player snapshot, storage, chain, compute, DA, sidecar, agentic registry");
