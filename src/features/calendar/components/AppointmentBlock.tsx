import { type FC, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { SlimAppointment, CalendarStaffMember } from "../../../shared/types/calendar.ts";
import { getLocationStaff } from "../selectors.ts";
import { toggleEditFormAction } from "../actions.ts";
import { formatTimeRange } from "./utils.tsx";
import { getAppointmentDetailRequest, getAppointmentGroupRequest } from "../api.ts";
import { User, ShieldAlert } from "lucide-react";
import { calendarPreferences } from "../calendarPreferences.ts";
import { getAppointmentBlockColors } from "../colors.ts";

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
  /** When set, position side-by-side with other overlapping appointments (0 = left) */
  leftPercent?: number;
  /** Width as percentage when side-by-side (otherwise full width) */
  widthPercent?: number;
  /** When provided, call on click instead of fetching and opening (used by DraggableAppointmentBlock to avoid duplicate fetch). */
  onOpenDetail?: () => void;
}

/**
 * AppointmentBlock — pastel-colored card rendered in the time grid.
 *
 * Content adapts based on the available height:
 * - Always: service name (bold, truncated)
 * - >40px: time range
 * - >56px: customer name + staff avatar cluster
 */
export const AppointmentBlock: FC<AppointmentBlockProps> = ({
  appointment,
  height,
  top,
  leftPercent,
  widthPercent,
  onOpenDetail,
}) => {
  const dispatch = useDispatch();
  const locationStaff = useSelector(getLocationStaff);
  const colorCoding = calendarPreferences.getColorCoding();
  const { backgroundColor, color } = getAppointmentBlockColors(appointment, colorCoding);

  const handleClick = useCallback(async () => {
    if (onOpenDetail) {
      onOpenDetail();
      return;
    }
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
  }, [dispatch, appointment.id, (appointment as { bookingGroupId?: string }).bookingGroupId, onOpenDetail]);

  const style: React.CSSProperties = { top, height, backgroundColor, color };
  if (leftPercent != null && widthPercent != null) {
    style.left = `${leftPercent}%`;
    style.width = `${widthPercent}%`;
    style.right = 'auto';
  }

  return (
    <div
      className={`absolute rounded-xl px-3 py-2 z-10 cursor-pointer overflow-hidden border-none
                hover:shadow-lg hover:scale-[1.02] transition-all duration-200
                ${leftPercent == null ? 'left-1 right-1' : ''}`}
      style={style}
      title={`${appointment.customerName} – ${appointment.bookedItemName}`}
      onClick={handleClick}
    >
      {/* Service name + override indicator */}
      <div className="flex items-start justify-between gap-1">
        <div className="font-bold text-xs leading-tight truncate min-w-0 flex-1">
          {appointment.bookedItemName}
        </div>
        {appointment.overrideReason && (
          <span title={appointment.overrideReason} className="flex-shrink-0">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 opacity-90" />
          </span>
        )}
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
