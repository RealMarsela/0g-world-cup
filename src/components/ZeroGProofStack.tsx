import { CheckCircle2, CircleAlert, Cpu, Database, Fingerprint, Link2, RadioTower } from "lucide-react";
import { Badge, Panel } from "./ui";
import type { ZeroGProofPacket, ZeroGServiceProof, ZeroGServiceStatus } from "../worldcup/types";

const iconByName = {
  chain: Link2,
  storage: Database,
  compute: Cpu,
  da: RadioTower,
  "agentic-id": Fingerprint,
};

const toneByStatus: Record<ZeroGServiceStatus, "accent" | "ok" | "warn" | "default"> = {
  live: "ok",
  ready: "accent",
  fallback: "warn",
  blocked: "warn",
  planned: "default",
};

function ServiceRow({ service }: { service: ZeroGServiceProof }) {
  const Icon = iconByName[service.name];
  const stateIcon = service.status === "blocked" ? CircleAlert : CheckCircle2;
  const StateIcon = stateIcon;
  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[auto_1fr_auto] sm:items-start">
      <Icon className="mt-1 text-accent" size={18} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-strong">{service.label}</h3>
          <Badge tone={toneByStatus[service.status]}>{service.status}</Badge>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted">{service.summary}</p>
        {service.artifact && <p className="mt-2 break-all font-mono text-xs text-faint">{service.artifact}</p>}
      </div>
      {service.explorerUrl ? (
        <a className="text-sm text-accent" href={service.explorerUrl} target="_blank" rel="noreferrer">
          Explorer
        </a>
      ) : (
        <StateIcon className="hidden text-muted sm:block" size={18} />
      )}
    </div>
  );
}

export function ZeroGProofStack({ packet }: { packet?: ZeroGProofPacket }) {
  if (!packet) return null;
  return (
    <Panel className="p-5" data-testid="zero-g-proof-stack">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone="accent">0G proof packet</Badge>
          <h2 className="mt-3 text-2xl font-bold">Load-bearing integrations</h2>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-faint">Receipt hash</p>
          <p className="mt-1 break-all font-mono text-sm text-accent">{packet.receiptHash}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {packet.services.map((service) => <ServiceRow key={service.name} service={service} />)}
      </div>
    </Panel>
  );
}
