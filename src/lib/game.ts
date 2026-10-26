import { TILES_PER_ROUND, type BoardRound } from "@/lib/board";

export type Phase = "setup" | "round" | "final" | "game-over";
export type Outcome = "correct" | "incorrect" | "pass";

export const MAX_PLAYERS = 3;
export const TIMER_CHOICES = [null, 10, 20, 30] as const;
export const FINAL_SECONDS = 30;

export interface Player {
  name: string;
  score: number;
}

export interface FinalResult {
  wager: number;
  correct: boolean;
}

export interface GameState {
  phase: Phase;
  /** Changes on every new game so each game fetches fresh boards. */
  gameId: number;
  players: Player[];
  /** Index of the player whose turn it is. */
  turn: number;
  round: BoardRound;
  /** Clue ids already played this round. */
  used: number[];
  timerSeconds: number | null;
  /** Final Jeopardy! results by player index; missing for players who sat it out. */
  final: Record<number, FinalResult>;
}

export type GameAction =
  | { type: "start"; names: string[]; timerSeconds: number | null }
  | { type: "answer"; clueId: number; value: number; outcome: Outcome }
  | { type: "next-round" }
  | { type: "finish-final"; results: Record<number, FinalResult> }
  | { type: "new-game" };

export const initialGameState: GameState = {
  phase: "setup",
  gameId: 0,
  players: [],
  turn: 0,
  round: "Jeopardy!",
  used: [],
  timerSeconds: 20,
  final: {},
};

/** Players who may play Final Jeopardy!: only those finishing above $0, as on the show. */
export function finalEligible(players: Player[]): number[] {
  return players.flatMap((p, i) => (p.score > 0 ? [i] : []));
}

export function isValidWager(wager: number, score: number): boolean {
  return Number.isInteger(wager) && wager >= 0 && wager <= Math.max(score, 0);
}

export function isRoundComplete(state: GameState): boolean {
  return state.used.length >= TILES_PER_ROUND;
}

/** The trailing player picks first in Double Jeopardy! (first listed wins ties). */
function lowestScorer(players: Player[]): number {
  let lowest = 0;
  players.forEach((p, i) => {
    if (p.score < players[lowest]!.score) lowest = i;
  });
  return lowest;
}

export function winners(players: Player[]): number[] {
  if (players.length === 0) return [];
  const best = Math.max(...players.map((p) => p.score));
  return players.flatMap((p, i) => (p.score === best ? [i] : []));
}

export function formatMoney(amount: number): string {
  const text = `$${Math.abs(amount).toLocaleString("en-US")}`;
  return amount < 0 ? `−${text}` : text;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "start": {
      const names = action.names.slice(0, MAX_PLAYERS).map((n, i) => n.trim() || `Player ${i + 1}`);
      if (names.length === 0) return state;
      return {
        ...initialGameState,
        phase: "round",
        gameId: state.gameId + 1,
        players: names.map((name) => ({ name, score: 0 })),
        timerSeconds: action.timerSeconds,
      };
    }
    case "answer": {
      if (state.phase !== "round" || state.used.includes(action.clueId)) return state;
      const delta =
        action.outcome === "correct"
          ? action.value
          : action.outcome === "incorrect"
            ? -action.value
            : 0;
      return {
        ...state,
        players: state.players.map((p, i) =>
          i === state.turn ? { ...p, score: p.score + delta } : p,
        ),
        used: [...state.used, action.clueId],
        turn: (state.turn + 1) % state.players.length,
      };
    }
    case "next-round": {
      if (state.phase !== "round") return state;
      if (state.round === "Jeopardy!") {
        return { ...state, round: "Double Jeopardy!", used: [], turn: lowestScorer(state.players) };
      }
      const anyoneEligible = finalEligible(state.players).length > 0;
      return { ...state, used: [], phase: anyoneEligible ? "final" : "game-over" };
    }
    case "finish-final": {
      if (state.phase !== "final") return state;
      const eligible = new Set(finalEligible(state.players));
      const final: Record<number, FinalResult> = {};
      const players = state.players.map((p, i) => {
        const result = action.results[i];
        if (!eligible.has(i) || !result || !isValidWager(result.wager, p.score)) return p;
        final[i] = result;
        return { ...p, score: p.score + (result.correct ? result.wager : -result.wager) };
      });
      return { ...state, players, final, phase: "game-over" };
    }
    case "new-game":
      return { ...initialGameState, gameId: state.gameId, timerSeconds: state.timerSeconds };
  }
}
