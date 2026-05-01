import { useState, useRef, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, ArrowUpRight, User } from 'lucide-react';

import type { AppointmentDistribution, UpcomingAppointment } from '../actions';
import { formatPriceMinor } from '../../../shared/utils/currency';

interface AppointmentBreakdownWidgetProps {
  todayDistribution: AppointmentDistribution;
  weeklyDistribution: AppointmentDistribution;
  monthlyDistribution: AppointmentDistribution;
  upcomingAppointments: UpcomingAppointment[];
  businessCurrency: string;
}

type TabKey = 'today' | 'week' | 'month';

const STATUS_CONFIG: Array<{
  key: keyof AppointmentDistribution;
  labelKey: string;
  color: string;
}> = [
  { key: 'confirmed', labelKey: 'appointmentBreakdown.confirmed', color: '#6B8DC7' },
  { key: 'completed', labelKey: 'appointmentBreakdown.completed', color: '#2EA88E' },
  { key: 'pending', labelKey: 'appointmentBreakdown.pending', color: '#A78BCA' },
  { key: 'cancelled', labelKey: 'appointmentBreakdown.cancelled', color: '#E8785E' },
  { key: 'no_show', labelKey: 'appointmentBreakdown.noShow', color: '#E8B44C' },
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

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPercentageLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, percent, fill } = props;
  if (!percent || percent < 0.03) return null;

  const radius = (outerRadius ?? 0) + 2;
  const x = (cx ?? 0) + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const y = (cy ?? 0) + radius * Math.sin(-(midAngle ?? 0) * RADIAN);
  const pctText = `${Math.round(percent * 100)}%`;
  const pillWidth = pctText.length > 3 ? 44 : 38;
  const pillHeight = 24;

  return (
    <g filter="url(#pill-shadow)">
      <rect
        x={x - pillWidth / 2}
        y={y - pillHeight / 2}
        width={pillWidth}
        height={pillHeight}
        rx={pillHeight / 2}
        fill={fill}
      />
      <rect
        x={x - pillWidth / 2}
        y={y - pillHeight / 2}
        width={pillWidth}
        height={pillHeight}
        rx={pillHeight / 2}
        fill="none"
        stroke="white"
        strokeWidth={2.5}
      />
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
      >
        {pctText}
      </text>
    </g>
  );
}

