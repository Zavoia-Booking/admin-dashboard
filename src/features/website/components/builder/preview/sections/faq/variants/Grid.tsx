import { localized } from "../../../shared/util";
import type { FaqVariantProps } from "../types";
import "./grid.css";

/** Included treatment: every answer stays open in the source's scannable two-column card grid. */
export function Grid({ items, locale }: FaqVariantProps) {
  return (
    <div className="mc-fqg">
      {items.map((item, index) => {
        const answer = localized(item.a, locale);
        return (
          <article
            key={index}
            className="mc-fqg-card"
            data-faq-reveal
          >
            <span className="mc-fqg-no">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="mc-fqg-q">{localized(item.q, locale)}</h3>
            {answer && <p className="mc-fqg-a">{answer}</p>}
          </article>
        );
      })}
    </div>
  );
}
