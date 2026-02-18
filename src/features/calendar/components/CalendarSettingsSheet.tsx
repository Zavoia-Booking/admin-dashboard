import { type FC, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../shared/components/ui/sheet';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Switch } from '../../../shared/components/ui/switch';
import { Separator } from '../../../shared/components/ui/separator';
import {
  Monitor, Clock, Palette, Eye, Users, Bell, MessageSquare,
  ShieldCheck, Loader2, Save,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { getBookingSettings } from '../selectors';
import { AppointmentViewMode } from '../types';
import {
  calendarPreferences,
  type TimeFormat,
  type ColorCoding,
} from '../calendarPreferences';
import { updateBookingSettingsApi } from '../../marketplace/api';
import type { UpdateBookingSettingsPayload } from '../../marketplace/types';
import { toast } from 'sonner';
import { fetchLocationContext } from '../actions';
import { getSelectedLocationId } from '../selectors';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CalendarSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Pill selector helper
// ─────────────────────────────────────────────────────────────

interface PillOption<T extends string> {
  value: T;
  label: string;
}

function PillSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
            value === opt.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const CalendarSettingsSheet: FC<CalendarSettingsSheetProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const bookingSettings = useSelector(getBookingSettings);
  const selectedLocationId = useSelector(getSelectedLocationId);

  // --- Display preferences (localStorage) ---
  const [defaultView, setDefaultView] = useState<AppointmentViewMode>(AppointmentViewMode.WEEK);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');
  const [colorCoding, setColorCoding] = useState<ColorCoding>('status');
  const [showCancelled, setShowCancelled] = useState(true);

  // --- Business settings (backend) ---
  const [allowStaffBlock, setAllowStaffBlock] = useState(true);
  const [reminderHours, setReminderHours] = useState(24);
  const [cancellationMessage, setCancellationMessage] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [enforceMinAdvance, setEnforceMinAdvance] = useState(false);

  const [saving, setSaving] = useState(false);

  // Load preferences on open
  useEffect(() => {
    if (open) {
      const prefs = calendarPreferences.getAll();
      setDefaultView(prefs.defaultViewMode);
      setTimeFormat(prefs.timeFormat);
      setColorCoding(prefs.colorCoding);
      setShowCancelled(prefs.showCancelled);

      // Load backend settings
      if (bookingSettings) {
        setAllowStaffBlock(bookingSettings.allowStaffBlockCalendarWithoutConfirmation ?? true);
        setReminderHours(bookingSettings.reminderHoursBefore ?? 24);
        setCancellationMessage(bookingSettings.cancellationPolicyMessage ?? '');
        setReminderMessage(bookingSettings.bookingReminderMessage ?? '');
        setEnforceMinAdvance(bookingSettings.enforceMinAdvanceForAdmin ?? false);
      }
    }
  }, [open, bookingSettings]);

  // Save display preferences instantly to localStorage
  const handleDefaultViewChange = useCallback((mode: AppointmentViewMode) => {
    setDefaultView(mode);
    calendarPreferences.setDefaultViewMode(mode);
  }, []);

  const handleTimeFormatChange = useCallback((format: TimeFormat) => {
    setTimeFormat(format);
    calendarPreferences.setTimeFormat(format);
  }, []);

  const handleColorCodingChange = useCallback((coding: ColorCoding) => {
    setColorCoding(coding);
    calendarPreferences.setColorCoding(coding);
  }, []);

  const handleShowCancelledChange = useCallback((show: boolean) => {
    setShowCancelled(show);
    calendarPreferences.setShowCancelled(show);
  }, []);

  const handleReminderHoursChange = useCallback((v: string) => {
    setReminderHours(Number(v));
  }, []);

  const handleCancellationMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCancellationMessage(e.target.value);
  }, []);

  const handleReminderMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReminderMessage(e.target.value);
  }, []);

  // Save business settings to backend
  const handleSaveBusinessSettings = useCallback(async () => {
    setSaving(true);
    try {
      const payload: Partial<UpdateBookingSettingsPayload> = {
        allowStaffBlockCalendarWithoutConfirmation: allowStaffBlock,
        reminderHoursBefore: reminderHours,
        cancellationPolicyMessage: cancellationMessage.trim() || null,
        bookingReminderMessage: reminderMessage.trim() || null,
        enforceMinAdvanceForAdmin: enforceMinAdvance,
      };
      await updateBookingSettingsApi(payload);
      toast.success('Calendar settings saved');

      // Refresh location context to get updated booking settings
      if (selectedLocationId) {
        dispatch(fetchLocationContext.request(selectedLocationId));
      }

      onClose();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [
    allowStaffBlock, reminderHours, cancellationMessage,
    reminderMessage, enforceMinAdvance, selectedLocationId,
    dispatch, onClose,
  ]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Calendar Settings</SheetTitle>
          <SheetDescription>
            Configure display preferences and business calendar rules.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 py-6">
          {/* ─── Section 1: Display Preferences ─── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Monitor className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Display Preferences</h3>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Saved locally</span>
            </div>

            {/* Default view */}
            <div className="space-y-2">
              <Label className="text-sm">Default view on open</Label>
              <PillSelector
                options={[
                  { value: AppointmentViewMode.DAY, label: 'Day' },
                  { value: AppointmentViewMode.WEEK, label: 'Week' },
                  { value: AppointmentViewMode.MONTH, label: 'Month' },
                ]}
                value={defaultView}
                onChange={handleDefaultViewChange}
              />
            </div>

            {/* Time format */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-sm">Time format</Label>
              </div>
              <PillSelector
                options={[
                  { value: '24h' as TimeFormat, label: '24-hour (14:00)' },
                  { value: '12h' as TimeFormat, label: '12-hour (2:00 PM)' },
                ]}
                value={timeFormat}
                onChange={handleTimeFormatChange}
              />
            </div>

            {/* Color coding */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-sm">Appointment color coding</Label>
              </div>
              <PillSelector
                options={[
                  { value: 'status' as ColorCoding, label: 'By Status' },
                  { value: 'service' as ColorCoding, label: 'By Service' },
                  { value: 'staff' as ColorCoding, label: 'By Staff' },
                ]}
                value={colorCoding}
                onChange={handleColorCodingChange}
              />
            </div>

            {/* Show cancelled */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="show-cancelled" className="text-sm">Show cancelled appointments</Label>
              </div>
              <Switch
                id="show-cancelled"
                checked={showCancelled}
                onCheckedChange={handleShowCancelledChange}
              />
            </div>
          </section>

          <Separator />

          {/* ─── Section 2: Team Member Permissions ─── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Team Permissions</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="staff-block" className="text-sm">Allow staff to block time</Label>
                <p className="text-xs text-muted-foreground">
                  Team members can create time-off blocks without approval
                </p>
              </div>
              <Switch
                id="staff-block"
                checked={allowStaffBlock}
                onCheckedChange={setAllowStaffBlock}
              />
            </div>
          </section>

          <Separator />

          {/* ─── Section 3: Reminders ─── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Reminders</h3>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Send reminder before appointment</Label>
              <PillSelector
                options={[
                  { value: '0', label: 'Disabled' },
                  { value: '1', label: '1 hour' },
                  { value: '2', label: '2 hours' },
                  { value: '4', label: '4 hours' },
                  { value: '12', label: '12 hours' },
                  { value: '24', label: '24 hours' },
                  { value: '48', label: '48 hours' },
                ]}
                value={String(reminderHours)}
                onChange={handleReminderHoursChange}
              />
              <p className="text-xs text-muted-foreground">
                Customers will receive a notification this many hours before their appointment.
                Set to "Disabled" to turn off reminders.
              </p>
            </div>
          </section>

          <Separator />

          {/* ─── Section 4: Custom Messages ─── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Custom Messages</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation-message" className="text-sm">Cancellation policy message</Label>
              <Textarea
                id="cancellation-message"
                placeholder="e.g., Cancellations must be made at least 24 hours in advance..."
                value={cancellationMessage}
                onChange={handleCancellationMessageChange}
                rows={3}
                maxLength={1000}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Shown to customers when they view your cancellation policy.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-message" className="text-sm">Booking reminder message</Label>
              <Textarea
                id="reminder-message"
                placeholder="e.g., Looking forward to seeing you! Please arrive 10 minutes early..."
                value={reminderMessage}
                onChange={handleReminderMessageChange}
                rows={3}
                maxLength={1000}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Included in reminder notifications sent to customers before their appointment.
              </p>
            </div>
          </section>

          <Separator />

          {/* ─── Section 5: Admin Booking Override ─── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Admin Booking Rules</h3>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Label htmlFor="enforce-advance" className="text-sm">Enforce minimum advance booking for admins</Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When enabled, appointments created by admins through the calendar must also
                  respect the minimum advance booking time ({bookingSettings?.minAdvanceBookingMinutes ?? 60} minutes).
                  When disabled, admins can create appointments at any time, even for the same day
                  or past the advance booking window. This is useful if you want to prevent
                  accidental last-minute bookings.
                </p>
              </div>
              <Switch
                id="enforce-advance"
                checked={enforceMinAdvance}
                onCheckedChange={setEnforceMinAdvance}
              />
            </div>
          </section>

          {/* ─── Save Button ─── */}
          <div className="pt-4">
            <Button
              className="w-full"
              onClick={handleSaveBusinessSettings}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Business Settings
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Display preferences are saved automatically. Click save to update business settings.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
