import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { WorkingHours, WorkingHoursDay } from "../../types/location";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { HelpCircle, CalendarCheck, CalendarDays } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value: WorkingHours;
  onChange: (next: WorkingHours) => void;
  onFlashDays?: (days: (keyof WorkingHours)[]) => void;
};

const toMinutes = (hhmm?: string): number | null => {
  if (!hhmm || !/^[0-9]{2}:[0-9]{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const showWarningToast = (message: string): void => {
  const warnFn =
    (toast as any).warning ??
    ((m: string) =>
      toast.info(m, {
        className: "bg-warning-bg text-warning border border-warning",
      } as any));
  warnFn(message);
};

const showSuccessToast = (message: string): void => {
  const successFn = (toast as any).success ?? ((m: string) => toast(m));
  successFn(message);
};

export default function WorkingHoursQuickActions({
  value,
  onChange,
  onFlashDays,
}: Props) {
  const { t } = useTranslation('common');
  const [announce, setAnnounce] = useState<string>("");

  const monday = value.monday;
  const mondayOpen = !!monday?.isOpen;
  const mo = toMinutes(monday?.open);
  const mc = toMinutes(monday?.close);
  const mondayInvalidRange =
    mondayOpen && (mo == null || mc == null || mc < mo);

  const setDay = useCallback(
    (
      day: keyof WorkingHours,
      nextDay: WorkingHoursDay,
      base?: WorkingHours
    ) => {
      const src = base ?? value;
      const next: WorkingHours = { ...src, [day]: nextDay };
      return next;
    },
    [value]
  );

  const copyFromMonday = useCallback(
    (targets: (keyof WorkingHours)[], label: string) => {
      const isOpen = mondayOpen;
      const openM = mo;
      const closeM = mc;

      if (isOpen) {
        if (openM == null || closeM == null) {
          showWarningToast(t('workingHours.setBothMondayFirst'));
          return;
        }
        if (closeM < openM) {
          showWarningToast(t('workingHours.mondayClosingBeforeOpening'));
          return;
        }
      }

      let next = value;
      targets.forEach((d) => {
        const dayValue: WorkingHoursDay = isOpen
          ? { open: monday.open, close: monday.close, isOpen: true }
          : { open: "", close: "", isOpen: false };
        next = setDay(d, dayValue, next);
      });

      onChange(next);
      onFlashDays?.(targets);
      setAnnounce(label);
      showSuccessToast(label);
    },
    [
      monday.open,
      monday.close,
      mondayOpen,
      mo,
      mc,
      onChange,
      onFlashDays,
      setDay,
      value,
      t,
    ]
  );

  const applyWeekdaysFromMonday = useCallback(() => {
    const isOpen = mondayOpen;
    const openM = mo;
    const closeM = mc;

    if (isOpen) {
      if (openM == null || closeM == null || closeM < openM) {
        showWarningToast(t('workingHours.setMondayFirst'));
        return;
      }
    }

    let next = value;
    (
      ["tuesday", "wednesday", "thursday", "friday"] as (keyof WorkingHours)[]
    ).forEach((d) => {
      const dayValue: WorkingHoursDay = isOpen
        ? { open: monday.open, close: monday.close, isOpen: true }
        : { open: "", close: "", isOpen: false };
      next = setDay(d, dayValue, next);
    });

    onChange(next);
    onFlashDays?.(["tuesday", "wednesday", "thursday", "friday"]);
    setAnnounce(t('workingHours.weekdaysUpdated'));
    showSuccessToast(t('workingHours.weekdaysUpdated'));
  }, [
    monday.open,
    monday.close,
    mondayOpen,
    mo,
    mc,
    onChange,
    onFlashDays,
    setDay,
    value,
    t,
  ]);

  return (
    <div className="px-4 md:px-3 pb-4 md:pb-3">
      {/* Mobile: header row with label and tooltip */}
      <div className="flex items-center justify-between md:hidden">
        <div className="text-foreground-3 dark:text-foreground-2 text-sm">{t('workingHours.applyTo')}</div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('workingHours.shortcutsAria')}
              className="inline-flex items-center justify-center text-foreground-3 dark:text-foreground-2 hover:text-foreground-1 p-0 focus-visible:outline-none cursor-pointer"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            sideOffset={6}
            side="bottom"
            align="center"
            className="whitespace-normal text-sm leading-relaxed w-[calc(100vw-2rem)] max-w-[360px] max-md:[transform:translateX(calc(-50vw+50%))!important]"
          >
            <div className="space-y-2">
              <div className="font-medium">
                {t('workingHours.shortcutsIntro')}
              </div>
              <div>
                <span className="font-medium">{t('workingHours.monFri')}</span>: {t('workingHours.monFriDesc')}
              </div>
              <div>
                <span className="font-medium">{t('workingHours.allWeek')}</span>: {t('workingHours.allWeekDesc')}
              </div>
              <div className="text-xs text-foreground-3 dark:text-foreground-2">
                {t('workingHours.tip')}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: buttons in one row */}
      <div className="mt-2 md:hidden grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full">
        <button
          type="button"
          aria-label={t('workingHours.copyToTueFriAria')}
          title={
            mondayInvalidRange ? t('workingHours.setMondayFirst') : undefined
          }
          className={`inline-flex items-center justify-center gap-2 !h-10 !min-h-0 py-0 px-4 rounded-full border border-border bg-surface text-xs font-medium text-foreground-1 shadow-sm hover:bg-surface-hover active:bg-surface-active transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0 cursor-pointer w-[128px] justify-self-end ${
            mondayInvalidRange
              ? "opacity-60 cursor-not-allowed hover:bg-surface"
              : ""
          }`}
          disabled={mondayInvalidRange}
          onClick={applyWeekdaysFromMonday}
        >
          <CalendarCheck className="h-4 w-4 text-primary" />
          {t('workingHours.monFri')}
        </button>
        <span aria-hidden="true" className="min-w-4"></span>
        <button
          type="button"
          aria-label={t('workingHours.copyToAllAria')}
          title={
            mondayInvalidRange ? t('workingHours.setMondayFirst') : undefined
          }
          className={`inline-flex items-center justify-center gap-2 !h-10 !min-h-0 py-0 px-4 rounded-full border border-border bg-surface text-xs font-medium text-foreground-1 shadow-sm hover:bg-surface-hover active:bg-surface-active transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0 cursor-pointer w-[128px] justify-self-start ${
            mondayInvalidRange
              ? "opacity-60 cursor-not-allowed hover:bg-surface"
              : ""
          }`}
          disabled={mondayInvalidRange}
          onClick={() =>
            copyFromMonday(
              [
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
              t('workingHours.allDaysUpdated')
            )
          }
        >
          <CalendarDays className="h-4 w-4 text-primary" />
          {t('workingHours.allWeek')}
        </button>
      </div>

      {/* Desktop: single row with label left and controls right */}
      <div className="hidden md:flex items-center justify-between gap-2 pt-2 mt-2">
        <div className="text-foreground-3 dark:text-foreground-2 text-sm">{t('workingHours.applyTo')}</div>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t('workingHours.shortcutsAria')}
                className="inline-flex items-center justify-center text-foreground-3 dark:text-foreground-2 hover:text-foreground-1 p-0 focus-visible:outline-none cursor-pointer"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              sideOffset={6}
              side="bottom"
              align="center"
              className="whitespace-normal text-sm leading-relaxed w-[calc(100vw-2rem)] max-w-[420px] max-md:[transform:translateX(calc(-50vw+50%))!important]"
            >
              <div className="space-y-2">
                <div className="font-medium">
                  {t('workingHours.shortcutsIntro')}
                </div>
                <div>
                  <span className="font-medium">{t('workingHours.monFri')}</span>: {t('workingHours.monFriDesc')}
                </div>
                <div>
                  <span className="font-medium">{t('workingHours.allWeek')}</span>: {t('workingHours.allWeekDesc')}
                </div>
                <div className="text-xs text-foreground-3 dark:text-foreground-2">
                  {t('workingHours.tip')}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <button
            type="button"
            aria-label={t('workingHours.copyToTueFriAria')}
            title={
              mondayInvalidRange ? t('workingHours.setMondayFirst') : undefined
            }
            className={`inline-flex items-center gap-2 !h-10 !min-h-0 py-0 px-4 rounded-full border border-border bg-surface text-xs font-medium text-foreground-1 shadow-sm hover:bg-surface-hover active:bg-surface-active mr-0 md:mr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0 cursor-pointer whitespace-nowrap ${
              mondayInvalidRange
                ? "opacity-60 cursor-not-allowed hover:bg-surface"
                : ""
            }`}
            disabled={mondayInvalidRange}
            onClick={applyWeekdaysFromMonday}
          >
            <CalendarCheck className="h-4 w-4 text-primary" />
            {t('workingHours.monFri')}
          </button>
          <button
            type="button"
            aria-label={t('workingHours.copyToAllAria')}
            title={
              mondayInvalidRange ? t('workingHours.setMondayFirst') : undefined
            }
            className={`inline-flex items-center gap-2 !h-10 !min-h-0 py-0 px-4 rounded-full border border-border bg-surface text-xs font-medium text-foreground-1 shadow-sm hover:bg-surface-hover active:bg-surface-active transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0 cursor-pointer whitespace-nowrap md:ml-8 ${
              mondayInvalidRange
                ? "opacity-60 cursor-not-allowed hover:bg-surface"
                : ""
            }`}
            disabled={mondayInvalidRange}
            onClick={() =>
              copyFromMonday(
                [
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ],
                t('workingHours.allDaysUpdated')
              )
            }
          >
            <CalendarDays className="h-4 w-4 text-primary" />
            {t('workingHours.allWeek')}
          </button>
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {announce}
      </div>
    </div>
  );
}
