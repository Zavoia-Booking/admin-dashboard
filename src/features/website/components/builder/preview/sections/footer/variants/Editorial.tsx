import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { FooterBookAction } from "../parts/FooterBookAction";
import { FootDetail } from "../parts/FootDetail";
import { FooterLegal } from "../parts/FooterLegal";
import { FootSocials } from "../parts/FootSocials";
import { useFitMark } from "../parts/useFitMark";
import type { FooterViewProps } from "../types";

import "./editorial.css";

type Indicator = { y: number; h: number };

/** Editorial: the design source's cinematic closing footer. Location browsing is deliberately local to the
 * footer so changing the detail panel never reflows the page above it; booking remains decorative in preview. */
export function Editorial({ data, t, footerRef, selectedLocationId: globalLocationId }: FooterViewProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const locations = data.locations;
  const multi = locations.length > 1;
  const twoColumnLocations = locations.length > 4;

  const globalLocation = locations.find((location) => location.id === globalLocationId) ?? locations[0] ?? null;
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(() => globalLocation?.id ?? null);
  const storedIndex = locations.findIndex((location) => location.id === selectedLocationId);
  const selectedIndex = storedIndex >= 0 ? storedIndex : 0;
  const selectedLocation = locations[selectedIndex] ?? null;

  const locationsRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<Indicator | null>(null);

  useEffect(() => {
    setSelectedLocationId(globalLocation?.id ?? null);
  }, [globalLocation?.id]);

  useLayoutEffect(() => {
    const list = locationsRef.current;
    if (!list || twoColumnLocations) {
      setIndicator(null);
      return;
    }

    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const row = list.querySelectorAll<HTMLElement>(".mc-foot-loc")[selectedIndex];
      setIndicator(row ? { y: row.offsetTop + 7, h: Math.max(0, row.offsetHeight - 14) } : null);
    };

    measure();
    const frame = window.requestAnimationFrame(measure);
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resizeObserver?.observe(list);
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      resizeObserver?.disconnect();
    };
  }, [name, locations.length, selectedIndex, twoColumnLocations]);

  useFitMark(nameRef, name, { base: 120, max: 360, min: 30, wrapMax: 190, wrapBelow: 48 });

  const website = data.social.website?.trim();
  const websiteHref = website ? (/^https?:\/\//i.test(website) ? website : `https://${website}`) : null;
  const websiteText = website?.replace(/^https?:\/\//i, "").replace(/\/$/, "") ?? null;
  const headline = multi || !globalLocation
    ? t("businessPage.builder.preview.footerComeFind")
    : t("businessPage.builder.preview.contactHeadingLoc", { name: globalLocation.name });
  const bookingLabel = selectedLocation
    ? t("businessPage.builder.preview.bookAt", { name: selectedLocation.name })
    : t("businessPage.builder.preview.footerBookVisit");

  return (
    <footer
      ref={footerRef}
      data-preview-section="footer"
      className="mc-footer mc-footer--editorial"
    >
      <div className="mc-foot-pad">
        <div className="mc-foot-top">
          <div className="mc-foot-headline">{headline}</div>
          <FooterBookAction label={bookingLabel} />
        </div>

        <div className={`mc-foot-cols${twoColumnLocations ? " mc-foot-cols--wide-locs" : ""}`}>
          <div className="mc-foot-col mc-foot-brand">
            {data.tagline?.trim() && <p className="mc-foot-tag mc-foot-tag--lead">{data.tagline}</p>}
            <FootSocials social={data.social} />
          </div>

          {locations.length > 0 && (
            <div className="mc-foot-col mc-foot-locations">
              <div className="mc-foot-label">
                {multi ? t("businessPage.builder.preview.kicker.locations") : t("businessPage.builder.preview.footerWhere")}
              </div>
              <div
                ref={locationsRef}
                className={`mc-foot-locs${twoColumnLocations ? " mc-foot-locs--2col" : ""}`}
              >
                {!twoColumnLocations && indicator && (
                  <span
                    className="mc-foot-loc-ind"
                    aria-hidden
                    style={{ transform: `translateY(${indicator.y}px)`, height: indicator.h }}
                  />
                )}
                {locations.map((location, index) => (
                  <button
                    key={location.id}
                    type="button"
                    className="mc-foot-loc"
                    data-on={index === selectedIndex ? "1" : "0"}
                    aria-pressed={index === selectedIndex}
                    onClick={() => setSelectedLocationId(location.id)}
                  >
                    <span className="mc-foot-loc-no">{String(index + 1).padStart(2, "0")}</span>
                    <span className="mc-foot-loc-name">{location.name}</span>
                    <span className="mc-foot-loc-mark" aria-hidden>
                      <ArrowRight size={14} strokeWidth={1.8} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedLocation && <FootDetail key={selectedLocation.id} loc={selectedLocation} t={t} />}

          {(data.email?.trim() || websiteHref) && (
            <div className="mc-foot-col mc-foot-contact">
              <div className="mc-foot-label">{t("businessPage.builder.preview.contactReach")}</div>
              {data.email?.trim() && (
                <a className="mc-foot-row mc-foot-link" href={`mailto:${data.email.trim()}`}>
                  {data.email}
                </a>
              )}
              {websiteHref && websiteText && (
                <a className="mc-foot-row mc-foot-link" href={websiteHref} target="_blank" rel="noopener noreferrer">
                  {websiteText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mc-foot-pad mc-foot-bottom">
        <div ref={nameRef} className="mc-foot-name" aria-hidden>
          {name}
        </div>
        <div className="mc-foot-base">
          <FooterLegal data={data} t={t} />
        </div>
      </div>
    </footer>
  );
}
