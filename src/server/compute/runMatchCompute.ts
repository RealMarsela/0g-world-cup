import { createHash } from "node:crypto";
import { ethers } from "ethers";
import { completeDraft } from "../../worldcup/game";
import type { MatchComputeInput, MatchComputeOutput } from "../../worldcup/computeTypes";
import { buildMatchComputeInput } from "../../worldcup/matchCompute";
import type { DraftRoom } from "../../worldcup/types";
import { getComputeEnvCandidates, loadLocalEnv } from "../env";

type RouterChoice = {
  message?: {
    content?: string;
  };
};

type RouterResponse = {
  id?: string;
  model?: string;
  choices?: RouterChoice[];
  provider?: string;
  x_0g_trace?: {
    provider?: string;
    request_id?: string;
    tee_verified?: boolean;
    billing?: {
      provider?: string;
    };
  };
};

type ComputePath = "router" | "broker";

type BrokerService = {
  provider?: string;
  providerAddress?: string;
  address?: string;
  serviceType?: string;
  type?: string;
  model?: string;
  serviceName?: string;
  verifiability?: string;
  verificationType?: string;
};

function sha256(value: string) {
  return `0x${createHash("sha256").update(value).digest("hex")}`;
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function withTimeout<T>(label: string, task: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function getModel(endpoint: string, apiKey: string, configuredModel: string, timeoutMs: number) {
  if (configuredModel) return configuredModel;
  const response = await fetch(`${endpoint}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`0G Compute model list failed: ${response.status} ${await response.text()}`);
  const json = (await response.json()) as { data?: { id?: string }[] };
  const model = json.data?.find((item) => item.id)?.id;
  if (!model) throw new Error("0G Compute Router returned no model IDs.");
  return model;
}

function extractJson(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  throw new Error("0G Compute response did not contain JSON.");
}

function normalizeOutput(
  raw: unknown,
  input: MatchComputeInput,
  router: RouterResponse,
  endpoint: string,
  model: string,
  requestHash: string,
  path: ComputePath,
): MatchComputeOutput {
  const value = raw as Partial<MatchComputeOutput>;
  const highlights = Array.isArray(value.highlights) ? value.highlights : [];
  const homeScore = Number.isFinite(value.homeScore) ? Number(value.homeScore) : Number.NaN;
  const awayScore = Number.isFinite(value.awayScore) ? Number(value.awayScore) : Number.NaN;
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    throw new Error("0G Compute response has invalid score fields.");
  }
  if (!value.winnerTeamId || !input.room.teams.some((team) => team.id === value.winnerTeamId)) {
    throw new Error("0G Compute response has an invalid winnerTeamId.");
  }
  if (!value.mvpPlayerId || !input.room.teams.some((team) => team.picks.some((player) => player.id === value.mvpPlayerId))) {
    throw new Error("0G Compute response has an invalid mvpPlayerId.");
  }
  if (highlights.length < 6) {
    throw new Error("0G Compute response must include at least six highlights.");
  }

  const provider = router.provider || router.x_0g_trace?.provider || router.x_0g_trace?.billing?.provider;
  const requestId = router.id || router.x_0g_trace?.request_id;
  const responseHash = sha256(stableJson(value));
  const rawResponseHash = sha256(stableJson(router));
  const winner = input.room.teams.find((team) => team.id === value.winnerTeamId)?.name || String(value.winner || "");
  return {
    schema: "0g-world-cup-compute-output-v1",
    roomId: input.roomId,
    authority: "compute",
    homeScore,
    awayScore,
    winnerTeamId: value.winnerTeamId,
    winner,
    mvpPlayerId: value.mvpPlayerId,
    highlights: highlights.map((highlight, index) => ({
      id: String(highlight.id || `h-${index + 1}`),
      minute: Math.max(1, Math.min(120, Number(highlight.minute) || index + 1)),
      teamId: String(highlight.teamId || value.winnerTeamId),
      teamName: String(highlight.teamName || winner),
      playerId: highlight.playerId ? String(highlight.playerId) : undefined,
      playerName: highlight.playerName ? String(highlight.playerName) : undefined,
      kind: highlight.kind === "goal" || highlight.kind === "miss" || highlight.kind === "save" || highlight.kind === "chance" || highlight.kind === "turning-point" || highlight.kind === "tactical-shift" || highlight.kind === "substitution"
        ? highlight.kind
        : "chance",
      narration: String(highlight.narration || "The match state shifts after a tactical sequence."),
      scoreAfter: Array.isArray(highlight.scoreAfter)
        ? [Number(highlight.scoreAfter[0]) || 0, Number(highlight.scoreAfter[1]) || 0]
        : [homeScore, awayScore],
    })),
    tacticalSummary: String(value.tacticalSummary || "0G Compute generated the tactical summary."),
    winExplanation: String(value.winExplanation || "0G Compute selected the winner from lineup quality, tactics, and match events."),
    resultHash: sha256(`${input.roomId}:${input.lineupHash}:${responseHash}`),
    storageUri: `0g://compute-ready/${responseHash.slice(2)}`,
    computeMode: path === "router" ? `0G Compute Router (${model})` : `0G Compute Broker (${model})`,
    receipt: {
      endpoint,
      model,
      path,
      provider,
      requestId,
      teeVerified: router.x_0g_trace?.tee_verified ?? null,
      requestHash,
      responseHash,
      rawResponseHash,
    },
  };
}

function buildPrompt(input: MatchComputeInput) {
  const [home, away] = input.room.teams;
  const compactRoom = {
    roomId: input.roomId,
    snapshotHash: input.snapshotHash,
    lineupHash: input.lineupHash,
    allowedRecalculations: input.allowedRecalculations,
    teams: input.room.teams.map((team) => ({
      id: team.id,
      name: team.name,
      kind: team.kind,
      formation: team.formation,
      tacticalStyle: team.tacticalStyle,
      captainId: team.captainId,
      players: team.picks.map((player) => ({
        id: player.id,
        name: player.shortName,
        position: player.position,
        countryCode: player.countryCode,
        rating: player.worldRating,
        attributes: player.attributes,
      })),
    })),
  };
  return [
    {
      role: "system",
      content:
        "You are the 0G World Cup match adjudicator. This is normal association football in a 0G blockchain game, not zero-gravity sport. Return only valid JSON matching the requested schema.",
    },
    {
      role: "user",
      content: `Adjudicate this match: ${home?.name} vs ${away?.name}.
Use tactical reasoning, player ratings, formation fit, captain impact, and clutch attributes.
Return JSON with exactly these keys:
{
  "homeScore": number,
  "awayScore": number,
  "winnerTeamId": "${home?.id}" | "${away?.id}",
  "mvpPlayerId": string,
  "highlights": [{"id": string, "minute": number, "teamId": string, "teamName": string, "playerId": string, "playerName": string, "kind": "goal"|"miss"|"save"|"chance"|"turning-point"|"tactical-shift"|"substitution", "narration": string, "scoreAfter": [number, number]}],
  "tacticalSummary": string,
  "winExplanation": string
}
Produce 8 to 14 highlights sorted by minute. Goals must match the final score. Every highlight must clearly identify team and player when possible.
Match input:
${JSON.stringify(compactRoom)}`,
    },
  ];
}

function buildRepairPrompt(input: MatchComputeInput, invalidContent: string, validationError: string) {
  return [
    {
      role: "system",
      content:
        "You repair 0G World Cup match adjudication JSON. Return only valid JSON. Do not explain anything outside the JSON.",
    },
    {
      role: "user",
      content: `The previous 0G Compute response failed validation: ${validationError}

Repair it for the same match input. Keep the same football logic where possible, but return a complete valid object with:
- integer homeScore and awayScore
- winnerTeamId equal to one of the team ids
- mvpPlayerId equal to one drafted player id
- 8 to 14 highlights sorted by minute
- every goal highlight must match the final score count
- every highlight must include id, minute, teamId, teamName, playerId, playerName, kind, narration, scoreAfter
- tacticalSummary and winExplanation

Original match input:
${JSON.stringify(input)}

Invalid response to repair:
${invalidContent}`,
    },
  ];
}

function computeRequestBody(model: string, messages: { role: string; content: string }[]) {
  return {
    model,
    messages,
    temperature: 0.15,
    max_tokens: Math.min(numberEnv("OG_COMPUTE_MAX_TOKENS", 1_800), 2_048),
    verify_tee: true,
    chat_template_kwargs: { enable_thinking: false },
  };
}

async function fetchRouterCompletion(input: {
  endpoint: string;
  apiKey: string;
  model: string;
  requestBody: ReturnType<typeof computeRequestBody>;
  timeoutMs: number;
}) {
  const response = await fetch(`${input.endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input.requestBody),
    signal: AbortSignal.timeout(input.timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`0G Compute request failed: ${response.status} ${await response.text()}`);
  }
  const router = (await response.json()) as RouterResponse;
  const content = router.choices?.[0]?.message?.content;
  if (!content) throw new Error("0G Compute Router returned no assistant content.");
  return { router, content };
}

function serviceAddress(service: BrokerService) {
  return service.provider || service.providerAddress || service.address || "";
}

function pickBrokerService(services: BrokerService[]) {
  const chatServices = services.filter((service) => /chat|llm|text/i.test(service.serviceType || service.type || "chatbot"));
  const pool = chatServices.length ? chatServices : services;
  return pool.find((service) => /tee|teeml|tee-?tls/i.test(service.verifiability || service.verificationType || "")) ?? pool[0];
}

async function ensureBrokerLedger(broker: any, wallet: ethers.Wallet) {
  try {
    await broker.ledger.getLedger();
    return;
  } catch (error) {
    if (process.env.OG_COMPUTE_BROKER_AUTOFUND !== "1") {
      throw new Error(
        `Direct 0G Compute broker ledger is not ready and OG_COMPUTE_BROKER_AUTOFUND is not enabled: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const minimumLedgerOg = Number(process.env.OG_COMPUTE_BROKER_MIN_LEDGER_OG || 3);
  const balance = await wallet.provider!.getBalance(wallet.address);
  if (Number(ethers.formatEther(balance)) < minimumLedgerOg) {
    throw new Error(`Direct 0G Compute broker auto-fund needs at least ${minimumLedgerOg} 0G in the wallet.`);
  }
  await broker.ledger.addLedger(minimumLedgerOg);
}

async function runBrokerCompute(room: DraftRoom, input: MatchComputeInput): Promise<MatchComputeOutput> {
  const privateKey = process.env.OG_PRIVATE_KEY || "";
  if (!privateKey) return blockedOutput(room, "Direct 0G Compute broker is blocked: missing OG_PRIVATE_KEY.");

  try {
    const rpc = process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privateKey, provider);
    const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
    const broker = await createZGComputeNetworkBroker(wallet);
    const brokerOperationTimeoutMs = numberEnv("OG_COMPUTE_BROKER_OPERATION_TIMEOUT_MS", 12_000);
    await withTimeout("Direct 0G Compute broker ledger", ensureBrokerLedger(broker, wallet), brokerOperationTimeoutMs);

    const services = await withTimeout("Direct 0G Compute broker service list", broker.inference.listService(), brokerOperationTimeoutMs);
    const service = pickBrokerService(Array.isArray(services) ? services as BrokerService[] : []);
    const providerAddress = service ? serviceAddress(service) : "";
    if (!providerAddress) return blockedOutput(room, "Direct 0G Compute broker listed no usable providers.");

    const metadata = await withTimeout(
      "Direct 0G Compute broker metadata",
      broker.inference.getServiceMetadata(providerAddress),
      brokerOperationTimeoutMs,
    );
    const endpoint = String(metadata.endpoint || "").replace(/\/$/, "");
    const model = String(metadata.model || service?.model || service?.serviceName || "");
    if (!endpoint || !model) return blockedOutput(room, "Direct 0G Compute broker provider metadata is missing endpoint/model.");

    const messages = buildPrompt(input);
    const requestBody = computeRequestBody(model, messages);
    const requestHash = sha256(stableJson({ endpoint, model, providerAddress, input, messages }));
    const headers = await withTimeout(
      "Direct 0G Compute broker request headers",
      broker.inference.getRequestHeaders(providerAddress, JSON.stringify(requestBody)),
      brokerOperationTimeoutMs,
    );
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(numberEnv("OG_COMPUTE_FETCH_TIMEOUT_MS", 12_000)),
    });
    if (!response.ok) {
      return blockedOutput(room, `Direct 0G Compute broker request failed: ${response.status} ${await response.text()}`);
    }

    const router = await response.json() as RouterResponse;
    router.provider ||= providerAddress;
    const chatId = response.headers.get("ZG-Res-Key") || router.x_0g_trace?.request_id || router.id || "";
    const content = router.choices?.[0]?.message?.content;
    if (!content) return blockedOutput(room, "Direct 0G Compute broker returned no assistant content.");
    let teeVerified: boolean | null = router.x_0g_trace?.tee_verified ?? null;
    if (chatId && teeVerified !== true) {
      try {
        teeVerified = await withTimeout(
          "Direct 0G Compute broker response verification",
          broker.inference.processResponse(providerAddress, chatId),
          brokerOperationTimeoutMs,
        );
      } catch {
        teeVerified ??= null;
      }
    }
    router.id ||= chatId;
    router.x_0g_trace = {
      ...(router.x_0g_trace ?? {}),
      provider: providerAddress,
      request_id: chatId,
      tee_verified: teeVerified ?? undefined,
    };
    return normalizeOutput(JSON.parse(extractJson(content)), input, router, endpoint, model, requestHash, "broker");
  } catch (error) {
    return blockedOutput(room, `Direct 0G Compute broker failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function blockedOutput(room: DraftRoom, reason: string): MatchComputeOutput {
  return {
    schema: "0g-world-cup-compute-output-v1",
    roomId: room.id,
    authority: "blocked",
    homeScore: 0,
    awayScore: 0,
    winnerTeamId: room.teams[0]?.id || "home",
    winner: room.teams[0]?.name || "Home",
    mvpPlayerId: room.teams[0]?.picks[0]?.id || "",
    highlights: [],
    tacticalSummary: "0G Compute is blocked.",
    winExplanation: reason,
    resultHash: "",
    storageUri: "",
    computeMode: "0G Compute blocked",
    blocker: reason,
  };
}

export async function runMatchCompute(roomInput: DraftRoom): Promise<MatchComputeOutput> {
  loadLocalEnv();
  const room = completeDraft(roomInput);
  const input = buildMatchComputeInput(room);
  const computeEnvs = getComputeEnvCandidates();
  const fetchTimeoutMs = numberEnv("OG_COMPUTE_FETCH_TIMEOUT_MS", 12_000);
  const brokerTimeoutMs = numberEnv("OG_COMPUTE_BROKER_TOTAL_TIMEOUT_MS", 18_000);

  const routerBlockers: string[] = [];
  if (!computeEnvs.length) {
    routerBlockers.push("Missing OG_COMPUTE_API_KEY, VITE_OG_COMPUTE_API_KEY, or ZEROG_ROUTER_API_KEY.");
  }
  for (const env of computeEnvs) {
    try {
      const model = await getModel(env.endpoint, env.apiKey, env.model, fetchTimeoutMs);
      const messages = buildPrompt(input);
      const requestBody = computeRequestBody(model, messages);
      const requestHash = sha256(stableJson({ endpoint: env.endpoint, model, source: env.source, input, messages }));
      const { router, content } = await fetchRouterCompletion({
        endpoint: env.endpoint,
        apiKey: env.apiKey,
        model,
        requestBody,
        timeoutMs: fetchTimeoutMs,
      });
      try {
        return normalizeOutput(JSON.parse(extractJson(content)), input, router, env.endpoint, model, requestHash, "router");
      } catch (validationError) {
        const repairMessages = buildRepairPrompt(
          input,
          content,
          validationError instanceof Error ? validationError.message : String(validationError),
        );
        const repairRequestBody = computeRequestBody(model, repairMessages);
        const repairRequestHash = sha256(
          stableJson({ endpoint: env.endpoint, model, source: env.source, input, repairMessages, previousRequestHash: requestHash }),
        );
        const repair = await fetchRouterCompletion({
          endpoint: env.endpoint,
          apiKey: env.apiKey,
          model,
          requestBody: repairRequestBody,
          timeoutMs: fetchTimeoutMs,
        });
        return normalizeOutput(
          JSON.parse(extractJson(repair.content)),
          input,
          repair.router,
          env.endpoint,
          model,
          repairRequestHash,
          "router",
        );
      }
    } catch (error) {
      routerBlockers.push(`${env.source} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  let brokerOutput: MatchComputeOutput;
  try {
    brokerOutput = await withTimeout("Direct 0G Compute broker", runBrokerCompute(room, input), brokerTimeoutMs);
  } catch (error) {
    brokerOutput = blockedOutput(room, `Direct 0G Compute broker failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (brokerOutput.authority === "compute") return brokerOutput;
  return blockedOutput(
    room,
    `0G Compute Router failed: ${routerBlockers.join(" | ")} | ${
      brokerOutput.blocker ?? "Direct 0G Compute broker did not produce a result."
    }`,
  );
}
