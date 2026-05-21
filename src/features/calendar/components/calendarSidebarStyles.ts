/**
 * Shared control tokens for the calendar left rail and filters sheet.
 */

export const CALENDAR_SELECT_TRIGGER =
    "flex h-10 w-full items-center gap-2 text-sm border-border bg-background text-foreground-1 hover:bg-muted/50 data-[placeholder]:text-muted-foreground";

/**
 * Section heading above filter groups ("By category", "By status", …).
 * Canonical app-wide eyebrow recipe — terracotta accent + tight tracking
 * shared with [ReviewsFiltersSheet]'s Section and the modal-tokens system
 * so every filter/sort sheet reads as one design language.
 */
export const CALENDAR_FILTER_SECTION_TITLE =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-500";

/** Full-bleed wrapper (cancels parent horizontal padding). */
export const CALENDAR_FILTER_DIVIDER_OUTER = "-mx-4 px-4 mb-0";

/**
 * Same full-bleed idea as {@link CALENDAR_FILTER_DIVIDER_OUTER} for slider bodies that use
 * `p-1 md:p-6` horizontal padding (e.g. block drawer), so the rule matches the Filters popover line.
 */
export const CALENDAR_FILTER_DIVIDER_OUTER_SLIDER = "-mx-1 px-1 mb-0 md:-mx-6 md:px-6";

/** Vertical space above and below the gradient rule. */
export const CALENDAR_FILTER_DIVIDER_GUTTER = "pt-4 pb-6";

/**
 * Fades out at the sides; strongest at center. Uses theme border color.
 */
export const CALENDAR_FILTER_DIVIDER_LINE =
  "h-px w-full shrink-0 bg-[linear-gradient(90deg,transparent_0%,var(--border)_20%,var(--border)_70%,transparent_100%)]";

/** Space between the previous section's content and the divider block. */
export const CALENDAR_FILTER_SECTION_BREAK_MT = "mt-4";

/**
 * Rounded-full filter chips: staff, status, booking source, etc.
 * Single source for height / padding — tweak here to keep header popover aligned.
 */
export const CALENDAR_FILTER_CHIP_ALL_BASE =
  "group !min-h-0 !h-10 relative inline-flex max-w-full shrink-0 cursor-pointer items-center gap-2 overflow-visible rounded-full border px-2 pr-3 text-left text-xs font-medium disabled:cursor-not-allowed transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:transition-none";

export const CALENDAR_FILTER_CHIP_ITEM_BASE =
  "!min-h-0 !h-10 relative inline-flex max-w-[200px] shrink-0 cursor-pointer items-center gap-2 overflow-visible rounded-full border px-2 pr-3 text-left text-xs font-medium disabled:cursor-not-allowed transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:transition-none";

/** Primary label inside a chip (flex child + truncate). */
export const CALENDAR_FILTER_CHIP_LABEL = "min-w-0 flex-1 truncate";
