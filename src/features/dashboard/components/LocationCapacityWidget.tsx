import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, MapPin, UserPlus } from 'lucide-react';
import type { CapacityPeriod, LocationStaffMember, UpcomingAppointment } from '../actions';
import { useFormatPrice } from '../../../shared/hooks/useFormatPrice';
import { formatPhone } from '../../../shared/utils/phone';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../../shared/lib/permissions';
import { DashedDivider } from '../../../shared/components/common/DashedDivider';
import { PersonAvatar } from '../../../shared/components/common/PersonAvatar';

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
    today: CapacityPeriod;
    week: CapacityPeriod;
    month: CapacityPeriod;
  };
  nextAppointment?: UpcomingAppointment | null;
  businessCurrency: string;
}

type Tier = { labelKey: string; colorVar: string; textClass: string; bgClass: string };

const EYEBROW =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-500';

// iOS-style easing — same curve used in BaseSlider / drawer transitions.
const IOS_EASE = '[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]';

function capacityTier(pct: number): Tier {
  if (pct < 25) return { labelKey: 'capacityUtilization.low', colorVar: 'var(--warning)', textClass: 'text-warning', bgClass: 'bg-warning' };
  if (pct < 50) return { labelKey: 'capacityUtilization.moderate', colorVar: 'var(--info)', textClass: 'text-info', bgClass: 'bg-info' };
  if (pct < 80) return { labelKey: 'capacityUtilization.healthy', colorVar: 'var(--success)', textClass: 'text-success', bgClass: 'bg-success' };
  return { labelKey: 'capacityUtilization.high', colorVar: 'var(--error)', textClass: 'text-error', bgClass: 'bg-error' };
}

