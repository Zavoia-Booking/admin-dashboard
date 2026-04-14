import type { TFunction } from "i18next";
import type { CalendarBlockDto, CalendarStaffMember } from "../../../shared/types/calendar";
import { formatTimeRange, formatDurationHuman } from "./utils.tsx";
import {
  getCalendarBlockReasonIcon,
  getCalendarBlockReasonLabel,
} from "./blockReasonMeta.ts";

export interface BlockDisplayData {
  reasonLabel: string;
  ReasonIcon: ReturnType<typeof getCalendarBlockReasonIcon>;
  customTitle: string;
  notesTrimmed: string;
  hasTitleOrNotes: boolean;
  timeDisplay: string;
  durationText: string | null;
  staffMember: CalendarStaffMember | null;
  staffName: string | null;
  scopeStaffLabel: string;
  scopeTierLabel: string;
}

/**
 * Shared display-data derivation for a calendar block. Consumed by both
 * desktop `BlockCard` and mobile `MobileDayBlockCard` so the two cannot
 * drift. Pure lift-and-shift of the original desktop derivation logic.
 */
export function getBlockDisplayData(
  block: CalendarBlockDto,
  locationStaff: CalendarStaffMember[],
  timezone: string | undefined,
  t: TFunction,
): BlockDisplayData {
  const reasonLabel = getCalendarBlockReasonLabel(block.reason, t);
  const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
  const customTitle = block.title?.trim() ?? "";
  const notesTrimmed = block.notes?.trim() ?? "";
  const hasTitleOrNotes = Boolean(customTitle || notesTrimmed);

  const timeDisplay = block.isAllDay
    ? t("page.blocks.allDay")
    : formatTimeRange(block.startsAt, block.endsAt, timezone);

  const durationMinutes = block.isAllDay
    ? null
    : Math.max(
        0,
        Math.round(
          (new Date(block.endsAt).getTime() - new Date(block.startsAt).getTime()) / 60000,
        ),
      );
  const durationText = durationMinutes != null ? formatDurationHuman(durationMinutes) : null;

  const staffMember =
    block.blockScope === "staff" && block.userId
      ? (locationStaff.find((s) => s.id === block.userId) ?? null)
      : null;
  const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : null;

  const scopeStaffLabel = (() => {
    if (block.blockScope === "location") return t("page.blocks.scope.entireLocation");
    if (block.blockScope === "business") return t("page.blocks.scope.allLocations");
    if (block.blockScope === "staff") {
      return (
        staffName ??
        (block.userId != null
          ? t("page.common.staffId", { id: block.userId })
          : t("page.common.unassigned"))
      );
    }
    return block.blockScope;
  })();

  const scopeTierLabel = (() => {
    if (block.blockScope === "location") return t("page.blocks.scope.locationWide");
    if (block.blockScope === "staff") return t("page.blocks.scope.staffMember");
    if (block.blockScope === "business") return t("page.blocks.scope.businessWide");
    return block.blockScope;
  })();

  return {
    reasonLabel,
    ReasonIcon,
    customTitle,
    notesTrimmed,
    hasTitleOrNotes,
    timeDisplay,
    durationText,
    staffMember,
    staffName,
    scopeStaffLabel,
    scopeTierLabel,
  };
}
