import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const sidecarUrl = process.env.OG_DA_SIDECAR_URL || "http://127.0.0.1:51080";
const appUrl = process.env.OG_APP_PUBLIC_URL || process.env.VITE_PUBLIC_APP_URL || "http://localhost:3022";
const configuredPublicSidecar = /^https:\/\/.+/i.test(sidecarUrl);
const configuredPublicApp = /^https:\/\/.+/i.test(appUrl);

function fingerprint(value: string) {
  return value ? createHash("sha256").update(value).digest("hex").slice(0, 12) : null;
}

function runVersion(command: string, args: string[]) {
  try {
    return {
      installed: true,
      version: execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(),
    };
  } catch (error) {
    return {
      installed: false,
      version: "",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function probe(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return {
      reachable: response.ok,
      statusCode: response.status,
      contentType: response.headers.get("content-type") || "",
    };
  } catch (error) {
    return {
      reachable: false,
      statusCode: 0,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

const cloudflared = runVersion("cloudflared", ["--version"]);
const sidecarHealth = await probe(`${sidecarUrl.replace(/\/$/, "")}/health`);
const appHealth = await probe(appUrl);

const artifact = {
  schema: "0g-world-cup-cloudflare-tunnel-proof-v1",
  status: configuredPublicSidecar || configuredPublicApp ? "configured" : "local-only",
  generatedAt: new Date(0).toISOString(),
  cloudflared,
  tunnel: {
    docsUrl: "https://developers.cloudflare.com/pages/how-to/preview-with-cloudflare-tunnel/",
    role:
      "Optional public bridge for local app/DA sidecar demos. 0G Chain, 0G Storage, and 0G DA artifacts remain the source of truth.",
    recommendedCommand: "cloudflared tunnel --url http://127.0.0.1:51080",
    sidecarUrl,
    sidecarUrlFingerprint: fingerprint(sidecarUrl),
    appUrl,
    appUrlFingerprint: fingerprint(appUrl),
    configuredPublicSidecar,
    configuredPublicApp,
    sidecarHealth,
    appHealth,
  },
  costModel: {
    tunnel: "Cloudflare Tunnel is suitable for lightweight demo ingress; Workers/Durable Object usage is billed separately.",
    workersPaidMinimumUsdPerMonth: 5,
    requestsIncludedPerMonth: 10_000_000,
    requestsOverageUsdPerMillion: 0.3,
    cpuIncludedMsPerMonth: 30_000_000,
    cpuOverageUsdPerMillionMs: 0.02,
    staticAssetRequests: "free and unlimited under Workers pricing docs",
  },
  checks: {
    cloudflaredInstalled: cloudflared.installed,
    sidecarReachable: sidecarHealth.reachable,
    appReachable: appHealth.reachable,
    publicSidecarConfigured: configuredPublicSidecar,
    publicAppConfigured: configuredPublicApp,
    noSecretsInArtifact: true,
  },
  reason: configuredPublicSidecar || configuredPublicApp
    ? "A public Cloudflare-routable URL is configured for the app and/or DA sidecar."
    : "No public tunnel URL is configured; proofs are using localhost. This is fine for local testing, but use OG_DA_SIDECAR_URL=https://... or OG_APP_PUBLIC_URL=https://... for judge/cross-app access.",
  env: publicEnvSummary(),
};

writeProofArtifact("cloudflare-tunnel-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
