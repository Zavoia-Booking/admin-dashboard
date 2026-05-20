import { Star, MapPin, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../shared/lib/utils";
import { relativeTime } from "../util/relativeTime";
import { PersonAvatar } from "../../../shared/components/common/PersonAvatar";
import type { BusinessReview, TeamMemberReview } from "../types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-border fill-border",
          )}
        />
      ))}
    </div>
  );
}

function MidDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block text-foreground-3/45 select-none leading-none"
    >
      ·
    </span>
  );
}

/**
 * Base recipe for footer filter-shortcuts. Static when no onClick, button
 * when interactive. Active state mirrors the distribution-row treatment —
 * subtle terracotta tint that says "this filter is what's bringing me into
 * the visible set". Hover lifts the text + adds a soft neutral bg. Press
 * gets the standard scale feedback. -mx/-px lets the hover bg bleed past
 * the natural content edge without shifting layout.
 */
// Tap area is generous on mobile (≈36px tall) so the chip meets a
// reasonable thumb target, then collapses to a tight inline pill at sm+
// where mouse precision makes the bigger padding feel chunky.
const FOOTER_CHIP_BASE =
  "inline-flex items-center gap-1.5 min-w-0 px-1.5 py-2 -mx-1.5 rounded-md sm:py-0.5";
const FOOTER_CHIP_INTERACTIVE = cn(
  "cursor-pointer transition-[background-color,color,transform] duration-150 ease-out",
  "active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
);

