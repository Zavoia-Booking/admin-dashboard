import { Fragment, useId, useRef } from "react";
import type { FaqConfig, SectionEntry } from "../../../../../types";
import { localized } from "../../shared/util";
import { Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { useFaqMotion } from "./motion";
import { Accordion } from "./variants/Accordion";
import { Grid } from "./variants/Grid";
import { Index } from "./variants/Index";
import type { FaqVariantProps } from "./types";
import "./base.css";

// Exact design-source registry. Grid is first/included and is also the safe local fallback.
const VARIANTS: Record<string, React.FC<FaqVariantProps>> = {
  grid: Grid,
  accordion: Accordion,
  index: Index,
};

export function Faq({ entry, data, t }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const items = data.faq.filter((f) => localized(f.q, data.locale).trim());
  const config = (entry.config ?? {}) as FaqConfig;
  const heading = config.heading?.[data.locale]?.trim() || t("businessPage.builder.preview.subhead.faq");
  const headingWords = heading.split(/\s+/).filter(Boolean);
  const headingId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const variant = Object.hasOwn(VARIANTS, entry.variant) ? entry.variant : "grid";
  const View = VARIANTS[variant];
  const showHeading = variant !== "index" && config.headingHidden?.[data.locale] !== true;
  const indexLabel = t("businessPage.builder.preview.faqFrequentlyAsked");
  useFaqMotion(rootRef, titleRef, `${variant}:${data.locale}:${showHeading}:${heading}:${items.length}`);

  return (
    <section
      ref={rootRef}
      className="mc-faq-section"
      data-faq={variant}
      aria-labelledby={showHeading ? headingId : undefined}
      aria-label={showHeading ? undefined : indexLabel}
    >
      <div className="mc-faq-wrap">
        {showHeading && (
          <header className="mc-faq-head">
            {/* The design source's SecKicker is an intentional no-op. */}
            <h2 ref={titleRef} id={headingId} className="mc-faq-title" aria-label={heading}>
              {headingWords.map((word, index) => (
                <Fragment key={`${word}-${index}`}>
                  <span className="mc-faq-title-word" aria-hidden="true">
                    <span data-faq-word>{word}</span>
                  </span>
                  {index < headingWords.length - 1 ? " " : null}
                </Fragment>
              ))}
            </h2>
          </header>
        )}

        {items.length === 0 ? (
          <Placeholder>{t("businessPage.builder.preview.faqEmpty")}</Placeholder>
        ) : (
          <View items={items} locale={data.locale} email={data.email} t={t} />
        )}
      </div>
    </section>
  );
}
