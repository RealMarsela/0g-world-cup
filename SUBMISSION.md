# Zero Cup Submission - 0G World Cup

## Pitch

0G World Cup turns football drafting into an AI-native, proof-carrying game. Humans and registered AI agents draft full standard XIs from a versioned player pool, lock lineup commitments, simulate tactical outcomes through 0G Compute or a deterministic fallback, store match receipts on 0G Storage, and settle commitments or testnet wagers on 0G Chain.

## Why 0G Is Load-Bearing

- 0G Chain holds room IDs, player snapshot hashes, lineup hashes, wager amounts, result hashes, storage URIs, winners, and agent limits.
- 0G Storage mirrors player snapshots, draft logs, simulation transcripts, share metadata, and proof receipts.
- 0G Compute evaluates agent draft choices, tactical fit, commentary, and structured result generation when credentials are available.

## Demo Flow

1. Solo free run: auto-draft Player XI vs Default Simulation.
2. Free 1v1 draft: show snake draft, unavailable players, captain/style lock.
3. Free group tournament: four entrants draft from one shared pool, play a deterministic round robin, and emit standings.
4. Testnet 1v1 wager: show escrow contract path and testnet-only guard.
5. Testnet group tournament pot: show group-pot mode and testnet-only wager labels.
6. Human vs AI agent: show Agent Manager limits and fallback/0G Compute routing.

## Current Proof

