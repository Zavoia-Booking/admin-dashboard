import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { MousePointerClick, Link2 } from "lucide-react";
import TextField from "../../../../shared/components/forms/fields/TextField";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";
import DatePicker from "../../../../shared/components/ui/date-picker";
import { Label } from "../../../../shared/components/ui/label";
import { Switch } from "../../../../shared/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
} from "../../../../shared/components/ui/collapsible";
import { getCurrentBusinessSelector } from "../../../business/selectors";
import {
  localCalendarDateFromDateKey,
  minSelectableCalendarDateForTimezone,
  laterCalendarWallDate,
} from "../../../calendar/timezone";
import {
  hasUnsafeWebsiteCopyCharacters,
  validateUrlField,
  validateWebsiteCopy,
} from "../../../../shared/utils/validation";
import { cn } from "../../../../shared/lib/utils";
import { AutoHeight } from "./AutoHeight";
import { InfoHint } from "./InfoHint";
import {
  ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
  ANNOUNCEMENT_DETAILS_MAX_LENGTH,
  ANNOUNCEMENT_MESSAGE_MAX_LENGTH,
} from "./announcementConstraints";
import type { AnnouncementContent, AnnouncementConfig, AnnouncementCta, AnnouncementTone } from "../../types";
import {
  isValidAnnouncementDateKey,
  isValidAnnouncementTimeZone,
  type WebsiteDraftIssue,
} from "./draftValidation";

const MAX_URL = 300;

const GROUP_LABEL = "text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3";
const TONES = ["neutral", "offer"] as const;

interface AnnouncementEditorProps {
  value: AnnouncementContent;
  onChange: (value: AnnouncementContent) => void;
  /** Section `config` — holds the tone (the layout is the section variant). */
  config: AnnouncementConfig;
  onConfigChange: (patch: Partial<AnnouncementConfig>) => void;
  locale: "en" | "ro";
  /** True when the announcement section is visible → show a readiness hint when its message is empty. */
  required?: boolean;
  canWrite?: boolean;
  /** Atelier renders inside a fixed 332px rail, so viewport breakpoints must not create two columns. */
  variant?: "default" | "atelier";
  blockingIssues?: WebsiteDraftIssue[];
}

/** A picker `Date` (local midnight) → the stored `YYYY-MM-DD` calendar key. */
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Bilingual message + a configurable call-to-action, plus its show/hide schedule. Scheduling is captured
 * here for future delivery; this editor's preview always shows the bar so it stays editable. Reuses the
 * app's validated TextField, DatePicker and a native
 * radio list so it matches the rest of the dashboard.
 */
