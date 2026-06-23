import { Shield, Zap } from "lucide-react";
import type { Player } from "../worldcup/types";
import { Badge } from "./ui";

export function PlayerCard({ player, compact = false }: { player: Player; compact?: boolean }) {
  return (
    <article className={`player-card ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-faint">{player.countryCode} / {player.position}</p>
          <h3 className="mt-1 text-lg font-semibold leading-tight text-strong">{player.shortName}</h3>
          <p className="mt-1 text-xs text-muted">{player.club}</p>
        </div>
        <div className="grid size-12 place-items-center rounded-md border border-accent/30 bg-accent/10 text-xl font-black text-accent">
          {player.worldRating}
        </div>
      </div>
      {!compact && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <span className="metric"><Zap size={13} /> {player.attributes.pace} PAC</span>
            <span className="metric">{player.attributes.control} CTRL</span>
            <span className="metric"><Shield size={13} /> {player.attributes.defense} DEF</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{player.detailedPosition}</Badge>
            <Badge tone="accent">#{player.shirtNumber}</Badge>
          </div>
        </>
      )}
    </article>
  );
}
