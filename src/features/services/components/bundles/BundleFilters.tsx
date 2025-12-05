import { type FC, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Filter, Plus } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { SearchInput } from "../../../../shared/components/common/SearchInput";
import {
  SortSelect,
  type SortOption,
  type SortGroup,
} from "../../../../shared/components/common/SortSelect";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../shared/components/ui/popover";
import { Input } from "../../../../shared/components/ui/input";
import { PriceField } from "../../../../shared/components/forms/fields/PriceField";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../auth/selectors";
import { getCurrencyDisplay } from "../../../../shared/utils/currency";
import {
  ArrowDown01,
  ArrowUp01,
  CalendarClock,
  History,
  Layers2,
  Calculator,
  DollarSign,
  Percent,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "../../../../shared/components/ui/drawer";
import {
  type BundleFilterState,
  type BundleSortField,
  type BundleSortDirection,
  BundlePriceType,
  getDefaultBundleFilters,
} from "../../../bundles/types";
import { BundleBadgeList } from "./BundleBadgeList";

interface BundleFiltersProps {
  filters: BundleFilterState;
  onFiltersChange: (filters: BundleFilterState) => void;
  onAddClick: () => void;
}

export const BundleFilters: FC<BundleFiltersProps> = ({
  filters,
  onFiltersChange,
  onAddClick,
}) => {
  const text = useTranslation("services").t;
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";
  
  const [localFilters, setLocalFilters] = useState<BundleFilterState>(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keep local filters in sync with parent
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    const reset = getDefaultBundleFilters();
    setLocalFilters(reset);
    setShowFilters(false);
    onFiltersChange(reset);
  }, [onFiltersChange]);

  const handleApplyFilters = useCallback(
    (nextFilters: BundleFilterState) => {
      setLocalFilters(nextFilters);
      setShowFilters(false);
      onFiltersChange(nextFilters);
    },
    [onFiltersChange]
  );

  const getActiveFilterCount = useCallback(() => {
    const {
      priceMin,
      priceMax,
      serviceCountMin,
      serviceCountMax,
      priceTypes,
    } = filters;

    const hasPriceMin = priceMin !== "" && priceMin !== "0";
    const hasPriceMax = priceMax !== "" && priceMax !== "0";
    const priceTypeCount = Array.isArray(priceTypes) ? priceTypes.length : 0;

    let count = 0;
    if (serviceCountMin) count += 1;
    if (serviceCountMax) count += 1;
    if (hasPriceMin) count += 1;
    if (hasPriceMax) count += 1;
    count += priceTypeCount;

    return count;
  }, [filters]);

  const priceOptions: SortOption[] = [
    { value: "price_asc", label: text("bundles.sort.priceAsc"), icon: ArrowUp01 },
    { value: "price_desc", label: text("bundles.sort.priceDesc"), icon: ArrowDown01 },
  ];

  const serviceCountOptions: SortOption[] = [
    { value: "serviceCount_asc", label: text("bundles.sort.serviceCountAsc"), icon: Layers2 },
    { value: "serviceCount_desc", label: text("bundles.sort.serviceCountDesc"), icon: Layers2 },
  ];

  const createdAtOptions: SortOption[] = [
    {
      value: "createdAt_desc",
      label: text("bundles.sort.createdAtDesc"),
      icon: CalendarClock,
    },
    {
      value: "createdAt_asc",
      label: text("bundles.sort.createdAtAsc"),
      icon: CalendarClock,
    },
  ];

  const updatedAtOptions: SortOption[] = [
    {
      value: "updatedAt_desc",
      label: text("bundles.sort.updatedAtDesc"),
      icon: History,
    },
    {
      value: "updatedAt_asc",
      label: text("bundles.sort.updatedAtAsc"),
      icon: History,
    },
  ];

  const sortGroups: SortGroup[] = [
    { label: text("bundles.sort.groupPrice"), options: priceOptions },
    { label: text("bundles.sort.groupServiceCount"), options: serviceCountOptions },
    { label: text("bundles.sort.groupCreatedAt"), options: createdAtOptions },
    { label: text("bundles.sort.groupUpdatedAt"), options: updatedAtOptions },
  ];

  const currentSortValue = `${localFilters.sortField}_${localFilters.sortDirection}`;

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split("_");
    const newFilters: BundleFilterState = {
      ...localFilters,
      sortField: field as BundleSortField,
      sortDirection: direction as BundleSortDirection,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  const handleDebouncedSearchChange = (value: string) => {
    const updatedFilters: BundleFilterState = {
      ...localFilters,
      searchTerm: value,
    };
    handleApplyFilters(updatedFilters);
  };

  const priceTypeOptions = [
    { value: BundlePriceType.SUM, label: text("bundles.filters.priceTypes.sum"), icon: Calculator, color: "#dbeafe" }, // Light blue
    { value: BundlePriceType.FIXED, label: text("bundles.filters.priceTypes.fixed"), icon: DollarSign, color: "#d1fae5" }, // Light green
    { value: BundlePriceType.DISCOUNT, label: text("bundles.filters.priceTypes.discount"), icon: Percent, color: "#fed7aa" }, // Light amber/orange
  ];

  const renderFiltersContent = () => (
    <>
      {/* By Price */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {text("bundles.filters.byPrice")}
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-17">
          <PriceField
            value={localFilters.priceMin}
            onChange={(val) =>
              setLocalFilters((prev) => ({
                ...prev,
                priceMin: String(val ?? ""),
              }))
            }
            label={text("bundles.filters.minPriceLabel")}
            placeholder={text("bundles.filters.minPricePlaceholder")}
            className="space-y-1"
            min={0}
            step={0.01}
            storageFormat="decimal"
            icon={getCurrencyDisplay(businessCurrency).icon}
            symbol={getCurrencyDisplay(businessCurrency).symbol}
            iconPosition="left"
            currency={businessCurrency}
            customLabelClassName="text-xs font-medium text-foreground-2"
          />
          <PriceField
            value={localFilters.priceMax}
            onChange={(val) =>
              setLocalFilters((prev) => ({
                ...prev,
                priceMax: String(val ?? ""),
              }))
            }
            label={text("bundles.filters.maxPriceLabel")}
            placeholder={text("bundles.filters.maxPricePlaceholder")}
            className="space-y-1"
            min={0}
            step={0.01}
            storageFormat="decimal"
            icon={getCurrencyDisplay(businessCurrency).icon}
            symbol={getCurrencyDisplay(businessCurrency).symbol}
            iconPosition="left"
            currency={businessCurrency}
            customLabelClassName="text-xs font-medium text-foreground-2"
          />
        </div>
      </div>

      <div className="border-t border-border-subtle" />

      {/* By Service Count */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {text("bundles.filters.byServiceCount")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Min service count */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-foreground-2">
              {text("bundles.filters.minServiceCountLabel")}
            </span>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Layers2 className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
              </div>
              <Input
                type="text"
                inputMode="numeric"
                value={localFilters.serviceCountMin}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === "" || /^\d+$/.test(inputValue)) {
                    setLocalFilters((prev) => ({
                      ...prev,
                      serviceCountMin: inputValue,
                    }));
                  }
                }}
                placeholder={text("bundles.filters.minServiceCountPlaceholder")}
                className="h-9 w-full text-sm !pl-10 !pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
              />
            </div>
          </div>

          {/* Max service count */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-foreground-2">
              {text("bundles.filters.maxServiceCountLabel")}
            </span>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Layers2 className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
              </div>
              <Input
                type="text"
                inputMode="numeric"
                value={localFilters.serviceCountMax}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === "" || /^\d+$/.test(inputValue)) {
                    setLocalFilters((prev) => ({
                      ...prev,
                      serviceCountMax: inputValue,
                    }));
                  }
                }}
                placeholder={text("bundles.filters.maxServiceCountPlaceholder")}
                className="h-9 w-full text-sm !pl-10 !pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle" />

      {/* By Price Type */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {text("bundles.filters.byPriceType")}
        </div>
        <div className="flex flex-wrap gap-2">
          {priceTypeOptions.map((option) => {
            const isSelected = localFilters.priceTypes.includes(option.value);
            const Icon = option.icon;

            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                rounded="full"
                className={`h-auto px-4 py-1.5 gap-2 relative !transition-none text-xs font-medium text-neutral-900 ${
                  isSelected
                    ? "border-neutral-500 shadow-xs focus-visible:!border-neutral-500"
                    : "border-transparent"
                } hover:!border-neutral-400`}
                style={{ backgroundColor: option.color }}
                onClick={() => {
                  const currentTypes = localFilters.priceTypes;
                  const nextTypes = isSelected
                    ? currentTypes.filter((t) => t !== option.value)
                    : [...currentTypes, option.value];
                  setLocalFilters((prev) => ({
                    ...prev,
                    priceTypes: nextTypes,
                  }));
                }}
              >
                {isSelected && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-400 dark:bg-success shadow-sm flex items-center justify-center">
                    <svg
                      className="h-3 w-3 text-foreground-inverse"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                <Icon className="h-3.5 w-3.5" />
                <span>{option.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <SearchInput
          className="flex-1"
          placeholder={text("bundles.filters.searchPlaceholder")}
          value={localFilters.searchTerm}
          onChange={handleSearchChange}
          onDebouncedChange={handleDebouncedSearchChange}
        />
        <Button
          type="button"
          size="sm"
          rounded="full"
          className="h-9 !px-4 md:h-11 md:px-5 md:!min-w-52 md:px-6 font-semibold group active:scale-95 transition-transform shrink-0"
          onClick={onAddClick}
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
          <span className="">{text("bundles.filters.addBundle")}</span>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <SortSelect
          value={currentSortValue}
          onValueChange={handleSortChange}
          groups={sortGroups}
          placeholder={text("bundles.sort.trigger")}
          className="flex-1 md:flex-none"
        />

        {isMobile ? (
          <Drawer
            open={showFilters}
            onOpenChange={(open) => {
              setShowFilters(open);
              if (open) {
                document.documentElement.style.scrollBehavior = "auto";
              } else {
                setTimeout(() => {
                  document.documentElement.style.scrollBehavior = "smooth";
                }, 100);
              }
            }}
          >
            <DrawerTrigger asChild>
              <button
                className={`
                  relative inline-flex items-center justify-center h-auto flex-1 md:flex-none px-3 py-1.5 gap-1.5 rounded-full border border-border
                  transition-[colors,box-shadow,background-color,color] duration-200 ease-out cursor-pointer
                  ${
                    showFilters
                      ? "bg-info-100 border-border-strong text-foreground-1 dark:bg-neutral-900 dark:text-foreground-1 dark:border-border-strong"
                      : "bg-surface-hover text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong dark:bg-transparent dark:text-foreground-1 dark:hover:bg-neutral-900 dark:border-border-strong"
                  }
                `}
                aria-label={text("bundles.filters.showFiltersAria")}
              >
                <Filter className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
                <span className="text-xs font-medium">
                  {text("bundles.filters.addFilter")}
                </span>
                {getActiveFilterCount() > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-primary text-white dark:text-white text-xs font-bold rounded-full
                       px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow"
                  >
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
            </DrawerTrigger>
            <DrawerContent
              className="outline-none !z-[80]"
              overlayClassName="!z-[75]"
            >
              <DrawerTitle className="sr-only">
                {text("bundles.filters.addFilter")}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Filter bundles by price, service count, and price type
              </DrawerDescription>
              <div className="p-4 overflow-y-auto max-h-[80vh] space-y-4">
                {renderFiltersContent()}
                <DrawerFooter className="px-0 pt-4">
                  <div className="flex justify-end gap-2 w-full">
                    <Button
                      variant="outline"
                      rounded="full"
                      size="sm"
                      className="group inline-flex items-center gap-1.5 px-4 py-2 font-medium cursor-pointer transition-transform active:scale-95"
                      onClick={() => {
                        handleClearFilters();
                        setShowFilters(false);
                      }}
                    >
                      {text("bundles.filters.clearAll")}
                    </Button>
                    <Button
                      size="sm"
                      rounded="full"
                      className="group inline-flex items-center gap-1.5 px-6 py-2 !min-w-40 justify-center font-semibold cursor-pointer transition-transform active:scale-95"
                      onClick={() => {
                        handleApplyFilters(localFilters);
                        setShowFilters(false);
                      }}
                    >
                      {text("bundles.filters.apply")}
                    </Button>
                  </div>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <button
                className={`
                  relative inline-flex items-center justify-center h-auto px-3 py-1.5 gap-1.5 rounded-full border border-border
                  transition-[colors,box-shadow,background-color,color] duration-200 ease-out cursor-pointer
                  ${
                    showFilters
                      ? "bg-info-100 border-border-strong text-foreground-1 dark:bg-neutral-900 dark:text-foreground-1 dark:border-border-strong"
                      : "bg-surface-hover text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong dark:bg-transparent dark:text-foreground-1 dark:hover:bg-neutral-900 dark:border-border-strong"
                  }
                `}
                aria-label={text("bundles.filters.showFiltersAria")}
              >
                <Filter className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
                <span className="text-xs font-medium">
                  {text("bundles.filters.addFilter")}
                </span>
                {getActiveFilterCount() > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-primary text-white dark:text-white text-xs font-bold rounded-full
                       px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow"
                  >
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              onOpenAutoFocus={(event) => event.preventDefault()}
              className="w-[380px] max-h-128 overflow-y-auto scrollbar-hide p-4 bg-surface border border-border shadow-md rounded-xl space-y-4"
            >
              {renderFiltersContent()}
              <div className="flex justify-end gap-2 border-t border-border-subtle mt-3 pt-3">
                <Button
                  variant="outline"
                  rounded="full"
                  size="sm"
                  className="group inline-flex items-center gap-1.5 px-4 py-2 font-medium cursor-pointer transition-transform active:scale-95"
                  onClick={() => {
                    handleClearFilters();
                    setShowFilters(false);
                  }}
                >
                  {text("bundles.filters.clearAll")}
                </Button>
                <Button
                  size="sm"
                  rounded="full"
                  className="group inline-flex items-center gap-1.5 px-6 py-2 !min-w-40 justify-center font-semibold cursor-pointer transition-transform active:scale-95"
                  onClick={() => {
                    handleApplyFilters(localFilters);
                    setShowFilters(false);
                  }}
                >
                  {text("bundles.filters.apply")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <BundleBadgeList filters={filters} onFiltersChange={onFiltersChange} />
    </div>
  );
};
