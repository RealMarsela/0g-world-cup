import { expect, test } from "@playwright/test";

test("major product routes render their game and 0G surfaces", async ({ page }) => {
  const routes = [
    { path: "/", heading: /Draft the World Cup like an agent swarm/i, text: "0G Galileo" },
    { path: "/room/create", heading: "Create a draft room", text: "Testnet wager" },
    { path: "/room/room-human-vs-agent-e2e", heading: "room-human-vs-agent-e2e", text: "Operational state" },
    { path: "/draft/room-human-vs-agent-e2e", heading: "Draft before kickoff.", text: "roll-a-nation draft" },
    { path: "/simulate/room-human-vs-agent-e2e", heading: "Ready to start.", text: "Kickoff pending" },
    { path: "/result/room-human-vs-agent-e2e", heading: /wins|champions/i, text: "MVP" },
    { path: "/proof/room-human-vs-agent-chain-1782223853", heading: "room-human-vs-agent-chain-1782223853", text: "Latest 0G artifacts" },
    { path: "/agents", heading: "Registered AI agents", text: "Agentic ID #2" },
    { path: "/leaderboard", heading: "Proof-ranked rooms", text: "0x" },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    await expect(page.getByText(route.text).first()).toBeVisible();
  }
});

test("room draft starts from setup and reaches rolling roster", async ({ page }) => {
  await page.goto("/draft/room-free-1v1-e2e");
  await page.getByLabel("Team name").fill("Browser XI");
  await page.getByTestId("start-room-draft").click();
  await expect(page.getByText("Browser XI").first()).toBeVisible();
  await expect(page.getByText(/rerolls left/i).first()).toBeVisible();
  await expect(page.getByText(/Group draft lanes|Opponent draft lane/i)).toBeVisible();
});
