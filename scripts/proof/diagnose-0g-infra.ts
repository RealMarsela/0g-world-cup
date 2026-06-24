import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { getComputeEnvCandidates } from "../../src/server/env";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();
await import("./diagnose-da-stack");

const computeCandidates = getComputeEnvCandidates();
const sidecarUrl = process.env.OG_DA_SIDECAR_URL || "http://127.0.0.1:51080";
const daClientGrpc = process.env.OG_DA_CLIENT_GRPC_URL || "";

type DaStackArtifact = {
  status?: string;
  reason?: string;
  officialDocs?: { maxBlobBytes?: number };
  endpoints?: {
    daEntrance?: {
      address?: string;
      hasCode?: boolean;
      codeBytes?: number;
      reason?: string;
    };
    daEntranceCandidates?: {
      address?: string;
      hasCode?: boolean;
      codeBytes?: number;
      reason?: string;
    }[];
    anyDocumentedDaEntranceHasCode?: boolean;
  };
};

function fingerprint(value: string) {
  return value ? createHash("sha256").update(value).digest("hex").slice(0, 12) : null;
}

async function probeComputeModel(candidate: { source: string; endpoint: string; apiKey: string }, model: string) {
  if (!candidate.apiKey) {
    return {
      source: candidate.source,
      endpoint: candidate.endpoint,
      model,
      ok: false,
      statusCode: 0,
      errorCode: "missing_key",
      errorType: "configuration",
      message: "Missing OG_COMPUTE_API_KEY, VITE_OG_COMPUTE_API_KEY, or ZEROG_ROUTER_API_KEY.",
    };
  }
  try {
    const response = await fetch(`${candidate.endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${candidate.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(Number(process.env.OG_COMPUTE_PROBE_TIMEOUT_MS || 30_000)),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Return concise JSON only." },
          { role: "user", content: "Return {\"ok\":true,\"minute\":12} for a football proof ping." },
        ],
        temperature: 0,
        max_tokens: 64,
        verify_tee: true,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });
    const text = await response.text();
    const json = JSON.parse(text || "{}") as {
      id?: string;
      error?: { code?: string; message?: string; type?: string; request_id?: string };
      x_0g_trace?: { provider?: string; request_id?: string; tee_verified?: boolean };
    };
    return {
      source: candidate.source,
      endpoint: candidate.endpoint,
      model,
      ok: response.ok,
      statusCode: response.status,
      requestId: json.error?.request_id || json.x_0g_trace?.request_id || json.id || null,
      errorCode: json.error?.code || null,
      errorType: json.error?.type || null,
      message: json.error?.message || (response.ok ? "ok" : text.slice(0, 160)),
      provider: json.x_0g_trace?.provider || null,
      teeVerified: json.x_0g_trace?.tee_verified ?? null,
    };
  } catch (error) {
    return {
      source: candidate.source,
      endpoint: candidate.endpoint,
      model,
      ok: false,
      statusCode: 0,
      errorCode: "probe_failed",
      errorType: "network_or_parse",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function probeTcp(host: string, port: number) {
  return new Promise<{ host: string; port: number; listening: boolean; reason?: string }>((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 1000 });
    socket.once("connect", () => {
      socket.end();
      resolve({ host, port, listening: true });
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve({ host, port, listening: false, reason: "timeout" });
    });
    socket.once("error", (error) => {
      resolve({ host, port, listening: false, reason: error.message });
    });
  });
}

async function probeSidecar() {
  try {
    const response = await fetch(`${sidecarUrl.replace(/\/$/, "")}/health`);
    const body = await response.json() as Record<string, unknown>;
    return { reachable: true, statusCode: response.status, body };
  } catch (error) {
    return {
      reachable: false,
      statusCode: 0,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

function readDaStackArtifact(): DaStackArtifact | null {
  if (!existsSync("proof-artifacts/da-stack-readiness-latest.json")) return null;
  return JSON.parse(readFileSync("proof-artifacts/da-stack-readiness-latest.json", "utf8")) as DaStackArtifact;
}

const configuredModels = Array.from(new Set([
  process.env.OG_COMPUTE_MODEL || process.env.VITE_OG_COMPUTE_MODEL || process.env.ZEROG_COMPUTE_MODEL || "glm-5.1",
  ...computeCandidates.map((candidate) => candidate.model),
  "glm-5.2",
  "glm-5.1",
].filter(Boolean)));
const computeProbeInputs = computeCandidates.length
  ? computeCandidates.flatMap((candidate) =>
      Array.from(
        new Set([
          candidate.model || configuredModels[0] || "glm-5.1",
          ...(candidate.source === "ZEROG_ROUTER_API_KEY" ? [] : configuredModels),
        ]),
      ).map((model) => ({
        candidate,
        model,
      })),
    )
  : [{ candidate: { source: "missing", endpoint: publicEnvSummary().computeEndpoint, apiKey: "" }, model: "glm-5.1" }];
const computeProbes = [];
for (const input of computeProbeInputs) {
  computeProbes.push(await probeComputeModel(input.candidate, input.model));
}
const daPorts = await Promise.all([
  probeTcp("127.0.0.1", 51080),
  probeTcp("127.0.0.1", 51001),
  probeTcp("127.0.0.1", 34000),
  probeTcp("127.0.0.1", 34005),
]);
const sidecar = await probeSidecar();
const daStack = readDaStackArtifact();

const computeLive = computeProbes.some((probe) => probe.ok);
const daClientListening = daPorts.some((probe) => probe.port === 51001 && probe.listening);
const encoderListening = daPorts.some((probe) => probe.port === 34000 && probe.listening);
const retrieverListening = daPorts.some((probe) => probe.port === 34005 && probe.listening);
const daEntranceHasCode = Boolean(daStack?.endpoints?.daEntrance?.hasCode);
const daStackReady = daStack?.status === "ready";

const artifact = {
  status: computeLive && daClientGrpc && daClientListening && encoderListening && retrieverListening && daStackReady ? "live" : "blocked",
  generatedAt: new Date(0).toISOString(),
  compute: {
    endpoint: computeCandidates[0]?.endpoint ?? publicEnvSummary().computeEndpoint,
    candidates: computeCandidates.map((candidate) => ({
      source: candidate.source,
      endpoint: candidate.endpoint,
      model: candidate.model,
      keyFingerprint: fingerprint(candidate.apiKey),
    })),
    hasKey: computeCandidates.length > 0,
    keyFingerprint: fingerprint(computeCandidates[0]?.apiKey ?? ""),
    probes: computeProbes,
    live: computeLive,
    reason: computeLive
      ? "At least one 0G Compute model completed."
      : "All probed 0G Compute models are blocked; current responses indicate insufficient router balance.",
  },
  da: {
    docsUrl: "https://docs.0g.ai/developer-hub/building-on-0g/da-integration",
    officialRequirement:
      "0G DA submission requires running a DA Client node plus Encoder/Retriever; the DA Client exposes the Disperser gRPC service, commonly on port 51001.",
    sidecarUrl,
    sidecar,
    daClientGrpc,
    stackStatus: daStack?.status ?? "missing",
    stackReason: daStack?.reason ?? "DA stack readiness artifact is missing.",
    daEntrance: daStack?.endpoints?.daEntrance ?? null,
    daEntranceCandidates: daStack?.endpoints?.daEntranceCandidates ?? [],
    anyDocumentedDaEntranceHasCode: Boolean(daStack?.endpoints?.anyDocumentedDaEntranceHasCode),
    daEntranceHasCode,
    officialMaxBlobBytes: daStack?.officialDocs?.maxBlobBytes ?? 32_505_852,
    localPorts: daPorts,
    hasDaClientGrpc: Boolean(daClientGrpc),
    daClientListening,
    encoderListening,
    retrieverListening,
    reason: daStack?.reason
      ? daStack.reason
      : daClientGrpc && daClientListening && encoderListening && retrieverListening && daEntranceHasCode
        ? "DA Client, Encoder, Retriever, sidecar, and DAEntrance are reachable."
        : "No complete DA Client/Encoder/Retriever/DAEntrance path was found. Live DA submission remains blocked.",
  },
  env: publicEnvSummary(),
};

writeProofArtifact("infra-diagnostics-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
