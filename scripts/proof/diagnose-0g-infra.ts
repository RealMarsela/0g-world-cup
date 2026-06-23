import { createHash } from "node:crypto";
import net from "node:net";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const computeEndpoint =
  process.env.OG_COMPUTE_ENDPOINT ||
  process.env.VITE_OG_COMPUTE_ENDPOINT ||
  "https://router-api-testnet.integratenetwork.work/v1";
const computeKey = process.env.OG_COMPUTE_API_KEY || process.env.VITE_OG_COMPUTE_API_KEY || "";
const sidecarUrl = process.env.OG_DA_SIDECAR_URL || "http://127.0.0.1:51080";
const daClientGrpc = process.env.OG_DA_CLIENT_GRPC_URL || "";

function fingerprint(value: string) {
  return value ? createHash("sha256").update(value).digest("hex").slice(0, 12) : null;
}

async function probeComputeModel(model: string) {
  if (!computeKey) {
    return {
      model,
      ok: false,
      statusCode: 0,
      errorCode: "missing_key",
      errorType: "configuration",
      message: "Missing OG_COMPUTE_API_KEY or VITE_OG_COMPUTE_API_KEY.",
    };
  }
  try {
    const response = await fetch(`${computeEndpoint}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${computeKey}`,
        "Content-Type": "application/json",
      },
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

const computeModels = Array.from(new Set([
  process.env.OG_COMPUTE_MODEL || process.env.VITE_OG_COMPUTE_MODEL || "glm-5.1",
  "glm-5.2",
  "glm-5.1",
]));
const computeProbes = await Promise.all(computeModels.map(probeComputeModel));
const daPorts = await Promise.all([
  probeTcp("127.0.0.1", 51080),
  probeTcp("127.0.0.1", 51001),
  probeTcp("127.0.0.1", 34000),
  probeTcp("127.0.0.1", 34005),
]);
const sidecar = await probeSidecar();

const computeLive = computeProbes.some((probe) => probe.ok);
const daClientListening = daPorts.some((probe) => probe.port === 51001 && probe.listening);
const encoderListening = daPorts.some((probe) => probe.port === 34000 && probe.listening);
const retrieverListening = daPorts.some((probe) => probe.port === 34005 && probe.listening);

const artifact = {
  status: computeLive && daClientGrpc && daClientListening ? "live" : "blocked",
  generatedAt: new Date(0).toISOString(),
  compute: {
    endpoint: computeEndpoint,
    hasKey: Boolean(computeKey),
    keyFingerprint: fingerprint(computeKey),
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
    localPorts: daPorts,
    hasDaClientGrpc: Boolean(daClientGrpc),
    daClientListening,
    encoderListening,
    retrieverListening,
    reason: daClientGrpc && daClientListening
      ? "DA Client endpoint configured and reachable."
      : "No reachable OG_DA_CLIENT_GRPC_URL/51001 DA Client was found. Live DA submission remains blocked.",
  },
  env: publicEnvSummary(),
};

writeProofArtifact("infra-diagnostics-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
