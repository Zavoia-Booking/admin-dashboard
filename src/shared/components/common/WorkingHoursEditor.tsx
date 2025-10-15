import React, { memo, useCallback } from 'react';
import { Switch } from '../../components/ui/switch';
import type { WorkingHours } from '../../types/location';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { HelpCircle, Moon } from 'lucide-react';
import CustomTimePicker from './CustomTimePicker';
import { toast } from 'sonner';

const showWarningToast = (message: string): void => {
  const warnFn = (toast as any).warning ?? ((m: string) => toast.info(m, {
    className: 'bg-amber-50 text-amber-900 border border-amber-200'
  } as any));
  warnFn(message);
};

type WorkingHoursEditorProps = {
  value: WorkingHours;
  onChange: (next: WorkingHours) => void;
  className?: string;
};

const orderedDays: (keyof WorkingHours)[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const updateWorkingHoursValue = (
  current: WorkingHours,
  day: keyof WorkingHours,
  field: 'open' | 'close' | 'isOpen',
  next: string | boolean
): WorkingHours => {
  return {
    ...current,
    [day]: {
      ...current[day],
      [field]: next as never,
    },
  } as WorkingHours;
};


type DayRowProps = {
  day: keyof WorkingHours;
  hours: WorkingHours[keyof WorkingHours];
  onToggleOpen: (day: keyof WorkingHours, checked: boolean) => void;
  onChangeOpen: (day: keyof WorkingHours, value: string) => void;
  onChangeClose: (day: keyof WorkingHours, value: string) => void;
};

const DayRow: React.FC<DayRowProps> = memo(({ day, hours, onToggleOpen, onChangeOpen, onChangeClose }) => {
  const handleToggle = useCallback((checked: boolean) => {
    onToggleOpen(day, checked);
  }, [day, onToggleOpen]);

  const handleOpenChange = useCallback((value: string) => {
    onChangeOpen(day, value);
  }, [day, onChangeOpen]);

  const handleCloseChange = useCallback((value: string) => {
    onChangeClose(day, value);
  }, [day, onChangeClose]);


  return (
    <div className="flex items-center py-2 px-3">
      <div className="flex items-center gap-3 w-[140px]">
        <Switch
          checked={!!hours.isOpen}
          onCheckedChange={handleToggle}
          className={`!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer ${hours.isOpen ? 'bg-black' : 'bg-gray-300'}`}
        />
        <div className="text-sm text-gray-700 capitalize">{String(day)}</div>
      </div>
      <div className="flex-1 flex items-center justify-center min-w-[100px]">
        {!hours.isOpen && (
          <div className="flex items-center gap-2 text-gray-400">
            <Moon className="h-4 w-4" />
            <span className="text-sm">Closed</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-6">
        {hours.isOpen ? (
          <>
            <CustomTimePicker
              id={`wh-${day}-open`}
              label="From"
              value={hours.open}
              onChange={handleOpenChange}
            />
            <CustomTimePicker
              id={`wh-${day}-close`}
              label="To"
              value={hours.close}
              onChange={handleCloseChange}
            />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 shrink-0">
              <span id={`wh-${day}-open-label`} className="text-[11px] text-gray-400 whitespace-nowrap">From</span>
              <span className="inline-flex !h-8 !min-h-0 px-4 rounded-full bg-gray-100 items-center justify-center w-[92px] text-sm leading-none text-gray-400">Closed</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span id={`wh-${day}-close-label`} className="text-[11px] text-gray-400 whitespace-nowrap">To</span>
              <span className="inline-flex !h-8 !min-h-0 px-4 rounded-full bg-gray-100 items-center justify-center w-[92px] text-sm leading-none text-gray-400">Closed</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

const WorkingHoursEditor: React.FC<WorkingHoursEditorProps> = ({ value, onChange, className }) => {
  const update = useCallback(
    (day: keyof WorkingHours, field: 'open' | 'close' | 'isOpen', next: string | boolean) => {
      onChange(updateWorkingHoursValue(value, day, field, next));
    },
    [onChange, value]
  );

  const handleToggleOpen = useCallback((day: keyof WorkingHours, checked: boolean) => {
    update(day, 'isOpen', checked);
  }, [update]);

  const handleChangeOpen = useCallback((day: keyof WorkingHours, val: string) => {
    update(day, 'open', val);
  }, [update]);

  const handleChangeClose = useCallback((day: keyof WorkingHours, val: string) => {
    const openVal = (value[day] as any)?.open as string | undefined;
    if (openVal && val) {
      const [oh, om] = openVal.split(':').map(Number);
      const [ch, cm] = val.split(':').map(Number);
      const openM = oh * 60 + om;
      const closeM = ch * 60 + cm;
      if (closeM < openM) {
        showWarningToast('Closing time cannot be earlier than opening time');
        return;
      }
    }
    update(day, 'close', val);
  }, [update, value]);

  return (
    <div className={className}>
      <div className="space-y-2">
        {orderedDays.map((day) => (
          <DayRow
            key={day}
            day={day}
            hours={value[day]}
            onToggleOpen={handleToggleOpen}
            onChangeOpen={handleChangeOpen}
            onChangeClose={handleChangeClose}
          />
        ))}
      </div>

      {/* Quick actions with separate info popover */}
      <div className="mt-3 flex items-center flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 cursor-pointer"
          onClick={() => {
            const next: WorkingHours = { ...value } as WorkingHours;
            const src = value.monday;
            ['tuesday', 'wednesday', 'thursday', 'friday'].forEach((d) => {
              next[d as keyof WorkingHours] = { ...src } as any;
            });
            onChange(next);
          }}
        >
          Apply to weekdays
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 cursor-pointer"
          onClick={() => {
            const next: WorkingHours = { ...value } as WorkingHours;
            const src = value.monday;
            (['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as (keyof WorkingHours)[]).forEach((d) => {
              next[d] = { ...src } as any;
            });
            onChange(next);
          }}
        >
          Apply to all
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="What do these apply buttons do?"
              className="ml-1 inline-flex h-8 w-8 items-center justify-center bg-transparent text-gray-600 hover:text-gray-800 transition-colors p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 cursor-pointer"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent sideOffset={6} className="max-w-xs whitespace-normal text-xs leading-relaxed">
            Set Monday first, then use these shortcuts:
            <br />
            <span className="font-medium">Apply to weekdays</span> copies Monday’s status and time range to Tue–Fri.
            <br />
            <span className="font-medium">Apply to all</span> copies Monday’s settings to every other day.
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default memo(WorkingHoursEditor);


