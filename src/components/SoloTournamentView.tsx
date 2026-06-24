import { Flag, Pause, Play, SkipForward, Target, Zap } from "lucide-react";
import { DraftPitch } from "./DraftPitch";
import { SoloGroups } from "./SoloGroups";
import { TournamentBracket } from "./TournamentBracket";
import { Badge, Button, Field, ScrollArea, ShadcnSelect } from "./ui";
import { tacticalStyles } from "../worldcup/game";
import { type DraftPick } from "../worldcup/historyDraft";
import type { LiveMatch, SoloTournament } from "../worldcup/soloTournament";
import type { Formation, TacticalStyle } from "../worldcup/types";

export type CupTab = "match" | "groups" | "bracket";

export function SoloTournamentView({
  activeTab,
  formation,
  match,
  onBenchClick,
  onContinue,
  onPenalties,
  onQuickSub,
  onSetActiveTab,
  onSetSpeed,
  onSetTactic,
  onSkip,
  onToggleRunning,
  picks,
  running,
  selectedBenchId,
  speed,
  subsLeft,
  tactic,
  teamName,
  tournament,
}: {
  activeTab: CupTab;
  formation: Formation;
  match: LiveMatch;
  onBenchClick: (playerId: string) => void;
  onContinue: () => void;
  onPenalties: () => void;
  onQuickSub: (starterId: string) => void;
  onSetActiveTab: (tab: CupTab) => void;
  onSetSpeed: (speed: 1 | 2) => void;
  onSetTactic: (value: TacticalStyle) => void;
  onSkip: () => void;
  onToggleRunning: () => void;
  picks: DraftPick[];
  running: boolean;
  selectedBenchId: string;
  speed: 1 | 2;
  subsLeft: number;
  tactic: TacticalStyle;
  teamName: string;
  tournament: SoloTournament;
}) {
  return (
    <section className="grid min-w-0 gap-5" data-testid="tournament-view">
      <div className="flex justify-center">
        <div className="inline-grid grid-cols-3 gap-1 rounded-md border border-white/10 bg-black/24 p-1" data-testid="cup-tabs">
          {(["match", "groups", "bracket"] as CupTab[]).map((tab) => (
            <button
              className={`min-h-10 rounded px-5 text-sm font-semibold capitalize transition ${activeTab === tab ? "bg-accent text-white" : "text-muted hover:bg-white/[0.06] hover:text-strong"}`}
              key={tab}
              onClick={() => onSetActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "match" && (
        <MatchSurface
          formation={formation}
          match={match}
          onBenchClick={onBenchClick}
          onContinue={onContinue}
          onPenalties={onPenalties}
          onQuickSub={onQuickSub}
          onSetSpeed={onSetSpeed}
          onSetTactic={onSetTactic}
          onSkip={onSkip}
          onToggleRunning={onToggleRunning}
          picks={picks}
          running={running}
          selectedBenchId={selectedBenchId}
          speed={speed}
          subsLeft={subsLeft}
          tactic={tactic}
          teamName={teamName}
          tournament={tournament}
        />
      )}
      {activeTab === "groups" && <SoloGroups tournament={tournament} />}
      {activeTab === "bracket" && <TournamentBracket tournament={tournament} />}
    </section>
  );
}

function MatchSurface({
  formation,
  match,
  onBenchClick,
  onContinue,
  onPenalties,
  onQuickSub,
  onSetSpeed,
  onSetTactic,
  onSkip,
  onToggleRunning,
  picks,
  running,
  selectedBenchId,
  speed,
  subsLeft,
  tactic,
  teamName,
  tournament,
}: Omit<Parameters<typeof SoloTournamentView>[0], "activeTab" | "onSetActiveTab">) {
  const opponent = tournament.userOpponent;
  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="grid gap-4">
        <div className="panel min-w-0 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <TeamScore flag="🏆" name={teamName} score={match.homeScore} />
            <div className="rounded-lg border border-accent/35 bg-black/42 px-6 py-4 text-center">
              <p className="text-xs uppercase tracking-[0.16em] text-faint">{tournament.statusText}</p>
              <p className="nums mt-1 text-4xl font-black text-accent" data-testid="match-clock">
                {tournament.needsPenalties ? "Pens" : match.complete ? "FT" : `${match.minute}'`}
              </p>
              <p className="text-xs text-muted">{running ? `${speed}x live` : "Paused"}</p>
            </div>
            <TeamScore alignRight flag={opponent.flag} name={opponent.name} score={match.awayScore} />
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <Field label="Tactical style">
              <ShadcnSelect
                label="Tactical style"
                value={tactic}
                onChange={(value) => onSetTactic(value as TacticalStyle)}
                options={tacticalStyles}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={onToggleRunning} disabled={match.complete} data-testid="toggle-live">
                {running ? <Pause size={16} /> : <Play size={16} />} {running ? "Pause" : "Play"}
              </Button>
              <Button type="button" variant={speed === 2 ? "primary" : "secondary"} onClick={() => onSetSpeed(speed === 1 ? 2 : 1)} disabled={match.complete} data-testid="speed-toggle">
                <Zap size={16} /> {speed}x
              </Button>
              <Button type="button" variant="secondary" onClick={onSkip} disabled={match.complete} data-testid="skip-match">
                <SkipForward size={16} /> Skip to FT
              </Button>
              {tournament.needsPenalties && (
                <Button type="button" onClick={onPenalties} data-testid="take-penalties">
                  <Target size={16} /> Take penalties
                </Button>
              )}
              {tournament.awaitingNext && (
                <Button type="button" onClick={onContinue} data-testid="continue-match">
                  <Flag size={16} /> Continue
                </Button>
              )}
            </div>
          </div>
          {match.complete && !tournament.needsPenalties && !tournament.awaitingNext && !tournament.finalized && (
            <p className="mt-3 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-muted">
              Recording this fixture...
            </p>
          )}
          <FinalStatus teamName={teamName} tournament={tournament} />
        </div>

        <div className="panel min-w-0 p-4 sm:p-5">
          <SubHint selectedBenchId={selectedBenchId} canSub={match.minute > 0 && !match.complete && subsLeft > 0} subsLeft={subsLeft} />
          <DraftPitch
            formation={formation}
            picks={picks}
            teamName={teamName}
            selectedBenchId={selectedBenchId}
            onBenchClick={match.minute > 0 && !match.complete && subsLeft > 0 ? onBenchClick : undefined}
            onStarterClick={selectedBenchId ? onQuickSub : undefined}
          />
        </div>
      </div>

      <aside className="panel min-w-0 p-4 sm:p-5">
        <Highlights events={match.events} />
      </aside>
    </section>
  );
}

function FinalStatus({ teamName, tournament }: { teamName: string; tournament: SoloTournament }) {
  if (!tournament.finalized) return null;
  return (
    <p className="mt-3 rounded-md border border-accent/25 bg-accent/10 p-3 text-sm text-accent">
      {tournament.stage === "complete" ? `${teamName} won the World Cup.` : tournament.statusText}
    </p>
  );
}

function TeamScore({ alignRight, flag, name, score }: { alignRight?: boolean; flag: string; name: string; score: number }) {
  return (
    <div className={alignRight ? "text-left lg:text-right" : ""}>
      <p className="truncate text-sm text-muted">{flag} {name}</p>
      <p className="nums text-6xl font-black text-strong">{score}</p>
    </div>
  );
}

function SubHint({ canSub, selectedBenchId, subsLeft }: { canSub: boolean; selectedBenchId: string; subsLeft: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm">
      <span className="text-muted">
        {canSub
          ? selectedBenchId
            ? "Click a player on the pitch to complete the substitution."
            : "Click a bench player, then click the player on the pitch to replace."
          : "Substitutions unlock after kickoff and close at full time."}
      </span>
      <Badge tone={subsLeft > 0 ? "accent" : "warn"}>{subsLeft} subs left</Badge>
    </div>
  );
}

function Highlights({ events }: { events: LiveMatch["events"] }) {
  return (
    <div className="grid gap-3" data-testid="highlights-panel">
      <h3 className="text-xl font-black">Live highlights</h3>
      <ScrollArea className="h-[520px] rounded-md border border-white/10 bg-black/18">
        <div className="grid gap-3 p-3">
          {events.length ? events.map((event, index) => <HighlightCard event={event} key={`${event.minute}-${index}`} />) : (
            <p className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm text-muted">
              Kickoff is ready. Press play to start the broadcast.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function HighlightCard({ event }: { event: LiveMatch["events"][number] }) {
  const isGoal = event.kind === "goal";
  const isMiss = event.kind === "miss";
  return (
    <div
      className={`rounded-md border p-3 transition ${
        isGoal
          ? "animate-pulse border-gold/45 bg-gold/10 shadow-[0_0_22px_rgba(246,199,96,0.18)]"
          : isMiss
            ? "border-amber-300/35 bg-amber-300/8"
            : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <div className="flex items-start gap-3">
        <Badge tone={isGoal ? "ok" : isMiss ? "warn" : "accent"}>{event.minute}'</Badge>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-black uppercase tracking-[0.16em] ${isGoal ? "text-gold" : isMiss ? "text-amber-100" : "text-accent"}`}>
              {event.kind ?? "info"}
            </span>
            {event.team && <span className="truncate text-xs text-faint">{event.team}</span>}
            {event.player && <span className="truncate text-xs text-muted">· {event.player}</span>}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{event.text}</p>
        </div>
      </div>
    </div>
  );
}
