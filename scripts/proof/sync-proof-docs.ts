import { readFileSync, writeFileSync } from "node:fs";

type JsonObject = Record<string, unknown>;

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as JsonObject;
}

function readText(path: string) {
  return readFileSync(path, "utf8");
}

function writeText(path: string, value: string) {
  writeFileSync(path, value);
}

function requireHash(value: unknown, label: string) {
  const hash = String(value ?? "");
  if (!/^0x[a-f0-9]{64}$/i.test(hash)) {
    throw new Error(`${label} must be a 32-byte hash, got ${hash}`);
  }
  return hash;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value ? value : "";
}

function requireString(value: unknown, label: string) {
  const text = String(value ?? "");
  if (!text) {
    throw new Error(`${label} is required`);
  }
  return text;
}

function replaceIfPresent(text: string, pattern: RegExp, replacement: string) {
  pattern.lastIndex = 0;
  return pattern.test(text) ? text.replace(pattern, replacement) : text;
}

const da = readJson("public/proof-artifacts/da-latest.json");
const storageBundle = readJson("public/proof-artifacts/storage-bundle-latest.json");
const agentManager = readJson("public/proof-artifacts/agent-manager-readback-latest.json");
const computeBroker = readJson("public/proof-artifacts/compute-broker-latest.json");

const values = {
  daBlobHash: requireHash(da.blobHash, "DA blob hash"),
  storageBundleHash: requireHash(storageBundle.bundleHash, "Storage bundle hash"),
  storageBundleRoot: requireHash(storageBundle.rootHash, "Storage bundle root"),
  storageBundleTx: requireHash(storageBundle.txHash, "Storage bundle tx"),
  agentManagerReadbackHash: requireHash(agentManager.readbackHash, "Agent Manager readback hash"),
  computeWalletBalance: optionalString((computeBroker.wallet as JsonObject | undefined)?.nativeBalanceOg),
  computeRequiredTopUp: optionalString((computeBroker.wallet as JsonObject | undefined)?.requiredTopUpOg),
};

const docs = ["README.md", "SUBMISSION.md", "TRUTH_AUDIT.md", ".Codex/state/CURRENT_SPEC.md"];

for (const path of docs) {
  let text = readText(path);

  text = replaceIfPresent(
    text,
    /bundle hash `0x[a-f0-9]{64}`, root `0x[a-f0-9]{64}`, tx `0x[a-f0-9]{64}`/gi,
    `bundle hash \`${values.storageBundleHash}\`, root \`${values.storageBundleRoot}\`, tx \`${values.storageBundleTx}\``,
  );

  text = replaceIfPresent(
    text,
    /(latest (?:DA )?blob hash(?: is)?:? `)0x[a-f0-9]{64}(`)/gi,
    `$1${values.daBlobHash}$2`,
  );

  text = replaceIfPresent(
    text,
    /(current hash `)0x[a-f0-9]{64}(` is written to `proof-artifacts\/da-latest\.json`)/gi,
    `$1${values.daBlobHash}$2`,
  );

  text = replaceIfPresent(
    text,
    /(readback hash `)0x[a-f0-9]{64}(`)/gi,
    `$1${values.agentManagerReadbackHash}$2`,
  );

  if (values.computeWalletBalance) {
    text = replaceIfPresent(
      text,
      /(project wallet (?:has only|has|balance) `)[0-9.]+ 0G(`)/gi,
      `$1${values.computeWalletBalance} 0G$2`,
    );

    text = replaceIfPresent(
      text,
      /(project wallet balance `)[0-9.]+ 0G(`)/gi,
      `$1${values.computeWalletBalance} 0G$2`,
    );
  }

  if (values.computeRequiredTopUp) {
    text = replaceIfPresent(
      text,
      /(required top-up is `)[0-9.]+ 0G(`)/gi,
      `$1${values.computeRequiredTopUp} 0G$2`,
    );
  }

  writeText(path, text);
}

console.log(
  JSON.stringify(
    {
      status: "synced",
      docs,
      values,
    },
    null,
    2,
  ),
);
