import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import {
  PRIVY_APP_ID,
  PRIVY_CLIENT_ID,
  HAS_PRIVY,
  zeroGGalileo,
} from "./config/chain";
import { canUseBrowserEmbeddedWallets } from "./config/runtimeOrigin";
import { ToastProvider } from "./components/toast";

export function AppProviders({ children }: { children: ReactNode }) {
  const embeddedWalletsAvailable = canUseBrowserEmbeddedWallets();

  if (!HAS_PRIVY || !embeddedWalletsAvailable) {
    // Read-only mode — app fully browseable without a wallet.
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})}
      config={{
        defaultChain: zeroGGalileo,
        supportedChains: [zeroGGalileo],
        loginMethods: ["email", "google", "wallet"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
          showWalletUIs: true,
        },
        appearance: {
          theme: "dark",
          accentColor: "#46ffbe",
          logo: "https://0g-world-cup.pages.dev/logo.png",
          walletChainType: "ethereum-only",
          showWalletLoginFirst: false,
        },
      }}
    >
      <ToastProvider>{children}</ToastProvider>
    </PrivyProvider>
  );
}
