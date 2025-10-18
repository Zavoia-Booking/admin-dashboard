import { type FC, useCallback, useState } from "react";
import { useTranslation } from 'react-i18next';
import { FilterPanel } from "../../../shared/components/common/FilterPanel.tsx";
import type { ServiceFilterState } from "../types.ts";
import { getDefaultServiceFilters } from "../utils.ts";
import { useDispatch } from "react-redux";
import { BadgeList } from "./BadgeList.tsx";
import { setServiceFilterAction, toggleAddFormAction } from "../actions.ts";
import { Input } from "../../../shared/components/ui/input.tsx";
import { Filter, Plus, Search } from "lucide-react";
import { Button } from "../../../shared/components/ui/button.tsx";
import { ALL } from "../../../shared/constants.ts";

export const ServiceFilters: FC<any> = () => {
    const text = useTranslation('services').t;
    const dispatch = useDispatch();
    const [localFilters, setLocalFilters] = useState<ServiceFilterState>(getDefaultServiceFilters());
    const [showFilters, setShowFilters] = useState(false);

    const handleClearFilters = useCallback(() => {
        setLocalFilters(getDefaultServiceFilters());
        setShowFilters(false);
    },[setShowFilters]);

    const handleApplyFilters = useCallback((filterValues: any) => {
        const { status, priceMin, priceMax, durationMin, durationMax, searchTerm } = filterValues;
        const newFilters: ServiceFilterState = {
            ...localFilters,
            status,
            durationMin,
            durationMax,
            priceMin,
            priceMax,
            searchTerm
        }
        setLocalFilters(newFilters)
        setShowFilters(false);
        dispatch(setServiceFilterAction.request(newFilters))
    }, [dispatch, setShowFilters, localFilters])

    const getActiveFilterCount = useCallback(() => {
        const activeFiltersCount: Array<boolean> = [
            localFilters.status !== ALL,
            !!localFilters.searchTerm,
            !!localFilters.durationMax,
            !!localFilters.durationMin,
            !!localFilters.priceMin,
            !!localFilters.priceMax,
        ];

        return activeFiltersCount.filter(Boolean).length;
    }, [localFilters])

    return (
        <>
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <Input
                        placeholder={text('filters.searchPlaceholder')}
                        value={localFilters.searchTerm}
                        onChange={(event) => {
                            setLocalFilters((prevState) => {
                                return {
                                    ...prevState,
                                    searchTerm: event.target.value
                                }
                            })
                        }}
                        className="h-11 text-base pr-12 pl-4 rounded-lg border border-input bg-white"
                    />
                    <Search
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"/>
                </div>
                <button
                    className={`
                      relative flex items-center justify-center h-9 w-9 rounded-md border border-input transition-all duration-200 ease-out
                      ${showFilters
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-white text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                    `}
                    onClick={() => setShowFilters(v => !v)}
                    aria-label="Show filters"
                >
                    <Filter className={`h-5 w-5 ${showFilters ? 'text-primary-foreground' : ''}`}/>
                    {
                        getActiveFilterCount() > 0 && (
                            <span
                                className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full
                                 px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow">
                                {getActiveFilterCount()}
                             </span>
                        )
                    }
                </button>
                <Button
                    className="h-11 px-4 rounded-lg bg-black hover:bg-gray-800 flex items-center gap-2"
                    onClick={() => {
                        dispatch(toggleAddFormAction(true))
                    }}
                >
                    <Plus className="h-5 w-5"/>
                    <span className="font-semibold">{text('filters.addService')}</span>
                </Button>
            </div>
            {showFilters &&
                <FilterPanel
                    open={showFilters}
                    fields={[
                        {
                            type: 'select',
                            key: 'status',
                            label: 'Status',
                            value: localFilters.status,
                            options: [
                                { value: ALL, label: 'All statuses' },
                                { value: 'enabled', label: 'Enabled' },
                                { value: 'disabled', label: 'Disabled' },
                            ],
                            searchable: true,
                        },
                        {
                            type: 'text',
                            key: 'priceMin',
                            label: 'Min Price',
                            value: localFilters.priceMin,
                            placeholder: 'Min',
                        },
                        {
                            type: 'text',
                            key: 'priceMax',
                            label: 'Max Price',
                            value: localFilters.priceMax,
                            placeholder: 'Max',
                        },
                        {
                            type: 'text',
                            key: 'durationMin',
                            label: 'Min Duration',
                            value: localFilters.durationMin,
                            placeholder: 'Min',
                        },
                        {
                            type: 'text',
                            key: 'durationMax',
                            label: 'Max Duration',
                            value: localFilters.durationMax,
                            placeholder: 'Max',
                        },
                        {
                            type: 'text',
                            key: 'searchTerm',
                            label: 'Search',
                            value: localFilters.searchTerm,
                            placeholder: 'Search services...'
                        },
                    ]}
                    onApply={values => {
                        handleApplyFilters(values);
                    }}
                    onClear={handleClearFilters}
                    onOpenChange={(values) => {
                        setShowFilters(values)
                    }}
                />
            }
            <BadgeList filters={localFilters} changeFilters={handleApplyFilters}/>
        </>
    )
}