- Snapshot version: `0g-world-cup-local-2026-06-23`
- Snapshot hash: `0x33301f5a9061cc4e38501ab2aaab237b9aeba2917ff0bc5b2b08e5e14d407f33`
- Cloudflare artifacts: D1 SQL seed, R2 object key, and KV active pointer manifest under `data/published/`
- Contracts: deployed on 0G Galileo as Draft `0x37AE4f4BA75b203f45137E7d6C2059d0a0F36475`, Escrow `0xeDf443C63A85daFBE7BF673C5b32a0560aCa832d`, Results `0xc90115A1A35a7B2F2741B2683eE122c25a43dBf6`, and Agentic ID `0x38Cc945DAB9A0fe2b04E7F70cea3a41B3837A5ab`. Foundry tests cover free commitment, wager deposit, invalid settlement, result hash, protocol fee, agent bankroll limits, and Agentic ID lifecycle.
- Browser E2E: Privy wallet `0x23761115c5f38ca51f0d425d00DE6E34029239EC` committed a wager lineup tx `0xed5c6244d5976be40f2b35d2f7f41d8777864b707b5385eb45cd972d4f37cffe`, deposited `0.01 0G` tx `0x03318f31c16c56f9536a0236d06e4fe64fc978f6501cf3e484f9b44892ce815b`, and the project wallet completed the second deposit plus settlement.
- 0G Storage E2E: proof packet uploaded through `@0gfoundation/0g-storage-ts-sdk`, root `0x2df8c6d9d2bf657e2f3cfc5c1c64371dc247e5b6d17257539e66e5882e889c05`, tx `0x324a2629d3e1761044ae44525fd568ae8dac953a7fd2b884d7a25cbdc1bc6e95`; repeat runs reuse the discoverable root instead of resubmitting.
- 0G Storage product bundle: player snapshot, draft log, match transcript, share metadata, and proof receipt uploaded to 0G Storage, bundle hash `0x8c4e06ef14926a8da200fea81d0e09b25bebe3fc0ac6477fbd2de1af313470d1`, root `0x7231c4535d696a9ebfbd13c46394a392b928852c6aea766280523a4e0d065914`, tx `0x14d3e8945af51dc07bdc24b69165ce8b86365bc5fde7ed72485d195152beeafd`.
- 0G Storage readback: `pnpm proof:storage-readback` downloads both Storage roots with SDK proof mode, recomputes Merkle roots, validates the proof packet JSON, and verifies every product bundle item hash.
- 0G Wager settlement E2E: second deposit tx `0xc3094aee3d19c7d04b95da43ad3041f60d735eb67457d9b38fa278d4dc4ec663`, settle tx `0x2c49f366a57bb0eeb1e7f57398d159169d64637573cd8b717660e8eac5c71a8a`, `0.0195 0G` winner payout, and `0.0005 0G` protocol fee verified by `pnpm proof:wager-settlement`.
- 0G Results E2E: owner wallet committed a result receipt to `WorldCupResults`, tx `0x4e450701f7c69c122e3f9bb81dc6249f4f20077fd521503548767bc210926a3c`, pointing to the live Storage URI.
- 0G Chain readback: `pnpm proof:chain-readback` verifies bytecode at all deployed contracts, reads the result receipt from `WorldCupResults`, and reads Agentic ID token `2` with matching encrypted metadata and Storage URI.
- 0G Chain event proof: `pnpm proof:chain-events` verifies the Galileo transaction receipts emitted `ResultCommitted` and `AgentMinted` events matching the persisted proof artifacts.
- 0G Compute status: Router is wired with the ScribeZero key through `https://router-api.0g.ai/v1`, but `pnpm proof:infra-diagnostics` probes both `glm-5.1` and `glm-5.2` and currently receives `402 insufficient_balance`. Direct broker diagnostics are also live through `@0gfoundation/0g-compute-ts-sdk@0.8.4`; `pnpm proof:compute-broker` lists providers and reads chatbot metadata, but the project wallet has `0.030817244283269921 0G`, below the 3 0G ledger minimum. The exact required top-up is `2.969182755716730071 0G`; after funding, `OG_COMPUTE_BROKER_AUTOFUND=1 pnpm proof:compute-runtime` can create the broker ledger. `pnpm proof:compute-runtime` proves real match kickoff tries Router first and direct broker second, then blocks with both funding reasons. No live Compute result is claimed until one funding path is restored.
- 0G DA status: proof batches are byte-ready and include proof, data pipeline, Storage, Storage bundle, Storage readback, Chain, Chain readback, Chain event proof, escrow readiness, browser wallet E2E, wager settlement, Router Compute, direct broker diagnostics, runtime Compute, runtime finalization guard, integration matrix, DA stack readiness, infra diagnostics, Agentic ID, Agentic ID registry, all-agent Agentic ID readback, and Agent Manager readback entries. Latest blob hash: `0x77f1336dda44c33cbc3d8c3d2aad4370bc1f821663d08264ee6c4367764aff34`. The local sidecar `51080`, DA Client `51001`, Encoder `34000`, and Retriever `34005` are reachable, and `OG_DA_CLIENT_GRPC_URL=127.0.0.1:51001` is configured for the sidecar. Live DA submission is still blocked because both documented Galileo DAEntrance candidates currently have no bytecode on `https://evmrpc-testnet.0g.ai`: `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` from the Testnet overview and `0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9` from the DA integration envfile example. `pnpm proof:da-sidecar` therefore skips a doomed submit and records the exact blocker.
- Cloudflare Tunnel bridge: `pnpm proof:cloudflare-tunnel` records whether a public HTTPS tunnel is configured for the DA sidecar/app. This lets judges or sibling apps reach a local 0G DA sidecar without turning Cloudflare into the proof authority; final truth stays with 0G Chain, 0G Storage, 0G DA payloads, and Compute receipts.
- Agentic ID status: two default agents have encrypted metadata on 0G Storage and minted Agentic IDs on Galileo: ZeroNine token `2`, KeeperNet token `3`; readback verifies ZeroNine token `2` encrypted metadata plus decrypted policy.
- Agent Manager readback: `pnpm proof:agent-manager-readback` joins the registry, Chain readback, Chain events, and Agentic ID Storage readback into one live manager artifact for `/agents` and `/proof/:roomId`; latest readback hash `0xb84db2f6fe3b756dca51a575a32ae72ae0bc046897649accddd16f8c31601ab6`.
- Agentic ID readback: `pnpm proof:agentic-readback` downloads both agents' encrypted metadata from 0G Storage with proof mode, recomputes Merkle roots and encrypted metadata hashes, and verifies each decrypted identity/policy.
- UI routes: `/`, `/solo`, `/room/create`, `/room/:id`, `/draft/:roomId`, `/simulate/:roomId`, `/result/:roomId`, `/proof/:roomId`, `/agents`, `/leaderboard`
- Brute verification: `pnpm test:brute` chains typecheck, app logic tests, Foundry contracts, complete 0G proof lane, proof artifact/doc invariants, Playwright E2E, and production build.
- Share: result pages include an X intent button and a generated PNG download card with winner, score/points, MVP, wager/free badge, and proof hash.
- Agent registry: `src/worldcup/agents.ts` includes registered demo agents with owner wallets, bankrolls, wager caps, daily/opponent caps, stop-loss, allowed modes, records, challenge fees, and compute policy.
