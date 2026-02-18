import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DatePicker from '../../../shared/components/ui/date-picker';
import {
  ShieldOff, Clock, User, Loader2, MapPin, Calendar,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Switch } from '../../../shared/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { cn } from '../../../shared/lib/utils';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { useDispatch, useSelector } from 'react-redux';
import { createCalendarBlock, toggleBlockFormAction } from '../actions';
import {
  getSelectedLocationId,
  getLocationStaff,
  getBlockFormOpen,
  getSelectedDate,
  getBookingSettings,
  getLocationWorkingHours,
  getLocationOpen247,
} from '../selectors';
import { selectIsTeamMember } from '../../auth/selectors';

import {
  CalendarBlockScope,
  CalendarBlockReason,
  type CalendarBlockCreatePayload,
} from '../../../shared/types/calendar';
import { formatSlotTime } from './utils';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { isSlotOutsideWorkingHours } from '../workingHours';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

const WEEKDAY_LABELS: { value: number; label: string }[] = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

interface FormState {
  blockScope: CalendarBlockScope;
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
  repeatFrequency: 'daily' | 'weekly';
  repeatDaysOfWeek: number[]; // 0=Sun .. 6=Sat
  repeatEndDate: Date | null;
}

const initialForm: FormState = {
  blockScope: CalendarBlockScope.LOCATION,
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
// Reason options
// ─────────────────────────────────────────────────────────────

const reasonOptions: { value: CalendarBlockReason; label: string }[] = [
  { value: CalendarBlockReason.HOLIDAY, label: 'Holiday' },
  { value: CalendarBlockReason.VACATION, label: 'Vacation' },
  { value: CalendarBlockReason.SICK, label: 'Sick' },
  { value: CalendarBlockReason.LUNCH_BREAK, label: 'Lunch Break' },
  { value: CalendarBlockReason.BREAK, label: 'Break' },
  { value: CalendarBlockReason.MEETING, label: 'Meeting' },
  { value: CalendarBlockReason.PERSONAL, label: 'Personal' },
  { value: CalendarBlockReason.MAINTENANCE, label: 'Maintenance' },
  { value: CalendarBlockReason.OTHER, label: 'Other' },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const CreateBlockDrawer: React.FC = () => {
  const dispatch = useDispatch();

  // Redux
  const isOpen = useSelector(getBlockFormOpen);
  const selectedLocationId = useSelector(getSelectedLocationId);
  const locationStaff = useSelector(getLocationStaff);
  const selectedDate = useSelector(getSelectedDate);
  const bookingSettings = useSelector(getBookingSettings);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const isTeamMember = useSelector(selectIsTeamMember);

  // Form state
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time picker state
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  const hasStaff = locationStaff.length > 0;
  const canCreateBlocks =
    !isTeamMember || !!bookingSettings?.allowStaffBlockCalendarWithoutConfirmation;
  const allowedReasonOptions = useMemo(() => {
    if (!isTeamMember) {
      return reasonOptions;
    }
    const allowed = (bookingSettings?.staffBlockCalendarTypes ?? []).map((t) => String(t).toLowerCase());
    return reasonOptions.filter((option) => allowed.includes(option.value));
  }, [isTeamMember, bookingSettings]);

  // ─────────────────────────────────────────────────────────────
  // Reset on open
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...initialForm,
        blockScope: isTeamMember ? CalendarBlockScope.STAFF : CalendarBlockScope.LOCATION,
        startDate: selectedDate || new Date(),
        endDate: selectedDate || new Date(),
      });
      setError(null);
    }
  }, [isOpen, selectedDate, isTeamMember]);

  useEffect(() => {
    if (!isOpen) return;
    if (allowedReasonOptions.length === 0) return;
    const allowedReasons = new Set(allowedReasonOptions.map((o) => o.value));
    if (!allowedReasons.has(form.reason)) {
      setForm((prev) => ({ ...prev, reason: allowedReasonOptions[0].value }));
    }
  }, [isOpen, allowedReasonOptions, form.reason]);

  // ─────────────────────────────────────────────────────────────
  // Close handler
  // ─────────────────────────────────────────────────────────────

  const handleClose = () => {
    dispatch(toggleBlockFormAction(false));
  };

  const handleBlockScopeLocation = useCallback(() => {
    setForm((p) => ({ ...p, blockScope: CalendarBlockScope.LOCATION, userId: null }));
  }, []);

  const handleBlockScopeStaff = useCallback(() => {
    setForm((p) => ({ ...p, blockScope: CalendarBlockScope.STAFF }));
  }, []);

  const handleSelectStaff = useCallback((staffId: number) => {
    setForm((p) => ({ ...p, userId: staffId }));
  }, []);

  const handleAllDayChange = useCallback((checked: boolean) => {
    setForm((p) => ({ ...p, isAllDay: checked }));
  }, []);

  const handleStartDateChange = useCallback((date: Date) => {
    setForm((p) => ({
      ...p,
      startDate: date,
      endDate: p.endDate && date && p.endDate < date ? date : p.endDate,
    }));
  }, []);

  const handleEndDateChange = useCallback((date: Date) => {
    setForm((p) => ({ ...p, endDate: date }));
  }, []);

  const handleStartTimeSelect = useCallback((slot: string) => {
    setForm((p) => ({ ...p, startTime: slot }));
    setStartTimeOpen(false);
  }, []);

  const handleEndTimeSelect = useCallback((slot: string) => {
    setForm((p) => ({ ...p, endTime: slot }));
    setEndTimeOpen(false);
  }, []);

  const handleReasonSelect = useCallback((reason: CalendarBlockReason) => {
    setForm((p) => ({ ...p, reason }));
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, title: e.target.value }));
  }, []);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, notes: e.target.value }));
  }, []);

  const handleRecurringChange = useCallback((checked: boolean) => {
    setForm((p) => ({
      ...p,
      isRecurring: checked,
      repeatDaysOfWeek: checked && p.repeatFrequency === 'weekly' ? p.repeatDaysOfWeek : [],
    }));
  }, []);

  const handleRepeatFrequencyChange = useCallback((freq: 'daily' | 'weekly') => {
    setForm((p) => ({
      ...p,
      repeatFrequency: freq,
      repeatDaysOfWeek: freq === 'weekly' ? p.repeatDaysOfWeek : [],
    }));
  }, []);

  const handleRepeatDayToggle = useCallback((day: number) => {
    setForm((p) => {
      const next = p.repeatDaysOfWeek.includes(day)
        ? p.repeatDaysOfWeek.filter((d) => d !== day)
        : [...p.repeatDaysOfWeek, day].sort((a, b) => a - b);
      return { ...p, repeatDaysOfWeek: next };
    });
  }, []);

  const handleRepeatEndDateChange = useCallback((date: Date | null) => {
    setForm((p) => ({ ...p, repeatEndDate: date }));
  }, []);

  const handleToggleStartTimeOpen = useCallback(() => {
    setStartTimeOpen((open) => !open);
  }, []);

  const handleToggleEndTimeOpen = useCallback(() => {
    setEndTimeOpen((open) => !open);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Time slots (shared hook)
  // ─────────────────────────────────────────────────────────────

  const timeSlots = useTimeSlots(bookingSettings?.slotIntervalMinutes);

  // ─────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────

  const canSubmit =
    form.startDate !== null &&
    form.endDate !== null &&
    selectedLocationId !== null &&
    (!isTeamMember || allowedReasonOptions.length > 0) &&
    (form.blockScope !== CalendarBlockScope.STAFF || form.userId !== null) &&
    (form.isAllDay || (form.startTime !== '' && form.endTime !== '')) &&
    (!form.isRecurring || form.repeatFrequency === 'daily' || form.repeatDaysOfWeek.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateBlocks || !canSubmit || !selectedLocationId || !form.startDate || !form.endDate) return;

    setSubmitting(true);
    setError(null);

    let startsAt: string;
    let endsAt: string;

    if (form.isAllDay) {
      // For all-day, set start to beginning and end to end of the date
      const start = new Date(form.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(form.endDate);
      end.setHours(23, 59, 59, 999);
      startsAt = start.toISOString();
      endsAt = end.toISOString();
    } else {
      const [sh, sm] = form.startTime.split(':').map(Number);
      const [eh, em] = form.endTime.split(':').map(Number);
      const start = new Date(form.startDate);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(form.endDate);
      end.setHours(eh, em, 0, 0);
      startsAt = start.toISOString();
      endsAt = end.toISOString();
    }

    const payload: CalendarBlockCreatePayload = {
      blockScope: form.blockScope,
      locationId: selectedLocationId,
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
      if (form.repeatFrequency === 'weekly' && form.repeatDaysOfWeek.length > 0) {
        payload.repeatDaysOfWeek = form.repeatDaysOfWeek;
      }
      if (form.repeatEndDate) {
        payload.repeatEndDate = form.repeatEndDate.toISOString().slice(0, 10);
      }
    }

    try {
      dispatch(createCalendarBlock.request(payload));
      handleClose();
    } catch {
      setError('Failed to create block');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={handleClose}
      title="Block Time"
      contentClassName="bg-muted/50 scrollbar-hide"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-block-form"
            className="flex-1"
            disabled={!canCreateBlocks || !canSubmit || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Block'
            )}
          </Button>
        </div>
      }
    >
      <form id="create-block-form" onSubmit={handleSubmit} className="max-w-md mx-auto">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="space-y-8">
            {/* ── Scope Section ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <ShieldOff className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Block Type</h3>
              </div>

              {!canCreateBlocks ? (
                <div className="p-3 rounded-lg bg-muted/40 text-sm text-muted-foreground">
                  Your role cannot create calendar blocks. Ask an owner to enable staff block permissions.
                </div>
              ) : (
                <div className="flex gap-2">
                  {!isTeamMember && (
                    <button
                      type="button"
                      onClick={handleBlockScopeLocation}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors flex-1',
                        form.blockScope === CalendarBlockScope.LOCATION
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted',
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                      Location Block
                    </button>
                  )}
                  {hasStaff && (
                    <button
                      type="button"
                      onClick={handleBlockScopeStaff}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors flex-1',
                        form.blockScope === CalendarBlockScope.STAFF
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted',
                      )}
                    >
                      <User className="h-4 w-4" />
                      Staff Time Off
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {form.blockScope === CalendarBlockScope.LOCATION
                  ? 'Blocks the entire location — no appointments can be booked during this time.'
                  : 'Blocks a specific staff member — the location remains open for other staff.'}
              </p>
            </div>

            {/* ── Staff Picker (if staff scope) ── */}
            {canCreateBlocks && form.blockScope === CalendarBlockScope.STAFF && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Staff Member</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {locationStaff.map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleSelectStaff(staff.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                        form.userId === staff.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background border-border hover:bg-muted',
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={staff.profileImage ?? undefined} />
                        <AvatarFallback>
                          {staff.firstName[0]}
                          {staff.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {staff.firstName} {staff.lastName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Date & Time Section ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Date & Time</h3>
              </div>

              {/* All Day toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="all-day" className="text-sm font-medium">
                  All Day
                </Label>
                <Switch
                  id="all-day"
                  checked={form.isAllDay}
                  onCheckedChange={handleAllDayChange}
                  className="!h-5 !w-9 !min-h-0 !min-w-0"
                />
              </div>

              {/* Start date/time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Date</Label>
                  <DatePicker
                    value={form.startDate}
                    onChange={handleStartDateChange}
                    className="border-0 bg-muted/50 focus:bg-background h-10 text-sm w-full rounded-md px-3"
                    placeholder="Start date"
                  />
                </div>
                {!form.isAllDay && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Start Time</Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleToggleStartTimeOpen}
                        className="w-full h-10 text-sm text-left bg-muted/50 rounded-md px-3 flex items-center justify-between hover:bg-muted/70"
                      >
                        {form.startTime ? formatSlotTime(form.startTime) : 'Time'}
                        <Clock className="h-3 w-3 opacity-50" />
                      </button>
                      {startTimeOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-900 border rounded-md shadow-lg z-[90]">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              className={cn(
                                'w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50',
                                form.startTime === slot ? 'bg-primary/10 font-medium' : '',
                                isSlotOutsideWorkingHours(slot, form.startDate, workingHours, open247) && 'opacity-60 text-muted-foreground',
                              )}
                              onClick={() => handleStartTimeSelect(slot)}
                            >
                              {formatSlotTime(slot)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* End date/time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">End Date</Label>
                  <DatePicker
                    value={form.endDate}
                    onChange={handleEndDateChange}
                    minDate={form.startDate ?? undefined}
                    className="border-0 bg-muted/50 focus:bg-background h-10 text-sm w-full rounded-md px-3"
                    placeholder="End date"
                  />
                </div>
                {!form.isAllDay && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">End Time</Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleToggleEndTimeOpen}
                        className="w-full h-10 text-sm text-left bg-muted/50 rounded-md px-3 flex items-center justify-between hover:bg-muted/70"
                      >
                        {form.endTime ? formatSlotTime(form.endTime) : 'Time'}
                        <Clock className="h-3 w-3 opacity-50" />
                      </button>
                      {endTimeOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-900 border rounded-md shadow-lg z-[90]">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              className={cn(
                                'w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50',
                                form.endTime === slot ? 'bg-primary/10 font-medium' : '',
                                isSlotOutsideWorkingHours(slot, form.endDate, workingHours, open247) && 'opacity-60 text-muted-foreground',
                              )}
                              onClick={() => handleEndTimeSelect(slot)}
                            >
                              {formatSlotTime(slot)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Repeat Section ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="repeat" className="text-sm font-medium">
                  Repeat
                </Label>
                <Switch
                  id="repeat"
                  checked={form.isRecurring}
                  onCheckedChange={handleRecurringChange}
                  className="!h-5 !w-9 !min-h-0 !min-w-0"
                />
              </div>
              {form.isRecurring && (
                <div className="space-y-3 pl-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRepeatFrequencyChange('daily')}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-md border font-medium',
                        form.repeatFrequency === 'daily'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted',
                      )}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRepeatFrequencyChange('weekly')}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-md border font-medium',
                        form.repeatFrequency === 'weekly'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted',
                      )}
                    >
                      Weekly
                    </button>
                  </div>
                  {form.repeatFrequency === 'weekly' && (
                    <div className="flex flex-wrap gap-1.5">
                      {WEEKDAY_LABELS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRepeatDayToggle(value)}
                          className={cn(
                            'w-10 h-9 text-xs rounded-md border font-medium',
                            form.repeatDaysOfWeek.includes(value)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:bg-muted',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Ends on (optional)</Label>
                    <DatePicker
                      value={form.repeatEndDate}
                      onChange={handleRepeatEndDateChange}
                      minDate={form.startDate ?? undefined}
                      className="border-0 bg-muted/50 focus:bg-background h-10 text-sm w-full rounded-md px-3"
                      placeholder="No end date"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Reason Section ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <ShieldOff className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Reason</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {allowedReasonOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleReasonSelect(option.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                      form.reason === option.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-muted',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {canCreateBlocks && allowedReasonOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No block reasons are currently allowed for your role. Ask an owner to configure allowed block types.
                </p>
              )}
            </div>

            {/* ── Title & Notes ── */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Title (optional)</Label>
                <Input
                  placeholder="e.g., Team lunch, Maintenance..."
                  value={form.title}
                  onChange={handleTitleChange}
                  className="h-10 border-0 bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes (optional)</Label>
                <Textarea
                  placeholder="Additional details..."
                  value={form.notes}
                  onChange={handleNotesChange}
                  rows={3}
                  className="border-0 bg-muted/50 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </BaseSlider>
  );
};

export default CreateBlockDrawer;
