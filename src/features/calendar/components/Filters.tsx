import { type FC, useCallback, useState } from "react";
import { FilterPanel } from "../../../shared/components/common/FilterPanel.tsx";
import type { Appointment } from "../../../shared/types/calendar.ts";
import { useDispatch, useSelector } from "react-redux";
import {
    setCalendarFilterAction,
    setViewTypeAction,
    toggleAddForm
} from "../actions.ts";
import { AppointmentViewType, type CalendarFilters } from "../types.ts";
import { getFiltersSelector, getViewTypeSelector } from "../selectors.ts";
import { ALL, getDefaultCalendarFilters, getStartEndDate, STATUS_LIST } from "../utils.ts";
import { Button } from "../../../shared/components/ui/button.tsx";
import { Clipboard, Calendar as CalendarIcon, Filter, List } from 'lucide-react';
import DatePicker from "../../../shared/components/ui/date-picker.tsx";
import type { TeamMember } from "../../../shared/types/team-member.ts";
import type { LocationType } from "../../../shared/types/location.ts";
import { BadgeList } from "./BadgeList.tsx";
import { getServicesListSelector } from "../../services/selectors.ts";
import type { Service } from "../../../shared/types/service.ts";
import { getAllLocationsSelector } from "../../locations/selectors.ts";
import { selectTeamMembers } from "../../teamMembers/selectors.ts";

type FilterValues = {
    location: string,
    teamMember: string,
    service: string,
    status: string,
    clientName: string,
    email: string,
    phoneNumber: string,
}

interface IProps {
    appointments: Array<Appointment>
}

export const Filters: FC<IProps> = () => {
    const dispatch = useDispatch();
    const viewType: AppointmentViewType = useSelector(getViewTypeSelector);
    const teamMembers: Array<TeamMember> = useSelector(selectTeamMembers);
    const locations: Array<LocationType> = useSelector(getAllLocationsSelector);
    const services: Array<Service> = useSelector(getServicesListSelector);

    const { selectedDate } = useSelector(getFiltersSelector);

    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState<CalendarFilters>(getDefaultCalendarFilters());

    const getActiveFilterCount = useCallback(() => {
        const activeFiltersCount: Array<boolean> = [
            localFilters.location !== ALL,
            localFilters.teamMember !== ALL,
            localFilters.service !== ALL,
            localFilters.status !== ALL,
            !!localFilters.clientName,
            !!localFilters.email,
            !!localFilters.phoneNumber,
        ];

        return activeFiltersCount.filter(Boolean).length;
    }, [localFilters])

    const getTeamMemberOptions = useCallback(() => {
       return [
            { value: ALL, label: 'All team members' },
            ...teamMembers.map(member => ({ value: `${member.id}`, label: `${member.firstName} ${member.lastName}` }))
        ]
    }, [teamMembers])

    const getLocationOptions = useCallback(() => {
        return [
            { value: ALL, label: 'All locations' },
            ...locations.map(location => ({ value: `${location.id}`, label: location.name }))
        ]
    }, [locations])

    const getServicesOptions = useCallback(() => {
        return [
            { value: ALL, label: 'All services' },
            ...services.map(service => ({ value: `${service.id}`, label: service.name }))
        ]
    }, [services])

    const handleOpenAddForm = useCallback(() => {
        dispatch(toggleAddForm(true))
    }, [dispatch])

    const handleToggleViewType = useCallback((viewType: AppointmentViewType) => {
        dispatch(setViewTypeAction(viewType))
    }, [dispatch])


    const handleChangeDate = useCallback((date: Date) => {

        const { startDate, endDate } = getStartEndDate(date);

        const newFilters: CalendarFilters = {
            ...localFilters,
            selectedDate: date,
            startDate,
            endDate,
        }

        dispatch(setCalendarFilterAction.request(newFilters))
    }, [dispatch, localFilters])

    const handleApplyFilters = useCallback((filterValues: FilterValues) => {
        const newFilters = {
            ...localFilters,
            ...filterValues,
        }
        setLocalFilters(newFilters)
        setShowFilters(false);
        dispatch(setCalendarFilterAction.request(newFilters))
    }, [dispatch, localFilters])

    const handleClearFilters = useCallback(() => {
        setLocalFilters(getDefaultCalendarFilters());
        dispatch(setCalendarFilterAction.request(getDefaultCalendarFilters()))
    }, [dispatch])

    return (<div className="space-y-6">
         {/*Top Controls: Date Selector, Filter, View Toggle, Add */}
        <div className="flex gap-2 items-center mb-4">
            <div>
                <DatePicker
                    value={selectedDate}
                    onChange={(date) => handleChangeDate(date)}
                    viewMode={'day'}
                    className="h-11 w-[130px] bg-white border border-border rounded-lg text-sm font-medium text-foreground"
                />
            </div>
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
                    onClick={() =>handleToggleViewType(AppointmentViewType.GRID)}
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

            <Button
                size="default"
                className="h-11 px-4 gap-2"
                onClick={() => handleOpenAddForm()}
                title={'Add new Appointment'}
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
                        key: 'location',
                        label: 'Location',
                        value: localFilters.location,
                        options: getLocationOptions(),
                        searchable: true,
                    },
                    {
                        type: 'select',
                        key: 'teamMember',
                        label: 'Team Member',
                        value: localFilters.teamMember,
                        options: getTeamMemberOptions(),
                        searchable: true,
                    },
                    {
                        type: 'select',
                        key: 'service',
                        label: 'Service',
                        value: localFilters.service,
                        options: getServicesOptions(),
                        searchable: true,
                    },
                    {
                        type: 'select',
                        key: 'status',
                        label: 'Status',
                        value: localFilters.status,
                        options: STATUS_LIST,
                        searchable: false,
                    },
                    {
                        type: 'text',
                        key: 'clientName',
                        label: 'Client Name',
                        value: localFilters.clientName,
                        placeholder: 'Search by client name...'
                    },
                    {
                        type: 'text',
                        key: 'email',
                        label: 'Client Email',
                        value: localFilters.email,
                        placeholder: 'Search by email...'
                    },
                    {
                        type: 'text',
                        key: 'phoneNumber',
                        label: 'Client Phone',
                        value: localFilters.phoneNumber,
                        placeholder: 'Search by phone...'
                    },
                ]}
                onApply={(values) => {handleApplyFilters(values as FilterValues)}}
                onClear={() => handleClearFilters()}
            />
        )}
        {/* Active Filter Badges - Always show when there are active filters */}
        <BadgeList filters={localFilters} changeFilters={handleApplyFilters}/>
    </div>)
}