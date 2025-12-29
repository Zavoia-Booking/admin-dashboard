import React, { useEffect, useRef, useState } from "react";
import { Plus, Check, Shuffle, X } from "lucide-react";
import { Label } from "../../../../shared/components/ui/label";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { useTranslation } from "react-i18next";
import { getColorHex, getReadableTextColor } from "../../../../shared/utils/color";
import { validateCategoryName } from "../../../../shared/utils/validation";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../../../shared/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

export interface Category {
  id: number;
  name: string;
  color?: string;
  servicesCount?: number;
}

export interface CategorySectionProps {
  categoryId?: number | null;
  categoryName?: string;
  categoryColor?: string;
  onCategoryIdChange: (value: number | null) => void;
  onCategoryNameChange: (value: string) => void;
  onCategoryColorChange: (value: string) => void;
  existingCategoryName?: string;
  existingCategories?: Category[]; // List of existing categories to choose from
  required?: boolean;
  error?: string;
  onNewCategoryCreated?: (category: Category) => void; // Callback when new category is created inline
  onCategoryRemoved?: (categoryId: number) => void; // Callback when a newly created category is removed
  onNewlyCreatedCategoriesChange?: (categories: Category[]) => void; // Callback when newly created categories change
  customTitle?: string;
  customSubtitle?: string;
  customHelperText?: string;
  helperPlacement?: "header" | "footer";
  showSelectLabel?: boolean;
  enableInlineEdit?: boolean;
  onCategoriesChange?: (categories: Category[]) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  onCategoryIdChange,
  onCategoryNameChange,
  onCategoryColorChange,
  existingCategoryName,
  existingCategories = [],
  required = false,
  error,
  onNewCategoryCreated,
  onCategoryRemoved,
  onNewlyCreatedCategoriesChange,
  customTitle,
  customSubtitle,
  customHelperText,
  helperPlacement = "header",
  showSelectLabel = true,
  enableInlineEdit = false,
  onCategoriesChange,
}) => {
  const text = useTranslation("services").t;
  const lastCategoryNameRef = useRef<string>("");
  const MAX_VISIBLE_CATEGORIES = 6;
  const MAX_CATEGORIES = 25;
  const [isCreating, setIsCreating] = useState(false);
  const [createInputValue, setCreateInputValue] = useState("");
  const [createColor, setCreateColor] = useState("");
  const [createError, setCreateError] = useState("");
  const [localCategories, setLocalCategories] =
    useState<Category[]>(existingCategories);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [newlyCreatedIds, setNewlyCreatedIds] = useState<Set<number>>(
    new Set()
  );
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [editInputValue, setEditInputValue] = useState("");
  const [editError, setEditError] = useState("");
  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const prevNewlyCreatedIdsRef = useRef<string>("");

  // Sync local categories when existingCategories prop changes
  useEffect(() => {
    // When existingCategories changes (form reset/reopen), clear newly created categories
    // Only show categories that exist in the database
    const sorted = [...existingCategories].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setLocalCategories(sorted);
    // Reset newly created IDs when existing categories change (form reset)
    setNewlyCreatedIds(new Set());
  }, [existingCategories]);

  // Auto-generate color based on category name when creating (debounced)
  useEffect(() => {
    if (isCreating && createInputValue && createInputValue.trim()) {
      // Only generate color if category name changed
      if (lastCategoryNameRef.current !== createInputValue) {
        // Update ref immediately to prevent multiple debounce timers
        lastCategoryNameRef.current = createInputValue;

        // Debounce color update by 150ms to avoid flashing on every keystroke
        const timeoutId = setTimeout(() => {
          const generatedColor = getColorHex(createInputValue);
          setCreateColor(generatedColor);
        }, 150);

        return () => clearTimeout(timeoutId);
      }
    } else if (!createInputValue || !createInputValue.trim()) {
      lastCategoryNameRef.current = "";
      setCreateColor("");
    }
  }, [createInputValue, isCreating]);

  // Focus input when creating mode is activated
  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreating]);

  // Focus input when editing an existing category
  useEffect(() => {
    if (enableInlineEdit && editingCategoryId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [enableInlineEdit, editingCategoryId]);

  // Scroll to section when error is shown
  useEffect(() => {
    if (error && sectionRef.current) {
      sectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [error]);

  // Get the color to display (shared logic with filters via color utils)
  const getDisplayColor = (cat: Category | null): string => {
    if (cat?.color && cat.color.startsWith("#")) {
      return cat.color;
    }
    return getColorHex(
      cat?.name || createInputValue || existingCategoryName || ""
    );
  };

  // Calculate text color for contrast (black or white)
  const getTextColor = (bgColor: string): string =>
    getReadableTextColor(bgColor);

  const handleSelectCategory = (category: Category) => {
    if (enableInlineEdit) {
      setEditingCategoryId(category.id);
      setEditInputValue(category.name);
      setEditError("");
      setIsCreating(false);
      return;
    }

    // Only allow selection (not deselection via click)
    // For removable categories, deselection happens via the X button
    if (categoryId !== category.id) {
      onCategoryIdChange(category.id);
      onCategoryNameChange("");
      onCategoryColorChange("");
    }
  };

  const handleRemoveCategory = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the category selection

    // Remove from local categories
    const updatedCategories = localCategories.filter(
      (cat) => cat.id !== category.id
    );
    setLocalCategories(updatedCategories);

    // Remove from newly created set
    setNewlyCreatedIds((prev) => {
      const next = new Set(prev);
      next.delete(category.id);
      return next;
    });

    // If this category was selected, deselect it
    if (categoryId === category.id) {
      onCategoryIdChange(null);
      onCategoryNameChange("");
      onCategoryColorChange("");
    }

    // Notify parent if callback provided
    if (onCategoryRemoved) {
      onCategoryRemoved(category.id);
    }

    if (onCategoriesChange) {
      onCategoriesChange(
        localCategories.filter((cat) => cat.id !== category.id)
      );
    }
  };

  const handleStartCreating = () => {
    setIsCreating(true);
    setCreateInputValue("");
    setCreateColor("");
    setCreateError("");
    lastCategoryNameRef.current = ""; // Reset ref so first keystroke is also debounced
    onCategoryIdChange(null);
    onCategoryNameChange("");
    onCategoryColorChange("");
  };

  const handleCancelCreating = () => {
    setIsCreating(false);
    setCreateInputValue("");
    setCreateColor("");
    setCreateError("");
  };

  const handleCancelEditing = () => {
    setEditingCategoryId(null);
    setEditInputValue("");
    setEditError("");
  };

  const handleSaveEditing = (category: Category) => {
    const trimmedName = editInputValue.trim();

    if (!trimmedName) {
      setEditError(text("addService.form.category.validation.nameRequired"));
      return;
    }

    const validationError = validateCategoryName(trimmedName);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    // Check if another category with same name exists
    const duplicate = localCategories.find(
      (cat) =>
        cat.id !== category.id &&
        cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setEditError(text("addService.form.category.validation.nameExists"));
      return;
    }

    const updatedCategories = [...localCategories]
      .map((cat) =>
        cat.id === category.id ? { ...cat, name: trimmedName } : cat
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    setLocalCategories(updatedCategories);
    setEditingCategoryId(null);
    setEditInputValue("");
    setEditError("");

    if (onCategoriesChange) {
      onCategoriesChange(updatedCategories);
    }
  };

  const handleSaveCreating = () => {
    const trimmedName = createInputValue.trim();

    // If empty, just close the create mode without showing error
    if (!trimmedName) {
      handleCancelCreating();
      return;
    }

    // Validate category name (required → min → max → pattern)
    const validationError = validateCategoryName(trimmedName);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    // Check if we've reached the category limit (DB categories + newly created in this session)
    const totalCategoryCount = existingCategories.length + newlyCreatedIds.size;
    if (totalCategoryCount >= MAX_CATEGORIES) {
      setCreateError(text("addService.form.category.validation.limitReached"));
      return;
    }

    // Check if category with same name already exists (case-insensitive)
    const existing = localCategories.find(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing) {
      setCreateError(text("addService.form.category.validation.nameExists"));
      return;
    }

    // Create new category object (will be created on backend when service is saved)
    const newCategory: Category = {
      id: Date.now(), // Temporary ID for UI
      name: trimmedName,
      color: createColor || getColorHex(trimmedName),
    };

    // Add to local categories list and sort ALL categories alphabetically (DB + new together)
    const updatedCategories = [...localCategories, newCategory].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setLocalCategories(updatedCategories);

    // Track this as a newly created category
    setNewlyCreatedIds((prev) => new Set(prev).add(newCategory.id));

    // Find the index of the new category in the sorted list
    const newCategoryIndex = updatedCategories.findIndex(
      (cat) => cat.id === newCategory.id
    );

    // Auto-select the new category
    onCategoryIdChange(newCategory.id);
    onCategoryNameChange("");
    onCategoryColorChange("");

    // If "Show more" is collapsed and the new category would be hidden, auto-expand
    if (!showAllCategories && newCategoryIndex >= MAX_VISIBLE_CATEGORIES) {
      setShowAllCategories(true);
    }

    // Notify parent if callback provided
    if (onNewCategoryCreated) {
      onNewCategoryCreated(newCategory);
    }

    // Reset creating state
    setIsCreating(false);
    setCreateInputValue("");
    setCreateColor("");
    setCreateError("");
  };

  const handleCreateInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveCreating();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelCreating();
    }
  };

  const handleShuffleColor = () => {
    // Generate a random color by using a random string
    const randomString = Math.random().toString(36).substring(7);
    const newColor = getColorHex(randomString);
    setCreateColor(newColor);
    // Set to current input value to prevent debounced useEffect from overriding the shuffled color
    lastCategoryNameRef.current = createInputValue;
  };

  // Only calculate color from input if we're not in creating mode (to respect debounce)
  // When creating, wait for debounced createColor to be set, use default gray if no color yet
  const displayColor = isCreating
    ? createColor
    : createColor || getColorHex(createInputValue || "");
  const textColor = displayColor ? getTextColor(displayColor) : undefined;

  // Determine if we should show section-level error (no category selected)
  const showSectionError = error && !categoryId && !isCreating;

  // Check if we've reached the category limit (DB categories + newly created in this session)
  const totalCategoryCount = existingCategories.length + newlyCreatedIds.size;
  const isAtLimit = totalCategoryCount >= MAX_CATEGORIES;

  // Expose newly created categories to parent via callback
  useEffect(() => {
    if (onNewlyCreatedCategoriesChange) {
      const newlyCreated = localCategories.filter((cat) =>
        newlyCreatedIds.has(cat.id)
      );
      // Only call callback if categories actually changed (compare by IDs)
      const currentIds = newlyCreated
        .map((c) => c.id)
        .sort()
        .join(",");

      if (currentIds !== prevNewlyCreatedIdsRef.current) {
        prevNewlyCreatedIdsRef.current = currentIds;
        onNewlyCreatedCategoriesChange(newlyCreated);
      }
    }
  }, [localCategories, newlyCreatedIds, onNewlyCreatedCategoriesChange]);

  // Determine which categories to show (first 6-8, or all if expanded)
  const totalCategories = localCategories.length;
  const hasMoreCategories = totalCategories > MAX_VISIBLE_CATEGORIES;
  const visibleCategories = showAllCategories
    ? localCategories
    : localCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hiddenCount = totalCategories - MAX_VISIBLE_CATEGORIES;
  const isEditingMode = enableInlineEdit && editingCategoryId !== null;

  return (
    <div ref={sectionRef} className="space-y-6 cursor-default">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground-1">
          {customTitle || text("addService.sections.category")}
        </h3>
        <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
          {customSubtitle || text("addService.sections.categoryDescription")}
        </p>
        {helperPlacement === "header" && (
          <p className="text-xs text-foreground-3 dark:text-foreground-2">
            {customHelperText ||
              text("addService.form.category.selectHelperText")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          {showSelectLabel && (
            <Label className="text-base font-medium cursor-default mb-4">
              {text("addService.form.category.selectLabel")} {required && "*"}
            </Label>
          )}

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            {/* Existing categories */}
            {visibleCategories.map((category) => {
              const isSelected =
                !enableInlineEdit && categoryId === category.id;
              const isRemovable = newlyCreatedIds.has(category.id);
              const bgColor = getDisplayColor(category);
              const textColor = getTextColor(bgColor);
              const isEditing =
                enableInlineEdit && editingCategoryId === category.id;
              const shouldDim = (isCreating || isEditingMode) && !isEditing;
              const calculatedWidth = category.name.length * 8 + 20;
              const maxWidth = Math.min(130, Math.max(130, calculatedWidth));
              // Only show tooltip when text is actually truncated (exceeds 160px max width)
              const isTruncated = calculatedWidth > 160;

              const pillContent = isEditing ? (
                <div
                  className={`inline-flex h-11 items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border border-border-strong border-dashed ${
                    !bgColor ? "bg-info-100" : ""
                  } ${!textColor ? "text-foreground-1" : ""}`}
                  style={{
                    backgroundColor: bgColor || "",
                    color: textColor || "",
                  }}
                >
                  {/* Shuffle button - always visible in edit mode as well */}
                  <div
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const randomString = Math.random()
                        .toString(36)
                        .substring(7);
                      const newColor = getColorHex(randomString);
                      // Update color for this category in local state
                      setLocalCategories((prev) =>
                        prev.map((cat) =>
                          cat.id === category.id
                            ? { ...cat, color: newColor }
                            : cat
                        )
                      );
                      if (onCategoriesChange) {
                        onCategoriesChange(
                          localCategories.map((cat) =>
                            cat.id === category.id
                              ? { ...cat, color: newColor }
                              : cat
                          )
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        const randomString = Math.random()
                          .toString(36)
                          .substring(7);
                        const newColor = getColorHex(randomString);
                        setLocalCategories((prev) =>
                          prev.map((cat) =>
                            cat.id === category.id
                              ? { ...cat, color: newColor }
                              : cat
                          )
                        );
                        if (onCategoriesChange) {
                          onCategoriesChange(
                            localCategories.map((cat) =>
                              cat.id === category.id
                                ? { ...cat, color: newColor }
                                : cat
                            )
                          );
                        }
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    className="inline-flex bg-surface-hover dark:bg-neutral-50 rounded-full p-2 items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-focus focus-visible:ring-2 focus-visible:ring-offset-0 rounded h-auto w-auto min-w-0 min-h-0 select-none"
                    title={text("addService.form.category.shuffleColor")}
                  >
                    <Shuffle className="h-4 w-4 text-foreground-1 dark:text-neutral-900" />
                  </div>
                  <Input
                    ref={editInputRef}
                    type="text"
                    value={editInputValue}
                    maxLength={50}
                    onChange={(e) => {
                      // Block digits and disallowed special chars inline
                      // Allowed: letters + spaces + - ' & . ( )
                      const rawValue = e.target.value;
                      const CATEGORY_NAME_PATTERN = /^[A-Za-zÀ-ÿ\s\-'&.()]*$/;
                      if (!CATEGORY_NAME_PATTERN.test(rawValue)) {
                        return;
                      }
                      setEditInputValue(rawValue);
                      setEditError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEditing(category);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelEditing();
                      }
                    }}
                    onBlur={() => {
                      // If user didn't change the name, leaving the input cancels edit mode
                      const trimmed = editInputValue.trim();
                      if (
                        trimmed === category.name &&
                        editingCategoryId === category.id
                      ) {
                        handleCancelEditing();
                      }
                    }}
                    placeholder={text("addService.form.category.placeholder")}
                    className={`h-6 !px-2 max-h-6 border-0 bg-transparent dark:bg-transparent text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0 outline-none shadow-none truncate ${
                      editError ? "text-destructive" : ""
                    }`}
                    style={{
                      color: textColor || "#000000",
                      minWidth: "100px",
                      maxWidth: "160px",
                      width: `${Math.min(
                        120,
                        Math.max(100, editInputValue.length * 7 + 24)
                      )}px`,
                    }}
                  />
                  <div
                    tabIndex={0}
                    onClick={() => handleSaveEditing(category)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSaveEditing(category);
                      }
                    }}
                    className="inline-flex bg-surface-hover dark:bg-neutral-50 rounded-full p-2 items-center justify-center hover:opacity-80 transition-opacity shrink-0 cursor-pointer focus:outline-none focus-visible:ring-focus focus-visible:ring-2 focus-visible:ring-offset-0 rounded-full h-auto w-auto min-w-0 min-h-0"
                    title={text("addService.form.category.save")}
                  >
                    <Check className="h-4 w-4 text-foreground-1 dark:text-neutral-900" />
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={() => handleSelectCategory(category)}
                  className={`h-auto px-5 py-1.5 gap-2 relative !transition-none ${
                    shouldDim
                      ? "opacity-50 cursor-default"
                      : isSelected
                      ? "border-neutral-500 text-neutral-900 dark:text-neutral-900 shadow-xs focus-visible:!border-neutral-500"
                      : "border-border opacity-100"
                  } hover:!border-border ${
                    !shouldDim && isSelected ? "hover:!border-neutral-500" : ""
                  }`}
                  style={{
                    backgroundColor: bgColor,
                    color: isSelected ? undefined : textColor,
                  }}
                  disabled={isCreating || shouldDim}
                >
                  {isSelected && !isCreating && (
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
                  {enableInlineEdit &&
                    category.servicesCount === 0 &&
                    !isCreating &&
                    !isRemovable && (
                      <div
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = localCategories.filter(
                            (cat) => cat.id !== category.id
                          );
                          setLocalCategories(next);
                          onCategoriesChange?.(next);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            const next = localCategories.filter(
                              (cat) => cat.id !== category.id
                            );
                            setLocalCategories(next);
                            onCategoriesChange?.(next);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-full h-4 w-6 mr-0 -ml-2 mt-0.5 cursor-pointer focus:outline-none focus-visible:ring-focus focus-visible:ring-2 focus-visible:ring-offset-0"
                        style={{ color: isSelected ? undefined : textColor }}
                        title={text("addService.form.category.remove")}
                      >
                        <X className="h-2 w-2" />
                      </div>
                    )}
                  {isRemovable && (
                    <div
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCategory(
                          category,
                          e as unknown as React.MouseEvent
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveCategory(
                            category,
                            e as unknown as React.MouseEvent
                          );
                        }
                      }}
                      className="inline-flex items-center justify-center z-10 cursor-pointer focus:outline-none focus-visible:ring-focus focus-visible:ring-2 focus-visible:ring-offset-0 rounded mr-0 mt-0.5 w-auto h-auto min-w-0 min-h-0"
                      style={{ color: isSelected ? undefined : textColor }}
                      title={text("addService.form.category.remove")}
                    >
                      <X className="h-2 w-2" />
                    </div>
                  )}
                  <span
                    className="truncate"
                    style={{
                      maxWidth: `${maxWidth}px`,
                    }}
                  >
                    {category.name}
                  </span>
                </Button>
              );

              const pillButton = (
                <div
                  key={category.id}
                  className="transition-[transform] duration-150 ease-out"
                  style={{
                    transform: isEditing ? "scaleX(1.05)" : "scaleX(1)",
                  }}
                >
                  {pillContent}
                </div>
              );

              // Only show tooltip if text is truncated
              if (isTruncated) {
                return (
                  <Tooltip key={category.id}>
                    <TooltipTrigger asChild>{pillButton}</TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="center"
                      sideOffset={6}
                      className="z-[80]"
                    >
                      {category.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return pillButton;
            })}

            {/* "Show more" button (only when collapsed and there are more categories) */}
            {hasMoreCategories && !showAllCategories && (
              <Button
                type="button"
                variant="outline"
                rounded="full"
                onClick={() => setShowAllCategories(true)}
                className={`h-auto px-3 py-1.5 gap-1.5 border-dashed ${
                  isCreating || isEditingMode ? "opacity-50 cursor-default" : ""
                }`}
                disabled={isCreating || isEditingMode}
              >
                {text("addService.form.category.showMore", {
                  count: hiddenCount,
                })}
              </Button>
            )}

            {/* "Show less" button (only when expanded) */}
            {showAllCategories && hasMoreCategories && (
              <Button
                type="button"
                variant="outline"
                rounded="full"
                onClick={() => setShowAllCategories(false)}
                className={`h-auto px-3 py-1.5 gap-1.5 border-dashed ${
                  isCreating || isEditingMode ? "opacity-50 cursor-default" : ""
                }`}
                disabled={isCreating || isEditingMode}
              >
                {text("addService.form.category.showLess")}
              </Button>
            )}

            {/* Create new category chip - transforms into editor (always at the end) */}
            <div
              className="transition-[transform] duration-150 ease-out"
              style={{
                transform: isCreating ? "scaleX(1.05)" : "scaleX(1)",
              }}
            >
              {isCreating ? (
                <div className="relative inline-flex items-center group">
                  <div
                    className={`inline-flex h-11 items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      createError
                        ? "border-destructive border-border-strong border-dashed"
                        : " border-border-strong border-dashed"
                    }
                    ${!displayColor ? "bg-info-100" : ""}
                    ${!textColor ? "text-foreground-1" : ""}
                    `}
                    style={{
                      backgroundColor: displayColor || "",
                      color: textColor || "",
                    }}
                  >
                    {/* Shuffle button - always visible */}
                    <div
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleShuffleColor();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleShuffleColor();
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      className="inline-flex bg-surface-hover dark:bg-neutral-50 rounded-full p-2 items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-focus focus-visible:ring-2 focus-visible:ring-offset-0 rounded h-auto w-auto min-w-0 min-h-0 select-none"
                      title={text("addService.form.category.shuffleColor")}
                    >
                      <Shuffle className="h-4 w-4 text-foreground-1 dark:text-neutral-900" />
                    </div>

                    {/* Input */}
                    <Input
                      ref={createInputRef}
                      type="text"
                      value={createInputValue}
                      maxLength={50}
                      onChange={(e) => {
                        // Block digits and disallowed special chars inline
                        // Allowed: letters + spaces + - ' & . ( )
                        const rawValue = e.target.value;
                        const CATEGORY_NAME_PATTERN = /^[A-Za-zÀ-ÿ\s\-'&.()]*$/;
                        if (!CATEGORY_NAME_PATTERN.test(rawValue)) {
                          return;
                        }
                        setCreateInputValue(rawValue);
                        setCreateError("");
                      }}
                      onKeyDown={handleCreateInputKeyDown}
                      onBlur={handleSaveCreating}
                      placeholder={text("addService.form.category.placeholder")}
                      className={`h-6 !px-2 max-h-6 border-0 bg-transparent dark:bg-transparent text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0 outline-none shadow-none truncate ${
                        createError ? "text-destructive" : ""
                      }`}
                      style={{
                        color: textColor || "#000000",
                        minWidth: "120px",
                        maxWidth: "200px",
                        width: `${Math.min(
                          130,
                          Math.max(130, createInputValue.length * 8 + 20)
                        )}px`,
                      }}
                    />

                    {/* Save button (Enter also works) */}
                    <div
                      tabIndex={0}
                      onClick={handleSaveCreating}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSaveCreating();
                        }
                      }}
                      className="inline-flex bg-surface-hover dark:bg-neutral-50 rounded-full p-2 items-center justify-center hover:opacity-80 transition-opacity shrink-0 cursor-pointer focus:outline-none focus-visible:ring-focus focus-visible:ring-2 focus-visible:ring-offset-0 rounded-full h-auto w-auto min-w-0 min-h-0"
                      title={text("addService.form.category.save")}
                    >
                      <Check className="h-4 w-4 text-foreground-1 dark:text-neutral-900" />
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={handleStartCreating}
                  className={`h-auto px-3 py-1.5 gap-1.5 border-dashed border-border-strong dark:border-border${
                    isAtLimit || isEditingMode
                      ? " opacity-50 cursor-default"
                      : ""
                  }`}
                  disabled={isCreating || isAtLimit || isEditingMode}
                >
                  <Plus className="h-3.5 w-3.5 text-foreground-3 dark:text-foreground-2" />
                  {text("addService.form.category.createNew")}
                </Button>
              )}
            </div>
          </div>

          {/* Error display (create error or section error - never both) - space always reserved */}
          <div className="h-5 mb-0">
            {(createError || editError || showSectionError) && (
              <p
                className="flex items-center gap-1.5 text-xs text-destructive"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>
                  {createError ||
                    editError ||
                    text("addService.form.category.validation.sectionError")}
                </span>
              </p>
            )}
          </div>

          {/* Helper text when at limit */}
          {isAtLimit && (
            <p className="text-xs text-foreground-3 dark:text-foreground-2 pt-2">
              {text("addService.form.category.limitHelperText.text", {
                max: MAX_CATEGORIES,
              })}
            </p>
          )}

          {helperPlacement === "footer" && (
            <p className="text-xs text-foreground-3 dark:text-foreground-2">
              {customHelperText ||
                text("addService.form.category.selectHelperText")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySection;
