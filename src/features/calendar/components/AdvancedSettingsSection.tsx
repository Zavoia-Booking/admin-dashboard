import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Label } from "../../../shared/components/ui/label";
import { CollapsibleFormSection } from "../../../shared/components/forms/CollapsibleFormSection";
import { Switch } from "../../../shared/components/ui/switch";
import { Pill } from "../../../shared/components/ui/pill";
import { Tag, Info } from "lucide-react";
import { DurationInput } from "../../../shared/components/forms/fields/DurationInput";
import type { UpdateBookingSettingsPayload } from "../../marketplace/types";
import { SectionDivider } from "../../../shared/components/common/SectionDivider";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectIsOnTrial } from "../../auth/selectors";

// Quick-action presets for duration inputs (stable references)
const MIN_ADVANCE_QUICK_ACTIONS: (number | "other")[] = [0, 15, 30, 60, "other"];
const MAX_ADVANCE_QUICK_ACTIONS: (number | "other")[] = [0, 10080, 43200, 86400, "other"];
const BUFFER_QUICK_ACTIONS: (number | "other")[] = [0, 5, 15, 30, "other"];
const CANCELLATION_WINDOW_QUICK_ACTIONS: (number | "other")[] = [0, 60, 1440, 10080, "other"];
const RESCHEDULE_WINDOW_QUICK_ACTIONS: (number | "other")[] = [0, 60, 1440, 10080, "other"];
const STAFF_BLOCK_CALENDAR_TYPES = ["holidays", "timeOff", "sickDays"];
/** Hour options when reminders are enabled (0 = disabled is handled by switch). */
const REMINDER_HOURS_OPTIONS = [1, 2, 4, 12, 24, 48] as const;

const DEFAULT_SETTINGS: UpdateBookingSettingsPayload = {
  minAdvanceBookingMinutes: 60,
  maxAdvanceBookingMinutes: 43200,
  slotIntervalMinutes: 15,
  bufferTimeMinutes: 0,
  cancellationWindowMinutes: 1440,
  rescheduleWindowMinutes: 1440,
  allowCustomerCancellation: true,
  allowCustomerReschedule: true,
  autoConfirmBookings: true,
  allowStaffSelection: true,
  showAnyStaffOption: true,
  allowStaffCancelWithoutConfirmation: true,
  allowStaffRescheduleWithoutConfirmation: true,
  allowStaffBlockCalendarWithoutConfirmation: true,
  staffBlockCalendarTypes: [...STAFF_BLOCK_CALENDAR_TYPES],
  emailEnabled: true,
  smsEnabled: false,
  reminderHoursBefore: 24,
  enforceMinAdvanceForAdmin: false,
};

function mergeWithDefaults(
  initial: Partial<UpdateBookingSettingsPayload> | null
): UpdateBookingSettingsPayload {
  if (!initial) return { ...DEFAULT_SETTINGS };
  return {
    ...DEFAULT_SETTINGS,
    ...initial,
    staffBlockCalendarTypes: initial.staffBlockCalendarTypes ?? [],
  };
}

export interface AdvancedSettingsSectionRef {
  getCurrentSettings: () => UpdateBookingSettingsPayload;
  isDirty: () => boolean;
  hasErrors: () => boolean;
}

export interface AdvancedSettingsSectionProps {
  /** Initial values (e.g. from location context). When null or undefined, defaults are used. */
  initialSettings?: Partial<UpdateBookingSettingsPayload> | null;
  /** Called when dirty state changes (user has/has not modified advanced settings). */
  onDirtyChange?: (dirty: boolean) => void;
  /** Called when validation error state changes (e.g. block types required when switch is on). */
  onErrorsChange?: (hasErrors: boolean) => void;
}

export const AdvancedSettingsSection = forwardRef<
  AdvancedSettingsSectionRef,
  AdvancedSettingsSectionProps
