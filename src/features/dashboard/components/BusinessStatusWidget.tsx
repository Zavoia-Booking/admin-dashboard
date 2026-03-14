import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { normalizeWorkingHours, type WorkingHourEntry } from './workingHoursUtils';

interface BusinessStatusWidgetProps {
  name: string;
  isCurrentlyOpen: boolean;
  open247: boolean;
  timezone: string;
  workingHours: WorkingHourEntry[] | Record<string, { open?: string; close?: string; isOpen?: boolean }>;
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function getTodayDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function getNextBoundary(
  workingHours: WorkingHourEntry[],
  isCurrentlyOpen: boolean,
  t: (key: string, opts?: Record<string, string>) => string
): string {
  if (!workingHours || workingHours.length === 0) return t('businessStatus.hoursUnavailable');

  const todayName = getTodayDayName();
  const todayHours = workingHours.find(h => h.day === todayName);

  if (isCurrentlyOpen && todayHours?.closeTime) {
    return t('businessStatus.closesAt', { time: todayHours.closeTime });
  }

  // Find next open day
  const todayIndex = DAY_ORDER.indexOf(todayName);
  for (let i = 1; i <= 7; i++) {
    const nextIndex = (todayIndex + i) % 7;
    const nextDayName = DAY_ORDER[nextIndex];
    const nextDay = workingHours.find(h => h.day === nextDayName);
    if (nextDay?.isOpen && nextDay.openTime) {
      const label = i === 1 ? t('businessStatus.tomorrow') : t(`businessStatus.days.${DAY_KEYS[nextIndex]}`);
      return t('businessStatus.opensAt', { label, time: nextDay.openTime });
    }
  }

  return t('businessStatus.noUpcomingHours');
}

export function BusinessStatusWidget({
  name,
  isCurrentlyOpen,
  open247,
  timezone,
  workingHours: rawHours,
}: BusinessStatusWidgetProps) {
  const { t } = useTranslation('dashboard');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const workingHours = normalizeWorkingHours(rawHours);
  const todayName = getTodayDayName();
  const noHours = workingHours.length === 0;

  const statusLabel = open247 ? t('businessStatus.open247') : isCurrentlyOpen ? t('businessStatus.openNow') : t('businessStatus.closed');
  const statusColor = open247 || isCurrentlyOpen ? 'text-success' : 'text-error';
  const badgeBg = open247 || isCurrentlyOpen ? 'bg-success-bg border-success-border' : 'bg-error-bg border-error-border';
  const dotColor = open247 || isCurrentlyOpen ? 'bg-success' : 'bg-error';

  const boundaryText = open247 ? t('businessStatus.openAroundClock') : noHours ? t('businessStatus.hoursUnavailable') : getNextBoundary(workingHours, isCurrentlyOpen, t);

  const sortedHours = DAY_ORDER.map(day => workingHours.find(h => h.day === day) ?? { day, isOpen: false });

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">{t('businessStatus.title')}</p>
        </div>
        {/* Live dot + status pill */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${badgeBg} ${statusColor} shrink-0`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${(open247 || isCurrentlyOpen) ? 'animate-pulse' : ''}`} />
          {statusLabel}
        </div>
      </div>

      {/* Business name */}
      <div>
        <h3 className="text-xl font-bold text-foreground-1 leading-tight truncate">{name}</h3>
      </div>

      {/* Boundary + timezone */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-foreground-3 shrink-0" />
          <span className="text-sm text-foreground-2">{boundaryText}</span>
        </div>
        {timezone && (
          <span className="text-xs text-foreground-3 pl-5">{timezone}</span>
        )}
      </div>

      {/* Collapsible schedule */}
      {!noHours && !open247 && (
        <div className="mt-auto">
          <button
            onClick={() => setScheduleOpen(v => !v)}
            className="flex items-center gap-1 text-xs text-foreground-3 hover:text-foreground-2 transition-colors"
          >
            {scheduleOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {scheduleOpen ? t('businessStatus.hideSchedule') : t('businessStatus.viewSchedule')}
          </button>

          {scheduleOpen && (
            <div className="mt-2 space-y-0.5">
              {sortedHours.map(h => {
                const isToday = h.day === todayName;
                const dayKey = DAY_KEYS[DAY_ORDER.indexOf(h.day)];
                return (
                  <div
                    key={h.day}
                    className={`flex items-center justify-between py-0.5 px-2 rounded text-xs transition-colors ${
                      isToday ? 'bg-primary/8 text-foreground-1 font-medium' : ''
                    }`}
                  >
                    <span className={`w-8 ${isToday ? 'text-primary font-semibold' : 'text-foreground-3'}`}>
                      {dayKey ? t(`businessStatus.days.${dayKey}`) : h.day}
                      {isToday && <span className="ml-1 text-[9px] text-primary">•</span>}
                    </span>
                    <span className={h.isOpen ? 'text-foreground-2' : 'text-foreground-3'}>
                      {h.isOpen && h.openTime && h.closeTime
                        ? `${h.openTime}–${h.closeTime}`
                        : t('businessStatus.closedLabel')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
