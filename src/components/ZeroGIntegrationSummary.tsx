import { Badge, ScrollArea } from "./ui";
import type { Artifact } from "./zeroGArtifacts";

function tone(status: string) {
  if (status === "verified") return "ok";
  if (status === "ready") return "accent";
  return "warn";
}

export function ZeroGIntegrationSummary({
  matrix,
}: {
  matrix: Artifact | null | undefined;
}) {
  if (!matrix?.coverage?.length) {
    return (
      <div className="rounded-md border border-white/10 bg-white/[0.03] p-4" data-testid="integration-summary">
        <Badge tone="warn">Coverage pending</Badge>
        <p className="mt-2 text-sm text-muted">Run `pnpm proof:integration-matrix` to publish end-to-end coverage.</p>
      </div>
    );
  }

  const blockers = matrix.coverage.filter((item) => ["external-blocked", "local-only", "missing"].includes(String(item.status)));
  const counts = matrix.counts ?? {};

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4" data-testid="integration-summary">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tone={matrix.status === "verified" ? "ok" : "warn"}>{String(matrix.status)}</Badge>
          <h3 className="mt-2 text-xl font-bold">0G integration coverage</h3>
        </div>
        <p className="break-all font-mono text-xs text-muted">coverage {matrix.coverageHash}</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-5" data-testid="integration-counts">
        {["verified", "ready", "external-blocked", "local-only", "missing"].map((key) => (
          <div className="rounded-md border border-white/10 bg-black/20 p-3" key={key}>
            <p className="text-xs uppercase text-faint">{key}</p>
            <p className="nums mt-1 text-2xl font-black text-strong">{String(counts[key] ?? 0)}</p>
          </div>
        ))}
      </div>

      <ScrollArea className="mt-4 h-52 rounded-md border border-white/10 bg-black/18">
        <div className="grid gap-2 p-3" data-testid="integration-blockers">
          {blockers.map((item) => (
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3" key={String(item.id)}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={tone(String(item.status))}>{String(item.status)}</Badge>
                <p className="font-semibold">{String(item.label ?? item.id)}</p>
              </div>
              <p className="mt-2 break-all text-xs text-muted">{String(item.proof ?? "")}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
