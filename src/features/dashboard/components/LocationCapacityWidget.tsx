import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, MapPin, UserPlus } from 'lucide-react';
import type { LocationStaffMember } from '../actions';
import { formatPriceMinor } from '../../../shared/utils/currency';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../../shared/lib/permissions';

interface PeriodCapacity {
  filledPercentage: number;
  availablePercentage: number;
}

interface LocationCapacityWidgetProps {
  locationId: number;
  locationName: string;
  isCurrentlyOpen: boolean;
  staff: LocationStaffMember[] | null;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  potentialRevenueToday: number;
  potentialRevenueThisWeek: number;
  potentialRevenueThisMonth: number;
  capacity: {
    today: PeriodCapacity;
    week: PeriodCapacity;
    month: PeriodCapacity;
  };
  businessCurrency: string;
}

type Tier = { labelKey: string; colorVar: string; textClass: string; bgClass: string };

function capacityTier(pct: number): Tier {
  if (pct < 25) return { labelKey: 'capacityUtilization.low', colorVar: 'var(--warning)', textClass: 'text-warning', bgClass: 'bg-warning' };
  if (pct < 50) return { labelKey: 'capacityUtilization.moderate', colorVar: 'var(--info)', textClass: 'text-info', bgClass: 'bg-info' };
  if (pct < 80) return { labelKey: 'capacityUtilization.healthy', colorVar: 'var(--success)', textClass: 'text-success', bgClass: 'bg-success' };
  return { labelKey: 'capacityUtilization.high', colorVar: 'var(--error)', textClass: 'text-error', bgClass: 'bg-error' };
}

function CapacityBar({ pct, tier }: { pct: number; tier: Tier }) {
  const t = useTranslation('dashboard').t;
  const safe = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full">
      <div className="relative h-1.5 w-full rounded-full bg-surface-active overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${safe}%`, background: tier.colorVar }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums">
        <span className={`font-semibold ${tier.textClass}`}>{t(tier.labelKey)}</span>
        <span className="text-foreground-3">
          {Math.round(safe)}% {t('capacityUtilization.booked')}
        </span>
      </div>
    </div>
  );
}

