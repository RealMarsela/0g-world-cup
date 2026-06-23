import { useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createWalletClient,
  custom,
  type Address,
  type WalletClient,
} from "viem";
import { zeroGGalileo, HAS_PRIVY } from "../config/chain";

export type XWallet = {
  ready: boolean;
  authenticated: boolean;
  address?: Address;
  walletType?: string;
  login: () => void;
  logout: () => Promise<void> | void;
  exportWallet: () => Promise<void> | void;
  getWalletClient: () => Promise<WalletClient>;
  /** false until a real Privy app id is configured (Phase B) */
  enabled: boolean;
};

function usePrivyWallet(): XWallet {
  const { ready, authenticated, login, logout, exportWallet } = usePrivy();
  const { wallets } = useWallets();

  // Prefer the embedded Privy wallet; fall back to an external wallet.
  const wallet =
    wallets.find((w) => w.walletClientType === "privy") ?? wallets[0];
  const address = wallet?.address as Address | undefined;

  const getWalletClient = useCallback(async (): Promise<WalletClient> => {
    if (!wallet) throw new Error("No wallet connected");
    try {
      await wallet.switchChain(zeroGGalileo.id);
    } catch {
      /* user may decline the prompt; reads still target 0G Galileo. */
    }
    const provider = await wallet.getEthereumProvider();
    return createWalletClient({
      account: wallet.address as Address,
      chain: zeroGGalileo,
      transport: custom(provider),
    });
  }, [wallet]);

  return {
    ready,
    authenticated,
    address,
    walletType: wallet?.walletClientType,
    login,
    logout,
    exportWallet,
    getWalletClient,
    enabled: true,
  };
}

function useStubWallet(): XWallet {
  return {
    ready: true,
    authenticated: false,
    address: undefined,
    login: () => {},
    logout: () => {},
    exportWallet: () => {},
    getWalletClient: async () => {
      throw new Error("No wallet connected");
    },
    enabled: false,
  };
}

// Bound once at module load — HAS_PRIVY is a build-time constant, so the hook
// identity is stable across renders (no rules-of-hooks violation).
export const useXWallet: () => XWallet = HAS_PRIVY
  ? usePrivyWallet
  : useStubWallet;
