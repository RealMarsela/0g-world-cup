import { existsSync, readFileSync } from "node:fs";
import { ethers } from "ethers";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

type UnknownRecord = Record<string, unknown>;

const rpcUrl = process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const privateKey = process.env.OG_PRIVATE_KEY || "";
const minimumLedgerOg = 3;
const timeoutMs = Number(process.env.OG_COMPUTE_BROKER_TIMEOUT_MS || 15_000);

function readSdkVersion() {
  try {
    const packageJson = JSON.parse(
      readFileSync("node_modules/@0gfoundation/0g-compute-ts-sdk/package.json", "utf8"),
    ) as { version?: string };
    return packageJson.version ?? "unknown";
  } catch {
    return null;
  }
}

function readPreviousWalletProof() {
  const path = "public/proof-artifacts/compute-broker-latest.json";
  if (!existsSync(path)) return null;
  try {
    const previous = JSON.parse(readFileSync(path, "utf8")) as { wallet?: UnknownRecord };
    return previous.wallet ?? null;
  } catch {
    return null;
  }
}

function safeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(privateKey, "[redacted-private-key]").slice(0, 500);
}

function stringifyBigNumberish(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(stringifyBigNumberish);
  if (value && typeof value === "object") {
    const output: UnknownRecord = {};
    for (const [key, item] of Object.entries(value as UnknownRecord)) {
      if (typeof item === "function") continue;
      output[key] = stringifyBigNumberish(item);
    }
    return output;
  }
  return value;
}

function providerAddress(service: UnknownRecord) {
  return String(
    service.provider ??
      service.providerAddress ??
      service.address ??
      service.serviceProvider ??
      service.provider_address ??
      "",
  );
}

function sanitizeService(service: UnknownRecord) {
  return {
    provider: providerAddress(service),
    serviceType: String(service.serviceType ?? service.type ?? service.name ?? "unknown"),
    model: String(service.model ?? service.modelName ?? service.serviceName ?? ""),
    verifiability: String(service.verifiability ?? service.verificationType ?? ""),
  };
}

