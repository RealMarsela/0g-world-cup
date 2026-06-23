import { readJson } from "./shared.mjs";

const jfjelstulBase =
  "https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (cell || row.length) rows.push([...row, cell]);
      row = [];
      cell = "";
      if (char === "\r" && next === "\n") i += 1;
    } else {
      cell += char;
    }
  }
  if (cell || row.length) rows.push([...row, cell]);
  const [headers, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function positionFromFjelstul(row) {
  if (row.position_code === "GK") return "GK";
  if (row.position_code === "DF") return "DF";
  if (row.position_code === "MF") return "MF";
  if (row.position_code === "FW") return "FW";
  if (/goal/i.test(row.position_name)) return "GK";
  if (/def/i.test(row.position_name)) return "DF";
  if (/mid/i.test(row.position_name)) return "MF";
  return "FW";
}

function birthAge(birthDate) {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  return 2026 - born.getUTCFullYear();
}

export async function localDemoAdapter() {
  const local = await readJson("data/snapshots/local-demo-source.json");
  return {
    name: "local-json-demo",
    status: "used",
    snapshotVersion: local.snapshotVersion,
    sourceAttribution: local.sourceAttribution,
    rows: local.players,
  };
}

export async function jfjelstulAdapter() {
  if (process.env.USE_JFJELSTUL_FALLBACK !== "1") {
    return { name: "jfjelstul-worldcup", status: "available-set-USE_JFJELSTUL_FALLBACK=1" };
  }
  const [squadsText, playersText] = await Promise.all([
    fetch(`${jfjelstulBase}/squads.csv`).then((res) => res.text()),
    fetch(`${jfjelstulBase}/players.csv`).then((res) => res.text()),
  ]);
  const players = new Map(parseCsv(playersText).map((row) => [row.player_id, row]));
  const latestMen = parseCsv(squadsText)
    .filter((row) => row.tournament_id === "WC-2022")
    .slice(0, 96)
    .map((row) => {
      const details = players.get(row.player_id) ?? {};
      const given = row.given_name || details.given_name || "";
      const family = row.family_name || details.family_name || row.player_id;
      const fullName = `${given} ${family}`.trim();
      const position = positionFromFjelstul(row);
      return [
        fullName,
        family,
        row.team_name,
        row.team_code,
        Number(row.shirt_number) || 0,
        position,
        row.position_name || position,
        birthAge(details.birth_date) ?? 27,
        180,
        "National team",
      ];
    });

  return {
    name: "jfjelstul-worldcup",
    status: "used",
    snapshotVersion: "0g-world-cup-jfjelstul-2022",
    sourceAttribution:
      "Fjelstul World Cup Database v1.2.0, Joshua C. Fjelstul, CC-BY-SA 4.0; transformed for 0G World Cup demo.",
    rows: latestMen,
  };
}

export async function keyedJsonAdapter({ name, keyEnv, urlEnv, authHeader }) {
  const key = process.env[keyEnv];
  const url = process.env[urlEnv];
  if (!key) return { name, status: "missing-api-key" };
  if (!url) return { name, status: `configured-missing-${urlEnv}` };
  const res = await fetch(url, {
    headers: authHeader ? authHeader(key) : { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return { name, status: `http-${res.status}` };
  const json = await res.json();
  return {
    name,
    status: "raw-json-imported",
    snapshotVersion: `0g-world-cup-${name}-${new Date().toISOString().slice(0, 10)}`,
    sourceAttribution: `${name} response from configured endpoint ${url}`,
    raw: json,
    rows: [],
  };
}
