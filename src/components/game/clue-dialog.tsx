import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Eye, SkipForward, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useState } from "react";

import { ClueTimer } from "@/components/game/clue-timer";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { useCountdown } from "@/hooks/use-countdown";
import type { BoardClue } from "@/lib/board";
import { formatMoney, type Outcome } from "@/lib/game";

interface ClueDialogProps {
  clue: BoardClue | null;
  /** Whose turn it is; omitted in single-player games. */
  playerName: string | null;
  timerSeconds: number | null;
  onJudged: (outcome: Outcome) => void;
}

export function ClueDialog({ clue, playerName, timerSeconds, onJudged }: ClueDialogProps) {
  return (
    <Dialog open={clue != null}>
      <DialogPortal>
        <DialogOverlay className="bg-board-dark/85" />
        {clue && (
          <ClueCard
            key={clue.id}
            clue={clue}
            playerName={playerName}
            timerSeconds={timerSeconds}
            onJudged={onJudged}
          />
        )}
      </DialogPortal>
    </Dialog>
  );
}

const OUTCOME_KEYS: Record<string, Outcome> = { c: "correct", x: "incorrect", p: "pass" };

function ClueCard({
  clue,
  playerName,
  timerSeconds,
  onJudged,
}: ClueDialogProps & { clue: BoardClue }) {
  const [revealed, setRevealed] = useState(false);
  const remainingMs = useCountdown(timerSeconds, !revealed);
  const timeUp = remainingMs === 0;
  const showAnswer = revealed || timeUp;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!showAnswer && (event.key === " " || event.key === "Enter")) {
      event.preventDefault();
      setRevealed(true);
      return;
    }
    const outcome = OUTCOME_KEYS[event.key.toLowerCase()];
    if (showAnswer && outcome) {
      event.preventDefault();
      onJudged(outcome);
    }
  };

  return (
    <DialogPrimitive.Content
      onKeyDown={handleKeyDown}
      // Above the overlay, which Radix portals in separately. A clue must be judged
      // before closing, so outside clicks and Escape do nothing.
      onEscapeKeyDown={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
      className="fixed left-1/2 top-1/2 z-60 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col gap-6 overflow-y-auto rounded-2xl bg-board p-6 text-white shadow-2xl ring-1 ring-white/10 focus:outline-none sm:p-10"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <DialogPrimitive.Title className="font-semibold uppercase tracking-wider text-gold">
          {clue.category} · {formatMoney(clue.value)}
        </DialogPrimitive.Title>
        {playerName && <span className="text-white/70">{playerName}'s turn</span>}
      </div>

      <ClueTimer remainingMs={showAnswer ? null : remainingMs} totalSeconds={timerSeconds} />

      <DialogPrimitive.Description className="text-balance text-center font-display text-2xl uppercase leading-snug sm:text-4xl">
        {clue.clue}
      </DialogPrimitive.Description>

      {showAnswer ? (
        <div className="rise flex flex-col items-center gap-6">
          <div className="text-center" aria-live="polite">
            <p className="text-xs uppercase tracking-widest text-white/60">
              {timeUp && !revealed ? "Time's up! The answer was" : "Answer"}
            </p>
            <p className="mt-1 font-display text-2xl text-gold sm:text-3xl">{clue.answer}</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-3">
            <JudgeButton
              autoFocus
              onClick={() => onJudged("correct")}
              shortcut="C"
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            >
              <Check className="size-4" aria-hidden /> Correct (+{formatMoney(clue.value)})
            </JudgeButton>
            <JudgeButton
              onClick={() => onJudged("incorrect")}
              shortcut="X"
              className="bg-red-500 text-red-950 hover:bg-red-400"
            >
              <X className="size-4" aria-hidden /> Incorrect (−{formatMoney(clue.value)})
            </JudgeButton>
            <JudgeButton
              onClick={() => onJudged("pass")}
              shortcut="P"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <SkipForward className="size-4" aria-hidden /> Pass (no change)
            </JudgeButton>
          </div>
        </div>
      ) : (
        <button
          autoFocus
          onClick={() => setRevealed(true)}
          className="mx-auto inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-board-dark transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Eye className="size-4" aria-hidden /> Reveal answer
          <kbd className="rounded bg-board-dark/15 px-1.5 text-xs">Space</kbd>
        </button>
      )}
    </DialogPrimitive.Content>
  );
}

function JudgeButton({
  shortcut,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { shortcut: string }) {
  return (
    <button
      {...props}
      aria-keyshortcuts={shortcut}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${className ?? ""}`}
    >
      {children}
      <kbd className="rounded bg-black/15 px-1.5 text-xs">{shortcut}</kbd>
    </button>
  );
}
