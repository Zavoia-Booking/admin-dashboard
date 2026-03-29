import { useTranslation } from 'react-i18next';
import { RadialGauge } from './RadialGauge';

interface PeriodCapacity {
  filledPercentage: number;
  availablePercentage: number;
}

interface CapacityUtilizationWidgetProps {
  today: PeriodCapacity;
  week: PeriodCapacity;
  month: PeriodCapacity;
}

function getUtilizationColor(pct: number): string {
  if (pct <= 25) return 'var(--warning)';
  if (pct <= 60) return 'var(--info)';
  if (pct <= 85) return 'var(--success)';
  return 'var(--error)';
}

function getUtilizationLabel(pct: number, t: (key: string) => string): string {
  if (pct <= 25) return t('capacityUtilization.low');
  if (pct <= 60) return t('capacityUtilization.moderate');
  if (pct <= 85) return t('capacityUtilization.healthy');
  return t('capacityUtilization.high');
}

export function CapacityUtilizationWidget({
  today,
  week,
  month,
}: CapacityUtilizationWidgetProps) {
  const { t } = useTranslation('dashboard');

  const gauges = [
    { filled: today.filledPercentage, available: today.availablePercentage, period: t('capacityUtilization.today') },
    { filled: week.filledPercentage, available: week.availablePercentage, period: t('capacityUtilization.thisWeek') },
    { filled: month.filledPercentage, available: month.availablePercentage, period: t('capacityUtilization.thisMonth') },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
        {t('capacityUtilization.title')}
      </p>

      {/* Three gauges — row on mobile, column on desktop */}
      <div className="flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1">
        {gauges.map(g => {
          const color = getUtilizationColor(g.filled);
          const label = getUtilizationLabel(g.filled, t);
          return (
            <div key={g.period} className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 flex-1 md:w-full">
              <RadialGauge
                value={g.filled}
                size={56}
                strokeWidth={6}
                color={color}
              />
              <div className="flex flex-col items-center md:items-start min-w-0">
                <span className="text-xs md:text-sm font-semibold text-foreground-1">{g.period}</span>
                <div className="flex flex-col md:flex-row items-center gap-0 md:gap-2">
                  <span className="text-[10px] md:text-xs" style={{ color }}>
                    {label}
                  </span>
                  <span className="text-[10px] md:text-xs text-foreground-3">
                    {g.available}% {t('capacityUtilization.available')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Utilization scale legend */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { range: '0–25%', labelKey: 'capacityUtilization.low', color: 'var(--warning)' },
          { range: '26–60%', labelKey: 'capacityUtilization.moderate', color: 'var(--info)' },
          { range: '61–85%', labelKey: 'capacityUtilization.healthy', color: 'var(--success)' },
          { range: '86–100%', labelKey: 'capacityUtilization.high', color: 'var(--error)' },
        ].map(l => (
          <div key={l.labelKey} className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
            <span className="text-[11px] text-foreground-3">{t(l.labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
