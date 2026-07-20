import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowRight, Mail, Phone, Star } from "lucide-react";
import { DISPLAY } from "../../../shared/constants";
import { hasOpeningHours, locationArea, locationPhoto, locationPostalAddress, telHref } from "../../../shared/contact";
import { CountUp } from "../../../shared/primitives";
import { prefersReducedMotion } from "../../../shared/util";
import { LocationAmenities } from "../parts/LocationAmenities";
import { LocationBookAction } from "../parts/LocationBookAction";
import { StageHours } from "../parts/StageHours";
import { StagePhoto } from "../parts/StagePhoto";
import type { LocationsVariantProps } from "../types";
import "./showcase.css";

/** Selectable location index with the design's single sliding accent marker. */
function ShowcaseIndex({ shown, active, onSelect }: Pick<LocationsVariantProps, "shown" | "onSelect"> & { active: number }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ y: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const row = list.querySelectorAll<HTMLElement>(".mc-locx-row")[active];
      if (row) setIndicator({ y: row.offsetTop + 14, h: Math.max(0, row.offsetHeight - 28) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active, shown.length]);

  return (
    <div ref={listRef} className="mc-locx-list">
      {indicator && (
        <span
          className="mc-locx-ind"
          aria-hidden
          style={{ transform: `translateY(${indicator.y}px)`, height: indicator.h }}
        />
      )}
      {shown.map((location, i) => {
        const rawRating = Number(location.averageRating);
        const rating =
          (location.totalReviews ?? 0) > 0 && location.averageRating != null && Number.isFinite(rawRating)
            ? rawRating
            : null;
        const area = locationArea(location);
        return (
          <button
            key={location.id}
            type="button"
            className="mc-locx-row"
            data-on={i === active ? "1" : "0"}
            onClick={() => onSelect(i)}
            aria-pressed={i === active}
          >
            <span className="mc-locx-no">{String(i + 1).padStart(2, "0")}</span>
            <span className="mc-locx-main">
              <span className="mc-locx-nm">{location.name}</span>
              {area && <span className="mc-locx-area">{area}</span>}
            </span>
            <span className="mc-locx-rate">
              {rating !== null && Number.isFinite(rating) && (
                <>
                  <Star className="size-[13px]" fill="currentColor" strokeWidth={0} aria-hidden />
                  {rating.toFixed(1)}
                </>
              )}
            </span>
            <span className="mc-locx-mark" aria-hidden>
              <ArrowRight className="size-4" strokeWidth={1.8} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Showcase — selectable index + detail card alongside one full-height editorial photo stage. */
export function Showcase({
  shown,
  idx,
  loc,
  onSelect,
  dict,
  t,
  businessEmail,
  showTeamLink,
}: LocationsVariantProps) {
  const photo = locationPhoto(loc);
  const blurb = loc.description?.trim();
  const address = locationPostalAddress(loc) || t("businessPage.builder.preview.noAddress");
  const reviewCount = loc.totalReviews ?? 0;
  const rawRating = Number(loc.averageRating);
  const rating =
    reviewCount > 0 && loc.averageRating != null && Number.isFinite(rawRating) ? rawRating : null;
  const teamCount = (loc.teamMembers ?? []).length;
  const contactEmail = loc.email?.trim() || businessEmail.trim();
  const hasContact = !!loc.phone?.trim() || !!contactEmail;
  const showHours = hasOpeningHours(loc, true);

  const meetTeam = (event: MouseEvent<HTMLButtonElement>) => {
    const root = event.currentTarget.closest(".mc-root");
    const team = root?.querySelector<HTMLElement>('[data-preview-section="team"]');
    team?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="mc-showcase mc-locx">
      <div className="mc-locx-col">
        <ShowcaseIndex shown={shown} active={idx} onSelect={onSelect} />

        <div className="mc-locx-card mc-mask-in">
          <div
            key={`info-${loc.id}`}
            className="mc-locx-info mc-locx-fade"
            data-hours={showHours ? "1" : "0"}
            style={{ animationDelay: "100ms" }}
          >
            {showHours && <StageHours loc={loc} t={t} />}
            <div className="mc-locx-side mc-locx-rise" style={{ animationDelay: "240ms" }}>
              <div className="mc-locx-stats">
                {rating !== null && (
                  <div>
                    <span className="mc-locx-stat-n">
                      <CountUp value={rating} decimals={1} delayMs={220} />
                    </span>
                    <span className="mc-locx-stat-l">
                      {t("businessPage.builder.preview.reviewsCount", { count: reviewCount })}
                    </span>
                  </div>
                )}
                <div>
                  <span className="mc-locx-stat-n">
                    {teamCount > 0 ? <CountUp value={teamCount} delayMs={260} /> : "—"}
                  </span>
                  <span className="mc-locx-stat-l">{t("businessPage.builder.preview.inTheTeam")}</span>
                </div>
              </div>
              {hasContact && (
                <div className="mc-locx-contact">
                  {loc.phone?.trim() && (
                    <a
                      className="mc-locx-meta-link"
                      href={telHref(loc.phone)}
                      aria-label={t("businessPage.builder.preview.callLabel", { name: loc.name })}
                    >
                      <Phone className="size-[13px]" strokeWidth={1.8} aria-hidden />
                      <span>{loc.phone}</span>
                    </a>
                  )}
                  {contactEmail && (
                    <a
                      className="mc-locx-meta-link"
                      href={`mailto:${contactEmail}`}
                      aria-label={t("businessPage.builder.preview.emailLabel", { name: loc.name })}
                    >
                      <Mail className="size-[13px]" strokeWidth={1.8} aria-hidden />
                      <span>{contactEmail}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <LocationAmenities key={`amen-${loc.id}`} loc={loc} dict={dict} t={t} />

          {loc.allowOnlineBooking && (
            <div key={`acts-${loc.id}`} className="mc-locx-acts mc-locx-rise" style={{ animationDelay: "360ms" }}>
              <LocationBookAction
                label={t("businessPage.builder.preview.bookAt", { name: loc.name })}
                className="mc-locx-book"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mc-locx-stage mc-mask-in">
        <div className="mc-locx-fig" data-photo={photo ? "1" : "0"}>
          {photo ? (
            <StagePhoto src={photo} alt={loc.name} />
          ) : (
            <div className="mc-locx-fallback" aria-hidden />
          )}
          {photo && <div className="mc-locx-scrim" aria-hidden />}
          <div key={`cap-${loc.id}`} className="mc-locx-cap">
            <div className="mc-locx-cap-nm mc-locx-rise" style={{ ...DISPLAY, animationDelay: "60ms" }}>
              {loc.name}
            </div>
            {blurb && (
              <p className="mc-locx-cap-blurb mc-locx-rise" style={{ animationDelay: "140ms" }}>
                {blurb}
              </p>
            )}
            <div className="mc-locx-cap-addr mc-locx-rise" style={{ animationDelay: "220ms" }}>
              <span>{address}</span>
              {teamCount > 0 && showTeamLink && (
                <button type="button" className="mc-locx-meet" onClick={meetTeam}>
                  {t("businessPage.builder.preview.locMeetTeam")}
                  <ArrowRight className="size-[13px]" strokeWidth={1.8} aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
