import { createWalletClient, defineChain, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const zeroGGalileo = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai"],
    },
  },
});

const [, , target, amount = "0.05"] = process.argv;

if (!target || !/^0x[a-fA-F0-9]{40}$/.test(target)) {
  console.error("Usage: pnpm wallet:fund 0xTargetAddress [amountIn0G]");
  process.exit(1);
}

const privateKey = process.env.OG_PRIVATE_KEY;
if (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
  console.error("Missing OG_PRIVATE_KEY in environment.");
  process.exit(1);
}

const account = privateKeyToAccount(privateKey);
const client = createWalletClient({
  account,
  chain: zeroGGalileo,
  transport: http(process.env.OG_RPC_URL || zeroGGalileo.rpcUrls.default.http[0]),
});

const hash = await client.sendTransaction({
  to: target,
  value: parseEther(amount),
});

console.log(`sent ${amount} 0G from ${account.address} to ${target}`);
console.log(hash);
