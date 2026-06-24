# Truth Audit

## Live

| Claim | Status | Evidence |
| --- | --- | --- |
| Vite React app exists | real | `src/App.tsx`, route screens |
| Full XI draft exists | real | `src/worldcup/game.ts`, `/draft/:roomId` |
| Group tournament mode exists | real | `createRoom("free-group")`, round-robin `simulate()` table |
| Deterministic fallback simulation exists | real | `simulate()` produces score, MVP, hashes |
| Result share card exists | real | `/result/:roomId` X intent and canvas PNG download |
| Player data pipeline exists | real | `pnpm data:import && pnpm data:normalize && pnpm data:rate && pnpm data:publish && pnpm data:verify` runs clean; `pnpm proof:data-pipeline` verifies adapter attempts, 48-player local pipeline output, D1/R2/KV manifest files, and the 8,379-player historical snapshot mirrored live to 0G Storage |
| Agent Manager registry exists | real | `src/worldcup/agents.ts`, `/agents` |
| Foundry contracts exist | real | `WorldCupDraft`, `WorldCupEscrow`, `WorldCupResults` |
| Wager escrow start gate | real on Galileo | Escrow `0xeDf443C63A85daFBE7BF673C5b32a0560aCa832d` requires unique matching deposits and `depositCount >= 2` before settlement; `forge test` covers duplicate deposit, mismatch, non-owner settlement, and room-not-ready rejection |
| 0G Galileo config exists | real | `src/config/chain.ts`, chain ID `16602` |
| 0G Chain deployment | real | Draft `0x37AE4f4BA75b203f45137E7d6C2059d0a0F36475`, Escrow `0xeDf443C63A85daFBE7BF673C5b32a0560aCa832d`, Results `0xc90115A1A35a7B2F2741B2683eE122c25a43dBf6`, Agentic ID `0x38Cc945DAB9A0fe2b04E7F70cea3a41B3837A5ab` |
| 0G integration matrix | real, current blockers surfaced | `pnpm proof:integration-matrix` reads every latest proof artifact and writes `integration-matrix-latest.json` with per-feature coverage for data, Storage, Chain, wallet wager flow, Compute, DA, Cloudflare tunnel bridge, and Agentic ID surfaces. |
| Browser wallet E2E txs | real on Galileo | Privy wallet `0x23761115c5f38ca51f0d425d00DE6E34029239EC` committed lineup tx `0xed5c6244d5976be40f2b35d2f7f41d8777864b707b5385eb45cd972d4f37cffe` to Draft and deposited `0.01 0G` tx `0x03318f31c16c56f9536a0236d06e4fe64fc978f6501cf3e484f9b44892ce815b` to Escrow; `pnpm proof:browser-wallet` verifies receipts, events, public commitment state, `hasDeposited`, and settled escrow state |
| Testnet wager settlement | real on Galileo | Project wallet `0x3D325E51934AE5c7EBf9f37a8Ddf772F48F766Fb` added second deposit tx `0xc3094aee3d19c7d04b95da43ad3041f60d735eb67457d9b38fa278d4dc4ec663`, then settled tx `0x2c49f366a57bb0eeb1e7f57398d159169d64637573cd8b717660e8eac5c71a8a` to browser wallet winner; `pnpm proof:wager-settlement` verifies start readiness before settlement, `Settled` event, `0.0195 0G` payout, `0.0005 0G` protocol fee, and closed `canStart` after settlement |
| 0G Storage upload | real | `pnpm proof:storage` uploaded proof root `0x2df8c6d9d2bf657e2f3cfc5c1c64371dc247e5b6d17257539e66e5882e889c05`, tx `0x324a2629d3e1761044ae44525fd568ae8dac953a7fd2b884d7a25cbdc1bc6e95`; repeat runs reuse the discoverable root |
| 0G Storage product bundle | real | `pnpm proof:storage-bundle` uploaded player snapshot, draft log, match transcript, share metadata, and proof receipt, bundle hash `0x8c4e06ef14926a8da200fea81d0e09b25bebe3fc0ac6477fbd2de1af313470d1`, root `0x7231c4535d696a9ebfbd13c46394a392b928852c6aea766280523a4e0d065914`, tx `0x14d3e8945af51dc07bdc24b69165ce8b86365bc5fde7ed72485d195152beeafd` |
| 0G Storage readback | real | `pnpm proof:storage-readback` downloads the proof packet and product bundle with SDK proof mode, recomputes Merkle roots, and validates bundle item hashes |
| 0G Results receipt commit | real | `pnpm proof:chain-result` submitted tx `0x4e450701f7c69c122e3f9bb81dc6249f4f20077fd521503548767bc210926a3c`, storage URI `0g://storage/0xc7620208c2d553b2a12e473548da871536449bf38471f49f3da3bb1b22c84ef5` |
| 0G Chain readback | real | `pnpm proof:chain-readback` verifies bytecode at Draft/Escrow/Results/Agentic ID, result receipt storage URI, and Agentic ID token metadata/storage on Galileo |
| 0G Chain event proof | real | `pnpm proof:chain-events` verifies the Galileo receipts emitted `ResultCommitted` and `AgentMinted` with matching room, result, storage, token, owner, and metadata fields |
| 0G Escrow readiness readback | real | `pnpm proof:escrow-readiness` reads `WorldCupEscrow.canStart(room, 2)` and the public `escrows(room)` state from Galileo, proving the current deployment exposes the two-deposit start gate in script/UI artifacts |
| 0G DA batch artifact | ready | `pnpm proof:da` builds a byte-ready DA blob from proof, data pipeline proof, Storage, Storage bundle, Storage readback, Chain, Chain readback, Chain events, escrow readiness, browser wallet E2E, wager settlement, Router Compute, direct Compute broker diagnostics, runtime Compute, runtime finalization guard, integration matrix, Cloudflare tunnel readiness, DA stack readiness, infra diagnostics, Agentic ID, Agentic ID registry, all-agent Agentic ID readback, and Agent Manager readback artifacts; current hash `0x4d1308b1f4496019e9501dab235aa1c1b523c61f92d0601412ae1ba1cc0e8551` is written to `proof-artifacts/da-latest.json`; live submission depends on a valid DAEntrance contract on the selected RPC |
| Cloudflare Tunnel bridge | local-only unless configured | `pnpm proof:cloudflare-tunnel` records whether `cloudflared` is installed, whether the app/DA sidecar are reachable, and whether `OG_DA_SIDECAR_URL` or `OG_APP_PUBLIC_URL` point at a public HTTPS tunnel. This is only demo ingress; 0G artifacts remain the final truth. |
| 0G DA sidecar | real, blocked by DAEntrance preflight | `pnpm proof:da-sidecar` posts the byte-ready batch to `pnpm da:sidecar` only after readiness passes; with `OG_DA_CLIENT_GRPC_URL=127.0.0.1:51001`, the sidecar is configured for official Disperser gRPC `DisperseBlob`/`GetBlobStatus`, but the proof skips live submit because both documented DAEntrance candidates have no bytecode on `https://evmrpc-testnet.0g.ai`: `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` and `0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9` |
| 0G DA local stack readiness | local stack up, blocked by external contract | `pnpm da:stack:prepare` writes ignored project-local DA Client/Retriever config files under `.da-stack/`; `pnpm proof:da-stack` verifies Docker CLI, Docker daemon, Colima, Docker Compose, sidecar `51080`, DA Client `51001`, Encoder `34000`, and Retriever `34005` are reachable, then blocks because the configured DAEntrance has no bytecode |
| 0G Compute proof | blocked by balance | `pnpm proof:compute` reaches the ScribeZero Router endpoint through `https://router-api.0g.ai/v1`, model `glm-5.1`, but the current artifact records `402 insufficient_balance` |
| 0G Compute direct broker | real diagnostics, blocked by ledger funding | `pnpm proof:compute-broker` uses `@0gfoundation/0g-compute-ts-sdk@0.8.4`, initializes the broker on Galileo, lists two providers, reads chatbot metadata for provider `0xa48f01287233509FD694a22Bf840225062E67836`, and records project wallet balance `0.030817244283269921 0G`, below the 3 0G ledger minimum; required top-up is `2.969182755716730071 0G`; no ledger is auto-created or funded until `OG_COMPUTE_BROKER_AUTOFUND=1` is enabled on a funded wallet |
| 0G Compute runtime kickoff | wired, blocked by funding | `pnpm proof:compute-runtime` runs the app kickoff path: Router fails with `402 insufficient_balance`, then direct broker fails because no ledger exists and `OG_COMPUTE_BROKER_AUTOFUND` is off; Router fetches and broker operations are bounded so blocked Compute returns an explicit blocker instead of an indefinite loading state; no fake result is finalized |
| 0G runtime gate UI | real | `/simulate/:roomId` reads the latest Compute runtime, direct broker, finalization guard, and DA sidecar artifacts before kickoff, showing the exact funding/DA blockers instead of revealing a fake score |
| Result page Compute guard | real | `/result/:roomId` refuses to render a winner, MVP, share card, Storage URI, or Chain result for human/agent rooms unless a Compute-authoritative result exists |
| 0G escrow readiness UI | real | `/room/create` testnet wager mode and `/room/:id` wager rooms read the latest escrow readiness, browser wallet, and settlement artifacts to show contract, two-deposit gate, settled state, and commit/deposit/settlement txs before draft |
| 0G infra diagnostics | real, blocked externally | `pnpm proof:infra-diagnostics` verifies the ScribeZero/World Cup router key fingerprint is configured, probes `glm-5.1` and `glm-5.2` and receives `402 insufficient_balance` for both, reaches the local DA sidecar `/health`, and reports the current DA stack/Compute funding state in proof artifacts |
| Agentic ID encrypted metadata | real | `pnpm proof:agentic-id` reuses the live registry metadata for ZeroNine, root `0x5f7bdadd19e7dd63d84a49c1bb4ee61027e59e21019315f7889fbc194062d90c`, tx `0xa4d4bb5a6d667e683794361f3872e643affeb533f13d3acb2f1b9eb915846bc3` |
| Agentic ID contract deployment and mint | real | Contract `0x38Cc945DAB9A0fe2b04E7F70cea3a41B3837A5ab`; ZeroNine token `2`, mint tx `0xdc7b52f288a7425f2c1b9b16cf38770a6f1f6dc50bde7d0811df8628ffececb6`; KeeperNet token `3`, mint tx `0x4894d2fb8cb6502308d6feabbc4a4f52094d02ed55a95f77863025f61c78045a` |
| Agentic ID metadata readback | real | `pnpm proof:agentic-readback` downloads encrypted ZeroNine token `2` and KeeperNet token `3` metadata from 0G Storage with proof mode, recomputes Merkle roots/content hashes, and verifies decrypted identity/policy for both agents |
| Agent Manager live readback | real | `pnpm proof:agent-manager-readback` joins registry data, Galileo `AgentMinted` events, full contract token readback, and 0G Storage metadata readback for both agents into one UI artifact for `/agents` and `/proof/:roomId`; latest readback hash `0xb84db2f6fe3b756dca51a575a32ae72ae0bc046897649accddd16f8c31601ab6` |
| Agentic ID contract tests | real | `WorldCupAgentId.sol` plus `testAgenticIdMetadataLifecycle` cover mint, authorize, transfer, and clone lifecycle locally |
| Brute verification gate | real | `pnpm test:brute` chains typecheck, app logic, Foundry contracts, full 0G proof lane, artifact/doc invariant checks, Playwright E2E, and production build |
| Scripted browser proof | real | `pnpm test:e2e` checks proof artifacts and pending-before-kickoff simulation behavior |
| 0G leaderboard proof UI | real | `/leaderboard` reads the latest Chain result, Chain event, wager settlement, and Storage artifacts, then separates those live proof-ranked rows from local deterministic demo rankings |

