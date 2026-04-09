import { type FC, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { FormFooter } from '../../../shared/components/forms/FormFooter';
import { Label } from '../../../shared/components/ui/label';
import { Switch } from '../../../shared/components/ui/switch';
import { Pill } from '../../../shared/components/ui/pill';
import { SliderContentDivider } from '../../../shared/components/common/SliderContentDivider';
import { SliderSectionHeader } from '../../../shared/components/forms/SliderSectionHeader';
import { Eye, Settings } from 'lucide-react';
import { selectIsTeamMember } from '../../auth/selectors';
import { getBookingSettings, getSelectedLocationId } from '../selectors';
import { AppointmentViewMode, AppointmentViewType } from '../types';
import {
  calendarPreferences,
  type TimeFormat,
  type ColorCoding,
} from '../calendarPreferences';
import { updateBookingSettingsApi } from '../../marketplace/api';
import { toast } from 'sonner';
import { fetchLocationContext } from '../actions';
import {
  AdvancedSettingsSection,
  type AdvancedSettingsSectionRef,
} from './AdvancedSettingsSection';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CalendarSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const CalendarSettingsSheet: FC<CalendarSettingsSheetProps> = ({ open, onClose }) => {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();
  const isTeamMember = useSelector(selectIsTeamMember);
  const bookingSettings = useSelector(getBookingSettings);
  const selectedLocationId = useSelector(getSelectedLocationId);

  // --- Display preferences (persisted to localStorage only on Save) ---
  const [defaultView, setDefaultView] = useState<AppointmentViewMode>(AppointmentViewMode.WEEK);
  const [defaultViewType, setDefaultViewType] = useState<AppointmentViewType>(AppointmentViewType.LIST);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');
  const [colorCoding, setColorCoding] = useState<ColorCoding>('status');
  const [showCancelled, setShowCancelled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [isAdvancedDirty, setIsAdvancedDirty] = useState(false);
  const [hasAdvancedErrors, setHasAdvancedErrors] = useState(false);
  const advancedSettingsRef = useRef<AdvancedSettingsSectionRef>(null);
  const initialDisplayPrefsRef = useRef<{
    defaultView: AppointmentViewMode;
    defaultViewType: AppointmentViewType;
    timeFormat: TimeFormat;
    colorCoding: ColorCoding;
    showCancelled: boolean;
  } | null>(null);

  // Load display preferences when sheet opens (snapshot for dirty check)
  useEffect(() => {
    if (open) {
      const prefs = calendarPreferences.getAll();
      setDefaultView(prefs.defaultViewMode);
      setDefaultViewType(prefs.defaultViewType);
      setTimeFormat(prefs.timeFormat);
      setColorCoding(prefs.colorCoding);
      setShowCancelled(prefs.showCancelled);
      initialDisplayPrefsRef.current = {
        defaultView: prefs.defaultViewMode,
        defaultViewType: prefs.defaultViewType,
        timeFormat: prefs.timeFormat,
        colorCoding: prefs.colorCoding,
        showCancelled: prefs.showCancelled,
      };
    }
  }, [open]);

  const isDisplayPrefsDirty =
    initialDisplayPrefsRef.current !== null &&
    (defaultView !== initialDisplayPrefsRef.current.defaultView ||
      defaultViewType !== initialDisplayPrefsRef.current.defaultViewType ||
      timeFormat !== initialDisplayPrefsRef.current.timeFormat ||
      colorCoding !== initialDisplayPrefsRef.current.colorCoding ||
      showCancelled !== initialDisplayPrefsRef.current.showCancelled);

  const isDirty = isTeamMember ? isDisplayPrefsDirty : (isDisplayPrefsDirty || isAdvancedDirty);

  // Display preference handlers (state only; persisted on Save)
  const handleDefaultViewChange = useCallback((mode: AppointmentViewMode) => {
    setDefaultView(mode);
  }, []);

  const handleDefaultViewTypeChange = useCallback((type: AppointmentViewType) => {
    setDefaultViewType(type);
  }, []);

  const handleTimeFormatChange = useCallback((format: TimeFormat) => {
    setTimeFormat(format);
  }, []);

  const handleColorCodingChange = useCallback((coding: ColorCoding) => {
    setColorCoding(coding);
  }, []);

  const handleShowCancelledChange = useCallback((show: boolean) => {
    setShowCancelled(show);
  }, []);

  // Save display preferences to localStorage; for owners, also persist advanced settings to backend
  const handleSave = useCallback(async () => {
    const ref = advancedSettingsRef.current;
    if (!isTeamMember && ref?.hasErrors()) return;
    setSaving(true);
    try {
      // Persist display preferences to localStorage
      calendarPreferences.setDefaultViewMode(defaultView);
      calendarPreferences.setDefaultViewType(defaultViewType);
      calendarPreferences.setTimeFormat(timeFormat);
      calendarPreferences.setColorCoding(colorCoding);
      calendarPreferences.setShowCancelled(showCancelled);
      initialDisplayPrefsRef.current = {
        defaultView,
        defaultViewType,
        timeFormat,
        colorCoding,
        showCancelled,
      };

      // Persist advanced settings to backend (owners only; team members only save display prefs)
      if (!isTeamMember && ref) {
        const payload = ref.getCurrentSettings();
        await updateBookingSettingsApi(payload);
        if (selectedLocationId) {
          dispatch(fetchLocationContext.request(selectedLocationId));
        }
      }

      toast.success(t("page.toasts.settingsSaved"));
      onClose();
    } catch {
      toast.error(t("page.toasts.settingsSaveFailed"));
    } finally {
      setSaving(false);
    }
  }, [
    isTeamMember,
    defaultView,
    defaultViewType,
    timeFormat,
    colorCoding,
    showCancelled,
    selectedLocationId,
    dispatch,
    onClose,
  ]);

  return (
    <BaseSlider
      isOpen={open}
      onClose={onClose}
      title={t("page.settings.title")}
      subtitle={t("page.settings.subtitle")}
      icon={Settings}
      iconColor="text-foreground-1"
      contentClassName="bg-surface scrollbar-hide"
      footer={
        <FormFooter
          onCancel={onClose}
          onSubmit={handleSave}
          cancelLabel={t("page.settings.cancel")}
          submitLabel={t("page.settings.save")}
          disabled={saving || !isDirty || (!isTeamMember && hasAdvancedErrors)}
          isLoading={saving}
        />
      }
    >
      <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* ─── Display Preferences ─── */}
          <div className="group relative bg-surface dark:bg-neutral-900/30 rounded-2xl border border-border hover:border-border-strong overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 dark:bg-primary/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-500" />
            <div className="relative p-3 md:p-4 space-y-6">
              <SliderSectionHeader
                title={t("page.settings.displayPreferences.title")}
                description={t("page.settings.displayPreferences.description")}
              />

              {/* Default view */}
              <div className="space-y-2">
                <Label className="text-sm">{t("page.settings.displayPreferences.defaultView.label")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("page.settings.displayPreferences.defaultView.description")}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {[
                    { value: AppointmentViewMode.DAY, label: t("page.settings.displayPreferences.defaultView.day") },
                    { value: AppointmentViewMode.WEEK, label: t("page.settings.displayPreferences.defaultView.week") },
                    { value: AppointmentViewMode.MONTH, label: t("page.settings.displayPreferences.defaultView.month") },
                  ].map((opt) => (
                    <Pill
                      key={opt.value}
                      selected={defaultView === opt.value}
                      className="w-auto justify-start items-center transition-none active:scale-100 min-h-0 py-2.5 px-4"
                      showCheckmark={true}
                      onClick={() => handleDefaultViewChange(opt.value)}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                    </Pill>
                  ))}
                </div>
              </div>

              {/* List vs Grid (day/week layout) */}
              <div className="space-y-2">
                <Label className="text-sm">{t("page.settings.displayPreferences.layout.label")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("page.settings.displayPreferences.layout.description")}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {[
                    { value: AppointmentViewType.LIST, label: t("page.settings.displayPreferences.layout.list") },
                    { value: AppointmentViewType.GRID, label: t("page.settings.displayPreferences.layout.calendarGrid") },
                  ].map((opt) => (
                    <Pill
                      key={opt.value}
                      selected={defaultViewType === opt.value}
                      className="w-auto justify-start items-center transition-none active:scale-100 min-h-0 py-2.5 px-4"
                      showCheckmark={true}
                      onClick={() => handleDefaultViewTypeChange(opt.value)}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Time format */}
              <div className="space-y-2">
                <Label className="text-sm">{t("page.settings.displayPreferences.timeFormat.label")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("page.settings.displayPreferences.timeFormat.description")}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {[
                    { value: '24h' as TimeFormat, label: t("page.settings.displayPreferences.timeFormat.24h") },
                    { value: '12h' as TimeFormat, label: t("page.settings.displayPreferences.timeFormat.12h") },
                  ].map((opt) => (
                    <Pill
                      key={opt.value}
                      selected={timeFormat === opt.value}
                      className="w-auto justify-start items-center transition-none active:scale-100 min-h-0 py-2.5 px-4"
                      showCheckmark={true}
                      onClick={() => handleTimeFormatChange(opt.value)}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Color coding */}
              <div className="space-y-2">
                <Label className="text-sm">{t("page.settings.displayPreferences.colorCoding.label")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("page.settings.displayPreferences.colorCoding.description")}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {[
                    { value: 'status' as ColorCoding, label: t("page.settings.displayPreferences.colorCoding.byStatus") },
                    { value: 'service' as ColorCoding, label: t("page.settings.displayPreferences.colorCoding.byService") },
                    { value: 'staff' as ColorCoding, label: t("page.settings.displayPreferences.colorCoding.byStaff") },
                  ].map((opt) => (
                    <Pill
                      key={opt.value}
                      selected={colorCoding === opt.value}
                      className="w-auto justify-start items-center transition-none active:scale-100 min-h-0 py-2.5 px-4"
                      showCheckmark={true}
                      onClick={() => handleColorCodingChange(opt.value)}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Show cancelled */}
              <div className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-border bg-muted/20 hover:border-border-strong transition-colors">
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Label htmlFor="show-cancelled" className="text-sm cursor-pointer">{t("page.settings.displayPreferences.showCancelled")}</Label>
                </div>
                <Switch
                  id="show-cancelled"
                  checked={showCancelled}
                  onCheckedChange={handleShowCancelledChange}
                />
              </div>
            </div>
          </div>

          {!isTeamMember && (
            <>
              <SliderContentDivider />
              {/* ─── Advanced Settings (booking rules, team, messaging) ─── */}
              {open && (
                <AdvancedSettingsSection
                  key={`adv-${selectedLocationId ?? 'none'}`}
                  initialSettings={bookingSettings ?? undefined}
                  onDirtyChange={setIsAdvancedDirty}
                  onErrorsChange={setHasAdvancedErrors}
                  ref={advancedSettingsRef}
                />
              )}
            </>
          )}
        </div>
      </div>
    </BaseSlider>
  );
};
