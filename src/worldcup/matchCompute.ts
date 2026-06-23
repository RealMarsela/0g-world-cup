import { buildProofPacket } from "./proofPacket";
import { hashText } from "./scoring";
import type { MatchComputeInput, MatchComputeOutput } from "./computeTypes";
import type { DraftRoom, MatchResult } from "./types";

export function buildMatchComputeInput(room: DraftRoom): MatchComputeInput {
  const lineupHash = hashText(JSON.stringify(room.teams.map((team) => ({
    id: team.id,
    formation: team.formation,
    tacticalStyle: team.tacticalStyle,
    captainId: team.captainId,
    picks: team.picks.map((player) => player.id),
  }))));
  return {
    schema: "0g-world-cup-compute-input-v1",
    roomId: room.id,
    authority: room.teams.some((team) => team.kind === "human" || team.kind === "agent")
      ? "compute"
      : "deterministic-background",
    snapshotHash: room.snapshotHash,
    lineupHash,
    kickoffSeed: hashText(`${room.id}:${room.snapshotHash}:${lineupHash}`),
    allowedRecalculations: 2,
    room,
  };
}

export function buildMatchResultFromCompute(room: DraftRoom, output: MatchComputeOutput): MatchResult {
  const [home, away] = room.teams;
  const mvp = room.teams.flatMap((team) => team.picks).find((player) => player.id === output.mvpPlayerId) || home?.picks[0];
  if (!home || !away || !mvp) {
    throw new Error("Cannot build a match result without two drafted teams and an MVP.");
  }
  const result: MatchResult = {
    type: "match",
    roomId: room.id,
    home: home.name,
    away: away.name,
    homeScore: output.homeScore,
    awayScore: output.awayScore,
    winner: output.winner,
    mvp,
    events: output.highlights.map((highlight) => `${highlight.minute}' ${highlight.kind.toUpperCase()} ${highlight.teamName}: ${highlight.narration}`),
    tacticalSummary: output.tacticalSummary,
    winExplanation: output.winExplanation,
    lineupHash: buildMatchComputeInput(room).lineupHash,
    simulationHash: output.resultHash || hashText(JSON.stringify(output)),
    storageUri: output.storageUri,
    computeMode: output.computeMode,
    computeAuthority: output.authority,
    computeReceipt: output.receipt,
    highlights: output.highlights,
    blocker: output.blocker,
  };
  result.proofPacket = buildProofPacket(room, result);
  return result;
}