export function AnnouncementEditor({
  value,
  onChange,
  config,
  onConfigChange,
  locale,
  required,
  canWrite = true,
  variant = "default",
  blockingIssues = [],
}: AnnouncementEditorProps) {
  const { t } = useTranslation(["website", "common"]);
  const [blurred, setBlurred] = useState({ message: false, details: false, ctaLabel: false });
  // Legacy/unknown emphasis values render as the design source's neutral treatment.
  const tone: AnnouncementTone = config.tone === "offer" ? "offer" : "neutral";

  // A shown announcement needs a message in either language (mirrors the bar self-hiding when blank).
  const messageMissing =
    !!required && (value.message.en?.trim() ?? "") === "" && (value.message.ro?.trim() ?? "") === "";
  const storedBusinessTimezone = useSelector(getCurrentBusinessSelector)?.timezone?.trim() || "UTC";
  const businessTimezone = isValidAnnouncementTimeZone(storedBusinessTimezone)
    ? storedBusinessTimezone
    : "UTC";
  // Once a schedule exists, its saved IANA zone is the contract for both the date controls and
  // countdown. Falling back is only for a new/legacy schedule without a stored zone.
  const storedScheduleTimezone = value.schedule?.timezone?.trim();
  const timezone = storedScheduleTimezone && isValidAnnouncementTimeZone(storedScheduleTimezone)
    ? storedScheduleTimezone
    : businessTimezone;
  // Today in the announcement timezone; past days are disabled in both pickers.
  const today = useMemo(
    () => minSelectableCalendarDateForTimezone(new Date(), timezone),
    [timezone],
  );

  const cta = value.cta;
  const details = value.details ?? { en: "", ro: "" };
  const issueFor = (controlId: string) => blockingIssues.find(
    (issue) => issue.controlId === controlId && (!issue.locale || issue.locale === locale),
  )?.message;
  const patchCta = (patch: Partial<AnnouncementCta>) =>
    onChange({ ...value, cta: { ...cta, ...patch } });

  // The link only makes sense once the button has text — lock the URL until then. The shape
  // check, however, follows the save rule: any non-empty URL must be valid http(s) even while
  // the button is disabled or label-less (the collapsed blocks below force themselves open so
  // a stale invalid URL is always visible and fixable).
  const hasAnyButtonText = cta.label.en.trim() !== "" || cta.label.ro.trim() !== "";
  const ctaLabelMissing = !!required && cta.enabled && !hasAnyButtonText;
  const ctaLabelExternalError = issueFor("announcement-cta-label");
  const ctaUrlExternalError = issueFor("announcement-cta-url");
  const urlError = ctaUrlExternalError ?? (
    cta.url.trim() !== "" ? validateUrlField(cta.url, t) ?? undefined : undefined
  );
  // A visible, enabled button with text still needs a destination before publishing. This is
  // guidance rather than a save-blocking field error, so an unfinished draft remains saveable.
  const urlMissing = !!required && cta.enabled && hasAnyButtonText && cta.url.trim() === "";
  const showCtaPlacementNote =
    details[locale].trim() !== "" &&
    cta.enabled &&
    cta.label[locale].trim() !== "" &&
    cta.url.trim() !== "" &&
    !urlError;
  const messageValidation = validateWebsiteCopy(value.message[locale], t, {
    fieldLabel: t("businessPage.builder.announcement.messageLabel"),
    maxLength: ANNOUNCEMENT_MESSAGE_MAX_LENGTH,
  });
  const detailsValidation = validateWebsiteCopy(details[locale], t, {
    fieldLabel: t("businessPage.builder.announcement.detailsLabel"),
    maxLength: ANNOUNCEMENT_DETAILS_MAX_LENGTH,
  });
  const ctaLabelValidation = validateWebsiteCopy(cta.label[locale], t, {
    fieldLabel: t("businessPage.builder.announcement.cta.labelLabel"),
    maxLength: ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH,
  });
  const messageError = issueFor("announcement-message") ?? (
    blurred.message ||
    value.message[locale].length > ANNOUNCEMENT_MESSAGE_MAX_LENGTH ||
    hasUnsafeWebsiteCopyCharacters(value.message[locale])
      ? messageValidation ?? undefined
      : undefined
  );
  const detailsError = issueFor("announcement-details") ?? (
    blurred.details ||
    details[locale].length > ANNOUNCEMENT_DETAILS_MAX_LENGTH ||
    hasUnsafeWebsiteCopyCharacters(details[locale])
      ? detailsValidation ?? undefined
      : undefined
  );
  const ctaLabelError = ctaLabelExternalError ?? (
    blurred.ctaLabel ||
    cta.label[locale].length > ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH ||
    hasUnsafeWebsiteCopyCharacters(cta.label[locale])
      ? ctaLabelValidation ?? undefined
      : undefined
  );

  const startKey = value.schedule?.start ?? null;
  const endKey = value.schedule?.end ?? null;
  const showCountdown = value.schedule?.showCountdown !== false;
  const startDate = startKey && isValidAnnouncementDateKey(startKey)
    ? localCalendarDateFromDateKey(startKey)
    : null;
  const endDate = endKey && isValidAnnouncementDateKey(endKey)
    ? localCalendarDateFromDateKey(endKey)
    : null;

  const updateSchedule = (field: "start" | "end", key: string) => {
    onChange({
      ...value,
      schedule: {
        start: field === "start" ? key : startKey,
        end: field === "end" ? key : endKey,
        timezone,
        showCountdown,
      },
    });
  };

  // Scheduling is opt-in: null is the default/off state. Once enabled, the draft validator requires
  // both dates before saving; the partial object exists only so the owner can fill the two controls.
  const scheduleOn = value.schedule != null;
  const scheduleDatesMissing = scheduleOn && (!startKey || !endKey);
  const scheduleOrderInvalid = !!startKey && !!endKey && startKey > endKey;
  const scheduleError = issueFor("announcement-schedule");
  const setScheduleOn = (on: boolean) =>
    onChange({
      ...value,
      schedule: on ? { start: startKey, end: endKey, timezone, showCountdown } : null,
    });

  const setShowCountdown = (enabled: boolean) => {
    if (!value.schedule) return;
    onChange({
      ...value,
      schedule: { ...value.schedule, timezone, showCountdown: enabled },
    });
  };

  return (
    <div className="space-y-5">
      {/* Message */}
      <TextareaField
        id="announcement-message"
        label={t("businessPage.builder.announcement.messageLabel")}
        placeholder={t("businessPage.builder.announcement.messagePlaceholder")}
        value={value.message[locale]}
        onChange={(v) => onChange({ ...value, message: { ...value.message, [locale]: v } })}
        onBlur={() => {
          const normalized = value.message[locale].trim();
          if (normalized !== value.message[locale]) {
            onChange({ ...value, message: { ...value.message, [locale]: normalized } });
          }
          setBlurred((current) => ({ ...current, message: true }));
        }}
        error={messageError}
        maxLength={ANNOUNCEMENT_MESSAGE_MAX_LENGTH}
        rows={3}
        showCharacterCount
        className="!pt-0"
        textareaClassName="!h-auto min-h-20"
        helperText={t("businessPage.builder.announcement.messageHint")}
        hint={
          messageMissing ? (
            <InfoHint>{t("businessPage.builder.announcement.messageRequiredHint")}</InfoHint>
          ) : undefined
        }
      />

      <TextareaField
        id="announcement-details"
        label={t("businessPage.builder.announcement.detailsLabel")}
        labelMeta={(
          <span className="text-xs font-normal text-foreground-3">
            {t("businessPage.builder.announcement.optional")}
          </span>
        )}
        placeholder={t("businessPage.builder.announcement.detailsPlaceholder")}
        helperText={t("businessPage.builder.announcement.detailsHint")}
        value={details[locale]}
        onChange={(v) => onChange({ ...value, details: { ...details, [locale]: v } })}
        onBlur={() => {
          const normalized = details[locale].trim();
          if (normalized !== details[locale]) {
            onChange({ ...value, details: { ...details, [locale]: normalized } });
          }
          setBlurred((current) => ({ ...current, details: true }));
        }}
        error={detailsError}
        maxLength={ANNOUNCEMENT_DETAILS_MAX_LENGTH}
        rows={5}
        showCharacterCount
        className="!pt-0"
        textareaClassName="!h-auto min-h-28"
      />

      {/* Tone is an independent design axis shared by all three layouts. */}
      <div className="border-t border-border pt-4">
        <span className={GROUP_LABEL}>{t("businessPage.builder.announcement.tone.title")}</span>
        <p className="mt-1 text-[12px] leading-5 text-foreground-3">
          {t("businessPage.builder.announcement.tone.hint")}
        </p>
        <div
          role="radiogroup"
          aria-label={t("businessPage.builder.announcement.tone.title")}
          className="mt-3 inline-flex rounded-lg bg-surface-hover p-0.5"
        >
          {TONES.map((opt) => {
            const active = tone === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!canWrite}
                onClick={() => onConfigChange({ tone: opt })}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12.5px] font-medium outline-none transition-[color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:ring-2 focus-visible:ring-ring/50",
                  canWrite ? "cursor-pointer active:scale-[0.97]" : "cursor-not-allowed opacity-60",
                  active
                    ? "bg-surface text-primary-700 shadow-sm dark:text-primary-400"
                    : "text-foreground-3 hover:text-foreground-2",
                )}
              >
                {t(`businessPage.builder.announcement.tone.${opt}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Call to action — opt-in; the whole block expands when the owner turns the button on. */}
      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={GROUP_LABEL}>{t("businessPage.builder.announcement.cta.title")}</span>
            <p className="mt-1 text-[12px] leading-5 text-foreground-3">
              {t("businessPage.builder.announcement.cta.enableHint")}
            </p>
          </div>
          <Switch
            aria-label={t("businessPage.builder.announcement.cta.enableLabel")}
            checked={cta.enabled}
            onCheckedChange={(v) => patchCta({ enabled: v })}
          />
        </div>

        <Collapsible
          open={cta.enabled || !!urlError || !!ctaLabelExternalError}
          onOpenChange={(v) => patchCta({ enabled: v })}
        >
          <CollapsibleContent>
            <AutoHeight className="space-y-3 pt-3">
              <div>
                <TextField
                  id="announcement-cta-label"
                  label={t("businessPage.builder.announcement.cta.labelLabel")}
                  required={cta.enabled}
                  placeholder={t("businessPage.builder.announcement.cta.labelPlaceholder")}
                  value={cta.label[locale]}
                  onChange={(v) => patchCta({ label: { ...cta.label, [locale]: v } })}
                  onBlur={() => {
                    const normalized = cta.label[locale].trim();
                    if (normalized !== cta.label[locale]) {
                      patchCta({ label: { ...cta.label, [locale]: normalized } });
                    }
                    setBlurred((current) => ({ ...current, ctaLabel: true }));
                  }}
                  error={ctaLabelError}
                  hint={ctaLabelMissing ? (
                    <InfoHint>{t("businessPage.builder.announcement.cta.labelRequiredHint")}</InfoHint>
                  ) : undefined}
                  icon={MousePointerClick}
                  maxLength={ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH}
                  className="!pt-0"
                />
                <div className="-mt-1 flex items-start justify-between gap-3 text-[11px] text-foreground-3">
                  <p>{t("businessPage.builder.announcement.cta.labelHint")}</p>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums",
                      cta.label[locale].length > ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH &&
                        "text-destructive",
                    )}
                  >
                    {cta.label[locale].length}/{ANNOUNCEMENT_CTA_LABEL_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* Link + button options reveal once the button has text — same accordion animation.
                  An invalid stored URL keeps the block open so it can't hide a save blocker. */}
              <Collapsible open={hasAnyButtonText || !!urlError}>
                <CollapsibleContent>
                  <AutoHeight className="space-y-3">
                    <TextField
                      id="announcement-cta-url"
                      label={t("businessPage.builder.announcement.cta.urlLabel")}
                      placeholder="https://…"
                      value={cta.url}
                      onChange={(v) => patchCta({ url: v })}
                      error={urlError}
                      icon={Link2}
                      maxLength={MAX_URL}
                      className="!pt-0"
                      // Publish-readiness guidance: incomplete work can still be saved as a draft.
                      hint={
                        urlMissing ? (
                          <InfoHint>{t("businessPage.builder.announcement.cta.urlRequiredHint")}</InfoHint>
                        ) : undefined
                      }
                    />

                    {showCtaPlacementNote ? (
                      <div
                        role="note"
                        className="rounded-lg border border-border bg-surface-hover/45 px-3 py-2.5"
                      >
                        <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-foreground-3">
                          {t("businessPage.builder.announcement.cta.placementEyebrow")}
                        </p>
                        <p className="mt-1 text-[11.5px] leading-[1.55] text-foreground-3">
                          {t("businessPage.builder.announcement.cta.placementNote")}
                        </p>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground-1">
                        {t("businessPage.builder.announcement.cta.newTab")}
                      </span>
                      <Switch
                        aria-label={t("businessPage.builder.announcement.cta.newTab")}
                        checked={cta.newTab}
                        onCheckedChange={(v) => patchCta({ newTab: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground-1">
                        {t("businessPage.builder.announcement.cta.showArrow")}
                      </span>
                      <Switch
                        aria-label={t("businessPage.builder.announcement.cta.showArrow")}
                        checked={cta.showArrow}
                        onCheckedChange={(v) => patchCta({ showArrow: v })}
                      />
                    </div>
                  </AutoHeight>
                </CollapsibleContent>
              </Collapsible>
            </AutoHeight>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Scheduling — opt-in; expands to the date window when turned on. */}
      <div
        id="announcement-schedule"
        tabIndex={-1}
        aria-invalid={!!scheduleError}
        aria-describedby={scheduleError ? "announcement-schedule-error" : undefined}
        className="space-y-3 border-t border-border pt-4 outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={GROUP_LABEL}>{t("businessPage.builder.announcement.schedule.title")}</span>
            <p className="mt-1 text-[12px] leading-5 text-foreground-3">
              {t("businessPage.builder.announcement.schedule.hint")}
            </p>
          </div>
          <Switch
            aria-label={t("businessPage.builder.announcement.schedule.enableLabel")}
            checked={scheduleOn}
            onCheckedChange={setScheduleOn}
          />
        </div>

        <Collapsible open={scheduleOn} onOpenChange={setScheduleOn}>
          <CollapsibleContent>
            <div className="space-y-3 pt-3">
              <div className={cn("grid grid-cols-1 gap-3", variant !== "atelier" && "sm:grid-cols-2")}>
                <div className="space-y-2">
                  <Label htmlFor="announcement-schedule-start">
                    {t("businessPage.builder.announcement.schedule.start")}
                    <span className="ml-1 text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <DatePicker
                    triggerId="announcement-schedule-start"
                    value={startDate}
                    onChange={(d) => updateSchedule("start", toDateKey(d))}
                    minDate={today}
                    maxDate={endDate ?? undefined}
                    placeholder={t("businessPage.builder.announcement.schedule.datePlaceholder")}
                    invalid={!!(scheduleError || scheduleOrderInvalid || (scheduleOn && !startKey))}
                    describedBy={scheduleError ? "announcement-schedule-error" : undefined}
                    className={cn(
                      (scheduleError || scheduleOrderInvalid || (scheduleOn && !startKey)) &&
                        "border-destructive",
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="announcement-schedule-end">
                    {t("businessPage.builder.announcement.schedule.end")}
                    <span className="ml-1 text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <DatePicker
                    triggerId="announcement-schedule-end"
                    value={endDate}
                    onChange={(d) => updateSchedule("end", toDateKey(d))}
                    minDate={startDate ? laterCalendarWallDate(startDate, today) : today}
                    placeholder={t("businessPage.builder.announcement.schedule.datePlaceholder")}
                    invalid={!!(scheduleError || scheduleOrderInvalid || (scheduleOn && !endKey))}
                    describedBy={scheduleError ? "announcement-schedule-error" : undefined}
                    className={cn(
                      (scheduleError || scheduleOrderInvalid || (scheduleOn && !endKey)) &&
                        "border-destructive",
                    )}
                  />
                </div>
              </div>
              {scheduleError || scheduleDatesMissing || scheduleOrderInvalid ? (
                <p
                  id="announcement-schedule-error"
                  className="text-[11px] font-medium text-destructive"
                  role="alert"
                >
                  {scheduleError ?? t(
                    scheduleDatesMissing
                      ? "businessPage.builder.announcement.schedule.requiredError"
                      : "businessPage.builder.announcement.schedule.orderError",
                  )}
                </p>
              ) : null}
              <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
                <div>
                  <span className="text-sm text-foreground-1">
                    {t("businessPage.builder.announcement.schedule.showCountdown")}
                  </span>
                  <p className="mt-1 text-[11px] leading-4 text-foreground-3">
                    {t("businessPage.builder.announcement.schedule.showCountdownHint")}
                  </p>
                </div>
                <Switch
                  aria-label={t("businessPage.builder.announcement.schedule.showCountdown")}
                  checked={showCountdown}
                  onCheckedChange={setShowCountdown}
                />
              </div>
              <p className="text-[11px] text-foreground-3">
                {t("businessPage.builder.announcement.schedule.tz", { tz: timezone })}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export default AnnouncementEditor;
