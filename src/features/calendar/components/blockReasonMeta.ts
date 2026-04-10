import type { TFunction } from "i18next";
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

/** Static fallback options (English). Use `getCalendarBlockReasonOptionsTranslated` when `t` is available. */
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

const REASON_KEY_MAP: Record<string, string> = {
    [CalendarBlockReason.HOLIDAY]: "page.blocks.reasons.holiday",
    [CalendarBlockReason.VACATION]: "page.blocks.reasons.vacation",
    [CalendarBlockReason.SICK]: "page.blocks.reasons.sickLeave",
    [CalendarBlockReason.LUNCH_BREAK]: "page.blocks.reasons.lunchBreak",
    [CalendarBlockReason.BREAK]: "page.blocks.reasons.shortBreak",
    [CalendarBlockReason.MEETING]: "page.blocks.reasons.meeting",
    [CalendarBlockReason.PERSONAL]: "page.blocks.reasons.personalTime",
    [CalendarBlockReason.MAINTENANCE]: "page.blocks.reasons.maintenance",
    [CalendarBlockReason.OTHER]: "page.blocks.reasons.other",
};

/** Returns translated block reason options. */
export function getCalendarBlockReasonOptionsTranslated(t: TFunction): CalendarBlockReasonOption[] {
    return CALENDAR_BLOCK_REASON_OPTIONS.map((o) => ({
        ...o,
        label: REASON_KEY_MAP[o.value] ? t(REASON_KEY_MAP[o.value]) : o.label,
    }));
}

export function getCalendarBlockReasonIcon(reason: string): LucideIcon {
    const found = CALENDAR_BLOCK_REASON_OPTIONS.find((o) => o.value === reason);
    return found?.Icon ?? MoreHorizontal;
}

export function getCalendarBlockReasonLabel(reason: string, t?: TFunction): string {
    if (t) {
        const key = REASON_KEY_MAP[reason];
        return key ? t(key) : reason;
    }
    const found = CALENDAR_BLOCK_REASON_OPTIONS.find((o) => o.value === reason);
    return found?.label ?? reason;
}
