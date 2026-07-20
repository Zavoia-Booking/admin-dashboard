import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { Stars } from "../../../shared/primitives";
import { formatReviewDate } from "../../../shared/util";
import { pullQuote } from "./pull";
import type { PreviewReview, T } from "../../../shared/types";

/** One deck card face — identity row (monogram + name/place + brand mark) over a hairline, then the pulled
 *  headline (left) beside the full quote (right). Entrance mirrors the section's voice: the headline rises
 *  word by word (masked), the full quote fades up just behind it. Mirrors the source `RvStackFace`. */
export function RvStackFace({
  item,
  brand,
  animateIn,
  italic,
  t,
}: {
  item: PreviewReview;
  brand: string;
  animateIn: boolean;
  italic: boolean;
  t: T;
}) {
  // Resting state is visible; only hide-then-rise when actually animating in (this card is the live one), so
  // a frozen first paint never traps the words off-screen. Matches RvSlide's entrance.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!animateIn) return;
    const id = setTimeout(() => setEntered(true), 40);
    return () => clearTimeout(id);
  }, [animateIn]);
  const shown = !animateIn || entered;
  const initial = (item.customerName || "?").trim().charAt(0).toUpperCase() || "?";
  const sub = [item.locationName, formatReviewDate(item.createdAt)].filter(Boolean).join(" · ");
  const words = pullQuote(item.comment).split(" ");
  return (
    <div className="mc-rvx-face">
      <div className="mc-rvx-top">
        <span className="mc-rvx-av" aria-hidden>
          {initial}
        </span>
        <span className="mc-rvx-id">
          <span className="mc-rvx-nm">{item.customerName}</span>
          {sub && <span className="mc-rvx-sub">{sub}</span>}
        </span>
        <span className="mc-rvx-brand" aria-hidden>
          {brand}
          <i />
        </span>
      </div>
      <div className="mc-rvx-cols">
        <blockquote className="mc-rvx-pull" data-shown={shown ? "1" : "0"} style={{ fontStyle: italic ? "italic" : "normal" }}>
          {words.map((wd, i) => (
            <Fragment key={i}>
              <span className="mc-rv-w">
                <span style={{ "--i": i } as CSSProperties}>{wd}</span>
              </span>
              {i < words.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </blockquote>
        <div className="mc-rvx-rt" data-shown={shown ? "1" : "0"}>
          <p className="mc-rvx-text">“{item.comment}”</p>
          <span className="mc-rvx-vf">
            <Stars value={item.rating} size={13} empty="color-mix(in oklch, var(--mc-bg) 22%, transparent)" />
            <span className="mc-rvx-vfx">
              <ShieldCheck className="h-[11px] w-[11px]" strokeWidth={2} /> {t("businessPage.builder.preview.reviewsVerified")}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
