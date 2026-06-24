import { useEffect, useState } from "react";
import { AlertTriangle, Cpu, Database, ShieldCheck } from "lucide-react";
import { Badge, Panel } from "./ui";
import { loadArtifact, type Artifact } from "./zeroGArtifacts";

const files = [
  "compute-runtime-latest.json",
  "compute-broker-latest.json",
  "runtime-finalize-latest.json",
  "da-sidecar-latest.json",
] as const;

function statusTone(status?: string) {
  return status === "live" || status === "ready" || status === "submitted" ? "ok" : "warn";
}

function text(value: unknown) {
  return String(value ?? "");
}

export function ZeroGRuntimeGate() {
  const [artifacts, setArtifacts] = useState<Record<string, Artifact | null>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(files.map(async (file) => [file, await loadArtifact(file)] as const)).then((entries) => {
      if (!cancelled) setArtifacts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const computeRuntime = artifacts["compute-runtime-latest.json"];
  const computeBroker = artifacts["compute-broker-latest.json"];
  const finalize = artifacts["runtime-finalize-latest.json"];
  const daSidecar = artifacts["da-sidecar-latest.json"];
  const brokerWallet = computeBroker?.wallet;
  const blocker = computeRuntime?.reason || computeRuntime?.output?.blocker;

  return (
    <Panel className="p-5" data-testid="zero-g-runtime-gate">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone={statusTone(computeRuntime?.status)}>0G runtime gate</Badge>
          <h2 className="mt-3 text-2xl font-bold">Compute-authoritative kickoff</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Real human or agent matches must pass 0G Compute before the app can reveal a score, write Storage, or commit Chain finalization.
          </p>
        </div>
        <Badge tone={finalize?.status === "live" ? "ok" : "warn"}>{finalize?.status === "live" ? "finalizable" : "finalization guarded"}</Badge>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <Cpu className="text-accent" size={18} />
          <p className="mt-2 text-xs uppercase text-faint">Compute path</p>
          <p className="mt-1 break-all text-sm font-semibold">{text(computeRuntime?.output?.computeMode || computeRuntime?.status || "waiting")}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <ShieldCheck className="text-accent" size={18} />
          <p className="mt-2 text-xs uppercase text-faint">Broker wallet</p>
          <p className="mt-1 break-all text-sm font-semibold">{text(brokerWallet?.address || "waiting")}</p>
          {brokerWallet?.requiredTopUpOg && <p className="mt-1 text-xs text-amber-100">top up {brokerWallet.requiredTopUpOg} 0G</p>}
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <Database className="text-accent" size={18} />
          <p className="mt-2 text-xs uppercase text-faint">DA sidecar</p>
          <p className="mt-1 break-all text-sm font-semibold">{text(daSidecar?.status || "waiting")}</p>
          {daSidecar?.blobHash && <p className="mt-1 break-all font-mono text-xs text-muted">{daSidecar.blobHash}</p>}
        </div>
      </div>

      {blocker && (
        <div className="mt-4 flex gap-3 rounded-md border border-amber-300/25 bg-amber-300/10 p-3" data-testid="runtime-gate-blocker">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-200" size={18} />
          <p className="break-all text-sm text-amber-50/85">{blocker}</p>
        </div>
      )}
      {daSidecar?.reason && <p className="mt-3 break-all text-xs text-muted">{daSidecar.reason}</p>}
    </Panel>
  );
}
