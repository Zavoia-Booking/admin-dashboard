import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Loader2, Users, ArrowRight, Sparkles, LogOut, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

import { Button } from '../../../shared/components/ui/button';
import { Dialog, DialogPortal, DialogTitle } from '../../../shared/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '../../../shared/components/ui/drawer';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import { usePlatform } from '../../../shared/hooks/usePlatform';
import { cn } from '../../../shared/lib/utils';

import { selectCurrentUser } from '../../auth/selectors';
import { fetchCurrentUserAction, logoutRequestAction } from '../../auth/actions';
import { UserRole } from '../../../shared/types/auth';
import { selectSubscriptionSummary } from '../../settings/selectors';
import { getSubscriptionSummaryAction } from '../../settings/actions';
import { selectTeamMembers, selectIsOffboarding, selectOffboardError } from '../selectors';
import { listTeamMembersAction, bulkOffboardTeamMembersAction } from '../actions';
import { getAllLocationsSelector } from '../../locations/selectors';
import { listLocationsAction } from '../../locations/actions';
import { abortPendingPayment } from '../../settings/api';
import {
  getBulkOffboardPreviewApi,
  getOffboardPreviewApi,
  getLocationUnassignPreviewApi,
} from '../api';
import type { OffboardPreviewResponse } from '../api';
import type { TeamMember } from '../../../shared/types/team-member';

import {
  selectReconciliationOpen,
  selectReconciliationMode,
  selectReconciliationUserId,
  selectReconciliationLocationId,
  selectIsUnassigning,
} from '../../reconciliation/selectors';
import {
  closeReconciliationAction,
  unassignFromLocationAction,
} from '../../reconciliation/actions';

import { MembersAside } from './seat-reconciliation/MembersAside';
import { AppointmentsPane } from './seat-reconciliation/AppointmentsPane';
import { SeatBar } from './seat-reconciliation/SeatBar';
import { MemberRow } from './seat-reconciliation/MemberRow';
import { SeatPayBranch } from './seat-reconciliation/SeatPayBranch';
import { useDecisions } from './seat-reconciliation/useDecisions';

const PREVIEW_DEBOUNCE_MS = 200;
const PERMITTED_DEFER_PATHS = ['/account', '/support', '/my-profile', '/my-account'];

