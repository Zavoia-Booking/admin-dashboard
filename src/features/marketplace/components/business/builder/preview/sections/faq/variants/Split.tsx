import { Kicker, BookButton } from "../../../shared/primitives";
import { DISPLAY } from "../../../shared/constants";
import { FaqAccordion } from "../parts/FaqAccordion";
import type { FaqVariantProps } from "../types";

/** Split — an intro column (kicker + heading + a "can't find it?" contact card) beside a numbered accordion
 *  (mirrors the source `FaqSplit`). Owns its head (the orchestrator yields it to the pin). The pin is static
 *  in the preview — the source's `position:sticky` uses vh offsets that don't hold against the scaled preview
 *  scroll container (same call as Locations). Book CTA is decorative; the email is a real mailto. */
export function Split({ items, locale, email, t, head }: FaqVariantProps) {
  const mail = email?.trim();
  return (
    <div className="mc-fqs">
      <div>
        {head && (
          <div>
            <Kicker no={head.no}>{head.kicker}</Kicker>
            <h2 className="text-balance" style={{ ...DISPLAY, fontSize: "clamp(26px,6cqw,52px)", lineHeight: 0.98 }}>
              {head.heading}
            </h2>
          </div>
        )}
        <div className="mc-fqs-card">
          <span className="mc-fqs-card-h">{t("businessPage.builder.preview.faqCantFind")}</span>
          <p>{t("businessPage.builder.preview.faqCantFindBody")}</p>
          <div className="mc-fqs-card-row">
            <BookButton label={t("businessPage.builder.preview.faqBookVisit")} tone="accent" size="sm" />
            {mail && (
              <a className="mc-fqs-mail" href={`mailto:${mail}`}>
                {mail}
              </a>
            )}
          </div>
        </div>
      </div>
      <FaqAccordion items={items} locale={locale} numbered />
    </div>
  );
}
