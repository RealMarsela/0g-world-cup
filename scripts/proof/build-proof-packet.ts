import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const { completeDraft, createRoomFromId, simulate } = await import("../../src/worldcup/game");

const roomId = process.argv[2] || "room-human-vs-agent-proof";
const room = completeDraft(createRoomFromId(roomId));
const result = simulate(room);
const packet = result.proofPacket;

if (!packet) throw new Error("Proof packet was not generated.");

const payload = { env: publicEnvSummary(), room, result, proofPacket: packet };
const file = `proof-artifacts/${room.id}-proof-packet.json`;
writeProofArtifact(`${room.id}-proof-packet.json`, payload);
writeProofArtifact("latest-proof-packet.json", payload);

console.log(JSON.stringify({
  file,
  roomId: room.id,
  mode: room.mode,
  resultHash: result.simulationHash,
  receiptHash: packet.receiptHash,
  services: packet.services.map((service) => `${service.label}:${service.status}`),
}, null, 2));