function FooterLocation({
  id,
  name,
  isActive,
  onClick,
}: {
  id: number;
  name: string;
  isActive?: boolean;
  onClick?: (id: number) => void;
}) {
  const interactive = Boolean(onClick);
  const body = (
    <>
      <MapPin
        className={cn(
          "h-3 w-3 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-foreground-3",
        )}
        aria-hidden="true"
      />
      <span className="truncate max-w-[24ch] sm:max-w-[20ch]">{name}</span>
    </>
  );

  if (!interactive) {
    return (
      <span className={cn(FOOTER_CHIP_BASE, "text-foreground-2")}>{body}</span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      aria-pressed={isActive}
      className={cn(
        FOOTER_CHIP_BASE,
        FOOTER_CHIP_INTERACTIVE,
        isActive
          ? "bg-primary/[0.08] text-foreground-1"
          : "text-foreground-2 hover:bg-foreground-3/[0.06] hover:text-foreground-1",
      )}
    >
      {body}
    </button>
  );
}

function FooterBusinessWide({ label }: { label: string }) {
  return (
    <span
      className={cn(FOOTER_CHIP_BASE, "text-foreground-3")}
    >
      <Briefcase className="h-3 w-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

function FooterProfessional({
  id,
  firstName,
  lastName,
  profileImage,
  isActive,
  onClick,
}: {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  isActive?: boolean;
  onClick?: (id: number) => void;
}) {
  const interactive = Boolean(onClick);
  const body = (
    <>
      <PersonAvatar
        id={id}
        firstName={firstName}
        lastName={lastName}
        profileImage={profileImage}
        className="size-6"
        initialsClassName="text-[10px] font-semibold"
      />
      <span className="truncate font-medium max-w-[22ch] sm:max-w-[18ch]">
        {firstName} {lastName}
      </span>
    </>
  );

  if (!interactive) {
    return (
      <span className={cn(FOOTER_CHIP_BASE, "text-foreground-2")}>{body}</span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      aria-pressed={isActive}
      className={cn(
        FOOTER_CHIP_BASE,
        FOOTER_CHIP_INTERACTIVE,
        isActive
          ? "bg-primary/[0.08] text-foreground-1"
          : "text-foreground-2 hover:bg-foreground-3/[0.06] hover:text-foreground-1",
      )}
    >
      {body}
    </button>
  );
}

const ITEM_BASE = "flex gap-3.5 py-4 sm:py-5";
const AVATAR_BASE = "h-10 w-10 mt-0.5";
const HEADER_NAME = "text-[13.5px] font-semibold text-foreground-1 truncate";
const COMMENT_BASE =
  "mt-3 text-[15px] text-foreground-1 leading-[1.7] tracking-[-0.005em]";
const FOOTER_BASE =
  "mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs sm:text-[11.5px]";

function formatAbsoluteDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

interface BusinessReviewCardProps {
  review: BusinessReview;
  selectedLocationId?: number | null;
  onLocationClick?: (id: number) => void;
}

export function BusinessReviewCard({
  review,
  selectedLocationId,
  onLocationClick,
}: BusinessReviewCardProps) {
  const { t, i18n } = useTranslation("reviews");

  return (
    <li className={ITEM_BASE}>
      <PersonAvatar
        id={review.customer.id}
        firstName={review.customer.firstName}
        lastName={review.customer.lastName}
        profileImage={review.customer.profileImage}
        className={AVATAR_BASE}
        initialsClassName="text-sm font-medium"
      />

      <div className="flex-1 min-w-0">
        {/* Mobile: stars + date on row 1, customer name on row 2.
            Desktop (sm+): stars · name (left) + date (right) all on one row. */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-1 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
            <StarRating rating={review.rating} />
            {/* Desktop-only: dot + name inline with stars */}
            <div className="hidden sm:flex sm:items-center sm:gap-2.5 min-w-0">
              <MidDot />
              <p className={cn(HEADER_NAME, "truncate")}>
                {review.customer.firstName} {review.customer.lastName}
              </p>
            </div>
            {/* Mobile-only: date sits to the right of the stars */}
            <time
              dateTime={review.createdAt}
              title={formatAbsoluteDate(review.createdAt, i18n.language)}
              className="sm:hidden shrink-0 text-xs text-foreground-3 tabular-nums"
            >
              {relativeTime(review.createdAt, i18n.language)}
            </time>
          </div>

          {/* Mobile-only: customer name below the stars row */}
          <p className={cn(HEADER_NAME, "sm:hidden truncate")}>
            {review.customer.firstName} {review.customer.lastName}
          </p>

          {/* Desktop-only: date on the far right of the header row */}
          <time
            dateTime={review.createdAt}
            title={formatAbsoluteDate(review.createdAt, i18n.language)}
            className="hidden sm:block shrink-0 text-[11.5px] text-foreground-3 tabular-nums"
          >
            {relativeTime(review.createdAt, i18n.language)}
          </time>
        </header>

        {review.comment && <p className={COMMENT_BASE}>{review.comment}</p>}

        <footer className={FOOTER_BASE}>
          {review.location ? (
            <FooterLocation
              id={review.location.id}
              name={review.location.name}
              isActive={selectedLocationId === review.location.id}
              onClick={onLocationClick}
            />
          ) : (
            <FooterBusinessWide label={t("card.businessWide")} />
          )}
        </footer>
      </div>
    </li>
  );
}

interface TeamMemberReviewCardProps {
  review: TeamMemberReview;
  selectedLocationId?: number | null;
  selectedTeamMemberId?: number | null;
  onLocationClick?: (id: number) => void;
  onTeamMemberClick?: (id: number) => void;
}

export function TeamMemberReviewCard({
  review,
  selectedLocationId,
  selectedTeamMemberId,
  onLocationClick,
  onTeamMemberClick,
}: TeamMemberReviewCardProps) {
  const { t, i18n } = useTranslation("reviews");

  return (
    <li className={ITEM_BASE}>
      <PersonAvatar
        id={review.customer.id}
        firstName={review.customer.firstName}
        lastName={review.customer.lastName}
        profileImage={review.customer.profileImage}
        className={AVATAR_BASE}
        initialsClassName="text-sm font-medium"
      />

      <div className="flex-1 min-w-0">
        {/* Mobile: stars + date on row 1, customer name on row 2.
            Desktop (sm+): stars · name (left) + date (right) all on one row. */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-1 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
            <StarRating rating={review.rating} />
            <div className="hidden sm:flex sm:items-center sm:gap-2.5 min-w-0">
              <MidDot />
              <p className={cn(HEADER_NAME, "truncate")}>
                {review.customer.firstName} {review.customer.lastName}
              </p>
            </div>
            <time
              dateTime={review.createdAt}
              title={formatAbsoluteDate(review.createdAt, i18n.language)}
              className="sm:hidden shrink-0 text-xs text-foreground-3 tabular-nums"
            >
              {relativeTime(review.createdAt, i18n.language)}
            </time>
          </div>

          <p className={cn(HEADER_NAME, "sm:hidden truncate")}>
            {review.customer.firstName} {review.customer.lastName}
          </p>

          <time
            dateTime={review.createdAt}
            title={formatAbsoluteDate(review.createdAt, i18n.language)}
            className="hidden sm:block shrink-0 text-[11.5px] text-foreground-3 tabular-nums"
          >
            {relativeTime(review.createdAt, i18n.language)}
          </time>
        </header>

        {review.comment && <p className={COMMENT_BASE}>{review.comment}</p>}

        {/* Mobile: stack team member + location vertically so neither has to
            compete for row width — long names + long location strings no
            longer collide. Desktop (sm+): keep side-by-side with
            `justify-between` for compact density. */}
        <footer
          className={cn(
            "mt-3 flex flex-col gap-y-1.5",
            "sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-2",
            "text-[11.5px]",
          )}
        >
          <FooterProfessional
            id={review.professional.id}
            firstName={review.professional.firstName}
            lastName={review.professional.lastName}
            profileImage={review.professional.profileImage}
            isActive={selectedTeamMemberId === review.professional.id}
            onClick={onTeamMemberClick}
          />
          {review.location ? (
            <FooterLocation
              id={review.location.id}
              name={review.location.name}
              isActive={selectedLocationId === review.location.id}
              onClick={onLocationClick}
            />
          ) : (
            <FooterBusinessWide label={t("card.businessWide")} />
          )}
        </footer>
      </div>
    </li>
  );
}
