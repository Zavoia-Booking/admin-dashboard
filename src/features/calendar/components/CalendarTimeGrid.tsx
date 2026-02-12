import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getDayAppointments,
  getDayBlocks,
  getDayDataLoading,
  getLocationStaff,
  getLocationWorkingHours,
  getLocationOpen247,
  getSelectedDate,
  getWeekData,
  getWeekDataLoading,
  getStaffFilter,
  getSelectedLocationId,
} from "../selectors.ts";
import { deleteCalendarBlock, setSelectedDateAction, setViewModeAction, toggleEditFormAction } from "../actions.ts";
import { AppointmentViewMode } from "../types.ts";
import type {
  SlimAppointment,
  CalendarBlockDto,
  CalendarStaffMember,
  DayDataResponse,
} from "../../../shared/types/calendar.ts";
import { convertTo24Hour, getWeekStart } from "../utils.ts";
import { AppointmentBlock } from "./AppointmentBlock.tsx";
import { WeekDayStrip } from "./WeekDayStrip.tsx";
import { formatTimeRange, getStaffDisplayNames } from "./utils.tsx";
import { Loader2, Clock, MapPin, User, Trash2, ShieldAlert } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../../../shared/components/ui/popover.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shared/components/ui/alert-dialog.tsx";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 80; // px per hour - taller for better visibility
const GRID_START_HOUR = 6; // 6 AM
const GRID_END_HOUR = 22; // 10 PM
const GRID_HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
const GUTTER_WIDTH = 60; // px - slightly wider for cleaner look

const formatHourLabel = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

/** Calculate top offset and height (px) for a time range on the grid */
const getTimePosition = (isoStart: string, isoEnd: string) => {
  const start = new Date(isoStart);
  const end = new Date(isoEnd);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const gridStartMinutes = GRID_START_HOUR * 60;

  const top = ((startMinutes - gridStartMinutes) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24);
  return { top, height };
};

const getBlockReasonLabel = (reason: string): string => {
  switch (reason) {
    case 'holiday': return 'Holiday';
    case 'vacation': return 'Vacation';
    case 'sick': return 'Sick';
    case 'lunch_break': return 'Lunch Break';
    case 'break': return 'Break';
    case 'meeting': return 'Meeting';
    case 'personal': return 'Personal';
    case 'maintenance': return 'Maintenance';
    case 'other': return 'Other';
    default: return reason;
  }
};

const getBlockScopeLabel = (scope: string): string => {
  switch (scope) {
    case 'location': return 'Location Block';
    case 'staff': return 'Staff Time Off';
    case 'business': return 'Business Block';
    default: return scope;
  }
};

// ─────────────────────────────────────────────────────────────
// Block Detail Popover
// ─────────────────────────────────────────────────────────────

interface BlockDetailPopoverProps {
  block: CalendarBlockDto;
  staffName: string | null;
  children: React.ReactNode;
}

