import assert from "node:assert/strict";

const { completeDraft, createRoom, simulate, formations } = await import("../../src/worldcup/game");
const {
  addHistoryPick,
  benchPicks,
  decidePick,
  eligibleTeams,
  historySnapshot,
  isHistoryDraftComplete,
  playersForTeam,
  slotsForFormation,
  starterPicks,
  swapHistorySub,
} = await import("../../src/worldcup/historyDraft");
const {
  createSoloTournament,
  initialLiveMatch,
  advanceLiveMatch,
  simulatedScore,
} = await import("../../src/worldcup/soloTournament");
const {
  continueSoloTournament,
  recordSoloMatch,
  resolvePenaltyShootout,
} = await import("../../src/worldcup/soloTournamentFlow");
const { buildProofPacket } = await import("../../src/worldcup/proofPacket");
const { hashText } = await import("../../src/worldcup/scoring");
const { buildMatchResultFromCompute } = await import("../../src/worldcup/matchCompute");

const allModes = ["solo-free", "free-1v1", "free-group", "testnet-wager-1v1", "testnet-group-pot", "human-vs-agent", "agent-vs-agent"] as const;

for (const mode of allModes) {
  const room = completeDraft(createRoom(mode));
  assert.equal(room.teams.every((team) => team.picks.length === 11), true, `${mode} must draft full XIs`);
  assert.equal(new Set(room.teams.flatMap((team) => team.picks.map((player) => player.id))).size, room.teams.length * 11, `${mode} duplicate draft picks`);
  assert.equal(room.snapshotVersion, historySnapshot.snapshotVersion, `${mode} uses canonical history snapshot`);
  assert.match(room.snapshotHash, /^0x[a-f0-9]{64}$/i, `${mode} snapshot hash`);
  if (mode.includes("wager") || mode.includes("pot")) assert.notEqual(room.wagerAmount, "free", `${mode} wager flag`);
  else assert.equal(room.wagerAmount, "free", `${mode} free flag`);
  const result = simulate(room);
  assert.ok(result.lineupHash.startsWith("0x"), `${mode} lineup hash`);
  assert.ok(result.simulationHash.startsWith("0x"), `${mode} result hash`);
  assert.ok(result.storageUri.startsWith("0g://"), `${mode} storage URI`);
  assert.ok(result.proofPacket?.receiptHash.startsWith("0x"), `${mode} proof packet`);
  assert.equal(result.proofPacket?.services.length, 5, `${mode} covers all 0G services`);
  assert.equal(result.proofPacket?.services.find((service) => service.name === "compute")?.status, "fallback", `${mode} deterministic result must not masquerade as live Compute`);
  if (room.teams.length > 2) {
    assert.equal(result.type, "tournament", `${mode} tournament result type`);
    assert.equal(result.matches?.length, (room.teams.length * (room.teams.length - 1)) / 2, `${mode} round robin matches`);
    assert.equal(result.table?.length, room.teams.length, `${mode} table length`);
  }
}

for (const formation of formations) {
  const slots = slotsForFormation(formation);
  assert.equal(slots.length, 11, `${formation} has XI slots`);
  assert.equal(slots.filter((slot) => slot.position === "GK").length, 1, `${formation} has one GK`);
}

let picks = [];
const draftTeam = eligibleTeams.find((team) => playersForTeam(team).some((player) => player.position === "GK"));
assert.ok(draftTeam, "history draft needs an eligible team");
for (const player of playersForTeam(draftTeam)) {
  const next = addHistoryPick(player, picks, "4-3-3");
  if (next !== picks) picks = next;
  if (isHistoryDraftComplete(picks)) break;
}
assert.equal(starterPicks(picks).length, 11, "history draft fills XI starters");
assert.equal(benchPicks(picks).length, 3, "history draft fills three subs");
assert.equal(isHistoryDraftComplete(picks), true, "history draft complete");
const duplicateDecision = decidePick(picks[0].player, picks, "4-3-3");
assert.equal(duplicateDecision.kind, "disabled", "already picked player disabled");
const swapped = swapHistorySub(picks, starterPicks(picks)[0].player.id, benchPicks(picks)[0].player.id);
assert.equal(starterPicks(swapped).length, 11, "sub swap preserves XI starters");
assert.equal(benchPicks(swapped).length, 3, "sub swap preserves bench count");
assert.notEqual(starterPicks(swapped)[0].player.id, starterPicks(picks)[0].player.id, "sub enters starter slot");