>(({ initialSettings = null, onDirtyChange, onErrorsChange }, ref) => {
  const resolvedInitial = mergeWithDefaults(initialSettings ?? null);
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation("marketplace", { keyPrefix: "advancedSettings" });
  const isTrial = useSelector(selectIsOnTrial);

  const [formData, setFormData] = useState<UpdateBookingSettingsPayload>(
    () => resolvedInitial
  );

  /** Snapshot at mount so isDirty compares to opening state (parent can key by location/open to remount). */
  const initialSnapshotRef = React.useRef<UpdateBookingSettingsPayload>(resolvedInitial);

  useEffect(() => {
    onDirtyChange?.(JSON.stringify(formData) !== JSON.stringify(initialSnapshotRef.current));
  }, [formData, onDirtyChange]);

  /** Which advance field was last edited; used so min/max conflict error shows only on that field. */
  const lastEditedAdvanceRef = React.useRef<"min" | "max" | null>(null);

  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof UpdateBookingSettingsPayload, string>>
  >({});

  // Validation for messaging fields and timing windows
  useEffect(() => {
    const errors: Partial<
      Record<keyof UpdateBookingSettingsPayload, string>
    > = {};

    // Min/max advance: show error only on the field that was last edited (each field has its own trigger)
    if (
      formData.minAdvanceBookingMinutes >= formData.maxAdvanceBookingMinutes
    ) {
      const which = lastEditedAdvanceRef.current;
      if (which === "max") {
        errors.maxAdvanceBookingMinutes = t(
          "validation.maxAdvanceBooking"
        );
      } else {
        errors.minAdvanceBookingMinutes = t(
          "validation.minAdvanceBooking"
        );
      }
    }

    if (
      formData.allowStaffBlockCalendarWithoutConfirmation &&
      (!formData.staffBlockCalendarTypes ||
        formData.staffBlockCalendarTypes.length === 0)
    ) {
      errors.staffBlockCalendarTypes = t(
        "validation.blockTypesRequired"
      );
    }

    setFormErrors(errors);
  }, [
    formData.minAdvanceBookingMinutes,
    formData.maxAdvanceBookingMinutes,
    formData.allowStaffBlockCalendarWithoutConfirmation,
    formData.staffBlockCalendarTypes,
    t,
  ]);

  useEffect(() => {
    onErrorsChange?.(Object.keys(formErrors).length > 0);
  }, [formErrors, onErrorsChange]);

  const updateField = useCallback(
    <K extends keyof UpdateBookingSettingsPayload>(
      field: K,
      value: UpdateBookingSettingsPayload[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // DurationInput chip label formatters
  const getMaxAdvanceChipLabel = useCallback(
    (mins: number) =>
      mins === 0 ? t("timing.none") : `${Math.round(mins / 1440)}d`,
    [t]
  );
  const getBufferChipLabel = useCallback(
    (mins: number) =>
      mins === 0 ? t("timing.none") : `${mins}m`,
    [t]
  );

  // Booking approval subtext (auto vs manual)
  const bookingApprovalSubtext = formData.autoConfirmBookings
    ? t("confirmation.bookingApproval.autoConfirm")
    : t("confirmation.bookingApproval.manualConfirm");

  // Staff block type toggle (add/remove from list)
  const handleBlockTypeToggle = useCallback(
    (type: string) => {
      const current = formData.staffBlockCalendarTypes ?? [];
      const isSelected = current.includes(type);
      updateField(
        "staffBlockCalendarTypes",
        isSelected ? current.filter((x) => x !== type) : [...current, type]
      );
    },
    [formData.staffBlockCalendarTypes, updateField]
  );

  // Field change handlers (wrappers around updateField for stable refs)
  const handleMinAdvanceChange = useCallback(
    (val: number) => {
      lastEditedAdvanceRef.current = "min";
      updateField("minAdvanceBookingMinutes", val);
    },
    [updateField]
  );
  const handleMaxAdvanceChange = useCallback(
    (val: number) => {
      lastEditedAdvanceRef.current = "max";
      updateField("maxAdvanceBookingMinutes", val);
    },
    [updateField]
  );
  const handleBufferTimeChange = useCallback((val: number) => updateField("bufferTimeMinutes", val), [updateField]);
  const handleCancellationWindowChange = useCallback((val: number) => updateField("cancellationWindowMinutes", val), [updateField]);
  const handleRescheduleWindowChange = useCallback((val: number) => updateField("rescheduleWindowMinutes", val), [updateField]);
  const handleAllowCustomerCancellation = useCallback((checked: boolean) => updateField("allowCustomerCancellation", checked), [updateField]);
  const handleAllowCustomerReschedule = useCallback((checked: boolean) => updateField("allowCustomerReschedule", checked), [updateField]);
  const handleAutoConfirmBookings = useCallback((checked: boolean) => updateField("autoConfirmBookings", checked), [updateField]);
  const handleAllowStaffSelection = useCallback((checked: boolean) => updateField("allowStaffSelection", checked), [updateField]);
  const handleShowAnyStaffOption = useCallback((checked: boolean) => updateField("showAnyStaffOption", checked), [updateField]);
  const handleAllowStaffCancel = useCallback((checked: boolean) => updateField("allowStaffCancelWithoutConfirmation", checked), [updateField]);
  const handleAllowStaffReschedule = useCallback((checked: boolean) => updateField("allowStaffRescheduleWithoutConfirmation", checked), [updateField]);
  const handleAllowStaffBlock = useCallback((checked: boolean) => updateField("allowStaffBlockCalendarWithoutConfirmation", checked), [updateField]);
  const handleEmailEnabled = useCallback((checked: boolean) => updateField("emailEnabled", checked), [updateField]);
  const handleSmsEnabled = useCallback((checked: boolean) => updateField("smsEnabled", checked), [updateField]);
  const handleReminderHoursBeforeChange = useCallback((value: number) => updateField("reminderHoursBefore", value), [updateField]);
  const remindersEnabled = (formData.reminderHoursBefore ?? 0) > 0;
  const handleRemindersEnabledChange = useCallback(
    (checked: boolean) => updateField("reminderHoursBefore", checked ? 24 : 0),
    [updateField],
  );
  const handleEnforceMinAdvanceForAdmin = useCallback((checked: boolean) => updateField("enforceMinAdvanceForAdmin", checked), [updateField]);

  useImperativeHandle(
    ref,
    () => ({
      getCurrentSettings: () => formData,
      isDirty: () => {
        return JSON.stringify(formData) !== JSON.stringify(initialSnapshotRef.current);
      },
      hasErrors: () => Object.keys(formErrors).length > 0,
    }),
    [formData, formErrors]
  );

  const formatMinutes = (minutes: number): string => {
    if (minutes === 0) return t("timing.none");
    if (minutes < 60) return `${minutes}m`;
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
      title={t("title")}
      description={t("description")}
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mt-6 border border-border p-3 md:p-4 rounded-2xl bg-surface md:bg-transparent"
    >
      <div className="space-y-10 pt-0">
        {/* Timing Settings */}
        <div className="space-y-4">
          <SectionDivider title={t("timing.title")} />
          <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-info/5 dark:bg-info/20 rounded-full translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative p-3 md:p-4 space-y-6">
              <div className="space-y-1.5 px-1">
                <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                  {t("timing.bookingWindows.title")}
                </h3>
                <div className="flex items-start gap-1.5 text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  <span>
                    {t("timing.bookingWindows.description")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 pt-2">
                <DurationInput
                  id="minAdvanceBooking"
                  label={t("timing.minAdvanceBooking.label")}
                  helpText={t(
                    "timing.minAdvanceBooking.helpText"
                  )}
                  value={formData.minAdvanceBookingMinutes}
                  onChange={handleMinAdvanceChange}
                  quickActions={MIN_ADVANCE_QUICK_ACTIONS}
                  getChipLabel={formatMinutes}
                  error={formErrors.minAdvanceBookingMinutes}
                />

                <DurationInput
                  id="maxAdvanceBooking"
                  label={t("timing.maxAdvanceBooking.label")}
                  helpText={t(
                    "timing.maxAdvanceBooking.helpText"
                  )}
                  value={formData.maxAdvanceBookingMinutes}
                  onChange={handleMaxAdvanceChange}
                  quickActions={MAX_ADVANCE_QUICK_ACTIONS}
                  unit="days"
                  getChipLabel={getMaxAdvanceChipLabel}
                  error={formErrors.maxAdvanceBookingMinutes}
                />
              </div>

              <div className="grid grid-cols-1 gap-8 pt-4 border-t border-border">
                <DurationInput
                  id="bufferTime"
                  label={t("timing.bufferTime.label")}
                  helpText={t("timing.bufferTime.helpText")}
                  value={formData.bufferTimeMinutes}
                  onChange={handleBufferTimeChange}
                  quickActions={BUFFER_QUICK_ACTIONS}
                  getChipLabel={getBufferChipLabel}
                  compactLayout={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation & Rescheduling */}
        <div className="space-y-4">
          <SectionDivider title={t("policy.title")} />
          <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative p-3 md:p-4 space-y-6">
              <div className="space-y-1.5 px-1">
                <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                  {t("policy.cancellationPolicy.title")}
                </h3>
                <div className="flex items-start gap-1.5 text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  <span>
                    {t(
                      "policy.cancellationPolicy.description"
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-4 grid grid-cols-1 gap-4">
                <DurationInput
                  id="cancellationWindow"
                  label={t(
                    "policy.cancellationWindow.label"
                  )}
                  helpText={t(
                    "policy.cancellationWindow.helpText"
                  )}
                  value={formData.cancellationWindowMinutes}
                  onChange={handleCancellationWindowChange}
                  quickActions={CANCELLATION_WINDOW_QUICK_ACTIONS}
                  getChipLabel={formatMinutes}
                  unit="hours"
                  disabled={!formData.allowCustomerCancellation}
                />

                <DurationInput
                  id="rescheduleWindow"
                  label={t(
                    "policy.rescheduleWindow.label"
                  )}
                  helpText={t(
                    "policy.rescheduleWindow.helpText"
                  )}
                  value={formData.rescheduleWindowMinutes}
                  onChange={handleRescheduleWindowChange}
                  quickActions={RESCHEDULE_WINDOW_QUICK_ACTIONS}
                  getChipLabel={formatMinutes}
                  unit="hours"
                  disabled={!formData.allowCustomerReschedule}
                />

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-border bg-muted/20 hover:border-border-strong transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          className="font-semibold text-sm cursor-pointer text-foreground-1"
                          htmlFor="allowCustomerCancellation"
                        >
                          {t(
                            "policy.allowCancellation.label"
                          )}
                        </Label>
                      </div>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2">
                        {t(
                          "policy.allowCancellation.description"
                        )}
                      </p>
                    </div>
                    <Switch
                      id="allowCustomerCancellation"
                      checked={formData.allowCustomerCancellation}
                      onCheckedChange={handleAllowCustomerCancellation}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-border bg-muted/20 hover:border-border-strong transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          className="font-semibold text-sm cursor-pointer text-foreground-1"
                          htmlFor="allowCustomerReschedule"
                        >
                          {t(
                            "policy.allowRescheduling.label"
                          )}
                        </Label>
                      </div>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2">
                        {t(
                          "policy.allowRescheduling.description"
                        )}
                      </p>
                    </div>
                    <Switch
                      id="allowCustomerReschedule"
                      checked={formData.allowCustomerReschedule}
                      onCheckedChange={handleAllowCustomerReschedule}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation & Staff */}
        <div className="space-y-4">
          <SectionDivider title={t("confirmation.title")} />
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-3 md:p-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    {t(
                      "confirmation.bookingConfirmation.title"
                    )}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    {t(
                      "confirmation.bookingConfirmation.description"
                    )}
                  </p>
                </div>

                <div className="p-3 md:p-4 rounded-xl border border-border bg-primary/[0.02] flex items-center justify-between hover:border-border-strong">
                  <div className="space-y-1">
                    <Label
                      className="text-sm font-semibold cursor-pointer text-foreground-1"
                      htmlFor="autoConfirmBookings"
                    >
                      {t(
                        "confirmation.bookingApproval.label"
                      )}
                    </Label>
                    <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                      {bookingApprovalSubtext}
                    </p>
                  </div>
                  <Switch
                    id="autoConfirmBookings"
                    checked={formData.autoConfirmBookings}
                    onCheckedChange={handleAutoConfirmBookings}
                  />
                </div>
              </div>
            </div>

            <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-3 md:p-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 dark:bg-primary/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    {t("confirmation.staffSelection.title")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    {t(
                      "confirmation.staffSelection.description"
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:border-border-strong">
                    <div className="space-y-1">
                      <Label
                        className="text-sm font-medium cursor-pointer"
                        htmlFor="allowStaffSelection"
                      >
                        {t(
                          "confirmation.allowStaffSelection.label"
                        )}
                      </Label>
                      <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                        {t(
                          "confirmation.allowStaffSelection.description"
                        )}
                      </p>
                    </div>
                    <Switch
                      id="allowStaffSelection"
                      checked={formData.allowStaffSelection}
                      onCheckedChange={handleAllowStaffSelection}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:border-border-strong">
                    <div className="space-y-1">
                      <Label
                        className="text-sm font-medium cursor-pointer"
                        htmlFor="showAnyStaffOption"
                      >
                        {t(
                          "confirmation.showAnyStaffOption.label"
                        )}
                      </Label>
                      <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                        {t(
                          "confirmation.showAnyStaffOption.description"
                        )}
                      </p>
                    </div>
                    <Switch
                      id="showAnyStaffOption"
                      checked={formData.showAnyStaffOption}
                      onCheckedChange={handleShowAnyStaffOption}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Settings / Team Availability */}
            <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-3 md:p-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    {t(
                      "confirmation.calendarSettings.title"
                    )}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    {t(
                      "confirmation.calendarSettings.description"
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:border-border-strong">
                    <div className="space-y-1">
                      <Label
                        className="text-sm font-medium cursor-pointer"
                        htmlFor="allowStaffCancelWithoutConfirmation"
                      >
                        {t(
                          "confirmation.calendarSettings.allowCancel.label"
                        )}
                      </Label>
                      <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                        {t(
                          "confirmation.calendarSettings.allowCancel.description"
                        )}
                      </p>
                    </div>
                    <Switch
                      id="allowStaffCancelWithoutConfirmation"
                      checked={formData.allowStaffCancelWithoutConfirmation}
                      onCheckedChange={handleAllowStaffCancel}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:border-border-strong">
                    <div className="space-y-1">
                      <Label
                        className="text-sm font-medium cursor-pointer"
                        htmlFor="allowStaffRescheduleWithoutConfirmation"
                      >
                        {t(
                          "confirmation.calendarSettings.allowReschedule.label"
                        )}
                      </Label>
                      <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                        {t(
                          "confirmation.calendarSettings.allowReschedule.description"
                        )}
                      </p>
                    </div>
                    <Switch
                      id="allowStaffRescheduleWithoutConfirmation"
                      checked={formData.allowStaffRescheduleWithoutConfirmation}
                      onCheckedChange={handleAllowStaffReschedule}
                    />
                  </div>

                  <div className="space-y-3 p-3 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          className="text-sm font-medium cursor-pointer"
                          htmlFor="allowStaffBlockCalendarWithoutConfirmation"
                        >
                          {t(
                            "confirmation.calendarSettings.allowBlock.label"
                          )}
                        </Label>
                        <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                          {t(
                            "confirmation.calendarSettings.allowBlock.description"
                          )}
                        </p>
                      </div>
                        <Switch
                          id="allowStaffBlockCalendarWithoutConfirmation"
                          checked={formData.allowStaffBlockCalendarWithoutConfirmation}
                          onCheckedChange={handleAllowStaffBlock}
                        />
                    </div>

                    {formData.allowStaffBlockCalendarWithoutConfirmation && (
                      <div className="pt-3 border-t border-border space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-foreground-1">
                            {t(
                              "confirmation.calendarSettings.blockTypes.label"
                            )}
                          </h3>
                          <p className="text-[11px] text-foreground-3 dark:text-foreground-2 leading-relaxed">
                            {t(
                              "confirmation.calendarSettings.blockTypes.description"
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {STAFF_BLOCK_CALENDAR_TYPES.map((type) => (
                            <Pill
                              key={type}
                              selected={formData.staffBlockCalendarTypes.includes(type)}
                              icon={Tag}
                              className="w-auto justify-start items-center transition-none active:scale-100 min-h-0 py-2.5 px-4"
                              showCheckmark={true}
                              onClick={() => handleBlockTypeToggle(type)}
                            >
                              <span className="text-sm font-medium">
                                {t(
                                  `confirmation.calendarSettings.blockTypes.${type}`
                                )}
                              </span>
                            </Pill>
                          ))}
                        </div>

                        {formData.staffBlockCalendarTypes.length === 0 && (
                          <div className="flex items-start gap-2 pt-1">
                            <div className="relative flex h-4 w-4 shrink-0 mt-0.5">
                              <span
                                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"
                                style={{ animationDuration: "3s" }}
                              ></span>
                              <Info className="relative inline-flex h-4 w-4 text-primary" />
                            </div>
                            <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                              {t(
                                "validation.blockTypesRequired"
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Booking Override */}
            <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-3 md:p-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 dark:bg-slate-500/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    {t("adminBookingOverride.title")}
                  </h3>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    {t("adminBookingOverride.description")}
                  </p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:border-border-strong">
                  <div className="space-y-1">
                    <Label
                      className="text-sm font-medium cursor-pointer"
                      htmlFor="enforceMinAdvanceForAdmin"
                    >
                      {t("adminBookingOverride.label")}
                    </Label>
                    <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                      {t("adminBookingOverride.helper")}
                    </p>
                  </div>
                  <Switch
                    id="enforceMinAdvanceForAdmin"
                    checked={formData.enforceMinAdvanceForAdmin}
                    onCheckedChange={handleEnforceMinAdvanceForAdmin}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Communication & Messages */}
        <div className="space-y-4">
          <SectionDivider title={t("messaging.title")} />

          <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative p-3 md:p-4 space-y-6">
              <div className="space-y-1.5 px-1">
                <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                  {t("messaging.communicationMethods.title")}
                </h3>
                <div className="flex items-start gap-1.5 text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  <span>
                    {t(
                      "messaging.communicationMethods.description"
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-border bg-muted/20 hover:border-border-strong transition-colors">
                  <div className="space-y-1">
                    <Label
                      className="font-semibold text-sm cursor-pointer text-foreground-1"
                      htmlFor="emailEnabled"
                    >
                      {t(
                        "messaging.communicationMethods.email.label"
                      )}
                    </Label>
                    <p className="text-sm text-foreground-3 dark:text-foreground-2">
                      {t(
                        "messaging.communicationMethods.email.description"
                      )}
                    </p>
                  </div>
                  <Switch
                    id="emailEnabled"
                    checked={formData.emailEnabled}
                    onCheckedChange={handleEmailEnabled}
                  />
                </div>

                <div className={`flex items-center justify-between p-3 md:p-4 rounded-xl border border-border bg-muted/20 transition-colors ${isTrial ? "opacity-60" : "hover:border-border-strong"}`}>
                  <div className="space-y-1">
                    <Label
                      className={`font-semibold text-sm text-foreground-1 ${isTrial ? "cursor-not-allowed" : "cursor-pointer"}`}
                      htmlFor="smsEnabled"
                    >
                      {t(
                        "messaging.communicationMethods.sms.label"
                      )}
                    </Label>
                    <p className="text-sm text-foreground-3 dark:text-foreground-2">
                      {t(
                        "messaging.communicationMethods.sms.description"
                      )}
                    </p>
                  </div>
                  <Switch
                    id="smsEnabled"
                    checked={isTrial ? false : formData.smsEnabled}
                    onCheckedChange={handleSmsEnabled}
                    disabled={isTrial}
                  />
                </div>
              </div>

              <div className="px-1 pt-2 border-t border-border space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-info-600 dark:text-info-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t(
                      "messaging.communicationMethods.pushNotificationHelper"
                    )}
                  </p>
                </div>
                {isTrial && (
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                      {t(
                        "messaging.communicationMethods.smsTrialRestriction"
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative p-3 md:p-4 space-y-6">
              <div className="space-y-1.5 px-1">
                <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                  {t("reminders.title")}
                </h3>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    {t("reminders.sendBefore.label")}
                  </span>
                  <Switch
                    id="reminders-enabled"
                    checked={remindersEnabled}
                    onCheckedChange={handleRemindersEnabledChange}
                  />
                </div>
              </div>
              {remindersEnabled && (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {REMINDER_HOURS_OPTIONS.map((hours) => {
                    const selected = formData.reminderHoursBefore === hours;
                    return (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => handleReminderHoursBeforeChange(hours)}
                        className={`shrink-0 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                        }`}
                      >
                        {t(`reminders.hours.${hours}`)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CollapsibleFormSection>
  );
});

AdvancedSettingsSection.displayName = "AdvancedSettingsSection";
