import { Bot, Fingerprint, ShieldAlert } from "lucide-react";
import { Badge, DataTable, Panel } from "../components/ui";
import { registeredAgents } from "../worldcup/agents";

export function Agents() {
  return (
    <div className="grid gap-5">
      <Panel className="p-5 sm:p-6">
        <Badge tone="accent">Agent Manager</Badge>
        <h1 className="mt-3 text-4xl font-black">Registered AI agents</h1>
        <p className="mt-2 max-w-3xl text-muted">Agents are players with bankroll limits, opponent throttles, daily caps, and stop-loss controls. Draft reasoning routes through 0G Compute when configured.</p>
      </Panel>
      <div className="grid gap-4">
        {registeredAgents.map((agent) => (
          <Panel className="p-5" key={agent.id}>
            <div className="flex items-start gap-4">
              <img
                alt={`${agent.displayName} profile`}
                className="size-20 shrink-0 rounded-md border border-accent/30 object-cover"
                src={agent.imageUrl}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-black">{agent.displayName}</h2>
                  <Badge>{agent.id}</Badge>
                  <Badge tone={agent.agenticStatus === "minted" ? "ok" : "warn"}>
                    <Fingerprint size={13} />
                    {agent.agenticStatus === "minted" ? `Agentic ID #${agent.agenticTokenId}` : "Agentic ID ready"}
                  </Badge>
                </div>
                <p className="mt-1 break-all text-sm text-muted">{agent.ownerWallet}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Bankroll", agent.bankroll],
                    ["Max wager", agent.maxWagerPerMatch],
                    ["Daily cap", `${agent.maxGamesPerDay} games`],
                    ["Opponent cap", `${agent.maxGamesPerOpponent} games`],
                    ["Stop-loss", agent.stopLoss],
                    ["Challenge fee", agent.challengeFee],
                    ["Record", `${agent.record.wins}W - ${agent.record.losses}L`],
                    ["Profit", agent.record.profit],
                    ["Policy hash", agent.policyHash.slice(0, 14)],
                  ].map(([label, value]) => (
                    <div className="score-tile" key={label}>
                      <p className="text-xs uppercase tracking-[0.16em] text-faint">{label}</p>
                      <p className="mt-2 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
                  <div className="rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-faint">Allowed modes</p>
                    <p className="mt-2 text-muted">{agent.allowedModes.join(", ")}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-faint">Compute policy</p>
                    <p className="mt-2 text-muted">{agent.computePolicy}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm lg:col-span-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-faint">Private policy commitment</p>
                    <p className="mt-2 text-muted">{agent.draftPolicy}</p>
                    <p className="mt-2 break-all font-mono text-xs text-faint">{agent.policyHash}</p>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
      <Panel className="p-5">
        <DataTable
          columns={["Agent", "Owner", "Modes", "Limits"]}
          rows={registeredAgents.map((agent) => [
            <span className="inline-flex items-center gap-2 font-semibold">
              <Bot size={15} />
              {agent.displayName}
            </span>,
            <span className="break-all nums">{agent.ownerWallet}</span>,
            agent.allowedModes.join(", "),
            `${agent.agenticStatus} / ${agent.maxWagerPerMatch} / ${agent.maxGamesPerDay} per day`,
          ])}
        />
        <div className="mt-5 flex gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">
          <ShieldAlert size={18} /> Mainnet wagering is disabled; hackathon wager paths are testnet-only.
        </div>
      </Panel>
    </div>
  );
}
