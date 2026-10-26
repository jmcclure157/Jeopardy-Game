import { cn } from "@/lib/utils";

export function ClueTimer({
  remainingMs,
  totalSeconds,
}: {
  remainingMs: number | null;
  totalSeconds: number | null;
}) {
  if (remainingMs == null || totalSeconds == null) return null;
  const seconds = Math.ceil(remainingMs / 1000);
  const percent = (remainingMs / (totalSeconds * 1000)) * 100;
  return (
    <div role="timer" aria-label={`${seconds} seconds left`} className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-100 ease-linear",
            seconds <= 5 ? "bg-red-400" : "bg-gold",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-semibold tabular-nums text-white/80">
        {seconds}s
      </span>
    </div>
  );
}
