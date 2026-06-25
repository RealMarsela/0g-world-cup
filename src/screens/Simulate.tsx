import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, Cpu, Database, Play, ShieldCheck, SkipForward } from "lucide-react";
import { Badge, Button, Panel } from "../components/ui";
import { ZeroGProofStack } from "../components/ZeroGProofStack";
import { ZeroGRuntimeGate } from "../components/ZeroGRuntimeGate";
import { completeDraft, createRoomFromId } from "../worldcup/game";
import type { DraftRoom, MatchResult } from "../worldcup/types";

export function Simulate() {
  const { roomId = "room-free-1v1" } = useParams();
  const room = completeDraft(createRoomFromId(roomId));
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/match/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room }),
      });
      const payload = await response.json() as { result?: MatchResult; reason?: string; error?: string };
      if (!response.ok || !payload.result) {
        throw new Error(payload.reason || payload.error || `Compute endpoint failed with ${response.status}`);
      }
      setResult(payload.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <Panel className="p-5 sm:p-6">
        <Badge tone={result ? "ok" : error ? "warn" : "accent"}>{result ? result.computeMode : error ? "Compute blocked" : "Kickoff pending"}</Badge>
        <h1 className="mt-3 text-4xl font-black">{result ? "Simulation receipt" : "Ready to start."}</h1>
        <p className="mt-2 max-w-3xl text-muted">
          The room is drafted, but no score, table, result hash, or storage receipt is generated until kickoff. 0G Compute is tried first; if it is rate-limited or out of balance, the app keeps the match playable with a labeled Sarvam AI fallback.
        </p>
      </Panel>

      {error && (
        <Panel className="border-red-500/30 bg-red-500/10 p-4" data-testid="compute-error">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-200" size={20} />
            <div className="min-w-0">
              <h2 className="font-bold text-red-100">0G Compute did not produce a match result</h2>
              <p className="mt-1 break-all text-sm text-red-50/80">{error}</p>
            </div>
          </div>
        </Panel>
      )}

      {result ? (
        <>
          <ZeroGProofStack packet={result.proofPacket} />
          <Receipt room={room} result={result} />
        </>
      ) : (
        <>
          <ZeroGRuntimeGate />
          <PendingKickoff room={room} onStart={startSimulation} loading={loading} />
        </>
      )}
    </div>
  );
}

function PendingKickoff({ onStart, room, loading }: { onStart: () => void; room: DraftRoom; loading: boolean }) {
  const isTournament = room.teams.length > 2;
  return (
    <>
      <Panel className="p-5" data-testid="pending-simulation">
        {isTournament ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-faint">
                <tr>
                  <th className="py-2">Team</th>
                  <th className="py-2">P</th>
                  <th className="py-2">GD</th>
                  <th className="py-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {room.teams.map((team) => (
                  <tr className="border-t border-white/10" key={team.id}>
                    <td className="py-3 font-semibold">{team.name}</td>
                    <td className="py-3 nums">0</td>
                    <td className="py-3 nums">0</td>
                    <td className="py-3 nums text-accent">0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <h2 className="text-3xl font-black">{room.teams[0]?.name}</h2>
            <div className="rounded-md border border-accent/30 bg-accent/10 px-6 py-4 text-center">
              <p className="nums text-4xl font-black text-accent">0 - 0</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-faint">0' pending</p>
            </div>
            <h2 className="text-3xl font-black sm:text-right">{room.teams[1]?.name}</h2>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" onClick={onStart} data-testid="start-simulation" loading={loading}>
            <Play size={16} /> Start simulation
          </Button>
          <Button type="button" variant="secondary" onClick={onStart} data-testid="skip-simulation" loading={loading}>
            <SkipForward size={16} /> Skip to result
          </Button>
        </div>
      </Panel>
      <Panel className="p-4">
        <p className="text-sm text-muted">
          {isTournament
            ? "Group fixtures are locked but unplayed. The table fills only after the tournament simulation starts."
            : "The matchup is locked but unplayed. The receipt unlocks only after simulation starts."}
        </p>
      </Panel>
    </>
  );
}

function Receipt({ result, room }: { result: MatchResult; room: DraftRoom }) {
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeResult, setFinalizeResult] = useState<string | null>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const finalize = async () => {
    setFinalizing(true);
    setFinalizeError(null);
    setFinalizeResult(null);
    try {
      const response = await fetch("/api/match/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, result }),
      });
      const payload = await response.json() as {
        status?: string;
        reason?: string;
        error?: string;
        storage?: { storageUri?: string };
        chain?: { status?: string; txHash?: string };
      };
      if (!response.ok) {
        throw new Error(payload.reason || payload.error || `Finalize failed with ${response.status}`);
      }
      setFinalizeResult(`${payload.storage?.storageUri || "storage committed"} / chain ${payload.chain?.status || payload.status}${payload.chain?.txHash ? ` / ${payload.chain.txHash}` : ""}`);
    } catch (caught) {
      setFinalizeError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          [Cpu, "Result hash", result.simulationHash],
          [Database, "0G Storage URI", result.storageUri],
          [ShieldCheck, "Lineup hash", result.lineupHash],
        ].map(([Icon, label, value]) => (
          <Panel className="p-4" key={String(label)}>
            <Icon className="text-accent" size={20} />
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-faint">{String(label)}</p>
            <p className="mt-2 break-words font-semibold">{String(value)}</p>
          </Panel>
        ))}
      </div>
      {result.highlights?.length ? <Highlights result={result} /> : null}
      <Panel className="p-5" data-testid="simulation-receipt">
        {result.computeAuthority === "external-ai-fallback" && (
          <div className="mb-5 rounded-md border border-red-500/25 bg-red-500/10 p-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-100">0G Compute unavailable</p>
            <p className="mt-1 break-all text-sm text-red-50/85">
              {result.blocker || "Sarvam AI generated this playable fallback result. It is not a 0G Compute-authoritative settlement result."}
            </p>
          </div>
        )}
        {result.type === "tournament" ? <TournamentReceipt result={result} /> : <MatchReceipt result={result} />}
        <p className="mt-5 text-muted">{result.tacticalSummary}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" onClick={finalize} loading={finalizing} disabled={result.computeAuthority !== "compute"}>
            <ShieldCheck size={16} /> Finalize on 0G
          </Button>
          <Link to={`/result/${room.id}`}>
            <Button variant="secondary">Open result page</Button>
          </Link>
        </div>
        {finalizeResult && <p className="mt-3 break-all text-sm text-accent" data-testid="runtime-finalize-ok">{finalizeResult}</p>}
        {finalizeError && <p className="mt-3 break-all text-sm text-red-100" data-testid="runtime-finalize-error">{finalizeError}</p>}
      </Panel>
      {result.type === "tournament" && <Fixtures result={result} />}
    </>
  );
}

