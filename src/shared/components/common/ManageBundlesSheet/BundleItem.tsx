import { Check, PlusCircle, Tag, Percent, Layers2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";
import { highlightMatches } from "../../../utils/highlight";
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
  const CurrencyIcon = currencyDisplay.icon;

  // Get price type badge info
  const getPriceTypeBadge = () => {
    switch (bundle.priceType) {
      case "sum":
        return {
          label: t("page.locationBundles.priceType.sum"),
          icon: PlusCircle,
          color: "#dbeafe", // Light blue
        };
      case "fixed":
        return {
          label: t("page.locationBundles.priceType.fixed"),
          icon: Tag,
          color: "#d1fae5", // Light green
        };
      case "discount":
        return {
          label: t("page.locationBundles.priceType.discount"),
          icon: Percent,
          color: "#fed7aa", // Light amber/orange
        };
      default:
        return null;
    }
  };

  const priceTypeBadge = getPriceTypeBadge();
  const BadgeIcon = priceTypeBadge?.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent duration-150 cursor-pointer",
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
      aria-label={`${isSelected ? "Deselect" : "Select"} ${bundle.bundleName}`}
    >
      {/* Circle checkbox */}
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border flex-shrink-0",
          isSelected
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border-strong bg-surface",
        )}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </div>

      {/* Bundle info */}
      <div className="flex items-center flex-1 min-w-0 gap-3">
        {/* Bundle name */}
        <div
          className={cn(
            "text-sm truncate",
            isSelected
              ? "font-semibold text-foreground-1"
              : "font-medium text-foreground-1",
          )}
        >
          {highlightMatches(bundle.bundleName, searchTerm)}
        </div>

        {/* Price type badge */}
        {priceTypeBadge && (
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
                {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                <span className="text-neutral-900">
                  {t("page.locationBundles.priceType.discount")}
                </span>
              </>
            ) : (
              <>
                {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                <span className="text-neutral-900">{priceTypeBadge.label}</span>
              </>
            )}
          </Badge>
        )}

        {/* Service count */}
        <div className="flex items-center gap-1 text-xs text-foreground-3 dark:text-foreground-2 shrink-0">
          <Layers2 className="h-3.5 w-3.5" />
          <span>
            {bundle.serviceCount}{" "}
            {t(
              `page.locationBundles.serviceCount.${bundle.serviceCount === 1 ? "one" : "other"}`,
            )}
          </span>
        </div>

        {/* Price, aligned to the right */}
        <div className="flex items-center gap-0.5 ml-auto whitespace-nowrap shrink-0">
          {CurrencyIcon ? (
            <>
              <CurrencyIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium text-foreground-1">
                {bundle.displayPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-0.5">
              <span className="text-xs text-foreground-1">
                {currencyDisplay.symbol || ""}
              </span>
              <span className="text-xs font-medium text-foreground-1">
                {bundle.displayPrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
