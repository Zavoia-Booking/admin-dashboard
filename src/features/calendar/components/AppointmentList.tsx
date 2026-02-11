import { type FC, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import type { SlimAppointment } from "../../../shared/types/calendar.ts";
import {
    getDayAppointments,
    getDayDataLoading,
    getLocationStaff,
    getSelectedDate,
    getSelectedLocationId,
} from "../selectors.ts";
import { toggleEditFormAction } from "../actions.ts";
import { getAppointmentDetailRequest } from "../api.ts";
import { formatTimeRange, getStaffDisplayNames, getStatusBadge, getBookingSourceLabel } from "./utils.tsx";
import { Users, Clock, Loader2, CalendarX } from "lucide-react";
import { Badge } from "../../../shared/components/ui/badge.tsx";

export const AppointmentList: FC = () => {
    const dispatch = useDispatch();
    const selectedLocationId = useSelector(getSelectedLocationId);
    const dayAppointments = useSelector(getDayAppointments);
    const isDayLoading = useSelector(getDayDataLoading);
    const locationStaff = useSelector(getLocationStaff);
    const selectedDate = useSelector(getSelectedDate);

    // Click handler: fetch full appointment detail and open edit drawer
    // (must be declared before early returns to satisfy Rules of Hooks)
    const handleAppointmentClick = useCallback(async (appointmentId: number) => {
        try {
            const fullAppointment = await getAppointmentDetailRequest(appointmentId);
            dispatch(toggleEditFormAction({ open: true, item: fullAppointment }));
        } catch {
            // silently fail — appointment may have been deleted
        }
    }, [dispatch]);

    // No location selected yet
    if (!selectedLocationId) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Select a location to view appointments.</p>
                </CardContent>
            </Card>
        );
    }

    // Loading state
    if (isDayLoading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading appointments...</span>
                </CardContent>
            </Card>
        );
    }

    const dateLabel = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="space-y-3">
            {/* Day header */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-foreground">
                    {dateLabel}
                </h3>
                <span className="text-xs text-muted-foreground">
                    {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Empty state */}
            {dayAppointments.length === 0 && (
                <Card>
                    <CardContent className="p-8 flex flex-col items-center gap-2">
                        <CalendarX className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No appointments for this day.</p>
                    </CardContent>
                </Card>
            )}

            {/* Appointment cards */}
            {dayAppointments.map((appointment: SlimAppointment) => (
                <SlimAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    staffNames={getStaffDisplayNames(appointment.staffUserIds, locationStaff)}
                    onClick={() => handleAppointmentClick(appointment.id)}
                />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Slim Appointment Card (uses new data shape)
// ─────────────────────────────────────────────────────────────

interface SlimCardProps {
    appointment: SlimAppointment;
    staffNames: string;
    onClick: () => void;
}

const SlimAppointmentCard: FC<SlimCardProps> = ({ appointment, staffNames, onClick }) => {
    const timeRange = formatTimeRange(appointment.scheduledAt, appointment.endsAt);

    return (
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                    {/* Left: appointment details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Customer name */}
                        <h4 className="font-medium text-sm text-foreground truncate">
                            {appointment.customerName}
                        </h4>
                        {/* Service */}
                        <p className="text-xs text-muted-foreground truncate">
                            {appointment.bookedItemName}
                        </p>
                        {/* Staff */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                                {staffNames}
                            </span>
                            {appointment.isUnassigned && (
                                <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-4 border-orange-300 text-orange-600">
                                    Unassigned
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Right: status + time + source */}
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
}