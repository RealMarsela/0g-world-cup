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
  const stateIcon = service.status === "live" || service.status === "ready" ? CheckCircle2 : CircleAlert;
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
  const hasNonLiveService = packet.services.some((service) => service.status !== "live");
  return (
    <Panel className="p-5" data-testid="zero-g-proof-stack">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone={hasNonLiveService ? "warn" : "ok"}>Receipt preview</Badge>
          <h2 className="mt-3 text-2xl font-bold">Local receipt and 0G hooks</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            This block describes the current room receipt. It is not the live 0G completion signal; the artifact matrix below is the authoritative status for Chain, Storage, Compute, DA, wallet, and Agentic ID proofs.
          </p>
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
