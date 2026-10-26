import type { Tables } from "@/integrations/supabase/types";

export type ClueRow = Tables<"clues">;
export type BoardRound = "Jeopardy!" | "Double Jeopardy!";

export const COLUMNS = 6;
export const ROWS = 5;
export const TILES_PER_ROUND = COLUMNS * ROWS;

// Board values doubled on this air date (from $100–$500 to $200–$1,000 in round one).
export const VALUES_DOUBLED_ON = "2001-11-26";

export interface BoardClue {
  id: number;
  category: string;
  clue: string;
  answer: string;
  /** Dollar value of the tile this clue sits on in our game. */
  value: number;
  airDate: string | null;
}

export interface BoardColumn {
  category: string;
  airDate: string | null;
  /** Exactly ROWS clues, cheapest first. */
  clues: BoardClue[];
}

export interface Board {
  round: BoardRound;
  columns: BoardColumn[];
}

/** Tile values used by this game: $200–$1,000, doubled in Double Jeopardy!. */
export function boardValues(round: BoardRound): number[] {
  const step = round === "Double Jeopardy!" ? 400 : 200;
  return Array.from({ length: ROWS }, (_, i) => step * (i + 1));
}

/** Tile values the clue's own show used, which depend on its air date. */
export function airedValues(round: BoardRound, airDate: string | null): number[] {
  const halved = airDate != null && airDate < VALUES_DOUBLED_ON;
  return boardValues(round).map((v) => (halved ? v / 2 : v));
}

/**
 * Puts a column's 5 clues back in their original rows. Most clues aired at a standard
 * value; a Daily Double carries the contestant's wager instead (e.g. $2,127), so any
 * clue that doesn't match a free row fills the row left empty.
 */
export function arrangeColumn(rows: ClueRow[], round: BoardRound): BoardColumn {
  const first = rows[0];
  if (!first || rows.length !== ROWS) {
    throw new Error(`A board column needs ${ROWS} clues, got ${rows.length}`);
  }
  const aired = airedValues(round, first.air_date);
  const slots: (ClueRow | undefined)[] = Array.from({ length: ROWS }, () => undefined);
  const leftovers: ClueRow[] = [];

  for (const row of [...rows].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))) {
    const index = row.value == null ? -1 : aired.indexOf(row.value);
    if (index >= 0 && !slots[index]) slots[index] = row;
    else leftovers.push(row);
  }
  for (let i = 0; i < ROWS; i++) {
    if (!slots[i]) slots[i] = leftovers.shift();
  }

  const values = boardValues(round);
  return {
    category: first.category,
    airDate: first.air_date,
    clues: slots.map((row, i) => ({
      id: row!.id,
      category: row!.category,
      clue: row!.clue,
      answer: row!.answer,
      value: values[i]!,
      airDate: row!.air_date,
    })),
  };
}

/** Groups the rows returned by random_board() into columns. */
export function buildBoard(rows: ClueRow[], round: BoardRound): Board {
  const groups = new Map<string, ClueRow[]>();
  for (const row of rows) {
    const key = `${row.air_date ?? ""}|${row.category}`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }
  const columns = [...groups.values()].map((group) => arrangeColumn(group, round));
  if (columns.length !== COLUMNS) {
    throw new Error(
      `Expected ${COLUMNS} categories but found ${columns.length}. Has the database been seeded? (npm run db:seed)`,
    );
  }
  return { round, columns };
}
