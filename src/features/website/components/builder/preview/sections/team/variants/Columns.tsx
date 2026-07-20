import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import { DISPLAY } from "../../../shared/constants";
import type { TeamVariantProps } from "../types";
import "./columns.css";

/** Columns (paid) — one location's team as a row of doors: hover (or tap on touch) a column and it opens to
 *  reveal the member's name, role, rating, and a decorative "Book with …" CTA. A chip switcher flips the room
 *  when the business has more than one location. Mirrors the source `TeamColumns` + `TmSwitch`. Booking is
 *  inert in the preview, so the CTA is a styled affordance. */
export function Columns({ locationGroups, ratings, nameOf, initialsOf, tintOf, t }: TeamVariantProps) {
  const [locIdx, setLocIdx] = useState(0);
  // Clamp once and use everywhere (groups can shrink live in the builder) so the chip highlight never desyncs.
  const idx = Math.min(locIdx, Math.max(0, locationGroups.length - 1));
  const activeLoc = locationGroups[idx];
  const team = activeLoc?.members ?? [];

  const [open, setOpen] = useState(0);
  useEffect(() => setOpen(0), [activeLoc?.id]);
  const active = Math.min(open, Math.max(0, team.length - 1));

  // Hover-to-open is a desktop-only affordance: the builder renders tablet/phone as a narrow surface on a
  // hover-capable desktop, so we gate on the doors' own width (below), not the device. `canHover` still
  // rules out real touch devices on the published site.
  const canHover = useMemo(
    () => !(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(hover: none)").matches),
    [],
  );
  // Doors surface ≈ 1184px (desktop) vs ≈750px (tablet) / ≈350px (phone); wide → hover, narrow → tap only.
  const [wideSurface, setWideSurface] = useState(true);
  const roRef = useRef<ResizeObserver | null>(null);
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!node) return;
    const read = () => setWideSurface(node.clientWidth >= 1000);
    read();
    roRef.current = new ResizeObserver(read);
    roRef.current.observe(node);
  }, []);
  const hoverOpens = canHover && wideSurface;

  if (!activeLoc) return null;

  return (
    <>
      {locationGroups.length > 1 && (
        <div className="mc-tm-switch mc-locx-rowin">
          <span className="mc-tm-switch-l">{t("businessPage.builder.preview.teamSwitchLabel")}</span>
          {locationGroups.map((g, i) => (
            <button key={g.id} type="button" className="mc-tm-chip" data-on={i === idx ? "1" : "0"} onClick={() => setLocIdx(i)}>
              {g.name}
            </button>
          ))}
        </div>
      )}

      <div ref={measureRef} className="mc-tmc mc-mask-in" key={activeLoc.id}>
        {team.map(({ m }, i) => {
          const r = ratings?.[m.id];
          const first = nameOf(m).split(" ")[0];
          return (
            <div
              key={m.id}
              className="mc-tmc-col"
              style={{ background: tintOf(m) }}
              data-on={i === active ? "1" : "0"}
              role="button"
              tabIndex={0}
              aria-label={nameOf(m)}
              onMouseEnter={hoverOpens ? () => setOpen(i) : undefined}
              onClick={() => setOpen(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(i);
                }
              }}
            >
              {m.profileImage ? (
                <img src={m.profileImage} alt={nameOf(m)} loading="lazy" decoding="async" draggable={false} />
              ) : (
                <div
                  className="mc-tmc-fallback"
                  style={{ ...DISPLAY, background: tintOf(m), color: "var(--mc-ink)" } as CSSProperties}
                >
                  {initialsOf(m)}
                </div>
              )}
              <div className="mc-tmc-scrim" />
              <span className="mc-tmc-rail">{nameOf(m)}</span>
              <div className="mc-tmc-cap">
                <div className="mc-tmc-nm">{nameOf(m)}</div>
                {r && r.count > 0 && (
                  <div className="mc-tmc-meta">
                    <span>
                      <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} style={{ color: "var(--mc-accent)" }} /> {r.rating.toFixed(1)}
                    </span>
                    <span>{t("businessPage.builder.preview.reviewsCount", { count: r.count })}</span>
                  </div>
                )}
                <span className="mc-tmc-book" aria-hidden>
                  {t("businessPage.builder.preview.teamBookWith", { name: first })}
                  <ArrowRight className="h-3 w-3" strokeWidth={2} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
