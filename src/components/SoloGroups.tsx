import { Badge } from "./ui";
import { goalDiff, type SoloTournament } from "../worldcup/soloTournament";

export function SoloGroups({ tournament }: { tournament: SoloTournament }) {
  return (
    <div className="panel min-w-0 p-4 sm:p-5" data-testid="groups-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black">Group stage</h2>
        <Badge tone={tournament.stage === "group" ? "accent" : "ok"}>
          {tournament.stage === "group" ? `Matchday ${tournament.groupMatchday + 1}` : "Group stage complete"}
        </Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tournament.groups.map((group) => (
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-3" key={group.id}>
            <h3 className="font-black">Group {group.id}</h3>
            <div className="mt-3 grid grid-cols-[1fr_28px_28px_28px] gap-2 text-xs uppercase tracking-[0.12em] text-faint">
              <span>Team</span><span className="text-right">P</span><span className="text-right">GD</span><span className="text-right">Pts</span>
            </div>
            <div className="mt-2 grid gap-2">
              {group.teams.map((team) => (
                <div className="grid grid-cols-[1fr_28px_28px_28px] gap-2 text-sm" key={team.id}>
                  <span className="truncate text-muted">{team.flag} {team.name}</span>
                  <span className="nums text-right text-faint">{team.played}</span>
                  <span className="nums text-right text-faint">{goalDiff(team)}</span>
                  <span className="nums text-right text-accent">{team.points}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
