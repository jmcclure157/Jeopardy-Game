import { useGridNavigation } from "@/hooks/use-grid-navigation";
import { COLUMNS, ROWS, type Board, type BoardClue } from "@/lib/board";
import { formatMoney } from "@/lib/game";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  board: Board;
  used: ReadonlySet<number>;
  onPick: (clue: BoardClue) => void;
}

// Same idea as the tee-time slot grid: a grid of buttons, where played tiles are disabled.
export function GameBoard({ board, used, onPick }: GameBoardProps) {
  const { getTileProps } = useGridNavigation(ROWS, COLUMNS);

  return (
    <div
      role="group"
      aria-label={`${board.round} board. Use the arrow keys to move between clues.`}
      className="grid grid-cols-6 gap-1 rounded-2xl bg-board-dark p-1 shadow-xl sm:gap-2 sm:p-2"
    >
      {board.columns.map((column) => (
        <div
          key={`${column.airDate}-${column.category}`}
          className="flex min-h-16 items-center justify-center rounded-lg bg-board px-1 py-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-white sm:min-h-24 sm:px-2 sm:text-xs lg:text-sm"
        >
          {column.category}
        </div>
      ))}
      {Array.from({ length: ROWS }, (_, row) =>
        board.columns.map((column, col) => {
          const clue = column.clues[row]!;
          const played = used.has(clue.id);
          return (
            <button
              key={clue.id}
              {...getTileProps(row, col)}
              disabled={played}
              onClick={() => onPick(clue)}
              aria-label={`${column.category} for ${formatMoney(clue.value)}${
                played ? ", already played" : ""
              }`}
              className={cn(
                "flex h-14 items-center justify-center rounded-lg font-display text-base transition sm:h-20 sm:text-2xl lg:text-3xl",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                played
                  ? "cursor-default bg-board/40 text-transparent"
                  : "bg-board text-gold hover:bg-board-light",
              )}
            >
              {formatMoney(clue.value)}
            </button>
          );
        }),
      )}
    </div>
  );
}

export function GameBoardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading the board"
      className="grid grid-cols-6 gap-1 rounded-2xl bg-board-dark p-1 sm:gap-2 sm:p-2"
    >
      {Array.from({ length: COLUMNS * (ROWS + 1) }, (_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-lg bg-board/70",
            i < COLUMNS ? "min-h-16 sm:min-h-24" : "h-14 sm:h-20",
          )}
        />
      ))}
    </div>
  );
}
