"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Package, Plus, Edit, Layers2, Calculator, Percent, DollarSign, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BundleFilters } from "./BundleFilters";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import AddBundleSlider from "./AddBundleSlider";
import EditBundleSlider from "./EditBundleSlider";
import { listBundlesAction } from "../../../bundles/actions";
import {
  getBundlesListSelector,
  getBundlesLoadingSelector,
} from "../../../bundles/selectors";
import { ItemCard } from "../../../../shared/components/common/ItemCard";
import type { ItemCardBadge } from "../../../../shared/components/common/ItemCard";
import { highlightMatches as highlight } from "../../../../shared/utils/highlight";
import { priceFromStorage } from "../../../../shared/utils/currency";
import { selectCurrentUser } from "../../../auth/selectors";
import type { Bundle } from "../../../bundles/types";
import { type BundleFilterState, getDefaultBundleFilters } from "../../../bundles/types";

interface BundlesTabProps {
  isActive?: boolean;
}

export function BundlesTab({ isActive = true }: BundlesTabProps) {
  const { t } = useTranslation("services");
  const dispatch = useDispatch();
  const bundles = useSelector(getBundlesListSelector);
  const isLoading = useSelector(getBundlesLoadingSelector);
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";
  
  const [filters, setFilters] = useState<BundleFilterState>(getDefaultBundleFilters());
  const [isAddBundleSliderOpen, setIsAddBundleSliderOpen] = useState(false);
  const [isEditBundleSliderOpen, setIsEditBundleSliderOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  // Fetch bundles when tab becomes active
  useEffect(() => {
    if (isActive) {
      dispatch(listBundlesAction.request());
    }
  }, [isActive, dispatch]);

  // Filter and sort bundles
  const filteredBundles = useMemo(() => {
    let result = [...bundles];

    // Search filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter((bundle) => {
        const nameMatch = bundle.name?.toLowerCase().includes(searchLower);
        const descriptionMatch = bundle.description?.toLowerCase().includes(searchLower);
        return nameMatch || descriptionMatch;
      });
    }

    // Price filter
    const priceMin = parseFloat(filters.priceMin);
    const priceMax = parseFloat(filters.priceMax);
    if (!isNaN(priceMin) && priceMin > 0) {
      result = result.filter((bundle) => {
        const priceInCurrency = priceFromStorage(bundle.calculatedPriceAmountMinor, businessCurrency);
        return priceInCurrency >= priceMin;
      });
    }
    if (!isNaN(priceMax) && priceMax > 0) {
      result = result.filter((bundle) => {
        const priceInCurrency = priceFromStorage(bundle.calculatedPriceAmountMinor, businessCurrency);
        return priceInCurrency <= priceMax;
      });
    }

    // Service count filter
    const serviceCountMin = parseInt(filters.serviceCountMin);
    const serviceCountMax = parseInt(filters.serviceCountMax);
    if (!isNaN(serviceCountMin) && serviceCountMin > 0) {
      result = result.filter((bundle) => bundle.services.length >= serviceCountMin);
    }
    if (!isNaN(serviceCountMax) && serviceCountMax > 0) {
      result = result.filter((bundle) => bundle.services.length <= serviceCountMax);
    }

    // Price type filter
    if (filters.priceTypes.length > 0) {
      result = result.filter((bundle) => filters.priceTypes.includes(bundle.priceType));
    }

    // Sorting
    result.sort((a, b) => {
      const { sortField, sortDirection } = filters;
      const multiplier = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "price":
          return (a.calculatedPriceAmountMinor - b.calculatedPriceAmountMinor) * multiplier;
        case "serviceCount":
          return (a.services.length - b.services.length) * multiplier;
        case "createdAt":
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * multiplier;
        case "updatedAt":
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * multiplier;
        default:
          return 0;
      }
    });

    return result;
  }, [bundles, filters, businessCurrency]);

  const handleAddBundle = () => {
    setIsAddBundleSliderOpen(true);
  };

  const handleCloseAddSlider = () => {
    setIsAddBundleSliderOpen(false);
    // Refresh bundles after creating
    dispatch(listBundlesAction.request());
  };

  const handleEditBundle = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setIsEditBundleSliderOpen(true);
  };

  const handleCloseEditSlider = () => {
    setIsEditBundleSliderOpen(false);
    setSelectedBundle(null);
    // Refresh bundles after editing
    dispatch(listBundlesAction.request());
  };

  // Format duration helper (same as services)
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  // Calculate total duration from all services in bundle
  const getTotalDuration = (bundle: Bundle): number => {
    return bundle.services.reduce((total, service) => total + (service.duration || 0), 0);
  };

  // Format price based on price type
  const formatBundlePrice = (bundle: Bundle): string => {
    const priceInCents = bundle.calculatedPriceAmountMinor;
    const price = priceFromStorage(priceInCents, businessCurrency);
    return price.toFixed(2);
  };

  // Get price type category (for badge display)
  const getPriceTypeCategory = (bundle: Bundle) => {
    switch (bundle.priceType) {
      case "sum":
        return {
          name: t("bundles.priceTypeCategory.sum"),
          color: "#dbeafe", // Light blue (blue-100) - works with black text
          icon: Calculator,
        };
      case "fixed":
        return {
          name: t("bundles.priceTypeCategory.fixed"),
          color: "#d1fae5", // Light green (green-100) - works with black text
          icon: DollarSign,
        };
      case "discount":
        return {
          name: (
            <span className="flex items-center gap-0.5">
              <Percent className="h-3 w-3" />
              <span>{bundle.discountPercentage}</span>
              <span className="ml-1">{t("bundles.priceTypeCategory.discount")}</span>
            </span>
          ),
          color: "#fed7aa", // Light amber/orange (orange-200) - works with black text
        };
      default:
        return null;
    }
  };

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    const hasSearch = filters.searchTerm.trim().length > 0;
    const hasPriceFilter = 
      (filters.priceMin !== "" && filters.priceMin !== "0") ||
      (filters.priceMax !== "" && filters.priceMax !== "0");
    const hasServiceCountFilter = 
      filters.serviceCountMin !== "" || filters.serviceCountMax !== "";
    const hasPriceTypeFilter = filters.priceTypes.length > 0;
    
    return hasSearch || hasPriceFilter || hasServiceCountFilter || hasPriceTypeFilter;
  }, [filters]);

  const isEmptyState = filteredBundles.length === 0;
  const hasNoBundlesAtAll = bundles.length === 0;
  const isFilteredEmpty = isEmptyState && !hasNoBundlesAtAll && hasActiveFilters;

  return (
    <div className="space-y-6">
      {/* While bundles are loading, show skeleton or loading state */}
      {isLoading && bundles.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-foreground-3 dark:text-foreground-2">
            {t("bundles.loading")}
          </div>
        </div>
      ) : (
        <>
          {/* Bundle Filters */}
          <BundleFilters
            filters={filters}
            onFiltersChange={setFilters}
            onAddClick={handleAddBundle}
          />

          {/* Helper text with total number of bundles + divider */}
          {filteredBundles.length > 0 && (
            <div className="flex items-end gap-1 mb-6">
              <p className="text-sm text-foreground-3 dark:text-foreground-2 cursor-default">
                {t("bundles.stats.helperTotalPrefix")}{" "}
                <span className="font-semibold text-foreground-1">
                  {filteredBundles.length}{" "}
                  {t(
                    filteredBundles.length === 1
                      ? "bundles.stats.helperTotalBundleOne"
                      : "bundles.stats.helperTotalBundleOther"
                  )}
                </span>{" "}
                {t("bundles.stats.helperTotalSuffix")}
              </p>
              <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
            </div>
          )}

          {/* Main Content */}
          {filteredBundles.length === 0 ? (
            <EmptyState
              title={isFilteredEmpty
                ? t("bundles.emptyState.noResults")
                : t("bundles.emptyState.noBundles")}
              description={isFilteredEmpty
                ? t("bundles.emptyState.noResultsDescription")
                : t("bundles.emptyState.noBundlesDescription")}
              icon={Package}
              actionButton={!hasActiveFilters ? {
                label: t("bundles.filters.addBundle"),
                onClick: handleAddBundle,
                icon: Plus,
              } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredBundles.map((bundle) => {
                const serviceCount = bundle.services.length;

                // Build badges for service count
                const badges: ItemCardBadge[] = [
                  {
                    label: serviceCount === 1 ? t("bundles.service") : t("bundles.services"),
                    count: serviceCount,
                    icon: Layers2,
                  },
                ];

                const priceTypeCategory = getPriceTypeCategory(bundle);

                return (
                  <ItemCard
                    key={bundle.id}
                    title={highlight(bundle.name, filters.searchTerm)}
                    category={priceTypeCategory}
                    badges={badges}
                    metadata={[
                      {
                        icon: Clock,
                        label: "duration",
                        value: formatDuration(getTotalDuration(bundle)),
                      },
                    ]}
                    price={formatBundlePrice(bundle)}
                    actions={[
                      {
                        icon: Edit,
                        label: t("bundles.actions.edit"),
                        onClick: (e) => {
                          e.stopPropagation();
                          handleEditBundle(bundle);
                        },
                      },
                    ]}
                    onClick={() => {
                      handleEditBundle(bundle);
                    }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Bundle Slider */}
      <AddBundleSlider
        isOpen={isAddBundleSliderOpen}
        onClose={handleCloseAddSlider}
      />

      {/* Edit Bundle Slider */}
      <EditBundleSlider
        isOpen={isEditBundleSliderOpen}
        onClose={handleCloseEditSlider}
        bundle={selectedBundle}
      />
    </div>
  );
}
