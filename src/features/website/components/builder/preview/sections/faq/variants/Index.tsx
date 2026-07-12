import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { localized } from "../../../shared/util";
import type { FaqVariantProps } from "../types";

/** Index — an oversized numbered index, one answer open at a time (mirrors the source `FaqIndex`). Same
 *  single-open mechanic + measured max-height tween as Default, with a large number rail and a display-set
 *  question that warms from muted to ink when active. */
export function Index({ items, locale }: FaqVariantProps) {
  const [open, setOpen] = useState(0);
  const answerRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (open >= 0 && open >= items.length) setOpen(items.length ? 0 : -1);
  }, [items.length, open]);

  useLayoutEffect(() => {
    answerRefs.current.forEach((el, i) => {
      if (el) el.style.maxHeight = open === i ? `${el.scrollHeight}px` : "0px";
    });
  }, [open, items, locale]);

  return (
    <div className="mc-fqx">
      {items.map((f, i) => {
        const on = open === i;
        return (
          <div key={i} className="mc-fqx-item" data-on={on ? "1" : "0"}>
            <button type="button" className="mc-fqx-q" onClick={() => setOpen(on ? -1 : i)} aria-expanded={on}>
              <span className="mc-fqx-no">{String(i + 1).padStart(2, "0")}</span>
              <span className="mc-fqx-tx">{localized(f.q, locale)}</span>
              <span className="mc-fqx-ic">
                <Plus className="h-5 w-5" strokeWidth={2} />
              </span>
            </button>
            <div
              ref={(el) => {
                answerRefs.current[i] = el;
              }}
              className="mc-fqx-a"
            >
              {localized(f.a, locale) && <p className="mc-fqx-a-inner">{localized(f.a, locale)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
