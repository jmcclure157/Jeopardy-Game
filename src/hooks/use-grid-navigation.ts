import { useCallback, useRef, useState, type KeyboardEvent } from "react";

/**
 * Roving-tabindex keyboard navigation for a grid of buttons: Tab lands on one tile,
 * arrow keys move between tiles, Home/End jump to the row's ends.
 */
export function useGridNavigation(rows: number, columns: number) {
  const [active, setActive] = useState({ row: 0, column: 0 });
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = useCallback(
    (row: number, column: number) => {
      const next = {
        row: Math.min(rows - 1, Math.max(0, row)),
        column: Math.min(columns - 1, Math.max(0, column)),
      };
      setActive(next);
      refs.current[next.row * columns + next.column]?.focus();
    },
    [rows, columns],
  );

  const getTileProps = (row: number, column: number) => ({
    ref: (el: HTMLButtonElement | null) => {
      refs.current[row * columns + column] = el;
    },
    tabIndex: active.row === row && active.column === column ? 0 : -1,
    onFocus: () => setActive({ row, column }),
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      const moves: Record<string, [number, number]> = {
        ArrowUp: [row - 1, column],
        ArrowDown: [row + 1, column],
        ArrowLeft: [row, column - 1],
        ArrowRight: [row, column + 1],
        Home: [row, 0],
        End: [row, columns - 1],
      };
      const target = moves[event.key];
      if (!target) return;
      event.preventDefault();
      move(...target);
    },
  });

  return { getTileProps };
}
