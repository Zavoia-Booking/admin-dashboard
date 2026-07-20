import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion } from "../../../shared/util";
import type { PreviewReview, T } from "../../../shared/types";
import { RvSlide } from "./RvSlide";

/** Reviewer name as two stacked char layers — on row hover the top glyphs roll up as their duplicates rise
 *  from below (source MCWord). The `a` layer carries the accessible text; the `b` layer is decorative. */
function HoverName({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => {
        const glyph = ch === " " ? " " : ch;
        return (
          <span key={i} className="mc-rv-ch" style={{ "--d": i } as CSSProperties}>
            <span className="mc-rv-ch-a">{glyph}</span>
            <span className="mc-rv-ch-b" aria-hidden>
              {glyph}
            </span>
          </span>
        );
      })}
    </>
  );
}

export function RvShowcase({ items, italic, t }: { items: PreviewReview[]; italic: boolean; t: T }) {
  const n = items.length;
  const reduced = prefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(reduced);
  const [ind, setInd] = useState<{ y: number; h: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLSpanElement>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((es) => es.forEach((e) => setInView(e.isIntersecting)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Slide the accent indicator to the active reviewer row.
  useLayoutEffect(() => {
    const row = listRef.current?.querySelectorAll(".mc-rv-li")[active] as HTMLElement | undefined;
    if (row) setInd({ y: row.offsetTop + 12, h: Math.max(8, row.offsetHeight - 24) });
  }, [active, n]);

  // Auto-advance + progress, driven by setInterval + performance.now so it survives the preview's idled
  // animation clock. Pause keeps elapsed; a manual pick resets it.
  useEffect(() => {
    const fill = progRef.current;
    const DUR = 5600;
    if (fill) fill.style.transform = `scaleX(${Math.min(1, elapsedRef.current / DUR)})`;
    if (reduced || n <= 1 || paused || !inView) return;
    const start = performance.now() - elapsedRef.current;
    const id = setInterval(() => {
      const e = performance.now() - start;
      elapsedRef.current = e;
      const p = Math.min(1, e / DUR);
      if (fill) fill.style.transform = `scaleX(${p})`;
      if (p >= 1) {
        clearInterval(id);
        elapsedRef.current = 0;
        setActive((a) => (a + 1) % n);
      }
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [active, paused, inView, n, reduced]);

  const select = (i: number) => {
    elapsedRef.current = 0;
    setActive(i);
  };
  const cur = items[active] ?? items[0];
  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <div className="mc-rv-show" ref={rootRef} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mc-rv-list" ref={listRef}>
        {ind && <span className="mc-rv-ind" aria-hidden style={{ transform: `translateY(${ind.y}px)`, height: ind.h }} />}
        {items.map((r, i) => (
          <button
            key={r.id}
            type="button"
            className="mc-rv-li"
            data-on={i === active ? "1" : "0"}
            aria-pressed={i === active}
            onClick={() => select(i)}
          >
            <span className="mc-rv-li-no">{num(i)}</span>
            <span className="mc-rv-li-nm">
              <HoverName text={r.customerName} />
            </span>
            {r.locationName && <span className="mc-rv-li-loc">{r.locationName}</span>}
          </button>
        ))}
      </div>
      <div className="mc-rv-stage">
        <span className="mc-rv-stage-no" aria-hidden>
          {num(active)}
        </span>
        <RvSlide key={active} item={cur} animateIn={inView && !reduced} italic={italic} t={t} />
        <span className="mc-rv-prog" aria-hidden>
          <span className="mc-rv-prog-fill" ref={progRef} />
        </span>
      </div>
    </div>
  );
}
