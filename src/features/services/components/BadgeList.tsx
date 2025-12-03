import { type FC, useCallback } from "react";
import { X } from "lucide-react";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import type { ServiceFilterState } from "../types.ts";
import type { Category } from "./CategorySection";

interface IProps {
    filters: ServiceFilterState;
    changeFilters: (filters: ServiceFilterState) => void;
    categories?: Category[];
}

export const BadgeList: FC<IProps>  = ({ filters, changeFilters, categories }) => {
    const { priceMin, priceMax, durationMin, durationMax, categoryIds = [] } = filters;

    // Treat empty string and "0" as "no price filter" (for UX we don't want to show 0 when user never set it)
    const hasPriceMin = priceMin !== "" && priceMin !== "0";
    const hasPriceMax = priceMax !== "" && priceMax !== "0";

    const canShowFilterBadges = useCallback((): boolean => {
        return !!(
            hasPriceMin ||
            hasPriceMax ||
            durationMin ||
            durationMax ||
            (Array.isArray(categoryIds) && categoryIds.length > 0)
        );
    }, [hasPriceMin, hasPriceMax, durationMin, durationMax, categoryIds]);

    const selectedCategories =
      Array.isArray(categoryIds) && categories
        ? categories.filter((c) => categoryIds.includes(c.id))
        : [];

    const setFilters = useCallback((filterKey: string, filterValue: string | number | boolean | null) => {
        const newFilters = {
            ...filters,
            [filterKey]: filterValue
        }
        changeFilters(newFilters);

    }, [changeFilters, filters])

    return (<>
        {canShowFilterBadges() && (
            <div className="flex flex-wrap gap-2 mb-4">
                {hasPriceMin && (
                    <Badge
                        variant="filter"
                        className="flex items-center gap-1 cursor-pointer   text-xs"
                        onClick={() => setFilters('priceMin', '')}
                    >
                        Price min: {priceMin}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {hasPriceMax && (
                    <Badge
                        variant="filter"
                        className="flex items-center gap-1 cursor-pointer   text-xs"
                        onClick={() => setFilters('priceMax', '')}
                    >
                        Price max: {priceMax}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {durationMin && (
                    <Badge
                        variant="filter"
                        className="flex items-center gap-1 cursor-pointer  text-xs"
                        onClick={() => setFilters('durationMin', '')}
                    >
                        Duration min: {durationMin}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {durationMax && (
                    <Badge
                        variant="filter"
                        className="flex items-center gap-1 cursor-pointer  text-xs"
                        onClick={() => setFilters('durationMax', '')}
                    >
                        Duration max: {durationMax}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {selectedCategories.map((cat) => (
                    <Badge
                        key={cat.id}
                        variant="filter"
                        className="flex items-center gap-1 cursor-pointer  text-xs"
                        onClick={() => {
                            const nextCategoryIds = categoryIds.filter(
                                (id) => id !== cat.id
                            );
                            changeFilters({
                                ...filters,
                                categoryIds: nextCategoryIds,
                            });
                        }}
                    >
                        Category: {cat.name}
                        <X className="h-4 w-4 ml-1" />
                    </Badge>
                ))}
            </div>
        )}
    </>)
}
