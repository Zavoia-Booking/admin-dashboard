import { ArrowRight } from "lucide-react";
import { money, serviceDuration } from "../model";
import type { ServiceMenuItem } from "../types";
import type { T } from "../../../shared/types";

export function ServiceRow({
  item,
  currency,
  locale,
  showDescriptions,
  showDurations,
  t,
}: {
  item: ServiceMenuItem;
  currency: string;
  locale: "en" | "ro";
  showDescriptions: boolean;
  showDurations: boolean;
  t: T;
}) {
  const price = money(item.priceMinor, currency, locale);
  const description = item.isBundle && item.includes.length ? item.includes.join(" + ") : item.description;
  return (
    <button
      type="button"
      className="mc-service-row"
      aria-label={t("businessPage.builder.preview.aria.bookService", { name: item.name })}
    >
      <span className="mc-service-row-title" title={item.name}>
        <span className="mc-service-row-title-text">{item.name}</span>
      </span>
      <span className="mc-service-dots" aria-hidden="true" />
      <span className="mc-service-row-meta">
        <span className="mc-service-row-price">{price.full}</span>
        {showDurations && item.duration ? (
          <span className="mc-service-row-duration">{serviceDuration(item.duration)}</span>
        ) : null}
      </span>
      <span className="mc-service-row-arrow" aria-hidden="true">
        <ArrowRight size={15} strokeWidth={1.7} />
      </span>
      {showDescriptions && description ? (
        <span className="mc-service-row-description">{description}</span>
      ) : null}
    </button>
  );
}
