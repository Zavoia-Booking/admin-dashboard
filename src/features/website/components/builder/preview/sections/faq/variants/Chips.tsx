import { useEffect, useState } from "react";
import { localized } from "../../../shared/util";
import type { FaqVariantProps } from "../types";

/** Chips — question pills select into a single reading stage (mirrors the source `FaqChips`). A keyed fade
 *  replays the answer swap; a CSS-keyframe clock can idle in an embedded preview, so it rides a transition
 *  on a `data-shown` flag toggled a tick after the selection changes. */
export function Chips({ items, locale }: FaqVariantProps) {
  const [sel, setSel] = useState(0);
  // Live owner data: if the selected question is deleted, snap back into range (mirrors the accordion clamp).
  useEffect(() => {
    if (sel >= items.length) setSel(0);
  }, [items.length, sel]);
  const f = items[sel] ?? items[0];

  const [shown, setShown] = useState(true);
  useEffect(() => {
    setShown(false);
    const id = setTimeout(() => setShown(true), 20);
    return () => clearTimeout(id);
  }, [sel]);

  return (
    <>
      <div className="mc-fqc-chips">
        {items.map((q, i) => (
          <button
            key={i}
            type="button"
            className="mc-fqc-chip"
            data-on={sel === i ? "1" : "0"}
            aria-pressed={sel === i}
            onClick={() => setSel(i)}
          >
            <span className="mc-fqc-chip-no">{String(i + 1).padStart(2, "0")}</span>
            {localized(q.q, locale)}
          </button>
        ))}
      </div>
      <div className="mc-fqc-stage">
        <div className="mc-fq-fade" data-shown={shown ? "1" : "0"}>
          <div className="mc-fqc-q">{f && localized(f.q, locale)}</div>
          {f && localized(f.a, locale) && <p className="mc-fqc-a">{localized(f.a, locale)}</p>}
        </div>
      </div>
    </>
  );
}
