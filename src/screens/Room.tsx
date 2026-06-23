import { Link, useParams } from "react-router-dom";
import { Badge, Button, Panel, Sheet } from "../components/ui";
import { createRoomFromId, inferRoomMode } from "../worldcup/game";

export function Room() {
  const { id = "room-free-1v1" } = useParams();
  const mode = inferRoomMode(id);
  const room = createRoomFromId(id);
  return (
    <div className="grid gap-5">
      <Panel className="p-5 sm:p-6">
        <Badge tone="accent">{room.mode}</Badge>
        <h1 className="mt-3 text-4xl font-black">{id}</h1>
        <p className="mt-2 max-w-3xl text-muted">Operational room state is modeled for Cloudflare Durable Objects/WebSockets. Final truth is the lineup commitment, result hash, and 0G Storage URI.</p>
      </Panel>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Entrants", `${room.teams.length} teams ready`],
          ["Snapshot", room.snapshotHash],
          ["Wager", room.wagerAmount],
        ].map(([label, value]) => (
          <Panel className="p-4" key={label}>
            <p className="text-xs uppercase tracking-[0.16em] text-faint">{label}</p>
            <p className="mt-2 break-words font-semibold">{value}</p>
          </Panel>
        ))}
      </div>
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Link to={`/draft/${id}`}><Button>Enter draft</Button></Link>
        <Sheet title="Operational state">
          <p className="text-sm text-muted">Durable Object room state tracks turns, timers, reconnects, and draft logs. 0G commitments remain final truth.</p>
          <Badge tone="warn">Timeout auto-pick ready</Badge>
        </Sheet>
      </section>
    </div>
  );
}