export function AppointmentBreakdownWidget({
  todayDistribution,
  weeklyDistribution,
  monthlyDistribution,
  upcomingAppointments,
  businessCurrency,
}: AppointmentBreakdownWidgetProps) {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('today');

  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const container = tabListRef.current;
    const activeBtn = tabRefs.current[activeTab];
    if (!container || !activeBtn) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    setIndicatorStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, [activeTab]);

  const locale = i18n.language;

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

  const displayData = chartData.length > 0
    ? chartData
    : [{ name: t('appointmentBreakdown.empty'), value: 1, color: 'var(--surface-active)' }];

  const insight = getInsight(dist, total, t);

  const next3 = upcomingAppointments.slice(0, 3);

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString(locale === 'ro' ? 'ro-RO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatCurrency = (cents: number) => formatPriceMinor(cents, businessCurrency);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
        {t('appointmentBreakdown.title')}
      </p>

      {/* Two-column body — stacks on mobile */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Left: tabs + donut + legend */}
        <div className="flex flex-col gap-3 w-full md:w-[30%] md:min-w-[200px] md:shrink-0">
          {/* Period tabs — underline style */}
          <div className="relative flex items-stretch gap-4 border-b border-border-subtle" ref={tabListRef}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                ref={el => { tabRefs.current[tab.key] = el; }}
                onClick={() => setActiveTab(tab.key)}
                className={`relative z-10 px-1 pb-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-foreground-1'
                    : 'text-foreground-3 hover:text-foreground-2 cursor-pointer'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
            <span
              className="pointer-events-none absolute -bottom-[1px] h-0.5 rounded-full bg-primary transition-all duration-300 ease-out"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          </div>

          {/* Donut with floating percentage pills */}
          <div className="flex justify-center">
            <div className="relative" style={{ width: 230, height: 230 }}>
              <ResponsiveContainer width={230} height={230}>
                <PieChart>
                  <defs>
                    <filter id="pill-shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
                    </filter>
                  </defs>
                  <Pie
                    data={displayData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={chartData.length > 1 ? 5 : 0}
                    cornerRadius={6}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                    animationDuration={600}
                    label={chartData.length > 0 ? renderPercentageLabel : undefined}
                    labelLine={false}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-foreground-1 tabular-nums leading-none">{total}</span>
                <span className="text-xs text-foreground-3 leading-tight mt-0.5">{t('appointmentBreakdown.appts')}</span>
              </div>
            </div>
          </div>

          {/* Horizontal legend */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {STATUS_CONFIG.filter(s => dist[s.key] > 0).map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-foreground-2">{t(s.labelKey)}</span>
              </div>
            ))}
          </div>

          {/* Insight */}
          <p className="text-xs text-foreground-3 leading-relaxed border-t border-border-subtle pt-2">
            {insight}
          </p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border-subtle shrink-0" />
        <div className="md:hidden h-px bg-border-subtle shrink-0" />

        {/* Right: upcoming appointments (~75%) */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-foreground-3" />
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
              {t('upcomingAppointments.title')}
            </p>
          </div>

          {next3.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4">
              <User className="h-6 w-6 text-foreground-3 opacity-30" />
              <p className="text-xs text-foreground-3 text-center">{t('upcomingAppointments.noUpcoming')}</p>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Table header — desktop only */}
              <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-3 items-center px-2 pb-1.5 border-b border-border-subtle">
                <span className="text-xs font-medium text-foreground-3">{t('upcomingAppointments.customer')}</span>
                <span className="text-xs font-medium text-foreground-3">{t('upcomingAppointments.staff')}</span>
                <span className="text-xs font-medium text-foreground-3">{t('upcomingAppointments.service')}</span>
                <span className="text-xs font-medium text-foreground-3 w-14 text-right">{t('upcomingAppointments.time')}</span>
                <span className="text-xs font-medium text-foreground-3 w-12 text-right">{t('upcomingAppointments.duration')}</span>
                <span className="text-xs font-medium text-foreground-3 w-16 text-right">{t('upcomingAppointments.price')}</span>
              </div>
              {/* Table rows */}
              <div className="flex flex-col divide-y divide-border-subtle">
                {next3.map(appt => {
                  const customerParts = [appt.customerSnapshot.firstName, appt.customerSnapshot.lastName].filter(Boolean);
                  const customerName = customerParts.join(' ');
                  const initials = customerParts.map(p => p[0]).join('').toUpperCase();
                  const staff = appt.staffSnapshot[0];
                  const staffName = staff
                    ? [staff.firstName, staff.lastName].filter(Boolean).join(' ') || '—'
                    : '—';
                  return (
                    <div
                      key={appt.uuid}
                      onClick={() => navigate(`/calendar?appointmentUuid=${appt.uuid}`)}
                      className="cursor-pointer hover:bg-surface-active/40 rounded transition-colors duration-150"
                    >
                      {/* Desktop row */}
                      <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-3 items-center px-2 py-3.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {appt.customerSnapshot.profileImage ? (
                            <img src={appt.customerSnapshot.profileImage} alt={customerName} className="h-6 w-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-primary">{initials}</span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-foreground-1 truncate">{customerName}</span>
                        </div>
                        <span className="text-xs text-foreground-3 truncate">{staffName}</span>
                        <span className="text-xs text-foreground-3 truncate">{appt.bookedItemName}</span>
                        <span className="text-xs text-foreground-2 tabular-nums w-14 text-right">{formatTime(appt.scheduledAt)}</span>
                        <span className="text-xs text-foreground-3 tabular-nums w-12 text-right">{appt.duration}m</span>
                        <span className="text-xs font-medium text-success tabular-nums w-16 text-right">{formatCurrency(appt.price)}</span>
                      </div>
                      {/* Mobile card */}
                      <div className="flex md:hidden items-center gap-2.5 px-2 py-3">
                        {appt.customerSnapshot.profileImage ? (
                          <img src={appt.customerSnapshot.profileImage} alt={customerName} className="h-8 w-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-primary">{initials}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground-1 truncate">{customerName}</p>
                          <p className="text-xs text-foreground-3 truncate">{appt.bookedItemName} &middot; {staffName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-foreground-2 tabular-nums">{formatTime(appt.scheduledAt)}</p>
                          <p className="text-xs font-medium text-success tabular-nums">{formatCurrency(appt.price)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors cursor-pointer mt-auto self-end"
          >
            <span className="text-xs font-medium">{t('upcomingAppointments.seeAppointments')}</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
