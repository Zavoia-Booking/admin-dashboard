import { type FC, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../../../../shared/components/ui/drawer";
import { Button } from "../../../../shared/components/ui/button";
import { SearchInput } from "../../../../shared/components/common/SearchInput";
import { DashedDivider } from "../../../../shared/components/common/DashedDivider";
import { ServiceItem } from "../../../../shared/components/common/ManageServicesSheet/ServiceItem";
import { CategoryAccordion } from "../../../../shared/components/common/ManageServicesSheet/CategoryAccordion";
import type {
  Service,
  CategoryGroup,
} from "../../../../shared/components/common/ManageServicesSheet/types";
import { getCurrencyDisplay } from "../../../../shared/utils/currency";
import { selectCurrentUser } from "../../../auth/selectors";

export interface ServicePickerOption {
  id: number;
  label: string;
  price?: number;
  duration?: number;
  category?: { id: number; name: string; color?: string } | null;
}

export interface BundlePickerOption {
  id: number;
  label: string;
  price?: number;
  duration?: number;
}

export interface MobileServiceBundlePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOptions: ServicePickerOption[];
  bundleOptions: BundlePickerOption[];
  serviceIds: number[];
  bundleIds: number[];
  onApply: (next: {
    serviceIds: number[] | undefined;
    bundleIds: number[] | undefined;
  }) => void;
}

const UNCATEGORIZED_KEY = -1;

/**
 * Full-screen mobile picker for the calendar service/bundle filter.
 *
 * Design mirrors `ManageServicesSheet`: search input at the top, services
 * grouped in colored-category accordions (`CategoryAccordion` + `ServiceItem`),
 * then a "Bundles" section using the same row treatment. The interaction is
 * filter-specific though: tap to toggle (applies immediately to the parent
 * draft), tap Done to dismiss.
 */
