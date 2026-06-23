import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Dialog, Field, Panel, Select, Tabs } from "../components/ui";
import { createRoom, formations, tacticalStyles } from "../worldcup/game";
import type { RoomMode } from "../worldcup/types";

const modes: [RoomMode, string][] = [
  ["free-1v1", "Free 1v1 human battle"],
  ["free-group", "Free group tournament"],
  ["testnet-wager-1v1", "Testnet 1v1 wager"],
  ["testnet-group-pot", "Testnet group tournament pot"],
  ["human-vs-agent", "Human vs registered AI agent"],
  ["agent-vs-agent", "Agent vs agent"],
];

export function CreateRoom() {
  const [mode, setMode] = useState<RoomMode>("free-1v1");
  const [formation, setFormation] = useState("4-3-3");
  const [style, setStyle] = useState("Balanced");
  const room = createRoom(mode);
  return (
    <Panel className="mx-auto max-w-3xl p-5 sm:p-6">
      <Badge tone="accent">Room factory</Badge>
      <h1 className="mt-3 text-4xl font-black">Create a draft room</h1>
      <div className="mt-6 grid gap-4">
        <Tabs
          value={mode.includes("wager") ? "wager" : mode.includes("agent") ? "agent" : "free"}
          onChange={(value) =>
            setMode(
              value === "wager"
                ? "testnet-wager-1v1"
                : value === "agent"
                  ? "human-vs-agent"
                  : "free-1v1",
            )
          }
          tabs={[
            { value: "free", label: "Free" },
            { value: "wager", label: "Testnet wager" },
            { value: "agent", label: "Agents" },
          ]}
        />
        <Field label="Mode">
          <Select value={mode} onChange={(value) => setMode(value as RoomMode)}>
            {modes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Formation">
            <Select value={formation} onChange={setFormation}>
              {formations.map((value) => <option key={value}>{value}</option>)}
            </Select>
          </Field>
          <Field label="Tactical style">
            <Select value={style} onChange={setStyle}>
              {tacticalStyles.map((value) => <option key={value}>{value}</option>)}
            </Select>
          </Field>
        </div>
      </div>
      <div className="mt-6 rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm text-muted">
        Room will use snapshot <span className="nums text-strong">{room.snapshotVersion}</span> and wager setting <span className="text-strong">{room.wagerAmount}</span>.
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={`/room/${room.id}`}><Button>Create room</Button></Link>
        <Link to={`/draft/${room.id}`}><Button variant="secondary">Skip to draft</Button></Link>
        <Dialog
          title="Room safety rules"
          trigger={<Button variant="ghost">Anti-abuse rules</Button>}
        >
          <ul className="grid gap-3 text-sm text-muted">
            <li>Turn timeout triggers deterministic auto-pick fallback.</li>
            <li>Drafted players become unavailable to every other team in the room.</li>
            <li>Testnet wager rematches are capped per opponent before escrow opens.</li>
          </ul>
        </Dialog>
      </div>
    </Panel>
  );
}
