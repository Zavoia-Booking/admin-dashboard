import { cn } from "../../lib/utils";

/**
 * Amber pulsating dot — the app's "needs attention" cue for incomplete or
 * required items (replaces the older pulsating Info glyph).
 */
export function AttentionDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative flex size-2 shrink-0", className)}
      aria-hidden="true"
    >
      <span
        className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-75"
        style={{ animationDuration: "1.5s" }}
      />
      <span className="relative inline-flex size-full rounded-full bg-amber-500" />
    </span>
  );
}

export default AttentionDot;
