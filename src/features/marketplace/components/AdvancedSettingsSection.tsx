import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSelector } from "react-redux";
import { Label } from "../../../shared/components/ui/label";
import { CollapsibleFormSection } from "../../../shared/components/forms/CollapsibleFormSection";
import { Switch } from "../../../shared/components/ui/switch";
import { Pill } from "../../../shared/components/ui/pill";
import { Tag, Info } from "lucide-react";
import { DurationInput } from "../../../shared/components/forms/fields/DurationInput";
import { validateDescription } from "../../../shared/utils/validation";
import type { UpdateBookingSettingsPayload } from "../types";
import { SectionDivider } from "../../../shared/components/common/SectionDivider";
import { selectBookingSettings } from "../selectors";
import { useTranslation } from "react-i18next";

export interface AdvancedSettingsSectionRef {
  getCurrentSettings: () => UpdateBookingSettingsPayload;
  isDirty: () => boolean;
  hasErrors: () => boolean;
}

export const AdvancedSettingsSection = forwardRef<AdvancedSettingsSectionRef>(
  (_props, ref) => {
    const bookingSettings = useSelector(selectBookingSettings);
    const [isOpen, setIsOpen] = useState(true);
    const { t } = useTranslation("marketplace");

    // Local state for form
    const [formData, setFormData] = useState<UpdateBookingSettingsPayload>(
      () => ({
        minAdvanceBookingMinutes: 60,
        maxAdvanceBookingMinutes: 43200,
        slotIntervalMinutes: 15,
        bufferTimeMinutes: 15,
        cancellationWindowMinutes: 1440,
        allowCustomerCancellation: true,
        allowCustomerReschedule: true,
        autoConfirmBookings: true,
        allowStaffSelection: true,
        showAnyStaffOption: true,
        allowStaffCancelWithoutConfirmation: false,
        allowStaffRescheduleWithoutConfirmation: false,
        allowStaffBlockCalendarWithoutConfirmation: false,
        staffBlockCalendarTypes: [],
        emailEnabled: true,
        smsEnabled: false,
        cancellationPolicyMessage: null,
        bookingReminderMessage: null,
      }),
    );

    const [formErrors, setFormErrors] = useState<
      Partial<Record<keyof UpdateBookingSettingsPayload, string>>
    >({});

    // Validation for messaging fields and timing windows
    useEffect(() => {
      const errors: Partial<
        Record<keyof UpdateBookingSettingsPayload, string>
      > = {};

      // Validate timing windows - min must be less than max
      if (
        formData.minAdvanceBookingMinutes >= formData.maxAdvanceBookingMinutes
      ) {
        errors.minAdvanceBookingMinutes = t(
          "advancedSettings.validation.minAdvanceBooking",
        );
        errors.maxAdvanceBookingMinutes = t(
          "advancedSettings.validation.maxAdvanceBooking",
        );
      }

      const cancellationError = validateDescription(
        formData.cancellationPolicyMessage ?? "",
        1000,
      );
      if (cancellationError) {
        errors.cancellationPolicyMessage = cancellationError;
      }

      const reminderError = validateDescription(
        formData.bookingReminderMessage ?? "",
        1000,
      );
      if (reminderError) {
        errors.bookingReminderMessage = reminderError;
      }

      // Validate block calendar types - if blocking is enabled, at least one type must be selected
      if (
        formData.allowStaffBlockCalendarWithoutConfirmation &&
        (!formData.staffBlockCalendarTypes ||
          formData.staffBlockCalendarTypes.length === 0)
      ) {
        errors.staffBlockCalendarTypes = t(
          "advancedSettings.validation.blockTypesRequired",
        );
      }

      setFormErrors(errors);
    }, [
      formData.cancellationPolicyMessage,
      formData.bookingReminderMessage,
      formData.minAdvanceBookingMinutes,
      formData.maxAdvanceBookingMinutes,
      formData.allowStaffBlockCalendarWithoutConfirmation,
      formData.staffBlockCalendarTypes,
      t,
    ]);

    // Sync local state when Redux data changes
    useEffect(() => {
      if (bookingSettings) {
        setFormData({
          minAdvanceBookingMinutes:
            bookingSettings.minAdvanceBookingMinutes ?? 60,
          maxAdvanceBookingMinutes:
            bookingSettings.maxAdvanceBookingMinutes ?? 43200,
          slotIntervalMinutes: bookingSettings.slotIntervalMinutes ?? 15,
          bufferTimeMinutes: bookingSettings.bufferTimeMinutes ?? 15,
          cancellationWindowMinutes:
            bookingSettings.cancellationWindowMinutes ?? 1440,
          allowCustomerCancellation:
            bookingSettings.allowCustomerCancellation ?? true,
          allowCustomerReschedule:
            bookingSettings.allowCustomerReschedule ?? true,
          autoConfirmBookings: bookingSettings.autoConfirmBookings ?? true,
          allowStaffSelection: bookingSettings.allowStaffSelection ?? true,
          showAnyStaffOption: bookingSettings.showAnyStaffOption ?? true,
          allowStaffCancelWithoutConfirmation:
            bookingSettings.allowStaffCancelWithoutConfirmation ?? false,
          allowStaffRescheduleWithoutConfirmation:
            bookingSettings.allowStaffRescheduleWithoutConfirmation ?? false,
          allowStaffBlockCalendarWithoutConfirmation:
            bookingSettings.allowStaffBlockCalendarWithoutConfirmation ?? false,
          staffBlockCalendarTypes:
            bookingSettings.staffBlockCalendarTypes ?? [],
          emailEnabled: bookingSettings.emailEnabled ?? true,
          smsEnabled: bookingSettings.smsEnabled ?? false,
          cancellationPolicyMessage:
            bookingSettings.cancellationPolicyMessage ?? null,
          bookingReminderMessage:
            bookingSettings.bookingReminderMessage ?? null,
        });
      }
    }, [bookingSettings]);

    // Update field helper
    const updateField = <K extends keyof UpdateBookingSettingsPayload>(
      field: K,
      value: UpdateBookingSettingsPayload[K],
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        getCurrentSettings: () => formData,
        isDirty: () => {
          if (!bookingSettings) return false;
          return (
            JSON.stringify(formData) !==
            JSON.stringify({
              minAdvanceBookingMinutes:
                bookingSettings.minAdvanceBookingMinutes ?? 60,
              maxAdvanceBookingMinutes:
                bookingSettings.maxAdvanceBookingMinutes ?? 43200,
              slotIntervalMinutes: bookingSettings.slotIntervalMinutes ?? 15,
              bufferTimeMinutes: bookingSettings.bufferTimeMinutes ?? 15,
              cancellationWindowMinutes:
                bookingSettings.cancellationWindowMinutes ?? 1440,
              allowCustomerCancellation:
                bookingSettings.allowCustomerCancellation ?? true,
              allowCustomerReschedule:
                bookingSettings.allowCustomerReschedule ?? true,
              autoConfirmBookings: bookingSettings.autoConfirmBookings ?? true,
              allowStaffSelection: bookingSettings.allowStaffSelection ?? true,
              showAnyStaffOption: bookingSettings.showAnyStaffOption ?? true,
              allowStaffCancelWithoutConfirmation:
                bookingSettings.allowStaffCancelWithoutConfirmation ?? false,
              allowStaffRescheduleWithoutConfirmation:
                bookingSettings.allowStaffRescheduleWithoutConfirmation ??
                false,
              allowStaffBlockCalendarWithoutConfirmation:
                bookingSettings.allowStaffBlockCalendarWithoutConfirmation ??
                false,
              staffBlockCalendarTypes:
                bookingSettings.staffBlockCalendarTypes ?? [],
              emailEnabled: bookingSettings.emailEnabled ?? true,
              smsEnabled: bookingSettings.smsEnabled ?? false,
              cancellationPolicyMessage:
                bookingSettings.cancellationPolicyMessage ?? null,
              bookingReminderMessage:
                bookingSettings.bookingReminderMessage ?? null,
            })
          );
        },
        hasErrors: () => {
          return Object.keys(formErrors).length > 0;
        },
      }),
      [formData, bookingSettings, formErrors],
    );

    // Helper to convert minutes to human-readable format
    const formatMinutes = (minutes: number): string => {
      if (minutes === 0) return t("advancedSettings.timing.none");
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
        title={t("advancedSettings.title")}
        description={t("advancedSettings.description")}
        open={isOpen}
        onOpenChange={setIsOpen}
        className="mt-6 border border-border p-3 md:p-4 rounded-2xl bg-surface md:bg-transparent"
      >
        <div className="space-y-10 pt-0">
          {/* Timing Settings */}
          <div className="space-y-4">
            <SectionDivider title={t("advancedSettings.timing.title")} />
            <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-info/5 dark:bg-info/20 rounded-full translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative p-3 md:p-4 space-y-6">
                <div className="space-y-1.5 px-1">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    {t("advancedSettings.timing.bookingWindows.title")}
                  </h3>
                  <div className="flex items-start gap-1.5 text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    <span>
                      {t("advancedSettings.timing.bookingWindows.description")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                  <DurationInput
                    id="minAdvanceBooking"
                    label={t("advancedSettings.timing.minAdvanceBooking.label")}
                    helpText={t(
                      "advancedSettings.timing.minAdvanceBooking.helpText",
                    )}
                    value={formData.minAdvanceBookingMinutes}
                    onChange={(val) =>
                      updateField("minAdvanceBookingMinutes", val)
                    }
                    quickActions={[0, 15, 30, 60, "other"]}
                    getChipLabel={formatMinutes}
                    className="border-b md:border-b-0 md:border-r border-border pb-8 md:pb-0 md:pr-8"
                    error={formErrors.minAdvanceBookingMinutes}
                  />

                  <DurationInput
                    id="maxAdvanceBooking"
                    label={t("advancedSettings.timing.maxAdvanceBooking.label")}
                    helpText={t(
                      "advancedSettings.timing.maxAdvanceBooking.helpText",
                    )}
                    value={formData.maxAdvanceBookingMinutes}
                    onChange={(val) =>
                      updateField("maxAdvanceBookingMinutes", val)
                    }
                    quickActions={[0, 10080, 43200, 86400, "other"]}
                    unit="days"
                    getChipLabel={(mins) =>
                      mins === 0
                        ? t("advancedSettings.timing.none")
                        : `${Math.round(mins / 1440)}d`
                    }
                    error={formErrors.maxAdvanceBookingMinutes}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border">
                  <DurationInput
                    id="bufferTime"
                    label={t("advancedSettings.timing.bufferTime.label")}
                    helpText={t("advancedSettings.timing.bufferTime.helpText")}
                    value={formData.bufferTimeMinutes}
                    onChange={(val) => updateField("bufferTimeMinutes", val)}
                    quickActions={[0, 5, 15, 30, "other"]}
                    getChipLabel={(mins) =>
                      mins === 0
                        ? t("advancedSettings.timing.none")
                        : `${mins}m`
                    }
                    compactLayout={false}
                    className="md:border-r md:border-border md:pr-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation & Rescheduling */}
          <div className="space-y-4">
            <SectionDivider title={t("advancedSettings.policy.title")} />
            <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 dark:bg-purple-500/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative p-3 md:p-4 space-y-6">
                <div className="space-y-1.5 px-1">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    {t("advancedSettings.policy.cancellationPolicy.title")}
                  </h3>
                  <div className="flex items-start gap-1.5 text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    <span>
                      {t(
                        "advancedSettings.policy.cancellationPolicy.description",
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <DurationInput
                    id="cancellationWindow"
                    label={t(
                      "advancedSettings.policy.cancellationWindow.label",
                    )}
                    helpText={t(
                      "advancedSettings.policy.cancellationWindow.helpText",
                    )}
                    value={formData.cancellationWindowMinutes}
                    onChange={(val) =>
                      updateField("cancellationWindowMinutes", val)
                    }
                    quickActions={[0, 60, 1440, 10080, "other"]}
                    getChipLabel={formatMinutes}
                    unit="hours"
                    className="border-b md:border-b-0 md:border-r border-border pb-8 md:pb-0 md:pr-8"
                    disabled={!formData.allowCustomerCancellation}
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
                              "advancedSettings.policy.allowCancellation.label",
                            )}
                          </Label>
                        </div>
                        <p className="text-sm text-foreground-3 dark:text-foreground-2">
                          {t(
                            "advancedSettings.policy.allowCancellation.description",
                          )}
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

                    <div className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-border bg-muted/20 hover:border-border-strong transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            className="font-semibold text-sm cursor-pointer text-foreground-1"
                            htmlFor="allowCustomerReschedule"
                          >
                            {t(
                              "advancedSettings.policy.allowRescheduling.label",
                            )}
                          </Label>
                        </div>
                        <p className="text-sm text-foreground-3 dark:text-foreground-2">
                          {t(
                            "advancedSettings.policy.allowRescheduling.description",
                          )}
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

          {/* Confirmation & Staff */}
          <div className="space-y-4">
            <SectionDivider title={t("advancedSettings.confirmation.title")} />
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-3 md:p-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 dark:bg-green-500/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
                <div className="relative space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                      {t(
                        "advancedSettings.confirmation.bookingConfirmation.title",
                      )}
                    </h3>
                    <p className="text-sm text-foreground-3 dark:text-foreground-2">
                      {t(
                        "advancedSettings.confirmation.bookingConfirmation.description",
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
                          "advancedSettings.confirmation.bookingApproval.label",
                        )}
                      </Label>
                      <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                        {formData.autoConfirmBookings
                          ? t(
                              "advancedSettings.confirmation.bookingApproval.autoConfirm",
                            )
                          : t(
                              "advancedSettings.confirmation.bookingApproval.manualConfirm",
                            )}
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

              <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-3 md:p-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 dark:bg-orange-500/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
                <div className="relative space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                      {t("advancedSettings.confirmation.staffSelection.title")}
                    </h3>
                    <p className="text-sm text-foreground-3 dark:text-foreground-2">
                      {t(
                        "advancedSettings.confirmation.staffSelection.description",
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
                            "advancedSettings.confirmation.allowStaffSelection.label",
                          )}
                        </Label>
                        <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                          {t(
                            "advancedSettings.confirmation.allowStaffSelection.description",
                          )}
                        </p>
                      </div>
                      <Switch
                        id="allowStaffSelection"
                        checked={formData.allowStaffSelection}
                        onCheckedChange={(checked) =>
                          updateField("allowStaffSelection", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:border-border-strong">
                      <div className="space-y-1">
                        <Label
                          className="text-sm font-medium cursor-pointer"
                          htmlFor="showAnyStaffOption"
                        >
                          {t(
                            "advancedSettings.confirmation.showAnyStaffOption.label",
                          )}
                        </Label>
                        <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                          {t(
                            "advancedSettings.confirmation.showAnyStaffOption.description",
                          )}
                        </p>
                      </div>
                      <Switch
                        id="showAnyStaffOption"
                        checked={formData.showAnyStaffOption}
                        onCheckedChange={(checked) =>
                          updateField("showAnyStaffOption", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Settings */}
              <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm p-3 md:p-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 dark:bg-purple-500/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
                <div className="relative space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                      {t(
                        "advancedSettings.confirmation.calendarSettings.title",
                      )}
                    </h3>
                    <p className="text-sm text-foreground-3 dark:text-foreground-2">
                      {t(
                        "advancedSettings.confirmation.calendarSettings.description",
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
                            "advancedSettings.confirmation.calendarSettings.allowCancel.label",
                          )}
                        </Label>
                        <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                          {t(
                            "advancedSettings.confirmation.calendarSettings.allowCancel.description",
                          )}
                        </p>
                      </div>
                      <Switch
                        id="allowStaffCancelWithoutConfirmation"
                        checked={formData.allowStaffCancelWithoutConfirmation}
                        onCheckedChange={(checked) =>
                          updateField(
                            "allowStaffCancelWithoutConfirmation",
                            checked,
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:border-border-strong">
                      <div className="space-y-1">
                        <Label
                          className="text-sm font-medium cursor-pointer"
                          htmlFor="allowStaffRescheduleWithoutConfirmation"
                        >
                          {t(
                            "advancedSettings.confirmation.calendarSettings.allowReschedule.label",
                          )}
                        </Label>
                        <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                          {t(
                            "advancedSettings.confirmation.calendarSettings.allowReschedule.description",
                          )}
                        </p>
                      </div>
                      <Switch
                        id="allowStaffRescheduleWithoutConfirmation"
                        checked={
                          formData.allowStaffRescheduleWithoutConfirmation
                        }
                        onCheckedChange={(checked) =>
                          updateField(
                            "allowStaffRescheduleWithoutConfirmation",
                            checked,
                          )
                        }
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
                              "advancedSettings.confirmation.calendarSettings.allowBlock.label",
                            )}
                          </Label>
                          <p className="text-[11px] text-foreground-3 dark:text-foreground-2">
                            {t(
                              "advancedSettings.confirmation.calendarSettings.allowBlock.description",
                            )}
                          </p>
                        </div>
                        <Switch
                          id="allowStaffBlockCalendarWithoutConfirmation"
                          checked={
                            formData.allowStaffBlockCalendarWithoutConfirmation
                          }
                          onCheckedChange={(checked) =>
                            updateField(
                              "allowStaffBlockCalendarWithoutConfirmation",
                              checked,
                            )
                          }
                        />
                      </div>

                      {formData.allowStaffBlockCalendarWithoutConfirmation && (
                        <div className="pt-3 border-t border-border space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium text-foreground-1">
                              {t(
                                "advancedSettings.confirmation.calendarSettings.blockTypes.label",
                              )}
                            </h3>
                            <p className="text-[11px] text-foreground-3 dark:text-foreground-2 leading-relaxed">
                              {t(
                                "advancedSettings.confirmation.calendarSettings.blockTypes.description",
                              )}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {["holidays", "timeOff", "sickDays"].map((type) => {
                              const isSelected =
                                formData.staffBlockCalendarTypes.includes(type);
                              return (
                                <Pill
                                  key={type}
                                  selected={isSelected}
                                  icon={Tag}
                                  className="w-auto justify-start items-center transition-none active:scale-100 min-h-0 py-2.5 px-4"
                                  showCheckmark={true}
                                  onClick={() => {
                                    const currentTypes =
                                      formData.staffBlockCalendarTypes || [];
                                    if (isSelected) {
                                      updateField(
                                        "staffBlockCalendarTypes",
                                        currentTypes.filter((t) => t !== type),
                                      );
                                    } else {
                                      updateField("staffBlockCalendarTypes", [
                                        ...currentTypes,
                                        type,
                                      ]);
                                    }
                                  }}
                                >
                                  <span className="text-sm font-medium">
                                    {t(
                                      `advancedSettings.confirmation.calendarSettings.blockTypes.${type}`,
                                    )}
                                  </span>
                                </Pill>
                              );
                            })}
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
                                  "advancedSettings.validation.blockTypesRequired",
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
            </div>
          </div>

          {/* Communication & Messages */}
          <div className="space-y-4">
            <SectionDivider title={t("advancedSettings.messaging.title")} />

            {/* Communication Methods */}
            <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="relative p-3 md:p-4 space-y-6">
                <div className="space-y-1.5 px-1">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    {t("advancedSettings.messaging.communicationMethods.title")}
                  </h3>
                  <div className="flex items-start gap-1.5 text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    <span>
                      {t(
                        "advancedSettings.messaging.communicationMethods.description",
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
                          "advancedSettings.messaging.communicationMethods.email.label",
                        )}
                      </Label>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2">
                        {t(
                          "advancedSettings.messaging.communicationMethods.email.description",
                        )}
                      </p>
                    </div>
                    <Switch
                      id="emailEnabled"
                      checked={formData.emailEnabled}
                      onCheckedChange={(checked) =>
                        updateField("emailEnabled", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-border bg-muted/20 hover:border-border-strong transition-colors">
                    <div className="space-y-1">
                      <Label
                        className="font-semibold text-sm cursor-pointer text-foreground-1"
                        htmlFor="smsEnabled"
                      >
                        {t(
                          "advancedSettings.messaging.communicationMethods.sms.label",
                        )}
                      </Label>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2">
                        {t(
                          "advancedSettings.messaging.communicationMethods.sms.description",
                        )}
                      </p>
                    </div>
                    <Switch
                      id="smsEnabled"
                      checked={formData.smsEnabled}
                      onCheckedChange={(checked) =>
                        updateField("smsEnabled", checked)
                      }
                    />
                  </div>
                </div>

                <div className="px-1 pt-2 border-t border-border">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-info-600 dark:text-info-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                      {t(
                        "advancedSettings.messaging.communicationMethods.pushNotificationHelper",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Messages */}
            {/* Commented out - will be moved to another flow later */}
            {/* <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong transition-all duration-300 shadow-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative p-3 md:p-4 space-y-8">
                <div className="space-y-1.5 px-1">
                  <h3 className="text-base font-semibold text-foreground-1 flex items-center gap-2">
                    {t("advancedSettings.messaging.customMessages.title")}
                  </h3>
                  <div className="flex items-start gap-1.5 text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                    <span>
                      {t("advancedSettings.messaging.customMessages.description")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 px-1">
                  <TextareaField
                    id="cancellationPolicy"
                    label={t("advancedSettings.messaging.cancellationPolicy.label")}
                    helperText={t("advancedSettings.messaging.cancellationPolicy.helperText")}
                    placeholder={t("advancedSettings.messaging.cancellationPolicy.placeholder")}
                    value={formData.cancellationPolicyMessage ?? ""}
                    onChange={(val) =>
                      updateField("cancellationPolicyMessage", val || null)
                    }
                    rows={6}
                    maxLength={1000}
                    className="bg-white/50 dark:bg-transparent"
                    error={formErrors.cancellationPolicyMessage}
                  />

                  <TextareaField
                    id="reminderMessage"
                    label={t("advancedSettings.messaging.reminderMessage.label")}
                    helperText={t("advancedSettings.messaging.reminderMessage.helperText")}
                    placeholder={t("advancedSettings.messaging.reminderMessage.placeholder")}
                    value={formData.bookingReminderMessage ?? ""}
                    onChange={(val) =>
                      updateField("bookingReminderMessage", val || null)
                    }
                    rows={6}
                    maxLength={1000}
                    className="bg-white/50 dark:bg-transparent"
                    error={formErrors.bookingReminderMessage}
                  />
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </CollapsibleFormSection>
    );
  },
);

AdvancedSettingsSection.displayName = "AdvancedSettingsSection";
