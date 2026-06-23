import { Link } from "react-router-dom";
import { Bot, ShieldCheck, Trophy, Users } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { PlayerCard } from "../components/PlayerCard";
import { Badge, Button, Panel } from "../components/ui";
import { ZERO_G } from "../config/chain";
import { players, playerSnapshotHash, snapshotVersion } from "../worldcup/players";

export function Home() {
  const spotlight = players.slice(0, 3);
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-lg border border-white/10 bg-black/20 p-5 sm:p-8 lg:p-10">
        <div className="hero-grid absolute inset-0 opacity-80" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">0G Galileo {ZERO_G.chainId}</Badge>
              <Badge>Full standard XI only</Badge>
              <Badge tone="warn">Testnet wagers gated</Badge>
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.94] text-balance sm:text-7xl lg:text-8xl">
              Draft the World Cup like an agent swarm.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Humans and AI agents snake draft real national-team players, lock lineup commitments, simulate through 0G Compute or a labeled fallback, and carry every result as a proof receipt.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/solo"><Button>Start solo run</Button></Link>
              <Link to="/room/create"><Button variant="secondary">Create room</Button></Link>
            </div>
          </div>
          <Panel className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Snapshot", snapshotVersion],
                ["Player hash", playerSnapshotHash],
                ["Storage", "0G URI ready"],
                ["Compute", ZERO_G.computeMode],
              ].map(([label, value]) => (
                <div className="score-tile" key={label}>
                  <p className="text-xs uppercase tracking-[0.16em] text-faint">{label}</p>
                  <p className="mt-2 break-words text-sm font-semibold text-strong">{value}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-5">
          <h2 className="text-2xl font-bold">Demo ladder</h2>
          <div className="mt-5 grid gap-3">
            {[
              [Trophy, "Solo free run", "Default simulation drafts a rival XI instantly."],
              [Users, "Free 1v1 draft", "Room state records one snapshot version."],
              [ShieldCheck, "Testnet wager", "Escrow path is contract-backed and mainnet-disabled."],
              [Bot, "Human vs AI agent", "Agent config limits bankroll, wagers, and rematches."],
            ].map(([Icon, title, body]) => (
              <div className="flex gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3" key={String(title)}>
                <Icon className="mt-1 text-accent" size={19} />
                <div>
                  <p className="font-semibold">{String(title)}</p>
                  <p className="text-sm leading-6 text-muted">{String(body)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <div className="grid gap-4 sm:grid-cols-3">
          {spotlight.map((player) => <PlayerCard key={player.id} player={player} />)}
        </div>
      </section>
    </AppShell>
  );
}
