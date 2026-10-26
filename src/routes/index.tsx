import { createFileRoute } from "@tanstack/react-router";
import { useReducer } from "react";

import { FinalJeopardy } from "@/components/game/final-jeopardy";
import { GameOver } from "@/components/game/game-over";
import { GameSetup } from "@/components/game/game-setup";
import { RoundView } from "@/components/game/round-view";
import { Scoreboard } from "@/components/game/scoreboard";
import { gameReducer, initialGameState } from "@/lib/game";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const inGame = state.phase === "round" || state.phase === "final";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-full bg-board font-display text-lg text-gold"
            >
              J
            </span>
            <span className="font-display text-xl">Jeopardy! Practice</span>
          </div>
          {state.phase !== "setup" && (
            <button
              onClick={() => dispatch({ type: "new-game" })}
              className="rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-line hover:bg-white"
            >
              New game
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        {state.phase === "setup" && (
          <GameSetup
            defaultTimer={state.timerSeconds}
            onStart={(names, timerSeconds) => dispatch({ type: "start", names, timerSeconds })}
          />
        )}
        {inGame && (
          <Scoreboard players={state.players} turn={state.phase === "round" ? state.turn : null} />
        )}
        {state.phase === "round" && (
          <RoundView key={state.round} state={state} dispatch={dispatch} />
        )}
        {state.phase === "final" && <FinalJeopardy state={state} dispatch={dispatch} />}
        {state.phase === "game-over" && (
          <GameOver state={state} onNewGame={() => dispatch({ type: "new-game" })} />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-ink-soft sm:px-6">
        Clues from the J-Archive-derived JEOPARDY_QUESTIONS1.json dataset. Jeopardy! is a trademark
        of Jeopardy Productions, Inc.; this is an unofficial practice game.
      </footer>
    </div>
  );
}
