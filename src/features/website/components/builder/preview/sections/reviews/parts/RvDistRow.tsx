import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { prefersReducedMotion } from "../../../shared/util";

/** One per-star distribution row — its bar grows from 0 to `pct` on mount (instant under reduced motion). */
export function RvDistRow({ stars, pct }: { stars: number; pct: number }) {
  const reduced = prefersReducedMotion();
  const [w, setW] = useState(reduced ? pct : 0);
  useEffect(() => {
    if (reduced) return;
    const id = setTimeout(() => setW(pct), 60);
    return () => clearTimeout(id);
  }, [pct, reduced]);
  const width = reduced ? pct : w;
  return (
    <div className="mc-rv-drow">
      <span className="mc-rv-dlabel">
        {stars}
        <Star className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
      </span>
      <span className="mc-rv-dtrack">
        <span className="mc-rv-dfill" style={{ transform: `scaleX(${pct > 0 ? Math.max(0.02, width) : 0})` }} />
      </span>
      <span className="mc-rv-dpct">{Math.round(pct * 100)}%</span>
    </div>
  );
}
