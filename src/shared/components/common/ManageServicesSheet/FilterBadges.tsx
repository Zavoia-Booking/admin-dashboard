import { X } from "lucide-react";
import { Badge } from "../../ui/badge";

interface Category {
  id: number;
  name: string;
  color?: string;
}

interface FilterBadgesProps {
  appliedPriceMin: string;
  appliedPriceMax: string;
  appliedDurationMin: string;
  appliedDurationMax: string;
  appliedCategoryIds: number[];
  availableCategories: Category[];
  labels: {
    minPrice: string;
    maxPrice: string;
    minDuration: string;
    maxDuration: string;
  };
  onRemovePriceMin: () => void;
  onRemovePriceMax: () => void;
  onRemoveDurationMin: () => void;
  onRemoveDurationMax: () => void;
  onRemoveCategory: (categoryId: number) => void;
  className?: string;
}

export function FilterBadges({
  appliedPriceMin,
  appliedPriceMax,
  appliedDurationMin,
  appliedDurationMax,
  appliedCategoryIds,
  availableCategories,
  labels,
  onRemovePriceMin,
  onRemovePriceMax,
  onRemoveDurationMin,
  onRemoveDurationMax,
  onRemoveCategory,
  className = "",
}: FilterBadgesProps) {
  const hasAnyFilters =
    (appliedPriceMin !== "" && appliedPriceMin !== "0") ||
    (appliedPriceMax !== "" && appliedPriceMax !== "0") ||
    appliedDurationMin !== "" ||
    appliedDurationMax !== "" ||
    appliedCategoryIds.length > 0;

  if (!hasAnyFilters) return null;

  return (
    <div className={`hidden md:flex flex-wrap gap-2 ${className}`}>
      {appliedPriceMin !== "" && appliedPriceMin !== "0" && (
        <Badge
          variant="filter"
          className="flex items-center gap-1 cursor-pointer text-xs dark:text-foreground-1"
          onClick={onRemovePriceMin}
        >
          {labels.minPrice}: {appliedPriceMin}
          <X className="h-4 w-4 ml-1" />
        </Badge>
      )}
      {appliedPriceMax !== "" && appliedPriceMax !== "0" && (
        <Badge
          variant="filter"
          className="flex items-center gap-1 cursor-pointer text-xs dark:text-foreground-1"
          onClick={onRemovePriceMax}
        >
          {labels.maxPrice}: {appliedPriceMax}
          <X className="h-4 w-4 ml-1" />
        </Badge>
      )}
      {appliedDurationMin !== "" && (
        <Badge
          variant="filter"
          className="flex items-center gap-1 cursor-pointer text-xs dark:text-foreground-1"
          onClick={onRemoveDurationMin}
        >
          {labels.minDuration}: {appliedDurationMin}
          <X className="h-4 w-4 ml-1" />
        </Badge>
      )}
      {appliedDurationMax !== "" && (
        <Badge
          variant="filter"
          className="flex items-center gap-1 cursor-pointer text-xs dark:text-foreground-1"
          onClick={onRemoveDurationMax}
        >
          {labels.maxDuration}: {appliedDurationMax}
          <X className="h-4 w-4 ml-1" />
        </Badge>
      )}
      {appliedCategoryIds.map((categoryId) => {
        const category = availableCategories.find((c) => c.id === categoryId);
        if (!category) return null;
        return (
          <Badge
            key={categoryId}
            variant="filter"
            className="flex items-center gap-1 cursor-pointer text-xs dark:text-foreground-1"
            onClick={() => onRemoveCategory(categoryId)}
          >
            {category.name}
            <X className="h-4 w-4 ml-1" />
          </Badge>
        );
      })}
    </div>
  );
}

