import { useTranslation } from 'react-i18next';
import { CalendarCheck, DollarSign, Users, Activity, AlertCircle } from 'lucide-react';

interface TodayPerformanceWidgetProps {
  appointments: number;
  revenue: number;
  staffAvailable: number;
  staffLoadPercentage: number;
}

interface MetricBlockProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  description?: string;
}

function MetricBlock({ icon, iconBg, label, description, value }: MetricBlockProps) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-hover border border-border-subtle">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-3">{label}</p>
        <p className="text-2xl font-bold text-foreground-1 leading-tight tabular-nums">{value}</p>
        {description && (
          <p className="text-[10px] text-foreground-3 mt-0.5 leading-tight">{description}</p>
        )}
      </div>
    </div>
  );
}

export function TodayPerformanceWidget({
  appointments,
  revenue,
  staffAvailable,
  staffLoadPercentage,
}: TodayPerformanceWidgetProps) {
  const { t, i18n } = useTranslation('dashboard');
  const hasNoRevenueDespiteBookings = appointments > 0 && revenue === 0;
  const isLowLoad = staffLoadPercentage < 25;

  const formatRevenue = (v: number) =>
    new Intl.NumberFormat(i18n.language === 'ro' ? 'ro-RO' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">{t('todayPerformance.title')}</p>
        <p className="text-[10px] text-foreground-3 mt-0.5">{t('todayPerformance.subtitle')}</p>
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        <MetricBlock
          icon={<CalendarCheck className="h-4 w-4 text-info" />}
          iconBg="bg-info-bg"
          label={t('todayPerformance.appointments')}
          value={String(appointments)}
          description={appointments === 1 ? t('todayPerformance.bookingToday') : t('todayPerformance.bookingsToday', { count: appointments })}
        />
        <MetricBlock
          icon={<DollarSign className="h-4 w-4 text-success" />}
          iconBg="bg-success-bg"
          label={t('todayPerformance.revenue')}
          value={formatRevenue(revenue)}
          description={t('todayPerformance.earnedToday')}
        />
        <MetricBlock
          icon={<Users className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label={t('todayPerformance.staffAvailable')}
          value={String(staffAvailable)}
          description={staffAvailable === 1 ? t('todayPerformance.staffOnDuty') : t('todayPerformance.staffOnDutyPlural', { count: staffAvailable })}
        />
        <MetricBlock
          icon={<Activity className="h-4 w-4 text-warning" />}
          iconBg="bg-warning-bg"
          label={t('todayPerformance.staffLoad')}
          value={`${staffLoadPercentage}%`}
          description={t('todayPerformance.capacityUsed')}
        />
      </div>

      {/* Smart insight notes */}
      {(hasNoRevenueDespiteBookings || isLowLoad) && (
        <div className="space-y-1.5">
          {hasNoRevenueDespiteBookings && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-warning-bg border border-warning-border">
              <AlertCircle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
              <p className="text-[10px] text-warning leading-tight">
                {t('todayPerformance.noRevenueDespiteBookings')}
              </p>
            </div>
          )}
          {isLowLoad && !hasNoRevenueDespiteBookings && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-info-bg border border-info-border">
              <AlertCircle className="h-3.5 w-3.5 text-info mt-0.5 shrink-0" />
              <p className="text-[10px] text-info leading-tight">
                {t('todayPerformance.capacityAvailable')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
