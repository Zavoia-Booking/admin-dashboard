import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { normalizeWorkingHours } from './workingHoursUtils';

interface WorkingHoursWidgetProps {
  workingHours: Parameters<typeof normalizeWorkingHours>[0];
  timezone: string;
  isCurrentlyOpen: boolean;
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function getTodayDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

export function WorkingHoursWidget({
  workingHours: rawHours,
  timezone,
  isCurrentlyOpen,
}: WorkingHoursWidgetProps) {
  const { t } = useTranslation('dashboard');
  const workingHours = normalizeWorkingHours(rawHours);
  const todayName = getTodayDayName();
  const noHours = workingHours.length === 0;

  const sorted = DAY_ORDER.map(day =>
    workingHours.find(h => h.day === day) ?? { day, isOpen: false }
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-info-bg flex items-center justify-center">
          <Clock className="h-3.5 w-3.5 text-info" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
          {t('workingHours.title')}
        </p>
      </div>

      {noHours ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-foreground-3">{t('workingHours.hoursUnavailable')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 flex-1">
          {sorted.map(h => {
            const isToday = h.day === todayName;
            const dayKey = DAY_KEYS[DAY_ORDER.indexOf(h.day)];
            return (
              <div
                key={h.day}
                className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors ${
                  isToday
                    ? 'bg-primary/8 border border-primary/20'
                    : 'hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium w-8 ${
                      isToday ? 'text-primary font-semibold' : 'text-foreground-2'
                    }`}
                  >
                    {dayKey ? t(`workingHours.days.${dayKey}`) : h.day}
                  </span>
                  {isToday && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      isCurrentlyOpen
                        ? 'bg-success-bg text-success border border-success-border'
                        : 'bg-surface-active text-foreground-3 border border-border-subtle'
                    }`}>
                      {isCurrentlyOpen ? t('workingHours.nowOpen') : t('workingHours.today')}
                    </span>
                  )}
                </div>
                <span className={`text-xs tabular-nums ${
                  h.isOpen ? 'text-foreground-2' : 'text-foreground-3'
                }`}>
                  {h.isOpen && h.openTime && h.closeTime
                    ? `${h.openTime} – ${h.closeTime}`
                    : t('workingHours.closed')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Timezone footer */}
      {timezone && (
        <div className="flex items-center gap-1.5 border-t border-border-subtle pt-2">
          <Clock className="h-3 w-3 text-foreground-3" />
          <span className="text-[10px] text-foreground-3">{timezone}</span>
        </div>
      )}
    </div>
  );
}
