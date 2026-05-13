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

/** Single source for block reason value+icon (CreateBlockDrawer picker + list row). */
export type CalendarBlockReasonValue = {
    value: CalendarBlockReason;
    Icon: LucideIcon;
};

export type CalendarBlockReasonOption = CalendarBlockReasonValue & {
    label: string;
};

const REASON_VALUES: CalendarBlockReasonValue[] = [
    { value: CalendarBlockReason.HOLIDAY, Icon: Palmtree },
    { value: CalendarBlockReason.VACATION, Icon: Plane },
    { value: CalendarBlockReason.SICK, Icon: Thermometer },
    { value: CalendarBlockReason.LUNCH_BREAK, Icon: UtensilsCrossed },
    { value: CalendarBlockReason.BREAK, Icon: Coffee },
    { value: CalendarBlockReason.MEETING, Icon: UsersRound },
    { value: CalendarBlockReason.PERSONAL, Icon: User },
    { value: CalendarBlockReason.MAINTENANCE, Icon: Wrench },
    { value: CalendarBlockReason.OTHER, Icon: MoreHorizontal },
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
    return REASON_VALUES.map((o) => ({
        ...o,
        label: REASON_KEY_MAP[o.value] ? t(REASON_KEY_MAP[o.value]) : o.value,
    }));
}

export function getCalendarBlockReasonIcon(reason: string): LucideIcon {
    const found = REASON_VALUES.find((o) => o.value === reason);
    return found?.Icon ?? MoreHorizontal;
}

export function getCalendarBlockReasonLabel(reason: string, t: TFunction): string {
    const key = REASON_KEY_MAP[reason];
    return key ? t(key) : reason;
}
