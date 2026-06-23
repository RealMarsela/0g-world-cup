import {
  jfjelstulAdapter,
  keyedJsonAdapter,
  localDemoAdapter,
} from "./adapters.mjs";

process.env.USE_JFJELSTUL_FALLBACK ||= "1";

const checks = [
  await keyedJsonAdapter({
    name: "balldontlie-fifa-world-cup",
    keyEnv: "BALLDONTLIE_API_KEY",
    urlEnv: "BALLDONTLIE_WORLD_CUP_URL",
  }),
  await keyedJsonAdapter({
    name: "api-football",
    keyEnv: "API_FOOTBALL_KEY",
    urlEnv: "API_FOOTBALL_PLAYERS_URL",
    authHeader: (key) => ({ "x-apisports-key": key }),
  }),
  await keyedJsonAdapter({
    name: "sportmonks",
    keyEnv: "SPORTMONKS_API_KEY",
    urlEnv: "SPORTMONKS_PLAYERS_URL",
    authHeader: (key) => ({ Authorization: key }),
  }),
  await jfjelstulAdapter(),
  await localDemoAdapter(),
];

for (const check of checks) {
  console.log(
    `${check.name}: ${check.status}${check.rows ? ` (${check.rows.length} rows)` : ""}`,
  );
}