function Highlights({ result }: { result: MatchResult }) {
  return (
    <Panel className="p-5">
      <h2 className="text-2xl font-bold">{result.computeAuthority === "external-ai-fallback" ? "Fallback highlight tape" : "0G Compute highlight tape"}</h2>
      <div className="mt-4 max-h-[360px] overflow-y-auto pr-2">
        <div className="grid gap-3">
          {result.highlights?.map((highlight) => (
            <div
              className={`rounded-md border p-3 ${
                highlight.kind === "goal"
                  ? "border-accent/40 bg-accent/10"
                  : highlight.kind === "miss"
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-white/10 bg-white/[0.035]"
              }`}
              key={highlight.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="nums rounded border border-white/10 px-2 py-1 text-xs text-accent">{highlight.minute}'</span>
                <span className="text-xs font-black uppercase tracking-[0.16em]">{highlight.kind}</span>
                <span className="text-sm text-muted">{highlight.teamName}{highlight.playerName ? ` · ${highlight.playerName}` : ""}</span>
              </div>
              <p className="mt-2 text-sm text-strong">{highlight.narration}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function MatchReceipt({ result }: { result: MatchResult }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <h2 className="text-3xl font-black">{result.home}</h2>
      <div className="rounded-md border border-accent/30 bg-accent/10 px-6 py-4 text-center text-4xl font-black text-accent">
        {result.homeScore} - {result.awayScore}
      </div>
      <h2 className="text-3xl font-black sm:text-right">{result.away}</h2>
    </div>
  );
}

function TournamentReceipt({ result }: { result: MatchResult }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.14em] text-faint">
          <tr><th className="py-2">Team</th><th className="py-2">P</th><th className="py-2">W</th><th className="py-2">D</th><th className="py-2">L</th><th className="py-2">GD</th><th className="py-2">Pts</th></tr>
        </thead>
        <tbody>
          {result.table?.map((standing) => (
            <tr className="border-t border-white/10" key={standing.team}>
              <td className="py-3 font-semibold">{standing.team}</td><td className="py-3 nums">{standing.played}</td><td className="py-3 nums">{standing.wins}</td><td className="py-3 nums">{standing.draws}</td><td className="py-3 nums">{standing.losses}</td><td className="py-3 nums">{standing.goalDifference}</td><td className="py-3 nums text-accent">{standing.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Fixtures({ result }: { result: MatchResult }) {
  return (
    <Panel className="p-5">
      <h2 className="text-2xl font-bold">Round robin fixtures</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {result.matches?.map((match) => (
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-3" key={match.simulationHash}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{match.home}</span>
              <span className="nums rounded bg-black/25 px-3 py-1 text-accent">{match.homeScore} - {match.awayScore}</span>
              <span className="text-right font-semibold">{match.away}</span>
            </div>
            <p className="mt-2 break-all text-xs text-faint">{match.simulationHash}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
