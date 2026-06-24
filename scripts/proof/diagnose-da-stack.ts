import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { promisify } from "node:util";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const execFileAsync = promisify(execFile);
const sidecarUrl = process.env.OG_DA_SIDECAR_URL || "http://127.0.0.1:51080";
const daClientGrpc = process.env.OG_DA_CLIENT_GRPC_URL || "";

function fileInfo(path: string, sensitive = false) {
  if (!existsSync(path)) return { path, exists: false };
  const text = readFileSync(path, "utf8");
  return {
    path,
    exists: true,
    bytes: Buffer.byteLength(text),
    hasPrivateKey: sensitive && /COMBINED_SERVER_PRIVATE_KEY=(?!PRIVATE_KEY_REQUIRED)/.test(text),
  };
}

async function command(command: string, args: string[]) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { timeout: 5_000 });
    return { ok: true, stdout: stdout.trim().slice(0, 500), stderr: stderr.trim().slice(0, 500) };
  } catch (error) {
    const err = error as { message?: string; stdout?: string; stderr?: string; code?: number | string };
    return {
      ok: false,
      code: err.code ?? null,
      stdout: String(err.stdout ?? "").trim().slice(0, 500),
      stderr: String(err.stderr ?? err.message ?? "").trim().slice(0, 500),
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
    return {
      reachable: true,
      statusCode: response.status,
      body: await response.json() as Record<string, unknown>,
    };
  } catch (error) {
    return {
      reachable: false,
      statusCode: 0,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

const dockerVersion = await command("docker", ["--version"]);
const dockerInfo = await command("docker", ["info", "--format", "{{json .ServerVersion}}"]);
const dockerCompose = await command("docker", ["compose", "version"]);
const dockerComposeStandalone = await command("docker-compose", ["--version"]);
const colimaStatus = await command("colima", ["status"]);
const dockerContainers = await command("docker", [
  "ps",
  "--format",
  "{{.Names}} {{.Image}} {{.Ports}}",
]);
const daClientImage = await command("docker", ["image", "inspect", "0g-da-client:local", "--format", "{{.Id}}"]);
const encoderImage = await command("docker", ["image", "inspect", "0g-da-encoder:local", "--format", "{{.Id}}"]);
const retrieverImage = await command("docker", ["image", "inspect", "0g-da-retriever:local", "--format", "{{.Id}}"]);

const ports = await Promise.all([
  probeTcp("127.0.0.1", 51080),
  probeTcp("127.0.0.1", 51001),
  probeTcp("127.0.0.1", 34000),
  probeTcp("127.0.0.1", 34005),
]);
const sidecar = await probeSidecar();
const daClientListening = ports.some((port) => port.port === 51001 && port.listening);
const encoderListening = ports.some((port) => port.port === 34000 && port.listening);
const retrieverListening = ports.some((port) => port.port === 34005 && port.listening);
const sidecarListening = ports.some((port) => port.port === 51080 && port.listening);
const generatedFiles = {
  envfile: fileInfo(".da-stack/envfile.env", true),
  retrieverConfig: fileInfo(".da-stack/retriever-config.toml"),
  readme: fileInfo(".da-stack/README.md"),
  composeTemplate: fileInfo("scripts/da-stack/docker-compose.0g-da.yml"),
};

const ready =
  Boolean(daClientGrpc) &&
  daClientListening &&
  encoderListening &&
  retrieverListening &&
  sidecarListening &&
  sidecar.reachable;

function blockedReason() {
  if (ready) return "0G DA Client, Encoder, Retriever, and sidecar are all reachable.";
  const missing = [];
  if (!dockerInfo.ok) missing.push("Docker daemon is not reachable");
  if (!colimaStatus.ok) missing.push("Colima is not running");
  if (!dockerCompose.ok && !dockerComposeStandalone.ok) missing.push("Docker Compose is unavailable");
  if (!generatedFiles.envfile.exists) missing.push(".da-stack/envfile.env is missing");
  if (!generatedFiles.retrieverConfig.exists) missing.push(".da-stack/retriever-config.toml is missing");
  if (!sidecar.reachable) missing.push("local DA sidecar is not reachable on 51080");
  if (!daClientGrpc) missing.push("OG_DA_CLIENT_GRPC_URL is unset");
  if (!daClientListening) missing.push("0G DA Client gRPC port 51001 is not listening");
  if (!encoderListening) missing.push("0G DA Encoder port 34000 is not listening");
  if (!retrieverListening) missing.push("0G DA Retriever port 34005 is not listening");
  return `0G DA stack is not live yet: ${missing.join("; ")}.`;
}

const artifact = {
  schema: "0g-world-cup-da-stack-readiness-v1",
  status: ready ? "ready" : "blocked",
  generatedAt: new Date(0).toISOString(),
  officialDocs: {
    url: "https://docs.0g.ai/developer-hub/building-on-0g/da-integration",
    requirement:
      "0G DA live submission requires DA Client, Encoder, and Retriever. Common local ports: DA Client gRPC 51001, Encoder 34000, Retriever 34005.",
    maxBlobBytes: 32_505_852,
  },
  docker: {
    installed: dockerVersion.ok,
    daemonReachable: dockerInfo.ok,
    composeAvailable: dockerCompose.ok || dockerComposeStandalone.ok,
    composePluginAvailable: dockerCompose.ok,
    composeStandaloneAvailable: dockerComposeStandalone.ok,
    colimaAvailable: colimaStatus.ok || /not running|running|colima/i.test(colimaStatus.stderr),
    colimaRunning: colimaStatus.ok,
    version: dockerVersion.stdout,
    daemon: dockerInfo.ok ? dockerInfo.stdout : dockerInfo.stderr,
    compose: dockerCompose.ok ? dockerCompose.stdout : dockerCompose.stderr,
    composeStandalone: dockerComposeStandalone.ok ? dockerComposeStandalone.stdout : dockerComposeStandalone.stderr,
    colima: colimaStatus.ok ? colimaStatus.stdout : colimaStatus.stderr,
    containers: dockerContainers.ok ? dockerContainers.stdout : dockerContainers.stderr,
    images: {
      daClient: daClientImage.ok,
      encoder: encoderImage.ok,
      retriever: retrieverImage.ok,
    },
  },
  generatedFiles,
  endpoints: {
    sidecarUrl,
    daClientGrpc,
    ports,
    sidecar,
    sidecarListening,
    daClientListening,
    encoderListening,
    retrieverListening,
  },
  checks: {
    dockerInstalled: dockerVersion.ok,
    dockerDaemonReachable: dockerInfo.ok,
    dockerComposeAvailable: dockerCompose.ok || dockerComposeStandalone.ok,
    colimaRunning: colimaStatus.ok,
    generatedEnvfile: generatedFiles.envfile.exists,
    generatedRetrieverConfig: generatedFiles.retrieverConfig.exists,
    generatedComposeTemplate: generatedFiles.composeTemplate.exists,
    envfileHasPrivateKey: Boolean(generatedFiles.envfile.hasPrivateKey),
    daClientImageBuilt: daClientImage.ok,
    encoderImageBuilt: encoderImage.ok,
    retrieverImageBuilt: retrieverImage.ok,
    sidecarReachable: sidecar.reachable,
    daClientListening,
    encoderListening,
    retrieverListening,
  },
  reason: blockedReason(),
  env: publicEnvSummary(),
};

writeProofArtifact("da-stack-readiness-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