let tournament = createSoloTournament("Gabriel XI", picks, "Possession");
assert.equal(tournament.groups.length, 8, "solo creates eight groups");
assert.equal(tournament.groups.every((group) => group.teams.length === 4), true, "solo groups are four teams each");
let liveMatch = initialLiveMatch();
liveMatch = advanceLiveMatch({
  match: liveMatch,
  picks,
  tactic: "Possession",
  teamName: "Gabriel XI",
  opponent: tournament.userOpponent,
  minutes: 90,
});
assert.equal(liveMatch.complete, true, "live match reaches FT after 90 one-minute ticks");
tournament = recordSoloMatch(tournament, { ...liveMatch, homeScore: 2, awayScore: 0 }, "Gabriel XI");
assert.equal(tournament.awaitingNext, true, "solo waits for next match after matchday");
tournament = continueSoloTournament(tournament);
assert.equal(tournament.awaitingNext, false, "continue unlocks next solo match");

const knockoutTournament = {
  ...tournament,
  stage: "knockout" as const,
  currentRoundIndex: 0,
  awaitingNext: false,
  needsPenalties: false,
  bracket: [{
    round: "Round of 32" as const,
    home: "Gabriel XI",
    away: tournament.userOpponent.name,
    score: "",
    winner: "",
    status: "pending" as const,
    isUser: true,
  }],
};
const drawTournament = recordSoloMatch(knockoutTournament, { ...liveMatch, homeScore: 1, awayScore: 1 }, "Gabriel XI");
assert.equal(drawTournament.needsPenalties, true, "knockout draw requires penalties");
const penaltyResult = resolvePenaltyShootout(drawTournament, { ...liveMatch, homeScore: 1, awayScore: 1 }, "Gabriel XI");
assert.equal(penaltyResult.tournament.needsPenalties, false, "penalties resolve knockout draw");
assert.ok(penaltyResult.match.events[0].text.includes("Penalty shootout"), "penalty event is narrated");

const noDraw = simulatedScore(
  { ...tournament.groups[0].teams[0], rating: 900 },
  { ...tournament.groups[0].teams[1], rating: 900 },
  true,
);
assert.notEqual(noDraw.homeGoals, noDraw.awayGoals, "no-draw background knockout score resolves winner");

const deterministicRoom = completeDraft(createRoom("human-vs-agent"));
const deterministicResult = simulate(deterministicRoom);
const deterministicProof = buildProofPacket(deterministicRoom, {
  ...deterministicResult,
  computeMode: "0G Compute Router",
  computeAuthority: "deterministic-background",
});
assert.equal(deterministicProof.services.find((service) => service.name === "compute")?.status, "fallback", "env text cannot promote deterministic result to live Compute");

const computeResult = buildMatchResultFromCompute(deterministicRoom, {
  schema: "0g-world-cup-compute-output-v1",
  authority: "compute",
  roomId: deterministicRoom.id,
  homeScore: 2,
  awayScore: 1,
  winner: deterministicRoom.teams[0].name,
  mvpPlayerId: deterministicRoom.teams[0].picks[0].id,
  highlights: [{
    minute: 12,
    kind: "goal",
    teamName: deterministicRoom.teams[0].name,
    playerName: deterministicRoom.teams[0].picks[0].shortName,
    narration: "Compute-authored opener.",
    xG: 0.42,
  }],
  tacticalSummary: "Compute tactics summary.",
  winExplanation: "Compute explanation.",
  resultHash: hashText("compute-result"),
  storageUri: "0g://storage/0x1111111111111111111111111111111111111111111111111111111111111111",
  computeMode: "0G Compute Router",
  receipt: {
    provider: "0x0000000000000000000000000000000000000001",
    requestId: "req-logic",
    model: "glm-5.1",
    promptHash: hashText("prompt"),
    responseHash: hashText("response"),
  },
});
assert.equal(computeResult.proofPacket?.services.find((service) => service.name === "compute")?.status, "live", "Compute-authoritative result is live");

console.log("app logic ok: modes, drafts, solo cup, penalties, compute authority, proof packet");
