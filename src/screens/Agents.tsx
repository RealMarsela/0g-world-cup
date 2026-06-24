import { useEffect, useState } from "react";
import { Bot, Fingerprint, ShieldAlert } from "lucide-react";
import { Badge, DataTable, Panel } from "../components/ui";
import { registeredAgents } from "../worldcup/agents";

type AgentManagerReadback = {
  status?: string;
  readbackHash?: string;
  agents?: {
    agentId?: string;
    tokenId?: string;
    onChainOwner?: string;
    authorizedExecutor?: string | null;
    storageUri?: string;
    storageRoot?: string;
    eventTxHash?: string;
    eventBlockNumber?: string;
    fullTokenReadback?: boolean;
    metadataReadback?: boolean;
  }[];
  checks?: Record<string, boolean>;
};

export function Agents() {
  const [readback, setReadback] = useState<AgentManagerReadback | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/proof-artifacts/agent-manager-readback-latest.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: AgentManagerReadback | null) => {
        if (!cancelled) setReadback(data);
      })
      .catch(() => {
        if (!cancelled) setReadback(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const liveAgents = new Map((readback?.agents ?? []).map((agent) => [agent.agentId, agent]));

  return (
    <div className="grid gap-5">
      <Panel className="p-5 sm:p-6">
        <Badge tone="accent">Agent Manager</Badge>
        <h1 className="mt-3 text-4xl font-black">Registered AI agents</h1>
        <p className="mt-2 max-w-3xl text-muted">Agents are players with bankroll limits, opponent throttles, daily caps, and stop-loss controls. Draft reasoning routes through 0G Compute when configured.</p>
      </Panel>
      <Panel className="p-5" data-testid="agent-manager-readback">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge tone={readback?.status === "live" ? "ok" : "warn"}>Live Agentic ID readback</Badge>
            <h2 className="mt-3 text-2xl font-bold">Agent Manager proof</h2>
          </div>
          <Badge tone={readback?.status === "live" ? "ok" : "warn"}>{readback?.status ?? "waiting"}</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(readback?.agents ?? []).map((agent) => (
            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm" key={agent.agentId}>
              <p className="font-semibold">{agent.agentId} / token {agent.tokenId}</p>
              <p className="mt-2 break-all font-mono text-xs text-muted">owner {agent.onChainOwner}</p>
              <p className="mt-1 break-all font-mono text-xs text-muted">storage {agent.storageUri}</p>
              <p className="mt-1 break-all font-mono text-xs text-muted">event {agent.eventTxHash}</p>
              <p className="mt-1 text-xs text-faint">
                full token readback {String(agent.fullTokenReadback)} / metadata readback {String(agent.metadataReadback)}
              </p>
            </div>
          ))}
        </div>
        {readback?.readbackHash && <p className="mt-4 break-all font-mono text-xs text-faint">readback {readback.readbackHash}</p>}
        {readback?.checks && <p className="mt-2 text-xs text-muted">{Object.entries(readback.checks).map(([key, ok]) => `${key}:${ok ? "ok" : "fail"}`).join(" / ")}</p>}
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
                {liveAgents.get(agent.id) && (
                  <p className="mt-2 break-all font-mono text-xs text-faint">
                    live owner {liveAgents.get(agent.id)?.onChainOwner} / event {liveAgents.get(agent.id)?.eventTxHash}
                  </p>
                )}
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
