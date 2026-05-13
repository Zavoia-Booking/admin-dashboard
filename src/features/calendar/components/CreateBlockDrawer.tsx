import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from '../../../shared/components/ui/date-picker';
import {
  AlertCircle,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  User,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { Pill } from '../../../shared/components/ui/pill';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '../../../shared/components/ui/command';
import { cn } from '../../../shared/lib/utils';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { SliderSectionHeader } from '../../../shared/components/forms/SliderSectionHeader';
import {
  CALENDAR_FILTER_DIVIDER_GUTTER,
  CALENDAR_FILTER_DIVIDER_LINE,
  CALENDAR_FILTER_DIVIDER_OUTER_SLIDER,
  CALENDAR_FILTER_CHIP_ITEM_BASE,
  CALENDAR_FILTER_CHIP_LABEL,
} from './calendarSidebarStyles';
import { CalendarFilterPillCheckmark } from './CalendarFilterPillCheckmark';
import { getAvatarBgColor } from '../../setupWizard/components/StepTeam';
import type { CalendarStaffMember } from '../../../shared/types/calendar';
import { TextareaField } from '../../../shared/components/forms/fields/TextareaField';
import { validateDescription } from '../../../shared/utils/validation';
import { useDispatch, useSelector } from 'react-redux';
import { createCalendarBlock, toggleBlockFormAction, updateCalendarBlock } from '../actions';
import {
  getSelectedLocationId,
  getLocationStaff,
  getBlockFormOpen,
  getBlockFormEditingBlock,
  getSelectedDate,
  getBookingSettings,
  getLocationWorkingHours,
  getLocationOpen247,
  getCalendarTimezone,
} from '../selectors';
import { selectIsTeamMember } from '../../auth/selectors';

import {
  CalendarBlockScope,
  CalendarBlockReason,
  type CalendarBlockCreatePayload,
} from '../../../shared/types/calendar';
import { getCalendarBlockReasonOptionsTranslated } from './blockReasonMeta';
import {
  buildZonedDate,
  formatDateInTimezone,
  formatWallHmInTimezone,
  laterCalendarWallDate,
  localCalendarDateFromDateKey,
  minSelectableCalendarDateForTimezone,
  weekdaySun0ForWallDateInTimezone,
  zonedEndOfDayUtc,
  zonedStartOfDayUtc,
} from '../timezone';
import { formatSlotTime } from './utils';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { useWorkingHoursForDate } from '../hooks/useWorkingHoursForDate';
import type { WorkingHours } from '../../../shared/types/location';
import './addAppointmentSliderPopover.css';

/** Section rule — same gradient line + gutter as Calendar header Filters popover/drawer. */
function BlockDrawerSectionDivider() {
  return (
    <div className={CALENDAR_FILTER_DIVIDER_OUTER_SLIDER} role="presentation">
      <div className={CALENDAR_FILTER_DIVIDER_GUTTER}>
        <div className={CALENDAR_FILTER_DIVIDER_LINE} aria-hidden />
      </div>
    </div>
  );
}

function blockStaffInitials(member: CalendarStaffMember): string {
  const a = member.firstName?.trim()?.[0] ?? '';
  const b = member.lastName?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

function blockStaffAvatarColorKey(member: CalendarStaffMember): string {
  return `${member.id}-${member.firstName ?? ''}-${member.lastName ?? ''}`;
}

function blockStaffFullName(member: CalendarStaffMember): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

/**
 * Time slot popover aligned with Add Appointment "Select time" (expand animation, working-hours sections).
 */
function BlockDrawerTimeSlotSelect({
  label,
  date,
  value,
  onSelect,
  timeSlots,
  workingHours,
  open247,
  disabled: disabledProp = false,
}: {
  label: string;
  date: Date | null;
  value: string;
  onSelect: (slot: string) => void;
  timeSlots: string[];
  workingHours: WorkingHours | null | undefined;
  open247: boolean;
  /** When true (e.g. all-day block), field is non-interactive and visually muted. */
  disabled?: boolean;
}) {
  const { t } = useTranslation("calendar");
  const [open, setOpen] = useState(false);
  const [closingAnimation, setClosingAnimation] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setClosingAnimation(false);
    } else {
      setClosingAnimation(true);
      closeTimeoutRef.current = setTimeout(() => {
        setClosingAnimation(false);
        closeTimeoutRef.current = null;
      }, 250);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const { dayWorkingHours, isSlotOutsideHours } = useWorkingHoursForDate(
    date,
    workingHours ?? null,
    open247,
  );

  const { inHoursSlots, slotsOutsideHours } = useMemo(() => {
    if (open247) {
      return { inHoursSlots: [...timeSlots], slotsOutsideHours: [] as string[] };
    }
    const inH: string[] = [];
    const out: string[] = [];
    for (const slot of timeSlots) {
      if (isSlotOutsideHours(slot)) {
        out.push(slot);
      } else {
        inH.push(slot);
      }
    }
    return { inHoursSlots: inH, slotsOutsideHours: out };
  }, [timeSlots, open247, isSlotOutsideHours]);

  const workingHoursLabel = useMemo(() => {
    if (open247) return t("page.blocks.create.open247");
    if (!dayWorkingHours?.isOpen) return t("page.blocks.create.closed");
    return `${dayWorkingHours.open} – ${dayWorkingHours.close}`;
  }, [open247, dayWorkingHours]);

  const handleSlotSelect = (slot: string) => {
    onSelect(slot);
    handleOpenChange(false);
  };

  const disabled = date == null || disabledProp;

  return (
    <div
      className={cn('space-y-2', disabled && 'opacity-50 pointer-events-none')}
      aria-disabled={disabled || undefined}
    >
      <Label
        className={cn(
          'text-sm font-medium',
          disabled ? 'text-foreground-3 dark:text-foreground-2' : 'text-foreground-1',
        )}
      >
        {label}
      </Label>
      <Popover open={open && !disabled} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full h-12 text-base justify-between font-normal border bg-surface hover:bg-surface-hover rounded-full px-4',
              disabled
                ? 'border-border dark:border-border-subtle'
                : open || closingAnimation
                  ? '!rounded-b-none !rounded-t-[16px] border-x border-t border-b-0 border-border-strong dark:border-border-strong shadow-none'
                  : 'border-border-strong dark:border-border-strong',
            )}
          >
            {value ? (
              <span className="text-foreground-1">{formatSlotTime(value)}</span>
            ) : (
              <span className="text-foreground-3 dark:text-foreground-2">{t("page.blocks.create.selectTime")}</span>
            )}
            <Clock className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            'add-appointment-popover-expand !w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-trigger-width)] max-h-[calc(100vh-6rem)] box-border -mt-px border border-t-0 rounded-t-none rounded-b-[16px] shadow-none p-0 z-[90] overflow-hidden flex flex-col',
            open || closingAnimation
              ? 'border-border-strong dark:border-border-strong'
              : 'border-input dark:border-border',
          )}
          side="bottom"
          align="start"
          sideOffset={0}
          avoidCollisions={false}
        >
          <div className="min-h-0 flex-1 max-h-60 overflow-y-auto py-1">
            <div className="px-3 pt-2 pb-1.5">
              <p className="text-xs font-medium text-foreground-3 dark:text-foreground-2">{workingHoursLabel}</p>
            </div>
            {inHoursSlots.length > 0 && (
              <>
                <div className="px-3 pb-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-3 dark:text-foreground-2">
                    {t("page.blocks.create.workingHours")}
                  </p>
                </div>
                {inHoursSlots.map((slot) => {
                  const isSelected = value === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-lg text-sm cursor-pointer',
                        isSelected
                          ? 'bg-primary/10 font-medium text-foreground-1 hover:bg-primary/15 dark:hover:bg-primary/20'
                          : 'text-foreground-1 hover:bg-info-100 dark:hover:bg-surface-hover',
                      )}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      {formatSlotTime(slot)}
                    </button>
                  );
                })}
              </>
            )}
            {inHoursSlots.length === 0 && slotsOutsideHours.length > 0 && (
              <div className="px-4 py-2 text-xs text-foreground-3 dark:text-foreground-2">
                {t("page.blocks.create.noTimesWithinHours")}
              </div>
            )}
            {slotsOutsideHours.length > 0 && (
              <>
                <div className="border-t border-border my-1" role="separator" />
                <div className="px-3 pt-1 pb-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-3 dark:text-foreground-2">
                    {t("page.blocks.create.outsideWorkingHours")}
                  </p>
                </div>
                {slotsOutsideHours.map((slot) => {
                  const isSelected = value === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-lg text-sm cursor-pointer',
                        isSelected
                          ? 'bg-primary/10 font-medium text-foreground-1 opacity-100 hover:bg-primary/15 dark:hover:bg-primary/20'
                          : 'opacity-80 text-foreground-3 dark:text-foreground-2 hover:bg-info-100 dark:hover:bg-surface-hover hover:opacity-100',
                      )}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      {formatSlotTime(slot)}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

const WEEKDAY_VALUES: { value: number }[] = [
  { value: 0 },
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
];

/** Green check for selected rows — same affordance as calendar Filters "services & bundles" list. */
function RepeatWeekdayListRowCheck({ visible }: { visible: boolean }) {
  return (
    <span className="flex h-4 w-5 shrink-0 items-center justify-center" aria-hidden>
      {visible ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={2.75} aria-hidden />
      ) : null}
    </span>
  );
}

/**
 * Weekday multi-select: same shell as {@link CalendarServiceBundleMultiPicker} (fused trigger + Command list),
 * without search — trigger shows summary; chevron on the right.
 */
function BlockRepeatWeekdaysCombo({
  summary,
  selectedDays,
  onToggleDay,
  listGroupHeading,
  disabled,
}: {
  summary: string;
  selectedDays: number[];
  onToggleDay: (day: number) => void;
  /** e.g. "Day of week" when one day selected, "Weekdays" when several */
  listGroupHeading: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation("calendar");
  const [open, setOpen] = useState(false);
  const [listMounted, setListMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const weekdayLabelMap: Record<number, string> = useMemo(() => ({
    0: t("page.blocks.create.weekdayLabels.sun"),
    1: t("page.blocks.create.weekdayLabels.mon"),
    2: t("page.blocks.create.weekdayLabels.tue"),
    3: t("page.blocks.create.weekdayLabels.wed"),
    4: t("page.blocks.create.weekdayLabels.thu"),
    5: t("page.blocks.create.weekdayLabels.fri"),
    6: t("page.blocks.create.weekdayLabels.sat"),
  }), [t]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (open) {
      setListMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setListMounted(false), 250);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const showListContainer = listMounted && !disabled;
  const lastDayIdx = WEEKDAY_VALUES.length - 1;

  return (
    <div ref={rootRef} className={cn('relative', disabled && 'pointer-events-none opacity-50')}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'relative flex h-11 w-full min-w-0 items-center justify-between gap-2 bg-surface px-4 text-left text-base font-normal text-foreground-1 transition-colors dark:bg-neutral-900',
          'cursor-pointer disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          showListContainer
            ? '!rounded-b-none !rounded-t-[22px] border-x border-t border-b border-border-strong shadow-none dark:border-border-strong'
            : '!rounded-full border border-border-strong dark:border-border-strong',
        )}
      >
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-foreground-3 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {showListContainer ? (
        <div
          data-state={open ? 'open' : 'closed'}
          className={cn(
            'add-appointment-popover-expand absolute left-0 right-0 top-full z-[85] -mt-px box-border max-h-[min(320px,50vh)] w-full overflow-hidden rounded-b-[22px] rounded-t-none border border-t-0 border-border-strong bg-surface p-0 shadow-md dark:border-border-strong dark:bg-neutral-900',
          )}
        >
          <Command shouldFilter={false} className="w-full min-w-0 max-w-full">
            <CommandList className="max-h-[min(260px,40vh)] w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto">
              <CommandGroup heading={listGroupHeading}>
                {WEEKDAY_VALUES.map(({ value }, index) => {
                  const selected = selectedDays.includes(value);
                  return (
                    <CommandItem
                      key={value}
                      value={`wd-${value}`}
                      onSelect={() => onToggleDay(value)}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 p-3',
                        selected && 'bg-muted/50',
                        index === lastDayIdx && 'rounded-b-[18px]',
                      )}
                    >
                      <RepeatWeekdayListRowCheck visible={selected} />
                      <span className="min-w-0 flex-1 text-sm font-medium text-foreground-1">{weekdayLabelMap[value]}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      ) : null}
    </div>
  );
}

type BlockRepeatFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface FormState {
  blockScope: CalendarBlockScope;
  /** Owner only: when Location block is selected, submit as BUSINESS scope (all locations). */
  applyToAllLocations: boolean;
  userId: number | null;
  startDate: Date | null;
  startTime: string; // "HH:mm"
  endDate: Date | null;
  endTime: string; // "HH:mm"
  isAllDay: boolean;
  reason: CalendarBlockReason;
  title: string;
  notes: string;
  isRecurring: boolean;
  repeatFrequency: BlockRepeatFrequency;
  repeatDaysOfWeek: number[]; // 0=Sun .. 6=Sat
  repeatEndDate: Date | null;
}

const initialForm: FormState = {
  blockScope: CalendarBlockScope.LOCATION,
  applyToAllLocations: false,
  userId: null,
  startDate: null,
  startTime: '09:00',
  endDate: null,
  endTime: '17:00',
  isAllDay: false,
  reason: CalendarBlockReason.OTHER,
  title: '',
  notes: '',
  isRecurring: false,
  repeatFrequency: 'weekly',
  repeatDaysOfWeek: [],
  repeatEndDate: null,
};

// ─────────────────────────────────────────────────────────────
// Reason options & settings mapping
// ─────────────────────────────────────────────────────────────
// Map booking-settings staffBlockCalendarTypes keys to CalendarBlockReason enum values.
// Settings use "holidays", "timeOff", "sickDays"; enum uses "holiday", "vacation", "sick".
const STAFF_BLOCK_TYPE_TO_REASON: Record<string, CalendarBlockReason> = {
  holidays: CalendarBlockReason.HOLIDAY,
  timeOff: CalendarBlockReason.VACATION,
  sickDays: CalendarBlockReason.SICK,
};

/** Matches `calendar_block.title` column (varchar 100). */
const BLOCK_TITLE_MAX_LEN = 100;
/** Aligned with notes validation elsewhere (e.g. Add appointment). */
const BLOCK_NOTES_MAX_LEN = 500;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const CreateBlockDrawer: React.FC = () => {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();

  // Redux
  const isOpen = useSelector(getBlockFormOpen);
  const editingBlock = useSelector(getBlockFormEditingBlock);
  const isEditMode = editingBlock != null;
  const selectedLocationId = useSelector(getSelectedLocationId);
  const locationStaff = useSelector(getLocationStaff);
  const selectedDate = useSelector(getSelectedDate);
  const bookingSettings = useSelector(getBookingSettings);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const isTeamMember = useSelector(selectIsTeamMember);
  const calendarTimezone = useSelector(getCalendarTimezone);

  // Form state
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasStaff = locationStaff.length > 0;
  const canCreateBlocks =
    !isTeamMember || !!bookingSettings?.allowStaffBlockCalendarWithoutConfirmation;
  const allowedReasonOptions = useMemo(() => {
    const translatedOptions = getCalendarBlockReasonOptionsTranslated(t);
    if (!isTeamMember) {
      return translatedOptions;
    }
    const types = bookingSettings?.staffBlockCalendarTypes ?? [];
    const allowedReasons = new Set<CalendarBlockReason>(
      types
        .map((key) => STAFF_BLOCK_TYPE_TO_REASON[String(key).trim()])
        .filter((r): r is CalendarBlockReason => r != null),
    );
    if (allowedReasons.size === 0) return [];
    return translatedOptions.filter((option) => allowedReasons.has(option.value));
  }, [isTeamMember, bookingSettings, t]);

  const blockTz = (calendarTimezone && String(calendarTimezone).trim()) || 'UTC';

  /** Recurrence matches backend: timed recurring uses one wall day + times; multi-day + repeat is unsupported. */
  const recurrenceAllowed = useMemo(() => {
    if (form.startDate == null || form.endDate == null) return false;
    return formatDateInTimezone(form.startDate, blockTz) === formatDateInTimezone(form.endDate, blockTz);
  }, [form.startDate, form.endDate, blockTz]);

  /** Earliest selectable calendar day for new blocks: "today" in location TZ (see `timezone.ts`). */
  const minSelectableWallDate = useMemo(
    () => minSelectableCalendarDateForTimezone(new Date(), blockTz),
    [blockTz],
  );
  const startDatePickerMin = isEditMode ? undefined : minSelectableWallDate;
  const endOrRepeatDatePickerMin = useMemo(() => {
    if (isEditMode) {
      return form.startDate ?? undefined;
    }
    if (!form.startDate) {
      return minSelectableWallDate;
    }
    return laterCalendarWallDate(form.startDate, minSelectableWallDate);
  }, [isEditMode, form.startDate, minSelectableWallDate]);

  // ─────────────────────────────────────────────────────────────
  // Reset on open
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingBlock) {
      const tz = calendarTimezone || 'UTC';
      const startKey = formatDateInTimezone(new Date(editingBlock.startsAt), tz);
      const endKey = formatDateInTimezone(new Date(editingBlock.endsAt), tz);
      setForm({
        ...initialForm,
        blockScope: editingBlock.blockScope,
        applyToAllLocations: false,
        userId: editingBlock.userId,
        startDate: localCalendarDateFromDateKey(startKey),
        endDate: localCalendarDateFromDateKey(endKey),
        startTime: editingBlock.isAllDay ? '09:00' : formatWallHmInTimezone(editingBlock.startsAt, tz),
        endTime: editingBlock.isAllDay ? '17:00' : formatWallHmInTimezone(editingBlock.endsAt, tz),
        isAllDay: editingBlock.isAllDay,
        reason: editingBlock.reason,
        title: editingBlock.title ?? '',
        notes: '',
        isRecurring: editingBlock.isRecurring ?? false,
        repeatFrequency: (editingBlock.repeatFrequency as BlockRepeatFrequency | undefined) ?? 'weekly',
        repeatDaysOfWeek: editingBlock.repeatDaysOfWeek ?? [],
        repeatEndDate: editingBlock.repeatEndDate
          ? localCalendarDateFromDateKey(formatDateInTimezone(new Date(editingBlock.repeatEndDate), tz))
          : null,
      });
      return;
    }
    const tz = calendarTimezone || 'UTC';
    const minWall = minSelectableCalendarDateForTimezone(new Date(), tz);
    const raw = selectedDate || new Date();
    const start = laterCalendarWallDate(raw, minWall);
    const end = laterCalendarWallDate(raw, minWall);
    const endClamped =
      new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() <
      new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
        ? start
        : end;
    setForm({
      ...initialForm,
      blockScope: isTeamMember ? CalendarBlockScope.STAFF : CalendarBlockScope.LOCATION,
      applyToAllLocations: false,
      startDate: start,
      endDate: endClamped,
    });
  }, [isOpen, editingBlock, selectedDate, isTeamMember, calendarTimezone]);

  /** Staff blocks support exactly one userId (API + entity). Pre-select when only one person at the location. */
  const soleStaffId = locationStaff.length === 1 ? locationStaff[0].id : null;
  useEffect(() => {
    if (!isOpen || editingBlock) return;
    if (form.blockScope !== CalendarBlockScope.STAFF) return;
    if (soleStaffId == null) return;
    setForm((p) => {
      if (p.userId != null) return p;
      return { ...p, userId: soleStaffId };
    });
  }, [isOpen, editingBlock, form.blockScope, soleStaffId]);

  useEffect(() => {
    if (!isOpen) return;
    if (allowedReasonOptions.length === 0) return;
    const allowedReasons = new Set(allowedReasonOptions.map((o) => o.value));
    if (!allowedReasons.has(form.reason)) {
      setForm((prev) => ({ ...prev, reason: allowedReasonOptions[0].value }));
    }
  }, [isOpen, allowedReasonOptions, form.reason]);

  useEffect(() => {
    if (!isOpen || isEditMode) return;
    if (recurrenceAllowed) return;
    setForm((p) => {
      if (!p.isRecurring && p.repeatEndDate == null && p.repeatDaysOfWeek.length === 0) return p;
      return {
        ...p,
        isRecurring: false,
        repeatDaysOfWeek: [],
        repeatEndDate: null,
      };
    });
  }, [isOpen, isEditMode, recurrenceAllowed]);

  // ─────────────────────────────────────────────────────────────
  // Close handler
  // ─────────────────────────────────────────────────────────────

  const handleClose = () => {
    dispatch(toggleBlockFormAction(false));
  };

  const handleBlockScopeLocation = useCallback(() => {
    setForm((p) => ({
      ...p,
      blockScope: CalendarBlockScope.LOCATION,
      userId: null,
      applyToAllLocations: false,
    }));
  }, []);

  const handleBlockScopeStaff = useCallback(() => {
    setForm((p) => ({ ...p, blockScope: CalendarBlockScope.STAFF, applyToAllLocations: false }));
  }, []);

  const handleApplyToAllLocationsChange = useCallback((checked: boolean) => {
    setForm((p) => ({ ...p, applyToAllLocations: checked }));
  }, []);

  const handleSelectStaff = useCallback((staffId: number) => {
    setForm((p) => ({ ...p, userId: staffId }));
  }, []);

  const handleAllDayChange = useCallback((checked: boolean) => {
    setForm((p) => ({ ...p, isAllDay: checked }));
  }, []);

  const handleStartDateChange = useCallback(
    (date: Date) => {
      const tz = (calendarTimezone && String(calendarTimezone).trim()) || 'UTC';
      setForm((p) => {
        const next: FormState = {
          ...p,
          startDate: date,
          endDate: p.endDate && date && p.endDate < date ? date : p.endDate,
        };
        if (
          p.isRecurring &&
          (p.repeatFrequency === 'weekly' || p.repeatFrequency === 'biweekly')
        ) {
          next.repeatDaysOfWeek = [weekdaySun0ForWallDateInTimezone(date, tz)];
        }
        return next;
      });
    },
    [calendarTimezone],
  );

  const handleEndDateChange = useCallback((date: Date) => {
    setForm((p) => ({ ...p, endDate: date }));
  }, []);

  const handleStartTimeSelect = useCallback((slot: string) => {
    setForm((p) => ({ ...p, startTime: slot }));
  }, []);

  const handleEndTimeSelect = useCallback((slot: string) => {
    setForm((p) => ({ ...p, endTime: slot }));
  }, []);

  const handleReasonSelect = useCallback((reason: CalendarBlockReason) => {
    setForm((p) => ({ ...p, reason }));
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, title: e.target.value }));
  }, []);

  const handleRecurringChange = useCallback(
    (checked: boolean) => {
      if (checked && !recurrenceAllowed) return;
      const tz = (calendarTimezone && String(calendarTimezone).trim()) || 'UTC';
      setForm((p) => {
        if (!checked) {
          return { ...p, isRecurring: false, repeatDaysOfWeek: [] };
        }
        const seedWeekly =
          (p.repeatFrequency === 'weekly' || p.repeatFrequency === 'biweekly') && p.startDate != null
            ? [weekdaySun0ForWallDateInTimezone(p.startDate, tz)]
            : [];
        return {
          ...p,
          isRecurring: true,
          repeatDaysOfWeek:
            p.repeatFrequency === 'weekly' || p.repeatFrequency === 'biweekly'
              ? seedWeekly.length
                ? seedWeekly
                : p.repeatDaysOfWeek
              : [],
        };
      });
    },
    [recurrenceAllowed, calendarTimezone],
  );

  const handleRepeatFrequencyChange = useCallback(
    (freq: BlockRepeatFrequency) => {
      const tz = (calendarTimezone && String(calendarTimezone).trim()) || 'UTC';
      setForm((p) => {
        const next: FormState = { ...p, repeatFrequency: freq };
        if (freq === 'daily' || freq === 'monthly') {
          next.repeatDaysOfWeek = [];
        } else if (freq === 'weekly' || freq === 'biweekly') {
          next.repeatDaysOfWeek =
            p.startDate != null ? [weekdaySun0ForWallDateInTimezone(p.startDate, tz)] : [];
        }
        return next;
      });
    },
    [calendarTimezone],
  );

  const handleRepeatWeekdayChecked = useCallback((day: number, checked: boolean) => {
    setForm((p) => {
      if (
        !checked &&
        p.repeatDaysOfWeek.length === 1 &&
        p.repeatDaysOfWeek[0] === day
      ) {
        return p;
      }
      const next = checked
        ? [...new Set([...p.repeatDaysOfWeek, day])].sort((a, b) => a - b)
        : p.repeatDaysOfWeek.filter((d) => d !== day);
      return { ...p, repeatDaysOfWeek: next };
    });
  }, []);

  const handleRepeatEndDateChange = useCallback((date: Date | null) => {
    setForm((p) => ({ ...p, repeatEndDate: date }));
  }, []);

  /** Switch ON = no end date; switch OFF = recurrence ends on a date (show picker, seeded from start / min). */
  const handleRepeatNoEndSwitch = useCallback(
    (noEndChecked: boolean) => {
      setForm((p) => ({
        ...p,
        repeatEndDate: noEndChecked
          ? null
          : (endOrRepeatDatePickerMin ?? p.startDate ?? minSelectableWallDate),
      }));
    },
    [endOrRepeatDatePickerMin, minSelectableWallDate],
  );

  // ─────────────────────────────────────────────────────────────
  // Time slots (shared hook)
  // ─────────────────────────────────────────────────────────────

  const timeSlots = useTimeSlots(bookingSettings?.slotIntervalMinutes);

  const blockTitleError = useMemo(
    () => validateDescription(form.title, t, BLOCK_TITLE_MAX_LEN),
    [form.title, t],
  );
  const blockNotesError = useMemo(
    () => validateDescription(form.notes, t, BLOCK_NOTES_MAX_LEN),
    [form.notes, t],
  );

  // ─────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────

  const canSubmit =
    form.startDate !== null &&
    form.endDate !== null &&
    (isEditMode || selectedLocationId !== null) &&
    (!isTeamMember || allowedReasonOptions.length > 0) &&
    (isEditMode || form.blockScope !== CalendarBlockScope.STAFF || form.userId !== null) &&
    (form.isAllDay || (form.startTime !== '' && form.endTime !== '')) &&
    (!form.isRecurring || recurrenceAllowed) &&
    (!form.isRecurring ||
      form.repeatFrequency === 'daily' ||
      form.repeatFrequency === 'monthly' ||
      form.repeatDaysOfWeek.length > 0) &&
    !blockTitleError &&
    !blockNotesError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateBlocks || !canSubmit || !form.startDate || !form.endDate) return;
    if (blockTitleError || blockNotesError) return;
    if (form.isRecurring && !recurrenceAllowed) return;
    if (!isEditMode && !selectedLocationId) return;

    setSubmitting(true);
    setError(null);

    const tz = calendarTimezone || 'UTC';
    let startsAt: string;
    let endsAt: string;

    if (form.isAllDay) {
      startsAt = zonedStartOfDayUtc(form.startDate, tz).toISOString();
      endsAt = zonedEndOfDayUtc(form.endDate, tz).toISOString();
    } else {
      startsAt = buildZonedDate(form.startDate, form.startTime, tz).toISOString();
      endsAt = buildZonedDate(form.endDate, form.endTime, tz).toISOString();
    }

    try {
      if (isEditMode && editingBlock) {
        dispatch(
          updateCalendarBlock.request({
            id: editingBlock.id,
            payload: {
              startsAt,
              endsAt,
              isAllDay: form.isAllDay,
              reason: form.reason,
              title: form.title.trim() || undefined,
              notes: form.notes.trim() ? form.notes.trim() : undefined,
            },
          }),
        );
        handleClose();
        return;
      }

      const effectiveScope =
        !isTeamMember &&
        form.blockScope === CalendarBlockScope.LOCATION &&
        form.applyToAllLocations
          ? CalendarBlockScope.BUSINESS
          : form.blockScope;

      const payload: CalendarBlockCreatePayload = {
        blockScope: effectiveScope,
        locationId: selectedLocationId!,
        userId: form.blockScope === CalendarBlockScope.STAFF ? form.userId ?? undefined : undefined,
        startsAt,
        endsAt,
        isAllDay: form.isAllDay,
        reason: form.reason,
        title: form.title.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (form.isRecurring) {
        payload.isRecurring = true;
        payload.repeatFrequency = form.repeatFrequency;
        if (
          (form.repeatFrequency === 'weekly' || form.repeatFrequency === 'biweekly') &&
          form.repeatDaysOfWeek.length > 0
        ) {
          payload.repeatDaysOfWeek = form.repeatDaysOfWeek;
        }
        if (form.repeatEndDate) {
          const d = form.repeatEndDate;
          payload.repeatEndDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }

      dispatch(createCalendarBlock.request(payload));
      handleClose();
    } catch {
      setError(isEditMode ? t("page.blocks.create.failedToUpdate") : t("page.blocks.create.failedToCreate"));
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  const datePickerClass =
    'border bg-surface hover:bg-surface-hover focus:bg-surface h-12 text-base w-full px-4 border-border-strong dark:border-border-strong';

  const repeatWeekdaySummary = useMemo(() => {
    if (form.repeatDaysOfWeek.length === 0) return t("page.blocks.create.selectWeekdays");
    return [...form.repeatDaysOfWeek]
      .sort((a, b) => a - b)
      .map((v) => {
        const WEEKDAY_KEY_BY_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return t(`page.blocks.create.weekdayLabels.${WEEKDAY_KEY_BY_INDEX[v]}`);
      })
      .filter(Boolean)
      .join(', ');
  }, [form.repeatDaysOfWeek]);

  /** Singular label when exactly one weekday is selected. */
  const repeatWeekdayFieldLabel =
    form.repeatDaysOfWeek.length === 1 ? t("page.blocks.create.dayOfWeek") : t("page.blocks.create.weekdays");

  const showRepeatWeekdayPicker =
    form.isRecurring && recurrenceAllowed && (form.repeatFrequency === 'weekly' || form.repeatFrequency === 'biweekly');

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? t("page.blocks.create.editBlock") : t("page.blocks.create.blockTime")}
      subtitle={
        isEditMode
          ? t("page.blocks.create.editBlockSubtitle")
          : t("page.blocks.create.blockTimeSubtitle")
      }
      icon={CalendarClock}
      iconColor="text-foreground-1"
      contentClassName="bg-surface scrollbar-hide"
      footer={
        <FormFooter
          onCancel={handleClose}
          formId="create-block-form"
          cancelLabel={t("page.blocks.create.cancel")}
          submitLabel={isEditMode ? t("page.blocks.create.saveChanges") : t("page.blocks.create.createBlock")}
          disabled={!canCreateBlocks || !canSubmit}
          isLoading={submitting}
        />
      }
    >
      <form
        id="create-block-form"
        onSubmit={handleSubmit}
        className="h-full flex flex-col cursor-default"
      >
        <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
          <div className="max-w-2xl mx-auto space-y-8 cursor-default">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            {isEditMode && (
              <div className="p-3 rounded-lg bg-surface-hover text-sm text-foreground-3 dark:text-foreground-2">
                {t("page.blocks.create.editNotice")}
              </div>
            )}

            {!isEditMode && (
              <>
                <div className="space-y-5">
                  <SliderSectionHeader
                    title={t("page.blocks.create.type")}
                    description={
                      !isTeamMember
                        ? t("page.blocks.create.typeDescriptionOwner")
                        : t("page.blocks.create.typeDescriptionTeamMember")
                    }
                  />
                  {!canCreateBlocks ? (
                    <div className="p-3 rounded-lg bg-surface-hover text-foreground-3 dark:text-foreground-2 text-sm">
                      Your role cannot create calendar blocks. Ask an owner to enable staff block permissions.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
                      {!isTeamMember && (
                        <Pill
                          selected={form.blockScope === CalendarBlockScope.LOCATION}
                          showCheckmark
                          contentAlign="start"
                          className="!min-h-0 h-auto !py-3 flex-1 min-w-[min(100%,200px)] justify-start text-left transition-none active:scale-100"
                          onClick={handleBlockScopeLocation}
                        >
                          <span className="flex w-full min-w-0 flex-col items-start gap-1.5 text-left">
                            <span className="inline-flex items-center gap-2 font-medium text-foreground-1">
                              <span className="leading-snug">{t("page.blocks.create.locationBlock")}</span>
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                            </span>
                            <span className="text-xs font-normal leading-snug text-foreground-3 dark:text-foreground-2">
                              {t("page.blocks.create.locationBlockDesc")}
                            </span>
                          </span>
                        </Pill>
                      )}
                      {hasStaff && (
                        <Pill
                          selected={form.blockScope === CalendarBlockScope.STAFF}
                          showCheckmark
                          contentAlign="start"
                          className="!min-h-0 h-auto !py-3 flex-1 min-w-[min(100%,200px)] justify-start text-left transition-none active:scale-100"
                          onClick={handleBlockScopeStaff}
                        >
                          <span className="flex w-full min-w-0 flex-col items-start gap-1.5 text-left">
                            <span className="inline-flex items-center gap-2 font-medium text-foreground-1">
                              <span className="leading-snug">{t("page.blocks.create.staffUnavailability")}</span>
                              <User className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                            </span>
                            <span className="text-xs font-normal leading-snug text-foreground-3 dark:text-foreground-2">
                            {t("page.blocks.create.staffUnavailabilityDesc")}
                            </span>
                          </span>
                        </Pill>
                      )}
                    </div>
                  )}
                  {canCreateBlocks && !isTeamMember && form.blockScope === CalendarBlockScope.LOCATION && (
                    <div className="rounded-xl border border-border bg-white p-3 shadow-sm dark:bg-card md:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 pr-2">
                          <Label htmlFor="apply-all-locations" className="text-sm font-semibold text-foreground-1 cursor-pointer">
                            {t("page.blocks.create.applyToAllLocations")}
                          </Label>
                          <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-1 leading-relaxed">
                            {t("page.blocks.create.applyToAllLocationsDesc")}
                          </p>
                        </div>
                        <Switch
                          id="apply-all-locations"
                          checked={form.applyToAllLocations}
                          onCheckedChange={handleApplyToAllLocationsChange}
                          className="!h-5 !w-9 !min-h-0 !min-w-0 shrink-0"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <BlockDrawerSectionDivider />

                {canCreateBlocks && form.blockScope === CalendarBlockScope.STAFF && (
                  <>
                    <div className="space-y-5">
                      <SliderSectionHeader
                        title={t("page.blocks.create.staff")}
                        description={t("page.blocks.create.staffDesc")}
                      />
                      <div
                        className="flex flex-wrap items-center gap-1.5"
                        role="radiogroup"
                        aria-label={t("page.blocks.create.staffLabel")}
                      >
                        {locationStaff.map((member) => {
                          const selected = form.userId === member.id;
                          const name = blockStaffFullName(member);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              aria-label={name}
                              title={name}
                              onClick={() => handleSelectStaff(member.id)}
                              className={cn(
                                CALENDAR_FILTER_CHIP_ITEM_BASE,
                                'border-border bg-surface text-foreground hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900',
                                selected &&
                                  'border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900',
                              )}
                            >
                              <Avatar className="size-6 shrink-0 border border-border transition-none">
                                {member.profileImage ? (
                                  <AvatarImage src={member.profileImage} alt="" />
                                ) : null}
                                <AvatarFallback
                                  className="text-[10px] font-semibold leading-none text-foreground-1"
                                  style={{ backgroundColor: getAvatarBgColor(blockStaffAvatarColorKey(member)) }}
                                >
                                  {blockStaffInitials(member)}
                                </AvatarFallback>
                              </Avatar>
                              <span className={CALENDAR_FILTER_CHIP_LABEL}>{name}</span>
                              {selected ? <CalendarFilterPillCheckmark /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <BlockDrawerSectionDivider />
                  </>
                )}
              </>
            )}

            <div className="space-y-5">
              <SliderSectionHeader
                title={t("page.blocks.create.dateTime")}
                description={t("page.blocks.create.dateTimeDesc")}
              />
              <div className="rounded-xl border border-border bg-white p-3 shadow-sm dark:bg-card md:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <Label htmlFor="all-day" className="text-sm font-semibold text-foreground-1 cursor-pointer">
                      {t("page.blocks.create.allDay")}
                    </Label>
                    <p className="text-xs text-foreground-3 dark:text-foreground-2 mt-1 leading-relaxed">
                      {t("page.blocks.create.allDayDescription")}
                    </p>
                  </div>
                  <Switch
                    id="all-day"
                    checked={form.isAllDay}
                    onCheckedChange={handleAllDayChange}
                    className="!h-5 !w-9 !min-h-0 !min-w-0 shrink-0"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground-1">{t("page.blocks.create.startDate")}</Label>
                    <DatePicker
                      value={form.startDate}
                      onChange={handleStartDateChange}
                      minDate={startDatePickerMin}
                      connectedPopover
                      className={cn(datePickerClass)}
                      placeholder={t("page.blocks.create.selectDate")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground-1">{t("page.blocks.create.endDate")}</Label>
                    <DatePicker
                      value={form.endDate}
                      onChange={handleEndDateChange}
                      minDate={endOrRepeatDatePickerMin}
                      connectedPopover
                      className={cn(datePickerClass)}
                      placeholder={t("page.blocks.create.selectDate")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <BlockDrawerTimeSlotSelect
                    label={t("page.blocks.create.startTime")}
                    date={form.startDate}
                    value={form.startTime}
                    onSelect={handleStartTimeSelect}
                    timeSlots={timeSlots}
                    workingHours={workingHours}
                    open247={open247}
                    disabled={form.isAllDay}
                  />
                  <BlockDrawerTimeSlotSelect
                    label={t("page.blocks.create.endTime")}
                    date={form.endDate}
                    value={form.endTime}
                    onSelect={handleEndTimeSelect}
                    timeSlots={timeSlots}
                    workingHours={workingHours}
                    open247={open247}
                    disabled={form.isAllDay}
                  />
                </div>

                {form.startDate && form.endDate && !form.isAllDay && !form.isRecurring &&
                  formatDateInTimezone(form.startDate, blockTz) !==
                    formatDateInTimezone(form.endDate, blockTz) && (
                    <p className="text-xs text-muted-foreground">
                      {t("page.blocks.create.multiDayContinuousHelper", {
                        startDate: form.startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        startTime: form.startTime,
                        endDate: form.endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        endTime: form.endTime,
                      })}
                    </p>
                  )}
              </div>
            </div>

            {!isEditMode && (
              <>
                <BlockDrawerSectionDivider />
                <div
                  className={cn(
                    'space-y-5',
                    !recurrenceAllowed && 'opacity-50 pointer-events-none',
                  )}
                >
                  <SliderSectionHeader
                    title={t("page.blocks.create.repeat")}
                    description={
                      recurrenceAllowed
                        ? t("page.blocks.create.repeatOnDesc")
                        : t("page.blocks.create.recurringNeedsSingleDayDesc")
                    }
                  />
                  <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 dark:bg-card">
                    <Label
                      htmlFor="repeat"
                      className={cn(
                        'text-sm font-medium text-foreground-1',
                        recurrenceAllowed && 'cursor-pointer',
                      )}
                    >
                      {t("page.blocks.create.makeRecurring")}
                    </Label>
                    <Switch
                      id="repeat"
                      checked={form.isRecurring}
                      onCheckedChange={handleRecurringChange}
                      disabled={!recurrenceAllowed}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                  {form.isRecurring && recurrenceAllowed && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <Pill
                          selected={form.repeatFrequency === 'daily'}
                          showCheckmark
                          className="!min-h-12 w-auto justify-start transition-none active:scale-100"
                          onClick={() => handleRepeatFrequencyChange('daily')}
                        >
                          {t("page.blocks.create.daily")}
                        </Pill>
                        <Pill
                          selected={form.repeatFrequency === 'weekly'}
                          showCheckmark
                          className="!min-h-12 w-auto justify-start transition-none active:scale-100"
                          onClick={() => handleRepeatFrequencyChange('weekly')}
                        >
                          {t("page.blocks.create.weekly")}
                        </Pill>
                        <Pill
                          selected={form.repeatFrequency === 'biweekly'}
                          showCheckmark
                          className="!min-h-12 w-auto justify-start transition-none active:scale-100"
                          onClick={() => handleRepeatFrequencyChange('biweekly')}
                        >
                          {t("page.blocks.create.everyTwoWeeks")}
                        </Pill>
                        <Pill
                          selected={form.repeatFrequency === 'monthly'}
                          showCheckmark
                          className="!min-h-12 w-auto justify-start transition-none active:scale-100"
                          onClick={() => handleRepeatFrequencyChange('monthly')}
                        >
                          {t("page.blocks.create.monthly")}
                        </Pill>
                      </div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
                        {showRepeatWeekdayPicker ? (
                          <div className="min-w-0 flex-1 space-y-2">
                            <Label className="text-sm font-medium text-foreground-1">
                              {repeatWeekdayFieldLabel}
                            </Label>
                            <BlockRepeatWeekdaysCombo
                              summary={repeatWeekdaySummary}
                              selectedDays={form.repeatDaysOfWeek}
                              listGroupHeading={repeatWeekdayFieldLabel}
                              onToggleDay={(day) =>
                                handleRepeatWeekdayChecked(day, !form.repeatDaysOfWeek.includes(day))
                              }
                            />
                          </div>
                        ) : null}
                        <div
                          className={cn(
                            'min-w-0 space-y-2',
                            showRepeatWeekdayPicker ? 'flex-1' : 'w-full sm:w-1/2 sm:shrink-0',
                          )}
                        >
                          <Label className="text-sm font-medium text-foreground-1">{t("page.blocks.create.ends")}</Label>
                          <DatePicker
                            value={form.repeatEndDate}
                            onChange={handleRepeatEndDateChange}
                            minDate={endOrRepeatDatePickerMin}
                            connectedPopover
                            calendarDisabled={form.repeatEndDate == null}
                            className={cn(datePickerClass)}
                            placeholder={t("page.blocks.create.noEndDate")}
                            popoverHeaderSlot={
                              <div className="flex items-center justify-between gap-3">
                                <Label
                                  htmlFor="repeat-end-no-date-switch"
                                  className="cursor-pointer text-sm font-medium text-foreground-1"
                                >
                                  {t("page.blocks.create.noEndDate")}
                                </Label>
                                <Switch
                                  id="repeat-end-no-date-switch"
                                  checked={form.repeatEndDate == null}
                                  onCheckedChange={handleRepeatNoEndSwitch}
                                  className="!h-5 !w-9 !min-h-0 !min-w-0"
                                />
                              </div>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <BlockDrawerSectionDivider />

            <div className="space-y-5">
              <SliderSectionHeader
                title={t("page.blocks.create.reason")}
                description={t("page.blocks.create.reasonDesc")}
              />
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label={t("page.blocks.create.reasonLabel")}
              >
                {allowedReasonOptions.map((option) => {
                  const isSelected = form.reason === option.value;
                  const Icon = option.Icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleReasonSelect(option.value)}
                      title={option.label}
                      aria-label={option.label}
                      aria-pressed={isSelected}
                      className={cn(
                        'group',
                        CALENDAR_FILTER_CHIP_ITEM_BASE,
                        'border-border bg-surface text-foreground hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900',
                        isSelected &&
                          'border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900',
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-3.5 shrink-0',
                          isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                        )}
                        aria-hidden
                      />
                      <span className={CALENDAR_FILTER_CHIP_LABEL}>{option.label}</span>
                      {isSelected ? <CalendarFilterPillCheckmark /> : null}
                    </button>
                  );
                })}
              </div>
              {canCreateBlocks && allowedReasonOptions.length === 0 && (
                <p className="text-xs text-foreground-3 dark:text-foreground-2">
                  No block reasons are allowed for your role. Ask an owner to configure staff block types in booking
                  settings.
                </p>
              )}
            </div>

            <BlockDrawerSectionDivider />

            <div className="space-y-5">
              <SliderSectionHeader
                title={t("page.blocks.create.titleAndNotes")}
                description={t("page.blocks.create.titleAndNotesDesc")}
              />
              <div className="space-y-2">
                <Label htmlFor="block-title" className="text-sm font-medium text-foreground-1">
                  {t("page.blocks.create.title")} <span className="font-normal text-foreground-3">{t("page.blocks.create.optional")}</span>
                </Label>
                <Input
                  id="block-title"
                  placeholder={t("page.blocks.create.titlePlaceholder")}
                  value={form.title}
                  onChange={handleTitleChange}
                  maxLength={BLOCK_TITLE_MAX_LEN}
                  aria-invalid={!!blockTitleError}
                  className="h-12 border border-border-strong bg-surface px-4 text-base hover:bg-surface-hover dark:border-border-strong"
                />
                {blockTitleError ? (
                  <p
                    className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{blockTitleError}</span>
                  </p>
                ) : null}
              </div>
              <TextareaField
                value={form.notes}
                onChange={(value) => setForm((p) => ({ ...p, notes: value }))}
                label={t("page.blocks.create.notesLabel")}
                placeholder={t("page.blocks.create.notesPlaceholder")}
                helperText={t("page.blocks.create.notesHelper")}
                rows={3}
                id="block-notes"
                maxLength={BLOCK_NOTES_MAX_LEN}
                showCharacterCount
                error={blockNotesError ?? undefined}
              />
            </div>
          </div>
        </div>
      </form>
    </BaseSlider>
  );
};

export default CreateBlockDrawer;
