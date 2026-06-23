# 0G World Cup

Full-XI multiplayer World Cup drafting for the 0G Zero Cup.

Humans and AI agents draft real national-team players, play free or testnet-wager battles, run 1v1 matches or group tournaments, simulate through 0G Compute when configured, mirror receipts to 0G Storage, and settle commitments/results on 0G Chain.

## Stack

- Vite + React + TypeScript + Tailwind v4
- Privy wallet path reused from the source app, pointed at 0G Galileo
- Foundry contracts for lineup commitments, two-sided wager escrow, results, and agent limits
- Cloudflare-first backend plan: D1 player indexes, R2 snapshots, KV active pointer, Durable Objects/WebSockets room state
- 0G Galileo testnet: chain ID `16602`, explorer `https://chainscan-galileo.0g.ai`

## Run Locally

```bash
pnpm install
pnpm data:import
pnpm data:normalize
pnpm data:rate
pnpm data:publish
pnpm data:verify
pnpm build
forge test
pnpm dev
```

## 0G Setup

```bash
export OG_RPC_URL=https://evmrpc-testnet.0g.ai
export OG_PRIVATE_KEY=0x...
export OG_STORAGE_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
pnpm smoke:0g
pnpm proof:packet
pnpm proof:storage
pnpm proof:storage-bundle
pnpm proof:storage-readback
pnpm proof:chain-result
pnpm proof:chain-readback
pnpm proof:chain-events
pnpm proof:escrow-readiness
pnpm proof:browser-wallet
pnpm proof:wager-settlement
pnpm proof:compute
pnpm proof:compute-broker
pnpm proof:compute-runtime
pnpm proof:infra-diagnostics
pnpm da:stack:prepare
pnpm proof:da-stack
pnpm proof:agentic-id
pnpm proof:agentic-mint
pnpm proof:agentic-readback
pnpm proof:da
pnpm proof:da-sidecar
```

Deploy contracts when a funded deployer is approved:

```bash
forge script scripts/Deploy.s.sol:Deploy \
  --rpc-url "$OG_RPC_URL" \
  --private-key "$OG_PRIVATE_KEY" \
  --broadcast
```

Current 0G Galileo testnet contracts:

- `WorldCupDraft`: `0x37AE4f4BA75b203f45137E7d6C2059d0a0F36475`
- `WorldCupEscrow`: `0xeDf443C63A85daFBE7BF673C5b32a0560aCa832d`
- `WorldCupResults`: `0xc90115A1A35a7B2F2741B2683eE122c25a43dBf6`
- `WorldCupAgentId`: `0x38Cc945DAB9A0fe2b04E7F70cea3a41B3837A5ab`

## Cloudflare Setup

```bash
wrangler d1 create 0g-world-cup
wrangler d1 execute 0g-world-cup --file cloudflare/schema.sql
wrangler r2 bucket create 0g-world-cup-snapshots
wrangler kv namespace create ACTIVE_SNAPSHOT
```

Update `wrangler.jsonc` with the generated IDs before deploying `worker/room.ts`.
The local publish step also writes deployment-ready data artifacts:

- D1 seed SQL: `data/published/0g-world-cup-local-2026-06-23.d1.sql`
- R2 object key: `snapshots/0g-world-cup-local-2026-06-23.json`
- KV active pointer manifest: `data/published/0g-world-cup-local-2026-06-23.cloudflare-manifest.json`

## 0G DA Sidecar

0G DA submission requires a running 0G DA Client with Encoder/Retriever. Run the local HTTP sidecar in front of that gRPC service:

```bash
export OG_DA_CLIENT_GRPC_URL=127.0.0.1:51001
pnpm da:sidecar
pnpm proof:da-sidecar
```

