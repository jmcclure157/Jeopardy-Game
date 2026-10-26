import { formatMoney, type Player } from "@/lib/game";
import { cn } from "@/lib/utils";

export function Scoreboard({ players, turn }: { players: Player[]; turn: number | null }) {
  return (
    <ul
      aria-label="Scores"
      className={cn(
        "grid gap-3",
        players.length === 1 && "grid-cols-1 sm:max-w-xs",
        players.length === 2 && "grid-cols-2",
        players.length === 3 && "grid-cols-3",
      )}
    >
      {players.map((player, i) => {
        const active = turn === i && players.length > 1;
        return (
          <li
            key={i}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-xl bg-white px-4 py-3 ring-1 transition",
              active ? "ring-2 ring-gold" : "ring-line",
            )}
          >
            <div className="flex items-center justify-between gap-2 text-xs text-ink-soft">
              <span className="truncate font-medium">{player.name}</span>
              {active && (
                <span className="shrink-0 rounded-full bg-gold/20 px-2 py-0.5 font-semibold text-ink">
                  Your pick
                </span>
              )}
            </div>
            <div
              className={cn(
                "mt-1 font-display text-2xl tabular-nums",
                player.score < 0 ? "text-red-600" : "text-ink",
              )}
            >
              {formatMoney(player.score)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
