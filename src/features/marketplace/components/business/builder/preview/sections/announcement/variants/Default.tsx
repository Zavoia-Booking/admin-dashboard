import { ArrowRight, X } from "lucide-react";
import { cn } from "../../../../../../../../../shared/lib/utils";
import type { AnnouncementVariantProps } from "../types";

/** Default — a full-bleed ribbon above the nav: accent dot · message · mono CTA, with a dismiss affordance
 *  pinned to the trailing edge (decorative in the preview; the live page wires it to dismissal). */
export function Default({ msg, ctaLabel, showCta, showArrow, isEmpty }: AnnouncementVariantProps) {
  return (
    <div
      className={cn(
        "relative flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 px-10 py-2.5 text-center text-[12.5px] leading-snug",
        isEmpty && "opacity-60",
      )}
      style={{ background: "var(--mc-fg)", color: "var(--mc-bg)" }}
    >
      <span className="inline-flex items-center gap-2.5">
        <span
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ background: "var(--mc-accent)" }}
          aria-hidden
        />
        <span className="opacity-90">{msg}</span>
      </span>
      {showCta && (
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em]">
          {ctaLabel}
          {showArrow && (
            <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
          )}
        </span>
      )}
      <X
        className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-45"
        strokeWidth={1.75}
        aria-hidden
      />
    </div>
  );
}
