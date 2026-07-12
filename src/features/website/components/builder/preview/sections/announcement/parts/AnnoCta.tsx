import { ArrowRight } from "lucide-react";

/** Announcement CTA — a mono, underlined label (styled by `.mc-anno-in a`). Inert in the preview (no href):
 *  the live page wires it to the owner's destination. */
export function AnnoCta({ label, showArrow }: { label: string; showArrow: boolean }) {
  return (
    <a>
      {label}
      {showArrow && <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />}
    </a>
  );
}
