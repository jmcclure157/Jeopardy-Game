import { Play, Timer, Users } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_PLAYERS, TIMER_CHOICES } from "@/lib/game";
import { cn } from "@/lib/utils";

interface GameSetupProps {
  defaultTimer: number | null;
  onStart: (names: string[], timerSeconds: number | null) => void;
}

export function GameSetup({ defaultTimer, onStart }: GameSetupProps) {
  const [count, setCount] = useState(1);
  const [names, setNames] = useState<string[]>(Array.from({ length: MAX_PLAYERS }, () => ""));
  const [timer, setTimer] = useState<number | null>(defaultTimer);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div className="rise space-y-5">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-soft">
          200,000+ real clues from J-Archive
        </p>
        <h1 className="font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
          This is… your trivia night.
        </h1>
        <p className="max-w-prose text-lg text-ink-soft">
          Six random categories, thirty clues, then Double Jeopardy! with doubled values and a Final
          Jeopardy! wager to finish. Play solo or pass the laptop around with up to three players.
        </p>
        <ul className="space-y-2 text-sm text-ink-soft">
          <li>• Pick a tile, read the clue out loud, and answer before the timer runs out.</li>
          <li>• Reveal the answer and mark it right (+ value) or wrong (− value).</li>
          <li>• Players take turns picking; the trailing player starts Double Jeopardy!.</li>
        </ul>
      </div>

      <form
        className="rise space-y-6 rounded-2xl bg-board p-6 text-white shadow-xl sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          onStart(names.slice(0, count), timer);
        }}
      >
        <fieldset className="space-y-3">
          <legend className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4" aria-hidden /> Players
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: MAX_PLAYERS }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                className={cn(
                  "rounded-xl py-3 text-center font-semibold transition",
                  count === n ? "bg-gold text-board-dark" : "bg-white/10 hover:bg-white/20",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <Label htmlFor={`player-${i}`} className="text-white/80">
                  Player {i + 1} name
                </Label>
                <Input
                  id={`player-${i}`}
                  value={names[i]}
                  maxLength={24}
                  placeholder={`Player ${i + 1}`}
                  onChange={(event) =>
                    setNames(names.map((name, j) => (j === i ? event.target.value : name)))
                  }
                  className="border-white/20 bg-white text-ink"
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="size-4" aria-hidden /> Time per clue
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {TIMER_CHOICES.map((seconds) => (
              <button
                key={seconds ?? "off"}
                type="button"
                aria-pressed={timer === seconds}
                onClick={() => setTimer(seconds)}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-semibold transition",
                  timer === seconds ? "bg-gold text-board-dark" : "bg-white/10 hover:bg-white/20",
                )}
              >
                {seconds == null ? "Off" : `${seconds}s`}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-board-dark transition hover:brightness-105"
        >
          <Play className="size-4" aria-hidden /> Start the game
        </button>
      </form>
    </div>
  );
}
