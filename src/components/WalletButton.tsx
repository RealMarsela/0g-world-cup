import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, LogOut, Wallet, ChevronDown, KeyRound } from "lucide-react";
import { useXWallet } from "../wallet/useXWallet";
import { publicClient } from "../lib/viem";
import { formatToken, shortAddr } from "../lib/format";
import { FAUCET_URL } from "../config/chain";
import { Button } from "./ui";

export function WalletButton() {
  const { ready, authenticated, address, login, logout, exportWallet } =
    useXWallet();
  const [balance, setBalance] = useState<bigint | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!address) {
      setBalance(undefined);
      return;
    }
    setBalance(undefined); // shows "…" immediately
    let alive = true;
    const load = async () => {
      try {
        const b = await publicClient.getBalance({ address });
        if (alive) setBalance(b);
      } catch {
        if (alive) setBalance(null);
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [address]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!ready) {
    return <div className="h-9 w-28 animate-pulse rounded-xl bg-surface-2" />;
  }

  if (!authenticated || !address) {
    return (
      <Button onClick={login} className="!px-4 !py-2 text-sm">
        <Wallet size={15} /> Connect
      </Button>
    );
  }

  const balLabel =
    balance === undefined
      ? "…"
      : balance === null
        ? "— 0G"
        : `${formatToken(balance)} 0G`;
  const avatar = `https://api.dicebear.com/9.x/shapes/svg?seed=${address}&backgroundColor=15130d`;

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex items-center gap-2">
      {/* native balance pill — LEFT, single-chain (no switcher) */}
      <span className="nums hidden items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-2 text-xs text-muted sm:inline-flex">
        <img
          src="/logo.png"
          alt=""
          width={14}
          height={14}
          className="rounded-full"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        {balLabel}
      </span>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5 transition-colors hover:border-accent/40"
        >
          <img
            src={avatar}
            alt=""
            width={24}
            height={24}
            className="rounded-lg"
          />
          <span className="nums hidden text-xs text-text sm:inline">
            {shortAddr(address)}
          </span>
          <ChevronDown size={14} className="text-faint" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="card absolute right-0 z-50 mt-2 w-56 overflow-hidden p-1.5"
            >
              <div className="flex items-center gap-2.5 px-2.5 py-2">
                <img
                  src={avatar}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <div className="min-w-0">
                  <p className="nums truncate text-xs text-text">
                    {shortAddr(address, 6)}
                  </p>
                  <p className="nums text-[11px] text-faint sm:hidden">
                    {balLabel}
                  </p>
                </div>
              </div>
              <div className="my-1 h-px bg-border" />
              <MenuItem icon={<Copy size={14} />} onClick={copy}>
                {copied ? "Copied!" : "Copy address"}
              </MenuItem>
              <MenuItem
                icon={<KeyRound size={14} />}
                onClick={() => exportWallet()}
              >
                Manage wallet
              </MenuItem>
              <a
                href={FAUCET_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <Wallet size={14} /> Get test 0G
              </a>
              <div className="my-1 h-px bg-border" />
              <MenuItem
                icon={<LogOut size={14} />}
                onClick={() => logout()}
                danger
              >
                Disconnect
              </MenuItem>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-surface-2 ${
        danger ? "text-danger hover:text-danger" : "text-muted hover:text-text"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
