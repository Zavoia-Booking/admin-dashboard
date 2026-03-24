import { type FC, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import type { SlimAppointment } from "../../../shared/types/calendar.ts";
import {
    getWeekData,
    getWeekDataLoading,
    getLocationStaff,
    getSelectedLocationId,
    getEffectiveStaffFilterIds,
    getHasActiveCalendarFilters,
    getWeekViewDisplayStart,
    getSelectedDate,
} from "../selectors.ts";
import { toggleEditFormAction, setDayFiltersAction, setStaffFilter } from "../actions.ts";
import { getAppointmentDetailRequest, getAppointmentGroupRequest } from "../api.ts";
import { formatTimeRange, getStaffDisplayNames, getStatusBadge, getBookingSourceLabel } from "./utils.tsx";
import { Users, Clock, Loader2, CalendarX } from "lucide-react";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import { getWeekStart } from "../utils.ts";
import { calendarPreferences } from "../calendarPreferences.ts";
import { getAppointmentBlockColors } from "../colors.ts";

export const WeekAppointmentList: FC = () => {
    const dispatch = useDispatch();
    const selectedLocationId = useSelector(getSelectedLocationId);
    const weekData = useSelector(getWeekData);
    const isLoading = useSelector(getWeekDataLoading);
    const locationStaff = useSelector(getLocationStaff);
    const staffFilter = useSelector(getEffectiveStaffFilterIds);
    const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
    const weekDisplayStart = useSelector(getWeekViewDisplayStart);
    const selectedDate = useSelector(getSelectedDate);

    const weekDays = useMemo(() => {
        const ws = weekDisplayStart ?? getWeekStart(selectedDate ?? new Date());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(ws);
            d.setDate(ws.getDate() + i);
            return d;
        });
    }, [weekDisplayStart, selectedDate]);

    const handleAppointmentClick = useCallback(
        async (appointment: SlimAppointment) => {
            try {
                const bookingGroupId = (appointment as { bookingGroupId?: string }).bookingGroupId;
                if (bookingGroupId) {
                    const list = await getAppointmentGroupRequest(bookingGroupId);
                    const arr = Array.isArray(list) ? list : [];
                    const item = arr.find((a: { id: number }) => a.id === appointment.id) ?? arr[0];
                    if (item) {
                        dispatch(toggleEditFormAction({ open: true, item, groupAppointments: arr }));
                    }
                } else {
                    const fullAppointment = await getAppointmentDetailRequest(appointment.id);
                    dispatch(toggleEditFormAction({ open: true, item: fullAppointment }));
                }
            } catch {
                // silently fail — appointment may have been deleted
            }
        },
        [dispatch]
    );

    if (!selectedLocationId) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Select a location to view appointments.</p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading week...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="p-4 space-y-6">
            {weekDays.map((day) => {
                const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                const dayData = weekData?.[dateKey];
                let appointments: SlimAppointment[] = dayData?.appointments ?? [];
                if (staffFilter.length > 0) {
                    appointments = appointments.filter((appointment) => {
                        if (appointment.isUnassigned || appointment.staffUserIds.length === 0) return false;
                        return appointment.staffUserIds.some((id) => staffFilter.includes(id));
                    });
                }

                const dateLabel = day.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                });

                return (
                    <section key={dateKey} className="space-y-2">
                        <div className="flex items-center justify-between px-1 sticky top-0 bg-background/95 py-1.5 z-10">
                            <h3 className="text-sm font-semibold text-foreground">{dateLabel}</h3>
                            <span className="text-xs text-muted-foreground">
                                {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {appointments.length === 0 ? (
                            <div className="py-4 px-3 rounded-lg bg-muted/30 flex flex-col gap-2 text-muted-foreground text-sm">
                                <div className="flex items-center gap-2">
                                    <CalendarX className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                        {hasActiveFilters
                                            ? "No appointments match your filters for this day."
                                            : "No appointments"}
                                    </span>
                                </div>
                                {hasActiveFilters ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="self-start"
                                        onClick={() => {
                                            dispatch(setDayFiltersAction({}));
                                            dispatch(setStaffFilter([]));
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                ) : null}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {appointments.map((appointment) => (
                                    <SlimAppointmentCard
                                        key={appointment.id}
                                        appointment={appointment}
                                        staffNames={getStaffDisplayNames(appointment.staffUserIds, locationStaff)}
                                        onClick={() => handleAppointmentClick(appointment)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Reuse same card as AppointmentList
// ─────────────────────────────────────────────────────────────

interface SlimCardProps {
    appointment: SlimAppointment;
    staffNames: string;
    onClick: () => void;
}

const SlimAppointmentCard: FC<SlimCardProps> = ({ appointment, staffNames, onClick }) => {
    const timeRange = formatTimeRange(appointment.scheduledAt, appointment.endsAt);
    const colorCoding = calendarPreferences.getColorCoding();
    const { backgroundColor } = getAppointmentBlockColors(appointment, colorCoding);

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={onClick}
            style={{ borderLeftWidth: 4, borderLeftStyle: "solid", borderLeftColor: backgroundColor }}
        >
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <h4 className="font-medium text-sm text-foreground truncate">{appointment.customerName}</h4>
                        <p className="text-xs text-muted-foreground truncate">{appointment.bookedItemName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{staffNames}</span>
                            {appointment.isUnassigned && (
                                <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-4 border-orange-300 text-orange-600">
                                    Unassigned
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                        {getStatusBadge(appointment.status)}
                        <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                            <Clock className="h-3 w-3" />
                            {timeRange}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                            {getBookingSourceLabel(appointment.bookingSource)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
