import { type FC, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LocationSelector } from "./LocationSelector.tsx";
import { MiniMonthCalendar } from "./MiniMonthCalendar.tsx";
import { CalendarFiltersPanel } from "./CalendarFiltersPanel.tsx";
import { CustomerFilterPicker } from "./CustomerFilterPicker.tsx";
import { getLocationStaff, getStaffFilter, getDayFilters, getHasActiveCalendarFilters, getSelectedDate } from "../selectors.ts";
import { setStaffFilter, setDayFiltersAction } from "../actions.ts";
import { type CalendarStaffMember } from "../../../shared/types/calendar.ts";
import type { Customer } from "../../../shared/types/customer.ts";
import { User, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../../shared/components/ui/popover.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import {
    Command,
    CommandList,
    CommandGroup,
    CommandItem,
} from "../../../shared/components/ui/command.tsx";
import { Label } from "../../../shared/components/ui/label.tsx";
import { cn } from "../../../shared/lib/utils";
import { CALENDAR_COMBO_TRIGGER } from "./calendarSidebarStyles.ts";

// ─────────────────────────────────────────────────────────────
// Staff Filter (multi-select) — trigger matches other sidebar combos
// ─────────────────────────────────────────────────────────────

const StaffFilterSelect: FC = () => {
    const dispatch = useDispatch();
    const staff: CalendarStaffMember[] = useSelector(getLocationStaff);
    const staffFilterRaw: number[] = useSelector(getStaffFilter);
    const dayFilters = useSelector(getDayFilters);
    const [open, setOpen] = useState(false);

    const staffFilter = useMemo(
        () => staffFilterRaw.filter((id) => staff.some((s) => s.id === id)),
        [staffFilterRaw, staff],
    );

    const syncStaffFilterToDayPayload = useCallback(
        (visibleStaffIds: number[]) => {
            const allSelected =
                visibleStaffIds.length === 0 || visibleStaffIds.length === staff.length;
            dispatch(
                setDayFiltersAction({
                    ...dayFilters,
                    staffUserIds: allSelected ? undefined : visibleStaffIds,
                    staffUserId: undefined,
                    unassignedOnly: false,
                }),
            );
        },
        [dispatch, dayFilters, staff.length],
    );

    const handleToggleStaff = useCallback(
        (staffId: number) => {
            const isAll = staffFilter.length === 0;
            if (staffId === -1) {
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
        [dispatch, staff, staffFilter, syncStaffFilterToDayPayload],
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
            <div className="text-xs text-muted-foreground py-1">
                No staff assigned to this location.
            </div>
        );
    }

    const staffDisabled = dayFilters.unassignedOnly === true;

    return (
        <div className="space-y-2">
            {staffDisabled ? (
                <p className="text-xs text-muted-foreground">
                    Turn off &quot;Unassigned only&quot; in Filters to narrow by team member.
                </p>
            ) : null}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        disabled={staffDisabled}
                        className={cn(
                            CALENDAR_COMBO_TRIGGER,
                            staffFilter.length === 0 && "text-muted-foreground",
                        )}
                    >
                        <span className="flex items-center gap-2 min-w-0">
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="truncate text-left">{displayLabel}</span>
                        </span>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-foreground-3 dark:text-foreground-2 transition-transform shrink-0",
                                open && "rotate-180",
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
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            staffFilter.length === 0 ? "opacity-100" : "opacity-0",
                                        )}
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
                                                className={cn(
                                                    "mr-2 h-4 w-4 shrink-0",
                                                    isSelected ? "opacity-100" : "opacity-0",
                                                )}
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
// CalendarSidebar
// ─────────────────────────────────────────────────────────────

/**
 * CalendarSidebar — left panel for location, team, month, and filters.
 * Sections are separated by horizontal dividers (no inset cards).
 */
export const CalendarSidebar: FC = () => {
    const dispatch = useDispatch();
    const dayFilters = useSelector(getDayFilters);
    const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
    const selectedDate = useSelector(getSelectedDate);

    const selectedCustomer = useMemo<Pick<Customer, "id" | "firstName" | "lastName" | "email" | "phone"> | null>(() => {
        if (dayFilters.customerId == null) return null;
        const [firstName = "", ...rest] = (dayFilters.customerFullName ?? "").trim().split(" ").filter(Boolean);
        return {
            id: dayFilters.customerId,
            firstName,
            lastName: rest.join(" "),
            email: dayFilters.customerEmail ?? "",
            phone: dayFilters.customerPhone ?? "",
        };
    }, [dayFilters.customerId, dayFilters.customerFullName, dayFilters.customerEmail, dayFilters.customerPhone]);

    const handleSelectCustomer = useCallback((customer: Pick<Customer, "id" | "firstName" | "lastName" | "email" | "phone">) => {
        dispatch(
            setDayFiltersAction({
                ...dayFilters,
                clientName: undefined,
                customerId: customer.id,
                customerEmail: customer.email || undefined,
                customerPhone: customer.phone || undefined,
                customerFullName: `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || undefined,
            }),
        );
    }, [dispatch, dayFilters]);

    const handleClearCustomerFilter = useCallback(() => {
        dispatch(
            setDayFiltersAction({
                ...dayFilters,
                clientName: undefined,
                customerId: undefined,
                customerEmail: undefined,
                customerPhone: undefined,
                customerFullName: undefined,
            }),
        );
    }, [dispatch, dayFilters]);

    const footerDateLabel = useMemo(
        () =>
            selectedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
        [selectedDate],
    );

    return (
        <aside className="w-72 flex-shrink-0 border-r border-border bg-white dark:bg-surface flex flex-col hidden md:flex min-h-0">
            <div className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto scrollbar-hide">
                <div className="px-3 py-4">
                    <LocationSelector />
                </div>
                <div className="px-3 py-4">
                    <Label className="mb-2 block text-xs font-medium text-muted-foreground">Staff</Label>
                    <StaffFilterSelect />
                </div>
                <div className="px-3 py-4">
                    <MiniMonthCalendar />
                </div>
                <div className="px-3 py-4">
                    <Label className="mb-2 block text-xs font-medium text-muted-foreground">Customer</Label>
                    <CustomerFilterPicker
                        selectedCustomer={selectedCustomer}
                        onSelectCustomer={handleSelectCustomer}
                        onClearCustomer={handleClearCustomerFilter}
                    />
                </div>
                <div className="min-h-0 flex-1 px-3 py-4">
                    <CalendarFiltersPanel />
                </div>
            </div>
            <div className="shrink-0 border-t border-border bg-white dark:bg-surface px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                        {hasActiveFilters ? "Filters active" : "No filters applied"}
                    </span>
                    <span className="text-xs font-medium tabular-nums text-foreground-1">{footerDateLabel}</span>
                </div>
            </div>
        </aside>
    );
};