const BlockDetailPopover: FC<BlockDetailPopoverProps> = ({ block, staffName, children }) => {
  const dispatch = useDispatch();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleDelete = useCallback(() => {
    dispatch(deleteCalendarBlock.request(block.id));
    setShowDeleteConfirm(false);
    setPopoverOpen(false);
  }, [dispatch, block.id]);

  const timeDisplay = block.isAllDay
    ? 'All day'
    : formatTimeRange(block.startsAt, block.endsAt);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-64 p-0">
          <div className="px-3 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/20 rounded-t-md">
            <div className="font-medium text-sm text-foreground">
              {block.title || getBlockReasonLabel(block.reason)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {getBlockScopeLabel(block.blockScope)}
            </div>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span>{timeDisplay}</span>
            </div>
            {block.title && (
              <div className="flex items-center gap-2 text-xs text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span>{getBlockReasonLabel(block.reason)}</span>
              </div>
            )}
            {block.blockScope === 'staff' && staffName && (
              <div className="flex items-center gap-2 text-xs text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span>{staffName}</span>
              </div>
            )}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Block
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete block?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the {getBlockScopeLabel(block.blockScope).toLowerCase()}
              {block.title ? ` "${block.title}"` : ''}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Time Column — shared column renderer for both Day and Week views
// ─────────────────────────────────────────────────────────────

interface TimeColumnProps {
  appointments: SlimAppointment[];
  blocks: CalendarBlockDto[];
  locationStaff: CalendarStaffMember[];
  openHour: number;
  closeHour: number;
  open247: boolean;
  isToday: boolean;
}

const TimeColumn: FC<TimeColumnProps> = ({
  appointments,
  blocks,
  locationStaff,
  openHour,
  closeHour,
  open247,
  isToday,
}) => {
  const gridHeight = GRID_HOURS.length * HOUR_HEIGHT;

  return (
    <div className="relative" style={{ height: gridHeight }}>
      {/* Hour grid lines + working hours shading */}
      {GRID_HOURS.map(hour => (
        <div
          key={hour}
          className={`border-b border-dashed border-border ${(!open247 && (hour < openHour || hour >= closeHour))
              ? 'bg-muted/30'
              : ''
            }`}
          style={{ height: HOUR_HEIGHT }}
        />
      ))}

      {/* Current time indicator (only on today's column) */}
      {isToday && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
          style={{ top: ((new Date().getHours() * 60 + new Date().getMinutes()) - (GRID_START_HOUR * 60)) / 60 * HOUR_HEIGHT }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 ring-2 ring-white dark:ring-neutral-900" />
          <div className="flex-1 h-[2px] bg-red-500" />
        </div>
      )}

      {/* Block overlays */}
      {blocks.map(block => {
        const staffName = block.blockScope === 'staff' && block.userId
          ? getStaffDisplayNames([block.userId], locationStaff)
          : null;

        if (block.isAllDay) {
          return (
            <BlockDetailPopover key={`block-${block.id}`} block={block} staffName={staffName}>
              <div
                className="absolute inset-x-0 bg-gray-100/80 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600 z-[5] cursor-pointer hover:bg-gray-200/80 dark:hover:bg-gray-800/70 transition-colors"
                style={{ top: 0, height: gridHeight }}
                title={block.title || block.reason}
              />
            </BlockDetailPopover>
          );
        }
        const pos = getTimePosition(block.startsAt, block.endsAt);
        return (
          <BlockDetailPopover key={`block-${block.id}`} block={block} staffName={staffName}>
            <div
              className="absolute inset-x-1 bg-gray-100/80 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600 rounded-sm z-[5] cursor-pointer hover:bg-gray-200/80 dark:hover:bg-gray-800/70 transition-colors"
              style={{ top: pos.top, height: pos.height }}
              title={block.title || getBlockReasonLabel(block.reason)}
            >
              <span className="text-[10px] text-gray-600 dark:text-gray-400 px-1 truncate block">
                {block.title || getBlockReasonLabel(block.reason)}
              </span>
            </div>
          </BlockDetailPopover>
        );
      })}

      {/* Appointment blocks */}
      {appointments.map(appt => {
        const pos = getTimePosition(appt.scheduledAt, appt.endsAt);
        return (
          <AppointmentBlock
            key={`appt-${appt.id}`}
            appointment={appt}
            top={pos.top}
            height={pos.height}
          />
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CalendarTimeGrid — main export
// ─────────────────────────────────────────────────────────────

interface CalendarTimeGridProps {
  viewMode: AppointmentViewMode;
}

export const CalendarTimeGrid: FC<CalendarTimeGridProps> = ({ viewMode }) => {
  const selectedLocationId = useSelector(getSelectedLocationId);

  if (!selectedLocationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Select a location to view the calendar.</p>
      </div>
    );
  }

  if (viewMode === AppointmentViewMode.DAY) {
    return <DayGrid />;
  }

  return <WeekGrid />;
};

// ─────────────────────────────────────────────────────────────
// Day Grid — staff columns + unassigned lane
// ─────────────────────────────────────────────────────────────

const DayGrid: FC = () => {
  const selectedDate = useSelector(getSelectedDate);
  const dayAppointments = useSelector(getDayAppointments);
  const dayBlocks = useSelector(getDayBlocks);
  const isLoading = useSelector(getDayDataLoading);
  const locationStaff = useSelector(getLocationStaff);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const staffFilter = useSelector(getStaffFilter);

  const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = workingHours?.[dayOfWeek as keyof typeof workingHours] ?? null;
  const isOpen = open247 || (todayHours?.isOpen ?? false);
  const isToday = selectedDate.toDateString() === new Date().toDateString();

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
    return parts[1] > 0 ? parts[0] + 1 : parts[0];
  }, [open247, todayHours]);

  // Build visible columns (respect staff filter)
  const columns = useMemo(() => {
    let staffCols = locationStaff.map(s => ({
      id: s.id,
      label: `${s.firstName} ${s.lastName}`,
      isUnassigned: false,
    }));

    // Apply staff filter
    if (staffFilter.length > 0) {
      staffCols = staffCols.filter(col => staffFilter.includes(col.id));
    }

    return [...staffCols, { id: 0, label: 'Unassigned', isUnassigned: true }];
  }, [locationStaff, staffFilter]);

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
        columns.forEach(col => map.get(col.id)?.push(block));
      }
    }
    return map;
  }, [dayBlocks, columns]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading day view...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Closed day indicator */}
      {!isOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-border">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400 font-medium">Location is closed this day</span>
        </div>
      )}

      {/* Scrollable grid */}
      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: columns.length * 140 + GUTTER_WIDTH }}>
          {/* Time gutter */}
          <div className="flex flex-col items-end pr-2 select-none flex-shrink-0" style={{ width: GUTTER_WIDTH }}>
            {/* Spacer for column header */}
            <div className="h-8 flex-shrink-0" />
            {GRID_HOURS.map(hour => (
              <div key={hour} className="text-[11px] text-muted-foreground flex items-start justify-end" style={{ height: HOUR_HEIGHT }}>
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Staff columns */}
          {columns.map(col => (
            <div key={col.id} className="flex-1 min-w-[140px] border-l border-border">
              {/* Column header */}
              <div className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground border-b border-border truncate px-1">
                {col.label}
              </div>
              <TimeColumn
                appointments={appointmentsByColumn.get(col.id) ?? []}
                blocks={blocksByColumn.get(col.id) ?? []}
                locationStaff={locationStaff}
                openHour={openHour}
                closeHour={closeHour}
                open247={open247}
                isToday={isToday}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Week Grid — 7 day columns
// ─────────────────────────────────────────────────────────────

const WeekGrid: FC = () => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const weekData = useSelector(getWeekData);
  const isLoading = useSelector(getWeekDataLoading);
  const locationStaff = useSelector(getLocationStaff);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const staffFilter = useSelector(getStaffFilter);

  const todayStr = new Date().toDateString();

  // Build 7 days for the week
  const weekDays = useMemo(() => {
    const ws = getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  // Parse working hours for each day
  const dayWorkingHours = useMemo(() => {
    return weekDays.map(day => {
      const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const hours = workingHours?.[dayOfWeek as keyof typeof workingHours] ?? null;
      const isOpen = open247 || (hours?.isOpen ?? false);

      let openHour = GRID_START_HOUR;
      let closeHour = GRID_END_HOUR;

      if (!open247 && hours?.isOpen) {
        const [h] = convertTo24Hour(hours.open).split(':').map(Number);
        openHour = h;
        const parts = convertTo24Hour(hours.close).split(':').map(Number);
        closeHour = parts[1] > 0 ? parts[0] + 1 : parts[0];
      }

      return { isOpen, openHour, closeHour };
    });
  }, [weekDays, workingHours, open247]);

  // Get appointments and blocks for each day, filtered by staff
  const columnData = useMemo(() => {
    return weekDays.map(day => {
      const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const dayData: DayDataResponse | undefined = weekData?.[dateKey];

      let appointments = dayData?.appointments ?? [];
      const blocks = dayData?.blocks ?? [];

      // Apply staff filter
      if (staffFilter.length > 0) {
        appointments = appointments.filter(appt => {
          if (appt.isUnassigned || appt.staffUserIds.length === 0) return true;
          return appt.staffUserIds.some(id => staffFilter.includes(id));
        });
      }

      return { appointments, blocks };
    });
  }, [weekDays, weekData, staffFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading week view...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Week day strip (date headers) */}
      <WeekDayStrip gutterWidth={GUTTER_WIDTH} />

      {/* Scrollable grid */}
      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: 7 * 100 + GUTTER_WIDTH }}>
          {/* Time gutter */}
          <div className="flex flex-col items-end pr-4 select-none flex-shrink-0" style={{ width: GUTTER_WIDTH }}>
            {/* Spacer for top padding of grid to align with cards? No, grid starts immediately. */}
            {GRID_HOURS.map(hour => (
              <div key={hour} className="text-xs font-medium text-muted-foreground flex items-start justify-end" style={{ height: HOUR_HEIGHT }}>
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, i) => {
            const { appointments, blocks } = columnData[i];
            const { isOpen, openHour, closeHour } = dayWorkingHours[i];
            const isToday = day.toDateString() === todayStr;

            return (
              <div
                key={day.toDateString()}
                className="flex-1 min-w-[100px] cursor-pointer"
                onDoubleClick={() => {
                  dispatch(setSelectedDateAction(day));
                  dispatch(setViewModeAction(AppointmentViewMode.DAY));
                }}
              >
                <div className="mx-1">
                  <TimeColumn
                    appointments={appointments}
                    blocks={blocks}
                    locationStaff={locationStaff}
                    openHour={openHour}
                    closeHour={closeHour}
                    open247={open247}
                    isToday={isToday}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