async function withTimeout<T>(label: string, task: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([task, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const sdkVersion = readSdkVersion();
const artifact: UnknownRecord = {
  status: "blocked",
  generatedAt: new Date(0).toISOString(),
  mode: "direct-0g-compute-broker",
  sdk: {
    package: "@0gfoundation/0g-compute-ts-sdk",
    installed: Boolean(sdkVersion),
    version: sdkVersion,
  },
  network: { rpcUrl },
  minimumLedgerOg,
  wallet: {
    configured: Boolean(privateKey),
    address: null,
    nativeBalanceOg: null,
    canFundMinimumLedger: false,
  },
  broker: {
    initialized: false,
    servicesListed: false,
    serviceCount: 0,
    preferredService: null,
    sampleServices: [],
    metadata: null,
    error: null,
  },
  ledger: {
    readable: false,
    exists: false,
    raw: null,
    error: null,
  },
  checks: {
    sdkInstalled: Boolean(sdkVersion),
    walletConfigured: Boolean(privateKey),
    walletBalanceReadable: false,
    walletCanFundMinimumLedger: false,
    brokerInitialized: false,
    servicesListed: false,
    ledgerReadable: false,
  },
  reason: "",
  env: publicEnvSummary(),
};

if (!sdkVersion) {
  artifact.reason = "Direct 0G Compute broker SDK is not installed.";
  writeProofArtifact("compute-broker-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

if (!privateKey) {
  artifact.reason = "Missing OG_PRIVATE_KEY; direct 0G Compute broker requires a funded 0G wallet.";
  writeProofArtifact("compute-broker-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
let canFundMinimumLedger = false;
let requiredTopUpOg: number | null = null;
let balanceError = "";

try {
  const balanceWei = await withTimeout("wallet balance", provider.getBalance(wallet.address));
  const balanceOg = Number(ethers.formatEther(balanceWei));
  canFundMinimumLedger = balanceOg >= minimumLedgerOg;
  requiredTopUpOg = Math.max(0, minimumLedgerOg - balanceOg);

  artifact.wallet = {
    configured: true,
    address: wallet.address,
    nativeBalanceOg: ethers.formatEther(balanceWei),
    minimumLedgerOg,
    requiredTopUpOg: requiredTopUpOg.toFixed(18).replace(/0+$/, "").replace(/\.$/, ""),
    canFundMinimumLedger,
    balanceReadable: true,
  };
  (artifact.checks as UnknownRecord).walletBalanceReadable = true;
  (artifact.checks as UnknownRecord).walletCanFundMinimumLedger = canFundMinimumLedger;
} catch (error) {
  balanceError = safeMessage(error);
  const previousWallet = readPreviousWalletProof();
  artifact.wallet = {
    configured: true,
    address: wallet.address,
    nativeBalanceOg: previousWallet?.nativeBalanceOg ?? null,
    minimumLedgerOg,
    requiredTopUpOg: previousWallet?.requiredTopUpOg ?? null,
    canFundMinimumLedger: false,
    balanceReadable: false,
    balanceError,
    valuesFromPreviousArtifact: Boolean(previousWallet?.nativeBalanceOg || previousWallet?.requiredTopUpOg),
  };
}

try {
  const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
  const broker = await withTimeout("broker initialization", createZGComputeNetworkBroker(wallet));
  (artifact.broker as UnknownRecord).initialized = true;
  (artifact.checks as UnknownRecord).brokerInitialized = true;

  try {
    const services = await withTimeout("broker service listing", broker.inference.listService());
    const serviceList = Array.isArray(services) ? services as UnknownRecord[] : [];
    const sanitizedServices = serviceList.map(sanitizeService).filter((service) => service.provider);
    const preferredService =
      sanitizedServices.find((service) => /tee|teeml|tee-?tls/i.test(service.verifiability)) ??
      sanitizedServices[0] ??
      null;
    (artifact.broker as UnknownRecord).servicesListed = true;
    (artifact.broker as UnknownRecord).serviceCount = sanitizedServices.length;
    (artifact.broker as UnknownRecord).preferredService = preferredService;
    (artifact.broker as UnknownRecord).sampleServices = sanitizedServices.slice(0, 5);
    (artifact.checks as UnknownRecord).servicesListed = true;

    if (preferredService?.provider) {
      try {
        const metadata = await withTimeout(
          "broker service metadata",
          broker.inference.getServiceMetadata(preferredService.provider),
        );
        (artifact.broker as UnknownRecord).metadata = stringifyBigNumberish({
          endpoint: metadata.endpoint,
          model: metadata.model,
        });
      } catch (error) {
        (artifact.broker as UnknownRecord).metadata = { error: safeMessage(error) };
      }
    }
  } catch (error) {
    (artifact.broker as UnknownRecord).error = safeMessage(error);
  }

  try {
    const ledger = await withTimeout("broker ledger read", broker.ledger.getLedger());
    (artifact.ledger as UnknownRecord).readable = true;
    (artifact.ledger as UnknownRecord).exists = true;
    (artifact.ledger as UnknownRecord).raw = stringifyBigNumberish(ledger);
    (artifact.checks as UnknownRecord).ledgerReadable = true;
  } catch (error) {
    (artifact.ledger as UnknownRecord).error = safeMessage(error);
  }
} catch (error) {
  (artifact.broker as UnknownRecord).error = safeMessage(error);
}

const checks = artifact.checks as UnknownRecord;
if (checks.servicesListed && checks.ledgerReadable) {
  artifact.status = "ready";
  artifact.reason =
    "Direct 0G Compute broker is discoverable and the wallet ledger is readable; run an inference proof only when a provider account has spendable funds.";
} else if (checks.servicesListed && !checks.walletBalanceReadable) {
  artifact.reason =
    `Direct 0G Compute providers are discoverable, but the wallet balance could not be read from ${rpcUrl}: ${balanceError || "unknown balance read error"}. Funding cannot be verified until the RPC balance read succeeds.`;
} else if (checks.servicesListed && !canFundMinimumLedger) {
  artifact.reason =
    `Direct 0G Compute providers are discoverable, but wallet balance is below the ${minimumLedgerOg} 0G ledger minimum for broker funding. Top up ${wallet.address} with at least ${(requiredTopUpOg ?? minimumLedgerOg).toFixed(6)} 0G, then rerun with OG_COMPUTE_BROKER_AUTOFUND=1 to create the broker ledger.`;
} else if (checks.brokerInitialized) {
  artifact.reason =
    "Direct 0G Compute broker initialized, but provider discovery or ledger read is blocked. See broker/ledger error fields.";
} else {
  artifact.reason =
    "Direct 0G Compute broker could not initialize. See broker error for the exact SDK/RPC blocker.";
}

writeProofArtifact("compute-broker-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
