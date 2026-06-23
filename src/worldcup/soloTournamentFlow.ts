import {
  applyCupResult,
  cupRounds,
  goalDiff,
  simulatedScore,
  type BracketMatch,
  type CupRound,
  type CupTeam,
  type LiveMatch,
  type SoloTournament,
} from "./soloTournament";

const groupPairs = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
] as const;

export function recordSoloMatch(tournament: SoloTournament, match: LiveMatch, teamName: string): SoloTournament {
  if (tournament.awaitingNext || tournament.needsPenalties || tournament.finalized) return tournament;
  return tournament.stage === "group"
    ? recordGroupMatch(tournament, match)
    : recordKnockoutMatch(tournament, match, teamName);
}

export function continueSoloTournament(tournament: SoloTournament): SoloTournament {
  if (!tournament.awaitingNext) return tournament;
  return {
    ...tournament,
    awaitingNext: false,
    needsPenalties: false,
  };
}

export function resolvePenaltyShootout(tournament: SoloTournament, match: LiveMatch, teamName: string) {
  if (!tournament.needsPenalties) return { tournament, match };
  const userWins = Math.random() > 0.42;
  const homePens = userWins ? 5 : 3 + Math.floor(Math.random() * 2);
  const awayPens = userWins ? 3 + Math.floor(Math.random() * 2) : 5;
  const winner = userWins ? teamName : tournament.userOpponent.name;
  const nextTournament = finishKnockoutResult(
    { ...tournament, needsPenalties: false },
    match,
    teamName,
    winner,
    `${match.homeScore}-${match.awayScore}`,
    `${homePens}-${awayPens}`,
  );
  return {
    tournament: nextTournament,
    match: {
      ...match,
      events: [
        {
          minute: 90,
          tone: (userWins ? "ok" : "warn") as "ok" | "warn",
          kind: "info" as const,
          team: winner,
          text: `Penalty shootout: ${teamName} ${homePens}-${awayPens} ${tournament.userOpponent.name}. ${winner} advance.`,
        },
        ...match.events,
      ],
    },
  };
}

function recordGroupMatch(tournament: SoloTournament, match: LiveMatch) {
  const next = clone(tournament);
  const user = findTeam(next, "user");
  const opponent = findTeam(next, next.userOpponent.id);
  if (!user || !opponent) return tournament;
  applyCupResult(user, opponent, match.homeScore, match.awayScore);
  simulateGroupMatchday(next, next.groupMatchday, opponent.id);
  sortGroups(next);

  if (next.groupMatchday < 2) {
    next.groupMatchday += 1;
    next.userOpponent = findTeam(next, next.groupOpponentIds[next.groupMatchday]) ?? next.userOpponent;
    next.awaitingNext = true;
    next.statusText = `Group A · Matchday ${next.groupMatchday + 1}`;
    return next;
  }

  seedKnockouts(next);
  next.stage = "knockout";
  next.currentRoundIndex = 0;
  next.awaitingNext = true;
  next.statusText = "Round of 32";
  next.userOpponent = opponentForUserMatch(next, "Round of 32") ?? next.userOpponent;
  return next;
}

function recordKnockoutMatch(tournament: SoloTournament, match: LiveMatch, teamName: string) {
  if (match.homeScore === match.awayScore) {
    return { ...tournament, needsPenalties: true, statusText: "Penalty shootout required" };
  }
  const winner = match.homeScore > match.awayScore ? teamName : tournament.userOpponent.name;
  return finishKnockoutResult(tournament, match, teamName, winner, `${match.homeScore}-${match.awayScore}`);
}