const isPermittedDeferPath = (pathname: string) =>
  PERMITTED_DEFER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const SeatOverflowGate: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  // Store policy: no payment surfaces in the native app — the pay banner, billing
  // navigation, and Stripe confirmation branch are web-only.
  const { isNative } = usePlatform();
  const currentUser = useSelector(selectCurrentUser);
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const teamMembers = useSelector(selectTeamMembers);
  const isOffboarding = useSelector(selectIsOffboarding);
  const offboardError = useSelector(selectOffboardError);
  const isUnassigning = useSelector(selectIsUnassigning);
  const locations = useSelector(getAllLocationsSelector);

  const open = useSelector(selectReconciliationOpen);
  const mode = useSelector(selectReconciliationMode);
  const reduxUserId = useSelector(selectReconciliationUserId);
  const reduxLocationId = useSelector(selectReconciliationLocationId);

  const isSeatOverflow = mode === 'seat_overflow';
  const isRemoveMember = mode === 'remove_member';
  const isUnassignLocation = mode === 'unassign_from_location';

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { decisions, decide, decideMany, setDecisions } = useDecisions();
  const wasCommittingRef = useRef(false);

  const [preview, setPreview] = useState<OffboardPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pending Stripe payment confirmation branch — only relevant in seat_overflow mode.
  const [isPayingForSeats, setIsPayingForSeats] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const isEntitled = currentUser?.entitlements?.entitled ?? false;
  const paidSeats = currentUser?.entitlements?.paidTeamSeats ?? 0;
  const usedSeats = currentUser?.entitlements?.usedSeats ?? 0;
  const overBy = Math.max(0, usedSeats - paidSeats);

  // Show only when Redux says open AND (in seat_overflow) entitlements still over.
  const seatOverflowOk = isSeatOverflow
    ? currentUser?.role === UserRole.OWNER && isEntitled && paidSeats > 0 && usedSeats > paidSeats
    : true;
  // In seat_overflow mode, hide the modal while the user is on billing/support/profile so they
  // can act on it. The detector won't reopen it on those paths either.
  const shouldShow =
    open && seatOverflowOk && !(isSeatOverflow && isPermittedDeferPath(location.pathname));

  const dataReady =
    teamMembers.length > 0 && (isSeatOverflow ? !!subscriptionSummary : true);

  // Fetch supporting data when the modal opens.
  useEffect(() => {
    if (!shouldShow) return;
    if (teamMembers.length === 0) dispatch(listTeamMembersAction.request());
    if (isSeatOverflow && !subscriptionSummary) dispatch(getSubscriptionSummaryAction.request());
    if (isUnassignLocation && (!locations || locations.length === 0)) {
      dispatch(listLocationsAction.request());
    }
  }, [shouldShow, dispatch, subscriptionSummary, teamMembers.length, isSeatOverflow, isUnassignLocation, locations]);

  // Force-select preselected member in non-seat_overflow modes.
  useEffect(() => {
    if (!shouldShow) return;
    if (isRemoveMember || isUnassignLocation) {
      if (reduxUserId != null && selectedUserId !== reduxUserId) {
        setSelectedUserId(reduxUserId);
      }
    }
  }, [shouldShow, isRemoveMember, isUnassignLocation, reduxUserId, selectedUserId]);

  // Reset state whenever the modal closes (so reopening is clean).
  useEffect(() => {
    if (!open) {
      setSelectedUserId(null);
      setDecisions(new Map());
      setPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
    }
  }, [open, setDecisions]);

  const ownerMember = useMemo(
    () => teamMembers.find((m: TeamMember) => m.id === currentUser?.id) ?? null,
    [teamMembers, currentUser?.id],
  );
  const candidateMembers = useMemo(
    () =>
      teamMembers.filter(
        (m: TeamMember) =>
          m.role === UserRole.TEAM_MEMBER &&
          m.roleStatus === 'active' &&
          m.id !== currentUser?.id,
      ),
    [teamMembers, currentUser?.id],
  );

  const selectedTeamMember = useMemo(
    () =>
      selectedUserId == null
        ? null
        : teamMembers.find((m: TeamMember) => m.id === selectedUserId) ?? null,
    [teamMembers, selectedUserId],
  );

  const selectedLocation = useMemo(
    () =>
      reduxLocationId == null
        ? null
        : (locations || []).find((l: any) => l.id === reduxLocationId) ?? null,
    [locations, reduxLocationId],
  );

  const selectMember = useCallback((id: number) => {
    setSelectedUserId((prev) => (prev === id ? null : id));
    setDecisions(new Map());
  }, [setDecisions]);

  // Preview fetch — branches on mode for which endpoint to hit.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (!shouldShow || selectedUserId == null) {
      setPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    const targetId = selectedUserId;

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      setPreviewLoading(true);
      setPreviewError(null);

      const fetcher: Promise<OffboardPreviewResponse> = isUnassignLocation && reduxLocationId != null
        ? getLocationUnassignPreviewApi(targetId, reduxLocationId, controller.signal)
        : isRemoveMember
        ? getOffboardPreviewApi(targetId, { signal: controller.signal })
        : getBulkOffboardPreviewApi([targetId], controller.signal);

      fetcher
        .then((data) => {
          if (controller.signal.aborted) return;
          setPreview(data);

          setDecisions((prev) => {
            const allowed = new Set(data.appointments.map((a) => a.id));
            const next: typeof prev = new Map();
            prev.forEach((dec, aptId) => {
              if (allowed.has(aptId)) next.set(aptId, dec);
            });
            for (const id of data.orphanedAppointmentIds) {
              if (!next.has(id)) next.set(id, { kind: 'cancel' });
            }
            const toDrop: number[] = [];
            next.forEach((dec, aptId) => {
              if (dec.kind === 'reassign' && dec.toUserId === targetId) {
                toDrop.push(aptId);
              }
            });
            toDrop.forEach((id) => next.delete(id));
            return next;
          });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setPreviewError(
            err?.response?.data?.message || err?.message || t('teamMembers:seatOverflow.previewFailed'),
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setPreviewLoading(false);
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [shouldShow, selectedUserId, isUnassignLocation, isRemoveMember, reduxLocationId, setDecisions, t]);

  // After a successful commit: clear local state, and (for modes B/C) close the modal.
  // The unassign-location saga already closes the modal; this handles offboard.
  const isCommitting = isOffboarding || isUnassigning;
  useEffect(() => {
    if (isCommitting) {
      wasCommittingRef.current = true;
      return;
    }
    if (wasCommittingRef.current && !isCommitting) {
      wasCommittingRef.current = false;
      if (!offboardError) {
        setSelectedUserId(null);
        setDecisions(new Map());
        setPreview(null);
        setPreviewError(null);
        if (isRemoveMember) {
          dispatch(closeReconciliationAction());
        }
      }
    }
  }, [isCommitting, offboardError, isRemoveMember, setDecisions, dispatch]);

  const staffById = useMemo(() => {
    const map = new Map<
      number,
      { userId: number; firstName: string; lastName: string; email: string; profileImage: string | null }
    >();
    for (const m of teamMembers) {
      map.set(m.id, {
        userId: m.id,
        firstName: m.firstName ?? '',
        lastName: m.lastName ?? '',
        email: m.email ?? '',
        profileImage: m.profileImage ?? null,
      });
    }
    return map;
  }, [teamMembers]);

  const totalAppts = preview?.appointments.length ?? 0;
  const allAppointmentsHandled =
    !!preview && preview.appointments.every((a) => decisions.has(a.id));
  const canCommit =
    selectedUserId !== null && (totalAppts === 0 || allAppointmentsHandled);

  const handleCommit = useCallback(() => {
    if (!preview || !canCommit || selectedUserId == null) return;
    const actions = preview.appointments.map((apt) => {
      const dec = decisions.get(apt.id);
      if (!dec || dec.kind === 'cancel') {
        return { appointmentId: apt.id, cancel: true };
      }
      return { appointmentId: apt.id, newStaffUserId: dec.toUserId };
    });
    if (isUnassignLocation && reduxLocationId != null) {
      dispatch(
        unassignFromLocationAction.request({
          userId: selectedUserId,
          locationId: reduxLocationId,
          appointmentActions: actions,
        }),
      );
      return;
    }
    dispatch(
      bulkOffboardTeamMembersAction.request({
        userIds: [selectedUserId],
        appointmentActions: actions,
      }),
    );
  }, [preview, canCommit, decisions, dispatch, selectedUserId, isUnassignLocation, reduxLocationId]);

  const handleGoToBilling = useCallback(() => {
    // Close the modal explicitly and navigate. The detector won't reopen on `/account`,
    // and will reopen automatically if the user navigates back without resolving the overflow.
    dispatch(closeReconciliationAction());
    navigate('/account?tab=billing');
  }, [dispatch, navigate]);

  const handleLogout = useCallback(() => {
    dispatch(logoutRequestAction.request());
  }, [dispatch]);

  const handleCloseManually = useCallback(() => {
    if (isCommitting) return;
    dispatch(closeReconciliationAction());
  }, [dispatch, isCommitting]);

  const handleRetryPendingPayment = useCallback(async () => {
    const pending = subscriptionSummary?.pendingPayment;
    if (!pending?.clientSecret) return;

    try {
      setIsPayingForSeats(true);
      setPaymentError(null);

      const publishableKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) throw new Error('Stripe publishable key not configured');

      const stripe = await loadStripe(publishableKey);
      if (!stripe) throw new Error('Failed to load Stripe');

      const { error } = await stripe.confirmCardPayment(pending.clientSecret);
      if (error) {
        setPaymentError(error.message || t('teamMembers:seatOverflow.paymentFailed'));
      } else {
        dispatch(fetchCurrentUserAction.request());
        dispatch(getSubscriptionSummaryAction.request());
        dispatch(listTeamMembersAction.request());
      }
    } catch (err: any) {
      setPaymentError(
        err?.response?.data?.message || err?.message || t('teamMembers:seatOverflow.paymentFailed'),
      );
    } finally {
      setIsPayingForSeats(false);
    }
  }, [subscriptionSummary?.pendingPayment, dispatch, t]);

  const handleAbortPendingPayment = useCallback(async () => {
    try {
      setIsPayingForSeats(true);
      setPaymentError(null);
      await abortPendingPayment();
      dispatch(getSubscriptionSummaryAction.request());
    } catch (err: any) {
      setPaymentError(
        err?.response?.data?.message || err?.message || t('teamMembers:seatOverflow.paymentFailed'),
      );
    } finally {
      setIsPayingForSeats(false);
    }
  }, [dispatch, t]);

  if (!shouldShow) return null;

  const hasPendingPayment = isSeatOverflow && !!subscriptionSummary?.pendingPayment;

  const primaryDisabled =
    !dataReady || isCommitting || isPayingForSeats || hasPendingPayment || !canCommit;

  // ---- Mode-specific copy ----

  const memberFirstName = selectedTeamMember?.firstName || selectedTeamMember?.email || '';
  const locationName = selectedLocation?.name || '';

  const titleText = isUnassignLocation
    ? t('teamMembers:seatOverflow.unassignTitle', { name: memberFirstName, location: locationName })
    : isRemoveMember
    ? t('teamMembers:seatOverflow.removeMemberTitle', { name: memberFirstName })
    : t('teamMembers:seatOverflow.reconcileTitle');

  const subtitleText = isUnassignLocation
    ? t('teamMembers:seatOverflow.unassignSubtitle')
    : isRemoveMember
    ? t('teamMembers:seatOverflow.removeMemberSubtitle')
    : t(
        isNative
          ? 'teamMembers:seatOverflow.reconcileSubtitleNative'
          : 'teamMembers:seatOverflow.reconcileSubtitle',
        {
          from: usedSeats,
          to: paidSeats,
          count: overBy,
          overBy,
        },
      );

  const confirmText =
    selectedUserId == null
      ? t('teamMembers:seatOverflow.confirmRemovePick')
      : isUnassignLocation
      ? t('teamMembers:seatOverflow.confirmUnassign')
      : t('teamMembers:seatOverflow.confirmRemoveMember');

  // Mode-driven UI flags
  const showAside = isSeatOverflow;
  const showPayBanner = isSeatOverflow && !hasPendingPayment && !isNative;
  const showLogout = isSeatOverflow;
  const showManualClose = !isSeatOverflow;

  // Native replacement for SeatPayBranch: neutral state notice, no amounts, no payment actions.
  const pendingNativeNotice = (
    <div className="rounded-xl border border-warning-border bg-warning-bg p-4">
      <h3 className="mb-1 font-medium text-foreground-1">
        {t('teamMembers:seatOverflow.pendingNativeTitle')}
      </h3>
      <p className="text-sm text-foreground-3">
        {t('teamMembers:seatOverflow.pendingNativeBody')}
      </p>
    </div>
  );

  const payBanner = showPayBanner ? (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 dark:bg-primary/10 sm:flex sm:items-center sm:gap-3 sm:py-2.5">
      <div className="flex items-start gap-3 sm:items-center sm:flex-1 sm:min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground-1">
            {t('teamMembers:seatOverflow.payForSeatsBannerTitle')}
          </div>
          <div className="mt-1 text-xs text-foreground-3 sm:mt-0">
            {t('teamMembers:seatOverflow.payForSeatsBannerBody', { count: overBy })}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        rounded="full"
        onClick={handleGoToBilling}
        className="mt-3 w-full justify-center sm:mt-0 sm:w-auto sm:shrink-0"
      >
        {t('teamMembers:seatOverflow.payForSeatsCta')}
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  ) : null;

  // ============ MOBILE ============
  if (isMobile) {
    // In modes B/C the member is preselected → drawer should auto-open and stay open.
    const drawerOpen = selectedUserId != null && !hasPendingPayment;

    return (
      <>
        <Dialog open modal>
          <DialogPortal>
            <div className="fixed inset-0 z-[210] bg-black/40 backdrop-blur-sm" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              onPointerDownOutside={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => {
                if (showManualClose) handleCloseManually();
                else e.preventDefault();
              }}
              className={cn(
                'fixed inset-0 z-[210] flex flex-col overflow-hidden bg-background',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                'focus:outline-none focus-visible:outline-none',
              )}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-warning/30 bg-warning-bg text-warning">
                  <Users className="h-4.5 w-4.5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="truncate text-sm font-semibold text-foreground-1">
                    {titleText}
                  </DialogTitle>
                  <p className="mt-0.5 truncate text-[11.5px] text-foreground-3">{subtitleText}</p>
                </div>
                {showManualClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    onClick={handleCloseManually}
                    className="h-8 w-8 shrink-0 px-0"
                    aria-label={t('teamMembers:seatOverflow.close')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Body — mobile only renders the members list view in seat_overflow mode.
                  In modes B/C the drawer below carries everything. */}
              {hasPendingPayment && subscriptionSummary?.pendingPayment ? (
                <div className="flex-1 overflow-y-auto p-4">
                  {isNative ? (
                    pendingNativeNotice
                  ) : (
                    <SeatPayBranch
                      pendingPayment={subscriptionSummary.pendingPayment as any}
                      paymentError={paymentError}
                      isPayingForSeats={isPayingForSeats}
                      onRetry={handleRetryPendingPayment}
                      onAbort={handleAbortPendingPayment}
                    />
                  )}
                </div>
              ) : showAside ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="shrink-0 space-y-3 border-b border-border bg-muted/30 px-4 pt-3 pb-4 dark:bg-background/50">
                    {payBanner}
                    <SeatBar paid={paidSeats} total={usedSeats} />
                  </div>

                  {previewError && (
                    <div className="m-4 rounded-lg border border-error-border bg-error-bg p-3">
                      <p className="text-sm text-error">{previewError}</p>
                    </div>
                  )}

                  <div className="px-3 pt-3 pb-1">
                    <div className="px-1 text-sm font-semibold text-foreground-1">
                      {t('teamMembers:seatOverflow.pickToRemove', { count: overBy })}
                    </div>
                    <div className="mt-0.5 px-1 text-xs text-foreground-3">
                      {t('teamMembers:seatOverflow.selectMembersHint')}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
                    {ownerMember && (
                      <MemberRow
                        member={ownerMember}
                        selected={false}
                        locked
                        isYou={currentUser?.id === ownerMember.id}
                      />
                    )}
                    {candidateMembers.map((m: TeamMember) => (
                      <MemberRow
                        key={m.id}
                        member={m}
                        selected={selectedUserId === m.id}
                        onToggle={() => selectMember(m.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Modes B/C: a thin placeholder while the drawer renders the action surface */
                <div className="flex flex-1 items-center justify-center px-6 text-center text-xs text-foreground-3">
                  {previewLoading
                    ? t('teamMembers:seatOverflow.loadingPreview')
                    : null}
                </div>
              )}

              {showLogout && (
                <div className="flex shrink-0 items-center justify-center border-t border-border bg-surface px-4 py-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    onClick={handleLogout}
                    className="!h-8 !min-h-0 text-foreground-3 hover:text-foreground-1"
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    {t('teamMembers:seatOverflow.logout')}
                  </Button>
                </div>
              )}
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>

        {/* Drawer with appointments + Save & remove */}
        <Drawer
          open={drawerOpen}
          onOpenChange={(o) => {
            if (o || isCommitting || selectedUserId == null) return;
            // Closing the drawer:
            //  - Mode A: deselect (member stays in list, decisions cleared).
            //  - Mode B/C: bail out by closing the entire modal.
            if (isSeatOverflow) {
              selectMember(selectedUserId);
            } else {
              dispatch(closeReconciliationAction());
            }
          }}
          shouldScaleBackground={false}
        >
          <DrawerContent
            overlayClassName="z-[220] bg-black/60"
            className="z-[220] h-[92dvh] !max-h-[92dvh] bg-background"
          >
            <DrawerTitle className="sr-only">
              {t('teamMembers:seatOverflow.apptsTitle')}
            </DrawerTitle>
            <div className="flex min-h-0 flex-1 flex-col">
              <AppointmentsPane
                appointments={preview?.appointments ?? []}
                selectedUserId={selectedUserId}
                eligibleStaffMap={preview?.eligibleStaffMap ?? {}}
                orphanedAppointmentIds={preview?.orphanedAppointmentIds ?? []}
                staffById={staffById}
                decisions={decisions}
                onDecide={decide}
                onDecideMany={(ids, dec) => decideMany(ids, dec)}
                loading={previewLoading}
              />
            </div>
            <div
              className="shrink-0 border-t border-border bg-background px-4 py-3"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <Button
                variant="default"
                rounded="full"
                disabled={primaryDisabled}
                onClick={handleCommit}
                className="w-full"
              >
                {isCommitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmText}
                {!isCommitting && <ArrowRight className="ml-1.5 h-4 w-4" />}
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // ============ DESKTOP ============
  return (
    <Dialog open modal>
      <DialogPortal>
        <div className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          aria-describedby={undefined}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            if (showManualClose) handleCloseManually();
            else e.preventDefault();
          }}
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-[0.97] data-[state=closed]:zoom-out-[0.97]',
            'data-[state=open]:duration-250 data-[state=closed]:duration-150',
            'fixed left-[50%] top-[50%] z-[210]',
            'w-[calc(100%-1.5rem)] max-w-[1180px] h-[min(820px,calc(100%-2rem))]',
            'translate-x-[-50%] translate-y-[-50%]',
            'flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg',
            'focus:outline-none focus-visible:outline-none cursor-default',
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-warning/30 bg-warning-bg text-warning">
              <Users className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base font-semibold text-foreground-1">
                {titleText}
              </DialogTitle>
              <p className="mt-0.5 truncate text-xs text-foreground-3">{subtitleText}</p>
            </div>
            {showManualClose && (
              <Button
                variant="ghost"
                size="sm"
                rounded="full"
                onClick={handleCloseManually}
                className="h-9 w-9 shrink-0 px-0"
                aria-label={t('teamMembers:seatOverflow.close')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Body */}
          <div
            className={cn(
              'grid min-h-0 flex-1 grid-cols-1',
              showAside && 'md:grid-cols-[340px_1fr]',
            )}
          >
            {showAside && (
              <MembersAside
                paid={paidSeats}
                total={usedSeats}
                overBy={overBy}
                selectedUserId={selectedUserId}
                onSelect={selectMember}
                ownerId={currentUser?.id}
                ownerMember={ownerMember}
                candidateMembers={candidateMembers}
              />
            )}

            <div className="flex min-h-0 flex-col">
              {previewError ? (
                <div className="m-5 rounded-lg border border-error-border bg-error-bg p-3">
                  <p className="text-sm text-error">{previewError}</p>
                </div>
              ) : null}

              {hasPendingPayment && subscriptionSummary?.pendingPayment ? (
                <div className="p-5">
                  {isNative ? (
                    pendingNativeNotice
                  ) : (
                    <SeatPayBranch
                      pendingPayment={subscriptionSummary.pendingPayment as any}
                      paymentError={paymentError}
                      isPayingForSeats={isPayingForSeats}
                      onRetry={handleRetryPendingPayment}
                      onAbort={handleAbortPendingPayment}
                    />
                  )}
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  {showPayBanner && <div className="shrink-0 px-5 pt-4">{payBanner}</div>}

                  <AppointmentsPane
                    appointments={preview?.appointments ?? []}
                    selectedUserId={selectedUserId}
                    eligibleStaffMap={preview?.eligibleStaffMap ?? {}}
                    orphanedAppointmentIds={preview?.orphanedAppointmentIds ?? []}
                    staffById={staffById}
                    decisions={decisions}
                    onDecide={decide}
                    onDecideMany={(ids, dec) => decideMany(ids, dec)}
                    loading={previewLoading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface px-5 py-3">
            {showLogout ? (
              <Button
                variant="ghost"
                size="sm"
                rounded="full"
                onClick={handleLogout}
                className="text-foreground-3 hover:text-foreground-1"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                {t('teamMembers:seatOverflow.logout')}
              </Button>
            ) : (
              <span />
            )}

            <Button
              variant="default"
              rounded="full"
              disabled={primaryDisabled}
              onClick={handleCommit}
              title={primaryDisabled ? t('teamMembers:seatOverflow.mustComplete') : undefined}
            >
              {isCommitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmText}
              {!isCommitting && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SeatOverflowGate;
