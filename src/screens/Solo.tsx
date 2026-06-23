import { useEffect, useRef, useState } from "react";
import { RotateCcw, Swords } from "lucide-react";
import { DraftPitch } from "../components/DraftPitch";
import { RollRoster } from "../components/RollRoster";
import { SoloTournamentView, type CupTab } from "../components/SoloTournamentView";
import { Badge, Button, Field, Panel, Select } from "../components/ui";
import { formations } from "../worldcup/game";
import {
  addHistoryPick,
  historySnapshot,
  isHistoryDraftComplete,
  playersForTeam,
  rollHistoryTeam,
  rollingPreview,
  swapHistorySub,
  teamKey,
  type DraftPick,
  type HistoryTeam,
} from "../worldcup/historyDraft";
import {
  advanceLiveMatch,
  createSoloTournament,
  initialLiveMatch,
  type SoloTournament,
} from "../worldcup/soloTournament";
import { continueSoloTournament, recordSoloMatch, resolvePenaltyShootout } from "../worldcup/soloTournamentFlow";
import type { Formation, TacticalStyle } from "../worldcup/types";

const firstTeam = rollHistoryTeam();

export function Solo() {
  const [teamName, setTeamName] = useState("Gabriel XI");
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [draftStarted, setDraftStarted] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<HistoryTeam>(firstTeam);
  const [previewTeam, setPreviewTeam] = useState<HistoryTeam>(firstTeam);
  const [rolling, setRolling] = useState(false);
  const [rerollsLeft, setRerollsLeft] = useState(2);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [tactic, setTactic] = useState<TacticalStyle>("Balanced");
  const [match, setMatch] = useState(initialLiveMatch);
  const [tournament, setTournament] = useState<SoloTournament | null>(null);
  const [activeTab, setActiveTab] = useState<CupTab>("match");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [subsMade, setSubsMade] = useState(0);
  const [subIn, setSubIn] = useState("");
  const timers = useRef<number[]>([]);

  const draftComplete = isHistoryDraftComplete(picks);
  const subsLeft = 3 - subsMade;

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  useEffect(() => {
    if (draftComplete && !tournament) setTournament(createSoloTournament(teamName, picks, tactic));
  }, [draftComplete, picks, tactic, teamName, tournament]);

  useEffect(() => {
    if (!running || !tournament || match.complete) return;
    const interval = window.setInterval(() => {
      setMatch((current) =>
        advanceLiveMatch({
          match: current,
          picks,
          tactic,
          teamName,
          opponent: tournament.userOpponent,
          minutes: speed,
        }),
      );
    }, 1000);
    return () => window.clearInterval(interval);
  }, [match.complete, picks, running, speed, tactic, teamName, tournament]);

  useEffect(() => {
    if (!match.complete || !tournament || tournament.awaitingNext || tournament.needsPenalties || tournament.finalized) return;
    setRunning(false);
    setTournament(recordSoloMatch(tournament, match, teamName));
  }, [match, tournament]);

  const clearTimers = () => {
    timers.current.forEach((timer) => {
      window.clearInterval(timer);
      window.clearTimeout(timer);
    });
    timers.current = [];
  };

  const rollSquad = (spendReroll: boolean) => {
    if (rolling || (spendReroll && rerollsLeft <= 0)) return;
    clearTimers();
    const previews = rollingPreview();
    const nextTeam = rollHistoryTeam(teamKey(currentTeam));
    let index = 0;
    setRolling(true);
    const interval = window.setInterval(() => {
      setPreviewTeam(previews[index % previews.length]);
      index += 1;
    }, 68);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setCurrentTeam(nextTeam);
      setPreviewTeam(nextTeam);
      setRolling(false);
      if (spendReroll) setRerollsLeft((current) => current - 1);
    }, 920);
    timers.current = [interval, timeout];
  };

  const startDraft = () => {
    setDraftStarted(true);
    setPicks([]);
    setMatch(initialLiveMatch());
    setTournament(null);
    setActiveTab("match");
    setRunning(false);
    setSpeed(1);
    setSubsMade(0);
    setRerollsLeft(2);
    rollSquad(false);
  };

  const reset = () => {
    clearTimers();
    const team = rollHistoryTeam();
    setDraftStarted(false);
    setCurrentTeam(team);
    setPreviewTeam(team);
    setRolling(false);
    setRerollsLeft(2);
    setPicks([]);
    setTactic("Balanced");
    setMatch(initialLiveMatch());
    setTournament(null);
    setActiveTab("match");
    setRunning(false);
    setSpeed(1);
    setSubsMade(0);
    setSubIn("");
  };

  const pickPlayer = (playerId: string) => {
    const player = playersForTeam(currentTeam).find((candidate) => candidate.id === playerId);
    if (!player) return;
    const nextPicks = addHistoryPick(player, picks, formation);
    if (nextPicks === picks) return;
    setPicks(nextPicks);
    if (!isHistoryDraftComplete(nextPicks)) rollSquad(false);
  };

  const makeSub = (starterId: string) => {
    if (!starterId || !subIn || subsLeft <= 0 || match.minute === 0 || match.complete) return;
    const benchPlayer = picks.find((pick) => pick.player.id === subIn)?.player;
    const starterPlayer = picks.find((pick) => pick.player.id === starterId)?.player;
    setPicks((current) => swapHistorySub(current, starterId, subIn));
    setSubsMade((current) => current + 1);
    setMatch((current) => ({
      ...current,
      events: [
        {
          minute: current.minute,
          tone: "accent",
          kind: "info",
          team: teamName,
          player: benchPlayer?.shortName,
          text: `${teamName} substitution: ${benchPlayer?.shortName} replaces ${starterPlayer?.shortName} while staying in ${tactic}.`,
        },
        ...current.events,
      ],
    }));
    setSubIn("");
  };

  const skipMatch = () => {
    if (!tournament) return;
    setRunning(false);
    setMatch((current) =>
      advanceLiveMatch({
        match: current,
        picks,
        tactic,
        teamName,
        opponent: tournament.userOpponent,
        minutes: 90 - current.minute,
      }),
    );
  };

  const continueMatch = () => {
    if (!tournament?.awaitingNext) return;
    setTournament(continueSoloTournament(tournament));
    setMatch(initialLiveMatch());
    setRunning(false);
    setSubsMade(0);
    setSubIn("");
    setActiveTab("match");
  };

  const takePenalties = () => {
    if (!tournament?.needsPenalties) return;
    const outcome = resolvePenaltyShootout(tournament, match, teamName);
    setTournament(outcome.tournament);
    setMatch(outcome.match);
    setRunning(false);
  };

  return (
    <div className="grid gap-5">
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Badge tone="ok">Free solo match</Badge>
            <h1 className="mt-3 text-4xl font-black">Roll a nation, draft a real World Cup XI.</h1>
            <p className="mt-2 max-w-3xl text-muted">
              Pick one player from each rolled squad, then the next country rolls automatically. The two rerolls only reject the current offer before you pick.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={reset}>
            <RotateCcw size={16} /> Reset
          </Button>
        </div>
      </Panel>

      {!draftStarted ? (
        <Panel className="mx-auto w-full max-w-3xl p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Set your team</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Team name">
              <input
                className="min-h-11 rounded-md border border-white/12 bg-black/30 px-3 text-sm text-strong outline-none focus:border-accent/60"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
              />
            </Field>
            <Field label="Formation">
              <Select value={formation} onChange={(value) => setFormation(value as Formation)}>
                {formations.map((value) => <option key={value}>{value}</option>)}
              </Select>
            </Field>
          </div>
          <div className="mt-6">
            <Button type="button" onClick={startDraft} disabled={!teamName.trim()} data-testid="start-draft">
              <Swords size={16} /> Start draft
            </Button>
          </div>
        </Panel>
      ) : draftComplete && tournament ? (
        <SoloTournamentView
          activeTab={activeTab}
          formation={formation}
          match={match}
          onBenchClick={(playerId) => setSubIn((current) => (current === playerId ? "" : playerId))}
          onContinue={continueMatch}
          onPenalties={takePenalties}
          onQuickSub={makeSub}
          onSkip={skipMatch}
          onToggleRunning={() => setRunning((current) => !current)}
          onSetActiveTab={setActiveTab}
          onSetSpeed={setSpeed}
          onSetTactic={setTactic}
          picks={picks}
          running={running}
          selectedBenchId={subIn}
          speed={speed}
          subsLeft={subsLeft}
          tactic={tactic}
          teamName={teamName}
          tournament={tournament}
        />
      ) : (
        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <Panel className="p-4 sm:p-5">
            <DraftPitch formation={formation} picks={picks} teamName={teamName} />
          </Panel>
          <Panel className="p-4 sm:p-5">
            <RollRoster
              team={currentTeam}
              previewTeam={previewTeam}
              picks={picks}
              formation={formation}
              rolling={rolling}
              rerollsLeft={rerollsLeft}
              onPick={pickPlayer}
              onReroll={() => rollSquad(true)}
            />
          </Panel>
        </section>
      )}

      <Panel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>Snapshot {historySnapshot.snapshotVersion}</span>
          <span className="nums">{historySnapshot.players.length} players / {historySnapshot.teams.length} squads</span>
          <span className="truncate">Hash {historySnapshot.hash}</span>
        </div>
      </Panel>
    </div>
  );
}
