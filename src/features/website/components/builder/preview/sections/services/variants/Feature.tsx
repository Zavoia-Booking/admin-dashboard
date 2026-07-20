import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { LocationImage } from "../../locations/parts/LocationImage";
import { locationPhoto } from "../../../shared/contact";
import { findScrollParent } from "../../../shared/util";
import { minPrice, money } from "../model";
import { ServiceRow } from "../parts/ServiceRow";
import type { ServicesVariantProps } from "../types";
import "./feature.css";

function ActiveCategory({ category }: { category: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), 20);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <span className="mc-services-feature-now" data-shown={shown ? "1" : "0"}>
      {category}
    </span>
  );
}

/** Included Feature layout — sticky campaign image + active-category scroll spy beside the full menu. */
export function Feature({
  location,
  groups,
  currency,
  locale,
  featureImageUrl,
  showDescriptions,
  showDurations,
  t,
}: ServicesVariantProps) {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const headings = Array.from(root.querySelectorAll<HTMLElement>(".mc-services-feature-category"));
    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!best || entry.boundingClientRect.top < best.boundingClientRect.top)) {
            best = entry;
          }
        });
        if (!best) return;
        const index = headings.indexOf((best as IntersectionObserverEntry).target as HTMLElement);
        if (index >= 0) setActive(index);
      },
      { root: findScrollParent(root), rootMargin: "-28% 0px -60% 0px", threshold: 0 },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [groups, location.id]);

  const allItems = groups.flatMap((group) => group.items);
  const from = money(minPrice(allItems), currency, locale);
  const safeActive = Math.max(0, Math.min(active, groups.length - 1));
  const activeCategory = groups[safeActive]?.name ?? groups[0]?.name ?? "";
  const photo = featureImageUrl ?? locationPhoto(location);

  return (
    <div className="mc-services-feature" key={location.id} ref={rootRef}>
      <aside className="mc-services-feature-visual">
        <div className="mc-services-feature-visual-inner">
          <LocationImage
            src={photo ?? ""}
            alt={location.name}
            fallbackLabel={location.name.toLocaleLowerCase()}
            className="mc-services-feature-photo"
          />
          <span className="mc-services-feature-scrim" aria-hidden="true" />
          <div className="mc-services-feature-overlay">
            <div className="mc-services-feature-overlay-bottom">
              <div className="mc-services-feature-price">
                <span className="mc-services-feature-from-caption">
                  {location.name} · {t("businessPage.builder.preview.servicesPricesFrom")}
                </span>
                <span className="mc-services-feature-from">
                  {from.value}<i>{from.symbol}</i>
                </span>
                <span className="mc-services-feature-book" aria-label={t("businessPage.builder.preview.servicesBook")}>
                  {t("businessPage.builder.preview.servicesBook")}
                  <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
                </span>
              </div>
              <ActiveCategory key={activeCategory} category={activeCategory} />
            </div>
          </div>
        </div>
      </aside>

      <div className="mc-services-feature-list">
        {groups.map((group, groupIndex) => (
          <section
            key={group.key}
            className="mc-services-feature-category"
            data-on={safeActive === groupIndex ? "1" : "0"}
          >
            <header className="mc-services-feature-category-head mc-mask-in">
              <span className="mc-services-feature-category-number">{String(groupIndex + 1).padStart(2, "0")}</span>
              <h3 className="mc-services-feature-category-title">{group.name}</h3>
              <span className="mc-services-feature-category-meta">
                {t("businessPage.builder.preview.servicesCount", { count: group.items.length })} · {t("businessPage.builder.preview.servicesFrom")} {money(minPrice(group.items), currency, locale).full}
              </span>
            </header>
            <div className="mc-services-feature-rows">
              {group.items.map((item, index) => (
                <div
                  key={item.key}
                  className="mc-locx-rowin"
                  style={{ animationDelay: `${Math.min(index, 6) * 36}ms` }}
                >
                  <ServiceRow
                    item={item}
                    currency={currency}
                    locale={locale}
                    showDescriptions={showDescriptions}
                    showDurations={showDurations}
                    t={t}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