function StatusPill({ open }: { open: boolean }) {
  const { t } = useTranslation('dashboard');
  const dotClass = open ? 'bg-success' : 'bg-error';
  const bgClass = open ? 'bg-success/10' : 'bg-error/10';
  const colorClass = open ? 'text-success' : 'text-error';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${bgClass} ${colorClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass} ${open ? 'animate-pulse' : ''}`} />
      {open ? t('todayOverview.openNow') : t('todayOverview.closed')}
    </span>
  );
}

function StaffAvatar({ member }: { member: LocationStaffMember }) {
  const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase();
  if (member.profileImage) {
    return (
      <img
        src={member.profileImage}
        alt={`${member.firstName} ${member.lastName}`}
        className="h-8 w-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
      <span className="text-[11px] font-bold text-primary">{initials}</span>
    </div>
  );
}

export function LocationCapacityWidget({
  locationId,
  locationName,
  isCurrentlyOpen,
  staff,
  appointmentsToday,
  appointmentsThisWeek,
  appointmentsThisMonth,
  potentialRevenueToday,
  potentialRevenueThisWeek,
  potentialRevenueThisMonth,
  capacity,
  businessCurrency,
}: LocationCapacityWidgetProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canSeeLocation = hasPermission(Permission.ACCESS_ASSIGNMENTS);

  const formatCurrency = (cents: number) => formatPriceMinor(cents, businessCurrency);

  const todayTier = capacityTier(capacity.today.filledPercentage);

  const periods = [
    {
      key: 'today',
      label: t('todayOverview.today'),
      appts: appointmentsToday,
      revenue: potentialRevenueToday,
      pct: capacity.today.filledPercentage,
    },
    {
      key: 'week',
      label: t('todayOverview.thisWeek'),
      appts: appointmentsThisWeek,
      revenue: potentialRevenueThisWeek,
      pct: capacity.week.filledPercentage,
    },
    {
      key: 'month',
      label: t('todayOverview.thisMonth'),
      appts: appointmentsThisMonth,
      revenue: potentialRevenueThisMonth,
      pct: capacity.month.filledPercentage,
    },
  ];

  const staffCount = staff?.length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary shrink-0">
            <MapPin className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground-1 truncate -tracking-[0.01em]">
                {locationName}
              </h3>
              <StatusPill open={isCurrentlyOpen} />
            </div>
            <p className="mt-0.5 text-xs text-foreground-3">
              {t('locationCapacity.subtitle', { id: locationId })}
            </p>
          </div>
        </div>
        {canSeeLocation && (
          <button
            onClick={() => navigate(`/assignments?locationId=${locationId}`)}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors cursor-pointer shrink-0"
          >
            <span className="text-xs font-semibold">{t('todayOverview.seeLocation')}</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Today headline strip */}
      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-surface-hover">
        <div className="px-4 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-3">
            {t('todayOverview.today')}
          </p>
          {appointmentsToday > 0 ? (
            <>
              <p className="mt-1 text-2xl font-semibold leading-none text-foreground-1 tabular-nums">
                {appointmentsToday}
              </p>
              <p className="mt-1 text-xs text-foreground-3">{t('todayOverview.appointments').toLowerCase()}</p>
            </>
          ) : (
            <p className="mt-1 text-sm font-semibold leading-tight text-foreground-2 break-words">
              {t('locationCapacity.noBookingsYet')}
            </p>
          )}
        </div>
        <div className="border-l border-border px-4 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-3">
            {t('locationCapacity.potential')}
          </p>
          {potentialRevenueToday > 0 ? (
            <>
              <p className="mt-1 text-2xl font-semibold leading-none text-foreground-1 tabular-nums">
                {formatCurrency(potentialRevenueToday)}
              </p>
              <p className="mt-1 text-xs text-foreground-3">{t('locationCapacity.revenueToday')}</p>
            </>
          ) : (
            <p className="mt-1 text-sm font-semibold leading-tight text-foreground-2 break-words">
              {t('locationCapacity.noRevenueYet')}
            </p>
          )}
        </div>
        <div className="border-l border-border px-4 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-3">
            {t('capacityUtilization.title')}
          </p>
          {capacity.today.filledPercentage > 0 ? (
            <>
              <p className="mt-1 text-2xl font-semibold leading-none text-foreground-1 tabular-nums">
                {Math.round(capacity.today.filledPercentage)}%
              </p>
              <p className={`mt-1 text-xs font-semibold ${todayTier.textClass}`}>{t(todayTier.labelKey)}</p>
            </>
          ) : (
            <p className="mt-1 text-sm font-semibold leading-tight text-foreground-2 break-words">
              {t('locationCapacity.fullyOpen')}
            </p>
          )}
        </div>
      </div>

      {/* Metrics table — desktop */}
      <div className="hidden md:block">
        <div
          className="grid items-center gap-4 border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-3"
          style={{ gridTemplateColumns: 'minmax(80px,0.7fr) minmax(60px,0.6fr) minmax(90px,0.7fr) minmax(140px,1.2fr)' }}
        >
          <span>{t('locationCapacity.period')}</span>
          <span>{t('locationCapacity.appts')}</span>
          <span>{t('todayOverview.revenue')}</span>
          <span>{t('locationCapacity.capacityBooked')}</span>
        </div>
        {periods.map((p, i) => {
          const tier = capacityTier(p.pct);
          return (
            <div
              key={p.key}
              className="grid items-center gap-4 py-3"
              style={{
                gridTemplateColumns: 'minmax(80px,0.7fr) minmax(60px,0.6fr) minmax(90px,0.7fr) minmax(140px,1.2fr)',
                borderBottom: i === periods.length - 1 ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              <span className="text-sm font-medium text-foreground-2">{p.label}</span>
              <span className="text-sm font-semibold text-foreground-1 tabular-nums">{p.appts}</span>
              <span className="text-sm font-semibold text-foreground-1 tabular-nums">
                {formatCurrency(p.revenue)}
              </span>
              <CapacityBar pct={p.pct} tier={tier} />
            </div>
          );
        })}
      </div>

      {/* Metrics rows — mobile */}
      <div className="flex flex-col md:hidden">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-3">
          {t('locationCapacity.weekAndMonth')}
        </p>
        {periods.slice(1).map((p, i, arr) => {
          const tier = capacityTier(p.pct);
          return (
            <div
              key={p.key}
              className={`py-3 ${i < arr.length - 1 ? 'border-b border-border-subtle' : ''}`}
            >
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-foreground-1">{p.label}</span>
                <span className="text-xs text-foreground-3">
                  <strong className="font-semibold text-foreground-1 tabular-nums">{p.appts}</strong>{' '}
                  {t('locationCapacity.apptsShort')} ·{' '}
                  <strong className="font-semibold text-foreground-1 tabular-nums">
                    {formatCurrency(p.revenue)}
                  </strong>
                </span>
              </div>
              <CapacityBar pct={p.pct} tier={tier} />
            </div>
          );
        })}
      </div>

      {/* Staff */}
      {staff && staff.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-3">
              {t('todayOverview.staff')} · {staffCount}
            </p>
            <button
              onClick={() => navigate('/team-members?action=invite')}
              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors cursor-pointer"
            >
              <UserPlus className="h-3 w-3" />
              <span className="text-xs font-semibold">{t('todayOverview.inviteStaff')}</span>
            </button>
          </div>
          <div className="flex flex-col divide-y divide-border-subtle">
            {staff.map((member) => (
              <div
                key={member.email}
                onClick={() => navigate(`/calendar?staffEmail=${encodeURIComponent(member.email)}`)}
                className="group/row flex items-center gap-3 py-2.5 cursor-pointer rounded transition-colors hover:bg-surface-active/40"
              >
                <StaffAvatar member={member} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground-1 leading-tight truncate">
                    {member.firstName} {member.lastName}
                  </p>
                  <div className="mt-0.5 hidden md:flex items-center gap-3 text-xs text-foreground-3">
                    <span className="truncate max-w-[260px]">{member.email}</span>
                    <span className="tabular-nums">{member.phone}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-foreground-3 md:hidden truncate">
                    {member.phone}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-foreground-3/50 transition-colors group-hover/row:text-primary" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-subtle pt-3 text-[11px] text-foreground-3">
        {[
          { labelKey: 'capacityUtilization.low', cls: 'bg-warning' },
          { labelKey: 'capacityUtilization.moderate', cls: 'bg-info' },
          { labelKey: 'capacityUtilization.healthy', cls: 'bg-success' },
          { labelKey: 'capacityUtilization.high', cls: 'bg-error' },
        ].map((l) => (
          <span key={l.labelKey} className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${l.cls}`} />
            {t(l.labelKey)}
          </span>
        ))}
      </div>
    </div>
  );
}
