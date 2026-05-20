import { Check, PlusCircle, Tag, Percent, Layers2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";
import { highlightMatches } from "../../../utils/highlight";
import { PriceDisplay } from "../PriceDisplay";
import { Badge } from "../../ui/badge";
import type { Bundle, CurrencyDisplay } from "./types";

interface BundleItemProps {
  bundle: Bundle;
  isSelected: boolean;
  searchTerm: string;
  currencyDisplay: CurrencyDisplay;
  onToggle: (id: number) => void;
}

export function BundleItem({
  bundle,
  isSelected,
  searchTerm,
  currencyDisplay,
  onToggle,
}: BundleItemProps) {
  const { t } = useTranslation("assignments");

  // Get price type badge info
  const getPriceTypeBadge = () => {
    switch (bundle.priceType) {
      case "sum":
        return {
          label: t("page.locationBundles.priceType.sum"),
          icon: PlusCircle,
          color: "var(--color-info-100)",
        };
      case "fixed":
        return {
          label: t("page.locationBundles.priceType.fixed"),
          icon: Tag,
          color: "var(--color-success-100)",
        };
      case "discount":
        return {
          label: t("page.locationBundles.priceType.discount"),
          icon: Percent,
          color: "var(--color-primary-100)",
        };
      default:
        return null;
    }
  };

  const priceTypeBadge = getPriceTypeBadge();
  const BadgeIcon = priceTypeBadge?.icon;

  // Pulled out so the mobile (stacked) + desktop (inline) JSX trees stay
  // tight without duplicating internals. React happily renders both
  // branches; only one is visible per viewport thanks to `sm:hidden` /
  // `hidden sm:flex` wrappers.
  const nameNode = (
    <div
      className={cn(
        "text-sm truncate min-w-0",
        isSelected
          ? "font-semibold text-foreground-1"
          : "font-medium text-foreground-1",
      )}
    >
      {highlightMatches(bundle.bundleName, searchTerm)}
    </div>
  );

  const badgeNode = priceTypeBadge && (
    <Badge
      variant="secondary"
      className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0"
      style={{ backgroundColor: priceTypeBadge.color }}
    >
      {bundle.priceType === "discount" && bundle.discountPercentage ? (
        <>
          <span className="text-neutral-900">
            {bundle.discountPercentage}
          </span>
          {BadgeIcon && <BadgeIcon className="h-3 w-3 text-neutral-900" />}
          <span className="text-neutral-900">
            {t("page.locationBundles.priceType.discount")}
          </span>
        </>
      ) : (
        <>
          {BadgeIcon && <BadgeIcon className="h-3 w-3 text-neutral-900" />}
          <span className="text-neutral-900">{priceTypeBadge.label}</span>
        </>
      )}
    </Badge>
  );

  const serviceCountNode = (
    <div className="flex items-center gap-1 text-xs text-foreground-3 dark:text-foreground-2 shrink-0">
      <Layers2 className="h-3.5 w-3.5" />
      <span>
        {bundle.serviceCount}{" "}
        {t(
          `page.locationBundles.serviceCount.${bundle.serviceCount === 1 ? "one" : "other"}`,
        )}
      </span>
    </div>
  );

  const priceNode = (
    <PriceDisplay
      amountDecimal={bundle.displayPrice}
      currency={currencyDisplay.currency}
      className="whitespace-nowrap shrink-0 gap-1"
      iconClassName="h-3.5 w-3.5"
      numberClassName="text-xs font-medium text-foreground-1"
    />
  );

  return (
    <div
      className={cn(
        "flex items-start sm:items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent duration-150 cursor-pointer",
        "md:hover:bg-info-100 dark:md:hover:bg-surface-hover",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
      )}
      onClick={() => onToggle(bundle.bundleId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(bundle.bundleId);
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={t(isSelected ? "common:selection.deselect" : "common:selection.select", { name: bundle.bundleName })}
    >
      {/* Circle checkbox — top-aligned with the name row on mobile (mt-0.5
          eyeballs the optical baseline against the 14px text). */}
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border flex-shrink-0 mt-0.5 sm:mt-0",
          isSelected
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border-strong bg-surface",
        )}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </div>

      {/* Bundle info wrapper.
          Mobile (<sm): two-row stack — name on row 1 (full width, room to
          actually read), meta (badge + service count + price) on row 2 with
          price pushed right via `ml-auto`.
          Desktop (sm+): single dense row — name shrinks via truncate, badge
          and service count sit inline, price floats to the far right via
          `ml-auto`. Matches the original desktop density. */}
      <div className="flex-1 min-w-0">
        {/* Mobile layout — stacked */}
        <div className="sm:hidden flex flex-col gap-1.5">
          {nameNode}
          <div className="flex items-center gap-2 flex-wrap">
            {badgeNode}
            {serviceCountNode}
            <div className="ml-auto">{priceNode}</div>
          </div>
        </div>

        {/* Desktop layout — inline row */}
        <div className="hidden sm:flex items-center gap-3 min-w-0">
          {nameNode}
          {badgeNode}
          {serviceCountNode}
          <div className="ml-auto">{priceNode}</div>
        </div>
      </div>
    </div>
  );
}
