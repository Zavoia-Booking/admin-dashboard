import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { UserX, X } from "lucide-react";
import { PersonAvatar, getPersonColorKey } from "../../../../shared/components/common/PersonAvatar";
import type { CalendarStaffMember } from "../../../../shared/types/calendar";
import {
  getStaffAvatarColor,
  type AppointmentBlockColorPair,
} from "../../colors";
import { cn } from "../../../../shared/lib/utils";

interface MobileDayColumnHeaderProps {
  staff: CalendarStaffMember | null; // null when this is the "Unassigned" column
  isFiltered: boolean; // true when this is the only visible column via staff filter
  onTap: () => void;
  staffColorMap?: Map<string, AppointmentBlockColorPair> | null;
  unassignedLabel: string;
}

/**
 * Sticky top-of-column header on the mobile day grid. Tapping it dispatches a
 * staff filter so the grid reflows to a full-width single-staff layout.
 */
export const MobileDayColumnHeader: FC<MobileDayColumnHeaderProps> = ({
  staff,
  isFiltered,
  onTap,
  staffColorMap,
  unassignedLabel,
}) => {
  const { t } = useTranslation("calendar");
  const isUnassigned = staff == null;
  const avatarColor = staff
    ? getStaffAvatarColor(
        staff.id,
        getPersonColorKey(staff.id, staff.firstName, staff.lastName),
        staffColorMap,
      )
    : undefined;
  const shortName = staff ? staff.firstName?.trim() || staff.lastName?.trim() || "—" : unassignedLabel;

  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={isFiltered}
      aria-label={
        isFiltered
          ? t('page.aria.tapToShowAllStaff', { shortName })
          : t('page.aria.showOnlyStaff', { shortName })
      }
      className={cn(
        "flex items-center gap-1.5 w-full h-11 px-2",
        "border-b border-border bg-white dark:bg-surface",
        "text-left active:scale-[0.98]",
        "transition-transform duration-200 ease-out",
      )}
    >
      {isUnassigned ? (
        <span
          aria-hidden
          className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-muted"
        >
          <UserX className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      ) : (
        <PersonAvatar
          id={staff!.id}
          firstName={staff!.firstName}
          lastName={staff!.lastName}
          profileImage={staff!.profileImage}
          colorOverride={avatarColor}
          className="h-6 w-6 ring-1 ring-surface"
          initialsClassName="text-[10px] font-semibold"
        />
      )}
      <span
        className={cn(
          "text-[11px] truncate min-w-0 flex-1 transition-[font-weight] duration-200",
          isFiltered ? "font-semibold text-foreground-1" : "font-medium text-foreground-2",
        )}
      >
        {shortName}
      </span>
      {isFiltered && (
        <span
          aria-hidden
          className="shrink-0 h-5 w-5 rounded-full bg-muted flex items-center justify-center mobile-column-header-dismiss"
        >
          <X className="h-3 w-3 text-foreground-2" strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
};
