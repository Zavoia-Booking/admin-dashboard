import type { ReactNode } from "react";
import { AttentionDot } from "../../../../shared/components/common/AttentionDot";

/** The amber attention dot — use inline (e.g. beside a section name in the list) to flag
 *  something that needs attention. {@link InfoHint} pairs it with helper text under a field. */
export function InfoPulse({ className }: { className?: string }) {
  return <AttentionDot className={className} />;
}

/**
 * The app's standard "heads-up / required" field cue: the Info glyph beside helper text, rendered
 * under a field (or via a field's `hint` slot). Shared by the builder editors — the announcement CTA link
 * and the About Story — so the markup lives in one place.
 */
export function InfoHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <InfoPulse className="mt-1" />
      <p className="text-[11px] leading-relaxed text-foreground-3">{children}</p>
    </div>
  );
}

export default InfoHint;
