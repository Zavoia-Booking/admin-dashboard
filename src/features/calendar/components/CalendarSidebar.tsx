import { type FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LocationSelector } from "./LocationSelector.tsx";
import { MiniMonthCalendar } from "./MiniMonthCalendar.tsx";
import { getLocationStaff, getStaffFilter, getDayFilters, getSelectedLocationId } from "../selectors.ts";
import { setStaffFilter, setDayFiltersAction } from "../actions.ts";
import type { CalendarStaffMember, CalendarDayFilters } from "../../../shared/types/calendar.ts";
import { fetchLocationFullAssignmentRequest } from "../../assignments/api.ts";
import type { LocationService } from "../../assignments/types.ts";
import { User, Search, X, Check, ChevronDown } from "lucide-react";
import { Label } from "../../../shared/components/ui/label.tsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../shared/components/ui/select.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../../../shared/components/ui/popover.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import {
    Command,
    CommandList,
    CommandGroup,
    CommandItem,
} from "../../../shared/components/ui/command.tsx";
import { cn } from "../../../shared/lib/utils";

// ─────────────────────────────────────────────────────────────
// Staff Filter (multi-select, TimezoneSelect-style)
// ─────────────────────────────────────────────────────────────

const StaffFilterSelect: FC = () => {
    const dispatch = useDispatch();
    const staff: CalendarStaffMember[] = useSelector(getLocationStaff);
    const staffFilterRaw: number[] = useSelector(getStaffFilter);
    const dayFilters = useSelector(getDayFilters);
    const [open, setOpen] = useState(false);

    // Normalize: only IDs that exist in current staff list
    const staffFilter = useMemo(
        () => staffFilterRaw.filter((id) => staff.some((s) => s.id === id)),
        [staffFilterRaw, staff]
    );

    const syncStaffFilterToDayPayload = useCallback(
        (visibleStaffIds: number[]) => {
            dispatch(
                setDayFiltersAction({
                    ...dayFilters,
                    staffUserId: visibleStaffIds.length === 1 ? visibleStaffIds[0] : undefined,
                })
            );
        },
        [dispatch, dayFilters]
    );

    const handleToggleStaff = useCallback(
        (staffId: number) => {
            const isAll = staffFilter.length === 0;
            if (staffId === -1) {
                // "All staff" clicked
                dispatch(setStaffFilter([]));
                syncStaffFilterToDayPayload([]);
                setOpen(false);
                return;
            }
            if (isAll) {
                dispatch(setStaffFilter([staffId]));
                syncStaffFilterToDayPayload([staffId]);
            } else {
                const isSelected = staffFilter.includes(staffId);
                if (isSelected) {
                    const next = staffFilter.filter((id) => id !== staffId);
                    const nextVisible = next.length === 0 ? [] : next;
                    dispatch(setStaffFilter(nextVisible));
                    syncStaffFilterToDayPayload(nextVisible);
                } else {
                    const next = [...staffFilter, staffId];
                    if (next.length === staff.length) {
                        dispatch(setStaffFilter([]));
                        syncStaffFilterToDayPayload([]);
                    } else {
                        dispatch(setStaffFilter(next));
                        syncStaffFilterToDayPayload(next);
                    }
                }
            }
        },
        [dispatch, staff, staffFilter, syncStaffFilterToDayPayload]
    );

    const displayLabel = useMemo(() => {
        if (staffFilter.length === 0) return "All staff";
        if (staffFilter.length === 1) {
            const member = staff.find((s) => s.id === staffFilter[0]);
            return member ? `${member.firstName} ${member.lastName}` : "All staff";
        }
        return `${staffFilter.length} staff selected`;
    }, [staff, staffFilter]);

    if (staff.length === 0) {
        return (
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground-1">Staff</h3>
                <div className="text-xs text-muted-foreground py-2">No staff assigned to this location.</div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground-1">Staff</h3>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        className={cn(
                            "w-full h-10 justify-between items-center font-normal transition-all focus-visible:ring-1 focus-visible:ring-offset-0 cursor-pointer",
                            "border-border bg-info-100 dark:bg-info-100 hover:bg-info-100 dark:hover:bg-info-100 hover:border-border focus:border-focus focus-visible:ring-focus",
                            staffFilter.length === 0 && "text-muted-foreground"
                        )}
                    >
                        <span className="flex items-center gap-2 min-w-0">
                            <User className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate text-left">{displayLabel}</span>
                        </span>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-foreground-3 dark:text-foreground-2 transition-transform shrink-0",
                                open && "rotate-180"
                            )}
                        />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[calc(100vw-2rem)] md:w-[420px] p-0 shadow-lg border border-border max-h-[min(320px,50vh)] overflow-hidden !z-[80]"
                    align="start"
                    side="bottom"
                    sideOffset={8}
                    avoidCollisions
                    collisionPadding={16}
                >
                    <Command shouldFilter={false}>
                        <CommandList className="max-h-[min(260px,40vh)] overflow-y-auto">
                            <CommandGroup>
                                <CommandItem
                                    value="all-staff"
                                    onSelect={() => handleToggleStaff(-1)}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn("mr-2 h-4 w-4", staffFilter.length === 0 ? "opacity-100" : "opacity-0")}
                                    />
                                    <span className="text-sm font-medium text-foreground">All staff</span>
                                </CommandItem>
                                {staff.map((member) => {
                                    const isSelected = staffFilter.includes(member.id);
                                    return (
                                        <CommandItem
                                            key={member.id}
                                            value={`${member.id} ${member.firstName} ${member.lastName}`}
                                            onSelect={() => handleToggleStaff(member.id)}
                                            className="cursor-pointer"
                                        >
                                            <Check
                                                className={cn("mr-2 h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                                            />
                                            <div className="flex items-center gap-2 min-w-0">
                                                {member.profileImage ? (
                                                    <img
                                                        src={member.profileImage}
                                                        alt=""
                                                        className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-foreground truncate">
                                                    {member.firstName} {member.lastName}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Calendar Filters (Status + Customer Search)
// ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'completed', label: 'Completed', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-500' },
    { value: 'no_show', label: 'No-Show', color: 'bg-red-500' },
] as const;

const CalendarFilters: FC = () => {
    const dispatch = useDispatch();
    const selectedLocationId = useSelector(getSelectedLocationId);
    const dayFilters = useSelector(getDayFilters);
    const staffFilter = useSelector(getStaffFilter);
    const [customerSearch, setCustomerSearch] = useState(dayFilters.clientName ?? '');
    const [locationServices, setLocationServices] = useState<LocationService[]>([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const dayFiltersRef = useRef(dayFilters);
    dayFiltersRef.current = dayFilters;

    const activeStatus = dayFilters.status ?? null;

    // Load services for the selected location (for service filter)
    useEffect(() => {
        if (!selectedLocationId) {
            setLocationServices([]);
            return;
        }
        setServicesLoading(true);
        fetchLocationFullAssignmentRequest(selectedLocationId)
            .then((data) => setLocationServices(data.services ?? []))
            .catch(() => setLocationServices([]))
            .finally(() => setServicesLoading(false));
    }, [selectedLocationId]);

    // Sync local search from Redux when filters are cleared or set externally
    useEffect(() => {
        const next = dayFilters.clientName ?? '';
        if (next !== customerSearch) setCustomerSearch(next);
    }, [dayFilters.clientName]);

    const handleStatusToggle = useCallback((status: string) => {
        const newFilters: CalendarDayFilters = {
            ...dayFilters,
            status: dayFilters.status === status ? undefined : status,
        };
        dispatch(setDayFiltersAction(newFilters));
    }, [dispatch, dayFilters]);

    const handleCustomerSearchInputChange = useCallback((value: string) => {
        setCustomerSearch(value);
    }, []);

    const handleApplyCustomerSearch = useCallback(() => {
        const trimmed = customerSearch.trim();
        const current = dayFiltersRef.current;
        if ((current.clientName ?? '') === trimmed) return;
        dispatch(setDayFiltersAction({
            ...current,
            clientName: trimmed || undefined,
        }));
    }, [customerSearch, dispatch]);

    const handleClearCustomerSearch = useCallback(() => {
        setCustomerSearch('');
        dispatch(setDayFiltersAction({
            ...dayFiltersRef.current,
            clientName: undefined,
        }));
    }, [dispatch]);

    const handleClearFilters = useCallback(() => {
        setCustomerSearch('');
        dispatch(setDayFiltersAction({}));
        dispatch(setStaffFilter([]));
    }, [dispatch]);

    const hasActiveFilters = activeStatus || (dayFilters.clientName ?? '').trim() || staffFilter.length > 0 || dayFilters.serviceId != null;

    return (
        <div className="space-y-4">
            {/* Section header (matches assignments list panel) */}
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground-1">
                    Filters
                </h3>
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Status pills (same pattern as assignment badges) */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleStatusToggle(opt.value)}
                            className={`
                                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border border-transparent
                                ${activeStatus === opt.value
                                    ? 'bg-primary/20 text-primary ring-1 ring-primary/30 border-primary/30'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-muted border-border'
                                }
                            `}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${opt.color}`} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Service filter (shared Select) */}
            {selectedLocationId && (
                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Service</Label>
                    <Select
                        value={dayFilters.serviceId != null ? String(dayFilters.serviceId) : 'all'}
                        onValueChange={(value) => {
                            const serviceId = value === 'all' ? undefined : Number(value);
                            dispatch(setDayFiltersAction({ ...dayFilters, serviceId }));
                        }}
                        disabled={servicesLoading}
                    >
                        <SelectTrigger className="w-full h-9 text-sm border-border bg-background text-foreground-1 hover:bg-muted/50 data-[placeholder]:text-muted-foreground">
                            <SelectValue placeholder="All services" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All services</SelectItem>
                            {locationServices.map((s) => (
                                <SelectItem key={s.serviceId} value={String(s.serviceId)}>
                                    {s.serviceName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Customer search: apply on Search button or Enter */}
            <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Customer</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Name, email, or phone"
                            value={customerSearch}
                            onChange={(e) => handleCustomerSearchInputChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleApplyCustomerSearch();
                                }
                            }}
                            className="w-full h-9 pl-8 pr-8 text-sm border border-border rounded-md bg-background text-foreground-1 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-colors"
                        />
                        {customerSearch ? (
                            <button
                                type="button"
                                onClick={handleClearCustomerSearch}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground-1 transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-9 shrink-0"
                        onClick={handleApplyCustomerSearch}
                    >
                        Search
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// CalendarSidebar
// ─────────────────────────────────────────────────────────────

/**
 * CalendarSidebar — left panel for location, date, filters, and staff.
 * Uses same theme and layout patterns as assignments/marketplace (no forced dark).
 */
export const CalendarSidebar: FC = () => {
    return (
        <aside className="w-72 flex-shrink-0 border-r border-border bg-background flex flex-col hidden md:flex">
            {/* Location selector */}
            <div className="p-3 border-b border-border shrink-0">
                <LocationSelector />
            </div>

            {/* Staff filter (multi-select, under Location) */}
            <div className="p-3 border-b border-border shrink-0">
                <StaffFilterSelect />
            </div>

            {/* Mini month calendar */}
            <div className="p-3 border-b border-border shrink-0">
                <MiniMonthCalendar />
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-border shrink-0">
                <CalendarFilters />
            </div>
        </aside>
    );
};
