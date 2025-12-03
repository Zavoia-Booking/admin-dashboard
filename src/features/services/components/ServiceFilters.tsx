import { type FC, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ServiceFilterState } from "../types.ts";
import { getDefaultServiceFilters } from "../utils.ts";
import { useDispatch, useSelector } from "react-redux";
import { BadgeList } from "./BadgeList.tsx";
import { setServiceFilterAction, toggleAddFormAction } from "../actions.ts";
import { Filter, Plus } from "lucide-react";
import { Button } from "../../../shared/components/ui/button.tsx";
import { SearchInput } from "../../../shared/components/common/SearchInput";
import {
  SortSelect,
  type SortOption,
  type SortGroup,
} from "../../../shared/components/common/SortSelect";
import { Popover, PopoverContent, PopoverTrigger } from "../../../shared/components/ui/popover";
import { Input } from "../../../shared/components/ui/input";
import { PriceField } from "../../../shared/components/forms/fields/PriceField";
import { selectCurrentUser } from "../../auth/selectors";
import { getServicesFilterSelector } from "../selectors";
import { getCurrencyDisplay } from "../../../shared/utils/currency";
import { getColorHex, getReadableTextColor } from "../../../shared/utils/color";
import {
  ArrowDown01,
  ArrowUp01,
  Timer,
  CalendarClock,
  History,
  Clock,
  Bookmark,
} from "lucide-react";
import CategorySection, { type Category } from "./CategorySection";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";

interface ServiceFiltersProps {
  categories: Category[];
  onCategoriesChange?: (categories: Category[]) => void;
  onResetCategories?: () => void;
  hasCategoryChanges?: boolean;
  onApplyCategoryChanges?: () => Promise<void>;
  isApplyingCategories?: boolean;
}

