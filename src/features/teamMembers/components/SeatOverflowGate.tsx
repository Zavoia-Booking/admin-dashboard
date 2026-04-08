import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  AlertTriangle,
  Loader2,
  UserMinus,
  CreditCard,
  Calendar,
  MapPin,
  User,
  XCircle,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '../../../shared/components/ui/button';
import {
  Dialog,
  DialogPortal,
  DialogTitle,
  DialogDescription,
} from '../../../shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import { Badge } from '../../../shared/components/ui/badge';
import { DashedDivider } from '../../../shared/components/common/DashedDivider';
import { cn } from '../../../shared/lib/utils';
import { selectCurrentUser } from '../../auth/selectors';
import { UserRole } from '../../../shared/types/auth';
import { selectSubscriptionSummary } from '../../settings/selectors';
import { getSubscriptionSummaryAction } from '../../settings/actions';
import { selectTeamMembers, selectIsOffboarding } from '../selectors';
import { listTeamMembersAction, offboardTeamMemberAction } from '../actions';
import { fetchCurrentUserAction } from '../../auth/actions';
import { updateSeats, abortPendingPayment } from '../../settings/api';
import { getOffboardPreviewApi } from '../api';
import type { OffboardPreviewResponse } from '../api';
import type { TeamMember } from '../../../shared/types/team-member';

