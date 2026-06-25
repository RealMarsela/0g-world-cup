import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Trophy, Users, Bot, ShieldCheck } from "lucide-react";
import { ZERO_G } from "../config/chain";
import { WalletButton } from "./WalletButton";
import { Badge } from "./ui";

const links = [
  ["/solo", "Solo"],
  ["/room/create", "Rooms"],
  ["/agents", "Agents"],
  ["/leaderboard", "Board"],
  ["/pitch", "Pitch"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page text-strong">
      <header className="sticky top-0 z-30 border-b border-accent/20 bg-page/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center overflow-hidden rounded-md border border-accent/40 bg-black shadow-[0_0_26px_rgba(242,13,34,0.22)]">
              <img src="/logo.png" alt="" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.16em]">0G WORLD CUP</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Badge tone="accent">0G {ZERO_G.chainId}</Badge>
            <WalletButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-52 pt-6 sm:px-6 md:pb-8 lg:pt-8">{children}</main>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-md border border-accent/20 bg-black/85 p-1 backdrop-blur-xl md:hidden">
        {[
          ["/solo", "Solo", Trophy],
          ["/room/create", "Room", Users],
          ["/agents", "Agent", Bot],
          ["/leaderboard", "Proof", ShieldCheck],
        ].map(([to, label, Icon]) => (
          <NavLink key={String(to)} to={String(to)} className="grid min-h-12 place-items-center rounded text-[11px] text-muted">
            <Icon size={17} />
            {String(label)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
