import { ZERO_G } from "../config/chain";
import { buildProofPacket } from "./proofPacket";
import { hashText, scoreTeam } from "./scoring";
import type { DraftRoom, MatchResult, TournamentMatch, TournamentStanding } from "./types";

function scorePair(room: DraftRoom, homeIndex: number, awayIndex: number): TournamentMatch {
  const home = room.teams[homeIndex];
  const away = room.teams[awayIndex];
  const homePower = scoreTeam(home, room);
  const awayPower = scoreTeam(away, room);
  const homeScore = Math.max(0, 1 + Math.floor(homePower / 1700) + (homePower > awayPower ? 1 : 0));
  const awayScore = Math.max(0, 1 + Math.floor(awayPower / 1700) + (awayPower > homePower ? 1 : 0));
  const winner = homeScore === awayScore ? "Draw" : homeScore > awayScore ? home.name : away.name;
  return {
    home: home.name,
    away: away.name,
    homeScore,
    awayScore,
    winner,
    simulationHash: hashText(`${room.id}:${home.id}:${away.id}:${homePower}:${awayPower}:${winner}`),
  };
}

function standingsFor(matches: TournamentMatch[], room: DraftRoom): TournamentStanding[] {
  const table = new Map<string, TournamentStanding>();
  for (const team of room.teams) {
    table.set(team.name, {
      team: team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    const home = table.get(match.home);
    const away = table.get(match.away);
    if (!home || !away) continue;
    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;
    if (match.homeScore === match.awayScore) {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    } else if (match.homeScore > match.awayScore) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    }
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  return [...table.values()].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
}

export function simulateTournament(room: DraftRoom, lineupHash: string): MatchResult {
  const matches: TournamentMatch[] = [];
  for (let homeIndex = 0; homeIndex < room.teams.length; homeIndex += 1) {
    for (let awayIndex = homeIndex + 1; awayIndex < room.teams.length; awayIndex += 1) {
      matches.push(scorePair(room, homeIndex, awayIndex));
    }
  }
  const table = standingsFor(matches, room);
  const champion = table[0];
  const championTeam = room.teams.find((team) => team.name === champion.team) ?? room.teams[0];
  const mvp = [...championTeam.picks].sort((a, b) => b.attributes.clutch + b.worldRating - (a.attributes.clutch + a.worldRating))[0];
  const simulationHash = hashText(`${room.id}:${lineupHash}:${matches.map((match) => match.simulationHash).join(":")}:${champion.team}`);

  const result: MatchResult = {
    type: "tournament",
    roomId: room.id,
    home: table[0].team,
    away: table[1]?.team ?? "Field",
    homeScore: table[0].points,
    awayScore: table[1]?.points ?? 0,
    winner: champion.team,
    mvp,
    events: [
      `${champion.team} topped the table with ${champion.points} points and ${champion.goalDifference >= 0 ? "+" : ""}${champion.goalDifference} goal difference.`,
      `${matches.length} round-robin fixtures were generated from the locked snapshot.`,
      `Snapshot ${room.snapshotVersion} locked before kickoff.`,
    ],
    tacticalSummary: `${champion.team} won the group through ${championTeam.formation} spacing, ${championTeam.tacticalStyle.toLowerCase()} choices, and captain leverage across every fixture.`,
    winExplanation: `${champion.team} finished above ${table.slice(1).map((standing) => standing.team).join(", ")} after a deterministic round robin over the shared draft pool.`,
    lineupHash,
    simulationHash,
    storageUri: `0g://local-demo/${simulationHash.slice(2)}`,
    computeMode: ZERO_G.computeMode,
    table,
    matches,
  };
  result.proofPacket = buildProofPacket(room, result);
  return result;
}
