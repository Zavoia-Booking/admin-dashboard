import { ArrowRight } from "lucide-react";
import { localized } from "../../../shared/util";
import type { FaqVariantProps } from "../types";

/** Grid — every answer open in scannable two-column cards, closed by a "still curious?" contact row
 *  (mirrors the source `FaqGrid`). The Book CTA is decorative (the preview's booking flow is inert, like
 *  BookButton elsewhere); the "write to us" link is a real mailto. Cards enter with a staggered mask-in. */
export function Grid({ items, locale, email, t }: FaqVariantProps) {
  const mail = email?.trim();
  return (
    <>
      <div className="mc-fqg">
        {items.map((f, i) => (
          <div key={i} className="mc-fqg-card mc-mask-in" style={{ animationDelay: `${(i % 2) * 80}ms` }}>
            <span className="mc-fqg-no">{String(i + 1).padStart(2, "0")}</span>
            <div className="mc-fqg-q">{localized(f.q, locale)}</div>
            {localized(f.a, locale) && <p className="mc-fqg-a">{localized(f.a, locale)}</p>}
          </div>
        ))}
      </div>
      <div className="mc-fqg-foot">
        <span>{t("businessPage.builder.preview.faqStillCurious")}</span>
        <span className="mc-fqg-link">
          {t("businessPage.builder.preview.faqBookVisit")}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
        {mail && (
          <a className="mc-fqg-link" href={`mailto:${mail}`}>
            {t("businessPage.builder.preview.faqWriteUs")}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
          </a>
        )}
      </div>
    </>
  );
}
