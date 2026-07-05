import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  MessageSquare,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  User,
  UserX,
  Search,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { listNotificationsRequest } from '../../notifications/api';
import { updateAppointmentRequest, bulkUpdateAppointmentStatusRequest } from '../../calendar/api';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '../../../shared/components/ui/dialog';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Checkbox } from '../../../shared/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '../../../shared/components/ui/drawer';
import { DashedDivider } from '../../../shared/components/common/DashedDivider';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { SearchInput } from '../../../shared/components/common/SearchInput';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { cn } from '../../../shared/lib/utils';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import type { NeedsAttentionItem, UnresolvedAppointment } from '../actions';
import { PersonAvatar } from '../../../shared/components/common/PersonAvatar';
import { DateRangeField, type DatePreset } from '../../reviews/components/DateRangeField';

const EYEBROW =
  'text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-500';
const IOS_EASE = '[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]';

interface NeedsAttentionWidgetProps {
  pendingAppointments: number;
  needsAttentionItems: NeedsAttentionItem[];
  onAppointmentUpdated?: () => void;
}

interface AttentionItem {
  id: string;
  type: 'pending' | 'sms' | 'unresolved';
  title: string;
  description: string;
  actionLabel: string;
  actionPath?: string;
  color: 'warning' | 'error';
  unresolvedAppointments?: UnresolvedAppointment[];
  unresolvedCount?: number;
}

// The dashboard swaps its widget tree for a skeleton on every loading toggle
// (locations fetch, per-location data fetch), remounting this widget several
// times in quick succession. Cache the SMS-low check module-wide with a short
// TTL so those remounts share one request instead of refiring it each time.
const SMS_LOW_CHECK_TTL_MS = 60_000;
let smsLowCheck: { at: number; promise: Promise<boolean> } | null = null;

function checkSmsLowNotification(): Promise<boolean> {
  if (!smsLowCheck || Date.now() - smsLowCheck.at > SMS_LOW_CHECK_TTL_MS) {
    smsLowCheck = {
      at: Date.now(),
      promise: listNotificationsRequest(0, 20)
        .then(res => res.data.data.some(n => n.type === 'sms_credits_low' && !n.read))
        .catch(() => false),
    };
  }
  return smsLowCheck.promise;
}

