import { queryOptions } from "@tanstack/react-query";

import type { BoardRound } from "@/lib/board";
import { getBoard, getFinalClue } from "@/lib/jeopardy.functions";

// Boards are random, so cache each one for the whole game: refetching mid-round
// would swap the categories out from under the players.
const forTheWholeGame = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
} as const;

export function boardQueryOptions(gameId: number, round: BoardRound) {
  return queryOptions({
    queryKey: ["board", gameId, round],
    queryFn: () => getBoard({ data: { round } }),
    ...forTheWholeGame,
  });
}

export function finalClueQueryOptions(gameId: number) {
  return queryOptions({
    queryKey: ["final-clue", gameId],
    queryFn: () => getFinalClue(),
    ...forTheWholeGame,
  });
}
