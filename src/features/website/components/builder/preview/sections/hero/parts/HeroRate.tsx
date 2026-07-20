import { Stars } from "../../../shared/primitives";
import type { T } from "../../../shared/types";

/** Shared hero rating lockup (design source: HeroRate) — a big display number beside the star row + review
 *  count. Paper tone by default; `onImg` flips it to the on-image white treatment. Styling lives in
 *  base.css (.mc-hx-rate*). */
export function HeroRate({
  rating,
  count,
  onImg,
  t,
}: {
  rating: number;
  count: number;
  onImg?: boolean;
  t: T;
}) {
  return (
    <span className={"mc-hx-rate" + (onImg ? " on-img" : "")}>
      <span className="mc-hx-rate-n">{rating.toFixed(1)}</span>
      <span className="mc-hx-rate-col">
        <Stars
          value={rating}
          size={12}
          color={onImg ? "#fff" : "var(--mc-accent)"}
          empty={onImg ? "rgba(255,255,255,0.34)" : "color-mix(in oklch, var(--mc-fg) 14%, transparent)"}
        />
        <span className="mc-hx-rate-cnt">{t("businessPage.builder.preview.reviewsCount", { count })}</span>
      </span>
    </span>
  );
}
