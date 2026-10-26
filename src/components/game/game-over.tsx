import { RotateCcw, Trophy } from "lucide-react";

import { formatMoney, winners, type GameState } from "@/lib/game";
import { cn } from "@/lib/utils";

export function GameOver({ state, onNewGame }: { state: GameState; onNewGame: () => void }) {
  const top = new Set(winners(state.players));
  const solo = state.players.length === 1;
  const finalPlayed = Object.keys(state.final).length > 0;
  const ranked = state.players
    .map((player, i) => ({ player, i }))
    .sort((a, b) => b.player.score - a.player.score);

  const headline = solo
    ? `You finished with ${formatMoney(state.players[0]!.score)}`
    : top.size > 1
      ? "It's a tie!"
      : `${state.players[[...top][0]!]!.name} wins!`;

  return (
    <section
      aria-labelledby="game-over-heading"
      className="rise mx-auto max-w-2xl space-y-6 rounded-2xl bg-white p-6 ring-1 ring-line sm:p-10"
    >
      <div className="text-center">
        <Trophy className="mx-auto size-10 text-gold" aria-hidden />
        <h2 id="game-over-heading" className="mt-2 font-display text-3xl text-ink">
          {headline}
        </h2>
        {!finalPlayed && (
          <p className="mt-2 text-sm text-ink-soft">
            Final Jeopardy! was skipped because nobody finished Double Jeopardy! above $0.
          </p>
        )}
      </div>

      <ol className="space-y-2">
        {ranked.map(({ player, i }) => {
          const result = state.final[i];
          return (
            <li
              key={i}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl px-4 py-3 ring-1",
                top.has(i) && !solo ? "bg-gold/15 ring-gold" : "ring-line",
              )}
            >
              <div>
                <p className="font-medium text-ink">{player.name}</p>
                <p className="text-xs text-ink-soft">
                  {result
                    ? `Final Jeopardy!: wagered ${formatMoney(result.wager)}, ${
                        result.correct ? "correct" : "incorrect"
                      }`
                    : finalPlayed
                      ? "Sat out Final Jeopardy!"
                      : ""}
                </p>
              </div>
              <span
                className={cn(
                  "font-display text-2xl tabular-nums",
                  player.score < 0 ? "text-red-600" : "text-ink",
                )}
              >
                {formatMoney(player.score)}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="text-center">
        <button
          autoFocus
          onClick={onNewGame}
          className="inline-flex items-center gap-2 rounded-full bg-board px-5 py-2.5 font-semibold text-white hover:bg-board-light"
        >
          <RotateCcw className="size-4" aria-hidden /> Play again
        </button>
      </div>
    </section>
  );
}
