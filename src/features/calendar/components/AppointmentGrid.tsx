import { type FC, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import { dayNames, getWeekStart, getWeekEnd, convertTo24Hour } from "../utils.ts";
import { AppointmentViewMode } from "../types.ts";
import type {
    SlimAppointment,
    CalendarBlockDto,
    CalendarStaffMember,
    DaySummary,
    AppointmentPreview,
} from "../../../shared/types/calendar.ts";
import {
    getDayAppointments,
    getDayBlocks,
    getDayDataLoading,
    getLocationStaff,
    getLocationWorkingHours,
    getLocationOpen247,
    getCalendarSummary,
    getSummaryLoading,
    getSelectedDate,
    getSelectedLocationId,
} from "../selectors.ts";
import { setSelectedDateAction, setViewModeAction, toggleEditFormAction } from "../actions.ts";
import { formatTime, getStaffDisplayNames } from "./utils.tsx";
import { getAppointmentDetailRequest } from "../api.ts";
import { Loader2, ShieldAlert } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 64; // px per hour
const GRID_START_HOUR = 6; // 6 AM
const GRID_END_HOUR = 22; // 10 PM
const GRID_HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);

const formatHourLabel = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
};

/** Get the status color class for appointment blocks */
const getAppointmentColor = (status: string): string => {
    switch (status) {
        case 'confirmed': return 'bg-blue-500 text-white';
        case 'completed': return 'bg-green-500 text-white';
        case 'no_show': return 'bg-red-400 text-white';
        case 'pending': return 'bg-orange-400 text-white';
        case 'cancelled': return 'bg-gray-400 text-white';
        default: return 'bg-primary text-primary-foreground';
    }
};

/** Calculate the top offset and height (px) for a time range on the grid */
const getTimePosition = (isoStart: string, isoEnd: string) => {
    const start = new Date(isoStart);
    const end = new Date(isoEnd);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const gridStartMinutes = GRID_START_HOUR * 60;

    const top = ((startMinutes - gridStartMinutes) / 60) * HOUR_HEIGHT;
    const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24); // min 24px
    return { top, height };
};

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

interface IProps {
    viewMode: AppointmentViewMode,
}

