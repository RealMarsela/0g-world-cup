import { useState } from "react";
import { useParams } from "react-router-dom";
import { keccak256, parseEther, toBytes, type Address } from "viem";
import { Badge, Button, DataTable, Panel } from "../components/ui";
import { ZeroGLiveArtifacts } from "../components/ZeroGLiveArtifacts";
import { ZeroGProofStack } from "../components/ZeroGProofStack";
import { CONTRACTS, ZERO_G } from "../config/chain";
import { worldCupDraftAbi, worldCupEscrowAbi } from "../config/contractAbis";
import { useTx } from "../wallet/useTx";
import { useXWallet } from "../wallet/useXWallet";
import { completeDraft, createRoomFromId, roomReceipt, simulate } from "../worldcup/game";

function asBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value)
    ? value as `0x${string}`
    : keccak256(toBytes(value));
}

export function Proof() {
  const { roomId = "room-free-1v1" } = useParams();
  const room = completeDraft(createRoomFromId(roomId));
  const result = simulate(room);
  const receipt = roomReceipt(room, result);
  const sendTx = useTx();
  const wallet = useXWallet();
  const [lastHash, setLastHash] = useState<`0x${string}` | null>(null);
  const roomHash = asBytes32(room.id);
  const snapshotHash = asBytes32(room.snapshotHash);
  const lineupHash = asBytes32(receipt.lineupHash);
  const hasContracts = Boolean(CONTRACTS.draft && CONTRACTS.escrow);
  const isWager = room.wagerAmount !== "free";
  const walletReady = wallet.ready && wallet.authenticated && Boolean(wallet.address);

  const commitLineup = async () => {
    if (!CONTRACTS.draft || !walletReady) return;
    const hash = await sendTx({
      address: CONTRACTS.draft as Address,
      abi: worldCupDraftAbi,
      functionName: "commitLineup",
      args: [roomHash, snapshotHash, lineupHash, isWager ? parseEther("0.01") : 0n],
      pending: "Committing lineup on 0G",
      success: "Lineup committed",
    });
    setLastHash(hash);
  };

  const depositWager = async () => {
    if (!CONTRACTS.escrow || !walletReady) return;
    const hash = await sendTx({
      address: CONTRACTS.escrow as Address,
      abi: worldCupEscrowAbi,
      functionName: "deposit",
      args: [roomHash],
      value: parseEther("0.01"),
      pending: "Depositing testnet wager",
      success: "Wager deposited",
    });
    setLastHash(hash);
  };

  return (
    <div className="grid gap-5">
      <Panel className="p-5 sm:p-6">
        <Badge tone="accent">Proof receipt</Badge>
        <h1 className="mt-3 text-4xl font-black">{room.id}</h1>
        <p className="mt-2 text-muted">These are the values committed by the contracts and mirrored to 0G Storage when credentials and deployer are available.</p>
      </Panel>
      <Panel className="p-4">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ...Object.entries(receipt).map(([key, value]) => [
              <span className="text-faint">{key}</span>,
              <span className="break-all font-mono text-strong">{String(value)}</span>,
            ]),
            [
              <span className="text-faint">0G explorer</span>,
              <a className="text-accent" href={ZERO_G.explorer} target="_blank" rel="noreferrer">{ZERO_G.explorer}</a>,
            ],
          ]}
        />
      </Panel>
      <ZeroGProofStack packet={result.proofPacket} />
      <ZeroGLiveArtifacts />
      <Panel className="p-5">
        <Badge tone={hasContracts ? "ok" : "warn"}>{hasContracts ? "Contracts configured" : "Contracts missing"}</Badge>
        <h2 className="mt-3 text-2xl font-bold">0G Chain E2E actions</h2>
        <p className="mt-2 text-sm text-muted">
          These buttons use the connected wallet on 0G Galileo. Wager deposits are testnet-only and fixed at 0.01 0G for E2E.
          A wager room is start-ready only after two unique wallets deposit the same amount.
        </p>
        <p className="mt-3 text-sm text-muted" data-testid="proof-wallet-state">
          {!wallet.enabled
            ? "Wallet actions are disabled because Privy is not configured."
            : !wallet.ready
              ? "Wallet actions are waiting for Privy to become ready."
              : walletReady
                ? `Wallet ready: ${wallet.address}`
                : "Connect a wallet before committing lineup or depositing a wager."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {!walletReady && wallet.ready && wallet.enabled && (
            <Button type="button" variant="secondary" onClick={wallet.login}>Connect wallet</Button>
          )}
          <Button type="button" onClick={commitLineup} disabled={!CONTRACTS.draft || !walletReady}>Commit lineup</Button>
          {isWager && (
            <Button type="button" variant="secondary" onClick={depositWager} disabled={!CONTRACTS.escrow || !walletReady}>Deposit 0.01 0G</Button>
          )}
        </div>
        {lastHash && (
          <a className="mt-4 block break-all text-sm text-accent" href={`${ZERO_G.explorer}/tx/${lastHash}`} target="_blank" rel="noreferrer">
            Last tx: {lastHash}
          </a>
        )}
      </Panel>
    </div>
  );
}
