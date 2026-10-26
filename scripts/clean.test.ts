import { describe, expect, it } from "vitest";

import { cleanClue, cleanText, parseValue, referencesMedia, type RawClue } from "./clean.ts";

const raw = (overrides: Partial<RawClue> = {}): RawClue => ({
  category: "HISTORY",
  air_date: "2004-12-31",
  question:
    "'For the last 8 years of his life, Galileo was under house arrest for espousing this man's theory'",
  value: "$200",
  answer: "Copernicus",
  round: "Jeopardy!",
  show_number: "4680",
  ...overrides,
});

describe("parseValue", () => {
  it("turns dollar strings into integers", () => {
    expect(parseValue("$200")).toBe(200);
    expect(parseValue("$1,200")).toBe(1200);
    expect(parseValue(" $2,127 ")).toBe(2127);
  });

  it("returns null for missing or malformed values", () => {
    expect(parseValue(null)).toBeNull();
    expect(parseValue(undefined)).toBeNull();
    expect(parseValue("None")).toBeNull();
    expect(parseValue("")).toBeNull();
    expect(parseValue("$12.50")).toBeNull();
  });
});

describe("cleanText", () => {
  it("strips wrapping quotes, escapes, tags and entities", () => {
    expect(cleanText("'He said \\'hello\\''")).toBe("He said 'hello'");
    expect(cleanText("'Line one<br />line two'")).toBe("Line one line two");
    expect(cleanText("'<i>Hamlet</i> &amp; <b>Macbeth</b>'")).toBe("Hamlet & Macbeth");
    expect(cleanText("Caf&#233;   au &#x6C;ait")).toBe("Café au lait");
  });
});

describe("referencesMedia", () => {
  it("detects clues that link to pictures or clips", () => {
    expect(
      referencesMedia('<a href="http://www.j-archive.com/media/x.jpg" target="_blank">this</a>'),
    ).toBe(true);
    expect(referencesMedia("'No links here'")).toBe(false);
  });
});

describe("cleanClue", () => {
  it("cleans a normal clue", () => {
    expect(cleanClue(raw())).toEqual({
      ok: true,
      row: {
        category: "HISTORY",
        clue: "For the last 8 years of his life, Galileo was under house arrest for espousing this man's theory",
        answer: "Copernicus",
        value: 200,
        round: "Jeopardy!",
        airDate: "2004-12-31",
      },
    });
  });

  it("stores no value for Final Jeopardy!", () => {
    const result = cleanClue(raw({ round: "Final Jeopardy!", value: "None" }));
    expect(result.ok && result.row.value).toBeNull();
  });

  it("skips unsupported rounds, media clues and empty text", () => {
    expect(cleanClue(raw({ round: "Tiebreaker" }))).toEqual({ ok: false, reason: "round" });
    expect(cleanClue(raw({ question: '<a href="x.jpg">this</a> man' }))).toEqual({
      ok: false,
      reason: "media",
    });
    expect(cleanClue(raw({ answer: "''" }))).toEqual({ ok: false, reason: "empty" });
  });

  it("drops malformed air dates", () => {
    const result = cleanClue(raw({ air_date: "unknown" }));
    expect(result.ok && result.row.airDate).toBeNull();
  });
});
