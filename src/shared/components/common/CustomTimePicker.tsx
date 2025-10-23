import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { handleListNavKey, handlePeriodNavKey } from './timeUtils';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose, DrawerFooter, DrawerTitle, DrawerDescription } from '../../components/ui/drawer';

type CustomTimePickerProps = {
  id: string;
  label: string;
  value: string; // HH:mm format (24-hour)
  onChange: (value: string) => void;
  min?: string; // optional HH:mm lower bound
  max?: string; // optional HH:mm upper bound
  stepMinutes?: number; // optional minute step for rounding (omit to disable)
};

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = Array.from({ length: 60 }, (_, i) => i);

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ id, label, value, onChange, min, max, stepMinutes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);
  const amRef = useRef<HTMLDivElement>(null);
  const pmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parse the 24-hour time value into components
  const { hour12, minute, period } = useMemo((): { hour12: number; minute: number; period: string } => {
    if (!value) return { hour12: 9, minute: 0, period: 'AM' };
    const [hh, mm] = value.split(':').map(Number);
    const periodValue = hh >= 12 ? 'PM' : 'AM';
    const hour12Value = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return { hour12: hour12Value, minute: mm, period: periodValue };
  }, [value]);

  const [localHour, setLocalHour] = useState(hour12);
  const [localMinute, setLocalMinute] = useState(minute);
  const [localPeriod, setLocalPeriod] = useState(period);

  // Sync local state when value changes externally
  useEffect(() => {
    setLocalHour(hour12);
    setLocalMinute(minute);
    setLocalPeriod(period);
  }, [hour12, minute, period]);

  // Scroll to selected items when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const hourElement = hourScrollRef.current?.querySelector(`[data-hour="${localHour}"]`);
        const minuteElement = minuteScrollRef.current?.querySelector(`[data-minute="${localMinute}"]`);

        hourElement?.scrollIntoView({ block: 'center', behavior: 'instant' });
        minuteElement?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, 0);
    }
  }, [isOpen, localHour, localMinute]);

  // Focus currently active option when value changes via keyboard
  useEffect(() => {
    if (!isOpen) return;
    const el = hourScrollRef.current?.querySelector(`[data-hour="${localHour}"]`) as HTMLElement | null;
    el?.focus({ preventScroll: true });
  }, [isOpen, localHour]);

  useEffect(() => {
    if (!isOpen) return;
    const el = minuteScrollRef.current?.querySelector(`[data-minute="${localMinute}"]`) as HTMLElement | null;
    el?.focus({ preventScroll: true });
  }, [isOpen, localMinute]);

  useEffect(() => {
    if (!isOpen) return;
    const el = localPeriod === 'AM' ? amRef.current : pmRef.current;
    el?.focus({ preventScroll: true });
  }, [isOpen, localPeriod]);

  const roundToStep = useCallback((hh: number, mm: number) => {
    if (!stepMinutes || stepMinutes <= 1) {
      return { hh, mm };
    }
    const step = stepMinutes;
    const rounded = Math.round(mm / step) * step;
    if (rounded === 60) {
      return { hh: (hh + 1) % 24, mm: 0 };
    }
    return { hh, mm: rounded };
  }, [stepMinutes]);

  const clampToBounds = useCallback((hh: number, mm: number) => {
    const toNum = (s?: string) => s ? parseInt(s.split(":")[0], 10) * 60 + parseInt(s.split(":")[1], 10) : undefined;
    const mins = hh * 60 + mm;
    const minNum = toNum(min);
    const maxNum = toNum(max);
    const clamped = Math.max(minNum ?? mins, Math.min(maxNum ?? mins, mins));
    return { hh: Math.floor(clamped / 60), mm: clamped % 60 };
  }, [min, max]);

  const handleDone = useCallback(() => {
    // Convert 12-hour to 24-hour format
    let hour24 = localHour;
    if (localPeriod === 'PM' && localHour !== 12) {
      hour24 = localHour + 12;
    } else if (localPeriod === 'AM' && localHour === 12) {
      hour24 = 0;
    }
    const rounded = roundToStep(hour24, localMinute);
    const bounded = clampToBounds(rounded.hh, rounded.mm);
    const formatted = `${String(bounded.hh).padStart(2, '0')}:${String(bounded.mm).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  }, [localHour, localMinute, localPeriod, onChange, roundToStep, clampToBounds]);

  const displayValue = useMemo(() => {
    if (!value) return '';
    const [hh, mm] = value.split(':');
    const h = Number(hh);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(hour12).padStart(2, '0')}:${mm} ${period}`;
  }, [value]);

  const handleHourClick = useCallback((h: number) => setLocalHour(h), []);
  const handleMinuteClick = useCallback((m: number) => setLocalMinute(m), []);
  const handleHourKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, h: number) => {
    handleListNavKey(e, h, hours, setLocalHour, () => setIsOpen(false));
  }, []);
  const handleMinuteKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, m: number) => {
    handleListNavKey(e, m, minutes, setLocalMinute, () => setIsOpen(false));
  }, []);

  const handlePeriodClick = useCallback((p: 'AM' | 'PM') => setLocalPeriod(p), []);
  const handlePeriodKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, p: 'AM' | 'PM') => {
    handlePeriodNavKey(e, p, setLocalPeriod, () => setIsOpen(false));
  }, []);

  const headerText = useMemo(() => {
    const l = label?.toLowerCase?.() ?? '';
    if (l === 'from') return 'Pick a start time';
    if (l === 'to') return 'Pick an end time';
    return `Select ${l} time`;
  }, [label]);

  const timePickerContent = (
    <div className="flex flex-col gap-3 py-2">
      <div className="text-base font-medium text-gray-700 text-center pb-3 border-b border-gray-200">{headerText}</div>
      <div className="flex items-start justify-center gap-2">
        {/* Hour selector */}
        <div className="flex flex-col items-center w-28" role="listbox" aria-label="Select hour">
          <div className="text-xs text-gray-500 mb-1 font-medium pb-2">Hour</div>
          <div
            ref={hourScrollRef}
            className="relative h-44 w-full overflow-y-auto scroll-smooth border border-gray-200 rounded-md bg-white tabular-nums px-1 py-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {hours.map((h) => (
              <div
                key={h}
                role="option"
                tabIndex={localHour === h ? 0 : -1}
                data-hour={h}
                onClick={() => handleHourClick(h)}
                onKeyDown={(e) => handleHourKeyDown(e, h)}
                className={`h-10 !min-h-0 w-full my-0.5 text-sm leading-none flex items-center justify-center transition-colors cursor-pointer select-none rounded-full tabular-nums ${localHour === h
                    ? 'bg-black text-white font-semibold ring-1 ring-black'
                    : 'hover:bg-gray-100 text-gray-700'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
              >
                {String(h).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>

        <div className="self-stretch w-px bg-gray-200 rounded-full mx-2" />

        {/* Minute selector */}
        <div className="flex flex-col items-center w-28" role="listbox" aria-label="Select minute">
          <div className="text-xs text-gray-500 mb-1 font-medium pb-2">Minute</div>
          <div
            ref={minuteScrollRef}
            className="relative h-44 w-full overflow-y-auto scroll-smooth border border-gray-200 rounded-md bg-white tabular-nums px-1 py-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {minutes.map((m) => (
              <div
                key={m}
                role="option"
                tabIndex={localMinute === m ? 0 : -1}
                data-minute={m}
                onClick={() => handleMinuteClick(m)}
                onKeyDown={(e) => handleMinuteKeyDown(e, m)}
                className={`h-10 !min-h-0 w-full my-0.5 text-sm leading-none flex items-center justify-center transition-colors cursor-pointer select-none rounded-full tabular-nums ${localMinute === m
                    ? 'bg-black text-white font-semibold ring-1 ring-black'
                    : 'hover:bg-gray-100 text-gray-700'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
              >
                {String(m).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>

        <div className="self-stretch w-px bg-gray-200 rounded-full mx-2" />

        {/* AM/PM selector */}
        <div className="flex flex-col items-center w-20" role="listbox" aria-label="Select period">
          <div className="text-xs text-gray-500 mb-1 font-medium">Period</div>
          <div className="flex flex-col gap-2 w-full h-44 justify-center">
            <div
              role="option"
              tabIndex={localPeriod === 'AM' ? 0 : -1}
              ref={amRef}
              onClick={() => handlePeriodClick('AM')}
              onKeyDown={(e) => handlePeriodKeyDown(e, 'AM')}
              className={`h-10 !min-h-0 inline-flex items-center justify-center px-4 rounded-full text-sm font-medium transition-colors cursor-pointer select-none tabular-nums ${localPeriod === 'AM'
                  ? 'bg-black text-white ring-1 ring-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
            >
              AM
            </div>
            <div
              role="option"
              tabIndex={localPeriod === 'PM' ? 0 : -1}
              ref={pmRef}
              onClick={() => handlePeriodClick('PM')}
              onKeyDown={(e) => handlePeriodKeyDown(e, 'PM')}
              className={`h-10 !min-h-0 inline-flex items-center justify-center px-4 rounded-full text-sm font-medium transition-colors cursor-pointer select-none tabular-nums ${localPeriod === 'PM'
                  ? 'bg-black text-white ring-1 ring-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
            >
              PM
            </div>
          </div>
        </div>
      </div>
      {/* Done button rendered per-context (Drawer/Popover) */}
    </div>
  );

  const trigger = (
    <span
      role="button"
      tabIndex={0}
      aria-labelledby={`${id}-label`}
      onClick={(e) => {
        // Blur the trigger immediately so it doesn't retain focus when aria-hidden is applied
        (e.currentTarget as HTMLElement).blur();
      }}
      className="inline-flex !h-10 !min-h-0 px-4 rounded-full bg-gray-100 items-center justify-center hover:bg-gray-200 w-[128px] md:w-[104px] text-sm md:text-sm leading-none cursor-pointer transition-colors select-none"
    >
      {displayValue}
    </span>
  );

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span
        id={`${id}-label`}
        className={`${(label?.toLowerCase?.() === 'from' || label?.toLowerCase?.() === 'to') ? 'hidden md:inline' : ''} text-xs text-gray-400 whitespace-nowrap`}
      >
        {label}
      </span>

      {isMobile ? (
        <Drawer
          onOpenChange={(open) => {
            setIsOpen(open);
            if (open) {
              document.documentElement.style.scrollBehavior = 'auto';
            } else {
              setTimeout(() => {
                document.documentElement.style.scrollBehavior = 'smooth';
              }, 100);
            }
          }}
        >
          <DrawerTrigger asChild>
            {trigger}
          </DrawerTrigger>
          <DrawerContent className="outline-none">
            <DrawerTitle className="sr-only">Select Time</DrawerTitle>
            <DrawerDescription className="sr-only">Choose hours, minutes, and AM/PM</DrawerDescription>
            <div className="p-4">
              {timePickerContent}
              <DrawerFooter className='px-0'>
                <DrawerClose asChild>
                  <button
                    type="button"
                    onClick={handleDone}
                    className="h-10 inline-flex items-center justify-center px-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium text-sm cursor-pointer w-full"
                  >
                    Done
                  </button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            {trigger}
          </PopoverTrigger>
          <PopoverContent
            className="w-[340px] p-3 rounded-lg border border-gray-200 bg-white shadow-md"
            align="start"
            side="bottom"
            sideOffset={8}
            collisionPadding={16}
          >
            {timePickerContent}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDone}
                className="h-10 inline-flex items-center justify-center px-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium text-sm cursor-pointer w-full"
              >
                Done
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default CustomTimePicker;

