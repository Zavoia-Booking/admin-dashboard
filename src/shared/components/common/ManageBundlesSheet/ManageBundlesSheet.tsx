import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import {
  X,
  ArrowDown01,
  ArrowUp01,
  CalendarClock,
  History,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowRight,
  CheckSquare,
  Square,
  Package,
  Settings2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "../../ui/drawer";
import { Button } from "../../ui/button";
import { useIsMobile } from "../../../hooks/use-mobile";
import { cn } from "../../../lib/utils";
import { SearchInput } from "../SearchInput";
import { SortSelect, type SortGroup } from "../SortSelect";
import { useTranslation } from "react-i18next";
import { selectCurrentUser } from "../../../../features/auth/selectors";
import { getCurrencyDisplay } from "../../../utils/currency";
import { DashedDivider } from "../DashedDivider";
import { BundleItem } from "./BundleItem";
import type { Bundle } from "./types";

interface ManageBundlesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  allBundles: Bundle[];
  initialSelectedIds: number[];
  onSave?: (bundleIds: number[]) => void;
  onApply?: (bundleIds: number[]) => void;
  title?: string;
  subtitle?: string;
  titleLocationName?: string;
}

type SortField = "name" | "price" | "serviceCount" | "createdAt" | "updatedAt";
type SortDirection = "asc" | "desc";

