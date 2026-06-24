import { CONTRACTS, ZERO_G, explorerAddress } from "../config/chain";
import { hashText } from "./scoring";
import type { DraftRoom, MatchResult, ZeroGProofPacket, ZeroGServiceProof } from "./types";

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

function chainProof(): ZeroGServiceProof {
  const configured = Boolean(CONTRACTS.draft && CONTRACTS.escrow && CONTRACTS.results);
  return {
    name: "chain",
    label: "0G Chain",
    status: configured ? "ready" : "blocked",
    summary: configured
      ? "Galileo contracts are configured for lineup, escrow, and result commitments."
      : "Missing one or more deployed contract addresses in the runtime environment.",
    artifact: configured ? `${CONTRACTS.draft}, ${CONTRACTS.escrow}, ${CONTRACTS.results}` : undefined,
    explorerUrl: configured ? explorerAddress(CONTRACTS.results) : ZERO_G.explorer,
  };
}

function storageProof(result: MatchResult): ZeroGServiceProof {
  const live = Boolean(result.storageUri && !result.storageUri.includes("local-demo"));
  return {
    name: "storage",
    label: "0G Storage",
    status: live ? "live" : "ready",
    summary: live
      ? "Receipt payload is mirrored to 0G Storage."
      : "Receipt payload is local and deterministic; live 0G Storage proof is shown in the artifact matrix.",
    artifact: result.storageUri,
  };
}

function computeProof(result: MatchResult): ZeroGServiceProof {
  const live = result.computeAuthority === "compute";
  const blocked = result.computeAuthority === "blocked";
  return {
    name: "compute",
    label: "0G Compute",
    status: live ? "live" : blocked ? "blocked" : "fallback",
    summary: live
      ? "This result was adjudicated by the 0G Compute Router."
      : blocked
        ? result.blocker ?? "0G Compute did not produce a result."
        : "This result is deterministic background or local fallback output, not a live 0G Compute adjudication.",
    artifact: live ? result.computeReceipt?.requestId ?? result.computeMode : result.blocker ?? result.computeMode,
  };
}

function daProof(result: MatchResult): ZeroGServiceProof {
  return {
    name: "da",
    label: "0G DA",
    status: "ready",
    summary: "Match and tournament receipts are shaped into a byte-ready blob; live DA submission status is shown in the artifact matrix.",
    artifact: `events:${result.events.length}`,
  };
}

function agenticProof(room: DraftRoom): ZeroGServiceProof {
  const hasAgent = room.teams.some((team) => team.kind === "agent");
  return {
    name: "agentic-id",
    label: "Agentic ID",
    status: hasAgent ? "ready" : "planned",
    summary: hasAgent
      ? "Room includes AI-agent participants ready to map to ERC-7857 metadata."
      : "No registered agent in this room; solo and human rooms keep the hook visible.",
    artifact: hasAgent ? room.teams.filter((team) => team.kind === "agent").map((team) => team.name).join(", ") : undefined,
  };
}

export function buildProofPacket(room: DraftRoom, result: MatchResult): ZeroGProofPacket {
  const payload = {
    roomId: room.id,
    mode: room.mode,
    snapshotVersion: room.snapshotVersion,
    snapshotHash: room.snapshotHash,
    lineupHash: result.lineupHash,
    resultHash: result.simulationHash,
    winner: result.winner,
    storageUri: result.storageUri,
    computeMode: result.computeMode,
    events: result.events,
  };
  const receiptHash = hashText(stableJson(payload));
  return {
    schema: "0g-world-cup-proof-v1",
    roomId: room.id,
    mode: room.mode,
    generatedAt: new Date(0).toISOString(),
    chainId: ZERO_G.chainId,
    snapshotVersion: room.snapshotVersion,
    snapshotHash: room.snapshotHash,
    lineupHash: result.lineupHash,
    resultHash: result.simulationHash,
    storageUri: result.storageUri,
    receiptHash,
    services: [chainProof(), storageProof(result), computeProof(result), daProof(result), agenticProof(room)],
  };
}
