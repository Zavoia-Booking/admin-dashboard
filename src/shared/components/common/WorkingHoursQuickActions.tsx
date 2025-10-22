import { useCallback, useState } from "react";
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
        className: "bg-amber-50 text-amber-900 border border-amber-200",
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
          showWarningToast(
            "Set both opening and closing times on Monday first"
          );
          return;
        }
        if (closeM < openM) {
          showWarningToast(
            "Monday closing time cannot be earlier than opening time"
          );
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
    ]
  );

  const applyWeekdaysFromMonday = useCallback(() => {
    const isOpen = mondayOpen;
    const openM = mo;
    const closeM = mc;

    if (isOpen) {
      if (openM == null || closeM == null || closeM < openM) {
        showWarningToast("Set valid Monday hours first");
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
    setAnnounce("Weekdays updated");
    showSuccessToast("Weekdays updated");
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
  ]);

  return (
    <div className="px-4 md:px-3 pb-4 md:pb-3">
      {/* Mobile: header row with label and tooltip */}
      <div className="flex items-center justify-between md:hidden">
        <div className="text-gray-500 text-sm">Apply to:</div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="What do these shortcuts do?"
              className="inline-flex items-center justify-center text-gray-500 hover:text-gray-800 p-0 focus-visible:outline-none cursor-pointer"
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
                Quick actions buttons to apply Monday's hours to other days:
              </div>
              <div>
                <span className="font-medium">Mon–Fri</span>: Copies Monday's
                open/close and open/closed status to Tue–Fri. Weekends are
                unchanged.
              </div>
              <div>
                <span className="font-medium">All week</span>: Copies Monday's
                open/close and status to every day (Tue–Sun).
              </div>
              <div className="text-xs text-muted-foreground">
                Tip: Set valid Monday hours first.
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: buttons in one row */}
      <div className="mt-2 md:hidden flex items-center justify-between">
        <button
          type="button"
          aria-label="Copy to Tue–Fri"
          title={
            mondayInvalidRange ? "Set valid Monday hours first" : undefined
          }
          className={`inline-flex items-center justify-center gap-2 !h-10 !min-h-0 py-0 px-4 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 cursor-pointer w-[128px] ${
            mondayInvalidRange
              ? "opacity-60 cursor-not-allowed hover:bg-white"
              : ""
          }`}
          disabled={mondayInvalidRange}
          onClick={applyWeekdaysFromMonday}
        >
          <CalendarCheck className="h-4 w-4" />
          Mon–Fri
        </button>
        <button
          type="button"
          aria-label="Copy to all days"
          title={
            mondayInvalidRange ? "Set valid Monday hours first" : undefined
          }
          className={`inline-flex items-center justify-center gap-2 !h-10 !min-h-0 py-0 px-4 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 cursor-pointer w-[128px] ${
            mondayInvalidRange
              ? "opacity-60 cursor-not-allowed hover:bg-white"
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
              "All days updated"
            )
          }
        >
          <CalendarDays className="h-4 w-4" />
          All week
        </button>
      </div>

      {/* Desktop: single row with label left and controls right */}
      <div className="hidden md:flex items-center justify-between gap-2 pt-2 mt-2">
        <div className="text-gray-500 text-sm">Apply to:</div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="What do these shortcuts do?"
                className="inline-flex items-center justify-center text-gray-500 hover:text-gray-800 p-0 focus-visible:outline-none cursor-pointer"
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
                  Quick actions buttons to apply Monday's hours to other days:
                </div>
                <div>
                  <span className="font-medium">Mon–Fri</span>: Copies Monday's
                  open/close and open/closed status to Tue–Fri. Weekends are
                  unchanged.
                </div>
                <div>
                  <span className="font-medium">All week</span>: Copies Monday's
                  open/close and status to every day (Tue–Sun).
                </div>
                <div className="text-xs text-muted-foreground">
                  Tip: Set valid Monday hours first.
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <button
            type="button"
            aria-label="Copy to Tue–Fri"
            title={
              mondayInvalidRange ? "Set valid Monday hours first" : undefined
            }
            className={`inline-flex items-center gap-2 !h-10 !min-h-0 py-0 px-4 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 mr-0 md:mr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 cursor-pointer whitespace-nowrap ${
              mondayInvalidRange
                ? "opacity-60 cursor-not-allowed hover:bg-white"
                : ""
            }`}
            disabled={mondayInvalidRange}
            onClick={applyWeekdaysFromMonday}
          >
            <CalendarCheck className="h-4 w-4" />
            Mon–Fri
          </button>
          <button
            type="button"
            aria-label="Copy to all days"
            title={
              mondayInvalidRange ? "Set valid Monday hours first" : undefined
            }
            className={`inline-flex items-center gap-2 !h-10 !min-h-0 py-0 px-4 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 cursor-pointer whitespace-nowrap md:ml-8 ${
              mondayInvalidRange
                ? "opacity-60 cursor-not-allowed hover:bg-white"
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
                "All days updated"
              )
            }
          >
            <CalendarDays className="h-4 w-4" />
            All week
          </button>
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {announce}
      </div>
    </div>
  );
}
