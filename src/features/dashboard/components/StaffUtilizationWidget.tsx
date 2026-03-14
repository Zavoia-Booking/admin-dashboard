import { useTranslation } from 'react-i18next';
import { Users, Info } from 'lucide-react';

interface StaffUtilizationWidgetProps {
  staffAvailable: number;
  staffLoadPercentage: number;
}

function getUtilizationColor(pct: number): string {
  if (pct <= 25) return 'bg-warning';
  if (pct <= 60) return 'bg-info';
  if (pct <= 85) return 'bg-success';
  return 'bg-error';
}

function getCapacityInsight(available: number, load: number, t: (key: string) => string): string {
  if (available === 0) return t('staffUtilization.insightNoData');
  if (load < 15) return t('staffUtilization.insightOpen');
  if (load < 40) return t('staffUtilization.insightLow');
  if (load < 70) return t('staffUtilization.insightModerate');
  if (load < 90) return t('staffUtilization.insightWellUtilized');
  return t('staffUtilization.insightFull');
}

export function StaffUtilizationWidget({
  staffAvailable,
  staffLoadPercentage,
}: StaffUtilizationWidgetProps) {
  const { t } = useTranslation('dashboard');
  const insight = getCapacityInsight(staffAvailable, staffLoadPercentage, t);
  const barColor = getUtilizationColor(staffLoadPercentage);

  return (
    <div className="flex flex-col gap-4 h-full">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
        {t('staffUtilization.title')}
      </p>

      {staffAvailable === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-foreground-3 text-center">{t('staffUtilization.noData')}</p>
        </div>
      ) : (
        <>
          {/* Staff count */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground-1 tabular-nums leading-none">
                {staffAvailable}
              </p>
              <p className="text-[10px] text-foreground-3 mt-0.5">
                {staffAvailable === 1 ? t('staffUtilization.staffMemberAvailable') : t('staffUtilization.staffMembersAvailable')}
              </p>
            </div>
          </div>

          {/* Utilization bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground-3">
                {t('staffUtilization.utilizationToday')}
              </span>
              <span className="text-sm font-bold text-foreground-1 tabular-nums">
                {staffLoadPercentage}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-surface-active overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-700`}
                style={{ width: `${Math.min(100, staffLoadPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-foreground-3">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </>
      )}

      {/* Insight */}
      <div className="flex items-start gap-1.5 border-t border-border-subtle pt-2 mt-auto">
        <Info className="h-3 w-3 text-foreground-3 mt-0.5 shrink-0" />
        <p className="text-[10px] text-foreground-3 leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}
