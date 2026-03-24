/**
 * Shared control tokens for the calendar left rail and filters sheet.
 */

/**
 * Combobox-style triggers (status, booking source, staff) — one visual family.
 * Neutral surface; staff uses the same token (no info tint) for consistency with Settings.
 */
export const CALENDAR_COMBO_TRIGGER =
    "w-full h-10 justify-between font-normal border-border bg-background text-foreground-1 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-offset-0 cursor-pointer transition-all focus:border-focus focus-visible:ring-focus";

export const CALENDAR_SELECT_TRIGGER =
    "flex h-10 w-full items-center gap-2 text-sm border-border bg-background text-foreground-1 hover:bg-muted/50 data-[placeholder]:text-muted-foreground";

/** Label above a filter control (matches reference: small, muted, title case). */
export const CALENDAR_FIELD_LABEL = "text-xs font-medium text-muted-foreground";
