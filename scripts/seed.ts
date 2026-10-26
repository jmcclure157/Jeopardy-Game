// One-time loader: reads data/JEOPARDY_QUESTIONS1.json(.gz), cleans every record and
// inserts it into the `clues` table. Usage: npm run db:seed [-- --reset]
import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { clues, type NewClueRow } from "../drizzle/schema.ts";
import { cleanClue, type RawClue, type SkipReason } from "./clean.ts";

const DATA_DIR = resolve(import.meta.dirname, "../data");
const BATCH_SIZE = 1000;

function loadDataset(): RawClue[] {
  const plain = resolve(DATA_DIR, "JEOPARDY_QUESTIONS1.json");
  const gzipped = `${plain}.gz`;
  if (existsSync(plain)) return JSON.parse(readFileSync(plain, "utf8")) as RawClue[];
  if (existsSync(gzipped)) {
    return JSON.parse(gunzipSync(readFileSync(gzipped)).toString("utf8")) as RawClue[];
  }
  throw new Error(`Dataset not found in ${DATA_DIR}. Run \`npm run data:download\` first.`);
}

async function main() {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file: rely on variables already set in the shell.
  }
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  const reset = process.argv.includes("--reset");

  const raw = loadDataset();
  const rows: NewClueRow[] = [];
  const skipped: Record<SkipReason, number> = { round: 0, media: 0, empty: 0 };
  for (const record of raw) {
    const result = cleanClue(record);
    if (result.ok) rows.push(result.row);
    else skipped[result.reason]++;
  }
  console.log(`Parsed ${raw.length} records: ${rows.length} to insert, skipped`, skipped);

  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(sql);
  try {
    const [existing] = await db.select({ n: count() }).from(clues);
    if (existing && existing.n > 0) {
      if (!reset) {
        console.log(
          `clues already has ${existing.n} rows; nothing to do (pass --reset to reload).`,
        );
        return;
      }
      await sql`truncate table clues restart identity`;
      console.log(`Removed ${existing.n} existing rows.`);
    }

    await db.transaction(async (tx) => {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await tx.insert(clues).values(rows.slice(i, i + BATCH_SIZE));
        const done = Math.min(i + BATCH_SIZE, rows.length);
        if (done % 25_000 < BATCH_SIZE || done === rows.length) {
          console.log(`Inserted ${done}/${rows.length}`);
        }
      }
    });
    console.log("Seed complete.");
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
