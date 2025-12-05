import { type FC, useCallback } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../../shared/components/ui/badge";
import type { BundleFilterState } from "../../../bundles/types";
import { BundlePriceType } from "../../../bundles/types";

interface BundleBadgeListProps {
  filters: BundleFilterState;
  onFiltersChange: (filters: BundleFilterState) => void;
}

export const BundleBadgeList: FC<BundleBadgeListProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { t } = useTranslation("services");
  const {
    priceMin,
    priceMax,
    serviceCountMin,
    serviceCountMax,
    priceTypes = [],
  } = filters;

  // Treat empty string and "0" as "no filter"
  const hasPriceMin = priceMin !== "" && priceMin !== "0";
  const hasPriceMax = priceMax !== "" && priceMax !== "0";

  const canShowFilterBadges = useCallback((): boolean => {
    return !!(
      hasPriceMin ||
      hasPriceMax ||
      serviceCountMin ||
      serviceCountMax ||
      (Array.isArray(priceTypes) && priceTypes.length > 0)
    );
  }, [hasPriceMin, hasPriceMax, serviceCountMin, serviceCountMax, priceTypes]);

  const setFilter = useCallback(
    (filterKey: string, filterValue: string | number | boolean | null | BundlePriceType[]) => {
      const newFilters = {
        ...filters,
        [filterKey]: filterValue,
      };
      onFiltersChange(newFilters);
    },
    [onFiltersChange, filters]
  );

  const getPriceTypeLabel = (type: BundlePriceType): string => {
    switch (type) {
      case BundlePriceType.SUM:
        return t("bundles.filters.priceTypes.sum");
      case BundlePriceType.FIXED:
        return t("bundles.filters.priceTypes.fixed");
      case BundlePriceType.DISCOUNT:
        return t("bundles.filters.priceTypes.discount");
      default:
        return type;
    }
  };

  const getPriceTypeColor = (type: BundlePriceType): string => {
    switch (type) {
      case BundlePriceType.SUM:
        return "#dbeafe"; // Light blue
      case BundlePriceType.FIXED:
        return "#d1fae5"; // Light green
      case BundlePriceType.DISCOUNT:
        return "#fed7aa"; // Light amber/orange
      default:
        return "#f3f4f6";
    }
  };

  if (!canShowFilterBadges()) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {hasPriceMin && (
        <Badge
          variant="filter"
          className="flex items-center gap-1 cursor-pointer text-xs"
          onClick={() => setFilter("priceMin", "")}
        >
          {t("bundles.badges.priceMin")}: {priceMin}
          <X className="h-4 w-4 ml-1" />
        </Badge>
      )}
      {hasPriceMax && (
        <Badge
          variant="filter"
          className="flex items-center gap-1 cursor-pointer text-xs"
          onClick={() => setFilter("priceMax", "")}
        >
          {t("bundles.badges.priceMax")}: {priceMax}
          <X className="h-4 w-4 ml-1" />
        </Badge>
      )}
      {serviceCountMin && (
        <Badge
          variant="filter"
          className="flex items-center gap-1 cursor-pointer text-xs"
          onClick={() => setFilter("serviceCountMin", "")}
        >
          {t("bundles.badges.serviceCountMin")}: {serviceCountMin}
          <X className="h-4 w-4 ml-1" />
        </Badge>
      )}
      {serviceCountMax && (
        <Badge
          variant="filter"
          className="flex items-center gap-1 cursor-pointer text-xs"
          onClick={() => setFilter("serviceCountMax", "")}
        >
          {t("bundles.badges.serviceCountMax")}: {serviceCountMax}
          <X className="h-4 w-4 ml-1" />
        </Badge>
      )}
      {priceTypes.map((type) => (
        <Badge
          key={type}
          variant="filter"
          className="flex items-center gap-1 cursor-pointer text-xs text-neutral-900"
          style={{ backgroundColor: getPriceTypeColor(type) }}
          onClick={() => {
            const nextPriceTypes = priceTypes.filter((t) => t !== type);
            onFiltersChange({
              ...filters,
              priceTypes: nextPriceTypes,
            });
          }}
        >
          {getPriceTypeLabel(type)}
          <X className="h-4 w-4 ml-1" />
        </Badge>
      ))}
    </div>
  );
};

