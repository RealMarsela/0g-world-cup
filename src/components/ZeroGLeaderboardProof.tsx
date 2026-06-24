import { useEffect, useState } from "react";
import { Badge, DataTable, Panel } from "./ui";
import { loadArtifact, type Artifact } from "./zeroGArtifacts";

const files = [
  "chain-events-latest.json",
  "chain-result-latest.json",
  "wager-settlement-latest.json",
  "storage-latest.json",
] as const;

function valueText(value: unknown) {
  return String(value ?? "");
}

function shortHash(value: unknown) {
  const text = valueText(value);
  return text.length > 22 ? `${text.slice(0, 12)}...${text.slice(-8)}` : text;
}

export function ZeroGLeaderboardProof() {
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

  const chainEvents = artifacts["chain-events-latest.json"];
  const chainResult = artifacts["chain-result-latest.json"];
  const wager = artifacts["wager-settlement-latest.json"];
  const storage = artifacts["storage-latest.json"];
  const chainEventValues = chainEvents?.events as Record<string, unknown> | undefined;
  const resultEvent = chainEventValues?.resultCommitted as Record<string, unknown> | undefined;
  const chainId = valueText(chainEvents?.chainId);
  const liveRows = [
    {
      label: "Result commitment",
      room: chainResult?.roomId,
      winner: resultEvent?.winner,
      proof: chainResult?.txHash || chainEvents?.transactions?.result,
      status: chainEvents?.checks?.resultEventFound ? "verified" : chainResult?.status,
    },
    {
      label: "Wager settlement",
      room: wager?.roomId,
      winner: wager?.winner,
      proof: wager?.transactions?.settle,
      status: wager?.checks?.winnerReceivedPayout ? "verified" : wager?.status,
    },
    {
      label: "Storage receipt",
      room: storage?.roomId,
      winner: "0G Storage",
      proof: storage?.rootHash,
      status: storage?.status,
    },
  ].filter((row) => row.proof);

  return (
    <Panel className="p-5" data-testid="zero-g-leaderboard-proof">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tone={liveRows.length ? "ok" : "warn"}>Live 0G leaderboard proof</Badge>
          <h2 className="mt-3 text-2xl font-bold">Chain-ranked proof entries</h2>
        </div>
        {chainId && <Badge tone="accent">0G {chainId}</Badge>}
      </div>
      <p className="mt-2 text-sm text-muted">
        These rows come from the latest 0G Chain, escrow settlement, and Storage proof artifacts. The sample table below remains local demo ranking.
      </p>
      <div className="mt-4">
        <DataTable
          columns={["Proof lane", "Room", "Winner", "Evidence"]}
          rows={liveRows.map((row) => [
            <span className="font-semibold">{row.label}</span>,
            <span className="break-all font-mono">{valueText(row.room)}</span>,
            <span className="break-all font-mono">{shortHash(row.winner)}</span>,
            <span className="break-all font-mono">{shortHash(row.proof)} / {valueText(row.status)}</span>,
          ])}
        />
      </div>
    </Panel>
  );
}
