import { useTranslation } from 'react-i18next';
import { RadialGauge } from './RadialGauge';
import { Info } from 'lucide-react';

interface CapacityUtilizationWidgetProps {
  staffLoadPercentage: number;
  weeklyLoadPercentage: number;
  monthlyLoadPercentage: number;
}

function getUtilizationLabel(pct: number, t: (key: string) => string): { label: string; color: string } {
  if (pct <= 25) return { label: t('capacityUtilization.low'), color: 'var(--warning)' };
  if (pct <= 60) return { label: t('capacityUtilization.moderate'), color: 'var(--info)' };
  if (pct <= 85) return { label: t('capacityUtilization.healthy'), color: 'var(--success)' };
  return { label: t('capacityUtilization.high'), color: 'var(--error)' };
}

function getInsight(today: number, weekly: number, monthly: number, t: (key: string) => string): string {
  const avg = (today + weekly + monthly) / 3;
  if (avg < 15) return t('capacityUtilization.insightUnderutilized');
  if (avg < 30) return t('capacityUtilization.insightLow');
  if (avg < 60) return t('capacityUtilization.insightModerate');
  if (avg < 85) return t('capacityUtilization.insightHealthy');
  return t('capacityUtilization.insightFull');
}

export function CapacityUtilizationWidget({
  staffLoadPercentage,
  weeklyLoadPercentage,
  monthlyLoadPercentage,
}: CapacityUtilizationWidgetProps) {
  const { t } = useTranslation('dashboard');
  const insight = getInsight(staffLoadPercentage, weeklyLoadPercentage, monthlyLoadPercentage, t);

  const gauges = [
    { value: staffLoadPercentage, period: t('capacityUtilization.today'), ...getUtilizationLabel(staffLoadPercentage, t) },
    { value: weeklyLoadPercentage, period: t('capacityUtilization.thisWeek'), ...getUtilizationLabel(weeklyLoadPercentage, t) },
    { value: monthlyLoadPercentage, period: t('capacityUtilization.thisMonth'), ...getUtilizationLabel(monthlyLoadPercentage, t) },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
        {t('capacityUtilization.title')}
      </p>

      {/* Three gauges */}
      <div className="flex flex-col items-center gap-3 flex-1">
        {gauges.map(g => (
          <div key={g.period} className="flex items-center gap-3 w-full">
            <RadialGauge
              value={g.value}
              size={56}
              strokeWidth={6}
              color={g.color}
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground-1">{g.period}</span>
              <span className="text-[9px]" style={{ color: g.color }}>
                {g.label}
              </span>
            </div>
          </div>
        ))}
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
            <span className="text-[9px] text-foreground-3">{t(l.labelKey)}</span>
          </div>
        ))}
      </div>

      {/* Insight */}
      <div className="flex items-start gap-1.5 border-t border-border-subtle pt-2">
        <Info className="h-3 w-3 text-foreground-3 mt-0.5 shrink-0" />
        <p className="text-[10px] text-foreground-3 leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}
