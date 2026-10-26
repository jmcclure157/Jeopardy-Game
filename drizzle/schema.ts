import { sql } from "drizzle-orm";
import { date, index, integer, pgEnum, pgPolicy, pgTable, serial, text } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

export const ROUNDS = ["Jeopardy!", "Double Jeopardy!", "Final Jeopardy!"] as const;
export type Round = (typeof ROUNDS)[number];

export const clueRound = pgEnum("clue_round", ROUNDS);

export const clues = pgTable(
  "clues",
  {
    id: serial("id").primaryKey(),
    category: text("category").notNull(),
    // The prompt shown to players (the dataset calls this field "question").
    clue: text("clue").notNull(),
    answer: text("answer").notNull(),
    // Dollar amount as aired; null for Final Jeopardy!, which has no board value.
    value: integer("value"),
    round: clueRound("round").notNull(),
    airDate: date("air_date"),
  },
  (table) => [
    // A board column is every clue sharing round + air_date + category.
    index("clues_round_air_date_category_idx").on(table.round, table.airDate, table.category),
    pgPolicy("clues are readable by everyone", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

export type ClueRow = typeof clues.$inferSelect;
export type NewClueRow = typeof clues.$inferInsert;