export const MobileServiceBundlePicker: FC<MobileServiceBundlePickerProps> = ({
  open,
  onOpenChange,
  serviceOptions,
  bundleOptions,
  serviceIds,
  bundleIds,
  onApply,
}) => {
  const { t } = useTranslation("calendar");
  const { t: tServices } = useTranslation("services");
  const [search, setSearch] = useState("");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
  const contentRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";
  const currencyDisplay = useMemo(
    () => getCurrencyDisplay(businessCurrency),
    [businessCurrency],
  );
  const durationUnit = tServices("duration.minutesShort", { defaultValue: "min" });

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const matchesSearch = (label: string): boolean => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return label.toLowerCase().includes(q);
  };

  const filteredServices = useMemo(
    () => serviceOptions.filter((s) => matchesSearch(s.label)),
    [serviceOptions, search],
  );

  const filteredBundles = useMemo(
    () => bundleOptions.filter((b) => matchesSearch(b.label)),
    [bundleOptions, search],
  );

  /** Services grouped by category — same `CategoryGroup` shape `CategoryAccordion` expects. */
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const map = new Map<number, CategoryGroup>();
    for (const s of filteredServices) {
      const catId = s.category?.id ?? UNCATEGORIZED_KEY;
      const catName = s.category?.name ?? tServices("categories.uncategorized", { defaultValue: "Uncategorized" });
      const catColor = s.category?.color;
      if (!map.has(catId)) {
        map.set(catId, {
          categoryId: catId === UNCATEGORIZED_KEY ? null : catId,
          categoryName: catName,
          categoryColor: catColor,
          services: [],
        });
      }
      const svc: Service = {
        id: s.id,
        name: s.label,
        price: s.price,
        duration: s.duration,
        category: s.category ?? null,
      };
      map.get(catId)!.services.push(svc);
    }
    return [...map.values()].sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [filteredServices, tServices]);

  /** Auto-expand all categories when a search is active so matches are visible. */
  useEffect(() => {
    if (search.trim() === "") return;
    const next = new Set<number>();
    for (const g of categoryGroups) {
      next.add(g.categoryId ?? UNCATEGORIZED_KEY);
    }
    setExpandedCategoryIds(next);
  }, [search, categoryGroups]);

  /** Default to all categories expanded — same UX as ManageServicesSheet's
   *  `expandAllCategories` mode. User can still collapse individual groups. */
  useEffect(() => {
    if (!open) return;
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      for (const g of categoryGroups) {
        next.add(g.categoryId ?? UNCATEGORIZED_KEY);
      }
      return next;
    });
  }, [open, categoryGroups]);

  const hasSelection = serviceIds.length > 0 || bundleIds.length > 0;
  const nothingMatches =
    search.trim() !== "" && filteredServices.length === 0 && filteredBundles.length === 0;

  const toggleService = (idRaw: number) => {
    const id = Number(idRaw);
    const set = new Set(serviceIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const next = [...set].sort((a, b) => a - b);
    onApply({
      serviceIds: next.length ? next : undefined,
      bundleIds: bundleIds.length ? bundleIds : undefined,
    });
  };

  const toggleBundle = (id: number) => {
    const set = new Set(bundleIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const next = [...set].sort((a, b) => a - b);
    onApply({
      serviceIds: serviceIds.length ? serviceIds : undefined,
      bundleIds: next.length ? next : undefined,
    });
  };

  const toggleCategoryExpanded = (categoryId: number | null) => {
    const key = categoryId ?? UNCATEGORIZED_KEY;
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleClearAll = () => {
    onApply({ serviceIds: undefined, bundleIds: undefined });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} autoFocus={false}>
      <DrawerContent
        className="h-[85vh] flex flex-col bg-popover text-popover-foreground !z-[90]"
        overlayClassName="!z-[85]"
      >
        <DrawerHeader className="shrink-0 pb-2">
          <DrawerTitle>{t("page.filters.filterByServiceLabel")}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("page.filters.searchServicesPlaceholder")}
          </DrawerDescription>
          <div className="pt-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("page.filters.searchServicesPlaceholder")}
              aria-label={t("page.filters.filterByServiceLabel")}
              className="w-full"
              inputClassName="border-border"
            />
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Services, grouped by category via CategoryAccordion */}
          {categoryGroups.length > 0 && (
            <div className="space-y-2">
              {categoryGroups.map((group) => {
                const key = group.categoryId ?? UNCATEGORIZED_KEY;
                return (
                  <CategoryAccordion
                    key={`cat-${key}`}
                    group={group}
                    isExpanded={expandedCategoryIds.has(key)}
                    selectedServiceIds={serviceIds}
                    searchTerm={search}
                    currencyDisplay={currencyDisplay}
                    durationUnit={durationUnit}
                    onToggleExpand={toggleCategoryExpanded}
                    onToggleService={toggleService}
                    contentRef={(el) => contentRefs.current.set(key, el)}
                  />
                );
              })}
            </div>
          )}

          {/* Bundles — reuse ServiceItem row treatment under their own header */}
          {filteredBundles.length > 0 && (
            <div className="mt-5">
              <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("page.filters.bundlesGroup")}
              </div>
              <div className="space-y-1">
                {filteredBundles.map((bnd) => (
                  <ServiceItem
                    key={`bnd-${bnd.id}`}
                    service={{
                      id: bnd.id,
                      name: bnd.label,
                      price: bnd.price,
                      duration: bnd.duration,
                    }}
                    isSelected={bundleIds.includes(bnd.id)}
                    searchTerm={search}
                    currencyDisplay={currencyDisplay}
                    durationUnit={durationUnit}
                    onToggle={toggleBundle}
                  />
                ))}
              </div>
            </div>
          )}

          {nothingMatches && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("page.filters.noMatchingServiceOrBundle")}
            </div>
          )}
        </div>

        {/* Footer — mirrors ManageServicesSheet's mobile pattern: Clear (outline, w-32)
         *  + primary action with ArrowRight that slides on hover/press. */}
        <div className="bg-surface shrink-0">
          <DashedDivider marginTop="mt-0" className="mb-0" paddingTop="pt-2" dashPattern="1 1" />
          <div className="flex justify-between gap-2 p-4">
            <Button
              type="button"
              variant="outline"
              rounded="full"
              onClick={handleClearAll}
              disabled={!hasSelection}
              className="gap-2 h-11 w-32 cursor-pointer"
            >
              {tServices("manageServices.clear")}
            </Button>
            <Button
              type="button"
              rounded="full"
              onClick={() => onOpenChange(false)}
              className="group gap-2 h-11 flex-1 cursor-pointer"
            >
              {t("page.common.done", { defaultValue: "Done" })}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
