"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Edit, Clock, MapPin, Users, Bookmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import EditServiceSlider from "./EditServiceSlider";
import {
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "../../../categories/api";
import { listCategoriesAction } from "../../../categories/actions";
import { getCategoriesListSelector, getCategoriesLoadingSelector } from "../../../categories/selectors";
import type { Category as ServiceCategory } from "./CategorySection";
import type { Service } from "../../../../shared/types/service";
import {
  getFilteredServicesListSelector,
  getServicesListSelector,
  getServicesFilterSelector,
  getAddFormSelector,
  getServicesLoadingSelector,
} from "../../selectors.ts";
import { useDispatch, useSelector } from "react-redux";
import {
  getServicesAction,
  getServiceByIdAction,
  toggleAddFormAction,
} from "../../actions.ts";
import { ServiceFilters } from "./ServiceFilters.tsx";
import AddServiceSlider from "./AddServiceSlider";
import { ItemCard, type ItemCardMetadata, type ItemCardBadge } from "../../../../shared/components/common/ItemCard";
import { toast } from "sonner";
import ServicesListSkeleton from "./ServicesListSkeleton";
import { highlightMatches as highlight } from "../../../../shared/utils/highlight";

export function ServicesListTab() {
  const text = useTranslation("services").t;
  const services: Service[] = useSelector(getFilteredServicesListSelector);
  const allServices: Service[] = useSelector(getServicesListSelector);
  const filters = useSelector(getServicesFilterSelector);
  const isServicesLoading = useSelector(getServicesLoadingSelector);

  // Categories from Redux
  const reduxCategories = useSelector(getCategoriesListSelector);
  const isCategoriesLoading = useSelector(getCategoriesLoadingSelector);

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dialog states
  const isCreateSliderOpen = useSelector(getAddFormSelector);
  const [isEditSliderOpen, setIsEditSliderOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  // Local categories state for managing edits (before applying to backend)
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [initialCategories, setInitialCategories] = useState<ServiceCategory[]>([]);
  const [isCategoriesApplying, setIsCategoriesApplying] = useState(false);

  // Reset the "add form open" flag when leaving this page
  useEffect(() => {
    return () => {
      dispatch(toggleAddFormAction(false));
    };
  }, [dispatch]);

  // Check for URL parameters to auto-open sliders
  useEffect(() => {
    const openParam = searchParams.get("open");
    if (openParam === "add") {
      dispatch(toggleAddFormAction(true));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, dispatch]);

  // Load services and categories on mount
  useEffect(() => {
    dispatch(getServicesAction.request());
    dispatch(listCategoriesAction.request());
  }, [dispatch]);

  // Sync local categories state from Redux when categories are loaded/updated
  useEffect(() => {
    const mapped: ServiceCategory[] = reduxCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
    }));
    setCategories(mapped);
    setInitialCategories(mapped);
  }, [reduxCategories]);

  // Compute how many services are assigned to each category
  const categoriesWithServiceCounts: ServiceCategory[] = useMemo(() => {
    if (!services || services.length === 0) return categories;
    const counts = new Map<number, number>();

    services.forEach((service) => {
      const categoryId = service.category?.id;
      if (categoryId != null) {
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
      }
    });

    return categories.map((cat) => ({
      ...(cat as ServiceCategory & { servicesCount?: number }),
      servicesCount: counts.get(cat.id) ?? 0,
    }));
  }, [categories, services]);

  const hasCategoryChanges = useMemo(() => {
    if (categories.length !== initialCategories.length) {
      return true;
    }

    const initialById = new Map(initialCategories.map((c) => [c.id, c]));

    for (const cat of categories) {
      const initial = initialById.get(cat.id);
      if (!initial) return true;
      if (initial.name !== cat.name) return true;
      if ((initial.color || "") !== (cat.color || "")) return true;
    }

    return false;
  }, [categories, initialCategories]);

  const applyCategoryChanges = async (): Promise<void> => {
    setIsCategoriesApplying(true);
    // Compute diff between initialCategories and current categories
    const initialById = new Map(initialCategories.map((c) => [c.id, c]));
    const currentById = new Map(categories.map((c) => [c.id, c]));

    const created: ServiceCategory[] = categories.filter(
      (cat) => !initialById.has(cat.id)
    );

    const updated: ServiceCategory[] = categories.filter((cat) => {
      const initial = initialById.get(cat.id);
      if (!initial) return false;
      return (
        initial.name !== cat.name ||
        (initial.color || "") !== (cat.color || "")
      );
    });

    const deletedIds: number[] = initialCategories
      .filter((cat) => !currentById.has(cat.id))
      .map((cat) => cat.id);

    try {
      // Create new categories
      for (const cat of created) {
        await createCategoryApi({
          name: cat.name,
          color: cat.color,
        });
      }

      // Update existing categories
      for (const cat of updated) {
        await updateCategoryApi(cat.id, {
          name: cat.name,
          color: cat.color,
        });
      }

      // Delete removed categories
      for (const id of deletedIds) {
        await deleteCategoryApi(id);
      }

      // Reload canonical list
      dispatch(listCategoriesAction.request());
      // Also refresh services so cards pick up updated category names/colors
      dispatch(getServicesAction.request());
      toast.success(text("addService.form.category.manageApplySuccess"));
    } catch (error) {
      console.error("Failed to apply category changes:", error);
      toast.error(text("addService.form.category.manageApplyError"));
    } finally {
      setIsCategoriesApplying(false);
    }
  };

  const resetCategoriesToInitial = () => {
    setCategories(initialCategories);
  };

  const openEditSlider = (service: Service) => {
    dispatch(getServiceByIdAction.request(service.id));
    setEditingService(service);
    setIsEditSliderOpen(true);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  // Highlight helper using shared utility
  const highlightMatches = (text: string) => {
    return highlight(text, filters.searchTerm ?? "");
  };

  const isPageLoading = isServicesLoading || isCategoriesLoading || isCategoriesApplying;

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    const hasSearch = filters.searchTerm.trim().length > 0;
    const hasPriceFilter = 
      (filters.priceMin !== "" && filters.priceMin !== "0") ||
      (filters.priceMax !== "" && filters.priceMax !== "0");
    const hasDurationFilter = 
      filters.durationMin !== "" || filters.durationMax !== "";
    const hasCategoryFilter = 
      Array.isArray(filters.categoryIds) && filters.categoryIds.length > 0;
    
    return hasSearch || hasPriceFilter || hasDurationFilter || hasCategoryFilter;
  }, [filters]);

  // Determine empty state type
  const isEmptyState = services.length === 0;
  const hasNoServicesAtAll = allServices.length === 0;
  const isFilteredEmpty = isEmptyState && !hasNoServicesAtAll && hasActiveFilters;

  return (
    <div className="space-y-6">
      {/* While services are loading, show full-page skeleton (including filters) */}
      {isPageLoading ? (
        <ServicesListSkeleton />
      ) : (
        <>
          <ServiceFilters
            categories={categoriesWithServiceCounts as any}
            onCategoriesChange={(updated) => setCategories(updated as any)}
            onResetCategories={resetCategoriesToInitial}
            hasCategoryChanges={hasCategoryChanges}
            onApplyCategoryChanges={applyCategoryChanges}
            isApplyingCategories={isCategoriesApplying}
          />

          {/* Helper text with total number of services + divider (matching StepLaunch) */}
          {services.length > 0 && (
            <div className="flex items-end gap-1 mb-6">
              <p className="text-sm text-foreground-3 dark:text-foreground-2 cursor-default">
                {text("page.stats.helperTotalPrefix")}{" "}
                <span className="font-semibold text-foreground-1">
                  {services.length}{" "}
                  {text(
                    services.length === 1
                      ? "page.stats.helperTotalServiceOne"
                      : "page.stats.helperTotalServiceOther"
                  )}
                </span>{" "}
                {text("page.stats.helperTotalSuffix")}
              </p>
              <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
            </div>
          )}

          {/* Services List */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {services.map((service) => {
            // Build metadata array (only duration now)
            const metadata: ItemCardMetadata[] = [
              {
                icon: Clock,
                label: "duration",
                value: formatDuration(service.duration),
              },
            ];

            // Build badges array (locations and team members)
            const badges: ItemCardBadge[] = [];
            
            const locationsCount = service.locations?.length ?? service.locationsCount ?? 0;
            if (locationsCount > 0) {
              badges.push({
                label: locationsCount === 1
                  ? text("page.service.metadata.location")
                  : text("page.service.metadata.locations"),
                count: locationsCount,
                icon: MapPin,
              });
            }

            const teamMembersCount = service.teamMembers?.length ?? service.teamMembersCount ?? 0;
            if (teamMembersCount > 0) {
              badges.push({
                label: teamMembersCount === 1
                  ? text("page.service.metadata.teamMember")
                  : text("page.service.metadata.teamMembers"),
                count: teamMembersCount,
                icon: Users,
              });
            }

            return (
              <ItemCard
                key={service.id}
                title={highlightMatches(service.name)}
                category={
                  service.category
                    ? {
                        name: highlightMatches(service.category.name),
                        color: service.category.color,
                        icon: Bookmark,
                      }
                    : null
                }
                badges={badges}
                metadata={metadata}
                price={service.price}
                actions={[
                  {
                    icon: Edit,
                    label: text("page.service.actions.edit"),
                    onClick: (e) => {
                      e.stopPropagation();
                      openEditSlider(service);
                    },
                  },
                ]}
                onClick={() => openEditSlider(service)}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State - premium SaaS pattern with realistic skeleton cards */
        <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
          {/* Abstract cards illustration with enhanced depth */}
          <div className="relative w-full max-w-md h-44 text-left">
            {/* Subtle background glow */}
            <div className="absolute inset-0 -top-4 -bottom-4 bg-gradient-to-b from-primary/5 dark:from-primary/10 via-transparent to-transparent blur-2xl opacity-50 dark:opacity-40" />
            
            {/* back cards with better shadows */}
            <div className="absolute inset-x-10 top-2 h-28 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-border shadow-lg opacity-70 rotate-[-14deg] blur-[0.5px]" />
            <div className="absolute inset-x-6 top-10 h-30 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-border shadow-xl opacity-85 rotate-[10deg] blur-[0.5px]" />

            {/* front skeleton card - more realistic service card */}
            <div className="absolute inset-x-2 top-6 h-32 rounded-2xl bg-surface dark:bg-neutral-900 border border-border shadow-xl overflow-hidden">
              <div className="h-full w-full px-5 py-4 flex flex-col gap-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Icon placeholder */}
                    <div className="h-12 w-12 rounded-lg bg-neutral-300 dark:bg-neutral-800 flex-shrink-0" />
                    {/* Title and metadata */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="h-4 w-36 rounded bg-neutral-300 dark:bg-neutral-800" />
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-16 rounded-full bg-neutral-300/80 dark:bg-neutral-800/80" />
                        <div className="h-2.5 w-12 rounded-full bg-neutral-300/70 dark:bg-neutral-800/70" />
                      </div>
                    </div>
                  </div>
                  {/* Price placeholder */}
                  <div className="h-5 w-16 rounded bg-neutral-300 dark:bg-neutral-800 flex-shrink-0" />
                </div>
                
                {/* Badge row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="h-5 w-20 rounded-full bg-neutral-300/90 dark:bg-neutral-800/90" />
                  <div className="h-5 w-16 rounded-full bg-neutral-300/80 dark:bg-neutral-800/80" />
                </div>
              </div>
            </div>
          </div>

          {/* Copy with better spacing */}
          <div className="space-y-2 max-w-md px-4">
            <h3 className="text-lg font-semibold text-foreground-1">
              {isFilteredEmpty 
                ? text("page.emptyState.noResults")
                : text("page.emptyState.noServices")}
            </h3>
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
              {isFilteredEmpty
                ? text("page.emptyState.noResultsDescription")
                : text("page.emptyState.noServicesDescription")}
            </p>
          </div>
        </div>
      )}

      {/* Add Service Slider */}
      <AddServiceSlider
        isOpen={isCreateSliderOpen}
        onClose={() => {
          dispatch(toggleAddFormAction(false));
        }}
        categories={initialCategories}
      />

      {/* Edit Service Slider */}
      <EditServiceSlider
        isOpen={isEditSliderOpen}
        onClose={() => {
          setIsEditSliderOpen(false);
        }}
        service={editingService}
        categories={initialCategories}
      />
      </>
      )}
    </div>
  );
}
