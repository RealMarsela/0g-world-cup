import { expect, test } from "@playwright/test";

function apiRoom() {
  return {
    id: "room-human-vs-agent-api-e2e",
    mode: "human-vs-agent",
    wagerAmount: "free",
    snapshotVersion: "0g-world-cup-history-1970-2022",
    snapshotHash: "0x10083228b84402ab9d2ac1f65629aaeebddd2bcdc20597ac2cca3a44b9d44026",
    turnIndex: 0,
    draftLog: [],
    teams: [
      { id: "home", name: "API XI", kind: "human", formation: "4-3-3", tacticalStyle: "Possession", picks: [] },
      { id: "away", name: "ZeroNine Scout", kind: "agent", formation: "3-5-2", tacticalStyle: "Counter", picks: [] },
    ],
  };
}

function deterministicResult() {
  return {
    type: "match",
    roomId: "room-human-vs-agent-api-e2e",
    home: "API XI",
    away: "ZeroNine Scout",
    homeScore: 1,
    awayScore: 0,
    winner: "API XI",
    mvp: {
      id: "api-player",
      providerIds: {},
      name: "API Player",
      shortName: "API",
      country: "Test",
      countryCode: "TST",
      squad: "API XI",
      shirtNumber: 10,
      position: "FW",
      detailedPosition: "forward",
      age: 25,
      height: 180,
      club: "",
      statsSource: "test",
      ratingSource: "test",
      worldRating: 90,
      attributes: { pace: 80, finishing: 80, passing: 80, control: 80, defense: 50, physical: 75, clutch: 85 },
      snapshotVersion: "0g-world-cup-history-1970-2022",
      sourceAttribution: "test",
    },
    events: ["Deterministic API fixture."],
    tacticalSummary: "Deterministic fixture.",
    winExplanation: "Deterministic fixture.",
    lineupHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    simulationHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    storageUri: "0g://local-demo/api",
    computeMode: "deterministic fallback",
    computeAuthority: "deterministic-background",
  };
}

test("runtime finalization rejects deterministic results", async ({ request }) => {
  const response = await request.post("/api/match/finalize", {
    data: { room: apiRoom(), result: deterministicResult() },
  });
  expect(response.status()).toBe(409);
  const body = await response.json() as { error?: string; reason?: string };
  expect(body.error).toBe("FINALIZE_REQUIRES_COMPUTE_RESULT");
  expect(body.reason).toMatch(/0G Compute-authoritative/i);
});

test("runtime compute endpoint is explicit when Compute is unavailable", async ({ request }) => {
  const response = await request.post("/api/match/compute", {
    data: { room: apiRoom() },
  });
  expect([200, 503]).toContain(response.status());
  const body = await response.json() as { error?: string; reason?: string; result?: Record<string, unknown> };
  if (response.status() === 503) {
    expect(body.error).toBe("COMPUTE_BLOCKED");
    expect(body.reason).toMatch(/0G Compute|Router|balance|provider|key/i);
  } else {
    expect(body.result?.computeAuthority).toBe("compute");
  }
});