function CapacityBar({ pct, tier, measured }: { pct: number; tier: Tier; measured: boolean }) {
  const t = useTranslation('dashboard').t;
  const safe = Math.max(0, Math.min(100, pct));

  // Nothing to divide by — no opening hours, or nobody assigned to work them.
  // An empty bar reading "0% booked" would claim the period is wide open.
  if (!measured) {
    return (
      <div className="w-full">
        <div className="h-2 w-full rounded-full border border-dashed border-border-strong/60" />
        <p className="mt-1 text-[11px] text-foreground-3">{t('capacityUtilization.notMeasured')}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative h-2 w-full rounded-full bg-surface-active overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ${IOS_EASE}`}
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
  nextAppointment,
  businessCurrency,
}: LocationCapacityWidgetProps) {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canSeeLocation = hasPermission(Permission.ACCESS_ASSIGNMENTS);

  const { formatPrice } = useFormatPrice();
  const formatCurrency = (cents: number) => formatPrice(cents, businessCurrency);
  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString(i18n.language === 'ro' ? 'ro-RO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  const nextCustomerName =
    (nextAppointment?.customerSnapshot
      ? [nextAppointment.customerSnapshot.firstName, nextAppointment.customerSnapshot.lastName]
          .filter(Boolean)
          .join(' ')
      : '') || t('upcomingAppointments.guestCustomer');

  const todayTier = capacityTier(capacity.today.filledPercentage);
  // Older API responses carry no flag; treat those as measured so the widget
  // keeps rendering percentages instead of flipping everything to "unknown".
  const isMeasured = (period: CapacityPeriod) => period.hasCapacityData !== false;
  const todayMeasured = isMeasured(capacity.today);

  const periods = [
    {
      key: 'today',
      label: t('todayOverview.today'),
      appts: appointmentsToday,
      revenue: potentialRevenueToday,
      pct: capacity.today.filledPercentage,
      measured: todayMeasured,
    },
    {
      key: 'week',
      label: t('todayOverview.thisWeek'),
      appts: appointmentsThisWeek,
      revenue: potentialRevenueThisWeek,
      pct: capacity.week.filledPercentage,
      measured: isMeasured(capacity.week),
    },
    {
      key: 'month',
      label: t('todayOverview.thisMonth'),
      appts: appointmentsThisMonth,
      revenue: potentialRevenueThisMonth,
      pct: capacity.month.filledPercentage,
      measured: isMeasured(capacity.month),
    },
  ];

  // On mobile the Today block carries the visual weight, so the desktop
  // table only needs week + month to avoid duplication.
  const desktopPeriods = periods.slice(1);
  const mobilePeriods = periods.slice(1);

  const staffCount = staff?.length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header — mobile (real title hierarchy + distinct navigate button) */}
      <div className="md:hidden flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[22px] font-semibold -tracking-[0.02em] text-foreground-1 leading-[1.1]">
            {locationName}
          </h3>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isCurrentlyOpen ? 'bg-success animate-pulse' : 'bg-error'
              }`}
            />
            <span
              className={`font-medium ${isCurrentlyOpen ? 'text-success' : 'text-error'}`}
            >
              {isCurrentlyOpen ? t('todayOverview.openNow') : t('todayOverview.closed')}
            </span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-foreground-3">
            {t('locationCapacity.subtitle')}
          </p>
        </div>
        {canSeeLocation && (
          <button
            type="button"
            onClick={() => navigate(`/assignments?locationId=${locationId}`)}
            aria-label={`${t('todayOverview.goToLocation')}: ${locationName}`}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-primary transition-all hover:bg-primary/5 active:scale-[0.95] active:bg-primary/10 ${IOS_EASE}`}
          >
            <ArrowUpRight className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {/* Header — desktop (MapPin + title + see-location link) */}
      <div className="hidden md:flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center text-primary shrink-0">
            <MapPin className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground-1 truncate -tracking-[0.01em]">
                {locationName}
              </h3>
              <StatusPill open={isCurrentlyOpen} />
            </div>
            <p className="mt-1 max-w-[68ch] text-xs leading-relaxed text-foreground-3">
              {t('locationCapacity.subtitle')}
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

      {/* Today highlight — mobile (single unified block) */}
      <div className="md:hidden flex flex-col gap-3">
        <div>
          <p className={EYEBROW}>{t('todayOverview.today')}</p>
          <p className="mt-2 text-xl font-semibold leading-tight text-foreground-1 tabular-nums">
            {t('locationCapacity.appointmentsCount', { count: appointmentsToday })}
          </p>
          <p className="mt-0.5 text-sm text-foreground-3">
            {potentialRevenueToday > 0
              ? t('locationCapacity.potentialLine', {
                  value: formatCurrency(potentialRevenueToday),
                })
              : t('locationCapacity.noPotentialLine')}
          </p>
        </div>
        <CapacityBar
          pct={capacity.today.filledPercentage}
          tier={todayTier}
          measured={todayMeasured}
        />
        {nextAppointment && (
          <p className="flex items-baseline gap-1.5 text-xs leading-tight">
            <span className="text-foreground-3 shrink-0">
              {t('locationCapacity.nextAppointmentLabel')}
            </span>
            <span className="font-medium tabular-nums text-foreground-1 shrink-0">
              {formatTime(nextAppointment.scheduledAt)}
            </span>
            <span className="text-foreground-3/70 shrink-0" aria-hidden="true">·</span>
            <span className="truncate text-foreground-2">{nextCustomerName}</span>
          </p>
        )}
      </div>

      {/* Section divider — mobile only */}
      <DashedDivider
        marginTop="mt-0"
        paddingTop="pt-0"
        dashPattern="2 3"
        color="text-border-strong/60"
        className="md:hidden"
      />

      {/* Today highlight — desktop (3 plain cells, no nested card, terracotta eyebrows) */}
      <div className="hidden md:grid grid-cols-3 items-stretch">
        <div className="pr-5">
          <p className={EYEBROW}>{t('todayOverview.today')}</p>
          {appointmentsToday > 0 ? (
            <>
              <p className="mt-1.5 text-2xl font-semibold leading-none text-foreground-1 tabular-nums">
                {appointmentsToday}
              </p>
              <p className="mt-1.5 text-xs text-foreground-3">
                {t('todayOverview.appointments').toLowerCase()}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm font-medium text-foreground-2">
              {t('locationCapacity.noBookingsYet')}
            </p>
          )}
        </div>
        <div className="border-l border-border-subtle px-5">
          <p className={EYEBROW}>{t('locationCapacity.potential')}</p>
          {potentialRevenueToday > 0 ? (
            <>
              <p className="mt-1.5 text-2xl font-semibold leading-none text-foreground-1 tabular-nums">
                {formatCurrency(potentialRevenueToday)}
              </p>
              <p className="mt-1.5 text-xs text-foreground-3">
                {t('locationCapacity.revenueToday')}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm font-medium text-foreground-2">
              {t('locationCapacity.noRevenueYet')}
            </p>
          )}
        </div>
        <div className="border-l border-border-subtle pl-5">
          <p className={EYEBROW}>{t('capacityUtilization.title')}</p>
          {!todayMeasured ? (
            <>
              <p className="mt-1.5 text-sm font-medium text-foreground-2">
                {t('capacityUtilization.notMeasured')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-foreground-3">
                {t('locationCapacity.capacityUnavailableHelper')}
              </p>
            </>
          ) : capacity.today.filledPercentage > 0 ? (
            <>
              <p className="mt-1.5 text-2xl font-semibold leading-none text-foreground-1 tabular-nums">
                {Math.round(capacity.today.filledPercentage)}%
              </p>
              <p className={`mt-1.5 text-xs font-semibold ${todayTier.textClass}`}>
                {t(todayTier.labelKey)}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm font-medium text-foreground-2">
              {t('locationCapacity.fullyOpen')}
            </p>
          )}
        </div>
      </div>

      {/* Metrics table — desktop (week + month only; today is in the highlight above) */}
      <div className="hidden md:block">
        <p className={`${EYEBROW} mb-2`}>{t('locationCapacity.weekAndMonth')}</p>
        <div
          className="grid items-center gap-4 border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-3"
          style={{ gridTemplateColumns: 'minmax(80px,0.7fr) minmax(60px,0.6fr) minmax(90px,0.7fr) minmax(140px,1.2fr)' }}
        >
          <span>{t('locationCapacity.period')}</span>
          <span>{t('locationCapacity.appts')}</span>
          <span>{t('todayOverview.revenue')}</span>
          <span>{t('locationCapacity.capacityBooked')}</span>
        </div>
        {desktopPeriods.map((p, i) => {
          const tier = capacityTier(p.pct);
          return (
            <div
              key={p.key}
              className="grid items-center gap-4 py-3"
              style={{
                gridTemplateColumns: 'minmax(80px,0.7fr) minmax(60px,0.6fr) minmax(90px,0.7fr) minmax(140px,1.2fr)',
                borderBottom: i === desktopPeriods.length - 1 ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              <span className="text-sm font-medium text-foreground-2">{p.label}</span>
              <span className="text-sm font-semibold text-foreground-1 tabular-nums">{p.appts}</span>
              <span className="text-sm font-semibold text-foreground-1 tabular-nums">
                {formatCurrency(p.revenue)}
              </span>
              <CapacityBar pct={p.pct} tier={tier} measured={p.measured} />
            </div>
          );
        })}
      </div>

      {/* Metrics rows — mobile */}
      <div className="flex flex-col md:hidden">
        <p className={`${EYEBROW} mb-1`}>{t('locationCapacity.weekAndMonth')}</p>
        {mobilePeriods.map((p, i, arr) => {
          const tier = capacityTier(p.pct);
          return (
            <div
              key={p.key}
              className={`py-3 ${i < arr.length - 1 ? 'border-b border-border-subtle' : ''}`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-foreground-1">{p.label}</span>
                <span className="text-xs text-foreground-3 text-right">
                  <strong className="font-semibold text-foreground-1 tabular-nums">{p.appts}</strong>{' '}
                  {t('locationCapacity.apptsShort')} ·{' '}
                  <strong className="font-semibold text-foreground-1 tabular-nums">
                    {formatCurrency(p.revenue)}
                  </strong>
                </span>
              </div>
              <CapacityBar pct={p.pct} tier={tier} measured={p.measured} />
            </div>
          );
        })}
      </div>

      {/* Staff */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className={EYEBROW}>
            {t('todayOverview.staff')}
            {staffCount > 0 ? ` · ${staffCount}` : ''}
          </p>
          <button
            onClick={() => navigate('/team-members?action=invite')}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary transition-all hover:bg-primary/10 active:bg-primary/15 active:scale-[0.97] ${IOS_EASE}`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{t('todayOverview.inviteStaff')}</span>
          </button>
        </div>
        {staff && staff.length > 0 ? (
          <div className="flex flex-col divide-y divide-border-subtle">
            {staff.map((member) => {
              // A pending invite is a placeholder row: no name, no phone, no calendar to
              // open yet — so it identifies itself by email and links to the team list.
              const isPending = member.invitationPending === true;
              const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
              return (
                <button
                  key={member.email}
                  type="button"
                  onClick={() =>
                    navigate(
                      isPending
                        ? '/team-members'
                        : `/calendar?staffEmail=${encodeURIComponent(member.email)}`,
                    )
                  }
                  className={`group/row flex w-full items-center gap-3 py-2.5 cursor-pointer rounded transition-all hover:bg-surface-active/40 active:scale-[0.995] ${IOS_EASE}`}
                >
                  <PersonAvatar
                    id={member.email}
                    firstName={member.firstName}
                    lastName={member.lastName}
                    profileImage={member.profileImage}
                    className={`h-9 w-9 ${isPending ? 'opacity-60' : ''}`}
                    initialsClassName="text-[11px] font-semibold"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 min-w-0">
                      <p
                        className={`text-sm font-semibold leading-tight truncate ${
                          isPending ? 'text-foreground-2' : 'text-foreground-1'
                        }`}
                      >
                        {fullName || member.email}
                      </p>
                      {isPending && (
                        <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                          {t('locationCapacity.staffPending')}
                        </span>
                      )}
                    </div>
                    {isPending ? (
                      <p className="mt-0.5 text-xs text-foreground-3 truncate">
                        {fullName
                          ? member.email
                          : t('locationCapacity.staffPendingHelper')}
                      </p>
                    ) : (
                      <>
                        <div className="mt-0.5 hidden md:flex items-center gap-3 text-xs text-foreground-3">
                          <span className="truncate max-w-[260px]">{member.email}</span>
                          <span className="tabular-nums">{formatPhone(member.phone)}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-foreground-3 md:hidden truncate tabular-nums">
                          {formatPhone(member.phone)}
                        </p>
                      </>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-foreground-3/50 transition-colors group-hover/row:text-primary" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-strong/40 bg-surface-active/30 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-foreground-1">
              {t('locationCapacity.staffEmptyTitle')}
            </p>
            <p className="mt-1 text-xs text-foreground-3 leading-relaxed">
              {t('locationCapacity.staffEmptyHelper')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