export function ManageBundlesSheet({
  isOpen,
  onClose,
  allBundles,
  initialSelectedIds,
  onSave,
  onApply,
  title,
  subtitle,
  titleLocationName,
}: ManageBundlesSheetProps) {
  const { t } = useTranslation("assignments");
  const isMobile = useIsMobile();
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";
  const currencyDisplay = getCurrencyDisplay(businessCurrency);

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
  const [selectedBundleIds, setSelectedBundleIds] =
    useState<number[]>(initialSelectedIds);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    if (isOpen) {
      setSelectedBundleIds(initialSelectedIds);
      setSearchTerm("");
      setSortField("name");
      setSortDirection("asc");
    }
  }, [isOpen, initialSelectedIds]);

  const toggleBundle = (bundleId: number) => {
    setSelectedBundleIds((prev) =>
      prev.includes(bundleId)
        ? prev.filter((id) => id !== bundleId)
        : [...prev, bundleId],
    );
  };

  const handleClear = () => setSelectedBundleIds(initialSelectedIds);

  const handleApply = () => {
    if (onSave) {
      onSave(selectedBundleIds);
      onClose();
    } else if (onApply) {
      onApply(selectedBundleIds);
      onClose();
    }
  };

  // Filter bundles by search term
  const filteredBundles = useMemo(() => {
    let result = [...allBundles];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.trim().toLowerCase();
      result = result.filter((bundle) =>
        bundle.bundleName.toLowerCase().includes(searchLower),
      );
    }

    // Sort
    result.sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "name":
          return a.bundleName.localeCompare(b.bundleName) * multiplier;
        case "price":
          return (
            (a.calculatedPriceAmountMinor - b.calculatedPriceAmountMinor) *
            multiplier
          );
        case "serviceCount":
          return (a.serviceCount - b.serviceCount) * multiplier;
        case "createdAt":
        case "updatedAt":
          // These fields don't exist in Bundle type, so we'll skip them
          return 0;
        default:
          return 0;
      }
    });

    return result;
  }, [allBundles, searchTerm, sortField, sortDirection]);

  const sortGroups: SortGroup[] = useMemo(
    () => [
      {
        label: t("page.locationBundles.sort.groupName"),
        options: [
          {
            value: "name_asc",
            label: t("page.locationBundles.sort.nameAsc"),
            icon: ArrowUpAZ,
          },
          {
            value: "name_desc",
            label: t("page.locationBundles.sort.nameDesc"),
            icon: ArrowDownAZ,
          },
        ],
      },
      {
        label: t("page.locationBundles.sort.groupPrice"),
        options: [
          {
            value: "price_asc",
            label: t("page.locationBundles.sort.priceAsc"),
            icon: ArrowUp01,
          },
          {
            value: "price_desc",
            label: t("page.locationBundles.sort.priceDesc"),
            icon: ArrowDown01,
          },
        ],
      },
      {
        label: t("page.locationBundles.sort.groupServiceCount"),
        options: [
          {
            value: "serviceCount_asc",
            label: t("page.locationBundles.sort.serviceCountAsc"),
            icon: Package,
          },
          {
            value: "serviceCount_desc",
            label: t("page.locationBundles.sort.serviceCountDesc"),
            icon: Package,
          },
        ],
      },
    ],
    [t],
  );

  const currentSortValue = `${sortField}_${sortDirection}`;

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split("_");
    setSortField(field as SortField);
    setSortDirection(direction as SortDirection);
  };

  const hasChanges = useMemo(() => {
    if (selectedBundleIds.length !== initialSelectedIds.length) return true;
    const selectedSet = new Set(selectedBundleIds);
    const initialSet = new Set(initialSelectedIds);
    return (
      selectedBundleIds.some((id) => !initialSet.has(id)) ||
      initialSelectedIds.some((id) => !selectedSet.has(id))
    );
  }, [selectedBundleIds, initialSelectedIds]);

  const isFilteredEmpty = filteredBundles.length === 0 && allBundles.length > 0;

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
          {isFilteredEmpty
            ? t("page.locationBundles.emptyState.noResults")
            : t("page.locationBundles.emptyState.noBundles")}
        </h3>
        <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
          {isFilteredEmpty
            ? t("page.locationBundles.emptyState.noResultsDescription")
            : t("page.locationBundles.emptyState.noBundlesDescription")}
        </p>
      </div>
    </div>
  );

  // Get all visible bundle IDs
  const visibleBundleIds = useMemo(() => {
    return filteredBundles.map((bundle) => bundle.bundleId);
  }, [filteredBundles]);

  // Check if all visible bundles are selected
  const areAllVisibleSelected = useMemo(() => {
    if (visibleBundleIds.length === 0) return false;
    return visibleBundleIds.every((id) => selectedBundleIds.includes(id));
  }, [visibleBundleIds, selectedBundleIds]);

  // Toggle all visible bundles
  const toggleAllVisible = () => {
    if (areAllVisibleSelected) {
      setSelectedBundleIds((prev) =>
        prev.filter((id) => !visibleBundleIds.includes(id)),
      );
    } else {
      setSelectedBundleIds((prev) => {
        const newSet = new Set(prev);
        visibleBundleIds.forEach((id) => newSet.add(id));
        return Array.from(newSet);
      });
    }
  };

  const renderSelectAllButton = () => (
    <button
      onClick={toggleAllVisible}
      className={cn(
        "inline-flex items-center justify-center h-auto !min-w-36 px-3 py-1.5 gap-1.5 rounded-full border border-border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0",
        areAllVisibleSelected
          ? "bg-info-100 border-border-strong text-foreground-1 dark:bg-neutral-900 dark:text-foreground-1 dark:border-border-strong"
          : "bg-surface-hover text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong dark:bg-transparent dark:text-foreground-1 dark:hover:bg-neutral-900 dark:border-border-strong",
      )}
      aria-label={
        areAllVisibleSelected
          ? t("page.locationBundles.deselectAll")
          : t("page.locationBundles.selectAll")
      }
      disabled={visibleBundleIds.length === 0}
    >
      {areAllVisibleSelected ? (
        <CheckSquare className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
      ) : (
        <Square className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
      )}
      <span className="text-xs font-medium">
        {areAllVisibleSelected
          ? t("page.locationBundles.deselectAll")
          : t("page.locationBundles.selectAll")}
      </span>
    </button>
  );

  const renderFooter = (isMobileFooter = false) => (
    <div
      className={
        isMobileFooter
          ? "md:hidden bg-surface"
          : "hidden md:flex flex-col bg-surface shrink-0"
      }
    >
      <DashedDivider
        marginTop="mt-0"
        className="mb-0"
        paddingTop={isMobileFooter ? "pt-2" : "pt-4"}
        dashPattern="1 1"
      />
      <div
        className={
          isMobileFooter
            ? "flex justify-between gap-2 mt-0 md:mb-2 p-4"
            : "px-6 pb-2"
        }
      >
        <div
          className={
            isMobileFooter
              ? "contents"
              : "flex justify-between gap-2 mt-4 mb-3 md:mb-2"
          }
        >
          <Button
            type="button"
            variant="outline"
            rounded="full"
            onClick={handleClear}
            disabled={!hasChanges}
            className={`gap-2 h-11 cursor-pointer ${isMobileFooter ? "w-32" : "w-32 md:w-42"}`}
          >
            {t("page.locationBundles.buttons.clear")}
          </Button>
          <Button
            type="button"
            rounded="full"
            onClick={handleApply}
            disabled={!hasChanges}
            className={`group gap-2 h-11 cursor-pointer ${isMobileFooter ? "flex-1" : "w-72"}`}
          >
            {onSave
              ? t("page.locationBundles.buttons.saveChanges")
              : t("page.locationBundles.buttons.apply")}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const content = (
    <>
      <div className="p-4 flex flex-col gap-4 border-b border-border">
        <div className="flex gap-2 items-center">
          <SearchInput
            className="flex-1"
            placeholder={t("page.locationBundles.searchPlaceholder")}
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
            placeholder={t("page.locationBundles.sort.trigger")}
            className="flex-1 md:flex-none"
          />
          {renderSelectAllButton()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filteredBundles.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-1">
            {filteredBundles.map((bundle) => (
              <BundleItem
                key={bundle.bundleId}
                bundle={bundle}
                isSelected={selectedBundleIds.includes(bundle.bundleId)}
                searchTerm={searchTerm}
                currencyDisplay={currencyDisplay}
                onToggle={toggleBundle}
              />
            ))}
          </div>
        )}
      </div>

      {renderFooter(false)}
      {renderFooter(true)}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose} autoFocus={true}>
        <DrawerContent
          className="h-[85vh] flex flex-col bg-popover text-popover-foreground !z-80"
          overlayClassName="!z-80"
        >
          <DrawerTitle className="sr-only">
            {title || t("page.locationBundles.sheet.title")}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {title || t("page.locationBundles.sheet.title")}
          </DrawerDescription>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-80 bg-black/50 animate-in fade-in-0"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-80 flex items-center justify-center p-4 pointer-events-none">
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
                  {title && titleLocationName ? (
                    <>
                      {title.split(titleLocationName)[0]}
                      <span className="font-semibold">{titleLocationName}</span>
                    </>
                  ) : title ? (
                    title
                  ) : (
                    t("page.locationBundles.sheet.title")
                  )}
                </h2>
                {subtitle && (
                  <p className="text-sm text-foreground-3 dark:text-foreground-2 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hidden md:flex absolute right-4 top-4 h-8 w-8 rounded-md hover:bg-surface-hover active:bg-surface-active"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <DashedDivider
              marginTop="mt-3"
              className="pt-0 md:pt-3"
              dashPattern="1 1"
            />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 pt-2 space-y-4 border-b border-border">
              <div className="md:flex md:gap-2 md:items-center">
                <div className="flex gap-2 items-center md:flex-1">
                  <SearchInput
                    className="flex-1"
                    placeholder={t("page.locationBundles.searchPlaceholder")}
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
                    placeholder={t("page.locationBundles.sort.trigger")}
                    className="flex-1 md:flex-none"
                  />
                  {renderSelectAllButton()}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex-1 space-y-1 scrollbar-hide relative",
                filteredBundles.length > 0
                  ? "overflow-y-auto"
                  : "overflow-hidden flex items-center justify-center",
                "p-4",
              )}
            >
              {filteredBundles.length === 0 ? (
                renderEmptyState()
              ) : (
                <div className="space-y-1">
                  {filteredBundles.map((bundle) => (
                    <BundleItem
                      key={bundle.bundleId}
                      bundle={bundle}
                      isSelected={selectedBundleIds.includes(bundle.bundleId)}
                      searchTerm={searchTerm}
                      currencyDisplay={currencyDisplay}
                      onToggle={toggleBundle}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {renderFooter(false)}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
