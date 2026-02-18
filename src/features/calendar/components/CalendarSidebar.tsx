import { type FC, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LocationSelector } from "./LocationSelector.tsx";
import { MiniMonthCalendar } from "./MiniMonthCalendar.tsx";
import { getLocationStaff, getStaffFilter, getDayFilters } from "../selectors.ts";
import { setStaffFilter, setDayFiltersAction } from "../actions.ts";
import type { CalendarStaffMember, CalendarDayFilters } from "../../../shared/types/calendar.ts";
import { User, Search, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Staff Filter List
// ─────────────────────────────────────────────────────────────

const StaffFilterList: FC = () => {
    const dispatch = useDispatch();
    const staff: CalendarStaffMember[] = useSelector(getLocationStaff);
    const staffFilter: number[] = useSelector(getStaffFilter);
    const dayFilters = useSelector(getDayFilters);

    // Empty filter means "show all"
    const allSelected = staffFilter.length === 0;

    const syncStaffFilterToDayPayload = useCallback((visibleStaffIds: number[]) => {
        dispatch(setDayFiltersAction({
            ...dayFilters,
            staffUserId: visibleStaffIds.length === 1 ? visibleStaffIds[0] : undefined,
        }));
    }, [dispatch, dayFilters]);

    const handleToggleAll = useCallback(() => {
        dispatch(setStaffFilter([])); // empty = show all
        syncStaffFilterToDayPayload([]);
    }, [dispatch, syncStaffFilterToDayPayload]);

    const handleToggleStaff = useCallback((staffId: number) => {
        if (allSelected) {
            // From "All staff", selecting a member means "only this staff"
            const nextVisible = [staffId];
            dispatch(setStaffFilter(nextVisible));
            syncStaffFilterToDayPayload(nextVisible);
        } else {
            const isCurrentlySelected = staffFilter.includes(staffId);
            if (isCurrentlySelected) {
                const next = staffFilter.filter(id => id !== staffId);
                // If removing the last one, revert to "all"
                const nextVisible = next.length === 0 ? [] : next;
                dispatch(setStaffFilter(nextVisible));
                syncStaffFilterToDayPayload(nextVisible);
            } else {
                const next = [...staffFilter, staffId];
                // If every staff member is selected, normalize to "all"
                if (next.length === staff.length) {
                    dispatch(setStaffFilter([]));
                    syncStaffFilterToDayPayload([]);
                } else {
                    dispatch(setStaffFilter(next));
                    syncStaffFilterToDayPayload(next);
                }
            }
        }
    }, [dispatch, staff, staffFilter, allSelected, syncStaffFilterToDayPayload]);

    if (staff.length === 0) {
        return (
            <div className="text-xs text-muted-foreground py-2">
                No staff assigned to this location.
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Staff
            </div>

            {/* All Staff toggle */}
            <label className="flex items-center gap-2 px-1.5 py-1.5 rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors">
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleAll}
                    className="h-3.5 w-3.5 rounded border-sidebar-border accent-primary"
                />
                <span className="text-sm font-medium">All Staff</span>
            </label>

            {/* Individual staff toggles */}
            {staff.map((member) => {
                const isChecked = allSelected || staffFilter.includes(member.id);
                return (
                    <label
                        key={member.id}
                        className="flex items-center gap-2 px-1.5 py-1.5 rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors"
                    >
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleStaff(member.id)}
                            className="h-3.5 w-3.5 rounded border-sidebar-border accent-primary"
                        />
                        {member.profileImage ? (
                            <img
                                src={member.profileImage}
                                alt=""
                                className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="h-5 w-5 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                                <User className="h-3 w-3 text-muted-foreground" />
                            </div>
                        )}
                        <span className="text-sm truncate">{member.firstName} {member.lastName}</span>
                    </label>
                );
            })}
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
    const dayFilters = useSelector(getDayFilters);
    const [customerSearch, setCustomerSearch] = useState(dayFilters.clientName ?? '');

    const activeStatus = dayFilters.status ?? null;

    const handleStatusToggle = useCallback((status: string) => {
        const newFilters: CalendarDayFilters = {
            ...dayFilters,
            status: dayFilters.status === status ? undefined : status,
        };
        dispatch(setDayFiltersAction(newFilters));
    }, [dispatch, dayFilters]);

    const handleCustomerSearch = useCallback((value: string) => {
        setCustomerSearch(value);
        // Debounce-like: dispatch on every change (saga re-fetches)
        const newFilters: CalendarDayFilters = {
            ...dayFilters,
            clientName: value.trim() || undefined,
        };
        dispatch(setDayFiltersAction(newFilters));
    }, [dispatch, dayFilters]);

    const handleCustomerSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleCustomerSearch(e.target.value);
    }, [handleCustomerSearch]);

    const handleClearCustomerSearch = useCallback(() => {
        handleCustomerSearch('');
    }, [handleCustomerSearch]);

    const handleClearFilters = useCallback(() => {
        setCustomerSearch('');
        dispatch(setDayFiltersAction({}));
    }, [dispatch]);

    const hasActiveFilters = activeStatus || customerSearch.trim();

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Filters
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => handleStatusToggle(opt.value)}
                        className={`
                            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                            ${activeStatus === opt.value
                                ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                                : 'bg-sidebar-accent/50 text-muted-foreground hover:bg-sidebar-accent'
                            }
                        `}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${opt.color}`} />
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Customer search */}
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search customer..."
                    value={customerSearch}
                    onChange={handleCustomerSearchInputChange}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-sidebar-accent/50 border border-sidebar-border rounded-md placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                />
                {customerSearch && (
                    <button
                        onClick={handleClearCustomerSearch}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// CalendarSidebar
// ─────────────────────────────────────────────────────────────

/**
 * CalendarSidebar — dark-themed left sidebar.
 * Contains location selector, mini month calendar, and staff filter list.
 * Wrapped in `dark` class to force dark appearance.
 */
export const CalendarSidebar: FC = () => {
    return (
        <aside className="dark w-72 h-full flex-shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col hidden md:flex">
            {/* Location selector */}
            <div className="p-3 border-b border-sidebar-border">
                <LocationSelector />
            </div>

            {/* Mini month calendar */}
            <div className="p-3 border-b border-sidebar-border">
                <MiniMonthCalendar />
            </div>

            {/* Filters (status + customer search) */}
            <div className="p-3 border-b border-sidebar-border">
                <CalendarFilters />
            </div>

            {/* Staff filter list */}
            <div className="flex-1 p-3 overflow-y-auto">
                <StaffFilterList />
            </div>
        </aside>
    );
};
