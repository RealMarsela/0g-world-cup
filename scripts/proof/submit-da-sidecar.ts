import { existsSync, readFileSync } from "node:fs";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

await import("./diagnose-da-stack");
await import("./build-da-batch");

type DaBatchArtifact = {
  blobHash: string;
  blobBytes: number;
  blobReady: boolean;
  maxBlobBytes: number;
};

type SidecarResponse = Record<string, unknown> & {
  status?: string;
  reason?: string;
  requestId?: string;
  blobHash?: string;
};

const sidecarUrl = process.env.OG_DA_SIDECAR_URL || "http://127.0.0.1:51080";
const daBatch = JSON.parse(readFileSync("proof-artifacts/da-latest.json", "utf8")) as DaBatchArtifact;
const daPayload = JSON.parse(readFileSync("proof-artifacts/da-batch-payload-latest.json", "utf8")) as Record<string, unknown>;
const daStack = existsSync("proof-artifacts/da-stack-readiness-latest.json")
  ? JSON.parse(readFileSync("proof-artifacts/da-stack-readiness-latest.json", "utf8")) as { status?: string; reason?: string }
  : null;

async function postToSidecar() {
  const response = await fetch(`${sidecarUrl.replace(/\/$/, "")}/submit-da-blob`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      blob: daPayload,
      clientBlobHash: daBatch.blobHash,
      source: "0g-world-cup-proof-da-batch",
    }),
  });
  const body = await response.json() as SidecarResponse;
  return { ok: response.ok, statusCode: response.status, body };
}

try {
  if (daStack?.status === "blocked" && /DAEntrance|bytecode|contract/i.test(String(daStack.reason ?? ""))) {
    const artifact = {
      schema: "0g-world-cup-da-sidecar-proof-v1",
      status: "blocked",
      sidecarUrl,
      blobHash: daBatch.blobHash,
      expectedBlobHash: daBatch.blobHash,
      blobBytes: daBatch.blobBytes,
      blobReady: daBatch.blobReady,
      maxBlobBytes: daBatch.maxBlobBytes,
      daStatus: "",
      reason: `DA sidecar submit skipped because readiness preflight is blocked: ${daStack.reason}`,
      env: publicEnvSummary(),
    };
    writeProofArtifact("da-sidecar-latest.json", artifact);
    console.log(JSON.stringify(artifact, null, 2));
    process.exit(0);
  }

  const result = await postToSidecar();
  const sidecarStatus = String(result.body.status ?? (result.ok ? "submitted" : "blocked"));
  const artifact = {
    schema: "0g-world-cup-da-sidecar-proof-v1",
    status: sidecarStatus === "submitted" || sidecarStatus === "live" ? sidecarStatus : "blocked",
    sidecarUrl,
    statusCode: result.statusCode,
    requestId: result.body.requestId ?? "",
    blobHash: result.body.blobHash ?? daBatch.blobHash,
    expectedBlobHash: daBatch.blobHash,
    blobBytes: result.body.blobBytes ?? daBatch.blobBytes,
    blobReady: daBatch.blobReady,
    maxBlobBytes: daBatch.maxBlobBytes,
    daStatus: result.body.daStatus ?? "",
    reason: result.body.reason ?? "DA sidecar returned a response without a reason.",
    env: publicEnvSummary(),
  };
  writeProofArtifact("da-sidecar-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
} catch (error) {
  const artifact = {
    schema: "0g-world-cup-da-sidecar-proof-v1",
    status: "blocked",
    sidecarUrl,
    blobHash: daBatch.blobHash,
    expectedBlobHash: daBatch.blobHash,
    blobBytes: daBatch.blobBytes,
    blobReady: daBatch.blobReady,
    maxBlobBytes: daBatch.maxBlobBytes,
    reason: `DA sidecar is not reachable at ${sidecarUrl}: ${error instanceof Error ? error.message : String(error)}`,
    env: publicEnvSummary(),
  };
  writeProofArtifact("da-sidecar-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
}