export function NeedsAttentionWidget({
  pendingAppointments,
  needsAttentionItems,
  onAppointmentUpdated,
}: NeedsAttentionWidgetProps) {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [hasSmsLow, setHasSmsLow] = useState(false);
  const [seeAllOpen, setSeeAllOpen] = useState(false);

  const locale = i18n.language === 'ro' ? 'ro-RO' : 'en-US';

  useEffect(() => {
    let cancelled = false;
    checkSmsLowNotification().then(found => {
      if (!cancelled) setHasSmsLow(found);
    });
    return () => { cancelled = true; };
  }, []);

  // Extract unresolved appointments from the needs attention data
  const unresolvedItem = needsAttentionItems.find(item => item.type === 'unresolved_appointments');
  const unresolvedAppointments = unresolvedItem?.appointments ?? [];
  const unresolvedCount = unresolvedItem?.count ?? 0;

  const items: AttentionItem[] = [];

  if (unresolvedCount > 0) {
    items.push({
      id: 'unresolved',
      type: 'unresolved',
      title:
        unresolvedCount === 1
          ? t('needsAttention.unresolvedAppointments', { count: unresolvedCount })
          : t('needsAttention.unresolvedAppointmentsPlural', { count: unresolvedCount }),
      description: t('needsAttention.unresolvedDescription'),
      actionLabel: t('needsAttention.seeAll'),
      color: 'warning',
      unresolvedAppointments,
      unresolvedCount,
    });
  }

  if (pendingAppointments > 0) {
    items.push({
      id: 'pending',
      type: 'pending',
      title:
        pendingAppointments === 1
          ? t('needsAttention.pendingBookings', { count: pendingAppointments })
          : t('needsAttention.pendingBookingsPlural', { count: pendingAppointments }),
      description: t('needsAttention.pendingDescription'),
      actionLabel: t('needsAttention.review'),
      actionPath: '/calendar',
      color: 'warning',
    });
  }

  if (hasSmsLow) {
    items.push({
      id: 'sms',
      type: 'sms',
      title: t('needsAttention.smsLow'),
      description: t('needsAttention.smsDescription'),
      actionLabel: t('needsAttention.buyCredits'),
      actionPath: '/account',
      color: 'error',
    });
  }

  const iconMap = {
    pending: <CalendarClock className="h-4 w-4" />,
    sms: <MessageSquare className="h-4 w-4" />,
    unresolved: <AlertTriangle className="h-4 w-4" />,
  };

  const dotColor = {
    warning: 'bg-warning',
    error: 'bg-error',
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) return time;
    if (isYesterday) {
      const dayLabel = t('needsAttention.yesterday');
      return `${dayLabel}, ${time}`;
    }
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasUrgentItems = items.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {hasUrgentItems && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
              aria-hidden
            />
          )}
          <p className={EYEBROW}>{t('needsAttention.title')}</p>
        </div>
        {unresolvedAppointments.length > 0 && (
          <button
            onClick={(e) => {
              // Blur before opening — drawer/dialog sets aria-hidden on the dashboard grid,
              // and a focused descendant of an aria-hidden ancestor throws a11y warnings.
              e.currentTarget.blur();
              setSeeAllOpen(true);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-primary hover:bg-primary/10 active:bg-primary/15 active:scale-[0.97] transition-[background-color,transform] cursor-pointer ${IOS_EASE}`}
          >
            <span className="text-xs font-medium">{t('needsAttention.seeAll')}</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 py-3 mt-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-bg ring-1 ring-success-border">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
          </div>
          <p className="text-sm text-foreground-2 leading-snug">{t('needsAttention.allClear')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-3">
          {/* Non-unresolved items (pending, sms) */}
          {items.filter(i => i.type !== 'unresolved').length > 0 && (
            <div className="flex flex-col divide-y divide-border-subtle">
              {items
                .filter(i => i.type !== 'unresolved')
                .map(item => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-2 md:gap-3 py-3 first:pt-0"
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor[item.color]}`} />
                    <span className="text-foreground-3 shrink-0">{iconMap[item.type]}</span>
                    <div className="flex-1 min-w-0 basis-[calc(100%-3rem)]  md:basis-0">
                      <p className="text-sm font-medium text-foreground-1">{item.title}</p>
                      <p className="text-xs text-foreground-3 mt-0.5">{item.description}</p>
                    </div>
                    <button
                      onClick={() => item.actionPath && navigate(item.actionPath)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-primary hover:bg-primary/10 active:bg-primary/15 active:scale-[0.97] transition-[background-color,transform] cursor-pointer shrink-0 ml-auto ${IOS_EASE}`}
                    >
                      <span className="text-xs font-medium">{item.actionLabel}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Unresolved appointments inline list */}
          {unresolvedAppointments.length > 0 && (
            <UnresolvedAppointmentsList
              appointments={unresolvedAppointments.slice(0, 4)}
              totalCount={unresolvedCount}
              formatDateTime={formatDateTime}
              locale={locale}
              onAppointmentUpdated={onAppointmentUpdated}
            />
          )}
        </div>
      )}

      {/* See All Dialog */}
      <UnresolvedAppointmentsDialog
        open={seeAllOpen}
        onOpenChange={setSeeAllOpen}
        appointments={unresolvedAppointments}
        formatDateTime={formatDateTime}
        locale={locale}
        onAppointmentUpdated={onAppointmentUpdated}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Inline unresolved appointments list (max 4 rows)
 * ───────────────────────────────────────────────────────────── */

interface UnresolvedAppointmentsListProps {
  appointments: UnresolvedAppointment[];
  totalCount: number;
  formatDateTime: (iso: string) => string;
  locale: string;
  onAppointmentUpdated?: () => void;
}

function UnresolvedAppointmentsList({
  appointments,
  formatDateTime,
  locale,
  onAppointmentUpdated,
}: UnresolvedAppointmentsListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Collapse on tap outside the list
  useEffect(() => {
    if (expandedId === null) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!listRef.current?.contains(e.target as Node)) {
        setExpandedId(null);
      }
    };
    // Defer to avoid catching the click that just opened
    const raf = requestAnimationFrame(() => {
      document.addEventListener('pointerdown', handlePointerDown);
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [expandedId]);

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  return (
    <div ref={listRef} className="flex flex-col divide-y divide-border-subtle/60">
      {appointments.map(appt => (
        <UnresolvedAppointmentRow
          key={appt.uuid}
          appointment={appt}
          formatDateTime={formatDateTime}
          locale={locale}
          isExpanded={expandedId === appt.id}
          onToggleExpand={() => handleToggleExpand(appt.id)}
          onUpdated={onAppointmentUpdated}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Single unresolved appointment row with quick actions
 * ───────────────────────────────────────────────────────────── */

interface UnresolvedAppointmentRowProps {
  appointment: UnresolvedAppointment;
  formatDateTime: (iso: string) => string;
  locale: string;
  compact?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onUpdated?: () => void;
}

function UnresolvedAppointmentRow({
  appointment,
  formatDateTime: _formatDateTime,
  locale,
  compact = false,
  isExpanded = false,
  onToggleExpand,
  onUpdated,
}: UnresolvedAppointmentRowProps) {
  const { t } = useTranslation('dashboard');
  const [loading, setLoading] = useState<'completed' | 'no_show' | null>(null);
  const [resolved, setResolved] = useState<'completed' | 'no_show' | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const customer = appointment.customerSnapshot;
  const hasCustomer = !!(customer && (customer.firstName || customer.lastName));
  const customerName = hasCustomer
    ? [customer!.firstName, customer!.lastName].filter(Boolean).join(' ')
    : t('upcomingAppointments.guestCustomer');
  const avatarKey = customer?.userId ?? appointment.uuid;
  const staffName = appointment.staffSnapshot[0]
    ? `${appointment.staffSnapshot[0].firstName} ${appointment.staffSnapshot[0].lastName}`
    : null;

  // Staleness signal — used only for avatar status dot, not for time coloring
  const hoursSinceEnd =
    (Date.now() - new Date(appointment.endsAt).getTime()) / 3_600_000;
  const stalenessLevel: 'fresh' | 'warning' | 'urgent' =
    hoursSinceEnd > 168 ? 'urgent' : hoursSinceEnd > 48 ? 'warning' : 'fresh';
  const stalenessDot =
    stalenessLevel === 'urgent' ? 'bg-error' : 'bg-warning';
  const dateLabelColor =
    stalenessLevel === 'urgent'
      ? 'text-error'
      : stalenessLevel === 'warning'
        ? 'text-warning'
        : 'text-foreground-3';

  // Date split: "YESTERDAY" / "21:30" — small caps label + tabular time
  const { dateLabel, timeLabel } = useMemo(() => {
    const date = new Date(appointment.scheduledAt);
    const now = new Date();
    const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    let label: string;
    if (isToday) {
      label = t('needsAttention.today');
    } else if (isYesterday) {
      label = t('needsAttention.yesterday');
    } else {
      const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
      label =
        daysAgo > 0 && daysAgo < 7
          ? t('needsAttention.daysAgo', { count: daysAgo })
          : date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    }
    return { dateLabel: label, timeLabel: time };
  }, [appointment.scheduledAt, locale, t]);

  const handleAction = useCallback(async (status: 'completed' | 'no_show') => {
    setLoading(status);
    try {
      await updateAppointmentRequest(appointment.id, { status });
      setResolved(status);
      // Show confirmation briefly, then collapse, then refetch
      setTimeout(() => setCollapsed(true), 450);
      setTimeout(() => onUpdated?.(), 780);
    } catch {
      toast.error(t('needsAttention.updateFailed'));
      setLoading(null);
    }
  }, [appointment.id, onUpdated, t]);

  const handleRowClick = (e: React.MouseEvent) => {
    if (loading || resolved) return;
    // Ignore clicks on action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    onToggleExpand?.();
  };

  // Ghost text+icon button — matches the dashboard's house pattern (see "See all" in ReviewsWidget).
  // Used for desktop hover-revealed actions where subtlety is appropriate.
  const ghostButtonBase = cn(
    'inline-flex items-center justify-center gap-1 rounded-md font-medium cursor-pointer whitespace-nowrap',
    'active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2',
    'transition-[background-color,color,transform] duration-150',
    'disabled:opacity-50 disabled:active:scale-100',
    IOS_EASE,
  );
  const completedGhostClasses = cn(
    ghostButtonBase,
    'text-success hover:bg-success-bg active:bg-success-bg/80',
    'focus-visible:ring-success/30',
  );
  const noShowGhostClasses = cn(
    ghostButtonBase,
    'text-foreground-3 hover:text-foreground-1 hover:bg-surface-active/60 active:bg-surface-active',
    'focus-visible:ring-border-strong/40',
  );

  // Subtle filled "primary feel" for mobile Completed — success-tinted pill with border.
  // Pill shape (rounded-full) signals primary action; ghost No-show stays rectangular.
  const completedSubtleClasses = cn(
    'inline-flex items-center justify-center gap-1 rounded-full font-medium cursor-pointer whitespace-nowrap',
    'bg-success-bg text-success border border-success-border/70',
    'hover:bg-success-bg/70 hover:border-success-border active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/30',
    'transition-[background-color,border-color,transform] duration-150',
    'disabled:opacity-50 disabled:active:scale-100',
    IOS_EASE,
  );

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300',
        collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
        IOS_EASE,
      )}
    >
      <div className="overflow-hidden">
        <div
          role="button"
          tabIndex={resolved ? -1 : 0}
          aria-expanded={isExpanded}
          aria-label={`${customerName}, ${appointment.bookedItemName}`}
          onClick={handleRowClick}
          onKeyDown={(e) => {
            if (resolved) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpand?.();
            }
          }}
          data-expanded={isExpanded ? 'true' : 'false'}
          className={cn(
            'group/unresolved relative -mx-2 px-2 rounded-xl outline-none',
            compact ? 'py-3' : 'py-3.5',
            'transition-[background-color] duration-150',
            !resolved && 'cursor-pointer',
            !resolved && 'hover:bg-surface-hover/70 active:bg-surface-active/40',
            !resolved && isExpanded && 'bg-surface-hover/70',
            'focus-visible:ring-2 focus-visible:ring-border-focus/40',
            IOS_EASE,
          )}
        >
          {/* Main row: avatar | identity | right-slot (time ⇄ actions) */}
          <div className="flex items-center gap-3 min-w-0">

            {/* Avatar with subtle staleness dot */}
            <div className="relative shrink-0">
              <PersonAvatar
                id={avatarKey}
                firstName={customer?.firstName}
                lastName={customer?.lastName}
                profileImage={customer?.profileImage}
                className="size-10 ring-1 ring-border-subtle"
                initialsClassName="text-xs font-semibold"
              />
              {stalenessLevel !== 'fresh' && !resolved && (
                <span
                  className={cn(
                    'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface',
                    stalenessDot,
                  )}
                  aria-hidden
                />
              )}
            </div>

            {/* Identity column — customer name + service only */}
            <div className="min-w-0 flex-1">
              {resolved ? (
                <div className="flex items-center gap-1.5 animate-in fade-in-0 duration-200">
                  {resolved === 'completed' ? (
                    <Check className="h-3.5 w-3.5 text-success shrink-0" strokeWidth={2.75} />
                  ) : (
                    <X className="h-3.5 w-3.5 text-warning shrink-0" strokeWidth={2.75} />
                  )}
                  <span className="text-sm leading-tight truncate">
                    <span className="font-semibold text-foreground-2">{customerName}</span>
                    <span className="text-foreground-3">
                      {' '}· {resolved === 'completed' ? t('needsAttention.completed') : t('needsAttention.noShow')}
                    </span>
                  </span>
                </div>
              ) : (
                <>
                  <p
                    className="text-sm font-semibold text-foreground-1 truncate leading-tight"
                    title={customerName}
                  >
                    {customerName}
                  </p>
                  <p
                    className="text-xs text-foreground-3 truncate mt-0.5"
                    title={appointment.bookedItemName}
                  >
                    {appointment.bookedItemName}
                  </p>
                </>
              )}
            </div>

            {/* Right slot: time block on idle, actions overlay on desktop hover */}
            {!resolved && (
              <div className="relative shrink-0 flex items-center gap-2 self-stretch">
                {/* Time block — fades on desktop hover. Always visible on mobile. */}
                <div
                  className={cn(
                    'flex flex-col items-end leading-tight transition-opacity duration-150',
                    'md:group-hover/unresolved:opacity-0',
                    IOS_EASE,
                  )}
                >
                  <span className={cn('text-[10px] uppercase tracking-[0.06em] font-medium whitespace-nowrap', dateLabelColor)}>
                    {dateLabel}
                  </span>
                  <span className="text-sm font-medium tabular-nums text-foreground-1 mt-0.5">
                    {timeLabel}
                  </span>
                </div>

                {/* Mobile chevron — hidden on desktop */}
                <ChevronDown
                  className={cn(
                    'md:hidden h-4 w-4 shrink-0 text-foreground-3/70',
                    'transition-transform duration-200',
                    isExpanded && 'rotate-180',
                    IOS_EASE,
                  )}
                  aria-hidden
                />

                {/* DESKTOP actions overlay — absolute-positioned over time block on hover */}
                <div
                  className={cn(
                    'hidden md:flex absolute inset-y-0 right-0 items-center gap-0.5',
                    'opacity-0 pointer-events-none translate-x-1',
                    'group-hover/unresolved:opacity-100 group-hover/unresolved:pointer-events-auto group-hover/unresolved:translate-x-0',
                    'transition-[opacity,transform] duration-200',
                    IOS_EASE,
                  )}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={loading !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('completed');
                    }}
                    className={cn(completedGhostClasses, 'px-2 py-1 text-xs')}
                  >
                    <CheckCircle2 className="h-3 w-3 shrink-0" strokeWidth={2} />
                    {loading === 'completed' ? '…' : t('needsAttention.completed')}
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={loading !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('no_show');
                    }}
                    className={cn(noShowGhostClasses, 'px-2 py-1 text-xs')}
                  >
                    <UserX className="h-3 w-3 shrink-0" strokeWidth={2} />
                    {loading === 'no_show' ? '…' : t('needsAttention.noShow')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MOBILE expanded: staff name + actions appear below the identity row */}
          {!resolved && (
            <div
              className={cn(
                'md:hidden grid transition-[grid-template-rows,margin-top,opacity] duration-300',
                'grid-rows-[0fr] opacity-0 mt-0',
                isExpanded && '!grid-rows-[1fr] !opacity-100 !mt-3',
                IOS_EASE,
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-2.5 pl-[52px]">
                  {staffName && (
                    <p className="text-[11px] text-foreground-3 leading-tight">
                      {t('needsAttention.with')}{' '}
                      <span className="text-foreground-2">{staffName}</span>
                    </p>
                  )}
                  {/* No-show on the left (ghost) ⇄ Completed pill on the right (primary) */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      tabIndex={isExpanded ? 0 : -1}
                      disabled={loading !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('no_show');
                      }}
                      className={cn(noShowGhostClasses, 'h-8 px-3 text-xs')}
                    >
                      <UserX className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      {loading === 'no_show' ? '…' : t('needsAttention.noShow')}
                    </button>
                    <button
                      type="button"
                      tabIndex={isExpanded ? 0 : -1}
                      disabled={loading !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('completed');
                      }}
                      className={cn(completedSubtleClasses, 'h-8 px-3.5 text-xs')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      {loading === 'completed' ? '…' : t('needsAttention.completed')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * "See All" Dialog — full list with multi-select & bulk actions
 * ───────────────────────────────────────────────────────────── */

interface UnresolvedAppointmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: UnresolvedAppointment[];
  formatDateTime: (iso: string) => string;
  locale: string;
  onAppointmentUpdated?: () => void;
}

function UnresolvedAppointmentsDialog({
  open,
  onOpenChange,
  appointments,
  formatDateTime,
  locale,
  onAppointmentUpdated,
}: UnresolvedAppointmentsDialogProps) {
  const { t, i18n } = useTranslation('dashboard');
  // Reviews namespace handles the date-preset labels (DateRangeField pulls
  // from it internally). We borrow the same keys here so summary + footer
  // copy stays consistent across both filter UIs.
  const { t: tReviews } = useTranslation('reviews');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<'completed' | 'no_show' | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<'completed' | 'no_show' | null>(null);
  const [exitingConfirm, setExitingConfirm] = useState(false);

  // Snapshot appointments when dialog opens so parent refetch doesn't unmount/re-render the list
  const [localAppointments, setLocalAppointments] = useState<UnresolvedAppointment[]>([]);
  useEffect(() => {
    if (open) {
      setLocalAppointments(appointments);
      setDismissedIds(new Set());
    }
  }, [open]);

  // The visible appointments = snapshot minus dismissed
  const visibleAppointments = useMemo(
    () => localAppointments.filter(a => !dismissedIds.has(a.id)),
    [localAppointments, dismissedIds],
  );

  // Filter state (applied). Date model lifted from ReviewsFiltersSheet so we
  // can reuse [DateRangeField] verbatim — preset enum + ISO strings (start
  // open-ended for "Last N days" presets where endDate stays null).
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('any');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Draft filter state (inside popover/drawer, staged until Apply)
  const [draftService, setDraftService] = useState<string | null>(null);
  const [draftDatePreset, setDraftDatePreset] = useState<DatePreset>('any');
  const [draftStartDate, setDraftStartDate] = useState<string | null>(null);
  const [draftEndDate, setDraftEndDate] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);

  // Sync drafts when popover/drawer opens — users can abandon mid-edit by
  // closing without Apply; next open is fresh from committed state.
  const handleFilterOpenChange = useCallback((open: boolean) => {
    if (open) {
      setDraftService(selectedService);
      setDraftDatePreset(datePreset);
      setDraftStartDate(startDate);
      setDraftEndDate(endDate);
    }
    setFilterOpen(open);
  }, [selectedService, datePreset, startDate, endDate]);

  // Apply drafts to real filter state
  const applyFilters = useCallback(() => {
    setSelectedService(draftService);
    setDatePreset(draftDatePreset);
    setStartDate(draftStartDate);
    setEndDate(draftEndDate);
    setFilterOpen(false);
  }, [draftService, draftDatePreset, draftStartDate, draftEndDate]);

  // Derive unique service options from appointment data
  const serviceOptions = useMemo(() => {
    const seen = new Set<string>();
    return visibleAppointments.reduce<{ value: string; label: string }[]>((acc, a) => {
      if (!seen.has(a.bookedItemName)) {
        seen.add(a.bookedItemName);
        acc.push({ value: a.bookedItemName, label: a.bookedItemName });
      }
      return acc;
    }, []);
  }, [visibleAppointments]);

  // Client-side filtering — ISO strings are parsed once at the comparison
  // boundary so the appointments' scheduledAt (also ISO) can be compared by
  // numeric timestamp without timezone surprises.
  const filteredAppointments = useMemo(() => {
    const fromTs = startDate ? parseISO(startDate).getTime() : null;
    const toTs = endDate ? parseISO(endDate).getTime() : null;
    return visibleAppointments.filter(appt => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const customer = appt.customerSnapshot
          ? `${appt.customerSnapshot.firstName} ${appt.customerSnapshot.lastName}`.toLowerCase()
          : '';
        const staff = appt.staffSnapshot[0]
          ? `${appt.staffSnapshot[0].firstName} ${appt.staffSnapshot[0].lastName}`.toLowerCase()
          : '';
        if (!customer.includes(q) && !staff.includes(q)) return false;
      }
      if (selectedService && appt.bookedItemName !== selectedService) return false;
      const ts = new Date(appt.scheduledAt).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });
  }, [visibleAppointments, searchQuery, selectedService, startDate, endDate]);

  // A date filter only counts as "active" if it actually narrows the query —
  // picking "Custom" but no dates yet should not bump the badge. Matches the
  // committed-vs-draft distinction in [ReviewsFiltersSheet].
  const dateCommitted = datePreset !== 'any' && (startDate !== null || endDate !== null);
  const dateDraft = draftDatePreset !== 'any' && (draftStartDate !== null || draftEndDate !== null);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedService !== null || dateCommitted;
  const activeFilterCount = (selectedService !== null ? 1 : 0) + (dateCommitted ? 1 : 0);
  const draftActiveCount = (draftService !== null ? 1 : 0) + (dateDraft ? 1 : 0);

  const hasFilterChanges =
    draftService !== selectedService ||
    draftDatePreset !== datePreset ||
    draftStartDate !== startDate ||
    draftEndDate !== endDate;

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedService(null);
    setDatePreset('any');
    setStartDate(null);
    setEndDate(null);
  }, []);

  // Wipe drafts too — used by the in-sheet "Clear all" so the visible state
  // matches what'd happen if the user hit Apply right after.
  const clearAllDraftsAndCommit = useCallback(() => {
    setDraftService(null);
    setDraftDatePreset('any');
    setDraftStartDate(null);
    setDraftEndDate(null);
    clearAllFilters();
  }, [clearAllFilters]);

  const allSelected = filteredAppointments.length > 0 && filteredAppointments.every(a => selected.has(a.id));
  const someSelected = selected.size > 0;

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredAppointments.map(a => a.id)));
    }
  };

  const handleBulkAction = async (status: 'completed' | 'no_show') => {
    if (selected.size === 0) return;
    setBulkLoading(status);

    const ids = Array.from(selected);

    try {
      const res = await bulkUpdateAppointmentStatusRequest(ids, status);
      const successIds = (res.results as { id: number; success: boolean }[])
        .filter(r => r.success)
        .map(r => r.id);
      const failCount = ids.length - successIds.length;

      if (successIds.length > 0) {
        setDismissedIds(prev => {
          const next = new Set(prev);
          successIds.forEach(id => next.add(id));
          return next;
        });
        setSelected(new Set());
        setPendingConfirm(null);
        toast.success(t('needsAttention.bulkSuccess', { count: successIds.length }));
        onAppointmentUpdated?.();
      }

      if (failCount > 0) {
        toast.error(t('needsAttention.bulkUpdateFailed', { count: failCount }));
      }
    } catch {
      toast.error(t('needsAttention.updateFailed'));
    }

    setBulkLoading(null);
  };

  // Reset state when dialog closes
  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSelected(new Set());
      clearAllFilters();
      setPendingConfirm(null);
      setExitingConfirm(false);
    }
    onOpenChange(value);
  };

  const isMobile = useIsMobile();

  /* ── Shared content elements ── */

  // Locale-aware short date formatter for the section summary chip. Mirrors
  // [ReviewsFiltersSheet]'s `formatShortDate` so the period preview reads the
  // same in both filter UIs.
  const dateLocale = i18n.language === 'ro' ? ro : enUS;
  const formatShortDate = useCallback(
    (iso: string) => format(parseISO(iso), 'd MMM', { locale: dateLocale }),
    [dateLocale],
  );

  // Right-aligned summary string on the Date section header. Empty preset =
  // null (no summary rendered). Preset labels mirror reviews so the language
  // feels consistent across filters.
  const datePeriodSummary = (() => {
    if (draftDatePreset === 'any') return null;
    if (draftDatePreset === '7d') return tReviews('filter.dateLast7Days');
    if (draftDatePreset === '30d') return tReviews('filter.dateLast30Days');
    if (draftDatePreset === '90d') return tReviews('filter.dateLast90Days');
    if (draftStartDate && draftEndDate) {
      return `${formatShortDate(draftStartDate)} – ${formatShortDate(draftEndDate)}`;
    }
    if (draftStartDate) return `${tReviews('filter.dateCustom')} · ${formatShortDate(draftStartDate)}`;
    return tReviews('filter.dateCustom');
  })();

  // Shared filter content — date range section + service chips. Same body used
  // in both the desktop Popover and the mobile Drawer. Sections mirror the
  // Reviews filter sheet recipe: eyebrow title + right-aligned summary chip,
  // hairline `border-t` divider between sections.
  const filterSections = (
    <>
      <FilterSection
        title={tReviews('filter.dateLabel')}
        summary={datePeriodSummary}
        isFirst
      >
        <DateRangeField
          preset={draftDatePreset}
          startDate={draftStartDate}
          endDate={draftEndDate}
          onChange={(preset, start, end) => {
            setDraftDatePreset(preset);
            setDraftStartDate(start);
            setDraftEndDate(end);
          }}
        />
      </FilterSection>

      <FilterSection
        title={t('needsAttention.service')}
        summary={draftService}
      >
        <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto -mx-0.5 px-0.5 pt-1">
          <ServiceChip selected={draftService === null} onClick={() => setDraftService(null)}>
            {t('needsAttention.allServices')}
          </ServiceChip>
          {serviceOptions.map((svc) => (
            <ServiceChip
              key={svc.value}
              selected={draftService === svc.value}
              onClick={() => setDraftService(svc.value)}
            >
              {svc.label}
            </ServiceChip>
          ))}
        </div>
      </FilterSection>
    </>
  );

  // Footer recipe lifted from [ReviewsFiltersSheet] so the two filter UIs
  // feel like the same control: ghost "Clear all" with rotating-arrow icon on
  // the left (only when there's something to clear; otherwise an empty
  // placeholder keeps the layout stable), wide primary "Apply" on the right
  // that disables until something actually changed.
  const filterFooter = (
    <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3">
      {draftActiveCount > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          rounded="full"
          className="group !h-9 !min-h-0 gap-1.5 px-3 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={() => {
            setDraftService(null);
            setDraftDatePreset('any');
            setDraftStartDate(null);
            setDraftEndDate(null);
          }}
        >
          <RotateCcw
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            aria-hidden
          />
          {t('needsAttention.clearFilters')}
        </Button>
      ) : (
        <div />
      )}
      <Button
        type="button"
        size="sm"
        rounded="full"
        disabled={!hasFilterChanges}
        className="!h-9 !min-h-0 shrink-0 px-16 text-xs font-semibold transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        onClick={applyFilters}
      >
        {t('needsAttention.apply')}
      </Button>
    </footer>
  );

  const filterTrigger = (
    <button
      type="button"
      // No blur on click here: when this trigger lives inside the outer
      // BaseSlider (itself a Vaul drawer), .blur() trips Vaul's focus
      // retention and refocuses the outer panel — which then becomes its
      // own aria-hidden focused ancestor as the inner filter Drawer opens.
      // The inner DrawerContent's onOpenAutoFocus handler below moves
      // focus into the inner drawer before that warning can fire.
      aria-label={t('needsAttention.filters')}
      className={cn(
        'relative inline-flex items-center justify-center h-10 px-3.5 gap-1.5 rounded-full border outline-none shrink-0',
        'transition-[transform,colors,box-shadow,background-color,color] duration-200 cursor-pointer',
        'active:scale-[0.97]',
        'focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-0',
        filterOpen
          ? 'bg-info-100 border-border-strong text-foreground-1'
          : 'bg-surface-hover border-border text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong',
        IOS_EASE,
      )}
    >
      <SlidersHorizontal className="h-3.5 w-3.5 text-foreground-3" />
      <span className="text-xs font-medium">{t('needsAttention.filters')}</span>
      {activeFilterCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow">
          {activeFilterCount}
        </span>
      )}
    </button>
  );

  const filterToolbar = (
    <div className="flex items-center gap-2 py-3">
      <SearchInput
        placeholder={t('needsAttention.searchPlaceholder')}
        value={searchQuery}
        onChange={setSearchQuery}
        className="flex-1 min-w-0"
        inputClassName="!h-10 !text-xs !rounded-full"
      />
      {isMobile ? (
        // Mobile: filter button opens a Drawer (bottom sheet). Matches the
        // [ReviewsFiltersSheet] mobile layout: fixed 70vh outer height,
        // scrollable body wrapped in a `min-h-0 flex-1 flex flex-col
        // overflow-hidden` container, sticky footer pinned to the bottom.
        // z-[110] keeps the filter drawer above the BaseSlider panel (z-[80]).
        <Drawer autoFocus open={filterOpen} onOpenChange={handleFilterOpenChange}>
          <DrawerTrigger asChild>{filterTrigger}</DrawerTrigger>
          <DrawerContent
            className="outline-none !z-[110] !bg-surface"
            overlayClassName="!z-[105]"
            // Pull focus into the inner drawer's own content node BEFORE
            // Radix/Vaul finishes applying aria-hidden to the outer
            // BaseSlider panel. The currentTarget is the DrawerContent root
            // itself (which carries `tabindex="-1"` from Vaul/Radix), so
            // focusing it parks focus inside this drawer and out of the
            // soon-to-be-hidden outer one. Don't preventDefault — we want
            // the default content-focus to remain the destination.
            onOpenAutoFocus={(e) => {
              const node = e.currentTarget as HTMLElement | null;
              node?.focus();
            }}
          >
            <DrawerTitle className="sr-only">{t('needsAttention.filters')}</DrawerTitle>
            <DrawerDescription className="sr-only">{t('needsAttention.filters')}</DrawerDescription>
            <div className="h-[70vh] flex flex-col p-0">
              <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="px-3">{filterSections}</div>
                </div>
                {filterFooter}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        // Desktop: Popover sized to match the [ReviewsFiltersSheet] Dialog
        // (460px wide, internal scrolling body, sticky footer) so the
        // DateRangeField's desktop three-level layout — [Any time chip] |
        // divider | 7d/30d/90d/Custom — fits on one line and the expanded
        // Custom calendar has room. The `max-h-[min(...)]` clamp mirrors
        // reviews so the popover never overflows the viewport.
        // Desktop: Popover sized to fit the DateRangeField's three-level
        // desktop layout. Height is clamped to whatever Radix has measured
        // as available below the trigger (`--radix-popover-content-available-height`)
        // so when the custom calendar expands, the body scrolls inside the
        // popover instead of growing off-screen. `collisionPadding` keeps a
        // breathing margin off the viewport edges.
        <Popover open={filterOpen} onOpenChange={handleFilterOpenChange}>
          <PopoverTrigger asChild>{filterTrigger}</PopoverTrigger>
          <PopoverContent
            className="!p-0 !w-[min(460px,calc(100vw-2rem))] flex flex-col overflow-hidden bg-surface"
            style={{ maxHeight: 'var(--radix-popover-content-available-height)' }}
            align="end"
            sideOffset={8}
            collisionPadding={16}
          >
            <div
              className="flex-1 overflow-y-auto min-h-0 overscroll-contain"
              // The outer Dialog uses `react-remove-scroll` to lock background
              // scroll while open. Because this Popover is portal'd as a
              // sibling of the Dialog (not a descendant of its content), the
              // lock blocks wheel/touch events here too — the scrollbar drag
              // still works but the wheel does nothing. Drive scroll manually
              // and `preventDefault` so devices where the lock isn't active
              // don't double-scroll.
              onWheel={(e) => {
                e.currentTarget.scrollTop += e.deltaY;
                e.preventDefault();
              }}
            >
              <div className="px-3">{filterSections}</div>
            </div>
            {filterFooter}
          </PopoverContent>
        </Popover>
      )}
      {hasActiveFilters && (
        <button onClick={clearAllDraftsAndCommit} className="shrink-0 text-xs text-primary hover:underline cursor-pointer">{t('needsAttention.clearAll')}</button>
      )}
    </div>
  );

  // Single date badge that reads the committed preset — matches how
  // [ReviewsFiltersSheet] surfaces the date filter as one chip per filter
  // (preset OR custom range), not two stranded From/To chips.
  const committedDateLabel = (() => {
    if (!dateCommitted) return null;
    if (datePreset === '7d') return tReviews('filter.dateLast7Days');
    if (datePreset === '30d') return tReviews('filter.dateLast30Days');
    if (datePreset === '90d') return tReviews('filter.dateLast90Days');
    if (startDate && endDate) return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
    if (startDate) return `${tReviews('filter.dateCustom')} · ${formatShortDate(startDate)}`;
    return tReviews('filter.dateCustom');
  })();

  const clearCommittedDate = useCallback(() => {
    setDatePreset('any');
    setStartDate(null);
    setEndDate(null);
  }, []);

  const filterBadges = (activeFilterCount > 0 || searchQuery.trim()) ? (
    <div className="flex flex-wrap gap-1.5 pb-3">
      {searchQuery.trim() && (
        <Badge variant="filter" className="flex items-center gap-1 cursor-pointer text-xs" onClick={() => setSearchQuery('')}>
          {t('needsAttention.searchLabel')}: {searchQuery.trim()}<X className="h-3.5 w-3.5 ml-0.5" />
        </Badge>
      )}
      {committedDateLabel && (
        <Badge variant="filter" className="flex items-center gap-1 cursor-pointer text-xs" onClick={clearCommittedDate}>
          {tReviews('filter.dateLabel')}: {committedDateLabel}<X className="h-3.5 w-3.5 ml-0.5" />
        </Badge>
      )}
      {selectedService && (
        <Badge variant="filter" className="flex items-center gap-1 cursor-pointer text-xs" onClick={() => setSelectedService(null)}>
          {t('needsAttention.service')}: {selectedService}<X className="h-3.5 w-3.5 ml-0.5" />
        </Badge>
      )}
    </div>
  ) : null;

  const appointmentList = (
    <div className="relative flex-1 overflow-y-auto min-h-0 bg-muted/20 dark:bg-background/50">
      {isMobile ? (
        // Tap-anywhere row → toggles select-all. When some are selected, the
        // count tucks to the right in primary color so it reads as "what
        // state am I in" without inflating the row.
        <button
          type="button"
          onClick={toggleSelectAll}
          className={cn(
            'flex w-full items-center gap-3 px-4 py-3 border-b border-border sticky top-0 z-10',
            'bg-muted/40 dark:bg-background/70 backdrop-blur-sm',
            'text-left active:bg-surface-active/40 transition-colors duration-150 cursor-pointer',
            IOS_EASE,
          )}
        >
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-[11px] font-semibold text-foreground-3 uppercase tracking-[0.12em]">
            {t('needsAttention.selectAll')}
          </span>
          {someSelected && (
            <span className="ml-auto text-[11px] font-semibold text-primary tabular-nums">
              {t('needsAttention.selected', { count: selected.size })}
            </span>
          )}
        </button>
      ) : (
        <div className="grid grid-cols-[32px_1fr_1fr_120px] gap-3 items-center px-6 md:px-8 py-2.5 border-b border-border sticky top-0 z-10 bg-muted/40 dark:bg-background/70 backdrop-blur-sm">
          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
          <span className="text-xs font-medium text-foreground-3 uppercase tracking-wider">{t('needsAttention.customer')}</span>
          <span className="text-xs font-medium text-foreground-3 uppercase tracking-wider">{t('needsAttention.service')} / {t('needsAttention.staff')}</span>
          <span className="text-xs font-medium text-foreground-3 uppercase tracking-wider text-right">{t('needsAttention.time')}</span>
        </div>
      )}
      {filteredAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-foreground-3">
          <Search className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">{t('needsAttention.noFilterResults')}</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {filteredAppointments.map(appt => (
            <DialogAppointmentRow
              key={appt.id}
              appointment={appt}
              isSelected={selected.has(appt.id)}
              onToggleSelect={() => toggleSelect(appt.id)}
              resolved={null}
              formatDateTime={formatDateTime}
              locale={locale}
              compact={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Action bar inner content — shared between desktop Dialog (wrapped with
  // its own border-t + min-h-[60px]) and mobile BaseSlider (whose footer
  // adds DashedDivider + padding automatically).
  const actionBarInner = pendingConfirm ? (
    <div className={cn('flex w-full items-center justify-between gap-3 md:gap-4', exitingConfirm ? 'pointer-events-none animate-out fade-out-0 slide-out-to-bottom-2 duration-200 fill-mode-forwards' : 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200', 'motion-reduce:animate-none motion-reduce:translate-y-0 motion-reduce:opacity-100')}>
      <p className="min-w-0 text-xs md:text-sm text-foreground-2">
        {pendingConfirm === 'completed' ? t('needsAttention.confirmCompleted', { count: selected.size }) : t('needsAttention.confirmNoShow', { count: selected.size })}
      </p>
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <Button variant="ghost" size="sm" onClick={() => { setExitingConfirm(true); setTimeout(() => { setPendingConfirm(null); setExitingConfirm(false); }, 200); }} className="!h-9 !min-h-0 px-3 md:px-3.5 text-xs font-medium text-foreground-3 hover:text-foreground-1 rounded-md">{t('needsAttention.back')}</Button>
        <Button variant="outline" size="sm" onClick={() => handleBulkAction(pendingConfirm)} disabled={bulkLoading !== null} className={cn('inline-flex !h-9 !min-h-0 px-3.5 md:px-4 text-xs font-semibold rounded-full gap-1.5', pendingConfirm === 'completed' ? 'border-success-border/70 bg-success-bg text-success hover:bg-success-bg/70 hover:border-success-border' : 'border-warning-border/70 bg-warning-bg text-warning hover:bg-warning-bg/70 hover:border-warning-border')}>{bulkLoading !== null ? t('needsAttention.updating') : t('needsAttention.confirm')}</Button>
      </div>
    </div>
  ) : (
    <div className="flex w-full items-center justify-between gap-3">
      <span className={cn('text-xs font-medium transition-opacity duration-150', someSelected ? 'text-foreground-2' : 'text-foreground-3')}>{someSelected ? t('needsAttention.selected', { count: selected.size }) : t('needsAttention.selectToResolve')}</span>
      <div className={cn('flex items-center gap-1.5 transition-opacity duration-150', someSelected ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setPendingConfirm('no_show')}
          className="!h-9 !min-h-0 px-3 rounded-md text-xs font-medium text-foreground-3 hover:text-foreground-1 hover:bg-surface-active/60 active:scale-[0.97] gap-1.5"
        >
          <UserX className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          {t('needsAttention.markSelectedNoShow')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPendingConfirm('completed')}
          className="!h-9 !min-h-0 px-3.5 rounded-full text-xs font-semibold gap-1.5 border-success-border/70 bg-success-bg text-success hover:bg-success-bg/70 hover:border-success-border active:scale-[0.97]"
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          {t('needsAttention.markSelectedCompleted')}
        </Button>
      </div>
    </div>
  );

  // Desktop wraps it with its own border-t + bg + padding.
  const actionBar = (
    <div className="shrink-0 min-h-[60px] flex items-center px-4 md:px-8 py-2 border-t border-border bg-white dark:bg-surface">
      {actionBarInner}
    </div>
  );

  /* ── Mobile: BaseSlider (right-sliding Vaul panel, full screen) ── */
  if (isMobile) {
    const countBadge = (
      <span className="shrink-0 mr-4 rounded-full border border-warning/30 bg-warning/10 px-2 py-1 text-[11px] font-semibold text-warning tabular-nums">
        {visibleAppointments.length}
      </span>
    );

    // Mobile-only action bar content: drop the redundant "X selected" / prompt
    // text — the top SELECT ALL bar already shows that. Just render the action
    // cluster (or the confirm strip). When neither is actionable, the footer
    // prop is undefined so BaseSlider doesn't render the footer wrapper at all.
    const isActionable = someSelected || pendingConfirm !== null;
    const mobileFooter = !isActionable ? undefined : pendingConfirm ? (
      // Confirm strip — same content as desktop, slightly tighter spacing
      <div className={cn('flex w-full items-center justify-between gap-3', exitingConfirm ? 'pointer-events-none animate-out fade-out-0 slide-out-to-bottom-2 duration-200 fill-mode-forwards' : 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200', 'motion-reduce:animate-none motion-reduce:translate-y-0 motion-reduce:opacity-100')}>
        <p className="min-w-0 text-xs text-foreground-2 truncate">
          {pendingConfirm === 'completed' ? t('needsAttention.confirmCompleted', { count: selected.size }) : t('needsAttention.confirmNoShow', { count: selected.size })}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setExitingConfirm(true); setTimeout(() => { setPendingConfirm(null); setExitingConfirm(false); }, 200); }}
            className="!h-9 !min-h-0 px-3 text-xs font-medium text-foreground-3 hover:text-foreground-1 rounded-md"
          >
            {t('needsAttention.back')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction(pendingConfirm)}
            disabled={bulkLoading !== null}
            className={cn(
              'inline-flex !h-9 !min-h-0 px-3.5 text-xs font-semibold rounded-full gap-1.5',
              pendingConfirm === 'completed'
                ? 'border-success-border/70 bg-success-bg text-success hover:bg-success-bg/70 hover:border-success-border'
                : 'border-warning-border/70 bg-warning-bg text-warning hover:bg-warning-bg/70 hover:border-warning-border',
            )}
          >
            {bulkLoading !== null ? t('needsAttention.updating') : t('needsAttention.confirm')}
          </Button>
        </div>
      </div>
    ) : (
      // Selection state — both buttons get real button substance (outline
      // pills) so they read as a balanced action pair, not a "primary +
      // hyperlink" mismatch. Completed keeps the saturated success-tinted
      // fill so it still dominates as the default outcome; No-show is a
      // hairline outline pill on the surface. They share h-10 and the
      // same pill radius for visual rhythm.
      <div className="flex w-full items-center gap-2.5 py-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200 motion-reduce:animate-none motion-reduce:translate-y-0 motion-reduce:opacity-100">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPendingConfirm('no_show')}
          className={cn(
            'flex-1 !h-10 !min-h-0 px-3 rounded-full text-xs font-semibold gap-1.5',
            'border border-border-strong/60 bg-surface text-foreground-1',
            'hover:bg-surface-active hover:border-border-strong active:scale-[0.97]',
            IOS_EASE,
          )}
        >
          <UserX className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          {t('needsAttention.markSelectedNoShow')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPendingConfirm('completed')}
          className={cn(
            'flex-1 !h-10 !min-h-0 px-3.5 rounded-full text-xs font-semibold gap-1.5',
            'border-success-border/70 bg-success-bg text-success',
            'hover:bg-success-bg/70 hover:border-success-border active:scale-[0.97]',
            IOS_EASE,
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          {t('needsAttention.markSelectedCompleted')}
        </Button>
      </div>
    );

    return (
      <BaseSlider
        isOpen={open}
        onClose={() => handleOpenChange(false)}
        title={t('needsAttention.seeAllTitle')}
        subtitle={t('needsAttention.seeAllDescription')}
        icon={AlertTriangle}
        iconColor="text-warning"
        headerActions={countBadge}
        contentClassName="!p-0 !overflow-hidden"
        footerClassName="pb-[env(safe-area-inset-bottom)]"
        footer={mobileFooter}
      >
        <div className="flex h-full flex-col">
          {/* Description — BaseSlider hides `subtitle` on mobile (`hidden
              md:block`), so render it inline here. Sits above the search bar
              and grounds the modal with the same context the desktop dialog
              gets. */}
          <p className="md:hidden text-xs leading-relaxed text-foreground-3 px-4 pt-3 pb-1">
            {t('needsAttention.seeAllDescription')}
          </p>
          <div className="shrink-0 px-3">
            {filterToolbar}
            {filterBadges}
          </div>
          {appointmentList}
        </div>
      </BaseSlider>
    );
  }

  /* ── Desktop: centered Dialog ── */
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[70] bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200',
            'fixed left-[50%] top-[50%] z-[70] flex w-[calc(100%-2rem)] max-w-3xl min-h-[60vh] max-h-[90vh] translate-x-[-50%] translate-y-[-50%]',
            'flex-col overflow-hidden rounded-2xl border border-border bg-white p-0 shadow-lg dark:bg-surface',
            'focus:outline-none focus-visible:outline-none',
          )}
        >
          {/* Header */}
          <div className="relative shrink-0 px-6 pt-6 pb-0 md:px-8">
            <div className="flex items-center gap-3.5 pr-[4.5rem]">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-warning-border/60 bg-warning-bg/60"
                aria-hidden
              >
                <AlertTriangle className="h-[18px] w-[18px] text-warning" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex min-w-0 items-center gap-2.5">
                  <DialogTitle className="min-w-0 truncate text-lg md:text-xl font-semibold leading-snug text-foreground-1">
                    {t('needsAttention.seeAllTitle')}
                  </DialogTitle>
                  <span className="shrink-0 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning tabular-nums">
                    {visibleAppointments.length}
                  </span>
                </div>
                <DialogDescription asChild>
                  <p className="text-xs leading-relaxed text-foreground-3 dark:text-foreground-2">
                    {t('needsAttention.seeAllDescription')}
                  </p>
                </DialogDescription>
              </div>
            </div>

            {/* Close button */}
            <DialogPrimitive.Close
              className={cn(
                'absolute right-4 top-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground opacity-70 transition-[opacity,color] sm:right-6 sm:top-6',
                'hover:opacity-100 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:pointer-events-none',
              )}
              aria-label={t('needsAttention.close')}
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>

            <DashedDivider marginTop="mt-0" paddingTop="pt-3" className="mb-0" dashPattern="1 1" />
            {filterToolbar}
            {filterBadges}
          </div>

          {appointmentList}
          {actionBar}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Dialog appointment row — checkbox + data (no inline actions)
 * ───────────────────────────────────────────────────────────── */

interface DialogAppointmentRowProps {
  appointment: UnresolvedAppointment;
  isSelected: boolean;
  onToggleSelect: () => void;
  resolved: 'completed' | 'no_show' | null;
  formatDateTime: (iso: string) => string;
  locale: string;
  compact?: boolean;
}

function DialogAppointmentRow({
  appointment,
  isSelected,
  onToggleSelect,
  resolved,
  formatDateTime: _formatDateTime,
  locale,
  compact = false,
}: DialogAppointmentRowProps) {
  const { t } = useTranslation('dashboard');

  const customer = appointment.customerSnapshot;
  const hasCustomer = !!(customer && (customer.firstName || customer.lastName));
  const customerName = hasCustomer
    ? `${customer!.firstName} ${customer!.lastName}`.trim()
    : t('upcomingAppointments.guestCustomer');
  const avatarKey = customer?.userId ?? appointment.uuid;
  const customerEmail = customer?.email ?? '';
  const staffName = appointment.staffSnapshot[0]
    ? `${appointment.staffSnapshot[0].firstName} ${appointment.staffSnapshot[0].lastName}`
    : '·';

  // Staleness — drives avatar dot + date label color (mirrors widget row pattern)
  const hoursSinceEnd =
    (Date.now() - new Date(appointment.endsAt).getTime()) / 3_600_000;
  const stalenessLevel: 'fresh' | 'warning' | 'urgent' =
    hoursSinceEnd > 168 ? 'urgent' : hoursSinceEnd > 48 ? 'warning' : 'fresh';
  const stalenessDot = stalenessLevel === 'urgent' ? 'bg-error' : 'bg-warning';
  const dateLabelColor =
    stalenessLevel === 'urgent'
      ? 'text-error'
      : stalenessLevel === 'warning'
        ? 'text-warning'
        : 'text-foreground-3';

  // Date label + clean time range
  const { dateLabel, timeRange } = useMemo(() => {
    const date = new Date(appointment.scheduledAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    let label: string;
    if (isToday) {
      label = t('needsAttention.today');
    } else if (isYesterday) {
      label = t('needsAttention.yesterday');
    } else {
      const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
      label =
        daysAgo > 0 && daysAgo < 7
          ? t('needsAttention.daysAgo', { count: daysAgo })
          : date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    }
    const start = new Date(appointment.scheduledAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const end = new Date(appointment.endsAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return { dateLabel: label, timeRange: `${start} – ${end}` };
  }, [appointment.scheduledAt, appointment.endsAt, locale, t]);

  if (resolved) {
    return (
      <div className={cn('grid gap-3 items-center py-3 bg-white/40 dark:bg-card/20', compact ? 'grid-cols-[32px_1fr] px-4' : 'grid-cols-[32px_1fr] px-6 md:px-8')}>
        <span />
        <div className="flex items-center gap-2 text-foreground-3">
          {resolved === 'completed' ? (
            <div className="flex items-center gap-1.5 text-success">
              <Check className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{t('needsAttention.completed')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-warning">
              <X className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{t('needsAttention.noShow')}</span>
            </div>
          )}
          <span className="text-xs text-foreground-3">· {customerName}</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3.5 transition-all duration-150 cursor-pointer',
          'hover:bg-primary/5 dark:hover:bg-primary/10',
          isSelected && 'bg-primary/5 dark:bg-primary/10',
        )}
        onClick={onToggleSelect}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <PersonAvatar
              id={avatarKey}
              firstName={customer?.firstName}
              lastName={customer?.lastName}
              profileImage={customer?.profileImage}
              className="size-10 ring-1 ring-border-subtle"
              initialsClassName="text-xs font-semibold"
            />
            {stalenessLevel !== 'fresh' && (
              <span
                className={cn('absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface', stalenessDot)}
                aria-hidden
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground-1 truncate leading-tight">{customerName}</p>
            <p className="text-xs text-foreground-3 truncate mt-0.5">
              {appointment.bookedItemName} <span className="opacity-60">·</span> {staffName}
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0 leading-tight">
            <span className={cn('text-[10px] uppercase tracking-[0.06em] font-medium whitespace-nowrap', dateLabelColor)}>
              {dateLabel}
            </span>
            <span className="text-xs font-medium tabular-nums text-foreground-1 mt-0.5 whitespace-nowrap">
              {timeRange}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-[32px_1fr_1fr_140px] gap-3 items-center px-6 md:px-8 py-3.5 transition-all duration-150 cursor-pointer',
        'hover:bg-primary/5 dark:hover:bg-primary/10',
        isSelected && 'bg-primary/5 dark:bg-primary/10',
      )}
      onClick={onToggleSelect}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Customer */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <PersonAvatar
            id={avatarKey}
            firstName={customer?.firstName}
            lastName={customer?.lastName}
            profileImage={customer?.profileImage}
            className="size-10 ring-1 ring-border-subtle"
            initialsClassName="text-xs font-semibold"
          />
          {stalenessLevel !== 'fresh' && (
            <span
              className={cn('absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface', stalenessDot)}
              aria-hidden
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground-1 truncate leading-tight">{customerName}</p>
          {customerEmail && (
            <p className="text-xs text-foreground-3 truncate mt-0.5">{customerEmail}</p>
          )}
        </div>
      </div>

      {/* Service / Staff */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground-1 truncate leading-tight">
          {appointment.bookedItemName}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <User className="h-2.5 w-2.5 text-foreground-3 shrink-0" />
          <p className="text-xs text-foreground-3 truncate">{staffName}</p>
        </div>
      </div>

      {/* Time — date label + clean range */}
      <div className="flex flex-col items-end leading-tight">
        <span className={cn('text-[10px] uppercase tracking-[0.06em] font-medium whitespace-nowrap', dateLabelColor)}>
          {dateLabel}
        </span>
        <span className="text-sm font-medium tabular-nums text-foreground-1 mt-0.5 whitespace-nowrap">
          {timeRange}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Filter chip — mirrors the Reviews filter chip recipe.
 * Selected state gets the same floating green corner checkmark used in
 * ReviewsFiltersSheet so chips across the app feel like the same control.
 * ───────────────────────────────────────────────────────────── */

function ServiceChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium max-w-full',
        'transition-[transform,colors,box-shadow] duration-150 cursor-pointer',
        'active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2',
        selected
          ? 'border-neutral-500 bg-info-100 text-neutral-900 shadow-xs hover:border-neutral-500 hover:bg-info-100'
          : 'border-border bg-surface text-foreground-1 hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900',
        IOS_EASE,
      )}
    >
      <span className="truncate">{children}</span>
      {selected && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-0 -top-1.5 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-green-400 shadow-sm dark:bg-success"
        >
          <svg
            className="h-2.5 w-2.5 text-foreground-inverse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
 * FilterSection — exact recipe from [ReviewsFiltersSheet]'s `Section`.
 * Eyebrow-style title (terracotta `text-primary-700` uppercase) + optional
 * right-aligned summary. Sections are separated by hairline `border-t`
 * dividers, skipped on the first.
 * ───────────────────────────────────────────────────────────── */

function FilterSection({
  title,
  summary,
  isFirst,
  children,
}: {
  title: string;
  summary?: React.ReactNode;
  isFirst?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('py-4', !isFirst && 'border-t border-border-subtle')}>
      <header className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-500">
          {title}
        </span>
        {summary != null && summary !== '' && (
          <span className="text-[11px] font-medium text-foreground-2 truncate max-w-[55%]">
            {summary}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}
