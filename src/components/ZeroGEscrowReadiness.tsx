import { useEffect, useState } from "react";
import { Badge, Panel } from "./ui";
import { loadArtifact, type Artifact } from "./zeroGArtifacts";

const files = [
  "escrow-readiness-latest.json",
  "browser-wallet-latest.json",
  "wager-settlement-latest.json",
] as const;

function text(value: unknown) {
  return String(value ?? "");
}

function short(value: unknown) {
  const raw = text(value);
  return raw.length > 22 ? `${raw.slice(0, 12)}...${raw.slice(-8)}` : raw;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function ZeroGEscrowReadiness() {
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

  const escrow = artifacts["escrow-readiness-latest.json"];
  const wallet = artifacts["browser-wallet-latest.json"];
  const settlement = artifacts["wager-settlement-latest.json"];
  const walletState = record(wallet?.state);
  const walletExpected = record(wallet?.expected);
  const settlementState = record(settlement?.state);
  const settlementAfter = record(settlementState.afterSettlement);
  const state = record(escrow?.escrow ?? walletState.escrow);
  const walletTransactions = record(wallet?.transactions);
  const settlementTransactions = record(settlement?.transactions);
  const settled = state.settled ?? settlementAfter.settled;
  const gateLabel = settled ? "settled" : escrow?.canStart ? "can start" : "not start-ready";
  const hasArtifacts = Boolean(escrow || wallet || settlement);
  const commitTx = text(walletTransactions.commit);
  const depositTx = text(walletTransactions.deposit);
  const secondDepositTx = text(settlementTransactions.secondDeposit);
  const settleTx = text(settlementTransactions.settle);

  return (
    <Panel className="p-5" data-testid="zero-g-escrow-readiness">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tone={escrow?.status === "live" ? "ok" : "warn"}>Live escrow readiness</Badge>
          <h2 className="mt-3 text-2xl font-bold">0G wager start gate</h2>
        </div>
        <Badge tone={escrow?.canStart || settled ? "ok" : "warn"}>{gateLabel}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted">
        Testnet wagers require two unique matching deposits before kickoff. Current proof is read from 0G Galileo artifacts.
      </p>
      {!hasArtifacts && (
        <div className="mt-4 rounded-md border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-100">
          Escrow proof artifacts are missing from the local proof bundle.
        </div>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs uppercase text-faint">Escrow contract</p>
          <p className="mt-1 break-all font-mono text-sm">{short(escrow?.contract)}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs uppercase text-faint">Deposits</p>
          <p className="mt-1 font-mono text-sm">{text(state.depositCount)} / {text(escrow?.requiredDeposits ?? walletExpected.requiredDeposits)}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs uppercase text-faint">Settled</p>
          <p className="mt-1 font-mono text-sm">{text(settled)}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-muted" data-testid="zero-g-escrow-transactions">
        {commitTx && <p className="break-all font-mono">lineup commit {commitTx}</p>}
        {depositTx && <p className="break-all font-mono">wallet deposit {depositTx}</p>}
        {secondDepositTx && <p className="break-all font-mono">counterparty deposit {secondDepositTx}</p>}
        {settleTx && <p className="break-all font-mono">settlement {settleTx}</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(escrow?.checks ?? {}).map(([key, ok]) => (
          <Badge key={key} tone={ok ? "ok" : "warn"}>{key}:{ok ? "ok" : "fail"}</Badge>
        ))}
      </div>
    </Panel>
  );
}
