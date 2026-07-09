import { useLayoutEffect, useRef, useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import type { LocationWithAssignments } from "../../../../../../../types";
import { locationArea } from "../../../shared/contact";

/** Left index: selectable rows + a sliding accent indicator that springs to the active row. */
export function LocationIndex({ shown, active, onSelect }: { shown: LocationWithAssignments[]; active: number; onSelect: (i: number) => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ y: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const row = list.querySelectorAll<HTMLElement>(".mc-locx-row")[active];
    if (row) setInd({ y: row.offsetTop + 14, h: Math.max(0, row.offsetHeight - 28) });
  }, [active, shown.length]);

  return (
    <div ref={listRef} className="relative flex flex-col">
      {ind && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 w-[2px] rounded-full"
          style={{
            transform: `translateY(${ind.y}px)`,
            height: ind.h,
            background: "var(--mc-accent)",
            transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), height 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      )}
      {shown.map((l, i) => {
        const on = i === active;
        const rating = (l.totalReviews ?? 0) > 0 ? Number(l.averageRating ?? 0) : null;
        const area = locationArea(l);
        return (
          <button key={l.id} type="button" className="mc-locx-row" data-on={on ? "1" : "0"} onClick={() => onSelect(i)} aria-pressed={on}>
            <span className="mc-locx-no">{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0">
              <span className="mc-locx-nm">{l.name}</span>
              {area && <span className="mc-locx-area">{area}</span>}
            </span>
            <span className="flex items-center gap-2.5">
              {rating !== null && (
                <span className="mc-locx-rate">
                  <Star className="h-3 w-3" style={{ color: "var(--mc-accent)" }} fill="var(--mc-accent)" />
                  {rating.toFixed(1)}
                </span>
              )}
              <span className="mc-locx-mark">
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
