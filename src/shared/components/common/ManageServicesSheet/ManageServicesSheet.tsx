import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import {
  X,
  ArrowDown01,
  ArrowUp01,
  Timer,
  CalendarClock,
  History,
  ArrowUpAZ,
  ArrowDownAZ,
  Clock,
  Filter,
  Settings2,
  ArrowRight,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
} from "../../ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { useIsMobile } from "../../../hooks/use-mobile";
import { cn } from "../../../lib/utils";
import { SearchInput } from "../SearchInput";
import { SortSelect, type SortGroup } from "../SortSelect";
import { PriceField } from "../../forms/fields/PriceField";
import { useTranslation } from "react-i18next";
import { getColorHex, getReadableTextColor } from "../../../utils/color";
import { selectCurrentUser } from "../../../../features/auth/selectors";
import { getCurrencyDisplay } from "../../../utils/currency";
import { DashedDivider } from "../DashedDivider";
import { CategoryAccordion } from "./CategoryAccordion";
import { FilterBadges } from "./FilterBadges";
import type { Service, CategoryGroup, SortField, SortDirection } from "./types";

interface ManageServicesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  teamMemberName: string;
  allServices: Service[];
  initialSelectedIds: number[];
  onApply: (serviceIds: number[]) => void;
}

export function ManageServicesSheet({
  isOpen,
  onClose,
  teamMemberName,
  allServices,
  initialSelectedIds,
  onApply,
}: ManageServicesSheetProps) {
  const { t } = useTranslation("services");
  const isMobile = useIsMobile();
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";
  const currencyDisplay = getCurrencyDisplay(businessCurrency);

  const getDisplayColor = (category: { color?: string; name: string }): string => {
    if (category.color) return category.color;
    return getColorHex(category.name);
  };

  const getTextColor = (bgColor: string): string => getReadableTextColor(bgColor);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const [searchTerm, setSearchTerm] = useState("");
  const [localPriceMin, setLocalPriceMin] = useState<string>("");
  const [localPriceMax, setLocalPriceMax] = useState<string>("");
  const [localDurationMin, setLocalDurationMin] = useState<string>("");
  const [localDurationMax, setLocalDurationMax] = useState<string>("");
  const [localCategoryIds, setLocalCategoryIds] = useState<number[]>([]);
  const [appliedPriceMin, setAppliedPriceMin] = useState<string>("");
  const [appliedPriceMax, setAppliedPriceMax] = useState<string>("");
  const [appliedDurationMin, setAppliedDurationMin] = useState<string>("");
  const [appliedDurationMax, setAppliedDurationMax] = useState<string>("");
  const [appliedCategoryIds, setAppliedCategoryIds] = useState<number[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(initialSelectedIds);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);

  const contentRefs = useRef<Map<number | null, HTMLDivElement>>(new Map());

  const [expandedCategories, setExpandedCategories] = useState<Set<number | null>>(() => {
    const selectedSet = new Set(initialSelectedIds);
    const expandedSet = new Set<number | null>();
    allServices.forEach((service) => {
      if (selectedSet.has(Number(service.id))) {
        expandedSet.add(service.category?.id ?? null);
      }
    });
    return expandedSet;
  });

  useEffect(() => {
    const selectedSet = new Set(selectedServiceIds);
    const newExpanded = new Set<number | null>();
    allServices.forEach((service) => {
      if (selectedSet.has(Number(service.id))) {
        newExpanded.add(service.category?.id ?? null);
      }
    });
    setExpandedCategories(newExpanded);
  }, [selectedServiceIds, allServices]);

  useEffect(() => {
    if (isOpen) {
      setSelectedServiceIds(initialSelectedIds);
      setSearchTerm("");
      setLocalPriceMin("");
      setLocalPriceMax("");
      setLocalDurationMin("");
      setLocalDurationMax("");
      setLocalCategoryIds([]);
      setAppliedPriceMin("");
      setAppliedPriceMax("");
      setAppliedDurationMin("");
      setAppliedDurationMax("");
      setAppliedCategoryIds([]);
      setSortField("createdAt");
      setSortDirection("desc");

      const selectedSet = new Set(initialSelectedIds);
      const expandedSet = new Set<number | null>();
      allServices.forEach((service) => {
        if (selectedSet.has(Number(service.id))) {
          expandedSet.add(service.category?.id ?? null);
        }
      });
      setExpandedCategories(expandedSet);
    }
  }, [isOpen, initialSelectedIds, allServices]);

  const filteredCategoryGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const tokens = query.split(/\s+/).map((t) => t.trim()).filter(Boolean);

    const minPrice = appliedPriceMin !== "" && appliedPriceMin !== "0" ? Number(appliedPriceMin) : null;
    const maxPrice = appliedPriceMax !== "" && appliedPriceMax !== "0" ? Number(appliedPriceMax) : null;
    const minDuration = appliedDurationMin ? Number(appliedDurationMin) : null;
    const maxDuration = appliedDurationMax ? Number(appliedDurationMax) : null;

    const filteredServices = allServices.filter((service) => {
      if (tokens.length > 0) {
        const haystack = `${service.name ?? ""} ${service.category?.name ?? ""}`.toLowerCase();
        if (!tokens.every((token) => haystack.includes(token))) return false;
      }

      const servicePrice = service.price ?? 0;
      if (minPrice !== null && servicePrice < minPrice) return false;
      if (maxPrice !== null && servicePrice > maxPrice) return false;

      const serviceDuration = service.duration ?? 0;
      if (minDuration !== null && serviceDuration < minDuration) return false;
      if (maxDuration !== null && serviceDuration > maxDuration) return false;

      if (Array.isArray(appliedCategoryIds) && appliedCategoryIds.length > 0) {
        const serviceCategoryId = service.category?.id ?? null;
        if (serviceCategoryId === null || !appliedCategoryIds.includes(serviceCategoryId)) {
          return false;
        }
      }

      return true;
    });

    const groups = new Map<number | null, CategoryGroup>();
    filteredServices.forEach((service) => {
      const categoryId = service.category?.id ?? null;
      const categoryName = service.category?.name ?? t("manageServices.uncategorized");
      const categoryColor = service.category?.color;

      if (!groups.has(categoryId)) {
        groups.set(categoryId, { categoryId, categoryName, categoryColor, services: [] });
      }
      groups.get(categoryId)!.services.push(service);
    });

    const sortedGroups = Array.from(groups.values()).map((group) => {
      const sortedServices = [...group.services].sort((a, b) => {
        if (sortField === "name") {
          const diff = (a.name ?? "").toLowerCase().localeCompare((b.name ?? "").toLowerCase());
          return sortDirection === "asc" ? diff : -diff;
        }

        let aVal: number, bVal: number;
        switch (sortField) {
          case "price":
            aVal = a.price ?? 0;
            bVal = b.price ?? 0;
            break;
          case "duration":
            aVal = a.duration ?? 0;
            bVal = b.duration ?? 0;
            break;
          case "updatedAt":
            aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            break;
          case "createdAt":
          default:
            aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            break;
        }

        if (aVal === bVal) return 0;
        const diff = aVal < bVal ? -1 : 1;
        return sortDirection === "asc" ? diff : -diff;
      });

      return { ...group, services: sortedServices };
    });

    return sortedGroups.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [allServices, searchTerm, appliedCategoryIds, appliedPriceMin, appliedPriceMax, appliedDurationMin, appliedDurationMax, sortField, sortDirection, t]);

  const availableCategories = useMemo(() => {
    const categoryMap = new Map<number, { id: number; name: string; color?: string }>();
    allServices.forEach((service) => {
      if (service.category?.id && !categoryMap.has(service.category.id)) {
        categoryMap.set(service.category.id, {
          id: service.category.id,
          name: service.category.name,
          color: service.category.color,
        });
      }
    });
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allServices]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim().length > 0 ||
      (appliedPriceMin !== "" && appliedPriceMin !== "0") ||
      (appliedPriceMax !== "" && appliedPriceMax !== "0") ||
      appliedDurationMin !== "" ||
      appliedDurationMax !== "" ||
      appliedCategoryIds.length > 0
    );
  }, [searchTerm, appliedPriceMin, appliedPriceMax, appliedDurationMin, appliedDurationMax, appliedCategoryIds]);

  const isEmptyState = filteredCategoryGroups.length === 0;
  const isFilteredEmpty = isEmptyState && allServices.length > 0 && hasActiveFilters;

  useEffect(() => {
    contentRefs.current.forEach((el) => {
      if (el) {
        const innerContent = el.firstElementChild as HTMLElement;
        if (innerContent) {
          const fullHeight = Array.from(innerContent.children).reduce(
            (acc, child) => acc + (child as HTMLElement).offsetHeight,
            0
          );
          el.style.setProperty("--radix-collapsible-content-height", `${fullHeight}px`);
        }
      }
    });
  }, [filteredCategoryGroups, expandedCategories]);

  const toggleCategoryFilter = (categoryId: number) => {
    setLocalCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const toggleService = (serviceId: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const toggleCategoryExpansion = (categoryId: number | null) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleClear = () => setSelectedServiceIds(initialSelectedIds);

  const handleApply = () => {
    onApply(selectedServiceIds);
    onClose();
  };

  const getActiveFilterCount = useMemo(() => {
    let count = 0;
    if (appliedPriceMin !== "" && appliedPriceMin !== "0") count++;
    if (appliedPriceMax !== "" && appliedPriceMax !== "0") count++;
    if (appliedDurationMin !== "") count++;
    if (appliedDurationMax !== "") count++;
    count += appliedCategoryIds.length;
    return count;
  }, [appliedPriceMin, appliedPriceMax, appliedDurationMin, appliedDurationMax, appliedCategoryIds]);

  const handleClearFilters = () => {
    setLocalPriceMin("");
    setLocalPriceMax("");
    setLocalDurationMin("");
    setLocalDurationMax("");
    setLocalCategoryIds([]);
    setAppliedPriceMin("");
    setAppliedPriceMax("");
    setAppliedDurationMin("");
    setAppliedDurationMax("");
    setAppliedCategoryIds([]);
    setShowFilters(false);
  };

  const handleApplyFilters = () => {
    setAppliedPriceMin(localPriceMin);
    setAppliedPriceMax(localPriceMax);
    setAppliedDurationMin(localDurationMin);
    setAppliedDurationMax(localDurationMax);
    setAppliedCategoryIds(localCategoryIds);
    setShowFilters(false);
  };

  useEffect(() => {
    if (showFilters) {
      setLocalPriceMin(appliedPriceMin);
      setLocalPriceMax(appliedPriceMax);
      setLocalDurationMin(appliedDurationMin);
      setLocalDurationMax(appliedDurationMax);
      setLocalCategoryIds(appliedCategoryIds);
    }
  }, [showFilters, appliedPriceMin, appliedPriceMax, appliedDurationMin, appliedDurationMax, appliedCategoryIds]);

  const sortGroups: SortGroup[] = useMemo(() => [
    { label: t("sort.groupName"), options: [
      { value: "name_asc", label: t("sort.nameAsc"), icon: ArrowUpAZ },
      { value: "name_desc", label: t("sort.nameDesc"), icon: ArrowDownAZ },
    ]},
    { label: t("sort.groupPrice"), options: [
      { value: "price_asc", label: t("sort.priceAsc"), icon: ArrowUp01 },
      { value: "price_desc", label: t("sort.priceDesc"), icon: ArrowDown01 },
    ]},
    { label: t("sort.groupDuration"), options: [
      { value: "duration_asc", label: t("sort.durationAsc"), icon: Timer },
      { value: "duration_desc", label: t("sort.durationDesc"), icon: Timer },
    ]},
    { label: t("sort.groupCreatedAt"), options: [
      { value: "createdAt_desc", label: t("sort.createdAtDesc"), icon: CalendarClock },
      { value: "createdAt_asc", label: t("sort.createdAtAsc"), icon: CalendarClock },
    ]},
    { label: t("sort.groupUpdatedAt"), options: [
      { value: "updatedAt_desc", label: t("sort.updatedAtDesc"), icon: History },
      { value: "updatedAt_asc", label: t("sort.updatedAtAsc"), icon: History },
    ]},
  ], [t]);

  const currentSortValue = `${sortField}_${sortDirection}`;

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split("_");
    setSortField(field as SortField);
    setSortDirection(direction as SortDirection);
  };

  const hasChanges = useMemo(() => {
    if (selectedServiceIds.length !== initialSelectedIds.length) return true;
    const selectedSet = new Set(selectedServiceIds);
    const initialSet = new Set(initialSelectedIds);
    return selectedServiceIds.some((id) => !initialSet.has(id)) || initialSelectedIds.some((id) => !selectedSet.has(id));
  }, [selectedServiceIds, initialSelectedIds]);

  const filterBadgeLabels = {
    minPrice: t("filters.minPriceLabel"),
    maxPrice: t("filters.maxPriceLabel"),
    minDuration: t("filters.minDurationLabel"),
    maxDuration: t("filters.maxDurationLabel"),
  };

  const renderFilterContent = () => (
    <>
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("filters.byPrice")}
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-17">
          <PriceField
            value={localPriceMin}
            onChange={(val) => setLocalPriceMin(String(val ?? ""))}
            label={t("filters.minPriceLabel")}
            placeholder={t("filters.minPricePlaceholder")}
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
            value={localPriceMax}
            onChange={(val) => setLocalPriceMax(String(val ?? ""))}
            label={t("filters.maxPriceLabel")}
            placeholder={t("filters.maxPricePlaceholder")}
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

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("filters.byDuration")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-foreground-2">{t("filters.minDurationLabel")}</span>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Clock className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
              </div>
              <Input
                type="text"
                inputMode="numeric"
                value={localDurationMin}
                onChange={(e) => {
                  if (e.target.value === "" || /^\d+$/.test(e.target.value)) {
                    setLocalDurationMin(e.target.value);
                  }
                }}
                placeholder={t("filters.minDurationPlaceholder")}
                className="h-9 w-full text-sm !pl-10 !pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-foreground-2">{t("filters.maxDurationLabel")}</span>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Clock className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
              </div>
              <Input
                type="text"
                inputMode="numeric"
                value={localDurationMax}
                onChange={(e) => {
                  if (e.target.value === "" || /^\d+$/.test(e.target.value)) {
                    setLocalDurationMax(e.target.value);
                  }
                }}
                placeholder={t("filters.maxDurationPlaceholder")}
                className="h-9 w-full text-sm !pl-10 !pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border hover:border-border-strong focus:border-focus focus-visible:ring-focus"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle" />

      {availableCategories.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("filters.byCategory")}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => {
              const isSelected = localCategoryIds.includes(category.id);
              const bgColor = getDisplayColor(category);
              const textColor = getTextColor(bgColor);
              return (
                <Button
                  key={category.id}
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={() => toggleCategoryFilter(category.id)}
                  className={cn(
                    "h-auto px-5 py-1.5 gap-2 relative !transition-none text-xs font-medium",
                    isSelected
                      ? "border-neutral-500 text-neutral-900 dark:text-neutral-900 shadow-xs focus-visible:!border-neutral-500"
                      : "border-border opacity-100",
                    "hover:!border-border",
                    isSelected && "hover:!border-neutral-500"
                  )}
                  style={{ backgroundColor: bgColor, color: isSelected ? undefined : textColor }}
                >
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-400 dark:bg-success shadow-sm flex items-center justify-center">
                      <svg className="h-3 w-3 text-foreground-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-4 w-full">
      <div className="relative w-full max-w-sm h-36 text-left">
        <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-b from-primary/5 dark:from-primary/10 via-transparent to-transparent blur-2xl opacity-50 dark:opacity-40" />
        <div className="absolute inset-x-8 top-1 h-20 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-border shadow-lg opacity-70 rotate-[-14deg] blur-[0.5px]" />
        <div className="absolute inset-x-4 top-6 h-24 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-border shadow-xl opacity-85 rotate-[10deg] blur-[0.5px]" />
        <div className="absolute inset-x-1 top-4 h-28 rounded-2xl bg-surface dark:bg-neutral-900 border border-border shadow-xl overflow-hidden">
          <div className="h-full w-full px-5 py-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-12 w-12 rounded-lg bg-neutral-300 dark:bg-neutral-800 flex-shrink-0" />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="h-4 w-36 rounded bg-neutral-300 dark:bg-neutral-800" />
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-16 rounded-full bg-neutral-300/80 dark:bg-neutral-800/80" />
                    <div className="h-2.5 w-12 rounded-full bg-neutral-300/70 dark:bg-neutral-800/70" />
                  </div>
                </div>
              </div>
              <div className="h-5 w-16 rounded bg-neutral-300 dark:bg-neutral-800 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-5 w-20 rounded-full bg-neutral-300/90 dark:bg-neutral-800/90" />
              <div className="h-5 w-16 rounded-full bg-neutral-300/80 dark:bg-neutral-800/80" />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5 max-w-md px-4">
        <h3 className="text-base font-semibold text-foreground-1">
          {isFilteredEmpty ? t("page.emptyState.noResults") : t("page.emptyState.noServices")}
        </h3>
        <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
          {isFilteredEmpty ? t("page.emptyState.noResultsDescription") : t("page.emptyState.noServicesDescription")}
        </p>
      </div>
    </div>
  );

  const renderCategoryList = () => (
    <>
      {filteredCategoryGroups.map((group) => (
        <CategoryAccordion
          key={group.categoryId ?? "uncategorized"}
          group={group}
          isExpanded={expandedCategories.has(group.categoryId)}
          selectedServiceIds={selectedServiceIds}
          searchTerm={searchTerm}
          currencyDisplay={currencyDisplay}
          durationUnit={t("manageServices.durationUnit")}
          onToggleExpand={toggleCategoryExpansion}
          onToggleService={toggleService}
          contentRef={(el) => {
            if (el) contentRefs.current.set(group.categoryId, el);
            else contentRefs.current.delete(group.categoryId);
          }}
        />
      ))}
    </>
  );

  const renderFilterButton = (isActive: boolean) => (
    <button
      className={cn(
        "relative inline-flex items-center justify-center h-auto px-3 py-1.5 gap-1.5 rounded-full border border-border transition-[colors,box-shadow,background-color,color] duration-200 ease-out cursor-pointer",
        isActive
          ? "bg-info-100 border-border-strong text-foreground-1 dark:bg-neutral-900 dark:text-foreground-1 dark:border-border-strong"
          : "bg-surface-hover text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong dark:bg-transparent dark:text-foreground-1 dark:hover:bg-neutral-900 dark:border-border-strong"
      )}
      aria-label={t("filters.showFiltersAria")}
    >
      <Filter className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
      <span className="text-xs font-medium">{t("filters.addFilter")}</span>
      {getActiveFilterCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-white dark:text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow">
          {getActiveFilterCount}
        </span>
      )}
    </button>
  );

  const renderFilterActions = () => (
    <div className="flex justify-end gap-2 w-full pt-4 border-t border-border-subtle">
      <Button
        variant="outline"
        rounded="full"
        size="sm"
        className="group inline-flex items-center gap-1.5 px-4 py-2 font-medium cursor-pointer transition-transform active:scale-95"
        onClick={() => { handleClearFilters(); setShowFilters(false); }}
      >
        {t("filters.clearAll")}
      </Button>
      <Button
        size="sm"
        rounded="full"
        className="group inline-flex items-center gap-1.5 px-6 py-2 !min-w-40 justify-center font-semibold cursor-pointer transition-transform active:scale-95"
        onClick={handleApplyFilters}
      >
        {t("filters.apply")}
      </Button>
    </div>
  );

  const renderFooter = (isMobileFooter = false) => (
    <div className={isMobileFooter ? "md:hidden bg-surface" : "hidden md:flex flex-col bg-surface shrink-0"}>
      <DashedDivider marginTop="mt-0" className="mb-0" paddingTop={isMobileFooter ? "pt-2" : "pt-4"} dashPattern="1 1" />
      <div className={isMobileFooter ? "flex justify-between gap-2 mt-0 md:mb-2 p-4" : "px-6 pb-2"}>
        <div className={isMobileFooter ? "contents" : "flex justify-between gap-2 mt-4 mb-3 md:mb-2"}>
          <Button
            type="button"
            variant="outline"
            rounded="full"
            onClick={handleClear}
            disabled={!hasChanges}
            className={`gap-2 h-11 cursor-pointer ${isMobileFooter ? "w-32" : "w-32 md:w-42"}`}
          >
            {t("manageServices.clear")}
          </Button>
          <Button
            type="button"
            rounded="full"
            onClick={handleApply}
            disabled={!hasChanges}
            className={`group gap-2 h-11 cursor-pointer ${isMobileFooter ? "flex-1" : "w-72"}`}
          >
            {t("manageServices.apply")}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const content = (
    <>
      <DrawerHeader className="hidden md:flex flex-col bg-surface relative p-4 px-0 md:p-6">
        <div className="flex items-center gap-3 px-4 md:px-0">
          <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
            <DrawerTitle className="text-lg text-foreground-1 cursor-default">
              {t("manageServices.title")} <span className="font-semibold">{teamMemberName}</span>
            </DrawerTitle>
          </div>
        </div>
        <DashedDivider marginTop="mt-3" className="pt-0 md:pt-3" dashPattern="1 1" />
      </DrawerHeader>

      <div className="p-4 flex flex-col gap-4 border-b border-border">
        <div className="flex gap-2 items-center">
          <SearchInput
            className="flex-1"
            placeholder={t("filters.searchPlaceholder")}
            value={searchTerm}
            onChange={setSearchTerm}
            inputClassName="border-border"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <SortSelect
            value={currentSortValue}
            onValueChange={handleSortChange}
            groups={sortGroups}
            placeholder={t("sort.trigger")}
            className="flex-1 md:flex-none"
          />

          {isMobile ? (
            <Drawer
              autoFocus={true}
              open={showFilters}
              onOpenChange={(open) => {
                setShowFilters(open);
                if (open) document.documentElement.style.scrollBehavior = "auto";
                else setTimeout(() => { document.documentElement.style.scrollBehavior = "smooth"; }, 100);
              }}
            >
              <DrawerTrigger asChild>{renderFilterButton(showFilters)}</DrawerTrigger>
              <DrawerContent className="outline-none !z-[80]" overlayClassName="!z-[75]">
                <DrawerTitle className="sr-only">{t("filters.addFilter")}</DrawerTitle>
                <DrawerDescription className="sr-only">{t("filters.addFilter")}</DrawerDescription>
                <div className="p-4 overflow-y-auto max-h-[80vh] space-y-4">
                  {renderFilterContent()}
                  <DrawerFooter className="px-0 pt-4">{renderFilterActions()}</DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>{renderFilterButton(showFilters)}</PopoverTrigger>
              <PopoverContent
                align="start"
                onOpenAutoFocus={(event) => event.preventDefault()}
                className="w-[380px] max-h-128 overflow-y-auto scrollbar-hide p-4 bg-surface border border-border shadow-md rounded-xl space-y-4"
              >
                {renderFilterContent()}
                {renderFilterActions()}
              </PopoverContent>
            </Popover>
          )}
        </div>

        <FilterBadges
          appliedPriceMin={appliedPriceMin}
          appliedPriceMax={appliedPriceMax}
          appliedDurationMin={appliedDurationMin}
          appliedDurationMax={appliedDurationMax}
          appliedCategoryIds={appliedCategoryIds}
          availableCategories={availableCategories}
          labels={filterBadgeLabels}
          onRemovePriceMin={() => setAppliedPriceMin("")}
          onRemovePriceMax={() => setAppliedPriceMax("")}
          onRemoveDurationMin={() => setAppliedDurationMin("")}
          onRemoveDurationMax={() => setAppliedDurationMax("")}
          onRemoveCategory={(id) => setAppliedCategoryIds((prev) => prev.filter((cid) => cid !== id))}
        />
      </div>

      <div className={cn("flex-1 p-4 space-y-4", filteredCategoryGroups.length > 0 ? "overflow-y-auto" : "overflow-hidden flex items-center justify-center")}>
        {filteredCategoryGroups.length === 0 ? renderEmptyState() : renderCategoryList()}
      </div>

      {renderFooter(true)}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose} autoFocus={true}>
        <DrawerContent className="h-[85vh] flex flex-col bg-popover text-popover-foreground">
          <DrawerTitle className="sr-only">{t("manageServices.title")} {teamMemberName}</DrawerTitle>
          <DrawerDescription className="sr-only">{t("manageServices.title")} {teamMemberName}</DrawerDescription>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-popover overflow-hidden text-popover-foreground rounded-lg border shadow-lg max-w-2xl w-full h-[85vh] flex flex-col p-0 pointer-events-auto animate-in fade-in-0 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col bg-surface relative p-4 px-0 md:p-6 md:pb-4">
            <div className="flex items-center gap-3 px-4 md:px-0">
              <div className="hidden md:flex flex-shrink-0 items-stretch self-stretch">
                <div className="flex items-center justify-center rounded-full border border-border-strong bg-surface aspect-square h-full min-w-[2.5rem]">
                  <Settings2 className="h-6 w-6 text-foreground-1" />
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
                <h2 className="text-lg text-foreground-1 cursor-default">
                  {t("manageServices.title")} <span className="font-semibold">{teamMemberName}</span>
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hidden md:flex absolute right-4 top-4 h-8 w-8 rounded-md hover:bg-surface-hover active:bg-surface-active"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t("manageServices.close")}</span>
              </Button>
            </div>
            <DashedDivider marginTop="mt-3" className="pt-0 md:pt-3" dashPattern="1 1" />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 pt-2 space-y-4 border-b border-border">
              <div className="md:flex md:gap-2 md:items-center">
                <div className="flex gap-2 items-center md:flex-1">
                  <SearchInput
                    className="flex-1"
                    placeholder={t("filters.searchPlaceholder")}
                    value={searchTerm}
                    onChange={setSearchTerm}
                    inputClassName="border-border"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center md:flex-none">
                  <SortSelect
                    value={currentSortValue}
                    onValueChange={handleSortChange}
                    groups={sortGroups}
                    placeholder={t("sort.trigger")}
                    className="flex-1 md:flex-none"
                  />
                  <Popover open={showFilters} onOpenChange={setShowFilters}>
                    <PopoverTrigger asChild>{renderFilterButton(showFilters)}</PopoverTrigger>
                    <PopoverContent
                      align="start"
                      onOpenAutoFocus={(event) => event.preventDefault()}
                      className="w-[380px] max-h-128 overflow-y-auto scrollbar-hide p-4 space-y-4"
                    >
                      {renderFilterContent()}
                      {renderFilterActions()}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <FilterBadges
                appliedPriceMin={appliedPriceMin}
                appliedPriceMax={appliedPriceMax}
                appliedDurationMin={appliedDurationMin}
                appliedDurationMax={appliedDurationMax}
                appliedCategoryIds={appliedCategoryIds}
                availableCategories={availableCategories}
                labels={filterBadgeLabels}
                onRemovePriceMin={() => setAppliedPriceMin("")}
                onRemovePriceMax={() => setAppliedPriceMax("")}
                onRemoveDurationMin={() => setAppliedDurationMin("")}
                onRemoveDurationMax={() => setAppliedDurationMax("")}
                onRemoveCategory={(id) => setAppliedCategoryIds((prev) => prev.filter((cid) => cid !== id))}
              />
            </div>

            <div className={cn("flex-1 p-4 space-y-4 scrollbar-hide", filteredCategoryGroups.length > 0 ? "overflow-y-auto" : "overflow-hidden flex items-center justify-center")}>
              {filteredCategoryGroups.length === 0 ? renderEmptyState() : renderCategoryList()}
            </div>
          </div>

          {renderFooter(false)}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

