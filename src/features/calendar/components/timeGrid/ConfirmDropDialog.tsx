import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { cn } from "../../../../shared/lib/utils";
import {
  buildZonedDateFromDateKey,
  formatDateInTimezone,
  getCalendarLocale,
} from "../../timezone.ts";
import { formatTime } from "../utils.tsx";
import {
  modalScrim,
  modalPanel,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalFooterRowRight,
  modalCancel,
  modalPrimary,
} from "../../../../shared/components/ui/modal-tokens";

interface RescheduleConfirmDescriptionProps {
  name: string;
  customerName?: string | null;
  sourceScheduledAt: string;
  targetDateKey: string;
  targetHour: number;
  targetMinute?: number;
  timezone: string;
  targetStaffLabel?: string;
}

function formatSummaryDate(
  date: Date,
  timezone: string,
  includeYear: boolean,
  includeWeekday = true,
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    day: "numeric",
    month: "long",
  };
  if (includeWeekday) options.weekday = "long";
  if (includeYear) options.year = "numeric";
  return new Intl.DateTimeFormat(getCalendarLocale(), options).format(date);
}

export const RescheduleConfirmDescription: FC<RescheduleConfirmDescriptionProps> = ({
  name,
  customerName,
  sourceScheduledAt,
  targetDateKey,
  targetHour,
  targetMinute = 0,
  timezone,
  targetStaffLabel,
}) => {
  const { t } = useTranslation("calendar");
  const targetDate = buildZonedDateFromDateKey(
    targetDateKey,
    `${String(targetHour).padStart(2, "0")}:${String(targetMinute).padStart(2, "0")}`,
    timezone,
  );
  const sourceDate = new Date(sourceScheduledAt);
  const sourceDateKey = formatDateInTimezone(sourceDate, timezone);
  const sourceTime = formatTime(sourceScheduledAt, timezone);
  const targetTime = formatTime(targetDate.toISOString(), timezone);
  const customer = customerName?.trim();

  if (sourceDateKey !== targetDateKey) {
    const crossesYear = sourceDateKey.slice(0, 4) !== targetDateKey.slice(0, 4);

    return (
      <>
        <span className="block">
          <span className="font-medium text-neutral-900 dark:text-foreground-1">{name}</span>
          {customer ? (
            <span className="text-neutral-500 dark:text-foreground-3"> · {customer}</span>
          ) : null}
        </span>
        <span className="mt-4 block overflow-hidden rounded-xl border border-neutral-200 bg-white/50 dark:border-border-subtle dark:bg-white/5">
          <span className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="text-xs font-medium text-neutral-500 dark:text-foreground-3">
              {t("page.override.currentScheduleLabel")}
            </span>
            <span className="whitespace-nowrap text-sm tabular-nums text-neutral-700 dark:text-foreground-2">
              {formatSummaryDate(sourceDate, timezone, crossesYear)} · {sourceTime}
            </span>
          </span>
          <span className="flex flex-col gap-1 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 dark:border-border-subtle">
            <span className="text-xs font-medium text-primary-700 dark:text-primary-500">
              {t("page.override.newScheduleLabel")}
            </span>
            <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-neutral-900 dark:text-foreground-1">
              {formatSummaryDate(targetDate, timezone, crossesYear)} · {targetTime}
            </span>
          </span>
        </span>
      </>
    );
  }

  const date = formatSummaryDate(targetDate, timezone, true, false);
  if (targetStaffLabel) {
    return t(
      customer
        ? "page.override.rescheduleAssignBodyWithCustomer"
        : "page.override.rescheduleAssignBody",
      { name, customer, staff: targetStaffLabel, date, time: targetTime },
    );
  }

  return t(
    customer ? "page.override.rescheduleBodyWithCustomer" : "page.override.rescheduleBody",
    { name, customer, date, time: targetTime },
  );
};

interface ConfirmDropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  description: ReactNode;
}

export const ConfirmDropDialog: FC<ConfirmDropDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  description,
}) => {
  const { t } = useTranslation("calendar");
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={modalScrim} />
        <AlertDialog.Content className={cn(modalPanel, "text-left")}>
          <div className={modalEyebrow}>{t("page.override.rescheduleEyebrow")}</div>
          <AlertDialog.Title className={modalTitleCompact}>
            {t("page.override.rescheduleTitle")}
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <p className={cn(modalBody, "mt-3")}>{description}</p>
          </AlertDialog.Description>

          <div className={cn("mt-7", modalFooterRowRight)}>
            <AlertDialog.Cancel asChild>
              <button type="button" onClick={onCancel} className={modalCancel}>
                {t("page.override.cancel")}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                className={modalPrimary}
              >
                {t("page.override.confirm")}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
