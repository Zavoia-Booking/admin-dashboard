import { type FC, useCallback } from "react";
import { X } from "lucide-react";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import type { ServiceFilterState } from "../types.ts";
import { ALL } from "../../../shared/constants.ts";

interface IProps {
    filters: ServiceFilterState
    changeFilters: (filters: ServiceFilterState) => void
}

export const BadgeList: FC<IProps>  = ({ filters, changeFilters }) => {
    const canShowFilterBadges = useCallback((): boolean => {
        return !!(
            filters.status !== ALL ||
            filters.searchTerm ||
            filters.priceMin ||
            filters.priceMax ||
            filters.durationMin ||
            filters.durationMax
        );
    }, [filters])

    const { searchTerm, status, priceMin, priceMax, durationMin, durationMax } = filters

    const setFilters = useCallback((filterKey: string, filterValue: string|number|boolean) => {
        const newFilters = {
            ...filters,
            [filterKey]: filterValue
        }
        changeFilters(newFilters);

    }, [changeFilters, filters])

    return (<>
        {canShowFilterBadges() && (
            <div className="flex flex-wrap gap-2 mb-4">
                {status !== ALL && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('status', '')}
                    >
                        Service: {status}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {searchTerm && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('searchTerm', '')}
                    >
                        Search by {searchTerm}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {priceMin && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('priceMin', '')}
                    >
                        Price min: {priceMin}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {priceMax && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('priceMax', '')}
                    >
                        Price max: {priceMax}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {durationMin && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('durationMin', '')}
                    >
                        Duration min: {durationMin}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
                {durationMax && (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                        onClick={() => setFilters('durationMax', '')}
                    >
                        Duration max: {durationMax}
                        <X className="h-4 w-4 ml-1"/>
                    </Badge>
                )}
            </div>
        )}
    </>)
}
