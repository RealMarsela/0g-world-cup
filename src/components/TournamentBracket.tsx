import { Badge } from "./ui";
import type { BracketMatch, SoloTournament } from "../worldcup/soloTournament";

export function TournamentBracket({ tournament }: { tournament: SoloTournament }) {
  const rounds = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final"] as const;
  if (tournament.bracket.length === 0) {
    return (
      <div className="panel min-w-0 p-4 sm:p-5" data-testid="bracket-panel">
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-5">
          <Badge tone="accent">Locked until group stage ends</Badge>
          <h3 className="mt-3 text-2xl font-black">Knockouts are not drawn yet.</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Finish all three group matches first. The bracket will unlock one round at a time after that.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="panel min-w-0 overflow-x-auto p-4 sm:p-5" data-testid="bracket-panel">
      <div className="grid min-w-[1120px] grid-cols-5 gap-4">
        {rounds.map((round) => (
          <div className="grid content-start gap-3" key={round}>
            <h3 className="sticky top-0 rounded-md border border-white/10 bg-panel p-2 text-center text-sm font-black">{round}</h3>
            {tournament.bracket.filter((match) => match.round === round).length
              ? tournament.bracket.filter((match) => match.round === round).map((match, index) => (
                <BracketCard index={index} key={`${match.round}-${index}`} match={match} />
              ))
              : <p className="rounded-md border border-white/10 bg-white/[0.025] p-3 text-sm text-muted">Pending previous round.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketCard({ index, match }: { index: number; match: BracketMatch }) {
  return (
    <div className={`rounded-md border p-3 ${match.isUser ? "border-accent/35 bg-accent/10" : "border-white/10 bg-white/[0.035]"} ${index % 2 ? "mt-5" : ""}`}>
      <p className="truncate text-sm text-muted">{match.home}</p>
      <p className="truncate text-sm text-muted">{match.away}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="nums text-sm text-accent">{match.score || "pending"}</span>
        <span className="truncate text-xs text-strong">{match.winner || (match.isUser ? "Your next match" : "Not played")}</span>
      </div>
      {match.penalties && <p className="mt-2 text-xs text-muted">Pens {match.penalties}</p>}
    </div>
  );
}
