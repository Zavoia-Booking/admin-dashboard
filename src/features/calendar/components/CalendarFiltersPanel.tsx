import { type FC, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getDayFilters,
    getHasActiveCalendarFilters,
    getLocationBundles,
    getLocationContextLoading,
    getLocationServices,
    getSelectedLocationId,
} from "../selectors.ts";
import { setDayFiltersAction, setStaffFilter } from "../actions.ts";
import { AppointmentBookingSource } from "../../../shared/types/calendar.ts";
import {
    Briefcase,
    Check,
    ChevronDown,
    Globe,
    Package,
    SlidersHorizontal,
    Tag,
    X,
} from "lucide-react";
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
import { Switch } from "../../../shared/components/ui/switch.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../shared/components/ui/collapsible.tsx";
import {
    CALENDAR_COMBO_TRIGGER,
    CALENDAR_FIELD_LABEL,
    CALENDAR_SELECT_TRIGGER,
} from "./calendarSidebarStyles.ts";

const STATUS_OPTIONS = [
    { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
    { value: "pending", label: "Pending", color: "bg-yellow-500" },
    { value: "completed", label: "Completed", color: "bg-green-500" },
    { value: "cancelled", label: "Cancelled", color: "bg-destructive" },
    { value: "no_show", label: "No-show", color: "bg-red-500" },
] as const;

const BOOKING_SOURCE_OPTIONS: { value: AppointmentBookingSource; label: string }[] = [
    { value: AppointmentBookingSource.ADMIN, label: "Admin" },
    { value: AppointmentBookingSource.MARKETPLACE, label: "Marketplace" },
    { value: AppointmentBookingSource.PHONE, label: "Phone" },
    { value: AppointmentBookingSource.WALK_IN, label: "Walk-in" },
];

/**
 * Calendar filter controls — used in the desktop sidebar and in the mobile filters sheet.
 * Layout aligns with calendar sidebar reference: FILTERS header, leading icons on fields, footer status + date.
 */
export const CalendarFiltersPanel: FC = () => {
    const dispatch = useDispatch();
    const selectedLocationId = useSelector(getSelectedLocationId);
    const dayFilters = useSelector(getDayFilters);
    const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
    const locationServices = useSelector(getLocationServices);
    const locationBundles = useSelector(getLocationBundles);
    const servicesLoading = useSelector(getLocationContextLoading);
    const [statusOpen, setStatusOpen] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(true);

    const selectedStatuses = useMemo(() => {
        if (dayFilters.statuses?.length) return dayFilters.statuses;
        if (dayFilters.status) return [dayFilters.status];
        return [];
    }, [dayFilters.statuses, dayFilters.status]);

    const selectedBookingSources = useMemo(
        () => dayFilters.bookingSources ?? [],
        [dayFilters.bookingSources],
    );

    const statusButtonLabel = useMemo(() => {
        if (selectedStatuses.length === 0) return "All statuses";
        if (selectedStatuses.length === 1) {
            const opt = STATUS_OPTIONS.find((o) => o.value === selectedStatuses[0]);
            return opt?.label ?? "1 status";
        }
        return `${selectedStatuses.length} statuses`;
    }, [selectedStatuses]);

    const bookingButtonLabel = useMemo(() => {
        if (selectedBookingSources.length === 0) return "All sources";
        if (selectedBookingSources.length === 1) {
            const opt = BOOKING_SOURCE_OPTIONS.find((o) => o.value === selectedBookingSources[0]);
            return opt?.label ?? "1 source";
        }
        return `${selectedBookingSources.length} sources`;
    }, [selectedBookingSources]);

    const toggleStatus = useCallback(
        (value: string) => {
            const next = selectedStatuses.includes(value)
                ? selectedStatuses.filter((s) => s !== value)
                : [...selectedStatuses, value];
            dispatch(
                setDayFiltersAction({
                    ...dayFilters,
                    statuses: next.length ? next : undefined,
                    status: undefined,
                }),
            );
        },
        [dispatch, dayFilters, selectedStatuses],
    );

    const toggleBookingSource = useCallback(
        (value: AppointmentBookingSource) => {
            const next = selectedBookingSources.includes(value)
                ? selectedBookingSources.filter((s) => s !== value)
                : [...selectedBookingSources, value];
            dispatch(
                setDayFiltersAction({
                    ...dayFilters,
                    bookingSources: next.length ? next : undefined,
                }),
            );
        },
        [dispatch, dayFilters, selectedBookingSources],
    );

    const handleClearFilters = useCallback(() => {
        dispatch(setDayFiltersAction({}));
        dispatch(setStaffFilter([]));
    }, [dispatch]);

    return (
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <SlidersHorizontal className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span className="text-sm font-semibold tracking-wide text-foreground-1">FILTERS</span>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                filtersOpen && "rotate-180",
                            )}
                            aria-hidden
                        />
                    </button>
                </CollapsibleTrigger>
                {hasActiveFilters ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 gap-1 px-2 text-xs font-medium text-primary hover:text-primary/90"
                        onClick={handleClearFilters}
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </Button>
                ) : null}
            </div>

            <CollapsibleContent className="data-[state=closed]:animate-none">
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
                        <div className="space-y-0.5 min-w-0">
                            <Label
                                htmlFor="calendar-unassigned-only"
                                className="text-sm font-medium text-foreground cursor-pointer"
                            >
                                Unassigned only
                            </Label>
                            <p className="text-xs text-muted-foreground leading-snug">
                                Show appointments with no staff
                            </p>
                        </div>
                        <Switch
                            id="calendar-unassigned-only"
                            checked={dayFilters.unassignedOnly === true}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    dispatch(setStaffFilter([]));
                                    dispatch(
                                        setDayFiltersAction({
                                            ...dayFilters,
                                            unassignedOnly: true,
                                            staffUserIds: undefined,
                                            staffUserId: undefined,
                                        }),
                                    );
                                } else {
                                    dispatch(
                                        setDayFiltersAction({
                                            ...dayFilters,
                                            unassignedOnly: undefined,
                                        }),
                                    );
                                }
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className={CALENDAR_FIELD_LABEL}>Status</Label>
                        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        CALENDAR_COMBO_TRIGGER,
                                        selectedStatuses.length === 0 && "text-muted-foreground",
                                    )}
                                >
                                    <span className="flex min-w-0 flex-1 items-center gap-2">
                                        <Tag className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                                        <span className="truncate text-left">{statusButtonLabel}</span>
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 shrink-0 text-foreground-3 transition-transform",
                                            statusOpen && "rotate-180",
                                        )}
                                    />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 !z-[80]" align="start">
                                <Command shouldFilter={false}>
                                    <CommandList className="max-h-[220px] overflow-y-auto">
                                        <CommandGroup>
                                            <CommandItem
                                                value="clear-status"
                                                onSelect={() => {
                                                    dispatch(
                                                        setDayFiltersAction({
                                                            ...dayFilters,
                                                            statuses: undefined,
                                                            status: undefined,
                                                        }),
                                                    );
                                                    setStatusOpen(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <span className="text-sm">All statuses</span>
                                            </CommandItem>
                                            {STATUS_OPTIONS.map((opt) => {
                                                const isSelected = selectedStatuses.includes(opt.value);
                                                return (
                                                    <CommandItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                        onSelect={() => toggleStatus(opt.value)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4 shrink-0",
                                                                isSelected ? "opacity-100" : "opacity-0",
                                                            )}
                                                        />
                                                        <span className={`h-1.5 w-1.5 rounded-full mr-2 shrink-0 ${opt.color}`} />
                                                        <span className="text-sm">{opt.label}</span>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {selectedLocationId ? (
                        <div className="space-y-2">
                            <Label className={CALENDAR_FIELD_LABEL}>Service</Label>
                            <Select
                                value={dayFilters.serviceId != null ? String(dayFilters.serviceId) : "all"}
                                onValueChange={(value) => {
                                    const serviceId = value === "all" ? undefined : Number(value);
                                    dispatch(
                                        setDayFiltersAction({
                                            ...dayFilters,
                                            serviceId,
                                            bundleId: serviceId != null ? undefined : dayFilters.bundleId,
                                        }),
                                    );
                                }}
                                disabled={servicesLoading}
                            >
                                <SelectTrigger className={cn(CALENDAR_SELECT_TRIGGER, "gap-2")}>
                                    <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                                    <SelectValue placeholder="All services" className="min-w-0" />
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
                    ) : null}

                    {selectedLocationId && locationBundles.length > 0 ? (
                        <div className="space-y-2">
                            <Label className={CALENDAR_FIELD_LABEL}>Bundle</Label>
                            <Select
                                value={dayFilters.bundleId != null ? String(dayFilters.bundleId) : "all"}
                                onValueChange={(value) => {
                                    const bundleId = value === "all" ? undefined : Number(value);
                                    dispatch(
                                        setDayFiltersAction({
                                            ...dayFilters,
                                            bundleId,
                                            serviceId: bundleId != null ? undefined : dayFilters.serviceId,
                                        }),
                                    );
                                }}
                                disabled={servicesLoading}
                            >
                                <SelectTrigger className={cn(CALENDAR_SELECT_TRIGGER, "gap-2")}>
                                    <Package className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                                    <SelectValue placeholder="All bundles" className="min-w-0" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All bundles</SelectItem>
                                    {locationBundles.map((b) => (
                                        <SelectItem key={b.bundleId} value={String(b.bundleId)}>
                                            {b.bundleName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <Label className={CALENDAR_FIELD_LABEL}>Booking source</Label>
                        <Popover open={bookingOpen} onOpenChange={setBookingOpen}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline" className={cn(CALENDAR_COMBO_TRIGGER)}>
                                    <span className="flex min-w-0 flex-1 items-center gap-2">
                                        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                                        <span className="truncate text-left">{bookingButtonLabel}</span>
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 shrink-0 text-foreground-3 transition-transform",
                                            bookingOpen && "rotate-180",
                                        )}
                                    />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 !z-[80]" align="start">
                                <Command shouldFilter={false}>
                                    <CommandList>
                                        <CommandGroup>
                                            <CommandItem
                                                value="clear-booking"
                                                onSelect={() => {
                                                    dispatch(
                                                        setDayFiltersAction({
                                                            ...dayFilters,
                                                            bookingSources: undefined,
                                                        }),
                                                    );
                                                    setBookingOpen(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <span className="text-sm">All sources</span>
                                            </CommandItem>
                                            {BOOKING_SOURCE_OPTIONS.map((opt) => {
                                                const isSelected = selectedBookingSources.includes(opt.value);
                                                return (
                                                    <CommandItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                        onSelect={() => toggleBookingSource(opt.value)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4 shrink-0",
                                                                isSelected ? "opacity-100" : "opacity-0",
                                                            )}
                                                        />
                                                        <span className="text-sm">{opt.label}</span>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
