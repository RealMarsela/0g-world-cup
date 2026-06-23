import { writeJson } from "./shared.mjs";
import {
  jfjelstulAdapter,
  keyedJsonAdapter,
  localDemoAdapter,
} from "./adapters.mjs";

const attempts = [];
for (const adapter of [
  () =>
    keyedJsonAdapter({
      name: "balldontlie-fifa-world-cup",
      keyEnv: "BALLDONTLIE_API_KEY",
      urlEnv: "BALLDONTLIE_WORLD_CUP_URL",
    }),
  () =>
    keyedJsonAdapter({
      name: "api-football",
      keyEnv: "API_FOOTBALL_KEY",
      urlEnv: "API_FOOTBALL_PLAYERS_URL",
      authHeader: (key) => ({ "x-apisports-key": key }),
    }),
  () =>
    keyedJsonAdapter({
      name: "sportmonks",
      keyEnv: "SPORTMONKS_API_KEY",
      urlEnv: "SPORTMONKS_PLAYERS_URL",
      authHeader: (key) => ({ Authorization: key }),
    }),
  jfjelstulAdapter,
  localDemoAdapter,
]) {
  const result = await adapter();
  attempts.push({ name: result.name, status: result.status });
  if (result.rows?.length) {
    await writeJson("data/work/imported.json", {
      importedAt: new Date().toISOString(),
      adapters: attempts,
      selectedSource: result.name,
      sourceAttribution: result.sourceAttribution,
      snapshotVersion: result.snapshotVersion,
      rows: result.rows,
      raw: result.raw ?? null,
    });
    console.log(`Imported ${result.rows.length} players via ${result.name}.`);
    process.exit(0);
  }
}

await writeJson("data/work/imported.json", {
  importedAt: new Date().toISOString(),
  adapters: attempts,
  selectedSource: "none",
  sourceAttribution: "",
  snapshotVersion: "",
  rows: [],
});

throw new Error("No player adapter produced rows.");
