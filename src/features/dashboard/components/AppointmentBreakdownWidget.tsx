import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface AppointmentDistribution {
  pending: number;
  confirmed: number;
  completed: number;
  no_show: number;
  cancelled: number;
}

interface AppointmentBreakdownWidgetProps {
  todayDistribution: AppointmentDistribution;
  weeklyDistribution: AppointmentDistribution;
  monthlyDistribution: AppointmentDistribution;
}

type TabKey = 'today' | 'week' | 'month';

const STATUS_CONFIG: Array<{
  key: keyof AppointmentDistribution;
  labelKey: string;
  color: string;
  cssVar: string;
}> = [
  { key: 'confirmed', labelKey: 'appointmentBreakdown.confirmed', color: '#0077B6', cssVar: 'var(--info)' },
  { key: 'completed', labelKey: 'appointmentBreakdown.completed', color: '#2d7f5e', cssVar: 'var(--success)' },
  { key: 'pending', labelKey: 'appointmentBreakdown.pending', color: '#b87333', cssVar: 'var(--warning)' },
  { key: 'cancelled', labelKey: 'appointmentBreakdown.cancelled', color: '#d9534f', cssVar: 'var(--error)' },
  { key: 'no_show', labelKey: 'appointmentBreakdown.noShow', color: '#8b1a1a', cssVar: 'var(--error)' },
];

const TABS: Array<{ key: TabKey; labelKey: string }> = [
  { key: 'today', labelKey: 'appointmentBreakdown.today' },
  { key: 'week', labelKey: 'appointmentBreakdown.week' },
  { key: 'month', labelKey: 'appointmentBreakdown.month' },
];

function getInsight(dist: AppointmentDistribution, total: number, t: (key: string, opts?: Record<string, number>) => string): string {
  if (total === 0) return t('appointmentBreakdown.insightNoAppointments');
  if (dist.confirmed === total) return t('appointmentBreakdown.insightAllConfirmed');
  if (dist.completed === total) return t('appointmentBreakdown.insightAllCompleted');
  const cancelRate = Math.round((dist.cancelled / total) * 100);
  if (cancelRate > 30) return t('appointmentBreakdown.insightHighCancel', { pct: cancelRate });
  const completedPct = Math.round((dist.completed / total) * 100);
  if (completedPct > 50) return t('appointmentBreakdown.insightMajorityCompleted', { pct: completedPct });
  return t('appointmentBreakdown.insightSummary', {
    confirmed: dist.confirmed,
    completed: dist.completed,
    total,
  });
}

export function AppointmentBreakdownWidget({
  todayDistribution,
  weeklyDistribution,
  monthlyDistribution,
}: AppointmentBreakdownWidgetProps) {
  const { t } = useTranslation('dashboard');
  const [activeTab, setActiveTab] = useState<TabKey>('today');

  const distMap: Record<TabKey, AppointmentDistribution> = {
    today: todayDistribution,
    week: weeklyDistribution,
    month: monthlyDistribution,
  };

  const dist = distMap[activeTab];
  const total = Object.values(dist).reduce((a, b) => a + b, 0);

  const chartData = STATUS_CONFIG.filter(s => dist[s.key] > 0).map(s => ({
    name: t(s.labelKey),
    value: dist[s.key],
    color: s.color,
  }));

  // Fallback for empty donut
  const displayData = chartData.length > 0
    ? chartData
    : [{ name: t('appointmentBreakdown.empty'), value: 1, color: 'var(--surface-active)' }];

  const insight = getInsight(dist, total, t);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header + tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
          {t('appointmentBreakdown.title')}
        </p>
        <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-surface-active border border-border-subtle">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-surface shadow-sm text-foreground-1 border border-border'
                  : 'text-foreground-3 hover:text-foreground-2'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart + legend */}
      <div className="flex items-center gap-4 flex-1 min-h-0">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={54}
                paddingAngle={chartData.length > 1 ? 2 : 0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {total > 0 && (
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any, name: any) => [
                    `${Number(value)} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
                    String(name ?? ''),
                  ])}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-foreground-1 tabular-nums leading-none">{total}</span>
            <span className="text-[9px] text-foreground-3 leading-tight">{t('appointmentBreakdown.appts')}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {STATUS_CONFIG.map(s => {
            const count = dist[s.key];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-foreground-2 flex-1 truncate">{t(s.labelKey)}</span>
                <span className="text-xs font-semibold text-foreground-1 tabular-nums w-5 text-right">{count}</span>
                <span className="text-[10px] text-foreground-3 tabular-nums w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight */}
      <p className="text-[10px] text-foreground-3 leading-relaxed border-t border-border-subtle pt-2">
        {insight}
      </p>
    </div>
  );
}
