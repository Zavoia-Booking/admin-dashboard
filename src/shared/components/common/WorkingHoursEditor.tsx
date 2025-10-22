import React, { memo, useCallback, useState, useRef, useEffect } from "react";
import { Switch } from "../../components/ui/switch";
import type { WorkingHours, WorkingHoursDay } from "../../types/location";
import CustomTimePicker from "./CustomTimePicker";
import WorkingHoursQuickActions from "./WorkingHoursQuickActions";
import { Moon, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "../../hooks/use-mobile";

const showWarningToast = (message: string): void => {
  const warnFn =
    (toast as any).warning ??
    ((m: string) =>
      toast.info(m, {
        className: "bg-amber-50 text-amber-900 border border-amber-200",
      } as any));
  warnFn(message);
};

type WorkingHoursEditorProps = {
  value: WorkingHours;
  onChange: (next: WorkingHours) => void;
  className?: string;
};

const orderedDays: (keyof WorkingHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const toMinutes = (hhmm?: string): number | null => {
  if (!hhmm || !/^[0-9]{2}:[0-9]{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

type DayRowProps = {
  day: keyof WorkingHours;
  hours: WorkingHours[keyof WorkingHours];
  onToggleOpen: (day: keyof WorkingHours, checked: boolean) => void;
  onChangeOpen: (day: keyof WorkingHours, value: string) => void;
  onChangeClose: (day: keyof WorkingHours, value: string) => void;
  flash?: boolean;
};

const DayRow: React.FC<DayRowProps> = memo(
  ({ day, hours, onToggleOpen, onChangeOpen, onChangeClose }) => {
    const handleToggle = useCallback(
      (checked: boolean) => {
        onToggleOpen(day, checked);
      },
      [day, onToggleOpen]
    );

    const handleOpenChange = useCallback(
      (value: string) => {
        onChangeOpen(day, value);
      },
      [day, onChangeOpen]
    );

    const handleCloseChange = useCallback(
      (value: string) => {
        onChangeClose(day, value);
      },
      [day, onChangeClose]
    );

    return (
      <div className="flex flex-wrap items-center gap-y-3 py-4 md:py-3 px-4 md:px-3">
        <div className="flex items-center gap-3 w-[128px] md:w-[140px]">
          <Switch
            checked={!!hours.isOpen}
            onCheckedChange={handleToggle}
            className={`!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer ${
              hours.isOpen ? "bg-black" : "bg-gray-300"
            }`}
          />
          <div className="text-base md:text-sm text-gray-700 capitalize">
            {String(day)}
          </div>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center min-w-[100px]">
          {!hours.isOpen && (
            <div className="flex items-center gap-2 text-gray-400">
              <Moon className="h-4 w-4" />
              <span className="text-sm">Closed</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full md:flex md:items-center md:gap-6 md:w-auto md:justify-start">
          {hours.isOpen ? (
            <>
              <div className="justify-self-end md:contents">
                <CustomTimePicker
                  id={`wh-${day}-open`}
                  label="From"
                  value={hours.open}
                  onChange={handleOpenChange}
                />
              </div>
              <span className="md:hidden text-sm text-gray-400 text-center">
                To
              </span>
              <div className="justify-self-start md:contents">
                <CustomTimePicker
                  id={`wh-${day}-close`}
                  label="To"
                  value={hours.close}
                  onChange={handleCloseChange}
                />
              </div>
            </>
          ) : (
            <>
              {/* Mobile layout: left chip, centered 'To', right chip */}
              <span className="md:hidden inline-flex !h-10 !min-h-0 px-4 rounded-full bg-gray-100 items-center justify-center w-[128px] text-sm leading-none text-gray-600 justify-self-end">
                Closed
              </span>
              <span className="md:hidden text-sm text-gray-400 text-center">
                To
              </span>
              <span className="md:hidden inline-flex !h-10 !min-h-0 px-4 rounded-full bg-gray-100 items-center justify-center w-[128px] text-sm leading-none text-gray-600 justify-self-start">
                Closed
              </span>

              {/* Desktop layout: preserve labels next to chips */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <span
                  id={`wh-${day}-open-label`}
                  className="text-xs text-gray-400 whitespace-nowrap"
                >
                  From
                </span>
                <span className="inline-flex !h-10 !min-h-0 px-4 rounded-full bg-gray-100 items-center justify-center w-[104px] text-sm leading-none text-gray-500">
                  Closed
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <span
                  id={`wh-${day}-close-label`}
                  className="text-xs text-gray-400 whitespace-nowrap"
                >
                  To
                </span>
                <span className="inline-flex !h-10 !min-h-0 px-4 rounded-full bg-gray-100 items-center justify-center w-[104px] text-sm leading-none text-gray-500">
                  Closed
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

const WorkingHoursEditor: React.FC<WorkingHoursEditorProps> = ({
  value,
  onChange,
  className,
}) => {
  const [showAllMobile, setShowAllMobile] = useState(false);
  const isMobile = useIsMobile();
  const restRef = useRef<HTMLDivElement>(null);
  const [restHeight, setRestHeight] = useState(0);
  const [flashDays, setFlashDays] = useState<Set<keyof WorkingHours>>(
    new Set()
  );

  useEffect(() => {
    if (!isMobile) return;
    const el = restRef.current;
    if (!el) return;
    // Measure full height for animation variable
    const fullHeight = Array.from(el.children).reduce(
      (acc, child) => acc + (child as HTMLElement).offsetHeight,
      0
    );
    setRestHeight(fullHeight);
    el.style.setProperty(
      "--radix-collapsible-content-height",
      `${fullHeight}px`
    );
  }, [value, showAllMobile, isMobile]);

  const setDay = useCallback(
    (
      day: keyof WorkingHours,
      updater: (prev: WorkingHoursDay) => WorkingHoursDay
    ) => {
      const next: WorkingHours = {
        ...value,
        [day]: updater(value[day]),
      };
      onChange(next);
    },
    [onChange, value]
  );

  const handleToggleOpen = useCallback(
    (day: keyof WorkingHours, checked: boolean) => {
      setDay(day, (prev) => {
        if (checked) {
          const needsDefault = !prev.open || !prev.close;
          return {
            ...prev,
            isOpen: true,
            open: needsDefault ? "09:00" : prev.open,
            close: needsDefault ? "17:00" : prev.close,
          };
        }
        return { ...prev, isOpen: false };
      });
    },
    [setDay]
  );

  const handleChangeOpen = useCallback(
    (day: keyof WorkingHours, val: string) => {
      setDay(day, (prev) => ({ ...prev, open: val }));
    },
    [setDay]
  );

  const handleChangeClose = useCallback(
    (day: keyof WorkingHours, val: string) => {
      const openVal = value[day].open;
      if (openVal && val) {
        const openM = toMinutes(openVal);
        const closeM = toMinutes(val);
        if (openM != null && closeM != null && closeM < openM) {
          showWarningToast("Closing time cannot be earlier than opening time");
          return;
        }
      }
      setDay(day, (prev) => ({ ...prev, close: val }));
    },
    [setDay, value]
  );

  const triggerFlash = useCallback((days: (keyof WorkingHours)[]) => {
    setFlashDays(new Set(days));
    window.setTimeout(() => setFlashDays(new Set()), 900);
  }, []);

  return (
    <div className={className}>
      <div className="relative rounded-lg border border-gray-200 bg-white overflow-visible md:overflow-hidden pb-4 md:pb-0">
        <div>
          {/* First two days always visible */}
          {orderedDays.slice(0, 2).map((day, index) => (
            <div
              key={day}
              className={`${index === 0 ? "border-b border-gray-100" : ""} ${
                index === 1
                  ? `${
                      showAllMobile ? "border-b border-gray-100" : ""
                    } md:border-b md:border-gray-100`
                  : ""
              } ${
                flashDays.has(day)
                  ? "bg-amber-50 transition-colors duration-1700"
                  : ""
              }`}
            >
              <DayRow
                day={day}
                hours={value[day]}
                onToggleOpen={handleToggleOpen}
                onChangeOpen={handleChangeOpen}
                onChangeClose={handleChangeClose}
              />
              {day === "monday" && (
                <WorkingHoursQuickActions
                  value={value}
                  onChange={onChange}
                  onFlashDays={triggerFlash}
                />
              )}
            </div>
          ))}
          {/* Remaining days inside collapsible container */}
          <div
            ref={restRef}
            {...(isMobile
              ? {
                  "data-slot": "collapsible-content",
                  "data-state": showAllMobile ? "open" : "closed",
                }
              : {})}
            className={`max-md:block md:block ${
              showAllMobile ? "max-md:h-auto" : "max-md:h-0"
            } max-md:overflow-hidden divide-y divide-gray-100`}
            style={
              isMobile
                ? ({
                    ["--radix-collapsible-content-height" as any]: `${restHeight}px`,
                  } as any)
                : undefined
            }
          >
            {orderedDays.slice(2).map((day) => (
              <div
                key={day}
                className={`${
                  flashDays.has(day)
                    ? "bg-amber-50 transition-colors duration-1700"
                    : ""
                }`}
              >
                <DayRow
                  day={day}
                  hours={value[day]}
                  onToggleOpen={handleToggleOpen}
                  onChangeOpen={handleChangeOpen}
                  onChangeClose={handleChangeClose}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Mobile expand/collapse toggle */}
        <div className="md:hidden absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-10">
          <button
            type="button"
            aria-label={
              showAllMobile ? "Collapse working hours" : "Expand working hours"
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm active:bg-gray-50 cursor-pointer"
            onClick={() => setShowAllMobile((v) => !v)}
          >
            <ChevronDown
              className={`h-6 w-6 transition-transform ${
                showAllMobile ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(WorkingHoursEditor);
