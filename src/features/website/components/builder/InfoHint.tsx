import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../../shared/lib/utils";

/** Just the primary Info glyph — use inline (e.g. beside a section name in the list) to flag
 *  something that needs attention. {@link InfoHint} pairs it with helper text under a field. */
export function InfoPulse({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-3.5 w-3.5 shrink-0", className)}>
      <Info className="relative inline-flex h-3.5 w-3.5 text-primary" />
    </span>
  );
}

/**
 * The app's standard "heads-up / required" field cue: the Info glyph beside helper text, rendered
 * under a field (or via a field's `hint` slot). Shared by the builder editors — the announcement CTA link
 * and the About headline — so the markup lives in one place.
 */
export function InfoHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <InfoPulse className="mt-0.5" />
      <p className="text-[11px] leading-relaxed text-foreground-3">{children}</p>
    </div>
  );
}

export default InfoHint;
