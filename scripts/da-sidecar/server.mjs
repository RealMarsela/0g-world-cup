import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

const PORT = Number(process.env.OG_DA_SIDECAR_PORT || 51080);
const MAX_DA_BLOB_BYTES = 32_505_852;
const statePath = "proof-artifacts/da-sidecar-state.json";
const sidecarDir = dirname(fileURLToPath(import.meta.url));
const protoPath = join(sidecarDir, "disperser.proto");
const statusNames = ["UNKNOWN", "PROCESSING", "CONFIRMED", "FAILED", "FINALIZED", "INSUFFICIENT_SIGNATURES"];

let disperserClient;

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

async function readState() {
  try {
    return JSON.parse(await readFile(statePath, "utf8"));
  } catch {
    return { requests: {} };
  }
}

async function writeState(state) {
  await mkdir("proof-artifacts", { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function json(res, statusCode, value) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(value, null, 2));
}

function publicStatus() {
  return {
    schema: "0g-da-sidecar-status-v1",
    status: process.env.OG_DA_CLIENT_GRPC_URL ? "configured" : "blocked",
    daClientGrpc: process.env.OG_DA_CLIENT_GRPC_URL || "",
    retrieverUrl: process.env.OG_DA_RETRIEVER_URL || "",
    maxBlobBytes: MAX_DA_BLOB_BYTES,
    reason: process.env.OG_DA_CLIENT_GRPC_URL
      ? "DA Client endpoint configured. Live gRPC submitter can be enabled against this sidecar host."
      : "Missing OG_DA_CLIENT_GRPC_URL. Run 0G DA Client plus Encoder/Retriever, then restart this sidecar.",
  };
}

function normalizeGrpcTarget(value) {
  return value.replace(/^https?:\/\//, "");
}

function toHex(value) {
  if (!value) return "";
  return `0x${Buffer.from(value).toString("hex")}`;
}

function statusName(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return statusNames[value] ?? String(value);
  return String(value ?? "UNKNOWN");
}

function publicBlobInfo(info) {
  const header = info?.blob_header ?? info?.blobHeader;
  if (!header) return null;
  return {
    storageRoot: toHex(header.storage_root ?? header.storageRoot),
    epoch: String(header.epoch ?? ""),
    quorumId: String(header.quorum_id ?? header.quorumId ?? ""),
  };
}

function getDisperserClient() {
  if (disperserClient) return disperserClient;
  const target = process.env.OG_DA_CLIENT_GRPC_URL;
  if (!target) return null;

  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true,
  });
  const loaded = grpc.loadPackageDefinition(packageDefinition);
  disperserClient = new loaded.disperser.Disperser(
    normalizeGrpcTarget(target),
    grpc.credentials.createInsecure(),
  );
  return disperserClient;
}

function callGrpc(method, request) {
  const client = getDisperserClient();
  if (!client) throw new Error("Missing OG_DA_CLIENT_GRPC_URL.");
  return new Promise((resolve, reject) => {
    client[method](request, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
}

async function handleSubmit(req, res) {
  const body = await readJsonBody(req);
  const payload = body.blob ?? body;
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const blobHash = `0x${createHash("sha256").update(bytes).digest("hex")}`;
  const requestId = randomUUID();
  const base = {
    schema: "0g-da-sidecar-submit-v1",
    requestId,
    blobHash,
    blobBytes: bytes.byteLength,
    maxBlobBytes: MAX_DA_BLOB_BYTES,
    receivedAt: new Date().toISOString(),
  };

  if (bytes.byteLength > MAX_DA_BLOB_BYTES) {
    const blocked = {
      ...base,
      status: "blocked",
      reason: `Blob is ${bytes.byteLength} bytes, above 0G DA max ${MAX_DA_BLOB_BYTES}.`,
    };
    const state = await readState();
    state.requests[requestId] = blocked;
    await writeState(state);
    return json(res, 413, blocked);
  }

  if (!process.env.OG_DA_CLIENT_GRPC_URL) {
    const blocked = {
      ...base,
      status: "blocked",
      reason: "Missing OG_DA_CLIENT_GRPC_URL. 0G DA live submission requires a DA Client plus Encoder/Retriever.",
    };
    const state = await readState();
    state.requests[requestId] = blocked;
    await writeState(state);
    return json(res, 503, blocked);
  }

  const response = await callGrpc("DisperseBlob", { data: Buffer.from(bytes) });
  const requestIdHex = toHex(response.request_id);
  const submitted = {
    ...base,
    requestId: requestIdHex || requestId,
    status: "submitted",
    daClientGrpc: process.env.OG_DA_CLIENT_GRPC_URL,
    daStatus: statusName(response.result),
    reason: "Blob accepted by the configured 0G DA Client Disperser endpoint.",
  };
  const state = await readState();
  state.requests[submitted.requestId] = submitted;
  await writeState(state);
  return json(res, 200, submitted);
}

async function handleStatus(_req, res, requestId) {
  if (!requestId) return json(res, 200, publicStatus());
  const state = await readState();
  const existing = state.requests[requestId];
  if (!existing) {
    return json(res, 404, {
    status: "missing",
    requestId,
    reason: "No sidecar request with that id.",
    });
  }
  if (!process.env.OG_DA_CLIENT_GRPC_URL || !String(requestId).startsWith("0x")) return json(res, 200, existing);

  const response = await callGrpc("GetBlobStatus", {
    request_id: Buffer.from(String(requestId).slice(2), "hex"),
  });
  const updated = {
    ...existing,
    status: "live",
    daStatus: statusName(response.status),
    blobInfo: publicBlobInfo(response.info),
    checkedAt: new Date().toISOString(),
  };
  state.requests[requestId] = updated;
  await writeState(state);
  return json(res, 200, updated);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, publicStatus());
    if (req.method === "POST" && url.pathname === "/submit-da-blob") return await handleSubmit(req, res);
    if (req.method === "GET" && url.pathname.startsWith("/blob-status/")) {
      return await handleStatus(req, res, url.pathname.split("/").at(-1));
    }
    return json(res, 404, { error: "NOT_FOUND" });
  } catch (error) {
    return json(res, 500, {
      error: "DA_SIDECAR_ERROR",
      reason: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`0G DA sidecar listening on http://127.0.0.1:${PORT}`);
});
