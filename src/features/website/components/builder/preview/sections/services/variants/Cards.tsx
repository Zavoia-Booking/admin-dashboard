import { ArrowRight } from "lucide-react";
import { buildServiceCards, money, serviceDuration } from "../model";
import type { ServicesVariantProps } from "../types";
import "./cards.css";

/** Premium Cards layout (`grid` persisted key) — organically chunked category cards, never truncated. */
export function Cards({ groups, currency, locale, showDescriptions, showDurations, t }: ServicesVariantProps) {
  const cards = buildServiceCards(groups);
  return (
    <div className="mc-services-cards">
      {cards.map((card, index) => (
        <article
          key={card.key}
          className="mc-services-card mc-mask-in"
          style={{ animationDelay: `${Math.min(index, 5) * 60}ms` }}
        >
          <h3 className="mc-services-card-title">{card.category}</h3>
          <div className="mc-services-card-rows">
            {card.items.map((item) => (
              <button
                key={item.key}
                type="button"
                className="mc-services-card-item"
                aria-label={t("businessPage.builder.preview.aria.bookService", { name: item.name })}
              >
                <span className="mc-services-card-item-name" title={item.name}>
                  <span className="mc-services-card-item-name-text">{item.name}</span>
                </span>
                <span className="mc-service-dots" aria-hidden="true" />
                <span className="mc-services-card-meta">
                  <span className="mc-services-card-price">{money(item.priceMinor, currency, locale).full}</span>
                  {showDurations && item.duration ? (
                    <span className="mc-services-card-duration">{serviceDuration(item.duration)}</span>
                  ) : null}
                </span>
                {showDescriptions && item.description ? (
                  <span className="mc-services-card-item-description">{item.description}</span>
                ) : null}
              </button>
            ))}
          </div>
          <footer className="mc-services-card-footer">
            <span className="mc-services-card-from">
              {t("businessPage.builder.preview.servicesFrom")} <b>{money(card.categoryMin, currency, locale).full}</b>
            </span>
            <span className="mc-services-card-book" aria-label={t("businessPage.builder.preview.servicesBook")}>
              {t("businessPage.builder.preview.servicesBook")}
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </footer>
        </article>
      ))}
    </div>
  );
}
