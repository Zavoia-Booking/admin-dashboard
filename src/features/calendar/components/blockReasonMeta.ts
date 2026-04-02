import type { LucideIcon } from "lucide-react";
import {
    Coffee,
    MoreHorizontal,
    Palmtree,
    Plane,
    Thermometer,
    User,
    UsersRound,
    UtensilsCrossed,
    Wrench,
} from "lucide-react";
import { CalendarBlockReason } from "../../../shared/types/calendar.ts";

/** Single source for block reason labels + icons (CreateBlockDrawer picker + list row). */
export type CalendarBlockReasonOption = {
    value: CalendarBlockReason;
    label: string;
    Icon: LucideIcon;
};

export const CALENDAR_BLOCK_REASON_OPTIONS: CalendarBlockReasonOption[] = [
    { value: CalendarBlockReason.HOLIDAY, label: "Holiday", Icon: Palmtree },
    { value: CalendarBlockReason.VACATION, label: "Vacation", Icon: Plane },
    { value: CalendarBlockReason.SICK, label: "Sick leave", Icon: Thermometer },
    { value: CalendarBlockReason.LUNCH_BREAK, label: "Lunch break", Icon: UtensilsCrossed },
    { value: CalendarBlockReason.BREAK, label: "Short break", Icon: Coffee },
    { value: CalendarBlockReason.MEETING, label: "Meeting", Icon: UsersRound },
    { value: CalendarBlockReason.PERSONAL, label: "Personal time", Icon: User },
    { value: CalendarBlockReason.MAINTENANCE, label: "Maintenance", Icon: Wrench },
    { value: CalendarBlockReason.OTHER, label: "Other", Icon: MoreHorizontal },
];

export function getCalendarBlockReasonIcon(reason: string): LucideIcon {
    const found = CALENDAR_BLOCK_REASON_OPTIONS.find((o) => o.value === reason);
    return found?.Icon ?? MoreHorizontal;
}

export function getCalendarBlockReasonLabel(reason: string): string {
    const found = CALENDAR_BLOCK_REASON_OPTIONS.find((o) => o.value === reason);
    return found?.label ?? reason;
}
