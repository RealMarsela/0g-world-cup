import { Badge } from "./ui";
import { flagForTeamCode } from "../worldcup/flags";
import {
  benchPicks,
  pickForSlot,
  slotsForFormation,
  starterPicks,
  type DraftPick,
} from "../worldcup/historyDraft";
import type { Formation } from "../worldcup/types";

export function DraftPitch({
  formation,
  onBenchClick,
  onStarterClick,
  picks,
  selectedBenchId,
  teamName,
}: {
  formation: Formation;
  onBenchClick?: (playerId: string) => void;
  onStarterClick?: (playerId: string) => void;
  picks: DraftPick[];
  selectedBenchId?: string;
  teamName: string;
}) {
  const starters = starterPicks(picks);
  const bench = benchPicks(picks);
  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-black">{teamName}</h2>
          <p className="text-sm text-muted">{formation} draft board</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={starters.length === 11 ? "ok" : "accent"}>{starters.length}/11 XI</Badge>
          <Badge tone={bench.length === 3 ? "ok" : "default"}>{bench.length}/3 subs</Badge>
        </div>
      </div>

      <div
        className="relative min-h-[540px] overflow-hidden rounded-lg border border-accent/22 bg-[radial-gradient(circle_at_50%_50%,rgba(242,13,34,0.18),transparent_34%),linear-gradient(90deg,rgba(9,9,14,0.98),rgba(30,10,14,0.98),rgba(9,9,14,0.98))]"
        data-testid="draft-pitch"
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(242,13,34,0.08)_1px,transparent_1px),linear-gradient(rgba(242,13,34,0.08)_1px,transparent_1px)] bg-[size:52px_52px]" />
        <PitchLines />
        {slotsForFormation(formation).map((slot) => {
          const pick = pickForSlot(picks, slot.id);
          return (
            <div
              key={slot.id}
              className="absolute w-[86px] -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              data-testid="pitch-slot"
            >
              {pick ? (
                <button
                  className={`w-full rounded-md border p-2 text-center shadow-[0_12px_26px_rgba(0,0,0,0.32)] transition ${
                    selectedBenchId
                      ? "border-red-500 bg-red-500/12 hover:bg-red-500/20"
                      : "border-accent/45 bg-black/68"
                  }`}
                  disabled={!onStarterClick}
                  onClick={() => onStarterClick?.(pick.player.id)}
                  type="button"
                >
                  <div className="flex items-center justify-center gap-1 text-xs text-muted">
                    <span>{flagForTeamCode(pick.player.teamCode)}</span>
                    <span>#{pick.player.shirtNumber || "--"}</span>
                    <span className="font-bold text-accent">{pick.player.rating}</span>
                  </div>
                  <p className="mt-1 truncate text-xs font-bold text-strong">{pick.player.shortName}</p>
                  <p className="text-[10px] text-faint">{slot.label}</p>
                </button>
              ) : (
                <div className="grid h-16 place-items-center rounded-md border border-dashed border-white/30 bg-black/24 text-xs font-bold text-white/70">
                  {slot.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((index) => {
          const pick = bench[index];
          return (
            <button
              className={`rounded-md border p-3 text-left transition ${
                pick && selectedBenchId === pick.player.id
                  ? "border-red-500 bg-red-500/12"
                  : "border-white/10 bg-white/[0.04] hover:border-accent/40"
              }`}
              data-testid="bench-slot"
              disabled={!pick || !onBenchClick}
              key={index}
              onClick={() => pick && onBenchClick?.(pick.player.id)}
              type="button"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-faint">Sub {index + 1}</p>
              {pick ? (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-strong">
                    {flagForTeamCode(pick.player.teamCode)} #{pick.player.shirtNumber} {pick.player.shortName}
                  </span>
                  <Badge tone="accent">{pick.player.rating}</Badge>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">Open bench slot</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PitchLines() {
  return (
    <>
      <div className="absolute inset-x-0 top-1/2 border-t border-white/25" />
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
      <div className="absolute inset-x-[18%] top-0 h-24 rounded-b-lg border-x border-b border-white/25" />
      <div className="absolute inset-x-[18%] bottom-0 h-24 rounded-t-lg border-x border-t border-white/25" />
      <div className="absolute inset-3 rounded-md border border-white/28" />
    </>
  );
}
