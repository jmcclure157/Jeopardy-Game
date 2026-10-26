import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, type Dispatch } from "react";

import { ClueDialog } from "@/components/game/clue-dialog";
import { GameBoard, GameBoardSkeleton } from "@/components/game/game-board";
import { TILES_PER_ROUND, type BoardClue } from "@/lib/board";
import { finalEligible, isRoundComplete, type GameAction, type GameState } from "@/lib/game";
import { boardQueryOptions, finalClueQueryOptions } from "@/lib/queries";

export function RoundView({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}) {
  const queryClient = useQueryClient();
  const boardQuery = useQuery(boardQueryOptions(state.gameId, state.round));
  const [activeClue, setActiveClue] = useState<BoardClue | null>(null);
  const [confirmingSkip, setConfirmingSkip] = useState(false);
  const used = useMemo(() => new Set(state.used), [state.used]);
  const complete = isRoundComplete(state);
  const isDouble = state.round === "Double Jeopardy!";

  // Load what comes next in the background so the next round starts instantly.
  useEffect(() => {
    if (isDouble) void queryClient.prefetchQuery(finalClueQueryOptions(state.gameId));
    else void queryClient.prefetchQuery(boardQueryOptions(state.gameId, "Double Jeopardy!"));
  }, [isDouble, queryClient, state.gameId]);

  const nextLabel = !isDouble
    ? "Start Double Jeopardy!"
    : finalEligible(state.players).length > 0
      ? "Go to Final Jeopardy!"
      : "See final scores";

  const nextRound = () => {
    setConfirmingSkip(false);
    dispatch({ type: "next-round" });
  };

  return (
    <section aria-labelledby="round-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-ink-soft">
            Round {isDouble ? "2" : "1"} of 3{isDouble && " · values doubled"}
          </p>
          <h2 id="round-heading" className="font-display text-3xl text-ink">
            {state.round}
          </h2>
        </div>
        {!complete && boardQuery.isSuccess && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft">
              {TILES_PER_ROUND - state.used.length} of {TILES_PER_ROUND} clues left
            </span>
            {confirmingSkip ? (
              <>
                <button
                  onClick={nextRound}
                  className="rounded-full bg-ink px-3 py-1.5 font-medium text-white"
                >
                  Yes, end round
                </button>
                <button
                  onClick={() => setConfirmingSkip(false)}
                  className="rounded-full px-3 py-1.5 font-medium text-ink ring-1 ring-line"
                >
                  Keep playing
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmingSkip(true)}
                className="rounded-full px-3 py-1.5 font-medium text-ink ring-1 ring-line hover:bg-white"
              >
                End round early
              </button>
            )}
          </div>
        )}
      </div>

      {complete && (
        <div className="rise flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 ring-1 ring-line">
          <div>
            <p className="font-display text-xl text-ink">Round complete!</p>
            <p className="text-sm text-ink-soft">Every clue on this board has been played.</p>
          </div>
          <button
            autoFocus
            onClick={nextRound}
            className="inline-flex items-center gap-2 rounded-full bg-board px-5 py-2.5 font-semibold text-white hover:bg-board-light"
          >
            {nextLabel} <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {boardQuery.isPending && <GameBoardSkeleton />}
      {boardQuery.isError && (
        <div role="alert" className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <p className="font-display text-xl text-ink">We couldn't load the board.</p>
          <p className="mt-1 text-sm text-ink-soft">{boardQuery.error.message}</p>
          <button
            onClick={() => void boardQuery.refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-board px-4 py-2 text-sm font-semibold text-white"
          >
            <RotateCcw className="size-4" aria-hidden /> Try again
          </button>
        </div>
      )}
      {boardQuery.isSuccess && (
        <GameBoard board={boardQuery.data} used={used} onPick={setActiveClue} />
      )}

      {boardQuery.isSuccess && !complete && (
        <p className="text-xs text-ink-soft">
          Tip: use the arrow keys to move around the board and Enter to pick a clue. In a clue,
          press Space to reveal, then C (correct), X (incorrect) or P (pass).
        </p>
      )}

      <ClueDialog
        clue={activeClue}
        playerName={state.players.length > 1 ? (state.players[state.turn]?.name ?? null) : null}
        timerSeconds={state.timerSeconds}
        onJudged={(outcome) => {
          if (!activeClue) return;
          dispatch({ type: "answer", clueId: activeClue.id, value: activeClue.value, outcome });
          setActiveClue(null);
        }}
      />
    </section>
  );
}
