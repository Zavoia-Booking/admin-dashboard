import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "../../../shared/components/ui/input";
import { Textarea } from "../../../shared/components/ui/textarea";
import { Label } from "../../../shared/components/ui/label";
import { CollapsibleFormSection } from "../../../shared/components/forms/CollapsibleFormSection";
import { Switch } from "../../../shared/components/ui/switch";
import type { UpdateBookingSettingsPayload } from "../types";
import { SectionDivider } from "../../../shared/components/common/SectionDivider";
import { fetchBookingSettingsAction } from "../actions";
import { selectBookingSettings } from "../selectors";

export interface AdvancedSettingsSectionRef {
  getCurrentSettings: () => UpdateBookingSettingsPayload;
  isDirty: () => boolean;
}

export const AdvancedSettingsSection = forwardRef<AdvancedSettingsSectionRef>((_props, ref) => {
  const dispatch = useDispatch();
  const bookingSettings = useSelector(selectBookingSettings);
  const hasFetchedRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for form
  const [formData, setFormData] = useState<UpdateBookingSettingsPayload>(() => ({
    minAdvanceBookingMinutes: 60,
    maxAdvanceBookingMinutes: 43200,
    slotIntervalMinutes: 15,
    bufferTimeMinutes: 0,
    cancellationWindowMinutes: 1440,
    allowCustomerCancellation: true,
    allowCustomerReschedule: true,
    autoConfirmBookings: false,
    requireCustomerAccount: false,
    requirePhoneNumber: false,
    allowStaffSelection: true,
    showAnyStaffOption: true,
    maxActiveBookingsPerCustomer: null,
    maxBookingsPerDay: null,
    showPrices: true,
    showDurations: true,
    showStaffImages: false,
    cancellationPolicyMessage: null,
    bookingConfirmationMessage: null,
  }));

  // Fetch booking settings on mount (only once per component lifetime)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchBookingSettingsAction.request());
    }
  }, [dispatch]);

  // Sync local state when Redux data changes
  useEffect(() => {
    if (bookingSettings) {
      setFormData({
        minAdvanceBookingMinutes: bookingSettings.minAdvanceBookingMinutes ?? 60,
        maxAdvanceBookingMinutes: bookingSettings.maxAdvanceBookingMinutes ?? 43200,
        slotIntervalMinutes: bookingSettings.slotIntervalMinutes ?? 15,
        bufferTimeMinutes: bookingSettings.bufferTimeMinutes ?? 0,
        cancellationWindowMinutes: bookingSettings.cancellationWindowMinutes ?? 1440,
        allowCustomerCancellation: bookingSettings.allowCustomerCancellation ?? true,
        allowCustomerReschedule: bookingSettings.allowCustomerReschedule ?? true,
        autoConfirmBookings: bookingSettings.autoConfirmBookings ?? false,
        requireCustomerAccount: bookingSettings.requireCustomerAccount ?? false,
        requirePhoneNumber: bookingSettings.requirePhoneNumber ?? false,
        allowStaffSelection: bookingSettings.allowStaffSelection ?? true,
        showAnyStaffOption: bookingSettings.showAnyStaffOption ?? true,
        maxActiveBookingsPerCustomer: bookingSettings.maxActiveBookingsPerCustomer ?? null,
        maxBookingsPerDay: bookingSettings.maxBookingsPerDay ?? null,
        showPrices: bookingSettings.showPrices ?? true,
        showDurations: bookingSettings.showDurations ?? true,
        showStaffImages: bookingSettings.showStaffImages ?? false,
        cancellationPolicyMessage: bookingSettings.cancellationPolicyMessage ?? null,
        bookingConfirmationMessage: bookingSettings.bookingConfirmationMessage ?? null,
      });
    }
  }, [bookingSettings]);

  // Update field helper
  const updateField = <K extends keyof UpdateBookingSettingsPayload>(
    field: K,
    value: UpdateBookingSettingsPayload[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getCurrentSettings: () => formData,
    isDirty: () => {
      if (!bookingSettings) return false;
      return JSON.stringify(formData) !== JSON.stringify({
        minAdvanceBookingMinutes: bookingSettings.minAdvanceBookingMinutes ?? 60,
        maxAdvanceBookingMinutes: bookingSettings.maxAdvanceBookingMinutes ?? 43200,
        slotIntervalMinutes: bookingSettings.slotIntervalMinutes ?? 15,
        bufferTimeMinutes: bookingSettings.bufferTimeMinutes ?? 0,
        cancellationWindowMinutes: bookingSettings.cancellationWindowMinutes ?? 1440,
        allowCustomerCancellation: bookingSettings.allowCustomerCancellation ?? true,
        allowCustomerReschedule: bookingSettings.allowCustomerReschedule ?? true,
        autoConfirmBookings: bookingSettings.autoConfirmBookings ?? false,
        requireCustomerAccount: bookingSettings.requireCustomerAccount ?? false,
        requirePhoneNumber: bookingSettings.requirePhoneNumber ?? false,
        allowStaffSelection: bookingSettings.allowStaffSelection ?? true,
        showAnyStaffOption: bookingSettings.showAnyStaffOption ?? true,
        maxActiveBookingsPerCustomer: bookingSettings.maxActiveBookingsPerCustomer ?? null,
        maxBookingsPerDay: bookingSettings.maxBookingsPerDay ?? null,
        showPrices: bookingSettings.showPrices ?? true,
        showDurations: bookingSettings.showDurations ?? true,
        showStaffImages: bookingSettings.showStaffImages ?? false,
        cancellationPolicyMessage: bookingSettings.cancellationPolicyMessage ?? null,
        bookingConfirmationMessage: bookingSettings.bookingConfirmationMessage ?? null,
      });
    }
  }), [formData, bookingSettings]);

  // Helper to convert minutes to human-readable format
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  return (
    <CollapsibleFormSection
      title="Advanced Settings"
      description="Configure booking intervals, cancellation policies, and more"
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mt-6"
    >
      <div className="space-y-10 pt-6">
        {/* Timing Settings */}
        <div className="space-y-4">
          <SectionDivider title="Timing & Intervals" />
          <div className="group relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative p-4 space-y-6">
              <div className="space-y-1.5 px-1">
                <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                  Booking Windows
                </h3>
                <div className="flex items-start gap-1.5 text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  <span>
                    Configure how far in advance and how far ahead customers can
                    book.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-3">
                  <Label
                    htmlFor="minAdvanceBooking"
                    className="text-sm font-semibold text-foreground-1"
                  >
                    Minimum Advance Booking
                  </Label>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    Customers must book at least this many minutes before the
                    appointment.
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="minAdvanceBooking"
                      type="number"
                      min={0}
                      value={formData.minAdvanceBookingMinutes}
                      onChange={(e) =>
                        updateField(
                          "minAdvanceBookingMinutes",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-32 rounded-xl border-border-strong focus:ring-primary/20 h-10 text-sm"
                    />
                    <div className="px-3 py-1.5 rounded-lg bg-muted text-xs font-bold text-foreground-2">
                      {formatMinutes(formData.minAdvanceBookingMinutes)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="maxAdvanceBooking"
                    className="text-sm font-semibold text-foreground-1"
                  >
                    Maximum Advance Booking
                  </Label>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    Customers can book up to this many minutes into the future.
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="maxAdvanceBooking"
                      type="number"
                      min={0}
                      value={formData.maxAdvanceBookingMinutes}
                      onChange={(e) =>
                        updateField(
                          "maxAdvanceBookingMinutes",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-32 rounded-xl border-border-strong focus:ring-primary/20 h-10 text-sm"
                    />
                    <div className="px-3 py-1.5 rounded-lg bg-muted text-xs font-bold text-foreground-2">
                      {formatMinutes(formData.maxAdvanceBookingMinutes)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border-subtle">
                <div className="space-y-3">
                  <Label
                    htmlFor="slotInterval"
                    className="text-sm font-semibold text-foreground-1"
                  >
                    Slot Interval
                  </Label>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    Time between available booking slots on your calendar.
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="slotInterval"
                      type="number"
                      min={5}
                      step={5}
                      value={formData.slotIntervalMinutes}
                      onChange={(e) =>
                        updateField(
                          "slotIntervalMinutes",
                          parseInt(e.target.value) || 15
                        )
                      }
                      className="w-32 rounded-xl border-border-strong focus:ring-primary/20 h-10 text-sm"
                    />
                    <span className="text-sm font-semibold text-foreground-3 dark:text-foreground-2">
                      minutes
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="bufferTime"
                    className="text-sm font-semibold text-foreground-1"
                  >
                    Buffer Time
                  </Label>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    Mandatory break time between back-to-back appointments.
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="bufferTime"
                      type="number"
                      min={0}
                      step={5}
                      value={formData.bufferTimeMinutes}
                      onChange={(e) =>
                        updateField(
                          "bufferTimeMinutes",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-32 rounded-xl border-border-strong focus:ring-primary/20 h-10 text-sm"
                    />
                    <span className="text-sm font-semibold text-foreground-3 dark:text-foreground-2">
                      minutes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation & Rescheduling */}
        <div className="space-y-4">
          <SectionDivider title="Policy & Modifications" />
          <div className="group relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative p-4 space-y-6">
              <div className="space-y-1.5 px-1">
                <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                  Cancellation Policy
                </h3>
                <div className="flex items-start gap-1.5 text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  <span>
                    Control how and when customers can modify their own
                    bookings.
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="cancellationWindow"
                    className="text-sm font-semibold text-foreground-1"
                  >
                    Cancellation Window
                  </Label>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    How many minutes before appointment customers can still
                    cancel or reschedule.
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="cancellationWindow"
                      type="number"
                      min={0}
                      value={formData.cancellationWindowMinutes}
                      onChange={(e) =>
                        updateField(
                          "cancellationWindowMinutes",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-32 rounded-xl border-border-strong focus:ring-primary/20 h-10 text-sm"
                    />
                    <div className="px-3 py-1.5 rounded-lg bg-muted text-xs font-bold text-foreground-2">
                      {formatMinutes(formData.cancellationWindowMinutes)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-muted/20 hover:border-border-strong transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          className="font-semibold text-sm cursor-pointer text-foreground-1"
                          htmlFor="allowCustomerCancellation"
                        >
                          Allow Cancellation
                        </Label>
                      </div>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2">
                        Customers can cancel bookings.
                      </p>
                    </div>
                    <Switch
                      id="allowCustomerCancellation"
                      checked={formData.allowCustomerCancellation}
                      onCheckedChange={(checked) =>
                        updateField("allowCustomerCancellation", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-muted/20 hover:border-border-strong transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          className="font-semibold text-sm cursor-pointer text-foreground-1"
                          htmlFor="allowCustomerReschedule"
                        >
                          Allow Rescheduling
                        </Label>
                      </div>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2">
                        Customers can change booking time.
                      </p>
                    </div>
                    <Switch
                      id="allowCustomerReschedule"
                      checked={formData.allowCustomerReschedule}
                      onCheckedChange={(checked) =>
                        updateField("allowCustomerReschedule", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements & Confirmation */}
        <div className="space-y-4">
          <SectionDivider title="Requirements & Confirmation" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    Customer Rules
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    Set what customers must provide to book.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-muted/20">
                    <Label
                      className="text-xs font-semibold cursor-pointer text-foreground-1"
                      htmlFor="requireCustomerAccount"
                    >
                      Require Account
                    </Label>
                    <Switch
                      id="requireCustomerAccount"
                      checked={formData.requireCustomerAccount}
                      onCheckedChange={(checked) =>
                        updateField("requireCustomerAccount", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-muted/20">
                    <Label
                      className="text-xs font-semibold cursor-pointer text-foreground-1"
                      htmlFor="requirePhoneNumber"
                    >
                      Require Phone
                    </Label>
                    <Switch
                      id="requirePhoneNumber"
                      checked={formData.requirePhoneNumber}
                      onCheckedChange={(checked) =>
                        updateField("requirePhoneNumber", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    Confirmation
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    Control how bookings are approved.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border-subtle bg-primary/[0.02] flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      className="text-xs font-semibold cursor-pointer text-foreground-1"
                      htmlFor="autoConfirmBookings"
                    >
                      Auto-Confirm
                    </Label>
                    <p className="text-[10px] text-foreground-3 dark:text-foreground-2">
                      Confirm without manual review.
                    </p>
                  </div>
                  <Switch
                    id="autoConfirmBookings"
                    checked={formData.autoConfirmBookings}
                    onCheckedChange={(checked) =>
                      updateField("autoConfirmBookings", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Display & Staff */}
        <div className="space-y-4">
          <SectionDivider title="Staff & Display" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground-1 flex items-center gap-2">
                    Staff Settings
                  </h3>
                  <p className="text-xs text-foreground-3">
                    Configure staff selection options.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-muted/20">
                    <Label
                      className="text-xs font-bold cursor-pointer"
                      htmlFor="allowStaffSelection"
                    >
                      Allow Staff Selection
                    </Label>
                    <Switch
                      id="allowStaffSelection"
                      checked={formData.allowStaffSelection}
                      onCheckedChange={(checked) =>
                        updateField("allowStaffSelection", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-muted/20">
                    <Label
                      className="text-xs font-bold cursor-pointer"
                      htmlFor="showAnyStaffOption"
                    >
                      Show "Any Staff"
                    </Label>
                    <Switch
                      id="showAnyStaffOption"
                      checked={formData.showAnyStaffOption}
                      onCheckedChange={(checked) =>
                        updateField("showAnyStaffOption", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-muted/20">
                    <Label
                      className="text-xs font-bold cursor-pointer"
                      htmlFor="showStaffImages"
                    >
                      Show Staff Images
                    </Label>
                    <Switch
                      id="showStaffImages"
                      checked={formData.showStaffImages}
                      onCheckedChange={(checked) =>
                        updateField("showStaffImages", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground-1 flex items-center gap-2">
                    Display Options
                  </h3>
                  <p className="text-xs text-foreground-3">
                    Control visibility of prices and duration.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-muted/20">
                    <Label
                      className="text-xs font-bold cursor-pointer"
                      htmlFor="showPrices"
                    >
                      Show Prices
                    </Label>
                    <Switch
                      id="showPrices"
                      checked={formData.showPrices}
                      onCheckedChange={(checked) =>
                        updateField("showPrices", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-muted/20">
                    <Label
                      className="text-xs font-bold cursor-pointer"
                      htmlFor="showDurations"
                    >
                      Show Durations
                    </Label>
                    <Switch
                      id="showDurations"
                      checked={formData.showDurations}
                      onCheckedChange={(checked) =>
                        updateField("showDurations", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Messages */}
        <div className="space-y-4 pb-12">
          <SectionDivider title="Messaging" />
          <div className="group relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative p-4 space-y-8">
              <div className="space-y-1.5 px-1">
                <h3 className="text-lg font-bold text-foreground-1 flex items-center gap-2">
                  Custom Messages
                </h3>
                <div className="flex items-start gap-1.5 text-sm text-foreground-3 leading-relaxed">
                  <span>
                    Personalize the messages your customers see during and after
                    booking.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="cancellationPolicy"
                      className="font-bold text-sm text-foreground-1"
                    >
                      Cancellation Policy
                    </Label>
                  </div>
                  <p className="text-sm text-foreground-3">
                    Shown to customers before they finalize their booking.
                  </p>
                  <Textarea
                    id="cancellationPolicy"
                    value={formData.cancellationPolicyMessage ?? ""}
                    onChange={(e) =>
                      updateField(
                        "cancellationPolicyMessage",
                        e.target.value || null
                      )
                    }
                    placeholder="Enter your cancellation policy..."
                    rows={4}
                    className="rounded-xl border-border-strong focus:ring-primary/20 bg-white/50"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="confirmationMessage"
                      className="font-bold text-sm text-foreground-1"
                    >
                      Confirmation Message
                    </Label>
                  </div>
                  <p className="text-sm text-foreground-3">
                    Shown on the success page after a booking is confirmed.
                  </p>
                  <Textarea
                    id="confirmationMessage"
                    value={formData.bookingConfirmationMessage ?? ""}
                    onChange={(e) =>
                      updateField("bookingConfirmationMessage", e.target.value || null)
                    }
                    placeholder="Enter your confirmation message..."
                    rows={4}
                    className="rounded-xl border-border-strong focus:ring-primary/20 bg-white/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleFormSection>
  );
});

AdvancedSettingsSection.displayName = 'AdvancedSettingsSection';