function finishKnockoutResult(
  tournament: SoloTournament,
  match: LiveMatch,
  teamName: string,
  winner: string,
  score: string,
  penalties?: string,
) {
  const next = clone(tournament);
  const round = cupRounds[next.currentRoundIndex];
  const userMatch = next.bracket.find((item) => item.round === round && item.isUser && item.status === "pending");
  if (!userMatch) return tournament;
  Object.assign(userMatch, { score, winner, penalties, status: "played" as const });

  if (winner !== teamName) {
    next.stage = "eliminated";
    next.finalized = true;
    next.statusText = `Eliminated in ${round}`;
    return next;
  }

  simulateOtherKnockouts(next, round, teamName);
  if (round === "Final") {
    next.stage = "complete";
    next.finalized = true;
    next.champion = teamName;
    next.statusText = "World Cup champions";
    return next;
  }

  const winners = next.bracket.filter((item) => item.round === round).map((item) => item.winner);
  const nextRound = cupRounds[next.currentRoundIndex + 1];
  next.bracket.push(...createRoundMatches(winners, nextRound, teamName));
  next.currentRoundIndex += 1;
  next.userOpponent = opponentForUserMatch(next, nextRound) ?? next.userOpponent;
  next.awaitingNext = true;
  next.statusText = nextRound;
  return next;
}

function simulateGroupMatchday(tournament: SoloTournament, matchday: number, userOpponentId: string) {
  tournament.groups.forEach((group, groupIndex) => {
    const ids = tournament.groupFixtureIds[groupIndex];
    groupPairs[matchday].forEach(([homeIndex, awayIndex]) => {
      const home = group.teams.find((team) => team.id === ids[homeIndex]);
      const away = group.teams.find((team) => team.id === ids[awayIndex]);
      if (!home || !away || isUserFixture(home, away, userOpponentId)) return;
      const score = simulatedScore(home, away);
      applyCupResult(home, away, score.homeGoals, score.awayGoals);
    });
  });
}

function seedKnockouts(tournament: SoloTournament) {
  const seeded = tournament.groups.flatMap((group) => [...group.teams].sort(compareTeams));
  tournament.bracket = createRoundMatches(seeded.map((team) => team.name), "Round of 32", userName(tournament));
}

function createRoundMatches(names: string[], round: CupRound, teamName: string): BracketMatch[] {
  const matches: BracketMatch[] = [];
  for (let index = 0; index < names.length; index += 2) {
    const home = names[index];
    const away = names[index + 1] ?? names[0];
    matches.push({
      round,
      home,
      away,
      score: "",
      winner: "",
      status: "pending",
      isUser: home === teamName || away === teamName,
    });
  }
  return matches;
}

function simulateOtherKnockouts(tournament: SoloTournament, round: CupRound, teamName: string) {
  tournament.bracket.filter((match) => match.round === round && match.status === "pending").forEach((match) => {
    const home = teamByName(tournament, match.home);
    const away = teamByName(tournament, match.away);
    const score = simulatedScore(home, away, true);
    const winner = score.homeGoals > score.awayGoals ? match.home : match.away;
    Object.assign(match, {
      score: `${score.homeGoals}-${score.awayGoals}`,
      winner,
      status: "played" as const,
      isUser: match.home === teamName || match.away === teamName,
    });
  });
}

function opponentForUserMatch(tournament: SoloTournament, round: CupRound) {
  const match = tournament.bracket.find((item) => item.round === round && item.isUser && item.status === "pending");
  if (!match) return undefined;
  const opponentName = match.home === userName(tournament) ? match.away : match.home;
  return teamByName(tournament, opponentName);
}

function teamByName(tournament: SoloTournament, name: string): CupTeam {
  return tournament.groups.flatMap((group) => group.teams).find((team) => team.name === name) ?? {
    id: name,
    name,
    flag: "",
    rating: 900,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

function findTeam(tournament: SoloTournament, id: string) {
  return tournament.groups.flatMap((group) => group.teams).find((team) => team.id === id);
}

function sortGroups(tournament: SoloTournament) {
  tournament.groups.forEach((group) => group.teams.sort(compareTeams));
}

function compareTeams(a: CupTeam, b: CupTeam) {
  return b.points - a.points || goalDiff(b) - goalDiff(a) || b.goalsFor - a.goalsFor || b.rating - a.rating;
}

function isUserFixture(home: CupTeam, away: CupTeam, opponentId: string) {
  return (home.isUser === true && away.id === opponentId) || (away.isUser === true && home.id === opponentId);
}

function userName(tournament: SoloTournament) {
  return findTeam(tournament, "user")?.name ?? "Gabriel XI";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
