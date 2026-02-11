import { type FC, useCallback, useState } from "react";
import { FilterPanel } from "../../../shared/components/common/FilterPanel.tsx";
import { useDispatch, useSelector } from "react-redux";
import {
    setCalendarFilterAction,
    setDayFiltersAction,
    setViewTypeAction,
    toggleAddForm,
    toggleBlockFormAction,
} from "../actions.ts";
import { AppointmentViewType, type CalendarFilters } from "../types.ts";
import { getDayFilters, getFiltersSelector, getViewTypeSelector } from "../selectors.ts";
import { getDefaultCalendarFilters, STATUS_LIST } from "../utils.ts";
import { Button } from "../../../shared/components/ui/button.tsx";
import { Clipboard, Calendar as CalendarIcon, Filter, List, ShieldOff } from 'lucide-react';
import { getServicesListSelector } from "../../services/selectors.ts";
import type { Service } from "../../../shared/types/service.ts";
import { getLocationStaff } from "../selectors.ts";
import { ALL } from "../../../shared/constants.ts";
import type { CalendarDayFilters, CalendarStaffMember } from "../../../shared/types/calendar.ts";

type FilterValues = {
    teamMember: string,
    service: string,
    status: string,
    clientName: string,
}

export const Filters: FC = () => {
    const dispatch = useDispatch();
    const viewType: AppointmentViewType = useSelector(getViewTypeSelector);
    const services: Array<Service> = useSelector(getServicesListSelector);

    // New: use location-scoped staff from the calendar context
    const locationStaff: Array<CalendarStaffMember> = useSelector(getLocationStaff);
    const dayFilters: CalendarDayFilters = useSelector(getDayFilters);

    // Legacy filter state (kept for backward compat during migration)
    const legacyFilters: CalendarFilters = useSelector(getFiltersSelector);

    const [showFilters, setShowFilters] = useState(false);

    const getActiveFilterCount = useCallback(() => {
        let count = 0;
        if (dayFilters.staffUserId) count++;
        if (dayFilters.serviceId) count++;
        if (dayFilters.status) count++;
        if (dayFilters.clientName) count++;
        return count;
    }, [dayFilters])

    const getStaffOptions = useCallback(() => {
       return [
            { value: ALL, label: 'All staff' },
            ...locationStaff.map(s => ({ value: `${s.id}`, label: `${s.firstName} ${s.lastName}` }))
        ]
    }, [locationStaff])

    const getServicesOptions = useCallback(() => {
        return [
            { value: ALL, label: 'All services' },
            ...services.map(service => ({ value: `${service.id}`, label: service.name }))
        ]
    }, [services])

    const handleOpenAddForm = useCallback(() => {
        dispatch(toggleAddForm(true))
    }, [dispatch])

    const handleOpenBlockForm = useCallback(() => {
        dispatch(toggleBlockFormAction(true))
    }, [dispatch])

    const handleToggleViewType = useCallback((vt: AppointmentViewType) => {
        dispatch(setViewTypeAction(vt))
    }, [dispatch])

    const handleApplyFilters = useCallback((filterValues: FilterValues) => {
        setShowFilters(false);

        // Build new day filters from the applied values
        const newDayFilters: CalendarDayFilters = {};

        if (filterValues.teamMember && filterValues.teamMember !== ALL) {
            newDayFilters.staffUserId = parseInt(filterValues.teamMember, 10);
        }
        if (filterValues.service && filterValues.service !== ALL) {
            newDayFilters.serviceId = parseInt(filterValues.service, 10);
        }
        if (filterValues.status && filterValues.status !== ALL) {
            newDayFilters.status = filterValues.status;
        }
        if (filterValues.clientName) {
            newDayFilters.clientName = filterValues.clientName;
        }

        // Dispatch new day filters (triggers day data refetch via saga)
        dispatch(setDayFiltersAction(newDayFilters));

        // Legacy compat: also update old filters
        dispatch(setCalendarFilterAction.request({
            ...legacyFilters,
            teamMember: filterValues.teamMember || ALL,
            service: filterValues.service || ALL,
            status: filterValues.status || ALL,
            clientName: filterValues.clientName || '',
        }));
    }, [dispatch, legacyFilters])

    const handleClearFilters = useCallback(() => {
        // Clear new day filters
        dispatch(setDayFiltersAction({}));

        // Legacy compat
        dispatch(setCalendarFilterAction.request(getDefaultCalendarFilters()));
    }, [dispatch])

    // Map current dayFilters back to FilterPanel values
    const currentFilterValues = {
        teamMember: dayFilters.staffUserId ? `${dayFilters.staffUserId}` : ALL,
        service: dayFilters.serviceId ? `${dayFilters.serviceId}` : ALL,
        status: dayFilters.status || ALL,
        clientName: dayFilters.clientName || '',
    };

    return (<div className="space-y-6">
         {/* Top Controls: Filter, View Toggle, Add Appointment, Add Block */}
        <div className="flex gap-2 items-center mb-4">
            <button
                className={`
              relative flex items-center justify-center h-9 w-9 rounded-md border border-input transition-all duration-200 ease-out
              ${showFilters
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-white text-muted-foreground hover:text-foreground hover:bg-muted/50'}
            `}
                onClick={() => setShowFilters(!showFilters)}
                aria-label="Show filters"
            >
                <Filter className={`h-5 w-5 ${showFilters ? 'text-primary-foreground' : ''}`}/>
                {getActiveFilterCount() > 0 && (
                    <span
                        className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow">
                  {getActiveFilterCount()}
                </span>
                )}
            </button>

            {/* View Type Toggle */}
            <div className="inline-flex bg-white border border-border rounded-lg p-1">
                <button
                    onClick={() => handleToggleViewType(AppointmentViewType.LIST)}
                    className={`
                flex items-center justify-center h-9 w-9 rounded-md transition-all duration-200 ease-out
                ${viewType === AppointmentViewType.LIST
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
              `}
                    aria-label="List view"
                >
                    <List className="h-4 w-4"/>
                </button>
                <button
                    onClick={() => handleToggleViewType(AppointmentViewType.GRID)}
                    className={`
                flex items-center justify-center h-9 w-9 rounded-md transition-all duration-200 ease-out
                ${viewType === AppointmentViewType.GRID
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
              `}
                    aria-label="Grid view"
                >
                    <CalendarIcon className="h-4 w-4"/>
                </button>
            </div>

            <div className="flex-1" />

            <Button
                variant="outline"
                size="default"
                className="h-9 px-3 gap-2"
                onClick={handleOpenBlockForm}
                title="Block time"
            >
                <ShieldOff className="h-4 w-4"/>
                <span className="hidden sm:inline">Block</span>
            </Button>

            <Button
                size="default"
                className="h-9 px-4 gap-2"
                onClick={handleOpenAddForm}
                title="Add new Appointment"
            >
                <Clipboard className="h-4 w-4"/>
                <span>Add</span>
            </Button>
        </div>

        {showFilters && (
            <FilterPanel
                open={showFilters}
                onOpenChange={setShowFilters}
                fields={[
                    {
                        type: 'select',
                        key: 'teamMember',
                        label: 'Staff Member',
                        value: currentFilterValues.teamMember,
                        options: getStaffOptions(),
                        searchable: true,
                    },
                    {
                        type: 'select',
                        key: 'service',
                        label: 'Service',
                        value: currentFilterValues.service,
                        options: getServicesOptions(),
                        searchable: true,
                    },
                    {
                        type: 'select',
                        key: 'status',
                        label: 'Status',
                        value: currentFilterValues.status,
                        options: STATUS_LIST,
                        searchable: false,
                    },
                    {
                        type: 'text',
                        key: 'clientName',
                        label: 'Client Name',
                        value: currentFilterValues.clientName,
                        placeholder: 'Search by client name...',
                    },
                ]}
                onApply={(values) => handleApplyFilters(values as FilterValues)}
                onClear={handleClearFilters}
            />
        )}
    </div>)
}