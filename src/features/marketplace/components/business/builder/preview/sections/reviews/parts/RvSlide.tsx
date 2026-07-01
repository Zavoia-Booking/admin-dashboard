import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { Stars } from "../../../shared/primitives";
import type { PreviewReview, T } from "../../../shared/types";

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export function RvSlide({ item, animateIn, italic, t }: { item: PreviewReview; animateIn: boolean; italic: boolean; t: T }) {
  // Resting state is visible; only hide-then-rise when actually animating in, so a frozen first paint
  // never traps the words off-screen.
  const [shown, setShown] = useState(!animateIn);
  useEffect(() => {
    if (!animateIn) {
      setShown(true);
      return;
    }
    const id = setTimeout(() => setShown(true), 30);
    return () => clearTimeout(id);
  }, [animateIn]);
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
          <Stars value={item.rating} size={14} />
          <span className="mc-rv-vrow">
            <ShieldCheck className="h-[11px] w-[11px]" strokeWidth={2} /> {t("businessPage.builder.preview.reviewsVerified")}
          </span>
        </span>
      </figcaption>
    </>
  );
}
