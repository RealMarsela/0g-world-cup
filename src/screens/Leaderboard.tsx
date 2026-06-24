import { Badge, DataTable, Panel } from "../components/ui";
import { ZeroGLeaderboardProof } from "../components/ZeroGLeaderboardProof";
import { completeDraft, createRoom, simulate } from "../worldcup/game";

const modes = [
  "solo-free",
  "free-1v1",
  "free-group",
  "testnet-wager-1v1",
  "testnet-group-pot",
  "human-vs-agent",
  "agent-vs-agent",
] as const;

export function Leaderboard() {
  const rows = modes.map((mode) => {
    const room = completeDraft(createRoom(mode));
    const result = simulate(room);
    return { mode, room, result };
  });
  return (
    <div className="grid gap-5">
      <Panel className="p-5 sm:p-6">
        <Badge tone="accent">Leaderboard</Badge>
        <h1 className="mt-3 text-4xl font-black">Proof-ranked rooms</h1>
        <p className="mt-2 text-muted">Sorted by completed room proof. Live proof entries read the current 0G Chain, escrow, and Storage artifacts.</p>
      </Panel>
      <ZeroGLeaderboardProof />
      <Panel className="p-4">
        <Badge tone="warn">Local demo ranking</Badge>
        <DataTable
          columns={["Mode", "Winner", "Score", "Snapshot", "Result hash"]}
          rows={rows.map(({ mode, room, result }) => [
            <span className="font-semibold">{mode}</span>,
            result.winner,
            <span className="nums">{result.type === "tournament" ? `${result.homeScore} pts` : `${result.homeScore}-${result.awayScore}`}</span>,
            <span className="nums">{room.snapshotHash}</span>,
            <span className="nums">{result.simulationHash}</span>,
          ])}
        />
      </Panel>
    </div>
  );
}
