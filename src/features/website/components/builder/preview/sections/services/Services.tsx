import { useEffect, useId, useMemo, useRef } from "react";
import type {
  ServicesConfig,
  WebsiteBuilderLocation,
  SectionEntry,
} from "../../../../../types";
import { useInView } from "../../shared/hooks";
import { Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { buildServiceGroups } from "./model";
import { LocationTabs } from "./parts/LocationTabs";
import type { ServicesVariantProps } from "./types";
import { resolveServicesFeatureImageSelection } from "../../../servicesFeatureImageSelection";
import { Feature } from "./variants/Feature";
import { Bento } from "./variants/Bento";
import { Cards } from "./variants/Cards";
import "./base.css";

const VARIANTS: Record<string, React.FC<ServicesVariantProps>> = {
  feature: Feature,
  bento: Bento,
  grid: Cards,
};

/** Services orchestrator — owns the real location catalog, shared location selection, canonical currency,
 *  heading and empty state. Feature is the Included fallback; variant files own the complete treatments. */
export function Services({
  entry,
  data,
  t,
  locations,
  selectedLocationId,
  onSelectLocation,
}: {
  entry: SectionEntry;
  data: PreviewData;
  t: T;
  locations: WebsiteBuilderLocation[];
  selectedLocationId: number | null;
  onSelectLocation: (locationId: number) => void;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const revealed = useInView(rootRef, { threshold: 0.08, once: true });
  const headingId = useId();
  const config = (entry.config ?? {}) as ServicesConfig;
  const showDescriptions = config.hideDescriptions !== true;
  const showDurations = config.hideDurations !== true;
  const hideBundles = config.hideBundles === true;
  const selectedIndex = locations.findIndex((location) => location.id === selectedLocationId);
  const location = locations[selectedIndex >= 0 ? selectedIndex : 0];
  const featureImageUrl = location
    ? resolveServicesFeatureImageSelection(config, location).image?.src ?? null
    : null;

  useEffect(() => {
    if (location && location.id !== selectedLocationId) onSelectLocation(location.id);
  }, [location, onSelectLocation, selectedLocationId]);

  const groups = useMemo(() => {
    if (!location) return [];
    const resolved = buildServiceGroups(
      location,
      t("businessPage.builder.preview.servicesCategoryFallback"),
      t("businessPage.builder.preview.servicesPackages"),
    );
    return hideBundles
      ? resolved.filter((group) => !group.items.every((item) => item.isBundle))
      : resolved;
  }, [hideBundles, location, t]);
  const variant = Object.hasOwn(VARIANTS, entry.variant) ? entry.variant : "feature";
  const View = VARIANTS[variant];
  const showHeading = config.headingHidden?.[data.locale] !== true;
  const showSublede = config.subledeHidden?.[data.locale] !== true;
  const hasLocationTabs = Boolean(location && locations.length > 1);
  const heading =
    config.heading?.[data.locale]?.trim() || t("businessPage.builder.preview.servicesHeading");
  const sublede =
    config.sublede?.[data.locale]?.trim() ||
    t(
      locations.length > 1
        ? "businessPage.builder.preview.servicesSubledeMultiple"
        : "businessPage.builder.preview.servicesSubledeSingle",
    );
  const headingWords = heading.split(/\s+/).filter(Boolean);

  return (
    <section
      id="services"
      ref={rootRef}
      className="mc-services"
      data-services={variant}
      data-revealed={revealed ? "1" : "0"}
      {...(showHeading
        ? { "aria-labelledby": headingId }
        : { "aria-label": t("businessPage.builder.preview.servicesHeading") })}
    >
      <div className="mc-services-wrap">
        {showHeading || showSublede || hasLocationTabs ? (
          <header className="mc-services-head">
            {showHeading || showSublede ? (
              <div>
                {showHeading ? (
                  <h2 id={headingId} className="mc-services-title" aria-label={heading}>
                    {headingWords.map((word, index) => (
                      <span
                        key={`${word}-${index}`}
                        className="mc-services-title-word"
                        aria-hidden="true"
                      >
                        <span style={{ transitionDelay: `${index * 40}ms` }}>{word}</span>
                        {index < headingWords.length - 1 ? "\u00a0" : null}
                      </span>
                    ))}
                  </h2>
                ) : null}
                {showSublede ? <p className="mc-services-sublede mc-mask-in">{sublede}</p> : null}
              </div>
            ) : null}
            {location ? (
              <LocationTabs
                locations={locations}
                selectedLocationId={location.id}
                onSelect={onSelectLocation}
                t={t}
              />
            ) : null}
          </header>
        ) : null}

        {!location || groups.length === 0 ? (
          <Placeholder>{t("businessPage.builder.preview.servicesEmpty")}</Placeholder>
        ) : (
          <View
            key={`${variant}-${location.id}`}
            location={location}
            groups={groups}
            currency={data.businessCurrency}
            locale={data.locale}
            featureImageUrl={featureImageUrl}
            showDescriptions={showDescriptions}
            showDurations={showDurations}
            t={t}
          />
        )}
      </div>
    </section>
  );
}
