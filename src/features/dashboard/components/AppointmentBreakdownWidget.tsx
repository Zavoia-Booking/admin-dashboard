import { useState, useRef, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, User } from 'lucide-react';

import type { AppointmentDistribution, UpcomingAppointment } from '../actions';
import { useFormatPrice } from '../../../shared/hooks/useFormatPrice';
import { PersonAvatar } from '../../../shared/components/common/PersonAvatar';

const EYEBROW =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-500';
const IOS_EASE = '[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]';

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

// Keep in sync with the donut wrapper's h-/w- classes below. ResponsiveContainer only
// learns its size from a ResizeObserver in an effect, so without a seed the first render
// is -1x-1: recharts logs a warning (in prod too) and paints an empty frame.
const DONUT_SIZE_SM = 180;
const DONUT_SIZE_MD = 230;
const MD_BREAKPOINT = 768;

function getInitialDonutSize() {
  const size =
    typeof window !== 'undefined' && window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`).matches
      ? DONUT_SIZE_MD
      : DONUT_SIZE_SM;
  return { width: size, height: size };
}

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

  const dateLocale = locale === 'ro' ? 'ro-RO' : 'en-US';

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString(dateLocale, {
      hour: '2-digit',
      minute: '2-digit',
    });

  // The next few appointments can sit days apart, so an hour on its own is ambiguous.
  // Relative wording covers the common case; anything further out gets a short
  // "12 Aug" that stays unambiguous without eating column width.
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const formatDay = (isoString: string) => {
    const date = new Date(isoString);
    const dayDiff = Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000);
    if (dayDiff === 0) return t('upcomingAppointments.today');
    if (dayDiff === 1) return t('upcomingAppointments.tomorrow');
    return date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
  };

  const { formatPrice } = useFormatPrice();
  const formatCurrency = (cents: number) => formatPrice(cents, businessCurrency);

  const activeStatusCount = STATUS_CONFIG.filter(s => dist[s.key] > 0).length;

  const [initialDonutSize] = useState(getInitialDonutSize);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <p className={EYEBROW}>{t('appointmentBreakdown.title')}</p>

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
              className={`pointer-events-none absolute -bottom-[1px] h-0.5 rounded-full bg-primary transition-[left,width] duration-300 ${IOS_EASE}`}
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          </div>

          {/* Donut with floating percentage pills */}
          <div className="flex justify-center">
            <div className="relative h-[180px] w-[180px] md:h-[230px] md:w-[230px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
                initialDimension={initialDonutSize}
              >
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
                    innerRadius="42%"
                    outerRadius="66%"
                    paddingAngle={chartData.length > 1 ? 5 : 0}
                    cornerRadius={6}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                    animationDuration={600}
                    animationEasing="ease-out"
                    label={chartData.length > 1 ? renderPercentageLabel : undefined}
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

          {/* Horizontal legend — only shown when ≥2 categories (single-cat is redundant with the donut color) */}
          {activeStatusCount > 1 && (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {STATUS_CONFIG.filter(s => dist[s.key] > 0).map(s => (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-foreground-2">{t(s.labelKey)}</span>
                </div>
              ))}
            </div>
          )}

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
          <p className={EYEBROW}>{t('upcomingAppointments.title')}</p>

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
                <span className="text-xs font-medium text-foreground-3 w-16 text-right">{t('upcomingAppointments.when')}</span>
                <span className="text-xs font-medium text-foreground-3 w-12 text-right">{t('upcomingAppointments.duration')}</span>
                <span className="text-xs font-medium text-foreground-3 w-16 text-right">{t('upcomingAppointments.price')}</span>
              </div>
              {/* Table rows */}
              <div className="flex flex-col divide-y divide-border-subtle">
                {next3.map(appt => {
                  const customer = appt.customerSnapshot;
                  const hasCustomerName = !!(customer?.firstName || customer?.lastName);
                  const customerName = hasCustomerName
                    ? [customer!.firstName, customer!.lastName].filter(Boolean).join(' ')
                    : t('upcomingAppointments.guestCustomer');
                  const avatarKey = customer?.userId ?? appt.uuid;
                  const staff = appt.staffSnapshot[0];
                  const staffName = staff
                    ? [staff.firstName, staff.lastName].filter(Boolean).join(' ') || '·'
                    : '·';
                  return (
                    <div
                      key={appt.uuid}
                      // Both params on purpose: `date` lands on the right day without waiting
                      // on a request, `appointmentUuid` opens the drawer once the detail
                      // resolves. If that request fails you still get the correct day.
                      onClick={() =>
                        navigate(
                          `/calendar?date=${encodeURIComponent(appt.scheduledAt)}&appointmentUuid=${appt.uuid}`,
                        )
                      }
                      className={`cursor-pointer hover:bg-surface-active/40 active:bg-surface-active/60 active:scale-[0.995] rounded transition-[background-color,transform] duration-150 ${IOS_EASE}`}
                    >
                      {/* Desktop row */}
                      <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-3 items-center px-2 py-3.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <PersonAvatar
                            id={avatarKey}
                            firstName={customer?.firstName}
                            lastName={customer?.lastName}
                            profileImage={customer?.profileImage}
                            className="size-6"
                            initialsClassName="text-[10px] font-semibold"
                          />
                          <span className="text-sm font-medium text-foreground-1 truncate">{customerName}</span>
                        </div>
                        <span className="text-xs text-foreground-3 truncate">{staffName}</span>
                        <span className="text-xs text-foreground-3 truncate">{appt.bookedItemName}</span>
                        <div className="w-16 text-right">
                          <span className="block text-[11px] text-foreground-3 truncate leading-tight">
                            {formatDay(appt.scheduledAt)}
                          </span>
                          <span className="block text-xs text-foreground-2 tabular-nums leading-tight">
                            {formatTime(appt.scheduledAt)}
                          </span>
                        </div>
                        <span className="text-xs text-foreground-3 tabular-nums w-12 text-right">{appt.duration}m</span>
                        <span className="text-xs font-medium text-success tabular-nums w-16 text-right">{formatCurrency(appt.price)}</span>
                      </div>
                      {/* Mobile card */}
                      <div className="flex md:hidden items-center gap-2.5 px-2 py-3">
                        <PersonAvatar
                          id={avatarKey}
                          firstName={customer?.firstName}
                          lastName={customer?.lastName}
                          profileImage={customer?.profileImage}
                          className="size-8"
                          initialsClassName="text-[10px] font-semibold"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground-1 truncate">{customerName}</p>
                          <p className="text-xs text-foreground-3 truncate">{appt.bookedItemName} &middot; {staffName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-foreground-2 tabular-nums whitespace-nowrap">
                            {formatDay(appt.scheduledAt)} &middot; {formatTime(appt.scheduledAt)}
                          </p>
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
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-primary hover:bg-primary/10 active:bg-primary/15 active:scale-[0.97] transition-[background-color,transform] cursor-pointer mt-auto self-end ${IOS_EASE}`}
          >
            <span className="text-xs font-medium">{t('upcomingAppointments.seeAppointments')}</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
