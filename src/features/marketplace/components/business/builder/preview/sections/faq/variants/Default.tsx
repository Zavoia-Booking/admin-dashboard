import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "../../../../../../../../../shared/lib/utils";
import { DISPLAY } from "../../../shared/constants";
import { localized } from "../../../shared/util";
import type { FaqVariantProps } from "../types";

/** Default — the interactive single-open accordion (mirrors the source `SecFAQ`): item 0 open by default,
 *  clicking the open one closes it, the "+" rotates 45° into an × and fills accent, and the answer height
 *  tweens via a measured max-height. The `list` variant renders every answer expanded (no toggle). */
export function Default({ items, list, locale }: FaqVariantProps) {
  const [open, setOpen] = useState(0);
  const answerRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Items are live owner data; if the open question is deleted (or the list shrinks past it), snap the open
  // index back in range so a stale index never points past the end (mirrors the Gallery lightbox clamp).
  useEffect(() => {
    if (!list && open >= 0 && open >= items.length) setOpen(items.length ? 0 : -1);
  }, [items.length, open, list]);

  // Drive each panel's max-height to its content height when open, 0 when closed. useLayoutEffect so the
  // default-open item paints already expanded (no open-on-mount flash); subsequent toggles tween via CSS.
  useLayoutEffect(() => {
    answerRefs.current.forEach((el, i) => {
      if (el) el.style.maxHeight = list || open === i ? `${el.scrollHeight}px` : "0px";
    });
  }, [open, list, items, locale]);

  return (
    <div className="border-t" style={{ borderColor: "var(--mc-line)" }}>
      {items.map((f, i) => {
        const isOpen = list || open === i;
        return (
          <div key={i} className="border-b" style={{ borderColor: "var(--mc-line)" }}>
            <button
              type="button"
              onClick={() => !list && setOpen(open === i ? -1 : i)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center justify-between gap-4 py-[clamp(14px,2.4cqw,24px)] text-left",
                list && "cursor-default",
              )}
            >
              <span style={{ ...DISPLAY, fontSize: "clamp(16px,2.7cqw,24px)" }}>{localized(f.q, locale)}</span>
              {!list && (
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: isOpen ? "var(--mc-accent)" : "var(--mc-line)",
                    background: isOpen ? "var(--mc-accent)" : "transparent",
                    color: isOpen ? "var(--mc-on-accent)" : "var(--mc-fg)",
                    transform: isOpen ? "rotate(45deg)" : "none",
                    transition:
                      "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), background-color 0.25s, color 0.25s, border-color 0.25s",
                  }}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              )}
            </button>
            <div
              ref={(el) => {
                answerRefs.current[i] = el;
              }}
              className="overflow-hidden"
              style={{ maxHeight: 0, transition: "max-height 0.4s var(--ease-out-strong)" }}
            >
              {localized(f.a, locale) && (
                <p
                  className="-mt-1 max-w-[68ch] pb-[clamp(14px,2.4cqw,24px)] text-[14.5px] leading-relaxed"
                  style={{ color: "var(--mc-muted)" }}
                >
                  {localized(f.a, locale)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
