import { RefreshCw } from "lucide-react";
import { Badge, Button } from "./ui";
import { flagForTeamCode } from "../worldcup/flags";
import {
  decidePick,
  playersForTeam,
  type DraftPick,
  type HistoryTeam,
} from "../worldcup/historyDraft";
import type { Formation } from "../worldcup/types";

export function RollRoster({
  team,
  previewTeam,
  picks,
  formation,
  rolling,
  rerollsLeft,
  onPick,
  onReroll,
}: {
  team: HistoryTeam;
  previewTeam: HistoryTeam;
  picks: DraftPick[];
  formation: Formation;
  rolling: boolean;
  rerollsLeft: number;
  onPick: (playerId: string) => void;
  onReroll: () => void;
}) {
  const visibleTeam = rolling ? previewTeam : team;
  const players = playersForTeam(team);
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-accent/25 bg-black/26 p-4" data-testid="roll-team">
        <p className="text-xs uppercase tracking-[0.16em] text-faint">Rolled squad</p>
        <p className="mt-2 text-sm text-muted">Choose one player, or reroll before picking.</p>
        <div className={`mt-3 transition ${rolling ? "scale-[1.02] opacity-80" : "scale-100 opacity-100"}`}>
          <div className="flex items-center gap-3">
            <span className="text-5xl leading-none">{flagForTeamCode(visibleTeam.teamCode)}</span>
            <div>
              <p className="nums text-sm text-accent">{visibleTeam.year}</p>
              <h2 className="text-3xl font-black">{visibleTeam.teamName}</h2>
              <p className="text-sm text-muted">{visibleTeam.playerCount} listed squad players</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Badge tone={rerollsLeft > 0 ? "accent" : "warn"}>{rerollsLeft} rerolls left</Badge>
          <Button
            type="button"
            variant="secondary"
            onClick={onReroll}
            disabled={rolling || rerollsLeft <= 0}
            data-testid="reroll-button"
          >
            <RefreshCw size={16} /> Reroll
          </Button>
        </div>
      </div>

      <div className="max-h-[620px] overflow-y-auto pr-1">
        <div className="grid gap-2">
          {players.map((player) => {
            const decision = decidePick(player, picks, formation);
            const disabled = rolling || decision.kind === "disabled";
            return (
              <button
                className={`rounded-md border p-3 text-left transition ${
                  disabled
                    ? "border-white/8 bg-white/[0.025] opacity-45"
                    : "border-white/12 bg-white/[0.05] hover:border-accent/45 hover:bg-accent/10"
                }`}
                data-testid="player-option"
                disabled={disabled}
                key={player.id}
                onClick={() => onPick(player.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-strong">
                      {flagForTeamCode(player.teamCode)} #{player.shirtNumber || "--"} {player.name}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {player.position} / {player.detailedPosition}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={decision.kind === "disabled" ? "default" : decision.kind === "sub" ? "warn" : "accent"}>
                      {decision.label}
                    </Badge>
                    <span className="nums min-w-8 text-right text-lg font-black text-accent">{player.rating}</span>
                  </div>
                </div>
                {decision.kind === "disabled" && <p className="mt-2 text-xs text-faint">{decision.reason}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
