import { type FC, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { SlimAppointment, CalendarStaffMember } from "../../../shared/types/calendar.ts";
import { getLocationStaff } from "../selectors.ts";
import { toggleEditFormAction } from "../actions.ts";
import { formatTime, formatTimeRange } from "./utils.tsx";
import { getAppointmentDetailRequest } from "../api.ts";
import { User } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Pastel status colors with left accent border
// ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  // Confirmed: Blue
  confirmed: 'bg-blue-400 text-white border-none',
  // Pending: Purple/Lavender (like "Development meet" in screenshot)
  pending: 'bg-purple-400 text-white border-none',
  // Completed: Green (like "Design onboarding")
  completed: 'bg-emerald-400 text-white border-none',
  // No Show: Red/Pink (like "Design our website")
  no_show: 'bg-pink-400 text-white border-none',
  // Cancelled: Gray
  cancelled: 'bg-gray-400 text-white border-none',
};

const getStatusClasses = (status: string): string => {
  // Default to a soft yellow/orange if status unknown (like "Design session")
  return STATUS_STYLES[status] ?? 'bg-amber-300 text-amber-900 border-none';
};

// ─────────────────────────────────────────────────────────────
// Staff Avatar Cluster
// ─────────────────────────────────────────────────────────────

const StaffAvatarCluster: FC<{ staffIds: number[]; staff: CalendarStaffMember[]; maxVisible?: number }> = ({
  staffIds,
  staff,
  maxVisible = 3,
}) => {
  const resolved = staffIds
    .map(id => staff.find(s => s.id === id))
    .filter(Boolean) as CalendarStaffMember[];

  const visible = resolved.slice(0, maxVisible);
  const overflowCount = resolved.length - maxVisible;

  if (visible.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map(member => (
        member.profileImage ? (
          <img
            key={member.id}
            src={member.profileImage}
            alt={`${member.firstName} ${member.lastName}`}
            className="h-5 w-5 rounded-full object-cover border border-white dark:border-gray-800"
          />
        ) : (
          <div
            key={member.id}
            className="h-5 w-5 rounded-full bg-muted flex items-center justify-center border border-white dark:border-gray-800"
            title={`${member.firstName} ${member.lastName}`}
          >
            <User className="h-2.5 w-2.5 text-muted-foreground" />
          </div>
        )
      ))}
      {overflowCount > 0 && (
        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground border border-white dark:border-gray-800">
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// AppointmentBlock
// ─────────────────────────────────────────────────────────────

interface AppointmentBlockProps {
  appointment: SlimAppointment;
  /** Pixel height of this block in the grid */
  height: number;
  /** Pixel top offset in the grid */
  top: number;
}

/**
 * AppointmentBlock — pastel-colored card rendered in the time grid.
 *
 * Content adapts based on the available height:
 * - Always: service name (bold, truncated)
 * - >40px: time range
 * - >56px: customer name + staff avatar cluster
 */
export const AppointmentBlock: FC<AppointmentBlockProps> = ({ appointment, height, top }) => {
  const dispatch = useDispatch();
  const locationStaff = useSelector(getLocationStaff);

  const handleClick = useCallback(async () => {
    try {
      const fullAppointment = await getAppointmentDetailRequest(appointment.id);
      dispatch(toggleEditFormAction({ open: true, item: fullAppointment }));
    } catch {
      // silently fail — appointment may have been deleted
    }
  }, [dispatch, appointment.id]);

  return (
    <div
      className={`absolute left-1 right-1 rounded-xl px-3 py-2 z-10 cursor-pointer overflow-hidden
                hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${getStatusClasses(appointment.status)}`}
      style={{ top, height }}
      title={`${appointment.customerName} – ${appointment.bookedItemName}`}
      onClick={handleClick}
    >
      {/* Service name — always shown */}
      <div className="font-bold text-xs leading-tight truncate">
        {appointment.bookedItemName}
      </div>

      {/* Time range — shown when block is tall enough */}
      {height > 40 && (
        <div className="text-[10px] opacity-90 truncate leading-tight mt-1 font-medium">
          {formatTimeRange(appointment.scheduledAt, appointment.endsAt)}
        </div>
      )}

      {/* Customer + staff avatars — shown when even taller */}
      {height > 56 && (
        <div className="flex flex-col justify-end flex-1 mt-2">
          <div className="flex items-center justify-between gap-1">
            <StaffAvatarCluster
              staffIds={appointment.staffUserIds}
              staff={locationStaff}
            />
            {/* Download/Action icon placeholder like in screenshot */}
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 border-b border-white/80" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