export const SeatOverflowGate: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const currentUser = useSelector(selectCurrentUser);
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const teamMembers = useSelector(selectTeamMembers);
  const isOffboarding = useSelector(selectIsOffboarding);

  // Option selection
  const [selectedOption, setSelectedOption] = useState<'remove' | 'pay' | null>('pay');

  // Remove flow
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [preview, setPreview] = useState<OffboardPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [appointmentActions, setAppointmentActions] = useState<
    Map<number, { reassignTo?: number; cancel?: boolean }>
  >(new Map());

  // Pay flow
  const [isPayingForSeats, setIsPayingForSeats] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Abort controller ref for preview fetch race conditions
  const abortRef = useRef<AbortController | null>(null);

  // Determine if gate should be shown (from /me entitlements — available immediately)
  const isEntitled = currentUser?.entitlements?.entitled ?? false;
  const paidSeats = currentUser?.entitlements?.paidTeamSeats ?? 0;
  const usedSeats = currentUser?.entitlements?.usedSeats ?? 0;
  const shouldShow =
    currentUser?.role === UserRole.OWNER &&
    isEntitled === true &&
    paidSeats > 0 &&
    usedSeats > paidSeats;

  const extraSeats = usedSeats - paidSeats;
  const pricePerSeat = subscriptionSummary?.pricePerTeamMember ?? 0;

  // Fetch subscription summary and team members when overflow is detected
  useEffect(() => {
    if (shouldShow) {
      if (!subscriptionSummary) {
        dispatch(getSubscriptionSummaryAction.request());
      }
      if (teamMembers.length === 0) {
        dispatch(listTeamMembersAction.request());
      }
    }
  }, [shouldShow]);

  // Filter: only team members (not owner), exclude current user
  const selectableMembersForRemoval = useMemo(
    () =>
      teamMembers.filter(
        (m) => m.role === UserRole.TEAM_MEMBER && m.id !== currentUser?.id,
      ),
    [teamMembers, currentUser?.id],
  );

  // Fetch offboard preview when member is selected
  useEffect(() => {
    if (!selectedMember) {
      setPreview(null);
      setPreviewError(null);
      setAppointmentActions(new Map());
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    setAppointmentActions(new Map());

    getOffboardPreviewApi(selectedMember.id)
      .then((data) => {
        if (!controller.signal.aborted) {
          setPreview(data);

          // Auto-set cancel for appointments with no eligible staff
          const autoActions = new Map<number, { reassignTo?: number; cancel?: boolean }>();
          for (const apt of data.appointments) {
            const key = apt.service && apt.location ? `${apt.service.id}-${apt.location.id}` : null;
            const eligible = key ? data.eligibleStaffMap[key] ?? [] : [];
            if (eligible.length === 0) {
              autoActions.set(apt.id, { cancel: true });
            }
          }
          if (autoActions.size > 0) {
            setAppointmentActions(autoActions);
          }
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setPreviewError(err?.response?.data?.message || err?.message || 'Failed to load preview');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPreviewLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedMember?.id]);

  // Derived: are all appointments handled?
  const allAppointmentsHandled = useMemo(() => {
    if (!preview) return false;
    if (preview.appointments.length === 0) return true;
    return preview.appointments.every((apt) => appointmentActions.has(apt.id));
  }, [preview, appointmentActions]);

  const handleAppointmentAction = useCallback(
    (appointmentId: number, value: string) => {
      setAppointmentActions((prev) => {
        const next = new Map(prev);
        if (value === 'cancel') {
          next.set(appointmentId, { cancel: true });
        } else {
          next.set(appointmentId, { reassignTo: Number(value) });
        }
        return next;
      });
    },
    [],
  );

  const handleConfirmOffboard = useCallback(() => {
    if (!selectedMember) return;
    const actions = Array.from(appointmentActions.entries()).map(([appointmentId, action]) => ({
      appointmentId,
      newStaffUserId: action.reassignTo ?? null,
      cancel: action.cancel ?? false,
    }));
    dispatch(
      offboardTeamMemberAction.request({
        id: selectedMember.id,
        appointmentActions: actions,
      }),
    );
  }, [selectedMember, appointmentActions, dispatch]);

  const handlePayForExtraSeats = async () => {
    try {
      setIsPayingForSeats(true);
      setPaymentError(null);

      const response = await updateSeats({ seats: usedSeats });

      if (response.requiresAction && response.clientSecret) {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) throw new Error('Stripe publishable key not configured');

        const stripe = await loadStripe(publishableKey);
        if (!stripe) throw new Error('Failed to load Stripe');

        const { error } = await stripe.confirmCardPayment(response.clientSecret);
        if (error) {
          setPaymentError(error.message || t('teamMembers:seatOverflow.paymentFailed'));
          // Refresh subscription summary to pick up pendingPayment state
          dispatch(getSubscriptionSummaryAction.request());
        } else {
          setPaymentSuccess(true);
        }
      } else if (response.success) {
        setPaymentSuccess(true);
      } else {
        throw new Error(t('teamMembers:seatOverflow.paymentFailed'));
      }
    } catch (err: any) {
      setPaymentError(
        err?.response?.data?.message || err?.message || t('teamMembers:seatOverflow.paymentFailed'),
      );
    } finally {
      setIsPayingForSeats(false);
    }
  };

  const handleRetryPendingPayment = async () => {
    const pending = subscriptionSummary?.pendingPayment;
    if (!pending?.clientSecret) return;

    try {
      setIsPayingForSeats(true);
      setPaymentError(null);

      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
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
  };

  const handleAbortPendingPayment = async () => {
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
  };

  const formatDateTime = (scheduledAt: string) => {
    const d = new Date(scheduledAt);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <Dialog open modal>
      <DialogPortal>
        {/* Overlay */}
        <div className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Dialog content */}
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-[0.97] data-[state=closed]:zoom-out-[0.97]',
            'data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-2',
            'data-[state=open]:duration-250 data-[state=closed]:duration-150',
            'fixed left-[50%] top-[50%] z-[210] flex w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%]',
            'flex-col overflow-hidden rounded-2xl border border-border bg-white p-0 shadow-lg dark:bg-surface',
            'focus:outline-none focus-visible:outline-none',
          )}
        >
          {/* ── Header ── */}
          <div className="relative shrink-0 px-5 pt-5 pb-0 md:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                <AlertTriangle className="h-6 w-6 text-primary" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <DialogTitle className="text-lg font-semibold leading-snug text-foreground-1">
                  {t('teamMembers:seatOverflow.title')}
                </DialogTitle>
                <DialogDescription asChild>
                  <p className="text-xs leading-relaxed text-foreground-3 dark:text-foreground-2">
                    {t('teamMembers:seatOverflow.subtitle', { paidSeats, usedSeats })}
                  </p>
                </DialogDescription>
              </div>
            </div>
            <DashedDivider marginTop="mt-0" paddingTop="pt-3" className="mb-0" dashPattern="1 1" />
          </div>

          {/* ── Scrollable Body ── */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 scrollbar-hide px-4 py-4 dark:bg-background/50 md:px-6 md:py-5">
            <div className="space-y-5">
              {/* ── Option Cards ── */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => {
                    setSelectedOption('pay');
                    setSelectedMember(null);
                    setPreview(null);
                    setPaymentError(null);
                  }}
                  className={cn(
                    'cursor-pointer rounded-md border-2 p-4 text-left transition-all',
                    selectedOption === 'pay'
                      ? 'border-info bg-info-bg dark:bg-info/10'
                      : 'border-border hover:border-info/50 hover:bg-info-bg/50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-bg">
                      <CreditCard className="h-5 w-5 text-info" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground-1">
                        {t('teamMembers:seatOverflow.optionPay')}
                      </p>
                      <p className="text-sm text-foreground-3">
                        {t('teamMembers:seatOverflow.optionPayDesc', {
                          extraSeats,
                          pricePerSeat: pricePerSeat.toFixed(2),
                        })}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedOption('remove');
                    setSelectedMember(null);
                    setPaymentError(null);
                  }}
                  className={cn(
                    'cursor-pointer rounded-md border-2 p-4 text-left transition-all',
                    selectedOption === 'remove'
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <UserMinus className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground-1">
                        {t('teamMembers:seatOverflow.optionRemove')}
                      </p>
                      <p className="text-sm text-foreground-3">
                        {t('teamMembers:seatOverflow.optionRemoveDesc')}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* ── Pay Flow ── */}
              {selectedOption === 'pay' && (
                <div className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-card">
                  {/* Payment success screen */}
                  {paymentSuccess ? (
                    <div className="flex flex-col items-center text-center py-4 space-y-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
                        <CheckCircle2 className="h-7 w-7 text-success" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-foreground-1">
                          {t('teamMembers:seatOverflow.paymentSuccess')}
                        </h3>
                        <p className="text-sm text-foreground-3">
                          {t('teamMembers:seatOverflow.paymentSuccessDesc')}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          dispatch(fetchCurrentUserAction.request());
                          dispatch(getSubscriptionSummaryAction.request());
                        }}
                        rounded="full"
                        className="w-full"
                      >
                        {t('teamMembers:seatOverflow.paymentContinue')}
                      </Button>
                    </div>
                  ) : subscriptionSummary?.pendingPayment ? (
                    <>
                      <div className="rounded-lg border border-warning-border bg-warning-bg p-4">
                        <h3 className="font-medium text-foreground-1 mb-1">
                          {t('settings:billing.pendingPayment.title')}
                        </h3>
                        <p className="text-sm text-foreground-3">
                          {subscriptionSummary.pendingPayment.status === 'requires_action'
                            ? t('settings:billing.pendingPayment.requiresAction')
                            : t('settings:billing.pendingPayment.requiresPaymentMethod')}
                        </p>
                        <p className="text-sm font-medium text-foreground-1 mt-1">
                          {t('settings:billing.pendingPayment.amount', {
                            amount: subscriptionSummary.pendingPayment.amount.toFixed(2),
                            currency: subscriptionSummary.pendingPayment.currency,
                          })}
                        </p>
                      </div>

                      {paymentError && (
                        <div className="rounded-lg border border-error-border bg-error-bg p-3">
                          <p className="text-sm text-error">{paymentError}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {subscriptionSummary.pendingPayment.status === 'requires_action' && (
                          <Button
                            onClick={handleRetryPendingPayment}
                            disabled={isPayingForSeats}
                            rounded="full"
                            className="flex-1"
                          >
                            {isPayingForSeats ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t('settings:billing.pendingPayment.retrying')}
                              </>
                            ) : (
                              t('settings:billing.pendingPayment.completePayment')
                            )}
                          </Button>
                        )}
                        {subscriptionSummary.pendingPayment.status === 'requires_payment_method' &&
                          subscriptionSummary.pendingPayment.invoiceUrl && (
                          <Button
                            onClick={() => window.open(subscriptionSummary.pendingPayment!.invoiceUrl!, '_blank')}
                            disabled={isPayingForSeats}
                            rounded="full"
                            className="flex-1"
                          >
                            {t('settings:billing.pendingPayment.updatePaymentMethod')}
                          </Button>
                        )}
                        <Button
                          onClick={handleAbortPendingPayment}
                          disabled={isPayingForSeats}
                          variant="outline"
                          rounded="full"
                        >
                          {t('settings:billing.pendingPayment.abortPayment')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border border-info-border bg-info-bg p-4">
                        <h3 className="font-medium text-foreground-1 mb-1">
                          {t('teamMembers:seatOverflow.payConfirmTitle')}
                        </h3>
                        <p className="text-sm text-foreground-3">
                          {t('teamMembers:seatOverflow.payConfirmDesc', {
                            extraSeats,
                            totalSeats: usedSeats,
                          })}
                        </p>
                      </div>

                      {paymentError && (
                        <div className="rounded-lg border border-error-border bg-error-bg p-3">
                          <p className="text-sm text-error">{paymentError}</p>
                        </div>
                      )}

                      <Button
                        onClick={handlePayForExtraSeats}
                        disabled={isPayingForSeats}
                        rounded="full"
                        className="w-full"
                      >
                        {isPayingForSeats ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('teamMembers:seatOverflow.paying')}
                          </>
                        ) : (
                          t('teamMembers:seatOverflow.confirmPay')
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* ── Remove Flow ── */}
              {selectedOption === 'remove' && (
                <div className="space-y-4">
                  {/* Team member selection */}
                  <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-card">
                    <h3 className="text-sm font-medium text-foreground-2 mb-3">
                      {t('teamMembers:seatOverflow.step1Title')}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {selectableMembersForRemoval.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setSelectedMember(member)}
                          className={cn(
                            'cursor-pointer flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                            selectedMember?.id === member.id
                              ? 'border-primary bg-primary/5 dark:bg-primary/10'
                              : 'border-transparent bg-surface-hover hover:bg-surface-active hover:border-border-strong dark:bg-muted/20 dark:hover:bg-muted/40',
                          )}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-sm font-medium text-white">
                            {member.firstName?.[0]}
                            {member.lastName?.[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground-1">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-foreground-3 truncate">{member.email}</p>
                          </div>
                          {selectedMember?.id === member.id && (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Appointments section */}
                  {selectedMember && (
                    <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-foreground-2">
                          {t('teamMembers:seatOverflow.appointmentsSection')}
                        </h3>
                        {preview && preview.appointments.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {t('teamMembers:seatOverflow.appointmentsCount', {
                              count: preview.appointments.length,
                            })}
                          </Badge>
                        )}
                      </div>

                      {/* Loading state */}
                      {previewLoading && (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-lg border border-border p-3">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <Skeleton className="h-8 w-full mt-2" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Error state */}
                      {previewError && (
                        <div className="rounded-lg border border-error-border bg-error-bg p-3">
                          <p className="text-sm text-error">{previewError}</p>
                        </div>
                      )}

                      {/* No appointments */}
                      {preview && preview.appointments.length === 0 && (
                        <div className="flex items-center gap-3 rounded-lg bg-success-bg p-4">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                          <p className="text-sm text-foreground-1">
                            {t('teamMembers:seatOverflow.noAppointments')}
                          </p>
                        </div>
                      )}

                      {/* Appointment list */}
                      {preview && preview.appointments.length > 0 && (
                        <div className="space-y-1.5">
                          {preview.appointments.map((apt) => {
                            const staffKey =
                              apt.service && apt.location
                                ? `${apt.service.id}-${apt.location.id}`
                                : null;
                            const eligibleStaff = staffKey
                              ? preview.eligibleStaffMap[staffKey] ?? []
                              : [];
                            const currentAction = appointmentActions.get(apt.id);
                            const hasNoEligibleStaff = eligibleStaff.length === 0;

                            return (
                              <div
                                key={apt.id}
                                className={cn(
                                  'relative rounded-lg border pl-3 pr-3 py-2.5 transition-all overflow-hidden',
                                  currentAction
                                    ? 'border-border bg-white dark:bg-card'
                                    : 'border-warning-border bg-warning-bg/30',
                                )}
                              >
                                {/* Left accent bar */}
                                <div
                                  className={cn(
                                    'absolute left-0 top-0 bottom-0 w-[3px]',
                                    currentAction ? 'bg-success' : 'bg-warning',
                                  )}
                                />

                                {/* Top row: service name + select */}
                                <div className="flex items-center gap-3 ml-1.5">
                                  <span className="flex-1 min-w-0 text-sm font-medium text-foreground-1 truncate">
                                    {apt.service?.name ?? 'Unknown service'}
                                  </span>
                                  <Select
                                    value={
                                      currentAction?.cancel
                                        ? 'cancel'
                                        : currentAction?.reassignTo
                                          ? String(currentAction.reassignTo)
                                          : undefined
                                    }
                                    onValueChange={(val) => handleAppointmentAction(apt.id, val)}
                                  >
                                    <SelectTrigger
                                      className={cn(
                                        'w-44 h-7 text-xs cursor-pointer bg-white dark:bg-surface border-border shadow-sm shrink-0',
                                        hasNoEligibleStaff && 'opacity-60',
                                        !currentAction && 'border-primary/40 ring-1 ring-primary/20',
                                      )}
                                      size="sm"
                                    >
                                      <SelectValue
                                        placeholder={
                                          hasNoEligibleStaff
                                            ? t('teamMembers:seatOverflow.noEligibleStaff')
                                            : t('teamMembers:seatOverflow.assignStaff')
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent className="z-[220]">
                                      {eligibleStaff.map((staff) => (
                                        <SelectItem
                                          key={staff.userId}
                                          value={String(staff.userId)}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2">
                                            <ArrowRightLeft className="h-3 w-3 text-foreground-3" />
                                            <span>
                                              {staff.firstName} {staff.lastName}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="cancel" className="cursor-pointer">
                                        <div className="flex items-center gap-2 text-destructive">
                                          <XCircle className="h-3 w-3" />
                                          <span>{t('teamMembers:seatOverflow.cancelAppointment')}</span>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Bottom row: metadata */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 ml-1.5 text-xs text-foreground-3">
                                  {apt.customer && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3 opacity-60" />
                                      {apt.customer.firstName} {apt.customer.lastName}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 opacity-60" />
                                    {formatDateTime(apt.scheduledAt)}
                                  </span>
                                  {apt.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 opacity-60" />
                                      {apt.location.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Status indicator */}
                          <div
                            className={cn(
                              'mt-2 flex items-center gap-2 rounded-lg p-2.5 text-xs font-medium',
                              allAppointmentsHandled
                                ? 'bg-success-bg text-success'
                                : 'bg-warning-bg text-warning',
                            )}
                          >
                            {allAppointmentsHandled ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t('teamMembers:seatOverflow.allHandled')}
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {t('teamMembers:seatOverflow.mustHandleAll')}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirm remove button */}
                  {selectedMember && preview && (
                    <Button
                      onClick={handleConfirmOffboard}
                      disabled={
                        isOffboarding ||
                        (!allAppointmentsHandled && preview.appointments.length > 0)
                      }
                      variant="destructive"
                      rounded="full"
                      className="w-full"
                    >
                      {isOffboarding ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('teamMembers:seatOverflow.removing')}
                        </>
                      ) : (
                        t('teamMembers:seatOverflow.confirmRemove')
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SeatOverflowGate;
