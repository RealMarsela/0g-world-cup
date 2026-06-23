# 0G World Cup Agent Notes

## Project Test Wallet

- Public address: `0x3D325E51934AE5c7EBf9f37a8Ddf772F48F766Fb`
- Purpose: project-only 0G Galileo test wallet for contract deployment, contract testing, storage/compute testing, and funding the Privy embedded browser wallet for E2E tests.
- Private key location: ignored local `.env.local` as `OG_PRIVATE_KEY`.
- Never commit, print, paste, or move the private key into docs, source files, screenshots, or chat.
- Treat this as a disposable testnet wallet only. Do not use on mainnet or with valuable funds.

## Preferred Shell Patterns

- Start the local app on the Privy-allowed origin:
  `pnpm exec vite --host localhost --port 3022 --strictPort`
- Check 0G Galileo RPC:
  `pnpm smoke:0g`
- Build local/live 0G proof artifacts:
  `pnpm proof:packet && pnpm proof:storage && pnpm proof:storage-bundle && pnpm proof:storage-readback && pnpm proof:chain-result && pnpm proof:chain-readback && pnpm proof:chain-events && pnpm proof:compute && pnpm proof:agentic-id && pnpm proof:agentic-mint && pnpm proof:agentic-readback && pnpm proof:da`
- Run script/browser proof:
  `pnpm test:logic && pnpm test:artifacts && pnpm test:e2e`
- Fund a browser/Privy wallet from the project test wallet after this wallet has 0G:
  `pnpm wallet:fund 0xTargetAddress 0.05`
- Deploy contracts only after confirming the wallet is funded and the target is testnet:
  `forge script scripts/Deploy.s.sol:Deploy --rpc-url "${OG_RPC_URL:-https://evmrpc-testnet.0g.ai}" --private-key "$OG_PRIVATE_KEY" --broadcast`

## Things To Avoid

- Do not use the Privy app secret in frontend `VITE_*` variables.
- Do not run transaction E2E against mainnet.
- Do not ask Gabriel to perform routine browser testing; use `@Browser` for the app and report exact blockers.
