import type { NewClueRow, Round } from "../drizzle/schema.ts";
import { ROUNDS } from "../drizzle/schema.ts";

/** One record of JEOPARDY_QUESTIONS1.json, exactly as published. */
export interface RawClue {
  category: string;
  air_date: string;
  question: string;
  value: string | null;
  answer: string;
  round: string;
  show_number: string;
}

export type SkipReason = "round" | "media" | "empty";

export type CleanResult = { ok: true; row: NewClueRow } | { ok: false; reason: SkipReason };

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Turns the dataset's HTML-ish text into plain text. */
export function cleanText(raw: string): string {
  let text = raw.trim();
  // Every clue is wrapped in single quotes: 'For the last 8 years of his life...'
  if (text.length >= 2 && text.startsWith("'") && text.endsWith("'")) {
    text = text.slice(1, -1);
  }
  text = text
    .replace(/\\(['"])/g, "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "");
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

/** "$1,200" -> 1200. "None"/null (Final Jeopardy!, Tiebreaker) -> null. */
export function parseValue(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const digits = raw.replace(/[$,\s]/g, "");
  if (digits === "" || !/^\d+$/.test(digits)) return null;
  return Number(digits);
}

function isRound(value: string): value is Round {
  return (ROUNDS as readonly string[]).includes(value);
}

/** Clues that link to a picture, audio or video clip can't be played from text alone. */
export function referencesMedia(question: string): boolean {
  return /<a\s[^>]*href/i.test(question);
}

export function cleanClue(raw: RawClue): CleanResult {
  if (!isRound(raw.round)) return { ok: false, reason: "round" };
  if (referencesMedia(raw.question)) return { ok: false, reason: "media" };

  const clue = cleanText(raw.question);
  const answer = cleanText(raw.answer);
  const category = cleanText(raw.category);
  if (!clue || !answer || !category) return { ok: false, reason: "empty" };

  return {
    ok: true,
    row: {
      category,
      clue,
      answer,
      value: raw.round === "Final Jeopardy!" ? null : parseValue(raw.value),
      round: raw.round,
      airDate: /^\d{4}-\d{2}-\d{2}$/.test(raw.air_date) ? raw.air_date : null,
    },
  };
}
