import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, DollarSign, ArrowUpRight, UserPlus, ChevronRight } from 'lucide-react';
import type { LocationStaffMember } from '../actions';

interface TodayOverviewWidgetProps {
  locationId: number;
  locationName: string;
  isCurrentlyOpen: boolean;
  staff: LocationStaffMember[];
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  potentialRevenueToday: number;
  potentialRevenueThisWeek: number;
  potentialRevenueThisMonth: number;
}

export function TodayOverviewWidget({
  locationId,
  isCurrentlyOpen,
  staff,
  appointmentsToday,
  appointmentsThisWeek,
  appointmentsThisMonth,
  potentialRevenueToday,
  potentialRevenueThisWeek,
  potentialRevenueThisMonth,
}: TodayOverviewWidgetProps) {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();

  const locale = i18n.language === 'ro' ? 'ro-RO' : 'en-US';

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);

  const periods = [
    { labelKey: 'todayOverview.today', appointments: appointmentsToday, revenue: potentialRevenueToday },
    { labelKey: 'todayOverview.thisWeek', appointments: appointmentsThisWeek, revenue: potentialRevenueThisWeek },
    { labelKey: 'todayOverview.thisMonth', appointments: appointmentsThisMonth, revenue: potentialRevenueThisMonth },
  ];

  const maxAppointments = Math.max(appointmentsToday, appointmentsThisWeek, appointmentsThisMonth, 1);
  const maxRevenue = Math.max(potentialRevenueToday, potentialRevenueThisWeek, potentialRevenueThisMonth, 1);

  const statusLabel = isCurrentlyOpen
    ? t('todayOverview.openNow')
    : t('todayOverview.closed');

  const statusColor = isCurrentlyOpen ? 'text-success' : 'text-error';
  const statusBg = isCurrentlyOpen ? 'bg-success/5' : 'bg-error/5';
  const statusDot = isCurrentlyOpen ? 'bg-success' : 'bg-error';

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
            {t('todayOverview.title')}
          </p>
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusBg} ${statusColor}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDot} ${isCurrentlyOpen ? 'animate-pulse' : ''}`}
            />
            {statusLabel}
          </div>
        </div>
        <button
          onClick={() => navigate(`/assignments?locationId=${locationId}`)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-medium">{t('todayOverview.seeLocation')}</span>
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {/* Metrics — inline bars showing all periods at once */}
      <div className="grid grid-cols-2 gap-5">
        {/* Appointments */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-info" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-3">
              {t('todayOverview.appointments')}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {periods.map((p) => {
              const pct = maxAppointments > 0 ? (p.appointments / maxAppointments) * 100 : 0;
              return (
                <div key={p.labelKey} className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground-3 w-[88px] shrink-0 truncate">
                    {t(p.labelKey)}
                  </span>
                  <div className="flex-1 h-2 bg-surface-active rounded-full overflow-hidden">
                    <div
                      className="h-full bg-info rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground-1 tabular-nums w-6 text-right shrink-0">
                    {p.appointments}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-success" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-3">
              {t('todayOverview.potentialRevenue')}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {periods.map((p) => {
              const pct = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={p.labelKey} className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground-3 w-[88px] shrink-0 truncate">
                    {t(p.labelKey)}
                  </span>
                  <div className="flex-1 h-2 bg-surface-active rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground-1 tabular-nums text-right shrink-0">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff */}
      {staff.length > 0 && (
        <div className="flex flex-col gap-2 pt-4 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
              {t('todayOverview.staff')} ({staff.length})
            </p>
            <button
              onClick={() => navigate('/team-members?action=invite')}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors cursor-pointer"
            >
              <UserPlus className="h-3 w-3" />
              <span className="text-[11px] font-medium">{t('todayOverview.inviteStaff')}</span>
            </button>
          </div>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center px-1 pb-1 border-b border-border-subtle">
            <span className="text-[10px] font-medium text-foreground-3">{t('todayOverview.staffName')}</span>
            <span className="text-[10px] font-medium text-foreground-3">{t('todayOverview.staffEmail')}</span>
            <span className="text-[10px] font-medium text-foreground-3">{t('todayOverview.staffPhone')}</span>
            <span className="w-5" />
          </div>
          {/* Table rows */}
          <div className="flex flex-col divide-y divide-border-subtle">
            {staff.map((member) => {
              const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
              return (
                <div
                  key={member.email}
                  onClick={() => navigate(`/calendar?staffEmail=${encodeURIComponent(member.email)}`)}
                  className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center px-1 py-2 hover:bg-surface-active/40 rounded transition-colors duration-150 cursor-pointer group/row"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {member.profileImage ? (
                      <img
                        src={member.profileImage}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="h-7 w-7 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-primary">{initials}</span>
                      </div>
                    )}
                    <span className="text-[11px] font-medium text-foreground-1 truncate">
                      {member.firstName} {member.lastName}
                    </span>
                  </div>
                  <span className="text-[11px] text-foreground-3 truncate">
                    {member.email}
                  </span>
                  <span className="text-[11px] text-foreground-3 truncate">
                    {member.phone}
                  </span>
                  <ChevronRight className="h-4 w-4 text-foreground-3/50 group-hover/row:text-primary transition-colors duration-150" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
