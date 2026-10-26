import { useQuery } from "@tanstack/react-query";
import { Check, Eye, Lock, X } from "lucide-react";
import { useState, type Dispatch } from "react";

import { ClueTimer } from "@/components/game/clue-timer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCountdown } from "@/hooks/use-countdown";
import {
  FINAL_SECONDS,
  finalEligible,
  formatMoney,
  isValidWager,
  type FinalResult,
  type GameAction,
  type GameState,
} from "@/lib/game";
import { finalClueQueryOptions } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Step = "wager" | "clue" | "judge";

export function FinalJeopardy({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}) {
  const clueQuery = useQuery(finalClueQueryOptions(state.gameId));
  const eligible = finalEligible(state.players);
  const sittingOut = state.players.filter((_, i) => !eligible.includes(i));
  const [step, setStep] = useState<Step>("wager");
  const [wagerText, setWagerText] = useState<Record<number, string>>({});
  const [correct, setCorrect] = useState<Record<number, boolean>>({});

  const wagerFor = (i: number) => Number(wagerText[i] ?? "");
  const wagerOk = (i: number) =>
    (wagerText[i] ?? "").trim() !== "" && isValidWager(wagerFor(i), state.players[i]!.score);
  const allWagersOk = eligible.every(wagerOk);
  const allJudged = eligible.every((i) => correct[i] !== undefined);

  const finish = () => {
    const results: Record<number, FinalResult> = {};
    for (const i of eligible) results[i] = { wager: wagerFor(i), correct: correct[i] === true };
    dispatch({ type: "finish-final", results });
  };

  return (
    <section
      aria-labelledby="final-heading"
      className="rise mx-auto max-w-3xl space-y-6 rounded-2xl bg-board p-6 text-white shadow-xl sm:p-10"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-white/60">Round 3 of 3</p>
        <h2 id="final-heading" className="font-display text-3xl">
          Final Jeopardy!
        </h2>
      </div>

      {clueQuery.isPending && <p className="text-white/70">Picking the final category…</p>}
      {clueQuery.isError && (
        <div role="alert" className="space-y-3">
          <p>We couldn't load the Final Jeopardy! clue: {clueQuery.error.message}</p>
          <button
            onClick={() => void clueQuery.refetch()}
            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-board-dark"
          >
            Try again
          </button>
        </div>
      )}

      {clueQuery.isSuccess && (
        <>
          <div className="rounded-xl bg-board-dark/60 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-white/60">Category</p>
            <p className="mt-1 font-display text-2xl uppercase text-gold">
              {clueQuery.data.category}
            </p>
          </div>

          {step === "wager" && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (allWagersOk) setStep("clue");
              }}
            >
              <p className="text-sm text-white/80">
                Before you see the clue, decide how much to bet. You can wager anything from $0 up
                to your current score.
              </p>
              {eligible.map((i) => {
                const player = state.players[i]!;
                const text = wagerText[i] ?? "";
                const invalid = text.trim() !== "" && !wagerOk(i);
                return (
                  <div key={i} className="space-y-1.5">
                    <Label htmlFor={`wager-${i}`} className="text-white">
                      {player.name}'s wager (up to {formatMoney(player.score)})
                    </Label>
                    <Input
                      id={`wager-${i}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={player.score}
                      step={1}
                      autoFocus={i === eligible[0]}
                      value={text}
                      aria-invalid={invalid}
                      aria-describedby={invalid ? `wager-${i}-error` : undefined}
                      onChange={(event) => setWagerText({ ...wagerText, [i]: event.target.value })}
                      className="border-white/20 bg-white text-ink"
                    />
                    {invalid && (
                      <p id={`wager-${i}-error`} className="text-sm text-red-300">
                        Enter a whole number from 0 to {player.score}.
                      </p>
                    )}
                  </div>
                );
              })}
              {sittingOut.length > 0 && (
                <p className="text-sm text-white/60">
                  {sittingOut.map((p) => p.name).join(", ")} can't play Final Jeopardy! because
                  their score isn't above $0.
                </p>
              )}
              <button
                type="submit"
                disabled={!allWagersOk}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-semibold text-board-dark transition disabled:opacity-50"
              >
                <Lock className="size-4" aria-hidden /> Lock in{" "}
                {eligible.length > 1 ? "wagers" : "wager"} and show the clue
              </button>
            </form>
          )}

          {step !== "wager" && (
            <FinalClue
              clue={clueQuery.data.clue}
              answer={clueQuery.data.answer}
              timerSeconds={state.timerSeconds == null ? null : FINAL_SECONDS}
              revealed={step === "judge"}
              onReveal={() => setStep("judge")}
            />
          )}

          {step === "judge" && (
            <div className="space-y-3">
              <p className="text-sm text-white/80">Who got it right?</p>
              {eligible.map((i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-board-dark/60 px-4 py-3"
                >
                  <span>
                    {state.players[i]!.name}{" "}
                    <span className="text-white/60">wagered {formatMoney(wagerFor(i))}</span>
                  </span>
                  <div
                    className="flex gap-2"
                    role="group"
                    aria-label={`Judge ${state.players[i]!.name}`}
                  >
                    <ToggleButton
                      pressed={correct[i] === true}
                      onClick={() => setCorrect({ ...correct, [i]: true })}
                      className="aria-pressed:bg-emerald-500 aria-pressed:text-emerald-950"
                    >
                      <Check className="size-4" aria-hidden /> Correct
                    </ToggleButton>
                    <ToggleButton
                      pressed={correct[i] === false}
                      onClick={() => setCorrect({ ...correct, [i]: false })}
                      className="aria-pressed:bg-red-500 aria-pressed:text-red-950"
                    >
                      <X className="size-4" aria-hidden /> Incorrect
                    </ToggleButton>
                  </div>
                </div>
              ))}
              <button
                onClick={finish}
                disabled={!allJudged}
                className="rounded-full bg-gold px-5 py-2.5 font-semibold text-board-dark transition disabled:opacity-50"
              >
                See final scores
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function FinalClue({
  clue,
  answer,
  timerSeconds,
  revealed,
  onReveal,
}: {
  clue: string;
  answer: string;
  timerSeconds: number | null;
  revealed: boolean;
  onReveal: () => void;
}) {
  const remainingMs = useCountdown(timerSeconds, !revealed);
  const showAnswer = revealed || remainingMs === 0;

  return (
    <div className="rise space-y-5">
      <ClueTimer remainingMs={showAnswer ? null : remainingMs} totalSeconds={timerSeconds} />
      <p className="text-balance text-center font-display text-2xl uppercase leading-snug sm:text-3xl">
        {clue}
      </p>
      {showAnswer ? (
        <div className="text-center" aria-live="polite">
          <p className="text-xs uppercase tracking-widest text-white/60">Answer</p>
          <p className="mt-1 font-display text-2xl text-gold">{answer}</p>
          {!revealed && (
            <button
              autoFocus
              onClick={onReveal}
              className="mt-4 rounded-full bg-gold px-5 py-2.5 font-semibold text-board-dark"
            >
              Time's up — judge the answers
            </button>
          )}
        </div>
      ) : (
        <div className="text-center">
          <button
            autoFocus
            onClick={onReveal}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-semibold text-board-dark"
          >
            <Eye className="size-4" aria-hidden /> Reveal answer
          </button>
        </div>
      )}
    </div>
  );
}

function ToggleButton({
  pressed,
  className,
  ...props
}: React.ComponentProps<"button"> & { pressed: boolean }) {
  return (
    <button
      {...props}
      aria-pressed={pressed}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium transition hover:bg-white/20",
        className,
      )}
    />
  );
}
