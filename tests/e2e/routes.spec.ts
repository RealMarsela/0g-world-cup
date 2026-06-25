import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

function readArtifact(name: string) {
  return JSON.parse(readFileSync(`public/proof-artifacts/${name}`, "utf8")) as Record<string, unknown>;
}

test("major product routes render their game and 0G surfaces", async ({ page }) => {
  const routes = [
    { path: "/", heading: /The redline World Cup arena for humans and agents/i, text: "0G Galileo" },
    { path: "/room/create", heading: "Create a draft room", text: "Testnet wager" },
    { path: "/room/room-human-vs-agent-e2e", heading: "room-human-vs-agent-e2e", text: "Operational state" },
    { path: "/draft/room-human-vs-agent-e2e", heading: "Draft before kickoff.", text: "roll-a-nation draft" },
    { path: "/simulate/room-human-vs-agent-e2e", heading: "Ready to start.", text: "Kickoff pending" },
    { path: "/result/room-human-vs-agent-e2e", heading: "Result locked until 0G Compute kickoff", text: "Compute result required" },
    { path: "/proof/room-human-vs-agent-chain-1782223853", heading: "room-human-vs-agent-chain-1782223853", text: "Latest 0G artifacts" },
    { path: "/agents", heading: "Registered AI agents", text: "Live Agentic ID readback" },
    { path: "/leaderboard", heading: "Proof-ranked rooms", text: "0x" },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    await expect(page.getByText(route.text).first()).toBeVisible();
  }
});

test("leaderboard renders live 0G proof entries", async ({ page }) => {
  const chainResult = readArtifact("chain-result-latest.json");
  const wager = readArtifact("wager-settlement-latest.json");
  const storage = readArtifact("storage-latest.json");
  await page.goto("/leaderboard");
  const panel = page.getByTestId("zero-g-leaderboard-proof");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Live 0G leaderboard proof");
  await expect(panel).toContainText("Result commitment");
  await expect(panel).toContainText(String(chainResult.roomId));
  await expect(panel).toContainText(String(chainResult.txHash).slice(0, 12));
  await expect(panel).toContainText("Wager settlement");
  await expect(panel).toContainText(String(wager.roomId));
  await expect(panel).toContainText(String((wager.transactions as Record<string, unknown>).settle).slice(0, 12));
  await expect(panel).toContainText("Storage receipt");
  await expect(panel).toContainText(String(storage.roomId));
  await expect(panel).toContainText(String(storage.rootHash).slice(0, 12));
});

test("wager room setup renders live escrow readiness", async ({ page }) => {
  const escrow = readArtifact("escrow-readiness-latest.json");
  const wallet = readArtifact("browser-wallet-latest.json");
  const wager = readArtifact("wager-settlement-latest.json");
  await page.goto("/room/create");
  await page.getByRole("button", { name: "Testnet wager" }).click();
  await expect(page.getByRole("button", { name: "Testnet wager" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Free" })).toHaveAttribute("aria-pressed", "false");
  const panel = page.getByTestId("zero-g-escrow-readiness");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Live escrow readiness");
  await expect(panel).toContainText("0G wager start gate");
  await expect(panel).toContainText(String(escrow.contract).slice(0, 12));
  await expect(panel).toContainText(`${String((escrow.escrow as Record<string, unknown>).depositCount)} / ${String(escrow.requiredDeposits)}`);
  await expect(panel).toContainText("requiresTwoDeposits:ok");
  await expect(panel).toContainText(String((wallet.transactions as Record<string, unknown>).deposit).slice(0, 12));
  await expect(panel).toContainText(String((wager.transactions as Record<string, unknown>).settle).slice(0, 12));
});

test("testnet wager room shows escrow gate before draft", async ({ page }) => {
  const escrow = readArtifact("escrow-readiness-latest.json");
  await page.goto("/room/room-testnet-wager-1v1-e2e");
  await expect(page.getByRole("heading", { name: "room-testnet-wager-1v1-e2e" })).toBeVisible();
  const panel = page.getByTestId("zero-g-escrow-readiness");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("0G wager start gate");
  await expect(panel).toContainText(String(escrow.contract).slice(0, 12));
  await expect(page.getByRole("link", { name: "Enter draft" })).toHaveAttribute("href", "/draft/room-testnet-wager-1v1-e2e");
});

test("result page does not show fake deterministic winner for real fixtures", async ({ page }) => {
  await page.goto("/result/room-human-vs-agent-e2e");
  await expect(page.getByTestId("result-compute-locked")).toBeVisible();
  await expect(page.getByTestId("zero-g-runtime-gate")).toBeVisible();
  await expect(page.getByRole("link", { name: "X intent" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download PNG" })).toHaveCount(0);
  await expect(page.getByTestId("zero-g-proof-stack")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open kickoff" })).toHaveAttribute("href", "/simulate/room-human-vs-agent-e2e");
});

test("room draft starts from setup and reaches rolling roster", async ({ page }) => {
  await page.goto("/draft/room-free-1v1-e2e");
  await page.getByLabel("Team name").fill("Browser XI");
  await page.getByTestId("start-room-draft").click();
  await expect(page.getByText("Browser XI").first()).toBeVisible();
  await expect(page.getByText(/rerolls left/i).first()).toBeVisible();
  await expect(page.getByText(/Group draft lanes|Opponent draft lane/i)).toBeVisible();
});
