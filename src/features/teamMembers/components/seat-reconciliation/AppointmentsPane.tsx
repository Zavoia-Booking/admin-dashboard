import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../../shared/components/ui/badge';
import { Skeleton } from '../../../../shared/components/ui/skeleton';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AppointmentRow } from './AppointmentRow';
import { BulkActionsBar } from './BulkActionsBar';
import { type EligibleStaffMap } from './eligibility';
import type { Decision, DecisionMap } from './useDecisions';
import type { OffboardPreviewAppointment } from '../../api';

export type StaffById = Map<
  number,
  { firstName: string; lastName: string; email: string; profileImage: string | null }
>;

interface AppointmentsPaneProps {
  appointments: OffboardPreviewAppointment[];
  selectedUserId: number | null;
  eligibleStaffMap: EligibleStaffMap;
  orphanedAppointmentIds: number[];
  staffById: StaffById;
  decisions: DecisionMap;
  onDecide: (appointmentId: number, decision: Decision | null) => void;
  onDecideMany: (ids: number[], decision: Decision) => void;
  loading: boolean;
}

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};
const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

const formatDayHeader = (iso: string, locale: string | undefined, t: (k: string) => string) => {
  const today = startOfDay(new Date()).getTime();
  const target = startOfDay(new Date(iso)).getTime();
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return t('teamMembers:seatOverflow.today');
  if (diff === 1) return t('teamMembers:seatOverflow.tomorrow');
  if (diff === -1) return t('teamMembers:seatOverflow.yesterday');
  return new Date(iso)
    .toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });
};

export const AppointmentsPane: React.FC<AppointmentsPaneProps> = ({
  appointments,
  selectedUserId,
  eligibleStaffMap,
  orphanedAppointmentIds,
  staffById,
  decisions,
  onDecide,
  onDecideMany,
  loading,
}) => {
  const { t, i18n } = useTranslation();
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);

  const handlePopoverChange = useCallback(
    (apptId: number, open: boolean) => {
      setOpenPopoverId(open ? apptId : null);
    },
    [],
  );

  const total = appointments.length;
  const decided = appointments.filter((a) => decisions.has(a.id)).length;
  const allHandled = total > 0 && decided === total;
  const undecided = appointments.filter((a) => !decisions.has(a.id));
  const orphanSet = React.useMemo(() => new Set(orphanedAppointmentIds), [orphanedAppointmentIds]);
  const orphanCount = orphanSet.size;

  const grouped = appointments.reduce<Record<string, OffboardPreviewAppointment[]>>(
    (acc, apt) => {
      const k = dayKey(apt.scheduledAt);
      (acc[k] ??= []).push(apt);
      return acc;
    },
    {},
  );
  const dayKeys = Object.keys(grouped).sort();

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground-1">
              {t('teamMembers:seatOverflow.apptsTitle')}
            </div>
            <div className="mt-0.5 text-xs text-foreground-3">
              {selectedUserId == null
                ? t('teamMembers:seatOverflow.selectMembersHint')
                : total === 0
                ? t('teamMembers:seatOverflow.nothingToHandle')
                : t('teamMembers:seatOverflow.apptsSubtitle', { count: total })}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!loading && total > 0 && (
              <Badge
                variant={allHandled ? 'default' : 'secondary'}
                className="text-[10.5px] tabular-nums"
              >
                {t('teamMembers:seatOverflow.handledCount', { decided, total })}
              </Badge>
            )}
            {!loading && total > 0 && (
              <BulkActionsBar
                undecidedAppts={undecided}
                selectedUserId={selectedUserId}
                eligibleStaffMap={eligibleStaffMap}
                onApplyMany={onDecideMany}
              />
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
        {loading && (
          <div
            className="flex flex-col gap-2"
            role="status"
            aria-label={t('teamMembers:seatOverflow.loadingPreview')}
          >
            <div className="mb-1">
              <Skeleton className="h-3 w-32" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <div className="mt-1 flex items-center gap-2 sm:hidden">
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="hidden items-center justify-center sm:flex">
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <div className="hidden items-center justify-center gap-2 sm:flex">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <div className="flex shrink-0 items-center justify-end gap-1.5">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && total === 0 && selectedUserId != null && (
          <div className="flex items-center gap-3 rounded-lg bg-success-bg p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <p className="text-sm text-foreground-1">
              {t('teamMembers:seatOverflow.noAppointments')}
            </p>
          </div>
        )}

        {!loading && total > 0 && orphanCount > 0 && (
          <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-bg/40 p-3 dark:bg-warning-bg/60">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-warning-bg text-warning dark:bg-warning-bg/80">
              <AlertTriangle className="size-3" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground-1">
                {t('teamMembers:seatOverflow.orphanBannerTitle', { count: orphanCount })}
              </div>
              <p className="mt-0.5 text-[11.5px] leading-snug text-foreground-3">
                {t('teamMembers:seatOverflow.orphanBannerBody')}
              </p>
            </div>
          </div>
        )}

        {!loading && total > 0 && (
          <div className="flex flex-col gap-5">
            {dayKeys.map((k) => (
              <div key={k} className="flex flex-col gap-2">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-foreground-3">
                  {formatDayHeader(grouped[k][0].scheduledAt, i18n.language, t as any)}
                  {' · '}
                  {t('teamMembers:seatOverflow.dayApptsCount', {
                    count: grouped[k].length,
                  })}
                </div>
                <div className="flex flex-col gap-2">
                  {grouped[k].map((apt) => {
                    const baseEligible = eligibleStaffMap[apt.id] ?? [];
                    const eligibleStaff = selectedUserId == null
                      ? baseEligible
                      : baseEligible.filter((s) => s.userId !== selectedUserId);
                    return (
                      <AppointmentRow
                        key={apt.id}
                        appt={apt}
                        decision={decisions.get(apt.id)}
                        eligibleStaff={eligibleStaff}
                        isOrphan={orphanSet.has(apt.id)}
                        currentStaff={
                          apt.staffUserIds && apt.staffUserIds[0] != null
                            ? staffById.get(apt.staffUserIds[0]) ?? null
                            : null
                        }
                        popoverOpen={openPopoverId === apt.id}
                        onPopoverChange={(open) => handlePopoverChange(apt.id, open)}
                        onPick={(decision) => {
                          onDecide(apt.id, decision);
                          setOpenPopoverId(null);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
