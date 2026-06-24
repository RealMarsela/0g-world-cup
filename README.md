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

## Full Verification

Use the brute gate when a change touches gameplay, contracts, proof scripts, proof artifacts, or UI proof surfaces:

```bash
pnpm test:brute
```

It runs typecheck, app logic tests, Foundry contracts, the complete 0G proof lane, proof artifact/doc invariants, Playwright E2E, and production build. The 0G proof lane is honest about external blockers: currently Compute records funding blockers and DA records the Galileo DAEntrance bytecode blocker instead of claiming fake live results.

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
pnpm proof:integration-matrix
pnpm da:stack:prepare
pnpm proof:da-stack
pnpm proof:agentic-id
pnpm proof:agentic-mint
pnpm proof:agentic-registry
pnpm proof:agentic-registry-mint
pnpm proof:agentic-readback
pnpm proof:agent-manager-readback
pnpm proof:da
pnpm proof:da-sidecar
pnpm test:0g
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
pnpm proof:cloudflare-tunnel
```

Cloudflare Tunnel is an ingress bridge only. It is useful for judging, cross-app testing, and sharing the local DA sidecar while the 0G DA Client is machine-local; it is not the final source of truth. Chain, Storage, DA payloads, and Compute receipts remain committed through the 0G proof scripts. Current Cloudflare Workers pricing docs list the paid account minimum at $5/month with 10M included monthly Worker requests and 30M included CPU-ms; lightweight tunnel demos should not meaningfully add Workers cost unless we also put room coordination/Functions traffic on Workers.

`pnpm proof:da` and `pnpm proof:da-sidecar` refresh the DA stack preflight before writing new artifacts. If `OG_DA_CLIENT_GRPC_URL` is not exported but the sidecar health endpoint reports a configured DA Client, the proof scripts derive the local endpoint from the sidecar. If neither source exists, they write an honest blocked artifact with the exact missing-client reason.

## 0G DA Local Stack

The project includes a project-local DA stack generator and readiness proof:

```bash
pnpm da:stack:prepare
pnpm proof:da-stack
```

`pnpm da:stack:prepare` writes ignored files under `.da-stack/`: the DA Client `envfile.env`, Retriever config, and local instructions. `pnpm proof:da-stack` checks Docker, Colima, Docker Compose, generated files, the sidecar, DA Client `51001`, Encoder `34000`, and Retriever `34005`, validates the configured DAEntrance bytecode on the selected RPC, then writes `proof-artifacts/da-stack-readiness-latest.json`.

Current machine state: Docker, Colima, Docker Compose, the HTTP sidecar `51080`, DA Client `51001`, Encoder `34000`, and Retriever `34005` are reachable. Live DA submission is still blocked by the Galileo DAEntrance preflight: both documented candidates currently have no bytecode on `https://evmrpc-testnet.0g.ai` (`0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` from the Testnet overview and `0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9` from the DA integration envfile example), so `pnpm proof:da-sidecar` skips the doomed submit and writes the exact blocker.

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
- 0G Storage upload is live through `@0gfoundation/0g-storage-ts-sdk`; latest proof root `0x2df8c6d9d2bf657e2f3cfc5c1c64371dc247e5b6d17257539e66e5882e889c05`, tx `0x324a2629d3e1761044ae44525fd568ae8dac953a7fd2b884d7a25cbdc1bc6e95`.
- 0G Storage bundle upload is live for product evidence: player snapshot, draft log, match transcript, share metadata, and proof receipt, bundle hash `0x8c4e06ef14926a8da200fea81d0e09b25bebe3fc0ac6477fbd2de1af313470d1`, root `0x7231c4535d696a9ebfbd13c46394a392b928852c6aea766280523a4e0d065914`, tx `0x14d3e8945af51dc07bdc24b69165ce8b86365bc5fde7ed72485d195152beeafd`.
- 0G Storage readback is live: `pnpm proof:storage-readback` downloads both Storage roots with SDK proof mode, recomputes Merkle roots, and validates the product bundle item hashes.
- 0G Compute runtime is wired into match kickoff/finalization, but the hosted Router response is blocked by `402 insufficient_balance`; `pnpm proof:infra-diagnostics` probes both `glm-5.1` and `glm-5.2` on the same ScribeZero router key fingerprint and both return insufficient balance. Direct broker diagnostics are also wired through `@0gfoundation/0g-compute-ts-sdk`: `pnpm proof:compute-broker` initializes the broker, lists two providers, reads chatbot metadata at `https://compute-network-6.integratenetwork.work/v1/proxy`, and records that the project wallet has only `0.030817244283269921 0G`, below the 3 0G ledger minimum. The exact required top-up is `2.969182755716730071 0G`; after funding, rerun `OG_COMPUTE_BROKER_AUTOFUND=1 pnpm proof:compute-runtime`. `pnpm proof:compute-runtime` now proves the app kickoff path tries Router first, then direct broker, and blocks with both exact funding reasons instead of finalizing a fake score.
- 0G DA builds a byte-ready availability batch from proof, data pipeline, Storage, Chain, browser wallet, wager settlement, Router Compute, direct broker diagnostics, runtime Compute, runtime finalization guard, integration matrix, Cloudflare tunnel readiness, DA stack readiness, infra diagnostics, and Agentic ID/registry/readback artifacts; latest blob hash `0x77f1336dda44c33cbc3d8c3d2aad4370bc1f821663d08264ee6c4367764aff34`. `pnpm proof:da-sidecar` can submit that blob through the local sidecar to a configured 0G DA Client gRPC endpoint. Official 0G docs require running a DA Client plus Encoder/Retriever; diagnostics now show the sidecar, DA Client, Encoder, and Retriever ports are listening locally, but live submit is blocked because both documented Galileo DAEntrance candidates have no bytecode on the configured RPC.
- Two Agentic ID agents are live in the registry with real project images, encrypted metadata on 0G Storage, and minted Agentic ID tokens on Galileo: ZeroNine token `2`, KeeperNet token `3`.
- Agent Manager live readback is wired into scripts and UI: `pnpm proof:agent-manager-readback` verifies both registry agents against Galileo `AgentMinted` events, contract token state where available, 0G Storage metadata roots, and writes readback hash `0xb84db2f6fe3b756dca51a575a32ae72ae0bc046897649accddd16f8c31601ab6` for `/agents` and `/proof/:roomId`.
