import { useEffect, useState } from "react";
import { Badge, Panel } from "./ui";
import { ZeroGArtifactDetails } from "./ZeroGArtifactDetails";
import { ZeroGIntegrationSummary } from "./ZeroGIntegrationSummary";
import { artifactFiles, loadArtifact, type Artifact } from "./zeroGArtifacts";

function artifactTone(status: string | undefined): "accent" | "ok" | "warn" {
  if (status === "live" || status === "submitted" || status === "minted" || status === "verified" || status === "settled") return "ok";
  if (status === "ready") return "accent";
  return "warn";
}

export function ZeroGLiveArtifacts() {
  const [artifacts, setArtifacts] = useState<Record<string, Artifact | null>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(artifactFiles.map(async ([file]) => [file, await loadArtifact(file)] as const)).then((entries) => {
      if (!cancelled) setArtifacts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Panel className="p-5" data-testid="zero-g-live-artifacts">
      <Badge tone="accent">Script evidence</Badge>
      <h2 className="mt-3 text-2xl font-bold">Latest 0G artifacts</h2>
      <div className="mt-4">
        <ZeroGIntegrationSummary matrix={artifacts["integration-matrix-latest.json"]} />
      </div>
      <div className="mt-4 grid gap-3">
        {artifactFiles.map(([file, label]) => {
          const artifact = artifacts[file];
          return (
            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3" key={file}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{label}</h3>
                <Badge tone={artifactTone(artifact?.status)}>
                  {artifact?.status ?? "waiting"}
                </Badge>
              </div>
              {artifact ? (
                <ZeroGArtifactDetails artifact={artifact} />
              ) : (
                <p className="mt-2 text-sm text-muted">Run the matching proof script to publish this artifact.</p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
