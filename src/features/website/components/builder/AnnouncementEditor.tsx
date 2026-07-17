import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Megaphone, MousePointerClick, Link2 } from "lucide-react";
import TextField from "../../../../shared/components/forms/fields/TextField";
import DatePicker from "../../../../shared/components/ui/date-picker";
import { Label } from "../../../../shared/components/ui/label";
import { Switch } from "../../../../shared/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
} from "../../../../shared/components/ui/collapsible";
import { getCalendarTimezone } from "../../../calendar/selectors";
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
import type { AnnouncementContent, AnnouncementConfig, AnnouncementCta, AnnouncementTone } from "../../types";

const MAX_MESSAGE = 140;
const MAX_CTA_LABEL = 40;
const MAX_URL = 300;

const GROUP_LABEL = "text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-3";
const TONES = ["neutral", "offer", "alert"] as const;

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
}: AnnouncementEditorProps) {
  const { t } = useTranslation(["website", "common"]);
  const [blurred, setBlurred] = useState({ message: false, ctaLabel: false });
  const tone: AnnouncementTone = config.tone ?? "neutral";

  // A shown announcement needs a message in either language (mirrors the bar self-hiding when blank).
  const messageMissing =
    !!required && (value.message.en?.trim() ?? "") === "" && (value.message.ro?.trim() ?? "") === "";
  const timezone = useSelector(getCalendarTimezone);
  // Today in the business timezone — past days are disabled in both pickers (as on the calendar).
  const today = useMemo(
    () => minSelectableCalendarDateForTimezone(new Date(), timezone),
    [timezone],
  );

  const cta = value.cta;
  const patchCta = (patch: Partial<AnnouncementCta>) =>
    onChange({ ...value, cta: { ...cta, ...patch } });

  // The link only makes sense once the button has text — lock the URL until then. The shape
  // check, however, follows the save rule: any non-empty URL must be valid http(s) even while
  // the button is disabled or label-less (the collapsed blocks below force themselves open so
  // a stale invalid URL is always visible and fixable).
  const hasAnyButtonText = cta.label.en.trim() !== "" || cta.label.ro.trim() !== "";
  const urlError = cta.url.trim() !== "" ? validateUrlField(cta.url, t) ?? undefined : undefined;
  // A visible, enabled button with text still needs a destination before publishing. This is
  // guidance rather than a save-blocking field error, so an unfinished draft remains saveable.
  const urlMissing = !!required && cta.enabled && hasAnyButtonText && cta.url.trim() === "";
  const messageValidation = validateWebsiteCopy(value.message[locale], t, {
    fieldLabel: t("businessPage.builder.announcement.messageLabel"),
    maxLength: MAX_MESSAGE,
  });
  const ctaLabelValidation = validateWebsiteCopy(cta.label[locale], t, {
    fieldLabel: t("businessPage.builder.announcement.cta.labelLabel"),
    maxLength: MAX_CTA_LABEL,
  });
  const messageError = blurred.message || hasUnsafeWebsiteCopyCharacters(value.message[locale])
    ? messageValidation ?? undefined
    : undefined;
  const ctaLabelError = blurred.ctaLabel || hasUnsafeWebsiteCopyCharacters(cta.label[locale])
    ? ctaLabelValidation ?? undefined
    : undefined;

  const startKey = value.schedule?.start ?? null;
  const endKey = value.schedule?.end ?? null;
  const startDate = startKey ? localCalendarDateFromDateKey(startKey) : null;
  const endDate = endKey ? localCalendarDateFromDateKey(endKey) : null;

  const updateSchedule = (field: "start" | "end", key: string) => {
    onChange({
      ...value,
      schedule: {
        start: field === "start" ? key : startKey,
        end: field === "end" ? key : endKey,
        timezone,
      },
    });
  };

  // Scheduling is opt-in: a present `schedule` object means the toggle is on (start/end stay optional).
  const scheduleOn = value.schedule != null;
  const setScheduleOn = (on: boolean) =>
    onChange({
      ...value,
      schedule: on ? { start: startKey, end: endKey, timezone } : null,
    });

  return (
    <div className="space-y-5">
      {/* Message */}
      <TextField
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
        icon={Megaphone}
        maxLength={MAX_MESSAGE}
        className="!pt-0"
        hint={
          messageMissing ? (
            <InfoHint>{t("businessPage.builder.announcement.messageRequiredHint")}</InfoHint>
          ) : undefined
        }
      />

      {/* Tone — colours the whole ribbon (neutral / offer / alert); an independent axis under the layout. */}
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

        <Collapsible open={cta.enabled || !!urlError} onOpenChange={(v) => patchCta({ enabled: v })}>
          <CollapsibleContent>
            <AutoHeight className="space-y-3 pt-3">
              <div>
                <TextField
                  id="announcement-cta-label"
                  label={t("businessPage.builder.announcement.cta.labelLabel")}
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
                  icon={MousePointerClick}
                  maxLength={MAX_CTA_LABEL}
                  className="!pt-0"
                />
                <p className="-mt-1 text-[11px] text-foreground-3">
                  {t("businessPage.builder.announcement.cta.labelHint")}
                </p>
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
      <div className="space-y-3 border-t border-border pt-4">
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
                  <Label>{t("businessPage.builder.announcement.schedule.start")}</Label>
                  <DatePicker
                    value={startDate}
                    onChange={(d) => updateSchedule("start", toDateKey(d))}
                    minDate={today}
                    maxDate={endDate ?? undefined}
                    placeholder={t("businessPage.builder.announcement.schedule.datePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("businessPage.builder.announcement.schedule.end")}</Label>
                  <DatePicker
                    value={endDate}
                    onChange={(d) => updateSchedule("end", toDateKey(d))}
                    minDate={startDate ? laterCalendarWallDate(startDate, today) : today}
                    placeholder={t("businessPage.builder.announcement.schedule.datePlaceholder")}
                  />
                </div>
              </div>
              {/* Legacy drafts may hold start > end (pickers now prevent it) — the save is blocked
                  until the order is fixed, so say why right here. */}
              {startKey && endKey && startKey > endKey ? (
                <p className="text-[11px] font-medium text-destructive">
                  {t("businessPage.builder.announcement.schedule.orderError")}
                </p>
              ) : null}
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