export const ServiceFilters: FC<ServiceFiltersProps> = ({
  categories,
  onCategoriesChange,
  onResetCategories,
  hasCategoryChanges = false,
  onApplyCategoryChanges,
  isApplyingCategories = false,
}) => {
  const text = useTranslation("services").t;
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const businessCurrency = currentUser?.business?.businessCurrency || "eur";
  const MAX_VISIBLE_CATEGORIES = 6;
  const appliedFilters = useSelector(getServicesFilterSelector);
  const [localFilters, setLocalFilters] = useState<ServiceFilterState>(
    appliedFilters || getDefaultServiceFilters()
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [manageCategoryId, setManageCategoryId] = useState<number | null>(null);
  const [manageCategoryName, setManageCategoryName] = useState("");
  const [manageCategoryColor, setManageCategoryColor] = useState("");
  const [showManageConfirm, setShowManageConfirm] = useState(false);

  // Keep local editable filters in sync with the last applied filters from Redux.
  // This ensures that closing the popover without clicking "Apply" does NOT change
  // the applied filters, and the UI (badges, etc.) always reflects the applied state.
  useEffect(() => {
    setLocalFilters(appliedFilters || getDefaultServiceFilters());
  }, [appliedFilters]);

  const getDisplayColor = (cat: Category): string => {
    if (cat?.color && cat.color.startsWith("#")) {
      return cat.color;
    }
    return getColorHex(cat?.name || "");
  };

  const getTextColor = (bgColor: string): string =>
    getReadableTextColor(bgColor);

  const handleClearFilters = useCallback(() => {
    const reset = getDefaultServiceFilters();
    setLocalFilters(reset);
    setShowFilters(false);
    setShowAllCategories(false);
    dispatch(setServiceFilterAction.request(reset));
  }, [dispatch]);

  const handleApplyFilters = useCallback(
    (nextFilters: ServiceFilterState) => {
      setLocalFilters(nextFilters);
      setShowFilters(false);
      dispatch(setServiceFilterAction.request(nextFilters));
    },
    [dispatch]
  );

  const getActiveFilterCount = useCallback(() => {
    const {
      priceMin,
      priceMax,
      durationMin,
      durationMax,
      categoryIds,
    } = appliedFilters;

    // Treat empty string and "0" as "no price filter" to stay in sync with
    // selector + badges behavior.
    const hasPriceMin = priceMin !== "" && priceMin !== "0";
    const hasPriceMax = priceMax !== "" && priceMax !== "0";
    const categoryCount = Array.isArray(categoryIds) ? categoryIds.length : 0;

    let count = 0;
    if (durationMax) count += 1;
    if (durationMin) count += 1;
    if (hasPriceMin) count += 1;
    if (hasPriceMax) count += 1;
    count += categoryCount;

    return count;
  }, [appliedFilters]);

  const priceOptions: SortOption[] = [
    { value: "price_asc", label: text("sort.priceAsc"), icon: ArrowUp01 },
    { value: "price_desc", label: text("sort.priceDesc"), icon: ArrowDown01 },
  ];

  const durationOptions: SortOption[] = [
    { value: "duration_asc", label: text("sort.durationAsc"), icon: Timer },
    { value: "duration_desc", label: text("sort.durationDesc"), icon: Timer },
  ];

  const createdAtOptions: SortOption[] = [
    {
      value: "createdAt_desc",
      label: text("sort.createdAtDesc"),
      icon: CalendarClock,
    },
    {
      value: "createdAt_asc",
      label: text("sort.createdAtAsc"),
      icon: CalendarClock,
    },
  ];

  const updatedAtOptions: SortOption[] = [
    {
      value: "updatedAt_desc",
      label: text("sort.updatedAtDesc"),
      icon: History,
    },
    {
      value: "updatedAt_asc",
      label: text("sort.updatedAtAsc"),
      icon: History,
    },
  ];

  const sortGroups: SortGroup[] = [
    { label: text("sort.groupPrice"), options: priceOptions },
    { label: text("sort.groupDuration"), options: durationOptions },
    { label: text("sort.groupCreatedAt"), options: createdAtOptions },
    { label: text("sort.groupUpdatedAt"), options: updatedAtOptions },
  ];

  const currentSortValue = `${localFilters.sortField}_${localFilters.sortDirection}`;

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <SearchInput
            className="flex-1"
            placeholder={text("filters.searchPlaceholder")}
            value={localFilters.searchTerm}
            onChange={(value) => {
              setLocalFilters((prevState) => ({
                ...prevState,
                searchTerm: value,
              }));
            }}
            onDebouncedChange={(value) => {
              const updatedFilters: ServiceFilterState = {
                ...localFilters,
                searchTerm: value,
              };
              handleApplyFilters(updatedFilters);
            }}
          />
          <Button
            type="button"
            size="lg"
            rounded="full"
            className="h-11 px-5 !min-w-52 md:px-6 font-semibold group active:scale-95 transition-transform"
            onClick={() => {
              dispatch(toggleAddFormAction(true));
            }}
          >
            <Plus className="h-5 w-5" />
            <span>{text("page.actions.addService")}</span>
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <SortSelect
            value={currentSortValue}
            onValueChange={(value) => {
              const [field, direction] = value.split("_");
              const newFilters: ServiceFilterState = {
                ...localFilters,
                sortField: field as any,
                sortDirection: direction as any,
              };
              setLocalFilters(newFilters);
              dispatch(setServiceFilterAction.request(newFilters));
            }}
            groups={sortGroups}
            placeholder={text("sort.trigger")}
          />

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
                aria-label={text("filters.showFiltersAria")}
              >
                <Filter className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
                <span className="text-xs font-medium">
                  {text("filters.addFilter")}
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
              className="w-[380px] max-h-128 overflow-y-auto p-4 bg-surface border border-border shadow-md rounded-xl space-y-4"
            >
              {/* By Price */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text("filters.byPrice")}
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
                    label={text("filters.minPriceLabel")}
                    placeholder={text("filters.minPricePlaceholder")}
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
                    label={text("filters.maxPriceLabel")}
                    placeholder={text("filters.maxPricePlaceholder")}
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

              {/* By Duration */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text("filters.byDuration")}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Min duration */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-foreground-2">
                      {text("filters.minDurationLabel")}
                    </span>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Clock className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
                      </div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={localFilters.durationMin}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === "" || /^\d+$/.test(inputValue)) {
                            setLocalFilters((prev) => ({
                              ...prev,
                              durationMin: inputValue,
                            }));
                          }
                        }}
                        placeholder={text("filters.minDurationPlaceholder")}
                        className="h-9 w-full text-sm !pl-10 !pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                      />
                    </div>
                  </div>

                  {/* Max duration */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-foreground-2">
                      {text("filters.maxDurationLabel")}
                    </span>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Clock className="h-4 w-4 text-foreground-3 dark:text-foreground-2" />
                      </div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={localFilters.durationMax}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === "" || /^\d+$/.test(inputValue)) {
                            setLocalFilters((prev) => ({
                              ...prev,
                              durationMax: inputValue,
                            }));
                          }
                        }}
                        placeholder={text("filters.maxDurationPlaceholder")}
                        className="h-9 w-full text-sm !pl-10 !pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border-subtle" />

              {/* By Category */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text("filters.byCategory")}
                </div>
                {categories.length === 0 ? (
                  <p className="text-xs text-foreground-3">
                    {text("filters.noCategories")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(
                      showAllCategories
                        ? categories
                        : categories.slice(0, MAX_VISIBLE_CATEGORIES)
                    ).map((category) => {
                      const isSelected = Array.isArray(localFilters.categoryIds)
                        ? localFilters.categoryIds.includes(category.id)
                        : false;
                      const bgColor = getDisplayColor(category);
                      const textColor = getTextColor(bgColor);

                      return (
                        <Button
                          key={category.id}
                          type="button"
                          variant="outline"
                          rounded="full"
                          className={`h-auto px-5 py-1.5 gap-2 relative !transition-none text-xs font-medium ${
                            isSelected
                              ? "border-neutral-500 text-neutral-900 dark:text-neutral-900 shadow-xs focus-visible:!border-neutral-500"
                              : "border-border opacity-100"
                          } hover:!border-border ${
                            isSelected ? "hover:!border-neutral-500" : ""
                          }`}
                          onClick={() => {
                            const currentIds = Array.isArray(
                              localFilters.categoryIds
                            )
                              ? localFilters.categoryIds
                              : [];

                            const nextCategoryIds = isSelected
                              ? currentIds.filter((id) => id !== category.id)
                              : [...currentIds, category.id];

                            const nextFilters: ServiceFilterState = {
                              ...localFilters,
                              categoryIds: nextCategoryIds,
                            };

                            setLocalFilters(nextFilters);
                          }}
                          style={{
                            backgroundColor: bgColor,
                            color: isSelected ? undefined : textColor,
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
                          <span className="truncate max-w-[130px]">
                            {category.name}
                          </span>
                        </Button>
                      );
                    })}

                    {categories.length > MAX_VISIBLE_CATEGORIES &&
                      !showAllCategories && (
                        <Button
                          type="button"
                          variant="outline"
                          rounded="full"
                          onClick={() => setShowAllCategories(true)}
                          className="h-auto px-3 py-1.5 gap-1.5 border-dashed"
                        >
                          {text("addService.form.category.showMore", {
                            count: categories.length - MAX_VISIBLE_CATEGORIES,
                          })}
                        </Button>
                      )}

                    {categories.length > MAX_VISIBLE_CATEGORIES &&
                      showAllCategories && (
                        <Button
                          type="button"
                          variant="outline"
                          rounded="full"
                          onClick={() => setShowAllCategories(false)}
                          className="h-auto px-3 py-1.5 gap-1.5 border-dashed"
                        >
                          {text("addService.form.category.showLess")}
                        </Button>
                      )}
                  </div>
                )}
              </div>

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
                  {text("filters.clearAll")}
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
                  {text("filters.apply")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover
            open={showManageCategories}
            onOpenChange={(open) => {
              // While the confirmation dialog is open, keep the popover mounted
              if (showManageConfirm) return;
              setShowManageCategories(open);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                rounded="full"
                className="h-9 px-3 py-1.5 gap-1.5 text-xs font-medium border border-dashed border-border-strong dark:bg-transparent dark:hover:bg-neutral-900 dark:border-border-strong"
              >
                <Bookmark className="h-4 w-4 text-foreground-3 dark:text-foreground-1" />
                <span className="dark:text-foreground-1">
                  {text("addService.form.category.manageCategoriesLink")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={8}
              onOpenAutoFocus={(event) => event.preventDefault()}
              className="w-[520px] max-h-128 overflow-y-auto p-4 bg-surface border border-border shadow-md rounded-xl space-y-4"
            >
              <CategorySection
                categoryId={manageCategoryId}
                categoryName={manageCategoryName}
                categoryColor={manageCategoryColor}
                onCategoryIdChange={setManageCategoryId}
                onCategoryNameChange={setManageCategoryName}
                onCategoryColorChange={setManageCategoryColor}
                existingCategories={categories}
                onNewCategoryCreated={(newCategory) => {
                  onCategoriesChange?.(
                    categories.some((c) => c.id === newCategory.id)
                      ? categories
                      : [...categories, newCategory]
                  );
                }}
                onCategoryRemoved={(removedCategoryId) => {
                  onCategoriesChange?.(
                    categories.filter((c) => c.id !== removedCategoryId)
                  );
                }}
                onNewlyCreatedCategoriesChange={(newCategories) => {
                  // Ensure parent also gets the full up-to-date list of categories
                  const existingById = new Map(categories.map((c) => [c.id, c]));
                  newCategories.forEach((cat) => {
                    existingById.set(cat.id, { ...existingById.get(cat.id), ...cat });
                  });
                  onCategoriesChange?.(Array.from(existingById.values()));
                }}
                required={false}
                error={undefined}
                showManageCategoriesHelper={false}
                customTitle={text("addService.form.category.managePopoverTitle")}
                customSubtitle={text("addService.form.category.managePopoverDescription")}
                customHelperText={text("addService.form.category.managePopoverHelperText")}
                helperPlacement="footer"
                showSelectLabel={false}
                enableInlineEdit
                onCategoriesChange={onCategoriesChange}
              />
              <div className="flex justify-end gap-2 border-t border-border-subtle mt-3 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  rounded="full"
                  className="group inline-flex items-center gap-1.5 px-4 py-2 font-medium cursor-pointer transition-transform active:scale-95"
                  disabled={!hasCategoryChanges}
                  onClick={() => hasCategoryChanges && onResetCategories?.()}
                >
                  {text("addService.form.category.manageFooterClear")}
                </Button>
                <Button
                  size="sm"
                  rounded="full"
                  className="group inline-flex items-center gap-1.5 px-6 py-2 !min-w-40 justify-center font-semibold cursor-pointer transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasCategoryChanges || isApplyingCategories}
                  onClick={() => hasCategoryChanges && setShowManageConfirm(true)}
                >
                  {text("addService.form.category.manageFooterApply")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <BadgeList
        filters={appliedFilters}
        changeFilters={handleApplyFilters}
        categories={categories}
      />

      <ConfirmDialog
        open={showManageConfirm}
        onOpenChange={setShowManageConfirm}
        onConfirm={async () => {
          if (!onApplyCategoryChanges) {
            setShowManageConfirm(false);
            return;
          }
          await onApplyCategoryChanges();
          setShowManageCategories(false);
          setShowManageConfirm(false);
        }}
        onCancel={() => setShowManageConfirm(false)}
        title={text("addService.form.category.manageConfirmTitle")}
        description={text("addService.form.category.manageConfirmDescription")}
        confirmTitle={text("addService.form.category.manageConfirmConfirm")}
        cancelTitle={text("addService.form.category.manageConfirmCancel")}
        showCloseButton={true}
      />
    </>
  );
};
