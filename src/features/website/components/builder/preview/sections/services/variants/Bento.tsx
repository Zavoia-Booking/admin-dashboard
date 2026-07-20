import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buildBentoPages, money, serviceDuration } from "../model";
import { findScrollParent, prefersReducedMotion } from "../../../shared/util";
import type { ServicesVariantProps } from "../types";
import "./bento.css";

type PageTransition = { dir: number; ghost: HTMLElement; timer: number | null };

/** Premium Bento layout — full-height price poster with paged categories and interruptible assembly motion. */
export function Bento({
  location,
  groups,
  currency,
  locale,
  showDescriptions,
  showDurations,
  t,
}: ServicesVariantProps) {
  const pages = useMemo(() => buildBentoPages(groups), [groups]);
  const pageCount = pages.length;
  const [page, setPage] = useState(0);
  const safePage = Math.max(0, Math.min(page, pageCount - 1));
  const current = pages[safePage];
  const gridRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const transitionRef = useRef<PageTransition | null>(null);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const grid = gridRef.current;
    if (!grid) return;
    const transition = transitionRef.current;
    if (prefersReducedMotion()) {
      if (transition) {
        if (transition.timer !== null) window.clearTimeout(transition.timer);
        transition.ghost.remove();
        transitionRef.current = null;
      }
      return;
    }
    const easing = "cubic-bezier(0.22,1,0.36,1)";
    const direction = transition?.dir ?? 1;
    grid.querySelectorAll<HTMLElement>(".mc-services-bento-tile").forEach((tile, index) => {
      const x = (index % 2 ? -direction : direction) * 56;
      const animation = tile.animate(
        [
          { opacity: 0, transform: `translate(${x}px, 0) scale(0.965)` },
          { opacity: 1, transform: "none" },
        ],
        { duration: 560, delay: Math.min(index, 9) * 46, easing, fill: "both" },
      );
      animation.onfinish = () => {
        try { animation.cancel(); } catch { /* A detached preview can finish after teardown. */ }
      };
    });
    if (transition) {
      transition.ghost.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: `translateX(${transition.dir * -44}px)` },
        ],
        { duration: 440, easing, fill: "both" },
      );
      transition.timer = window.setTimeout(() => {
        transition.ghost.remove();
        if (transitionRef.current === transition) transitionRef.current = null;
      }, 660);
    }
  }, [location.id, safePage]);

  useEffect(
    () => () => {
      const transition = transitionRef.current;
      if (!transition) return;
      if (transition.timer !== null) window.clearTimeout(transition.timer);
      transition.ghost.remove();
      transitionRef.current = null;
    },
    [],
  );

  const go = useCallback((direction: number) => {
    if (pageCount < 2) return;
    const target = ((safePage + direction) % pageCount + pageCount) % pageCount;
    const grid = gridRef.current;
    if (prefersReducedMotion() || !grid || !grid.parentElement) {
      setPage(target);
      return;
    }
    const previous = transitionRef.current;
    if (previous) {
      if (previous.timer !== null) window.clearTimeout(previous.timer);
      previous.ghost.remove();
      transitionRef.current = null;
    }
    const ghost = grid.cloneNode(true) as HTMLElement;
    ghost.classList.add("is-ghost");
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.left = `${grid.offsetLeft}px`;
    ghost.style.top = `${grid.offsetTop}px`;
    ghost.style.width = `${grid.offsetWidth}px`;
    ghost.style.height = `${grid.offsetHeight}px`;
    grid.parentElement.appendChild(ghost);
    transitionRef.current = { dir: direction, ghost, timer: null };
    setPage(target);
  }, [pageCount, safePage]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
      const grid = gridRef.current;
      if (!grid) return;
      const gridRect = grid.getBoundingClientRect();
      const scroller = findScrollParent(grid);
      const viewport = scroller?.getBoundingClientRect();
      const top = viewport?.top ?? 0;
      const bottom = viewport?.bottom ?? window.innerHeight;
      if (gridRect.bottom < top + 140 || gridRect.top > bottom - 140) return;
      go(event.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go]);

  if (!current) return null;
  const countLabel = t("businessPage.builder.preview.servicesCount", { count: current.categoryTotal });
  const details = current.categoryPages > 1
    ? `${countLabel} · ${t("businessPage.builder.preview.servicesPageOf", { page: current.categoryPage + 1, pages: current.categoryPages })}`
    : `${countLabel} · ${t("businessPage.builder.preview.servicesFrom")} ${money(current.categoryMin, currency, locale).full}`;

  return (
    <div className="mc-services-bento-reveal mc-mask-in">
      <div className="mc-services-bento-shell">
        <div className="mc-services-bento-bar">
          <div className="mc-services-bento-head">
            <span className="mc-services-bento-count">
              {String(safePage + 1).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}
            </span>
            <h3 className="mc-services-bento-category">{current.category}</h3>
            <span className="mc-services-bento-category-meta">{details}</span>
          </div>
          {pageCount > 1 ? (
            <div className="mc-services-bento-pager">
              <button
                type="button"
                className="mc-services-bento-button"
                aria-label={t("businessPage.builder.preview.aria.previousServicesPage")}
                onClick={() => go(-1)}
              >
                <ArrowRight size={15} strokeWidth={1.7} style={{ transform: "rotate(180deg)" }} aria-hidden="true" />
                {t("businessPage.builder.preview.servicesPrevious")}
              </button>
              <button
                type="button"
                className="mc-services-bento-button"
                aria-label={t("businessPage.builder.preview.aria.nextServicesPage")}
                onClick={() => go(1)}
              >
                {t("businessPage.builder.preview.servicesNext")}
                <ArrowRight size={15} strokeWidth={1.7} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="mc-services-bento-grid" ref={gridRef}>
          {current.items.map((item) => {
            const price = money(item.priceMinor, currency, locale);
            return (
              <button
                key={item.key}
                type="button"
                className="mc-services-bento-tile"
                data-hero="0"
                data-long-price={price.value.length >= 5 ? "1" : "0"}
                aria-label={t("businessPage.builder.preview.aria.bookService", { name: item.name })}
              >
                <span className="mc-services-bento-price-stack">
                  <span className="mc-services-bento-price">
                    {price.value}<i>{price.symbol}</i>
                  </span>
                  {showDurations && item.duration ? (
                    <span className="mc-services-bento-duration">{serviceDuration(item.duration)}</span>
                  ) : null}
                </span>
                <span className="mc-services-bento-rule" aria-hidden="true" />
                <span className="mc-services-bento-body">
                  <span className="mc-services-bento-name" title={item.name}>
                    <span className="mc-services-bento-name-text">{item.name}</span>
                  </span>
                  {showDescriptions && item.description ? (
                    <span className="mc-services-bento-description">{item.description}</span>
                  ) : null}
                </span>
                <span className="mc-services-bento-row-meta">
                  <span className="mc-services-bento-arrow" aria-hidden="true">
                    <ArrowRight size={18} strokeWidth={1.7} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
