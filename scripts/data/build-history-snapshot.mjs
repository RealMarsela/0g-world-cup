import { sha256, writeJson } from "./shared.mjs";

const base = "https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv";
const years = new Set(Array.from({ length: 14 }, (_, index) => String(1970 + index * 4)));

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

function position(row) {
  if (["GK", "DF", "MF", "FW"].includes(row.position_code)) return row.position_code;
  if (/goal/i.test(row.position_name)) return "GK";
  if (/def/i.test(row.position_name)) return "DF";
  if (/mid/i.test(row.position_name)) return "MF";
  return "FW";
}

function ageAtYear(birthDate, year) {
  const born = birthDate ? new Date(birthDate) : null;
  if (!born || Number.isNaN(born.getTime())) return null;
  return Number(year) - born.getUTCFullYear();
}

function seedNumber(value) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function ratingFor(row, year, pos) {
  const baseByPosition = { GK: 76, DF: 74, MF: 75, FW: 76 };
  const seed = seedNumber(`${row.player_id}:${row.team_code}:${year}`) % 17;
  const modernBoost = Math.min(7, Math.floor((Number(year) - 1970) / 8));
  const shirtBoost = ["1", "7", "9", "10", "11"].includes(row.shirt_number) ? 4 : 0;
  return Math.max(58, Math.min(96, baseByPosition[pos] + seed + modernBoost + shirtBoost));
}

const [squadsText, playersText] = await Promise.all([
  fetch(`${base}/squads.csv`).then((res) => res.text()),
  fetch(`${base}/players.csv`).then((res) => res.text()),
]);

const playerDetails = new Map(parseCsv(playersText).map((row) => [row.player_id, row]));
const rawPlayers = parseCsv(squadsText)
  .filter((row) => row.tournament_id.startsWith("WC-"))
  .filter((row) => years.has(row.tournament_id.replace("WC-", "")));

const players = rawPlayers.map((row, index) => {
  const year = row.tournament_id.replace("WC-", "");
  const details = playerDetails.get(row.player_id) ?? {};
  const name = `${row.given_name || details.given_name || ""} ${row.family_name || details.family_name || row.player_id}`.trim();
  const pos = position(row);
  return {
    id: `${row.tournament_id}:${row.team_code}:${row.player_id}:${index}`,
    year: Number(year),
    tournamentId: row.tournament_id,
    teamName: row.team_name,
    teamCode: row.team_code,
    playerId: row.player_id,
    name,
    shortName: row.family_name || details.family_name || name,
    shirtNumber: Number(row.shirt_number) || 0,
    position: pos,
    detailedPosition: row.position_name || pos,
    age: ageAtYear(details.birth_date, year),
    rating: ratingFor(row, year, pos),
    sourceAttribution:
      "Fjelstul World Cup Database v1.2.0, Joshua C. Fjelstul, CC-BY-SA 4.0; transformed for 0G World Cup gameplay.",
  };
});

const teams = Array.from(
  new Map(players.map((player) => [`${player.year}:${player.teamCode}`, {
    year: player.year,
    teamName: player.teamName,
    teamCode: player.teamCode,
    playerCount: players.filter((candidate) => candidate.year === player.year && candidate.teamCode === player.teamCode).length,
  }])).values(),
).sort((a, b) => a.year - b.year || a.teamName.localeCompare(b.teamName));

const snapshot = {
  snapshotVersion: "0g-world-cup-history-1970-2022",
  formulaVersion: "ogr-history-v1",
  sourceAttribution: players[0]?.sourceAttribution ?? "",
  createdAt: new Date().toISOString(),
  hash: sha256(players),
  teams,
  players,
};

await writeJson("src/worldcup/worldcupHistory.json", snapshot);
console.log(`Wrote ${players.length} players across ${teams.length} team-year squads.`);
console.log(`Hash ${snapshot.hash}`);
