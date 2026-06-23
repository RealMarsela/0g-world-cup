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
- 0G Storage E2E: proof packet uploaded through `@0gfoundation/0g-storage-ts-sdk`, root `0xc7620208c2d553b2a12e473548da871536449bf38471f49f3da3bb1b22c84ef5`, tx `0x5d131ab4b60297b51f354798c1766a9bc388a86489b78a1bda475d8085cb214c`; repeat runs reuse the discoverable root instead of resubmitting.
- 0G Storage product bundle: player snapshot, draft log, match transcript, share metadata, and proof receipt uploaded to 0G Storage, root `0xd2d4fc1dc70a4f5ed5d89c16758da4e9152c23882cef2bfbe48050f3622c15b1`, tx `0x31c55b88753fc2af9566ecdde71c2dfb5b548ebdc11e493cb208f6abfa07b124`.
- 0G Storage readback: `pnpm proof:storage-readback` downloads both Storage roots with SDK proof mode, recomputes Merkle roots, validates the proof packet JSON, and verifies every product bundle item hash.
- 0G Wager settlement E2E: second deposit tx `0xc3094aee3d19c7d04b95da43ad3041f60d735eb67457d9b38fa278d4dc4ec663`, settle tx `0x2c49f366a57bb0eeb1e7f57398d159169d64637573cd8b717660e8eac5c71a8a`, `0.0195 0G` winner payout, and `0.0005 0G` protocol fee verified by `pnpm proof:wager-settlement`.
- 0G Results E2E: owner wallet committed a result receipt to `WorldCupResults`, tx `0x4e450701f7c69c122e3f9bb81dc6249f4f20077fd521503548767bc210926a3c`, pointing to the live Storage URI.
- 0G Chain readback: `pnpm proof:chain-readback` verifies bytecode at all deployed contracts, reads the result receipt from `WorldCupResults`, and reads Agentic ID token `2` with matching encrypted metadata and Storage URI.
- 0G Chain event proof: `pnpm proof:chain-events` verifies the Galileo transaction receipts emitted `ResultCommitted` and `AgentMinted` events matching the persisted proof artifacts.
- 0G Compute status: Router is wired with the ScribeZero key through `https://router-api.0g.ai/v1`, but `pnpm proof:infra-diagnostics` probes both `glm-5.1` and `glm-5.2` and currently receives `402 insufficient_balance`. Direct broker diagnostics are also live through `@0gfoundation/0g-compute-ts-sdk@0.8.4`; `pnpm proof:compute-broker` lists providers and reads chatbot metadata, but the project wallet is below the 3 0G ledger minimum. `pnpm proof:compute-runtime` proves real match kickoff tries Router first and direct broker second, then blocks with both funding reasons. No live Compute result is claimed until one funding path is restored.
- 0G DA status: proof batches are byte-ready and include proof, Storage, Storage bundle, Storage readback, Chain, Chain readback, Chain event proof, escrow readiness, browser wallet E2E, wager settlement, Router Compute, direct broker diagnostics, runtime Compute, DA stack readiness, infra diagnostics, Agentic ID, and Agentic ID readback entries. Live DA submission is blocked until a DA Client/Encoder/Retriever endpoint is configured; diagnostics show sidecar reachable on `51080`, but no DA Client `51001`, Encoder `34000`, or Retriever `34005` locally. `pnpm da:stack:prepare` and `pnpm proof:da-stack` generate project-local config and prove Docker/Colima/Compose/port readiness.
- Agentic ID status: two default agents have encrypted metadata on 0G Storage and minted Agentic IDs on Galileo: ZeroNine token `2`, KeeperNet token `3`; readback verifies ZeroNine token `2` encrypted metadata plus decrypted policy.
- Agentic ID readback: `pnpm proof:agentic-readback` downloads encrypted metadata from 0G Storage with proof mode, recomputes the Merkle root and encrypted metadata hash, and verifies the decrypted default-agent identity/policy.
- UI routes: `/`, `/solo`, `/room/create`, `/room/:id`, `/draft/:roomId`, `/simulate/:roomId`, `/result/:roomId`, `/proof/:roomId`, `/agents`, `/leaderboard`
- Share: result pages include an X intent button and a generated PNG download card with winner, score/points, MVP, wager/free badge, and proof hash.
- Agent registry: `src/worldcup/agents.ts` includes registered demo agents with owner wallets, bankrolls, wager caps, daily/opponent caps, stop-loss, allowed modes, records, challenge fees, and compute policy.
