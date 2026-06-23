import { RotateCcw } from "lucide-react";
import type { Player } from "../worldcup/types";
import type { MatchEvent } from "../worldcup/soloEngine";
import { Badge, Button, Panel, Tabs } from "./ui";

export function SoloHero({ onReset }: { onReset: () => void }) {
  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone="ok">Free solo match</Badge>
          <h1 className="mt-3 text-4xl font-black">Build your XI, then manage the match.</h1>
          <p className="mt-2 max-w-3xl text-muted">
            No wager, no wallet action. Choose a formation, draft a starting XI plus three subs, set tactics after the squad is ready, then change tactics and use substitutions during a random local simulation.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onReset}>
          <RotateCcw size={16} /> Reset
        </Button>
      </div>
    </Panel>
  );
}

export function SoloStageNav({
  stage,
  onChange,
}: {
  stage: string;
  onChange: (value: string) => void;
}) {
  return (
    <Panel className="p-4">
      <Tabs
        value={stage}
        onChange={onChange}
        tabs={[
          { value: "setup", label: "Setup" },
          { value: "draft", label: "Draft" },
          { value: "tactics", label: "Tactics" },
          { value: "match", label: "Match" },
        ]}
      />
    </Panel>
  );
}

export function ScoreEvent({ event }: { event: MatchEvent }) {
  return (
    <li className="rounded-md border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-start gap-3">
        <Badge tone={event.tone}>{event.minute}'</Badge>
        <p className="text-sm leading-6 text-muted">{event.text}</p>
      </div>
    </li>
  );
}

export function PickRow({ player, index }: { player: Player; index: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm">
      <span>{index < 11 ? `XI ${index + 1}` : `Sub ${index - 10}`}</span>
      <span className="font-semibold text-strong">{player.shortName}</span>
      <span className="text-faint">{player.position}</span>
    </div>
  );
}
