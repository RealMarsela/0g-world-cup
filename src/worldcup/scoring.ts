import type { DraftRoom, DraftTeam, Formation, Player, TacticalStyle } from "./types";

export function hashText(input: string) {
  let h = 2166136261;
  for (const char of input) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return `0x${(h >>> 0).toString(16).padStart(8, "0")}`;
}

export function valueFor(player: Player, formation: Formation, style: TacticalStyle) {
  const styleBoost =
    style === "High Press"
      ? player.attributes.pace + player.attributes.physical
      : style === "Counter"
        ? player.attributes.pace + player.attributes.finishing
        : style === "Possession"
          ? player.attributes.passing + player.attributes.control
          : style === "Low Block"
            ? player.attributes.defense + player.attributes.physical
            : player.attributes.clutch + player.attributes.control;
  const formationBoost =
    formation === "3-5-2" && player.position === "MF"
      ? 4
      : formation === "4-3-3" && player.position === "FW"
        ? 4
        : formation === "4-4-2" && player.position === "DF"
          ? 3
          : formation === "4-2-3-1" && player.position === "MF"
            ? 3
            : 0;
  return player.worldRating * 10 + styleBoost + formationBoost * 10;
}

export function scoreTeam(team: DraftTeam, room: DraftRoom) {
  const raw = team.picks.reduce((sum, player) => sum + valueFor(player, team.formation, team.tacticalStyle), 0);
  const captain = team.picks.find((player) => player.id === team.captainId);
  const seed = parseInt(hashText(`${room.id}:${team.id}`).slice(2), 16) % 180;
  return raw + (captain?.attributes.clutch ?? 0) * 5 + seed;
}
