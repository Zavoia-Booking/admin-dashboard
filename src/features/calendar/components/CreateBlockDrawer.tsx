import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
} from '../selectors';
import { toast } from 'sonner';
import {
  CalendarBlockScope,
  CalendarBlockReason,
  type CalendarBlockCreatePayload,
} from '../../../shared/types/calendar';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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

  // Form state
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time picker state
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  const hasStaff = locationStaff.length > 0;

  // ─────────────────────────────────────────────────────────────
  // Reset on open
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...initialForm,
        startDate: selectedDate || new Date(),
        endDate: selectedDate || new Date(),
      });
      setError(null);
    }
  }, [isOpen, selectedDate]);

  // ─────────────────────────────────────────────────────────────
  // Close handler
  // ─────────────────────────────────────────────────────────────

  const handleClose = () => {
    dispatch(toggleBlockFormAction(false));
  };

  // ─────────────────────────────────────────────────────────────
  // Time slots
  // ─────────────────────────────────────────────────────────────

  const timeSlots = useMemo(() => {
    const interval = bookingSettings?.slotIntervalMinutes ?? 15;
    const slots: string[] = [];
    for (let m = 0; m < 24 * 60; m += interval) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }, [bookingSettings]);

  const formatSlotTime = (slot: string) => {
    const [h, m] = slot.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // ─────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────

  const canSubmit =
    form.startDate !== null &&
    form.endDate !== null &&
    selectedLocationId !== null &&
    (form.blockScope !== CalendarBlockScope.STAFF || form.userId !== null) &&
    (form.isAllDay || (form.startTime !== '' && form.endTime !== ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedLocationId || !form.startDate || !form.endDate) return;

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

    try {
      dispatch(createCalendarBlock.request(payload));
      toast.success(
        form.blockScope === CalendarBlockScope.LOCATION
          ? 'Location block created'
          : 'Staff time-off created',
      );
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
            disabled={!canSubmit || submitting}
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, blockScope: CalendarBlockScope.LOCATION, userId: null }))}
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
                {hasStaff && (
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, blockScope: CalendarBlockScope.STAFF }))}
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

              <p className="text-xs text-muted-foreground">
                {form.blockScope === CalendarBlockScope.LOCATION
                  ? 'Blocks the entire location — no appointments can be booked during this time.'
                  : 'Blocks a specific staff member — the location remains open for other staff.'}
              </p>
            </div>

            {/* ── Staff Picker (if staff scope) ── */}
            {form.blockScope === CalendarBlockScope.STAFF && (
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
                      onClick={() => setForm((p) => ({ ...p, userId: staff.id }))}
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
                  onCheckedChange={(checked) => setForm((p) => ({ ...p, isAllDay: checked }))}
                  className="!h-5 !w-9 !min-h-0 !min-w-0"
                />
              </div>

              {/* Start date/time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Date</Label>
                  <DatePicker
                    selected={form.startDate}
                    onChange={(date) => {
                      setForm((p) => ({
                        ...p,
                        startDate: date,
                        endDate: p.endDate && date && p.endDate < date ? date : p.endDate,
                      }));
                    }}
                    dateFormat="yyyy-MM-dd"
                    className="border-0 bg-muted/50 focus:bg-background h-10 text-sm w-full rounded-md px-3"
                    placeholderText="Start date"
                    popperClassName="z-[90]"
                  />
                </div>
                {!form.isAllDay && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Start Time</Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setStartTimeOpen(!startTimeOpen)}
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
                              )}
                              onClick={() => {
                                setForm((p) => ({ ...p, startTime: slot }));
                                setStartTimeOpen(false);
                              }}
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
                    selected={form.endDate}
                    onChange={(date) => setForm((p) => ({ ...p, endDate: date }))}
                    dateFormat="yyyy-MM-dd"
                    className="border-0 bg-muted/50 focus:bg-background h-10 text-sm w-full rounded-md px-3"
                    placeholderText="End date"
                    popperClassName="z-[90]"
                    minDate={form.startDate ?? undefined}
                  />
                </div>
                {!form.isAllDay && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">End Time</Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEndTimeOpen(!endTimeOpen)}
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
                              )}
                              onClick={() => {
                                setForm((p) => ({ ...p, endTime: slot }));
                                setEndTimeOpen(false);
                              }}
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

            {/* ── Reason Section ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <ShieldOff className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Reason</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {reasonOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, reason: option.value }))}
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
            </div>

            {/* ── Title & Notes ── */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Title (optional)</Label>
                <Input
                  placeholder="e.g., Team lunch, Maintenance..."
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="h-10 border-0 bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes (optional)</Label>
                <Textarea
                  placeholder="Additional details..."
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
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
