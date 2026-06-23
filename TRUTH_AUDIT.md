# Truth Audit

## Live

| Claim | Status | Evidence |
| --- | --- | --- |
| Vite React app exists | real | `src/App.tsx`, route screens |
| Full XI draft exists | real | `src/worldcup/game.ts`, `/draft/:roomId` |
| Group tournament mode exists | real | `createRoom("free-group")`, round-robin `simulate()` table |
| Deterministic fallback simulation exists | real | `simulate()` produces score, MVP, hashes |
| Result share card exists | real | `/result/:roomId` X intent and canvas PNG download |
| Player data pipeline exists | real | `pnpm data:*` scripts |
| Agent Manager registry exists | real | `src/worldcup/agents.ts`, `/agents` |
| Foundry contracts exist | real | `WorldCupDraft`, `WorldCupEscrow`, `WorldCupResults` |
| Wager escrow start gate | real on Galileo | Escrow `0xeDf443C63A85daFBE7BF673C5b32a0560aCa832d` requires unique matching deposits and `depositCount >= 2` before settlement; `forge test` covers duplicate deposit, mismatch, non-owner settlement, and room-not-ready rejection |
| 0G Galileo config exists | real | `src/config/chain.ts`, chain ID `16602` |
| 0G Chain deployment | real | Draft `0x37AE4f4BA75b203f45137E7d6C2059d0a0F36475`, Escrow `0xeDf443C63A85daFBE7BF673C5b32a0560aCa832d`, Results `0xc90115A1A35a7B2F2741B2683eE122c25a43dBf6`, Agentic ID `0x38Cc945DAB9A0fe2b04E7F70cea3a41B3837A5ab` |
| Browser wallet E2E txs | real on Galileo | Privy wallet `0x23761115c5f38ca51f0d425d00DE6E34029239EC` committed lineup tx `0xed5c6244d5976be40f2b35d2f7f41d8777864b707b5385eb45cd972d4f37cffe` to Draft and deposited `0.01 0G` tx `0x03318f31c16c56f9536a0236d06e4fe64fc978f6501cf3e484f9b44892ce815b` to Escrow; `pnpm proof:browser-wallet` verifies receipts, events, public commitment state, `hasDeposited`, and settled escrow state |
| Testnet wager settlement | real on Galileo | Project wallet `0x3D325E51934AE5c7EBf9f37a8Ddf772F48F766Fb` added second deposit tx `0xc3094aee3d19c7d04b95da43ad3041f60d735eb67457d9b38fa278d4dc4ec663`, then settled tx `0x2c49f366a57bb0eeb1e7f57398d159169d64637573cd8b717660e8eac5c71a8a` to browser wallet winner; `pnpm proof:wager-settlement` verifies start readiness before settlement, `Settled` event, `0.0195 0G` payout, `0.0005 0G` protocol fee, and closed `canStart` after settlement |
| 0G Storage upload | real | `pnpm proof:storage` uploaded proof root `0xc7620208c2d553b2a12e473548da871536449bf38471f49f3da3bb1b22c84ef5`, tx `0x5d131ab4b60297b51f354798c1766a9bc388a86489b78a1bda475d8085cb214c`; repeat runs reuse the discoverable root |
| 0G Storage product bundle | real | `pnpm proof:storage-bundle` uploaded player snapshot, draft log, match transcript, share metadata, and proof receipt, root `0xd2d4fc1dc70a4f5ed5d89c16758da4e9152c23882cef2bfbe48050f3622c15b1`, tx `0x31c55b88753fc2af9566ecdde71c2dfb5b548ebdc11e493cb208f6abfa07b124` |
| 0G Storage readback | real | `pnpm proof:storage-readback` downloads the proof packet and product bundle with SDK proof mode, recomputes Merkle roots, and validates bundle item hashes |
| 0G Results receipt commit | real | `pnpm proof:chain-result` submitted tx `0x4e450701f7c69c122e3f9bb81dc6249f4f20077fd521503548767bc210926a3c`, storage URI `0g://storage/0xc7620208c2d553b2a12e473548da871536449bf38471f49f3da3bb1b22c84ef5` |
| 0G Chain readback | real | `pnpm proof:chain-readback` verifies bytecode at Draft/Escrow/Results/Agentic ID, result receipt storage URI, and Agentic ID token metadata/storage on Galileo |
| 0G Chain event proof | real | `pnpm proof:chain-events` verifies the Galileo receipts emitted `ResultCommitted` and `AgentMinted` with matching room, result, storage, token, owner, and metadata fields |
| 0G Escrow readiness readback | real | `pnpm proof:escrow-readiness` reads `WorldCupEscrow.canStart(room, 2)` and the public `escrows(room)` state from Galileo, proving the current deployment exposes the two-deposit start gate in script/UI artifacts |
| 0G DA batch artifact | ready | `pnpm proof:da` builds a byte-ready DA blob from proof, Storage, Storage bundle, Storage readback, Chain, Chain readback, Chain events, escrow readiness, browser wallet E2E, wager settlement, Router Compute, direct Compute broker diagnostics, runtime Compute, DA stack readiness, infra diagnostics, Agentic ID, and Agentic ID readback artifacts; current hash `0x2a4955216d8615c99f80bdfc732f9d5dc82ba4f8d5beb96b65e56d13efdf0ee0` is written to `proof-artifacts/da-latest.json`; live submission needs a DA Client endpoint |
| 0G DA sidecar | real, blocked without local DA Client | `pnpm proof:da-sidecar` posts the byte-ready batch to `pnpm da:sidecar`; when `OG_DA_CLIENT_GRPC_URL` is configured, the sidecar calls the official Disperser gRPC `DisperseBlob`/`GetBlobStatus` methods |
| 0G DA local stack readiness | generated, blocked by local runtime | `pnpm da:stack:prepare` writes ignored project-local DA Client/Retriever config files under `.da-stack/`; `pnpm proof:da-stack` verifies Docker CLI exists, Colima is installed but stopped, Docker Compose is unavailable, sidecar `51080` is reachable, and DA Client `51001`, Encoder `34000`, Retriever `34005` are not listening |
| 0G Compute proof | blocked by balance | `pnpm proof:compute` reaches the ScribeZero Router endpoint through `https://router-api.0g.ai/v1`, model `glm-5.1`, but the current artifact records `402 insufficient_balance` |
| 0G Compute direct broker | real diagnostics, blocked by ledger funding | `pnpm proof:compute-broker` uses `@0gfoundation/0g-compute-ts-sdk@0.8.4`, initializes the broker on Galileo, lists two providers, reads chatbot metadata for provider `0xa48f01287233509FD694a22Bf840225062E67836`, and records project wallet balance `0.038417174288134078 0G`, below the 3 0G ledger minimum; no ledger is auto-created or funded |
| 0G Compute runtime kickoff | wired, blocked by funding | `pnpm proof:compute-runtime` runs the app kickoff path: Router fails with `402 insufficient_balance`, then direct broker fails because no ledger exists and `OG_COMPUTE_BROKER_AUTOFUND` is off; no fake result is finalized |
| 0G infra diagnostics | real, blocked externally | `pnpm proof:infra-diagnostics` verifies the ScribeZero/World Cup router key fingerprint is configured, probes `glm-5.1` and `glm-5.2` and receives `402 insufficient_balance` for both, reaches the local DA sidecar `/health`, and proves no DA Client `51001`, Encoder `34000`, or Retriever `34005` is listening locally |
| Agentic ID encrypted metadata | real | `pnpm proof:agentic-id` reuses the live registry metadata for ZeroNine, root `0x5f7bdadd19e7dd63d84a49c1bb4ee61027e59e21019315f7889fbc194062d90c`, tx `0xa4d4bb5a6d667e683794361f3872e643affeb533f13d3acb2f1b9eb915846bc3` |
| Agentic ID contract deployment and mint | real | Contract `0x38Cc945DAB9A0fe2b04E7F70cea3a41B3837A5ab`; ZeroNine token `2`, mint tx `0xdc7b52f288a7425f2c1b9b16cf38770a6f1f6dc50bde7d0811df8628ffececb6`; KeeperNet token `3`, mint tx `0x4894d2fb8cb6502308d6feabbc4a4f52094d02ed55a95f77863025f61c78045a` |
| Agentic ID metadata readback | real | `pnpm proof:agentic-readback` downloads encrypted ZeroNine token `2` metadata from 0G Storage with proof mode, recomputes Merkle root/content hash, and verifies decrypted default-agent identity/policy |
| Agentic ID contract tests | real | `WorldCupAgentId.sol` plus `testAgenticIdMetadataLifecycle` cover mint, authorize, transfer, and clone lifecycle locally |
| Scripted browser proof | real | `pnpm test:e2e` checks proof artifacts and pending-before-kickoff simulation behavior |

