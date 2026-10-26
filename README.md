# Jeopardy Game

A Jeopardy!-style trivia game built from ~200,000 real clues. Play solo or with 2–3 players taking
turns through a Jeopardy! round, a Double Jeopardy! round (doubled values) and Final Jeopardy!
(wager first, then see the clue).

It uses the same stack and folder layout as
[`local-tee-times`](https://github.com/jmcclure157/local-tee-times): React 19, TanStack Start /
Router / Query, Tailwind CSS v4, Radix UI, `lucide-react`, Supabase (Postgres) and Drizzle.

## Project layout

```
data/                        JEOPARDY_QUESTIONS1.json.gz (the clue dataset)
drizzle/schema.ts            `clues` table definition
drizzle/migrations/          SQL migrations (table + random-board functions)
scripts/download-dataset.ts  re-downloads the dataset and checks its checksum
scripts/clean.ts             turns raw dataset records into clean rows
scripts/seed.ts              one-time loader: dataset -> `clues` table
supabase/config.toml         local Supabase project settings
src/lib/jeopardy.functions.ts server functions: getBoard, getFinalClue
src/lib/board.ts             arranges a category's 5 clues into value tiers
src/lib/game.ts              game rules: scores, turns, rounds, wagers
src/components/game/         board, clue dialog, scoreboard, Final Jeopardy!, setup
src/routes/                  pages (index.tsx is the game)
src/integrations/supabase/   Supabase client + generated database types
src/hooks/                   countdown timer, board keyboard navigation
```

## Prerequisites

- Node.js 22+ and npm
- A Postgres database from Supabase, either:
  - **local**: [Supabase CLI](https://supabase.com/docs/guides/local-development) + Docker, or
  - **hosted**: a free project at [supabase.com](https://supabase.com)

## Setup

```sh
npm install
cp .env.example .env
```

Fill in `.env` (it is git-ignored, never commit it):

| Variable                                                     | Where to find it                                                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL`                         | Project Settings → API → Project URL (local: `http://127.0.0.1:54321`)                                           |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → publishable (or anon) key (local: `npx supabase status`)                           |
| `DATABASE_URL`                                               | Connect → Direct connection or Session pooler (local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`) |

For a local database, start Supabase first:

```sh
npx supabase start
```

## Dataset

The clues come from `JEOPARDY_QUESTIONS1.json`, a scrape of [J-Archive](https://j-archive.com)
(216,930 clues from 1984–2012) first shared on
[Reddit r/datasets](https://www.reddit.com/r/datasets/comments/1uyd0t/200000_jeopardy_questions_in_a_json_file/).
A gzipped copy is already committed at `data/JEOPARDY_QUESTIONS1.json.gz`, so you normally don't
need to download anything. To fetch it again (from the Internet Archive's copy of the original
link, verified by SHA-256):

```sh
npm run data:download
```

Each record looks like:

```json
{
  "category": "HISTORY",
  "air_date": "2004-12-31",
  "question": "'For the last 8 years of his life, Galileo was under house arrest for espousing this man's theory'",
  "value": "$200",
  "answer": "Copernicus",
  "round": "Jeopardy!",
  "show_number": "4680"
}
```

## Database: migrate and seed

```sh
npm run db:migrate   # creates the clues table and the random_board()/random_final_clue() functions
npm run db:seed      # loads the dataset (about 10 seconds)
```

The seed script cleans the data as it loads it:

- `"$1,200"` → `1200`; Final Jeopardy!'s `"None"`/`null` value → `NULL`
- strips the quotes wrapped around each clue, `\'` escapes, `<br />`/`<i>` tags and `&amp;` entities
- skips the 3 Tiebreaker clues and ~10,500 clues that link to a picture or video (they can't be
  played from text)

It inserts 206,404 rows. Running it again does nothing if the table already has rows; use
`npm run db:seed -- --reset` to empty the table and reload.

After changing `drizzle/schema.ts`, generate a new migration with `npm run db:generate`.

## Run the game

```sh
npm run dev        # http://localhost:3000
```

| Script              | What it does                               |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | dev server (`vite dev`)                    |
| `npm run build`     | production build                           |
| `npm run lint`      | ESLint                                     |
| `npm run format`    | Prettier (rewrites files)                  |
| `npm run typecheck` | TypeScript                                 |
| `npm test`          | Vitest unit tests (cleaning, board, rules) |

## How a board is built

`getBoard` calls the `random_board(round)` Postgres function, which picks 6 random categories that
have a full column of 5 clues from the same show and round. `src/lib/board.ts` then puts the 5 clues
back in their original rows (cheapest to hardest) and shows them at today's values: $200–$1,000 in
Jeopardy! and $400–$2,000 in Double Jeopardy! (shows before November 2001 used half those values, so
their clues are mapped onto the modern board). A Daily Double clue, which stored the contestant's
wager instead of a tile value, fills the row that's left empty.

## Playing

- Pick the number of players (1–3), their names and a clue timer (off, 10, 20 or 30 seconds).
- Click a tile (or use arrow keys + Enter), read the clue, then **Reveal answer** (Space).
- Mark it **Correct** (C) to add the value, **Incorrect** (X) to subtract it, or **Pass** (P).
  The turn then moves to the next player.
- When the board is empty (or you choose **End round early**), move on to Double Jeopardy!, where
  the player in last place picks first, then to Final Jeopardy!.
- Final Jeopardy!: players above $0 see the category, wager from $0 up to their score, then see the
  clue (30-second timer if timers are on) and get judged.

Jeopardy! is a trademark of Jeopardy Productions, Inc. This is an unofficial practice project; the
clue data comes from the community-built J-Archive.
