import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../../../shared/components/ui/tabs";
import type { WebsiteBuilderLocation } from "../../../../../../types";
import {
  DAY_KEYS,
  hasOpeningHours,
  locationArea,
  locationClock,
  locationPhoto,
  locationPostalAddress,
  type DayKey,
} from "../../../shared/contact";
import type { T } from "../../../shared/types";
import { LocationAmenities } from "../parts/LocationAmenities";
import { LocationBookAction } from "../parts/LocationBookAction";
import { StagePhoto } from "../parts/StagePhoto";
import type { LocationsVariantProps } from "../types";
import "./atlas.css";

function AtlasFade({ swapKey, children }: { swapKey: number; children: ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(false);
    const timer = window.setTimeout(() => setShown(true), 20);
    return () => window.clearTimeout(timer);
  }, [swapKey]);
  return (
    <div className="mc-loca-fade" data-shown={shown ? "1" : "0"}>
      {children}
    </div>
  );
}

function atlasHours(loc: WebsiteBuilderLocation, t: T) {
  const hours = (loc.workingHours ?? {}) as Partial<
    Record<DayKey, { open?: string; close?: string; isOpen?: boolean }>
  >;
  const closed = t("businessPage.builder.preview.contactClosed");
  const todayIndex = locationClock(loc).dayIndex;
  const dayValue = (day: DayKey) => {
    if (loc.open247) return t("businessPage.builder.preview.contactOpen247");
    const value = hours[day];
    return value?.isOpen && value.open && value.close ? `${value.open} – ${value.close}` : closed;
  };
  const rows: { start: number; end: number; value: string }[] = [];
  DAY_KEYS.forEach((day, i) => {
    const value = dayValue(day);
    const previous = rows[rows.length - 1];
    if (previous?.value === value) previous.end = i;
    else rows.push({ start: i, end: i, value });
  });
  return rows.map((row) => ({
    ...row,
    closed: row.value === closed,
    today: todayIndex >= row.start && todayIndex <= row.end,
    label:
      row.start === row.end
        ? t(`businessPage.builder.preview.daysFull.${DAY_KEYS[row.start]}`)
        : `${t(`businessPage.builder.preview.days.${DAY_KEYS[row.start]}`)}–${t(
            `businessPage.builder.preview.days.${DAY_KEYS[row.end]}`,
          )}`,
  }));
}

/** Atlas — accessible location tabs over a wide photo stage and the design-source visit/detail sheet. */
export function Atlas({ shown, idx, loc, onSelect, dict, t }: LocationsVariantProps) {
  const photo = locationPhoto(loc);
  const blurb = loc.description?.trim();
  const address = locationPostalAddress(loc) || t("businessPage.builder.preview.noAddress");
  const showHours = hasOpeningHours(loc, true);
  const hours = showHours ? atlasHours(loc, t) : [];
  const value = String(loc.id);

  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => {
        const next = shown.findIndex((location) => String(location.id) === nextValue);
        if (next >= 0) onSelect(next);
      }}
      className="mc-atlas"
    >
      <TabsList
        className="mc-cta-tabs"
        aria-label={t("businessPage.builder.preview.locationsTitle")}
      >
        {shown.map((location, i) => {
          const area = locationArea(location);
          return (
            <TabsTrigger
              key={location.id}
              value={String(location.id)}
              className="mc-cta-tab"
              data-on={i === idx ? "1" : "0"}
            >
              <span className="mc-cta-tab-nm">{location.name}</span>
              {area && <span className="mc-cta-tab-area">{area}</span>}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {shown.map((location) => (
        <TabsContent
          key={location.id}
          value={String(location.id)}
          forceMount
          className="mc-atlas-content"
        >
          {location.id === loc.id ? <div className="mc-loca">
          <div className="mc-loca-fig mc-mask-in" data-photo={photo ? "1" : "0"}>
            {photo ? (
              <StagePhoto src={photo} alt={loc.name} />
            ) : (
              <div className="mc-loca-fallback" aria-hidden />
            )}
            {photo && <div className="mc-loca-scrim" aria-hidden />}
            <div key={`cap-${loc.id}`} className="mc-loca-cap">
              <div className="mc-loca-cap-nm mc-loca-rise" style={{ animationDelay: "60ms" }}>
                {loc.name}
              </div>
              {blurb && (
                <p className="mc-loca-cap-blurb mc-loca-rise" style={{ animationDelay: "140ms" }}>
                  {blurb}
                </p>
              )}
            </div>
          </div>

          <div className="mc-loca-sheet mc-loca-sheet-in">
            <AtlasFade swapKey={loc.id}>
              <div>
                <div className="mc-contact-h">{t("businessPage.builder.preview.locVisit")}</div>
                <div className="mc-loca-rows">
                  <span className="mc-contact-row">{address}</span>
                </div>
              </div>

              {showHours && (
                <div>
                  <div className="mc-contact-h">{t("businessPage.builder.preview.contactHours")}</div>
                  {hours.map((row) => (
                    <div key={row.start} className="mc-hours-row" data-today={row.today ? "1" : "0"}>
                      <span>{row.label}</span>
                      <span style={{ opacity: row.closed ? 0.5 : 1 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <LocationAmenities key={`amen-${loc.id}`} loc={loc} dict={dict} t={t} />

              {loc.allowOnlineBooking && (
                <div className="mc-loca-book">
                  <LocationBookAction
                    label={t("businessPage.builder.preview.bookAt", { name: loc.name })}
                    className="mc-loca-book-action"
                  />
                </div>
              )}
            </AtlasFade>
          </div>
          </div> : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}