## Credential-Gated

| Claim | Current status | Required |
| --- | --- | --- |
| Live provider import | key-gated adapters | API key and provider endpoint URL for BALLDONTLIE, API-Football, or Sportmonks |
| Fjelstul open fallback import | implemented | `USE_JFJELSTUL_FALLBACK=1 pnpm data:import` |
| Cloudflare D1/R2/KV persistence | artifact-ready | Cloudflare account IDs and binding IDs |
| Durable Object WebSocket rooms | scaffolded | Deploy `worker/room.ts` with wrangler bindings |
| 0G Compute in app gameplay | wired, externally blocked | Runtime match kickoff calls Compute and refuses fake finalization unless the result is Compute-authoritative; current blockers are hosted Router balance and direct broker ledger funding |
| 0G DA live submission | sidecar-ready, externally blocked | Official 0G DA docs require running DA Client plus Encoder/Retriever; current diagnostics show sidecar reachable but no DA Client/Encoder/Retriever process and no `OG_DA_CLIENT_GRPC_URL` |

## Explicit Non-Claims

- No mainnet wagering.
- No licensed team/player images.
- No EA/FIFA game ratings copied.
- No mainnet or production contract address is claimed in this snapshot.
- No successful 0G Compute match result is claimed while the Router returns `402 insufficient_balance` and direct broker ledger funding is below the 3 0G minimum.
- No live 0G DA submission is claimed until a DA Client endpoint is configured.
