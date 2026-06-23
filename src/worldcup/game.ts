import { ZERO_G } from "../config/chain";
import { defaultAgent, rivalAgent } from "./agents";
import { players, playerSnapshotHash, snapshotVersion } from "./players";
import { buildProofPacket } from "./proofPacket";
import { hashText, scoreTeam, valueFor } from "./scoring";
import { simulateTournament } from "./tournament";
import type {
  DraftRoom,
  DraftTeam,
  Formation,
  MatchResult,
  Player,
  RoomMode,
  TacticalStyle,
} from "./types";

export const formations: Formation[] = ["4-3-3", "4-2-3-1", "3-5-2", "4-4-2"];
export const tacticalStyles: TacticalStyle[] = [
  "Balanced",
  "High Press",
  "Counter",
  "Possession",
  "Low Block",
];

function requiredByFormation(formation: Formation): Record<Player["position"], number> {
  if (formation === "3-5-2") return { GK: 1, DF: 3, MF: 5, FW: 2 };
  if (formation === "4-4-2") return { GK: 1, DF: 4, MF: 4, FW: 2 };
  if (formation === "4-2-3-1") return { GK: 1, DF: 4, MF: 5, FW: 1 };
  return { GK: 1, DF: 4, MF: 3, FW: 3 };
}

function nextPick(pool: Player[], team: DraftTeam) {
  const required = requiredByFormation(team.formation);
  const picked = team.picks.reduce(
    (acc, player) => ({ ...acc, [player.position]: acc[player.position] + 1 }),
    { GK: 0, DF: 0, MF: 0, FW: 0 },
  );
  const openPositions = Object.entries(required)
    .filter(([position, count]) => picked[position as Player["position"]] < count)
    .map(([position]) => position);
  const fitPick = pool
    .filter((player) => openPositions.includes(player.position))
    .sort((a, b) => valueFor(b, team.formation, team.tacticalStyle) - valueFor(a, team.formation, team.tacticalStyle))[0];
  return fitPick ?? pool.sort((a, b) => valueFor(b, team.formation, team.tacticalStyle) - valueFor(a, team.formation, team.tacticalStyle))[0];
}

export function inferRoomMode(roomId = ""): RoomMode {
  if (roomId.includes("testnet-group-pot")) return "testnet-group-pot";
  if (roomId.includes("free-group")) return "free-group";
  if (roomId.includes("agent-vs-agent")) return "agent-vs-agent";
  if (roomId.includes("human-vs-agent") || roomId.includes("agent")) return "human-vs-agent";
  if (roomId.includes("testnet-wager-1v1") || roomId.includes("wager")) return "testnet-wager-1v1";
  if (roomId.includes("solo-free") || roomId.includes("solo")) return "solo-free";
  return "free-1v1";
}

function makeTeam(id: string, name: string, kind: DraftTeam["kind"], formation: Formation, tacticalStyle: TacticalStyle): DraftTeam {
  return { id, name, kind, formation, tacticalStyle, picks: [] };
}

export function createRoom(mode: RoomMode = "solo-free"): DraftRoom {
  const teams: DraftTeam[] =
    mode === "free-group" || mode === "testnet-group-pot"
      ? [
          makeTeam("home", "Gabriel XI", "human", "4-3-3", "Possession"),
          makeTeam("rival", "Rival XI", "human", "4-2-3-1", "High Press"),
          makeTeam("atlas", "Atlas XI", "human", "3-5-2", "Counter"),
          makeTeam("north", "North Star XI", "human", "4-4-2", "Low Block"),
        ]
      : mode === "agent-vs-agent"
        ? [
            makeTeam("agent-a", defaultAgent.displayName, "agent", "3-5-2", "Counter"),
            makeTeam("agent-b", rivalAgent.displayName, "agent", "4-3-3", "Balanced"),
          ]
        : [
            makeTeam("home", mode.includes("agent") ? "Gabriel XI" : "Player XI", "human", "4-3-3", "Possession"),
            makeTeam(
              "away",
              mode === "solo-free" ? "Default Simulation" : mode.includes("agent") ? defaultAgent.displayName : "Rival XI",
              mode.includes("agent") ? "agent" : mode === "solo-free" ? "simulation" : "human",
              mode.includes("agent") ? "3-5-2" : "4-2-3-1",
              mode.includes("agent") ? "Counter" : "High Press",
            ),
          ];
  return {
    id: `room-${mode}-${snapshotVersion.split("-").at(-1)}`,
    mode,
    wagerAmount: mode.includes("wager") || mode.includes("pot") ? "1 testnet 0G" : "free",
    snapshotVersion,
    snapshotHash: playerSnapshotHash,
    turnIndex: 0,
    teams,
    draftLog: [],
  };
}