For cross-app testing, expose only the HTTP sidecar with Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://127.0.0.1:51080
export OG_DA_SIDECAR_URL=https://your-tunnel.trycloudflare.com
```

Without `OG_DA_CLIENT_GRPC_URL`, `pnpm proof:da-sidecar` writes an honest blocked artifact with the exact missing-client reason.

## 0G DA Local Stack

The project includes a project-local DA stack generator and readiness proof:

```bash
pnpm da:stack:prepare
pnpm proof:da-stack
```

`pnpm da:stack:prepare` writes ignored files under `.da-stack/`: the DA Client `envfile.env`, Retriever config, and local instructions. `pnpm proof:da-stack` checks Docker, Colima, Docker Compose, generated files, the sidecar, DA Client `51001`, Encoder `34000`, and Retriever `34005`, then writes `proof-artifacts/da-stack-readiness-latest.json`.

Current machine state is honestly blocked: Docker CLI exists, Colima is installed but stopped, Docker Compose is unavailable, sidecar `51080` is reachable, and DA Client/Encoder/Retriever ports are closed.

## Demo Script

1. Open `/` and show the snapshot hash, 0G chain config, and demo ladder.
2. Run `/solo` to auto-draft two full XIs and produce a deterministic result.
3. Open `/room/create`, choose `Free 1v1`, `Free group tournament`, `Testnet 1v1 wager`, or `Testnet group tournament pot`, then enter the draft.
4. Use `/agents` to show bankroll and wager limits for the default registered agent.
5. Open `/result/:roomId` to share on X or download a generated PNG result card.
6. Open `/proof/:roomId` to show the commitment values that map to 0G Chain and Storage.
7. Open `/proof/room-human-vs-agent-chain-1782223853` to show the latest live script artifacts served from `public/proof-artifacts/`.

## Truth Boundary

- The local app has full XI draft, group tournament, simulation, proof, PNG share card, agent, and leaderboard flows.
- The runtime player pool uses the canonical Fjelstul historical World Cup snapshot: `8,379` players, `368` squads, 1970-2022; provider adapters remain scaffolded and key-gated for richer future stats.
- 0G Chain config is live, contracts are deployed on 0G Galileo, and the owner wallet has committed a result receipt to `WorldCupResults`.
- 0G Chain readback is live: all Draft/Escrow/Results/Agentic ID contracts have bytecode on Galileo, the result receipt reads back from `WorldCupResults`, ZeroNine Agentic ID token `2` reads back with matching encrypted metadata and storage URI, and `pnpm proof:chain-events` verifies the emitted `ResultCommitted` plus both registry `AgentMinted` logs.
- 0G Escrow readiness readback is live: `pnpm proof:escrow-readiness` reads `canStart(room, 2)` plus `escrows(room)` from Galileo, so the UI shows the current two-unique-depositor start gate instead of relying only on local contract tests.
- Browser wallet E2E is current-deployment live: Privy wallet `0x23761115c5f38ca51f0d425d00DE6E34029239EC` committed lineup tx `0xed5c6244d5976be40f2b35d2f7f41d8777864b707b5385eb45cd972d4f37cffe` to `WorldCupDraft` and deposited `0.01 0G` tx `0x03318f31c16c56f9536a0236d06e4fe64fc978f6501cf3e484f9b44892ce815b` to `WorldCupEscrow`; `pnpm proof:browser-wallet` verifies receipts, events, commitment state, `hasDeposited`, and settled escrow state.
- Testnet wager settlement is live: project wallet `0x3D325E51934AE5c7EBf9f37a8Ddf772F48F766Fb` added the second `0.01 0G` deposit tx `0xc3094aee3d19c7d04b95da43ad3041f60d735eb67457d9b38fa278d4dc4ec663`, then settled tx `0x2c49f366a57bb0eeb1e7f57398d159169d64637573cd8b717660e8eac5c71a8a` to the browser wallet winner; `pnpm proof:wager-settlement` verifies `canStart` was true before settlement, `Settled` emitted, `0.0195 0G` payout, `0.0005 0G` fee, and `canStart=false` after settlement.
- 0G Storage upload is live through `@0gfoundation/0g-storage-ts-sdk`; latest proof root `0xc7620208c2d553b2a12e473548da871536449bf38471f49f3da3bb1b22c84ef5`, tx `0x5d131ab4b60297b51f354798c1766a9bc388a86489b78a1bda475d8085cb214c`.
- 0G Storage bundle upload is live for product evidence: player snapshot, draft log, match transcript, share metadata, and proof receipt, root `0xd2d4fc1dc70a4f5ed5d89c16758da4e9152c23882cef2bfbe48050f3622c15b1`, tx `0x31c55b88753fc2af9566ecdde71c2dfb5b548ebdc11e493cb208f6abfa07b124`.
- 0G Storage readback is live: `pnpm proof:storage-readback` downloads both Storage roots with SDK proof mode, recomputes Merkle roots, and validates the product bundle item hashes.
- 0G Compute runtime is wired into match kickoff/finalization, but the hosted Router response is blocked by `402 insufficient_balance`; `pnpm proof:infra-diagnostics` probes both `glm-5.1` and `glm-5.2` on the same ScribeZero router key fingerprint and both return insufficient balance. Direct broker diagnostics are also wired through `@0gfoundation/0g-compute-ts-sdk`: `pnpm proof:compute-broker` initializes the broker, lists two providers, reads chatbot metadata at `https://compute-network-6.integratenetwork.work/v1/proxy`, and records that the project wallet has only `0.038417174288134078 0G`, below the 3 0G ledger minimum. `pnpm proof:compute-runtime` now proves the app kickoff path tries Router first, then direct broker, and blocks with both exact funding reasons instead of finalizing a fake score.
- 0G DA builds a byte-ready availability batch from proof, Storage, Chain, browser wallet, wager settlement, Router Compute, direct broker diagnostics, runtime Compute, DA stack readiness, infra diagnostics, and Agentic artifacts; latest blob hash `0x2a4955216d8615c99f80bdfc732f9d5dc82ba4f8d5beb96b65e56d13efdf0ee0`. `pnpm proof:da-sidecar` can submit that blob through the local sidecar to a configured 0G DA Client gRPC endpoint. Official 0G docs require running a DA Client plus Encoder/Retriever; diagnostics show the sidecar is reachable on `51080` but no DA Client on `51001`, Encoder on `34000`, or Retriever on `34005` is listening locally.
- Two Agentic ID agents are live in the registry with real project images, encrypted metadata on 0G Storage, and minted Agentic ID tokens on Galileo: ZeroNine token `2`, KeeperNet token `3`.
