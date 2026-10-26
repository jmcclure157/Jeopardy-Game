import { describe, expect, it } from "vitest";

import { airedValues, arrangeColumn, boardValues, buildBoard, type ClueRow } from "@/lib/board";

let nextId = 1;
function row(value: number | null, overrides: Partial<ClueRow> = {}): ClueRow {
  return {
    id: nextId++,
    category: "SCIENCE",
    clue: `Clue worth ${value}`,
    answer: "Answer",
    value,
    round: "Jeopardy!",
    air_date: "2005-01-01",
    ...overrides,
  };
}

describe("boardValues", () => {
  it("doubles values in Double Jeopardy!", () => {
    expect(boardValues("Jeopardy!")).toEqual([200, 400, 600, 800, 1000]);
    expect(boardValues("Double Jeopardy!")).toEqual([400, 800, 1200, 1600, 2000]);
  });
});

describe("airedValues", () => {
  it("halves values for shows before the 2001 value change", () => {
    expect(airedValues("Jeopardy!", "1999-05-01")).toEqual([100, 200, 300, 400, 500]);
    expect(airedValues("Jeopardy!", "2001-11-26")).toEqual([200, 400, 600, 800, 1000]);
  });
});

describe("arrangeColumn", () => {
  it("orders clues by their aired row and uses our board values", () => {
    const column = arrangeColumn([row(800), row(200), row(1000), row(400), row(600)], "Jeopardy!");
    expect(column.clues.map((c) => c.clue)).toEqual([
      "Clue worth 200",
      "Clue worth 400",
      "Clue worth 600",
      "Clue worth 800",
      "Clue worth 1000",
    ]);
    expect(column.clues.map((c) => c.value)).toEqual([200, 400, 600, 800, 1000]);
  });

  it("puts a Daily Double wager into the row left empty", () => {
    const column = arrangeColumn([row(200), row(400), row(2127), row(800), row(1000)], "Jeopardy!");
    expect(column.clues[2]!.clue).toBe("Clue worth 2127");
    expect(column.clues[2]!.value).toBe(600);
  });

  it("handles a Daily Double that matches another row's value", () => {
    const column = arrangeColumn([row(200), row(400), row(1000), row(800), row(1000)], "Jeopardy!");
    expect(column.clues.map((c) => c.value)).toEqual([200, 400, 600, 800, 1000]);
    expect(column.clues[2]!.clue).toBe("Clue worth 1000");
  });

  it("maps old-era values onto the modern board", () => {
    const old = { air_date: "1995-03-01", round: "Double Jeopardy!" as const };
    const column = arrangeColumn(
      [row(1000, old), row(200, old), row(600, old), row(400, old), row(800, old)],
      "Double Jeopardy!",
    );
    expect(column.clues.map((c) => c.clue)).toEqual([
      "Clue worth 200",
      "Clue worth 400",
      "Clue worth 600",
      "Clue worth 800",
      "Clue worth 1000",
    ]);
    expect(column.clues.map((c) => c.value)).toEqual([400, 800, 1200, 1600, 2000]);
  });

  it("rejects columns without exactly five clues", () => {
    expect(() => arrangeColumn([row(200)], "Jeopardy!")).toThrow(/5 clues/);
  });
});

describe("buildBoard", () => {
  const column = (category: string, airDate: string) =>
    [200, 400, 600, 800, 1000].map((v) => row(v, { category, air_date: airDate }));

  it("groups rows into six columns of five", () => {
    const rows = ["A", "B", "C", "D", "E", "F"].flatMap((c, i) => column(c, `2010-01-0${i + 1}`));
    const board = buildBoard(rows, "Jeopardy!");
    expect(board.columns.map((c) => c.category)).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(board.columns.every((c) => c.clues.length === 5)).toBe(true);
  });

  it("keeps same-named categories from different shows apart", () => {
    const rows = [1, 2, 3, 4, 5, 6].flatMap((d) => column("POTPOURRI", `2010-01-0${d}`));
    expect(buildBoard(rows, "Jeopardy!").columns).toHaveLength(6);
  });

  it("explains an empty database", () => {
    expect(() => buildBoard([], "Jeopardy!")).toThrow(/db:seed/);
  });
});
