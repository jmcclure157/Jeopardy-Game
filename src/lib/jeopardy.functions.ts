import { createServerFn } from "@tanstack/react-start";

import { buildBoard, type BoardRound } from "@/lib/board";
import { getPublishableClient } from "@/lib/supabase-server";

const BOARD_ROUNDS: readonly BoardRound[] = ["Jeopardy!", "Double Jeopardy!"];

// Six random categories, each a full column of 5 clues that aired together,
// returned as a 6x5 grid ordered from cheapest to most expensive.
export const getBoard = createServerFn({ method: "GET" })
  .inputValidator((data: { round: BoardRound }) => {
    if (!BOARD_ROUNDS.includes(data.round)) throw new Error(`Unknown round: ${String(data.round)}`);
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = getPublishableClient();
    const { data: rows, error } = await supabase.rpc("random_board", { p_round: data.round });
    if (error) throw new Error(error.message);
    return buildBoard(rows ?? [], data.round);
  });

export const getFinalClue = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getPublishableClient();
  const { data: rows, error } = await supabase.rpc("random_final_clue");
  if (error) throw new Error(error.message);
  const row = rows?.[0];
  if (!row) throw new Error("No Final Jeopardy! clues found. Has the database been seeded?");
  return {
    id: row.id,
    category: row.category,
    clue: row.clue,
    answer: row.answer,
    airDate: row.air_date,
  };
});
