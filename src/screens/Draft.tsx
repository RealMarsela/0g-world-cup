import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Swords } from "lucide-react";
import { DraftPitch } from "../components/DraftPitch";
import { RollRoster } from "../components/RollRoster";
import { Badge, Button, Field, Panel, Select, ShadcnSelect } from "../components/ui";
import { createRoomFromId, formations, inferRoomMode, tacticalStyles } from "../worldcup/game";
import {
  addHistoryPick,
  isHistoryDraftComplete,
  playersForTeam,
  rollHistoryTeam,
  rollingPreview,
  teamKey,
  type DraftPick,
  type HistoryTeam,
} from "../worldcup/historyDraft";
import type { DraftTeam, Formation, TacticalStyle } from "../worldcup/types";

const firstTeam = rollHistoryTeam();

export function Draft() {
  const { roomId = "room-free-1v1" } = useParams();
  const mode = inferRoomMode(roomId);
  const room = createRoomFromId(roomId);
  const [teamName, setTeamName] = useState(room.teams[0]?.name ?? "Gabriel XI");
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [tactic, setTactic] = useState<TacticalStyle>("Balanced");
  const [draftStarted, setDraftStarted] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<HistoryTeam>(firstTeam);
  const [previewTeam, setPreviewTeam] = useState<HistoryTeam>(firstTeam);
  const [rolling, setRolling] = useState(false);
  const [rerollsLeft, setRerollsLeft] = useState(2);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const timers = useRef<number[]>([]);
  const draftComplete = isHistoryDraftComplete(picks);

  useEffect(() => () => clearTimers(), []);

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
    setRerollsLeft(2);
    rollSquad(false);
  };

  const pickPlayer = (playerId: string) => {
    const player = playersForTeam(currentTeam).find((candidate) => candidate.id === playerId);
    if (!player) return;
    const nextPicks = addHistoryPick(player, picks, formation);
    if (nextPicks === picks) return;
    setPicks(nextPicks);
    if (!isHistoryDraftComplete(nextPicks)) rollSquad(false);
  };

  return (
    <div className="grid gap-5">
      <Panel className="p-5 sm:p-6">
        <Badge tone={room.wagerAmount === "free" ? "accent" : "warn"}>{room.mode}</Badge>
        <h1 className="mt-3 text-4xl font-black">Draft before kickoff.</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Rooms now use the same roll-a-nation draft rule as solo. Pick one player per roll, reroll only before the pick, and watch rival lanes fill alongside you.
        </p>
      </Panel>

      {!draftStarted ? (
        <Panel className="mx-auto w-full max-w-3xl p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Set your room lineup</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Team name">
              <input
                className="min-h-11 rounded-md border border-white/12 bg-black/30 px-3 text-sm text-strong outline-none focus:border-accent/60"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Formation">
                <Select value={formation} onChange={(value) => setFormation(value as Formation)}>
                  {formations.map((value) => <option key={value}>{value}</option>)}
                </Select>
              </Field>
              <Field label="Tactical style">
                <ShadcnSelect
                  label="Tactical style"
                  value={tactic}
                  onChange={(value) => setTactic(value as TacticalStyle)}
                  options={tacticalStyles}
                />
              </Field>
            </div>
          </div>
          <div className="mt-6">
            <Button type="button" onClick={startDraft} disabled={!teamName.trim()} data-testid="start-room-draft">
              <Swords size={16} /> Start room draft
            </Button>
          </div>
        </Panel>
      ) : (
        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="grid min-w-0 gap-5">
            <Panel className="p-4 sm:p-5">
              <DraftPitch formation={formation} picks={picks} teamName={teamName} />
            </Panel>
            <RoomRivals teams={room.teams.slice(1)} pickCount={picks.length} groupMode={room.teams.length > 2} />
          </div>
          <Panel className="p-4 sm:p-5">
            {draftComplete ? (
              <div className="grid gap-4" data-testid="room-draft-ready">
                <Badge tone="ok">Lineup committed locally</Badge>
                <h2 className="text-3xl font-black">{teamName} are ready.</h2>
                <p className="text-sm text-muted">
                  The next screen starts from a pending kickoff state. Results are not generated until you start or skip the match simulation.
                </p>
                <Link to={`/simulate/${roomId}`}>
                  <Button className="w-full">Continue to kickoff</Button>
                </Link>
              </div>
            ) : (
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
            )}
          </Panel>
        </section>
      )}
    </div>
  );
}

function RoomRivals({ groupMode, pickCount, teams }: { groupMode: boolean; pickCount: number; teams: DraftTeam[] }) {
  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">{groupMode ? "Group draft lanes" : "Opponent draft lane"}</h2>
          <p className="text-sm text-muted">Live WebSocket turns will replace this local mirror.</p>
        </div>
        <Badge tone="accent">Shared pool</Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {teams.map((team, index) => {
          const progress = Math.min(14, Math.max(0, pickCount - index));
          return (
            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3" key={team.id}>
              <p className="truncate font-bold">{team.name}</p>
              <p className="mt-1 text-xs text-muted">{team.kind} / {team.formation} / {team.tacticalStyle}</p>
              <div className="mt-3 h-2 overflow-hidden rounded bg-black/30">
                <div className="h-full bg-accent" style={{ width: `${(progress / 14) * 100}%` }} />
              </div>
              <p className="mt-2 nums text-xs text-faint">{progress}/14 drafted</p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