## Credential-Gated

| Claim | Current status | Required |
| --- | --- | --- |
| Live provider import | key-gated adapters | API key and provider endpoint URL for BALLDONTLIE, API-Football, or Sportmonks |
| Fjelstul open fallback import | implemented | `USE_JFJELSTUL_FALLBACK=1 pnpm data:import` |
| Cloudflare D1/R2/KV persistence | artifact-ready | Cloudflare account IDs and binding IDs |
| Durable Object WebSocket rooms | scaffolded | Deploy `worker/room.ts` with wrangler bindings |
| 0G Compute in app gameplay | wired, externally blocked | Runtime match kickoff calls Compute and refuses fake finalization unless the result is Compute-authoritative; current blockers are hosted Router balance and direct broker ledger funding |
| 0G DA live submission | sidecar-ready, externally blocked | Official 0G DA docs require running DA Client plus Encoder/Retriever; current diagnostics show sidecar, DA Client, Encoder, and Retriever ports are reachable with `OG_DA_CLIENT_GRPC_URL=127.0.0.1:51001`, but both documented Galileo DAEntrance candidates have no bytecode on the configured Galileo RPC |

## Explicit Non-Claims

- No mainnet wagering.
- No licensed team/player images.
- No EA/FIFA game ratings copied.
- No mainnet or production contract address is claimed in this snapshot.
- No successful 0G Compute match result is claimed while the Router returns `402 insufficient_balance` and direct broker ledger funding is below the 3 0G minimum.
- No live 0G DA submission is claimed while the configured DAEntrance has no bytecode on the selected Galileo RPC.