export function createRoomFromId(roomId: string): DraftRoom {
  const room = createRoom(inferRoomMode(roomId));
  room.id = roomId;
  return room;
}

export function completeDraft(room: DraftRoom): DraftRoom {
  const next: DraftRoom = JSON.parse(JSON.stringify(room));
  const pool = [...players];
  const rounds = 11;

  for (let round = 0; round < rounds; round += 1) {
    const order = round % 2 === 0 ? next.teams : [...next.teams].reverse();
    for (const team of order) {
      const available = pool.filter((player) => !next.teams.some((t) => t.picks.some((p) => p.id === player.id)));
      const pick = nextPick(available, team);
      if (pick) {
        team.picks.push(pick);
        if (!team.captainId && (pick.shirtNumber === 10 || pick.position === "GK")) team.captainId = pick.id;
        next.draftLog.push(`${team.name} drafted ${pick.shortName} (${pick.countryCode})`);
      }
    }
  }

  for (const team of next.teams) {
    team.captainId ||= team.picks[0]?.id;
  }
  next.turnIndex = 22;
  return next;
}

export function simulate(roomInput: DraftRoom): MatchResult {
  const room = roomInput.teams.every((team) => team.picks.length === 11)
    ? roomInput
    : completeDraft(roomInput);
  const [home, away] = room.teams;
  const lineupHash = hashText(JSON.stringify(room.teams.map((team) => team.picks.map((player) => player.id))));

  if (room.teams.length > 2) {
    return simulateTournament(room, lineupHash);
  }

  const homePower = scoreTeam(home, room);
  const awayPower = scoreTeam(away, room);
  const spread = Math.abs(homePower - awayPower);
  const homeScore = Math.max(0, 1 + Math.floor(homePower / 1700) + (homePower > awayPower ? 1 : 0));
  const awayScore = Math.max(0, 1 + Math.floor(awayPower / 1700) + (awayPower > homePower ? 1 : 0));
  const winner = homeScore === awayScore ? (homePower >= awayPower ? home.name : away.name) : homeScore > awayScore ? home.name : away.name;
  const winningTeam = winner === home.name ? home : away;
  const mvp = [...winningTeam.picks].sort((a, b) => b.attributes.clutch + b.worldRating - (a.attributes.clutch + a.worldRating))[0];
  const simulationHash = hashText(`${room.id}:${lineupHash}:${homePower}:${awayPower}:${winner}`);

  const result: MatchResult = {
    type: "match",
    roomId: room.id,
    home: home.name,
    away: away.name,
    homeScore,
    awayScore,
    winner,
    mvp,
    events: [
      `${mvp.shortName} tilted the match with a ${mvp.attributes.clutch} clutch rating.`,
      `${winningTeam.tacticalStyle} created the decisive edge over ${spread} power points.`,
      `Snapshot ${room.snapshotVersion} locked before kickoff.`,
    ],
    tacticalSummary: `${winningTeam.name} won through ${winningTeam.formation} spacing, ${winningTeam.tacticalStyle.toLowerCase()} triggers, and captain leverage.`,
    winExplanation: `${winner} had the stronger formation fit after draft scarcity removed duplicate picks from the room pool.`,
    lineupHash,
    simulationHash,
    storageUri: `0g://local-demo/${simulationHash.slice(2)}`,
    computeMode: ZERO_G.computeMode,
  };
  result.proofPacket = buildProofPacket(room, result);
  return result;
}

export function roomReceipt(room: DraftRoom, result?: MatchResult) {
  return {
    roomId: room.id,
    mode: room.mode,
    wagerAmount: room.wagerAmount,
    playerSnapshotHash: room.snapshotHash,
    lineupHash: result?.lineupHash ?? hashText(JSON.stringify(room.teams)),
    resultHash: result?.simulationHash ?? "",
    storageUri: result?.storageUri ?? "",
    receiptHash: result?.proofPacket?.receiptHash ?? "",
    resultType: result?.type ?? "",
    entrants: room.teams.length,
    tournamentTable: result?.table?.map((standing) => `${standing.team}:${standing.points}`).join(", ") ?? "",
    chainId: ZERO_G.chainId,
  };
}
