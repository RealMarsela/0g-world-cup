# 0G Integration Research

## Sources Checked

- 0G Compute Router: `https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/overview`
- 0G Compute Direct inference: `https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference`
- 0G Storage SDK: `https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk`
- 0G DA integration: `https://docs.0g.ai/developer-hub/building-on-0g/da-integration`
- Agentic ID overview: `https://docs.0g.ai/concepts/agentic-id`

## Product Integration Map

| 0G layer | Product role | Current implementation | Next best lift |
| --- | --- | --- | --- |
| 0G Chain | Draft commitments, wager escrow, result receipts, leaderboard truth, Agentic ID mint | Draft/Escrow/Results deployed on Galileo; Agentic ID deployed with ZeroNine token `2` and KeeperNet token `3`; readback verifies bytecode, result receipt, Agentic ID state, emitted `ResultCommitted`/`AgentMinted` logs, browser-wallet wager deposit, second deposit, and settlement payout | Add automatic post-match settlement UI from the same readback data |
| 0G Storage | Player-pool snapshots, draft logs, match transcripts, share metadata, proof receipts, encrypted agent metadata | Proof packet, product evidence bundle, Agentic ID metadata upload, general Storage readback, and Agentic ID metadata readback are live through SDK proof mode | Attach the upload step to every completed room instead of only the proof script |
| 0G Compute Router | Agent drafting, tactical reasoning, commentary, structured simulation | Router key copied from ScribeZero and wired through `https://router-api.0g.ai/v1`; current diagnostics probe `glm-5.1` and `glm-5.2`, both blocked by `402 insufficient_balance` | Fund the Router account, rerun `pnpm proof:compute`, then make 0G Compute the actual match and agent-decision service and persist its structured output to 0G Storage/Chain/DA |
| 0G Compute Direct | Wallet-signed provider control for browser dApps | Diagnostic integration live via `@0gfoundation/0g-compute-ts-sdk@0.8.4`; broker initializes, lists two providers, reads chatbot metadata, and records the project wallet is below the 3 0G ledger minimum. Runtime kickoff now falls back from hosted Router to direct broker before blocking. | Fund the direct broker ledger or use the hosted Router once its balance is restored |
| 0G DA | Availability batch for match/tournament evidence | DA-ready blob includes proof, Storage receipt, Storage bundle, Storage readback, Chain receipt, Chain readback, Chain event proof, escrow readiness, browser wallet E2E, wager settlement, Router Compute status, direct broker diagnostics, runtime Compute, DA stack readiness, infra diagnostics, Agentic ID receipt, Agentic ID readback, and Agent Manager readback under max blob size; live submission blocked by DAEntrance bytecode preflight | Submit `da-latest.json` once the configured Galileo DAEntrance is live on the selected RPC |
| Agentic ID | Ownable AI-agent identity with encrypted strategy metadata | Encrypted metadata on 0G Storage, `WorldCupAgentId` on Galileo, tokens `2` and `3` minted, metadata readback verifies encrypted hash plus decrypted default-agent policy, and Agent Manager UI readback joins token owner, metadata root, policy hash, and mint events | Attach agent decision receipts to each AI draft/match action after Compute funding is restored |

## Honest Blockers

- Live Compute is wired through the ScribeZero Router key, but both `glm-5.1` and `glm-5.2` currently return `402 insufficient_balance`; direct broker diagnostics and runtime fallback also work, but the current wallet balance is below the 3 0G ledger minimum.
- Live DA has a local sidecar plus DA Client/Encoder/Retriever endpoint configured; official docs do not provide a public DA submit URL to use instead.
- The DA stack now has project-local generated config and readiness proof; current blocker is external DAEntrance readiness. Both documented candidates have no bytecode on `https://evmrpc-testnet.0g.ai`: `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` from the Testnet overview and `0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9` from the DA integration envfile example.
- Cloudflare Durable Object room state is still local/scaffolded until deployed with bindings.
