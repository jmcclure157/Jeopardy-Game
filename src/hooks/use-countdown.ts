import { useEffect, useState } from "react";

/**
 * Counts down from `totalSeconds` while `running` is true and returns the milliseconds
 * left (null when there's no timer). Pausing keeps the remaining time.
 */
export function useCountdown(totalSeconds: number | null, running: boolean): number | null {
  const [remainingMs, setRemainingMs] = useState(totalSeconds == null ? null : totalSeconds * 1000);

  useEffect(() => {
    if (!running || remainingMs == null || remainingMs <= 0) return;
    const deadline = Date.now() + remainingMs;
    const id = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setRemainingMs(left);
      if (left === 0) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
    // Restart only when running toggles; remainingMs changes on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return remainingMs;
}
