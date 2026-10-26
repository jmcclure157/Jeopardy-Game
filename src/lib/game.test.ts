import { describe, expect, it } from "vitest";

import {
  finalEligible,
  formatMoney,
  gameReducer,
  initialGameState,
  isRoundComplete,
  isValidWager,
  winners,
  type GameState,
} from "@/lib/game";

function started(names: string[]): GameState {
  return gameReducer(initialGameState, { type: "start", names, timerSeconds: null });
}

describe("start", () => {
  it("creates players with default names and a fresh game id", () => {
    const state = started(["Alex", "  ", "Sam", "Extra"]);
    expect(state.phase).toBe("round");
    expect(state.gameId).toBe(1);
    expect(state.players.map((p) => p.name)).toEqual(["Alex", "Player 2", "Sam"]);
  });
});

describe("answer", () => {
  it("adds or subtracts the value, consumes the tile and passes the turn", () => {
    let state = started(["A", "B"]);
    state = gameReducer(state, { type: "answer", clueId: 1, value: 400, outcome: "correct" });
    state = gameReducer(state, { type: "answer", clueId: 2, value: 600, outcome: "incorrect" });
    state = gameReducer(state, { type: "answer", clueId: 3, value: 200, outcome: "pass" });
    expect(state.players.map((p) => p.score)).toEqual([400, -600]);
    expect(state.used).toEqual([1, 2, 3]);
    expect(state.turn).toBe(1);
  });

  it("ignores a tile that was already played", () => {
    let state = started(["A"]);
    state = gameReducer(state, { type: "answer", clueId: 1, value: 400, outcome: "correct" });
    const again = gameReducer(state, { type: "answer", clueId: 1, value: 400, outcome: "correct" });
    expect(again).toBe(state);
  });
});

describe("round progression", () => {
  it("goes Jeopardy! → Double Jeopardy! → Final Jeopardy!", () => {
    let state = started(["A", "B"]);
    state = gameReducer(state, { type: "answer", clueId: 1, value: 1000, outcome: "correct" });
    state = gameReducer(state, { type: "next-round" });
    expect(state.round).toBe("Double Jeopardy!");
    expect(state.used).toEqual([]);
    expect(state.turn).toBe(1); // trailing player picks first
    state = gameReducer(state, { type: "next-round" });
    expect(state.phase).toBe("final");
  });

  it("skips Final Jeopardy! when nobody is above $0", () => {
    let state = started(["A"]);
    state = gameReducer(state, { type: "next-round" });
    state = gameReducer(state, { type: "next-round" });
    expect(state.phase).toBe("game-over");
  });

  it("knows when every tile is played", () => {
    const state = { ...started(["A"]), used: Array.from({ length: 30 }, (_, i) => i) };
    expect(isRoundComplete(state)).toBe(true);
  });
});

describe("Final Jeopardy!", () => {
  function atFinal(scores: number[]): GameState {
    const state = started(scores.map((_, i) => `P${i}`));
    return {
      ...state,
      phase: "final",
      players: state.players.map((p, i) => ({ ...p, score: scores[i]! })),
    };
  }

  it("only lets players above $0 play", () => {
    expect(finalEligible(atFinal([500, 0, -200]).players)).toEqual([0]);
  });

  it("validates wagers between $0 and the player's score", () => {
    expect(isValidWager(0, 500)).toBe(true);
    expect(isValidWager(500, 500)).toBe(true);
    expect(isValidWager(501, 500)).toBe(false);
    expect(isValidWager(-1, 500)).toBe(false);
    expect(isValidWager(10.5, 500)).toBe(false);
  });

  it("applies wagers and ignores ineligible or invalid entries", () => {
    const state = gameReducer(atFinal([1000, 800, -200]), {
      type: "finish-final",
      results: {
        0: { wager: 600, correct: false },
        1: { wager: 800, correct: true },
        2: { wager: 100, correct: true },
      },
    });
    expect(state.phase).toBe("game-over");
    expect(state.players.map((p) => p.score)).toEqual([400, 1600, -200]);
    expect(Object.keys(state.final)).toEqual(["0", "1"]);
    expect(winners(state.players)).toEqual([1]);
  });
});

describe("formatMoney", () => {
  it("formats positive and negative amounts", () => {
    expect(formatMoney(1200)).toBe("$1,200");
    expect(formatMoney(-400)).toBe("−$400");
  });
});
