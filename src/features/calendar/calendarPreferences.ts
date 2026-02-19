// ─────────────────────────────────────────────────────────────
// Calendar Preferences — localStorage helpers for user-specific
// display preferences. These are not business-wide settings.
// ─────────────────────────────────────────────────────────────

import { AppointmentViewMode, AppointmentViewType } from "./types.ts";

const PREFIX = 'calendar_pref_';

export type TimeFormat = '12h' | '24h';
export type ColorCoding = 'status' | 'service' | 'staff';

export interface CalendarPreferences {
    defaultViewMode: AppointmentViewMode;
    defaultViewType: AppointmentViewType;
    timeFormat: TimeFormat;
    colorCoding: ColorCoding;
    showCancelled: boolean;
}

const DEFAULTS: CalendarPreferences = {
    defaultViewMode: AppointmentViewMode.WEEK,
    defaultViewType: AppointmentViewType.LIST,
    timeFormat: '24h',
    colorCoding: 'status',
    showCancelled: true,
};

function getItem<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function setItem<T>(key: string, value: T): void {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
        // silently fail in case of storage quota errors
    }
}

export const calendarPreferences = {
    getAll(): CalendarPreferences {
        return {
            defaultViewMode: getItem('defaultViewMode', DEFAULTS.defaultViewMode),
            defaultViewType: getItem('defaultViewType', DEFAULTS.defaultViewType),
            timeFormat: getItem('timeFormat', DEFAULTS.timeFormat),
            colorCoding: getItem('colorCoding', DEFAULTS.colorCoding),
            showCancelled: getItem('showCancelled', DEFAULTS.showCancelled),
        };
    },

    getDefaultViewMode(): AppointmentViewMode {
        return getItem('defaultViewMode', DEFAULTS.defaultViewMode);
    },

    setDefaultViewMode(mode: AppointmentViewMode): void {
        setItem('defaultViewMode', mode);
    },

    getDefaultViewType(): AppointmentViewType {
        return getItem('defaultViewType', DEFAULTS.defaultViewType);
    },

    setDefaultViewType(type: AppointmentViewType): void {
        setItem('defaultViewType', type);
    },

    getTimeFormat(): TimeFormat {
        return getItem('timeFormat', DEFAULTS.timeFormat);
    },

    setTimeFormat(format: TimeFormat): void {
        setItem('timeFormat', format);
    },

    getColorCoding(): ColorCoding {
        return getItem('colorCoding', DEFAULTS.colorCoding);
    },

    setColorCoding(coding: ColorCoding): void {
        setItem('colorCoding', coding);
    },

    getShowCancelled(): boolean {
        return getItem('showCancelled', DEFAULTS.showCancelled);
    },

    setShowCancelled(show: boolean): void {
        setItem('showCancelled', show);
    },
};
