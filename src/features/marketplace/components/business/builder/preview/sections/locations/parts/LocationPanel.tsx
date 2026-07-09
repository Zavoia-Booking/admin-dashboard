import { useMemo } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import type { LocationWithAssignments } from "../../../../../../../types";
import type { ResolvedTagDictionaries } from "../../../../../../../hooks/useLocationTagDictionaries";
import { cn } from "../../../../../../../../../shared/lib/utils";
import { DISPLAY, MONO } from "../../../shared/constants";
import { hasOpeningHours, mapHref, prettyAddress, telHref } from "../../../shared/contact";
import { BookButton, CountUp } from "../../../shared/primitives";
import type { T } from "../../../shared/types";
import { ContactRow } from "./ContactRow";
import { StageHours } from "./StageHours";
import { LocationTags } from "./LocationTags";
import { buildLocationTagGroups } from "../util";

/** Left data card (under the picker): opening hours + rating/team stats + contact in a compact split that
 *  stacks when the card is narrow (its own `@container/panel`), then the collapsible tag band, then a
 *  full-width Book CTA footer. Keyed blocks re-key per location so their entrance animations replay. */
export function LocationPanel({ loc, dict, t }: { loc: LocationWithAssignments; dict: ResolvedTagDictionaries | null; t: T }) {
  const rating = (loc.totalReviews ?? 0) > 0 ? (loc.averageRating ?? 0) : null;
  const teamN = (loc.teamMembers ?? []).length;
  const hasStats = rating !== null || teamN > 1;
  const showHours = hasOpeningHours(loc);
  const mapLink = mapHref(loc);
  const hasContact = !!loc.phone || !!loc.email || !!mapLink;
  const tagGroups = useMemo(() => buildLocationTagGroups(loc, dict), [loc, dict]);

  return (
    <div className="@container/panel overflow-hidden rounded-xl border" style={{ borderColor: "var(--mc-line)", background: "var(--mc-card)" }}>
      <div key={`info-${loc.id}`} className="mc-locx-fade p-[clamp(18px,3cqw,30px)]" style={{ animationDelay: "100ms" }}>
        <div className={cn("grid gap-[clamp(18px,3cqw,36px)]", showHours && "@md/panel:[grid-template-columns:1fr_1fr]")}>
          {showHours && <StageHours loc={loc} t={t} />}
          <div
            className={cn(
              "mc-locx-rise flex min-w-0 flex-col gap-5",
              showHours &&
                "border-t pt-[clamp(18px,3cqw,36px)] @md/panel:border-t-0 @md/panel:pt-0 @md/panel:border-l @md/panel:pl-[clamp(18px,3cqw,36px)]",
            )}
            style={{ borderColor: "var(--mc-line)", animationDelay: "240ms" }}
          >
            {hasStats && (
              <div className="flex gap-[clamp(18px,3cqw,32px)]">
                {rating !== null && (
                  <div className="flex flex-col gap-1">
                    <span style={{ ...DISPLAY, fontSize: "clamp(26px,3.4cqw,38px)", lineHeight: 1 }}><CountUp value={rating} decimals={1} delayMs={220} /></span>
                    <span className="text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.06em", color: "var(--mc-muted)" }}>
                      {t("businessPage.builder.preview.reviewsCount", { count: loc.totalReviews ?? 0 })}
                    </span>
                  </div>
                )}
                {teamN > 1 && (
                  <div className="flex flex-col gap-1">
                    <span style={{ ...DISPLAY, fontSize: "clamp(26px,3.4cqw,38px)", lineHeight: 1 }}><CountUp value={teamN} delayMs={260} /></span>
                    <span className="text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.06em", color: "var(--mc-muted)" }}>
                      {t("businessPage.builder.preview.inTheTeam")}
                    </span>
                  </div>
                )}
              </div>
            )}
            {hasContact && (
              <div className={cn("flex flex-col gap-3", hasStats && "border-t pt-4")} style={{ borderColor: "var(--mc-line)" }}>
                {loc.phone && (
                  <ContactRow href={telHref(loc.phone)} icon={Phone} label={t("businessPage.builder.preview.callLabel", { name: loc.name })}>
                    {loc.phone}
                  </ContactRow>
                )}
                {loc.email && (
                  <ContactRow href={`mailto:${loc.email.trim()}`} icon={Mail} label={t("businessPage.builder.preview.emailLabel", { name: loc.name })}>
                    <span className="block truncate">{loc.email}</span>
                  </ContactRow>
                )}
                {mapLink && (
                  <ContactRow
                    href={mapLink}
                    icon={MapPin}
                    label={t("businessPage.builder.preview.mapLabel", { name: loc.name })}
                    external
                    alignTop
                  >
                    <span className="block leading-snug">{loc.address?.trim() || prettyAddress(loc)}</span>
                  </ContactRow>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {tagGroups.length > 0 && <LocationTags key={`amen-${loc.id}`} groups={tagGroups} />}

      {loc.allowOnlineBooking && (
        <div className="mc-locx-fade border-t p-[clamp(18px,3cqw,30px)]" style={{ borderColor: "var(--mc-line)", animationDelay: "320ms" }}>
          <BookButton
            label={t("businessPage.builder.preview.bookAt", { name: loc.name })}
            tone="accent"
            size="lg"
            styleOverride={{ width: "100%", justifyContent: "center" }}
          />
        </div>
      )}
    </div>
  );
}
