import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type JsonObject = Record<string, unknown>;

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as JsonObject;
}

function readText(path: string) {
  return readFileSync(path, "utf8");
}

const matrix = readJson("public/proof-artifacts/integration-matrix-latest.json");
const da = readJson("public/proof-artifacts/da-latest.json");
const storageBundle = readJson("public/proof-artifacts/storage-bundle-latest.json");
const agentManager = readJson("public/proof-artifacts/agent-manager-readback-latest.json");

const requiredValues = {
  coverageHash: String(matrix.coverageHash),
  daBlobHash: String(da.blobHash),
  storageBundleHash: String(storageBundle.bundleHash),
  storageBundleRoot: String(storageBundle.rootHash),
  storageBundleTx: String(storageBundle.txHash),
  agentManagerReadbackHash: String(agentManager.readbackHash),
};

for (const [label, value] of Object.entries(requiredValues)) {
  assert.match(value, /^0x[a-f0-9]{64}$/i, `${label} must be a proof hash`);
}

const docs = {
  README: readText("README.md"),
  SUBMISSION: readText("SUBMISSION.md"),
  TRUTH_AUDIT: readText("TRUTH_AUDIT.md"),
  CURRENT_SPEC: readText(".Codex/state/CURRENT_SPEC.md"),
};

function expectDocContains(docName: keyof typeof docs, value: string, label: string) {
  assert.equal(
    docs[docName].includes(value),
    true,
    `${docName} must document current ${label}: ${value}`,
  );
}

for (const docName of ["README", "SUBMISSION", "TRUTH_AUDIT"] as const) {
  expectDocContains(docName, requiredValues.daBlobHash, "DA blob hash");
  expectDocContains(docName, requiredValues.storageBundleHash, "Storage bundle hash");
  expectDocContains(docName, requiredValues.storageBundleRoot, "Storage bundle root");
  expectDocContains(docName, requiredValues.storageBundleTx, "Storage bundle tx");
}

for (const docName of ["README", "SUBMISSION"] as const) {
  expectDocContains(docName, requiredValues.agentManagerReadbackHash, "Agent Manager readback hash");
}

expectDocContains("TRUTH_AUDIT", requiredValues.agentManagerReadbackHash, "Agent Manager readback hash");
expectDocContains("CURRENT_SPEC", requiredValues.daBlobHash, "DA blob hash");

const staleHashes = [
  "0x5880382e72291c0e61bb06a4dee0b1368287e3e45b9357b63305a7ae71532fbe",
  "0xd063f1f1d5c5b09e27e99540068284022ca1bbe27d596be1442ee82fc4a05e2d",
  "0x177f7de4bb9d608536dae2ea595f402f196c9d88433b22cfe021172f155e7324",
  "0xebddfbe3cf9cc48ea0cfda0940e9be45446fcd2badca1dd80749bdef166c099c",
];

for (const [docName, text] of Object.entries(docs)) {
  for (const staleHash of staleHashes) {
    assert.equal(
      text.includes(staleHash),
      false,
      `${docName} still references stale proof hash ${staleHash}`,
    );
  }
}

console.log("proof docs ok: README, SUBMISSION, TRUTH_AUDIT, and CURRENT_SPEC match current public artifacts");
