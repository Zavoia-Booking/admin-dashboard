import { useTranslation } from 'react-i18next';
import { Calendar, TrendingUp } from 'lucide-react';

interface AppointmentsVolumeWidgetProps {
  weeklyAppointments: number;
  monthlyAppointments: number;
}

export function AppointmentsVolumeWidget({
  weeklyAppointments,
  monthlyAppointments,
}: AppointmentsVolumeWidgetProps) {
  const { t } = useTranslation('dashboard');
  const weekShare = monthlyAppointments > 0
    ? Math.round((weeklyAppointments / monthlyAppointments) * 100)
    : 0;

  const avgWeeklyImplied = monthlyAppointments > 0
    ? (monthlyAppointments / 4.33).toFixed(1)
    : null;

  let paceInsight = '';
  if (monthlyAppointments === 0) {
    paceInsight = t('appointmentsVolume.noAppointmentsMonth');
  } else if (weekShare < 10) {
    paceInsight = t('appointmentsVolume.paceLow');
  } else if (weekShare > 40) {
    paceInsight = t('appointmentsVolume.paceStrong');
  } else {
    paceInsight = t('appointmentsVolume.paceNormal', { pct: weekShare });
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
        {t('appointmentsVolume.title')}
      </p>

      {/* KPI blocks */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {/* Weekly */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-hover border border-border-subtle">
          <div className="h-7 w-7 rounded-lg bg-info-bg flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-info" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-3">{t('appointmentsVolume.thisWeek')}</p>
            <p className="text-3xl font-bold text-foreground-1 tabular-nums leading-none mt-1">
              {weeklyAppointments}
            </p>
            {avgWeeklyImplied && (
              <p className="text-[10px] text-foreground-3 mt-1">
                {t('appointmentsVolume.avgImplied', { avg: avgWeeklyImplied })}
              </p>
            )}
          </div>
        </div>

        {/* Monthly */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-hover border border-border-subtle">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-3">{t('appointmentsVolume.thisMonth')}</p>
            <p className="text-3xl font-bold text-foreground-1 tabular-nums leading-none mt-1">
              {monthlyAppointments}
            </p>
            {weekShare > 0 && (
              <p className="text-[10px] text-foreground-3 mt-1">
                {t('appointmentsVolume.weekShare', { pct: weekShare })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar: week share of month */}
      {monthlyAppointments > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-foreground-3">
            <span>{t('appointmentsVolume.weekShareOfMonth')}</span>
            <span className="tabular-nums">{weekShare}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-active overflow-hidden">
            <div
              className="h-full rounded-full bg-info transition-all duration-700"
              style={{ width: `${Math.min(100, weekShare)}%` }}
            />
          </div>
        </div>
      )}

      {/* Insight */}
      <div className="flex items-start gap-1.5 border-t border-border-subtle pt-2">
        <TrendingUp className="h-3 w-3 text-foreground-3 mt-0.5 shrink-0" />
        <p className="text-[10px] text-foreground-3 leading-relaxed">{paceInsight}</p>
      </div>
    </div>
  );
}
