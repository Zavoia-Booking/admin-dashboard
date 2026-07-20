import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { Stars } from "../../../shared/primitives";
import { formatReviewDate } from "../../../shared/util";
import type { PreviewReview, T } from "../../../shared/types";

export function RvSlide({
  item,
  animateIn,
  italic,
  t,
  starEmpty,
}: {
  item: PreviewReview;
  animateIn: boolean;
  italic: boolean;
  t: T;
  /** Empty-star colour override for the dark spotlight panel; defaults to the paper (light) empty. */
  starEmpty?: string;
}) {
  // Resting state is visible; only hide-then-rise when actually animating in, so a frozen first paint
  // never traps the words off-screen.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!animateIn) return;
    const id = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(id);
  }, [animateIn]);
  const shown = !animateIn || entered;
  const initial = (item.customerName || "?").trim().charAt(0).toUpperCase() || "?";
  const sub = [item.locationName, formatReviewDate(item.createdAt)].filter(Boolean).join(" · ");
  const words = item.comment.split(" ");
  return (
    <>
      <blockquote className="mc-rv-q" data-shown={shown ? "1" : "0"} style={{ fontStyle: italic ? "italic" : "normal" }}>
        {words.map((wd, i) => (
          <Fragment key={i}>
            <span className="mc-rv-w">
              <span style={{ "--i": i } as CSSProperties}>{wd}</span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </Fragment>
        ))}
      </blockquote>
      <figcaption className="mc-rv-meta" data-shown={shown ? "1" : "0"}>
        <span className="mc-rv-meta-mono" aria-hidden>
          {initial}
        </span>
        <span className="mc-rv-meta-tx">
          <span className="mc-rv-meta-nm">{item.customerName}</span>
          {sub && <span className="mc-rv-meta-sub">{sub}</span>}
        </span>
        <span className="mc-rv-meta-end">
          <Stars value={item.rating} size={14} empty={starEmpty} />
          <span className="mc-rv-vrow">
            <ShieldCheck className="h-[11px] w-[11px]" strokeWidth={2} /> {t("businessPage.builder.preview.reviewsVerified")}
          </span>
        </span>
      </figcaption>
    </>
  );
}
