import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const { completeDraft, createRoomFromId } = await import("../../src/worldcup/game");
const { buildMatchResultFromCompute } = await import("../../src/worldcup/matchCompute");
const { runMatchCompute } = await import("../../src/server/compute/runMatchCompute");

const roomId = process.argv[2] || "room-human-vs-agent-runtime-compute";
const room = completeDraft(createRoomFromId(roomId));
const output = await runMatchCompute(room);

const artifact = output.authority === "compute"
  ? {
      status: "live",
      roomId,
      output,
      result: buildMatchResultFromCompute(room, output),
      env: publicEnvSummary(),
    }
  : {
      status: "blocked",
      roomId,
      output,
      reason: output.blocker || "Runtime 0G Compute did not produce an authoritative result.",
      env: publicEnvSummary(),
    };

writeProofArtifact("compute-runtime-latest.json", artifact);
console.log(JSON.stringify({
  status: artifact.status,
  roomId,
  reason: "reason" in artifact ? artifact.reason : undefined,
  mode: output.computeMode,
  authority: output.authority,
}, null, 2));