export const AppointmentGrid: FC<IProps> = ({ viewMode }) => {
    const selectedLocationId = useSelector(getSelectedLocationId);

    if (!selectedLocationId) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Select a location to view the calendar.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {viewMode === AppointmentViewMode.DAY && <DayTimeGrid />}
            {(viewMode === AppointmentViewMode.WEEK || viewMode === AppointmentViewMode.MONTH) && (
                <SummaryGrid viewMode={viewMode} />
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// Day Time Grid (staff columns + time slots)
// ─────────────────────────────────────────────────────────────

const DayTimeGrid: FC = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector(getSelectedDate);
    const dayAppointments = useSelector(getDayAppointments);
    const dayBlocks = useSelector(getDayBlocks);
    const isLoading = useSelector(getDayDataLoading);
    const locationStaff = useSelector(getLocationStaff);
    const workingHours = useSelector(getLocationWorkingHours);
    const open247 = useSelector(getLocationOpen247);

    // Get working hours for this day
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = workingHours?.[dayOfWeek as keyof typeof workingHours] ?? null;
    const isOpen = open247 || (todayHours?.isOpen ?? false);

    // Parse open/close hours for working hours overlay
    const openHour = useMemo(() => {
        if (open247) return GRID_START_HOUR;
        if (!todayHours?.isOpen) return GRID_START_HOUR;
        const [h] = convertTo24Hour(todayHours.open).split(':').map(Number);
        return h;
    }, [open247, todayHours]);

    const closeHour = useMemo(() => {
        if (open247) return GRID_END_HOUR;
        if (!todayHours?.isOpen) return GRID_START_HOUR;
        const parts = convertTo24Hour(todayHours.close).split(':').map(Number);
        return parts[1] > 0 ? parts[0] + 1 : parts[0]; // round up if there are minutes
    }, [open247, todayHours]);

    // Build columns: one per staff + "Unassigned"
    const columns = useMemo(() => {
        const staffCols = locationStaff.map(s => ({
            id: s.id,
            label: `${s.firstName} ${s.lastName}`,
            isUnassigned: false,
        }));
        return [...staffCols, { id: 0, label: 'Unassigned', isUnassigned: true }];
    }, [locationStaff]);

    // Group appointments by column
    const appointmentsByColumn = useMemo(() => {
        const map = new Map<number, SlimAppointment[]>();
        columns.forEach(col => map.set(col.id, []));

        for (const appt of dayAppointments) {
            if (appt.isUnassigned || appt.staffUserIds.length === 0) {
                map.get(0)?.push(appt);
            } else {
                for (const staffId of appt.staffUserIds) {
                    if (map.has(staffId)) {
                        map.get(staffId)!.push(appt);
                    } else {
                        // Staff not in this location (edge case) → unassigned
                        map.get(0)?.push(appt);
                    }
                }
            }
        }
        return map;
    }, [dayAppointments, columns]);

    // Group blocks by column
    const blocksByColumn = useMemo(() => {
        const map = new Map<number, CalendarBlockDto[]>();
        columns.forEach(col => map.set(col.id, []));

        for (const block of dayBlocks) {
            if (block.blockScope === 'staff' && block.userId) {
                if (map.has(block.userId)) {
                    map.get(block.userId)!.push(block);
                }
            } else {
                // Business or location scope → applies to all columns
                columns.forEach(col => map.get(col.id)?.push(block));
            }
        }
        return map;
    }, [dayBlocks, columns]);

    // Click handler: fetch full appointment detail and open edit drawer
    const handleAppointmentClick = useCallback(async (appointmentId: number) => {
        try {
            const fullAppointment = await getAppointmentDetailRequest(appointmentId);
            dispatch(toggleEditFormAction({ open: true, item: fullAppointment }));
        } catch {
            // silently fail — appointment may have been deleted
        }
    }, [dispatch]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading day view...</span>
                </CardContent>
            </Card>
        );
    }

    const dateLabel = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    return (
        <Card>
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">{dateLabel}</h3>
                    {!isOpen && (
                        <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                            <ShieldAlert className="h-3.5 w-3.5" /> Closed
                        </span>
                    )}
                </div>

                {/* Scrollable grid */}
                <div className="overflow-x-auto">
                    <div className="flex" style={{ minWidth: columns.length * 140 + 56 }}>
                        {/* Time gutter */}
                        <div className="flex flex-col items-end pr-2 select-none flex-shrink-0" style={{ width: 56 }}>
                            {/* Spacer for header row */}
                            <div className="h-8 flex-shrink-0" />
                            {GRID_HOURS.map(hour => (
                                <div key={hour} className="text-xs text-muted-foreground flex items-start justify-end" style={{ height: HOUR_HEIGHT }}>
                                    {formatHourLabel(hour)}
                                </div>
                            ))}
                        </div>

                        {/* Staff columns */}
                        {columns.map(col => {
                            const colAppointments = appointmentsByColumn.get(col.id) ?? [];
                            const colBlocks = blocksByColumn.get(col.id) ?? [];

                            return (
                                <div key={col.id} className="flex-1 min-w-[140px] border-l border-border">
                                    {/* Column header */}
                                    <div className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground border-b border-border truncate px-1">
                                        {col.label}
                                    </div>

                                    {/* Time slots */}
                                    <div className="relative" style={{ height: GRID_HOURS.length * HOUR_HEIGHT }}>
                                        {/* Hour grid lines */}
                                        {GRID_HOURS.map(hour => (
                                            <div
                                                key={hour}
                                                className={`border-b border-border ${
                                                    (!open247 && (hour < openHour || hour >= closeHour))
                                                        ? 'bg-gray-50'
                                                        : ''
                                                }`}
                                                style={{ height: HOUR_HEIGHT }}
                                            />
                                        ))}

                                        {/* Block overlays */}
                                        {colBlocks.map(block => {
                                            if (block.isAllDay) {
                                                return (
                                                    <div
                                                        key={`block-${block.id}`}
                                                        className="absolute inset-x-0 bg-red-100/40 border-l-2 border-red-300 z-[5]"
                                                        style={{ top: 0, height: GRID_HOURS.length * HOUR_HEIGHT }}
                                                        title={block.title || block.reason}
                                                    />
                                                );
                                            }
                                            const pos = getTimePosition(block.startsAt, block.endsAt);
                                            return (
                                                <div
                                                    key={`block-${block.id}`}
                                                    className="absolute inset-x-1 bg-red-100/50 border-l-2 border-red-300 rounded-sm z-[5]"
                                                    style={{ top: pos.top, height: pos.height }}
                                                    title={block.title || block.reason}
                                                >
                                                    <span className="text-[10px] text-red-600 px-1 truncate block">
                                                        {block.title || block.reason}
                                                    </span>
                                                </div>
                                            );
                                        })}

                                        {/* Appointment blocks */}
                                        {colAppointments.map(appt => {
                                            const pos = getTimePosition(appt.scheduledAt, appt.endsAt);
                                            return (
                                                <div
                                                    key={`appt-${appt.id}`}
                                                    className={`absolute left-1 right-1 rounded-md shadow-sm px-2 py-1 z-10 cursor-pointer overflow-hidden
                                                        hover:brightness-110 transition-all ${getAppointmentColor(appt.status)}`}
                                                    style={{ top: pos.top, height: pos.height }}
                                                    title={`${appt.customerName} - ${appt.bookedItemName}`}
                                                    onClick={() => handleAppointmentClick(appt.id)}
                                                >
                                                    <div className="font-medium text-[11px] truncate">{appt.bookedItemName}</div>
                                                    <div className="text-[10px] opacity-90 truncate">{appt.customerName}</div>
                                                    {pos.height > 40 && (
                                                        <div className="text-[10px] opacity-75">
                                                            {formatTime(appt.scheduledAt)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ─────────────────────────────────────────────────────────────
// Summary Grid (Week / Month view)
// ─────────────────────────────────────────────────────────────

const SummaryGrid: FC<{ viewMode: AppointmentViewMode }> = ({ viewMode }) => {
    const dispatch = useDispatch();
    const selectedDate = useSelector(getSelectedDate);
    const summary = useSelector(getCalendarSummary);
    const isLoading = useSelector(getSummaryLoading);
    const locationStaff = useSelector(getLocationStaff);

    const handleDayClick = useCallback((day: Date) => {
        dispatch(setSelectedDateAction(day));
        dispatch(setViewModeAction(AppointmentViewMode.DAY));
    }, [dispatch]);

    // Build the title
    const title = viewMode === AppointmentViewMode.WEEK
        ? `${getWeekStart(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${getWeekEnd(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        : selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Build date cells
    const dayCells = useMemo(() => {
        if (viewMode === AppointmentViewMode.WEEK) {
            const weekStart = getWeekStart(selectedDate);
            return Array.from({ length: 7 }, (_, i) => {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                return { date: day, isCurrentMonth: true };
            });
        }

        // Month view: full calendar grid
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const start = new Date(firstDay);
        start.setDate(firstDay.getDate() - firstDay.getDay());
        const end = new Date(lastDay);
        end.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

        const cells = [];
        const current = new Date(start);
        while (current <= end) {
            cells.push({
                date: new Date(current),
                isCurrentMonth: current.getMonth() === month,
            });
            current.setDate(current.getDate() + 1);
        }
        return cells;
    }, [viewMode, selectedDate]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading calendar...</span>
                </CardContent>
            </Card>
        );
    }

    const todayStr = new Date().toDateString();

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                </div>

                {/* Calendar header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1.5">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {dayCells.map(({ date, isCurrentMonth }) => {
                        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const daySummary: DaySummary | undefined = summary[dateKey];
                        const isToday = date.toDateString() === todayStr;
                        const isSelected = date.toDateString() === selectedDate.toDateString();

                        return (
                            <div
                                key={date.toDateString()}
                                className={`min-h-[90px] border border-border rounded-sm transition-colors relative cursor-pointer
                                    ${isCurrentMonth ? 'bg-white hover:bg-muted/10' : 'bg-muted/20 text-muted-foreground'}
                                    ${isToday ? 'ring-1 ring-primary' : ''}
                                    ${isSelected ? 'bg-primary/5' : ''}
                                    ${daySummary && !daySummary.isOpen ? 'bg-gray-50' : ''}`
                                }
                                onClick={() => handleDayClick(date)}
                            >
                                {/* Day number */}
                                <div className={`text-xs font-medium pl-1.5 pt-1 ${isToday ? 'text-primary font-bold' : 'opacity-60'}`}>
                                    {date.getDate()}
                                </div>

                                {/* Summary indicators */}
                                <div className="px-1.5 pt-1 space-y-0.5">
                                    {daySummary && (
                                        <>
                                            {daySummary.appointmentCount > 0 && (
                                                <div className="text-[10px] font-medium text-blue-600">
                                                    {daySummary.appointmentCount} appt{daySummary.appointmentCount !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                            {daySummary.blockedSlots > 0 && (
                                                <div className="text-[10px] text-red-500">
                                                    {daySummary.blockedSlots} block{daySummary.blockedSlots !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                            {!daySummary.isOpen && (
                                                <div className="text-[10px] text-muted-foreground italic">Closed</div>
                                            )}
                                            {/* Preview appointments (week view) */}
                                            {daySummary.firstAppointments?.map((preview: AppointmentPreview) => (
                                                <div
                                                    key={preview.id}
                                                    className={`text-[10px] truncate rounded-sm px-1 py-0.5 ${getAppointmentColor(preview.status)}`}
                                                >
                                                    {preview.customerName}
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}