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
  CheckCircle2,
  Check,
  ChevronsUpDown,
  ArrowRight,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '../../../shared/components/ui/button';
import {
  Dialog,
  DialogPortal,
  DialogTitle,
} from '../../../shared/components/ui/dialog';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '../../../shared/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { Command, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { getAvatarBgColor } from '../../setupWizard/components/StepTeam';
import { CalendarFilterPillCheckmark } from '../../calendar/components/CalendarFilterPillCheckmark';
import '../../calendar/components/addAppointmentSliderPopover.css';
import { Badge } from '../../../shared/components/ui/badge';
import { DashedDivider } from '../../../shared/components/common/DashedDivider';
import { cn } from '../../../shared/lib/utils';
import { getCurrencySymbol } from '../../../shared/utils/currency';
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
import { usePlatform } from '../../../shared/hooks/usePlatform';
import { WebOnly } from '../../../shared/components/common/platform/PlatformGate';

export const SeatOverflowGate: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const currentUser = useSelector(selectCurrentUser);
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const teamMembers = useSelector(selectTeamMembers);
  const isOffboarding = useSelector(selectIsOffboarding);
  const { isNative } = usePlatform();

  // Option selection — on native, only the 'remove' path is available
  // (paid seat upgrade hidden for Apple/Google store compliance).
  const [selectedOption, setSelectedOption] = useState<'remove' | 'pay' | null>(
    isNative ? 'remove' : 'pay',
  );

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

  // Staff popover state per appointment
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const [closingPopoverId, setClosingPopoverId] = useState<number | null>(null);
  const popoverCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePopoverOpenChange = useCallback((aptId: number, open: boolean) => {
    if (open) {
      if (popoverCloseRef.current) {
        clearTimeout(popoverCloseRef.current);
        popoverCloseRef.current = null;
      }
      setOpenPopoverId(aptId);
      setClosingPopoverId(null);
    } else {
      setOpenPopoverId(null);
      setClosingPopoverId(aptId);
      popoverCloseRef.current = setTimeout(() => {
        setClosingPopoverId(null);
        popoverCloseRef.current = null;
      }, 250);
    }
  }, []);

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
  const currency = subscriptionSummary?.currency ?? 'EUR';
  const formattedPrice = `${pricePerSeat.toFixed(2)}${getCurrencySymbol(currency)}`;
  const dataReady = !!subscriptionSummary && teamMembers.length > 0;

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
  }, [shouldShow, dispatch, subscriptionSummary, teamMembers.length]);

  // Filter: only team members (not owner), exclude current user
  const selectableMembersForRemoval = useMemo(
    () =>
      teamMembers.filter(
        (m: TeamMember) => m.role === UserRole.TEAM_MEMBER && m.roleStatus === 'active' && m.id !== currentUser?.id,
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
  }, [selectedMember]);

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
          aria-describedby={undefined}
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
            'focus:outline-none focus-visible:outline-none cursor-default',
          )}
        >
          {/* ── Header ── */}
          <div className="relative shrink-0 px-5 pt-5 pb-0 md:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-warning/20 bg-transparent">
                <AlertTriangle className="h-6 w-6 text-warning" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold leading-snug text-foreground-1">
                  {t('teamMembers:seatOverflow.title')}
                </DialogTitle>
              </div>
            </div>
            <DashedDivider marginTop="mt-0" paddingTop="pt-3" className="mb-0" dashPattern="1 1" />
          </div>

          {/* ── Scrollable Body ── */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 scrollbar-hide px-4 py-4 dark:bg-background/50 md:px-6 md:py-5">
            {!dataReady ? (
              <div className="space-y-4">
                {/* Skeleton option cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-border bg-white p-4 dark:bg-card">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Skeleton content card */}
                <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-card">
                  <Skeleton className="h-4 w-40 mb-3" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-10 w-full rounded-full" />
                </div>
              </div>
            ) : (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-foreground-3 dark:text-foreground-2">
                {[
                  t('teamMembers:seatOverflow.subtitlePlan', { count: paidSeats, paidSeats }),
                  t('teamMembers:seatOverflow.subtitleUsage', { count: usedSeats, usedSeats }),
                  t('teamMembers:seatOverflow.subtitleAction'),
                ].join(' ')}
              </p>
              {/* ── Option Cards ── */}
              <div className={cn('grid grid-cols-1 gap-3', !isNative && 'sm:grid-cols-2')} role="radiogroup" aria-label={t('teamMembers:seatOverflow.title')}>
                <WebOnly>
                <button
                  role="radio"
                  aria-checked={selectedOption === 'pay'}
                  aria-label={t('teamMembers:seatOverflow.optionPay')}
                  onClick={() => {
                    setSelectedOption('pay');
                    setSelectedMember(null);
                    setPreview(null);
                    setPaymentError(null);
                  }}
                  className={cn(
                    'group relative cursor-pointer rounded-lg border p-4 text-left transition-none focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/50 focus-visible:ring-offset-0',
                    selectedOption === 'pay'
                      ? 'border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900'
                      : 'border-border bg-surface hover:border-border-strong hover:bg-surface-hover',
                  )}
                >
                  {selectedOption === 'pay' && (
                    <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-400 shadow-sm dark:bg-success" aria-hidden>
                      <svg className="h-3 w-3 text-foreground-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
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
                          pricePerSeat: formattedPrice,
                          count: extraSeats,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
                </WebOnly>

                <button
                  role="radio"
                  aria-checked={selectedOption === 'remove'}
                  aria-label={t('teamMembers:seatOverflow.optionRemove')}
                  onClick={() => {
                    setSelectedOption('remove');
                    setSelectedMember(null);
                    setPaymentError(null);
                  }}
                  className={cn(
                    'group relative cursor-pointer rounded-lg border p-4 text-left transition-none focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/50 focus-visible:ring-offset-0',
                    selectedOption === 'remove'
                      ? 'border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900'
                      : 'border-border bg-surface hover:border-border-strong hover:bg-surface-hover',
                  )}
                >
                  {selectedOption === 'remove' && (
                    <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-400 shadow-sm dark:bg-success" aria-hidden>
                      <svg className="h-3 w-3 text-foreground-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
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
                            count: extraSeats,
                            extraSeats,
                            pricePerSeat: formattedPrice,
                            totalSeats: usedSeats,
                          })}
                        </p>
                      </div>

                      {paymentError && (
                        <div className="rounded-lg border border-error-border bg-error-bg p-3">
                          <p className="text-sm text-error">{paymentError}</p>
                        </div>
                      )}

                    </>
                  )}
                </div>
              )}

              {/* ── Remove Flow ── */}
              {selectedOption === 'remove' && (
                <div className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-card">
                  {/* Team member selection */}
                  <h3 className="text-sm font-medium text-foreground-2">
                    {t('teamMembers:seatOverflow.step1Title')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectableMembersForRemoval.map((member: TeamMember) => {
                      const selected = selectedMember?.id === member.id;
                      const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
                      const name = fullName || member.email;
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setSelectedMember(member)}
                          title={name}
                          aria-label={name}
                          aria-pressed={selected}
                          className={cn(
                            '!min-h-0 !h-10 relative inline-flex max-w-[200px] shrink-0 cursor-pointer items-center gap-2 overflow-visible rounded-full border px-2 pr-3 text-left text-xs font-medium transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:transition-none',
                            'border-border bg-surface text-foreground hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900 dark:hover:text-neutral-900',
                            selected && 'border-neutral-500 bg-info-100 text-neutral-900 shadow-xs dark:text-neutral-900',
                          )}
                        >
                          <Avatar className="size-6 shrink-0 border border-border transition-none">
                            {member.profileImage ? (
                              <AvatarImage src={member.profileImage} alt="" />
                            ) : null}
                            <AvatarFallback
                              className="text-[10px] font-semibold leading-none text-foreground-1"
                              style={{ backgroundColor: getAvatarBgColor(`${member.id}-${member.firstName ?? ''}-${member.lastName ?? ''}`) }}
                            >
                              {fullName
                                ? `${(member.firstName?.[0] ?? '').toUpperCase()}${(member.lastName?.[0] ?? '').toUpperCase()}`
                                : (member.email?.[0] ?? '?').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate">{name}</span>
                          {selected ? <CalendarFilterPillCheckmark /> : null}
                        </button>
                      );
                    })}
                  </div>

                  {/* Appointments section */}
                  {selectedMember && (
                    <div>
                      <DashedDivider marginTop="mt-0" paddingTop="pt-0" className="mb-3" dashPattern="1 1" />
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <h3 className="text-sm font-medium text-foreground-2">
                          {t('teamMembers:seatOverflow.appointmentsSection')}
                        </h3>
                        {preview && preview.appointments.length > 0 && (
                          <Badge variant="secondary" className="text-xs self-start">
                            {t('teamMembers:seatOverflow.appointmentsCount', {
                              count: preview.appointments.length,
                            })}
                          </Badge>
                        )}
                      </div>

                      {/* Loading state */}
                      {previewLoading && (
                        <div className="space-y-1.5">
                          {[1].map((i) => (
                            <div key={i} className="relative rounded-lg border border-border pl-3 pr-3 py-2.5 overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-border" />
                              <div className="flex items-center gap-3 ml-1.5">
                                <Skeleton className="h-4 w-28 flex-1" />
                                <Skeleton className="h-9 w-44 rounded-md shrink-0" />
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 ml-1.5">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-3 w-24" />
                              </div>
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
                        <div className="space-y-2">
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
                                  'rounded-xl p-3 transition-all',
                                  currentAction
                                    ? 'border border-border bg-white dark:bg-card'
                                    : 'border border-warning-border bg-warning-bg/30',
                                )}
                              >
                                {/* Service name + staff dropdown */}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <span className="text-sm font-bold truncate min-w-0 sm:flex-1 text-foreground-1">
                                    {apt.service?.name ?? 'Unknown service'}
                                  </span>
                                  <div className="shrink-0">
                                    {(() => {
                                      const isOpen = openPopoverId === apt.id;
                                      const showBorder = isOpen || closingPopoverId === apt.id;
                                      return (
                                        <Popover open={isOpen} onOpenChange={(open) => handlePopoverOpenChange(apt.id, open)}>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              rounded="full"
                                              size="sm"
                                              className={cn(
                                                'h-8 w-full sm:w-[280px] justify-between !px-3 border border-border-strong hover:border-border-strong text-foreground-3 dark:text-foreground-2 hover:text-primary dark:hover:text-primary text-xs cursor-pointer',
                                                hasNoEligibleStaff && 'opacity-60',
                                                showBorder && '!rounded-b-none !rounded-t-[16px] border-x border-t border-b-0 border-border-strong dark:border-border-strong shadow-none',
                                              )}
                                            >
                                              <span className="truncate">
                                                {currentAction?.cancel
                                                  ? t('teamMembers:seatOverflow.cancelAppointment')
                                                  : currentAction?.reassignTo
                                                    ? (() => {
                                                        const s = eligibleStaff.find((st) => st.userId === currentAction.reassignTo);
                                                        return s ? `${s.firstName} ${s.lastName}` : t('teamMembers:seatOverflow.assignStaff');
                                                      })()
                                                    : hasNoEligibleStaff
                                                      ? t('teamMembers:seatOverflow.noEligibleStaff')
                                                      : t('teamMembers:seatOverflow.assignStaff')}
                                              </span>
                                              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent
                                            className={cn(
                                              'w-[var(--radix-popover-trigger-width)] md:w-[var(--radix-popover-trigger-width)] box-border -mt-px border border-t-0 bg-surface dark:bg-neutral-900 shadow-none p-0 z-[220] rounded-t-none rounded-b-[16px]',
                                              'add-appointment-popover-expand',
                                              showBorder ? 'border-border-strong dark:border-border-strong' : 'border-input dark:border-border',
                                            )}
                                            side="bottom"
                                            align="end"
                                            sideOffset={0}
                                            avoidCollisions={false}
                                          >
                                            <Command shouldFilter={false}>
                                              <CommandList>
                                                {eligibleStaff.map((staff, staffIndex) => (
                                                  <CommandItem
                                                    key={staff.userId}
                                                    value={`${staff.firstName} ${staff.lastName}`}
                                                    onSelect={() => { handleAppointmentAction(apt.id, String(staff.userId)); setOpenPopoverId(null); }}
                                                    className={cn(
                                                      'h-8 cursor-pointer transition-colors duration-200',
                                                      staffIndex === eligibleStaff.length - 1 && eligibleStaff.length > 0 && 'rounded-b-[12px]',
                                                    )}
                                                  >
                                                    <Check className={cn('mr-2 h-4 w-4', currentAction?.reassignTo === staff.userId ? 'opacity-100' : 'opacity-0')} />
                                                    <Avatar className="size-5 shrink-0 border border-border transition-none mr-1.5">
                                                      {staff.profileImage ? (
                                                        <AvatarImage src={staff.profileImage} alt="" />
                                                      ) : null}
                                                      <AvatarFallback
                                                        className="text-[8px] font-semibold leading-none text-foreground-1"
                                                        style={{ backgroundColor: getAvatarBgColor(`${staff.userId}-${staff.firstName ?? ''}-${staff.lastName ?? ''}`) }}
                                                      >
                                                        {(staff.firstName?.[0] ?? '').toUpperCase()}{(staff.lastName?.[0] ?? '').toUpperCase()}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                    {staff.firstName} {staff.lastName}
                                                  </CommandItem>
                                                ))}
                                                <CommandItem
                                                  value="cancel"
                                                  onSelect={() => { handleAppointmentAction(apt.id, 'cancel'); setOpenPopoverId(null); }}
                                                  className="h-8 cursor-pointer transition-colors duration-200 rounded-b-[12px] text-destructive"
                                                >
                                                  <Check className={cn('mr-2 h-4 w-4', currentAction?.cancel ? 'opacity-100' : 'opacity-0')} />
                                                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                                  {t('teamMembers:seatOverflow.cancelAppointment')}
                                                </CommandItem>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Metadata row */}
                                <div className="flex flex-wrap items-center mt-1 gap-x-3 gap-y-0.5 text-xs text-foreground-3">
                                  <span className="flex items-center gap-1 tabular-nums">
                                    <Calendar className="h-3 w-3 opacity-60" />
                                    {formatDateTime(apt.scheduledAt)}
                                  </span>
                                  {apt.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 opacity-60" />
                                      {apt.location.name}
                                    </span>
                                  )}
                                  {apt.customer && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3 opacity-60" />
                                      {apt.customer.firstName} {apt.customer.lastName}
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

                </div>
              )}
            </div>
            )}
          </div>

          {/* ── Sticky Footer ── */}
          {dataReady && (
            <div className="shrink-0 border-t border-border bg-white px-4 py-3 dark:bg-surface md:px-6">
              {selectedOption === 'pay' && !paymentSuccess && !subscriptionSummary?.pendingPayment && (
                <Button
                  onClick={handlePayForExtraSeats}
                  disabled={isPayingForSeats}
                  rounded="full"
                  className="group w-full gap-2 cursor-pointer"
                >
                  {isPayingForSeats ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('teamMembers:seatOverflow.paying')}
                    </>
                  ) : (
                    <>
                      {t('teamMembers:seatOverflow.confirmPay')}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                    </>
                  )}
                </Button>
              )}

              {selectedOption === 'remove' && (
                <Button
                  onClick={handleConfirmOffboard}
                  disabled={
                    !selectedMember ||
                    !preview ||
                    isOffboarding ||
                    (!allAppointmentsHandled && preview.appointments.length > 0)
                  }
                  variant="destructive"
                  rounded="full"
                  className={cn(
                    'w-full',
                    (!selectedMember || !preview || isOffboarding ||
                      (!allAppointmentsHandled && preview?.appointments?.length > 0)) &&
                      'opacity-40 cursor-not-allowed',
                  )}
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SeatOverflowGate;
