import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Clock,
  User,
  UserX,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
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
  DrawerHeader,
  DrawerTitle,
} from '../../../shared/components/ui/drawer';
import { DashedDivider } from '../../../shared/components/common/DashedDivider';
import { SearchInput } from '../../../shared/components/common/SearchInput';
import { OptionSelect } from '../../../shared/components/common/OptionSelect';
import DatePicker from '../../../shared/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { cn } from '../../../shared/lib/utils';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import type { NeedsAttentionItem, UnresolvedAppointment } from '../actions';

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
    listNotificationsRequest(0, 20)
      .then(res => {
        const found = res.data.data.some(n => n.type === 'sms_credits_low' && !n.read);
        setHasSmsLow(found);
      })
      .catch(() => {});
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
          {t('needsAttention.title')}
        </p>
        {unresolvedAppointments.length > 0 && (
          <button
            onClick={() => setSeeAllOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors cursor-pointer"
          >
            <span className="text-xs font-medium">{t('needsAttention.seeAll')}</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-2.5 py-2 mt-3">
          <CheckCircle2 className="h-4 w-4 text-foreground-3 shrink-0" />
          <p className="text-sm text-foreground-3">{t('needsAttention.allClear')}</p>
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
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors cursor-pointer shrink-0 ml-auto"
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
  const { t } = useTranslation('dashboard');

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-foreground-3 mb-1">
        {t('needsAttention.unresolvedDescription')}
      </p>

      {/* Appointment rows */}
      <div className="flex flex-col divide-y divide-border-subtle">
        {appointments.map(appt => (
          <UnresolvedAppointmentRow
            key={appt.uuid}
            appointment={appt}
            formatDateTime={formatDateTime}
            locale={locale}
            onUpdated={onAppointmentUpdated}
          />
        ))}
      </div>

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
  onUpdated?: () => void;
}

function UnresolvedAppointmentRow({
  appointment,
  formatDateTime,
  locale: _locale,
  compact = false,
  onUpdated,
}: UnresolvedAppointmentRowProps) {
  const { t } = useTranslation('dashboard');
  const [loading, setLoading] = useState<'completed' | 'no_show' | null>(null);
  const [resolved, setResolved] = useState<'completed' | 'no_show' | null>(null);

  const customerName = `${appointment.customerSnapshot?.firstName} ${appointment.customerSnapshot?.lastName}`;
  const initials = `${appointment.customerSnapshot?.firstName[0] ?? ''}${appointment.customerSnapshot?.lastName[0] ?? ''}`.toUpperCase();
  const staffName = appointment.staffSnapshot[0]
    ? `${appointment.staffSnapshot[0].firstName} ${appointment.staffSnapshot[0].lastName}`
    : '—';

  const handleAction = useCallback(async (status: 'completed' | 'no_show') => {
    setLoading(status);
    try {
      await updateAppointmentRequest(appointment.id, { status });
      setResolved(status);
      onUpdated?.();
    } catch {
      toast.error(t('needsAttention.updateFailed'));
    } finally {
      setLoading(null);
    }
  }, [appointment.uuid, onUpdated]);

  if (resolved) {
    return (
      <div className="flex items-center gap-2 py-2.5 text-foreground-3 animate-in fade-in duration-200">
        {resolved === 'completed' ? (
          <Check className="h-3.5 w-3.5 text-success shrink-0" />
        ) : (
          <X className="h-3.5 w-3.5 text-warning shrink-0" />
        )}
        <span className="text-xs">
          {customerName} — {resolved === 'completed' ? t('needsAttention.completed') : t('needsAttention.noShow')}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-3 ${compact ? 'py-2' : 'py-2.5'} group/unresolved`}>
      {/* Customer info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {appointment.customerSnapshot?.profileImage ? (
          <img
            src={appointment.customerSnapshot?.profileImage}
            alt={customerName}
            className="h-6 w-6 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary">{initials}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-foreground-1 truncate">
              {customerName}
            </span>
            <span className="text-xs text-foreground-3 shrink-0">
              &middot; {appointment.bookedItemName}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <Clock className="h-2.5 w-2.5 text-foreground-3" />
            <span className="text-xs text-foreground-3">
              {formatDateTime(appointment.scheduledAt)}
            </span>
            <span className="text-xs text-foreground-3">
              &middot; {t('needsAttention.with')} {staffName}
            </span>
          </div>
        </div>
      </div>

      {/* Quick action buttons — always visible on mobile, hover on desktop */}
      <div className="flex items-center gap-1.5 shrink-0 ml-8 md:ml-0 md:opacity-0 md:group-hover/unresolved:opacity-100 transition-opacity duration-150">
        <button
          disabled={loading !== null}
          onClick={() => handleAction('completed')}
          className="inline-flex items-center gap-1 px-2.5 py-1 !min-h-0 !h-auto rounded-full text-xs font-medium
            border border-green-200 bg-green-50 text-green-800
            hover:bg-green-100 hover:border-green-300
            focus-visible:ring-focus/60
            disabled:opacity-50 transition-colors cursor-pointer"
        >
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          {loading === 'completed' ? '...' : t('needsAttention.completed')}
        </button>
        <button
          disabled={loading !== null}
          onClick={() => handleAction('no_show')}
          className="inline-flex items-center gap-1 px-2.5 py-1 !min-h-0 !h-auto rounded-full text-xs font-medium
            border border-primary/20 bg-primary/5 text-primary
            hover:bg-primary/10 hover:border-primary/40
            focus-visible:ring-focus/60
            disabled:opacity-50 transition-colors cursor-pointer"
        >
          <UserX className="h-3 w-3 shrink-0" />
          {loading === 'no_show' ? '...' : t('needsAttention.noShow')}
        </button>
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
  const { t } = useTranslation('dashboard');
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

  // Filter state (applied)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Draft filter state (inside popover, staged until Apply)
  const [draftService, setDraftService] = useState<string | null>(null);
  const [draftDateFrom, setDraftDateFrom] = useState<Date | null>(null);
  const [draftDateTo, setDraftDateTo] = useState<Date | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);

  // Sync drafts when popover opens
  const handleFilterOpenChange = useCallback((open: boolean) => {
    if (open) {
      setDraftService(selectedService);
      setDraftDateFrom(dateFrom);
      setDraftDateTo(dateTo);
    }
    setFilterOpen(open);
  }, [selectedService, dateFrom, dateTo]);

  // Apply drafts to real filter state
  const applyFilters = useCallback(() => {
    setSelectedService(draftService);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setFilterOpen(false);
  }, [draftService, draftDateFrom, draftDateTo]);

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

  // Client-side filtering
  const filteredAppointments = useMemo(() => {
    return visibleAppointments.filter(appt => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const customer = `${appt.customerSnapshot.firstName} ${appt.customerSnapshot.lastName}`.toLowerCase();
        const staff = appt.staffSnapshot[0]
          ? `${appt.staffSnapshot[0].firstName} ${appt.staffSnapshot[0].lastName}`.toLowerCase()
          : '';
        if (!customer.includes(q) && !staff.includes(q)) return false;
      }
      if (selectedService && appt.bookedItemName !== selectedService) return false;
      const d = new Date(appt.scheduledAt);
      if (dateFrom) {
        const f = new Date(dateFrom);
        f.setHours(0, 0, 0, 0);
        if (d < f) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [visibleAppointments, searchQuery, selectedService, dateFrom, dateTo]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedService !== null || dateFrom !== null || dateTo !== null;
  const activeFilterCount = (selectedService !== null ? 1 : 0) + (dateFrom !== null ? 1 : 0) + (dateTo !== null ? 1 : 0);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedService(null);
    setDateFrom(null);
    setDateTo(null);
  }, []);

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

  const filterToolbar = (
    <div className="flex items-center gap-2 py-3">
      <SearchInput
        placeholder={t('needsAttention.searchPlaceholder')}
        value={searchQuery}
        onChange={setSearchQuery}
        className="flex-1 min-w-0"
        inputClassName="!h-10 !text-xs !rounded-full"
      />
      <Popover open={filterOpen} onOpenChange={handleFilterOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'shrink-0 h-10 gap-1.5 rounded-full px-3.5 text-xs font-medium border-border',
              'hover:border-border-strong hover:bg-surface/80',
              filterOpen && 'border-border-strong bg-muted/50',
              activeFilterCount > 0 && 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10',
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t('needsAttention.filters')}
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 overflow-visible" align="end" sideOffset={8}>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-3">{t('needsAttention.dateRange')}</p>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker value={draftDateFrom} onChange={setDraftDateFrom} placeholder={t('needsAttention.dateFrom')} className="!h-9 text-xs w-full" contentClassName="!z-[200]" />
                <DatePicker value={draftDateTo} onChange={setDraftDateTo} placeholder={t('needsAttention.dateTo')} className="!h-9 text-xs w-full" contentClassName="!z-[200]" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-3">{t('needsAttention.service')}</p>
              <OptionSelect
                value={draftService ?? ''}
                onChange={(val) => setDraftService(val || null)}
                options={[{ value: '', label: t('needsAttention.allServices') }, ...serviceOptions]}
                placeholder={t('needsAttention.filterByService')}
                className="w-full !space-y-0 !pt-0 [&_button]:!bg-surface [&_button]:dark:!bg-neutral-900 [&_button]:hover:!bg-surface/80"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2">
            <Button variant="ghost" size="sm" onClick={() => { setDraftService(null); setDraftDateFrom(null); setDraftDateTo(null); }} disabled={draftService === null && draftDateFrom === null && draftDateTo === null} className="rounded-full text-xs !h-7 px-3">{t('needsAttention.clearFilters')}</Button>
            <Button size="sm" onClick={applyFilters} className="rounded-full text-xs !h-7 px-4">{t('needsAttention.apply')}</Button>
          </div>
        </PopoverContent>
      </Popover>
      {hasActiveFilters && (
        <button onClick={clearAllFilters} className="shrink-0 text-xs text-primary hover:underline cursor-pointer">{t('needsAttention.clearAll')}</button>
      )}
    </div>
  );

  const filterBadges = (activeFilterCount > 0 || searchQuery.trim()) ? (
    <div className="flex flex-wrap gap-1.5 pb-3">
      {searchQuery.trim() && (
        <Badge variant="filter" className="flex items-center gap-1 cursor-pointer text-xs" onClick={() => setSearchQuery('')}>
          {t('needsAttention.searchLabel')}: {searchQuery.trim()}<X className="h-3.5 w-3.5 ml-0.5" />
        </Badge>
      )}
      {dateFrom && (
        <Badge variant="filter" className="flex items-center gap-1 cursor-pointer text-xs" onClick={() => setDateFrom(null)}>
          {t('needsAttention.dateFrom')}: {dateFrom.toLocaleDateString(locale)}<X className="h-3.5 w-3.5 ml-0.5" />
        </Badge>
      )}
      {dateTo && (
        <Badge variant="filter" className="flex items-center gap-1 cursor-pointer text-xs" onClick={() => setDateTo(null)}>
          {t('needsAttention.dateTo')}: {dateTo.toLocaleDateString(locale)}<X className="h-3.5 w-3.5 ml-0.5" />
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
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border sticky top-0 z-10 bg-muted/40 dark:bg-background/70 backdrop-blur-sm">
          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
          <span className="text-xs font-medium text-foreground-3 uppercase tracking-wider">
            {someSelected ? t('needsAttention.selected', { count: selected.size }) : t('needsAttention.selectAll')}
          </span>
        </div>
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

  const actionBar = (
    <div className="shrink-0 min-h-[60px] flex items-center justify-between gap-3 px-4 md:px-8 py-2 border-t border-border bg-white dark:bg-surface">
      {pendingConfirm ? (
        <div className={cn('flex w-full items-center justify-between gap-3 md:gap-4', exitingConfirm ? 'pointer-events-none animate-out fade-out-0 slide-out-to-bottom-2 duration-200 fill-mode-forwards' : 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200', 'motion-reduce:animate-none motion-reduce:translate-y-0 motion-reduce:opacity-100')}>
          <p className="min-w-0 text-xs md:text-sm text-foreground-2">
            {pendingConfirm === 'completed' ? t('needsAttention.confirmCompleted', { count: selected.size }) : t('needsAttention.confirmNoShow', { count: selected.size })}
          </p>
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setExitingConfirm(true); setTimeout(() => { setPendingConfirm(null); setExitingConfirm(false); }, 200); }} className="!h-8 !min-h-8 px-2.5 md:px-3.5 text-xs font-medium text-foreground-3 hover:text-foreground-1 rounded-full">{t('needsAttention.back')}</Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction(pendingConfirm)} disabled={bulkLoading !== null} className={cn('inline-flex !h-8 !min-h-8 px-2.5 md:px-3.5 text-xs font-medium rounded-full', pendingConfirm === 'completed' ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100 hover:border-green-300' : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40')}>{bulkLoading !== null ? t('needsAttention.updating') : t('needsAttention.confirm')}</Button>
          </div>
        </div>
      ) : (
        <>
          <span className={cn('text-xs font-medium transition-opacity duration-150', someSelected ? 'text-foreground-2' : 'text-foreground-3')}>{someSelected ? t('needsAttention.selected', { count: selected.size }) : t('needsAttention.selectToResolve')}</span>
          <div className={cn('flex items-center gap-2 transition-opacity duration-150', someSelected ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
            <Button size="sm" variant="outline" onClick={() => setPendingConfirm('completed')} className="rounded-full border-green-200 bg-green-50 text-green-800 hover:bg-green-100 hover:border-green-300 focus-visible:ring-focus/60 !h-7 !min-h-0 text-xs gap-1.5"><CheckCircle2 className="h-3 w-3 shrink-0" />{t('needsAttention.markSelectedCompleted')}</Button>
            <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
            <Button size="sm" variant="outline" onClick={() => setPendingConfirm('no_show')} className="rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 focus-visible:ring-focus/60 !h-7 !min-h-0 text-xs gap-1.5"><UserX className="h-3 w-3 shrink-0" />{t('needsAttention.markSelectedNoShow')}</Button>
          </div>
        </>
      )}
    </div>
  );

  /* ── Mobile: Drawer ── */
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[95vh] flex flex-col bg-white dark:bg-surface border-border focus:outline-none focus-visible:outline-none">
          <DrawerHeader className="!text-left shrink-0 px-4">
            <div className="flex items-center gap-3">
              <DrawerTitle className="text-base font-semibold text-foreground-1">{t('needsAttention.seeAllTitle')}</DrawerTitle>
              <span className="shrink-0 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">{visibleAppointments.length}</span>
            </div>
            <DrawerDescription className="text-xs text-foreground-3 dark:text-foreground-2">{t('needsAttention.seeAllDescription')}</DrawerDescription>
          </DrawerHeader>
          <div className="shrink-0 px-4">
            {filterToolbar}
            {filterBadges}
          </div>
          {appointmentList}
          {actionBar}
        </DrawerContent>
      </Drawer>
    );
  }

  /* ── Desktop: Dialog ── */
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
            <div className="flex items-center gap-4 pr-[4.5rem]">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 dark:bg-muted/30"
                aria-hidden
              >
                <AlertTriangle className="h-6 w-6 text-warning" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex min-w-0 items-center gap-3">
                  <DialogTitle className="min-w-0 truncate text-lg font-semibold leading-snug text-foreground-1">
                    {t('needsAttention.seeAllTitle')}
                  </DialogTitle>
                  <span className="shrink-0 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
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
  formatDateTime,
  locale,
  compact = false,
}: DialogAppointmentRowProps) {
  const { t } = useTranslation('dashboard');

  const customerName = `${appointment.customerSnapshot.firstName} ${appointment.customerSnapshot.lastName}`;
  const initials = `${appointment.customerSnapshot.firstName[0] ?? ''}${appointment.customerSnapshot.lastName[0] ?? ''}`.toUpperCase();
  const staffName = appointment.staffSnapshot[0]
    ? `${appointment.staffSnapshot[0].firstName} ${appointment.staffSnapshot[0].lastName}`
    : '—';

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
          <span className="text-xs text-foreground-3">— {customerName}</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 transition-all duration-150 cursor-pointer',
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
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {appointment.customerSnapshot.profileImage ? (
            <img src={appointment.customerSnapshot.profileImage} alt={customerName} className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground-1 truncate">{customerName}</p>
            <p className="text-xs text-foreground-3 truncate mt-0.5">
              {appointment.bookedItemName} &middot; {staffName}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5 text-foreground-3 shrink-0" />
              <p className="text-xs text-foreground-3 tabular-nums">
                {formatDateTime(appointment.scheduledAt)}
                {' · '}
                {new Date(appointment.scheduledAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(appointment.endsAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-[32px_1fr_1fr_120px] gap-3 items-center px-6 md:px-8 py-3 transition-all duration-150 cursor-pointer',
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
      <div className="flex items-center gap-2 min-w-0">
        {appointment.customerSnapshot.profileImage ? (
          <img
            src={appointment.customerSnapshot.profileImage}
            alt={customerName}
            className="h-7 w-7 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary">{initials}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground-1 truncate">{customerName}</p>
          <p className="text-xs text-foreground-3 truncate">{appointment.customerSnapshot.email}</p>
        </div>
      </div>

      {/* Service / Staff */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground-1 truncate">
          {appointment.bookedItemName}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <User className="h-2.5 w-2.5 text-foreground-3" />
          <p className="text-xs text-foreground-3 truncate">{staffName}</p>
        </div>
      </div>

      {/* Time */}
      <div className="text-right">
        <p className="text-xs text-foreground-2 tabular-nums">
          {formatDateTime(appointment.scheduledAt)}
        </p>
        <div className="flex items-center gap-1 justify-end mt-0.5 flex-nowrap">
          <Clock className="h-2.5 w-2.5 text-foreground-3 shrink-0" />
          <p className="text-xs text-foreground-3 tabular-nums whitespace-nowrap">
            {new Date(appointment.scheduledAt).toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' – '}
            {new Date(appointment.endsAt).toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
