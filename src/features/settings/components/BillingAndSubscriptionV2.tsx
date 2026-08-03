import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import {
  Crown,
  ExternalLink,
  Loader2,
  ArrowRight,
  AlertTriangle,
  CalendarClock,
  RefreshCcw,
  Sparkles,
  XCircle,
  Receipt,
  MessageSquare,
  Download,
  Info,
  Lock,
  ChevronLeft,
  ChevronRight,
  Check as CheckIcon,
  CheckCircle2,
  Ban,
  Zap,
} from 'lucide-react';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import { ErrorState } from '../../../shared/components/common/ErrorState';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../shared/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../../../shared/components/ui/drawer';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import { cn } from '../../../shared/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { selectCurrentUser } from '../../auth/selectors';
import { fetchCurrentUserAction } from '../../auth/actions';
import {
  getSubscriptionSummaryAction,
  getPlansAction,
  getCustomerPortalUrlAction,
  createCheckoutSessionAction,
  modifySubscriptionAction,
  cancelRemovalAction,
  getSmsBalanceAction,
  getSmsPackagesAction,
  getBusinessInvoicesAction,
  createSmsCheckoutAction,
} from '../actions';
import {
  updateSeats,
  createLtdSeatsCheckoutSession,
  abortPendingPayment,
  changePlan as changePlanApi,
  cancelPlanChange as cancelPlanChangeApi,
  getSeatChangePreview,
  getPlanChangePreview,
} from '../api';
import type { PlanChangePreviewResponse } from '../types';
import { useConfirmRadix } from '../../../shared/hooks/useConfirm';
import {
  selectSubscriptionSummary,
  selectAvailablePlans,
  selectIsLoadingSubscriptionSummary,
  selectSubscriptionSummaryError,
  selectIsLoadingPlans,
  selectIsLoadingCustomerPortal,
  selectIsLoadingCheckoutSession,
  selectIsLoadingModifySubscription,
  selectIsLoadingCancelRemoval,
  selectSmsBalance,
  selectSmsPackages,
  selectIsSmsBalanceLoading,
  selectIsSmsPackagesLoading,
  selectIsSmsCheckoutLoading,
  selectBusinessInvoices,
  selectIsLoadingBusinessInvoices,
} from '../selectors';
import { BillingDetailsProvider } from '../context/BillingDetailsProvider';
import {
  INVOICE_BILLING_DETAILS_SECTION_ID,
  useBillingDetailsContext,
} from '../context/BillingDetailsContext';
import type { AvailablePlan, BusinessInvoice, SmsPackage, SubscriptionSummary } from '../types';
import { getErrorMessage } from '../../../shared/utils/error';
import type { AuthUser } from '../../auth/types';
import { updateBillingDetailsApi } from '../../business/api';
import type {
  BillingDetails,
  BillingDetailsSuggestions,
  BillingEntityType,
  UpdateBillingDetailsDTO,
} from '../../business/types';
import { getCurrencySymbol } from '../../../shared/utils/currency';
import { useFormatPrice } from '../../../shared/hooks/useFormatPrice';
import './BillingAndSubscriptionV2.css';

type ViewState =
  | 'trial'
  | 'active'
  | 'pending_inc'
  | 'pending_dec'
  | 'scheduled'
  | 'past_due'
  | 'canceled'
  | 'ltd'
  | 'inactive';

type Tone = 'neutral' | 'good' | 'warn' | 'danger' | 'info' | 'accent';

// Tier ordering for self-serve plan changes — mirrors the backend's
// SELF_SERVE_TIER_ORDER (direction is derived from tier, never from price).
const SELF_SERVE_TIER_ORDER: Record<string, number> = { STANDARD: 1, PLUS: 2 };

// Caps (locations, team members) at or above this display as unlimited: the
// DB stores a number no real business will reach (100+) rather than a null.
// Null and the legacy -1 sentinel stay unlimited too.
const UNLIMITED_CAP_MIN = 100;
const isUnlimitedCap = (n: number | null | undefined): boolean =>
  n == null || n === -1 || n >= UNLIMITED_CAP_MIN;

const formatDate = (input: string | null | undefined): string => {
  if (!input) return '—';
  // Browser locale, matching HistoryCard and the i18n number formatting —
  // a Romanian user shouldn't see 'Jul 3, 2026' between localized strings.
  return new Date(input).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const deriveViewState = (
  user: AuthUser | null,
  summary: SubscriptionSummary | null,
  hasHistory: boolean,
): ViewState => {
  const entitlement = user?.entitlements?.status;
  const sub = user?.subscription;

  if (summary?.pendingPayment) return 'past_due';
  if (entitlement === 'past_due') return 'past_due';
  if (entitlement === 'ltd') return 'ltd';
  if (entitlement === 'trial') return 'trial';

  if (sub?.status === 'active' && sub.cancelAtPeriodEnd) return 'scheduled';

  const scheduled = summary?.scheduled?.scheduledSeats ?? null;
  const paid = summary?.paidSeats ?? 0;
  if (scheduled != null && scheduled > paid) return 'pending_inc';
  if (scheduled != null && scheduled < paid) return 'pending_dec';

  if (entitlement === 'active') return 'active';

  if (entitlement === 'no_subscription' || entitlement === 'expired') {
    return hasHistory ? 'canceled' : 'inactive';
  }

  return 'inactive';
};

const StatusPill = ({ state }: { state: ViewState }) => {
  const { t } = useTranslation('settings');
  const map: Record<ViewState, { tone: Tone; label: string }> = {
    trial: { tone: 'warn', label: t('billing.status.trial') },
    active: { tone: 'good', label: t('billing.status.active') },
    pending_inc: { tone: 'info', label: t('billing.v2.status.pendingChange') },
    pending_dec: { tone: 'info', label: t('billing.v2.status.pendingChange') },
    scheduled: { tone: 'warn', label: t('billing.status.scheduledForCancellation') },
    past_due: { tone: 'danger', label: t('billing.status.pastDue') },
    canceled: { tone: 'neutral', label: t('billing.status.canceled') },
    ltd: { tone: 'accent', label: t('billing.v2.status.lifetime') },
    inactive: { tone: 'neutral', label: t('billing.v2.status.noSubscription') },
  };
  const m = map[state];
  return (
    <span className={`bv2-pill bv2-pill-${m.tone}`}>
      <span className="bv2-dot" />
      {m.label}
    </span>
  );
};

const Bv2Banner = ({
  tone,
  icon,
  title,
  children,
}: {
  tone: Tone;
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
}) => {
  const toneClass =
    tone === 'good'
      ? 'bv2-banner-good'
      : tone === 'warn'
        ? 'bv2-banner-warn'
        : tone === 'danger'
          ? 'bv2-banner-danger'
          : tone === 'info'
            ? 'bv2-banner-info'
            : 'bv2-banner-neutral';
  return (
    <div className={`bv2-banner ${toneClass}`}>
      <div className="bv2-banner-icon">{icon ?? <Info className="h-4 w-4" />}</div>
      <div className="bv2-banner-body">
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
};

const Bv2CardHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <div className="bv2-card-header">
    <div>
      <h3>{title}</h3>
      {subtitle && <div className="bv2-card-sub">{subtitle}</div>}
    </div>
    {action && <div className="bv2-card-action">{action}</div>}
  </div>
);

const BillingAndSubscriptionV2Inner = () => {
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { ensureConfigured } = useBillingDetailsContext();
  const { ConfirmDialog, confirm } = useConfirmRadix();

  const currentUser = useSelector(selectCurrentUser);
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const loading = useSelector(selectIsLoadingSubscriptionSummary);
  const summaryError = useSelector(selectSubscriptionSummaryError);
  const portalLoading = useSelector(selectIsLoadingCustomerPortal);
  const checkoutLoading = useSelector(selectIsLoadingCheckoutSession);
  const cancelLoading = useSelector(selectIsLoadingModifySubscription);
  const cancelRemovalLoading = useSelector(selectIsLoadingCancelRemoval);
  const smsBalance = useSelector(selectSmsBalance);
  const invoices = useSelector(selectBusinessInvoices);
  const invoicesLoading = useSelector(selectIsLoadingBusinessInvoices);
  const plans = useSelector(selectAvailablePlans);
  const plansLoading = useSelector(selectIsLoadingPlans);

  const [updatingSeats, setUpdatingSeats] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [totalSeats, setTotalSeats] = useState<number>(0);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [cancellingPlanChange, setCancellingPlanChange] = useState(false);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      dispatch(getSubscriptionSummaryAction.request());
      dispatch(getPlansAction.request());
      dispatch(getSmsBalanceAction.request());
      dispatch(getSmsPackagesAction.request());
      dispatch(getBusinessInvoicesAction.request({ limit: 20 }));
    }
  }, [dispatch]);

  // Default the plan selection to the business's assigned plan (fallback: STANDARD)
  useEffect(() => {
    if (plans.length === 0) return;
    setSelectedPlanId((prev) => {
      if (prev != null && plans.some((p) => p.id === prev)) return prev;
      const fallback =
        plans.find((p) => p.isCurrentPlan) ??
        plans.find((p) => p.tier === 'STANDARD') ??
        plans[0];
      return fallback.id;
    });
  }, [plans]);

  // Sync seat input with summary
  useEffect(() => {
    const status = currentUser?.entitlements?.status;
    if (status === 'active' || status === 'past_due') {
      setTotalSeats(subscriptionSummary?.paidSeats || 0);
    } else if (
      status === 'trial' ||
      status === 'expired' ||
      status === 'no_subscription'
    ) {
      setTotalSeats(
        subscriptionSummary?.paidSeats ||
          subscriptionSummary?.currentTeamMembersCount ||
          0,
      );
    } else if (status === 'ltd') {
      setTotalSeats(subscriptionSummary?.paidSeats || 0);
    }
  }, [
    currentUser?.entitlements?.status,
    subscriptionSummary?.paidSeats,
    subscriptionSummary?.currentTeamMembersCount,
  ]);

  const hasPendingPayment = !!subscriptionSummary?.pendingPayment;
  const hasScheduledChange = !!(
    subscriptionSummary?.scheduled &&
    subscriptionSummary.scheduled.scheduledSeats != null
  );
  const isSubscriptionScheduledForCancellation =
    currentUser?.subscription?.status === 'active' &&
    !!currentUser?.subscription?.cancelAtPeriodEnd;

  const billingCurrency = subscriptionSummary?.currency || 'EUR';
  const currencySymbol = getCurrencySymbol(billingCurrency);
  const { formatDecimalValue, formatDecimalPrice } = useFormatPrice();
  // Locale-aware decimal-input formatter, bound to the active billing
  // currency. All `.toFixed(2)` call sites in this file should go through
  // this so amounts get grouped (`1,234.56` / `1.234,56`) instead of raw.
  const fmtBilling = (value: number) => formatDecimalValue(value, billingCurrency);

  const viewState = deriveViewState(
    currentUser ?? null,
    subscriptionSummary ?? null,
    invoices.length > 0,
  );

  const heroTone: 'warn' | 'danger' | 'info' | 'neutral' | '' =
    viewState === 'past_due'
      ? 'danger'
      : viewState === 'trial' || viewState === 'scheduled'
        ? 'warn'
        : viewState === 'pending_inc' || viewState === 'pending_dec'
          ? 'info'
          : viewState === 'canceled' || viewState === 'inactive'
            ? 'neutral'
            : '';

  // ────────── Plan selection (Standard vs Plus) ──────────

  const scheduledPlanChange = subscriptionSummary?.scheduledPlanChange ?? null;
  const currentPlanTier =
    subscriptionSummary?.currentPlan?.tier ?? currentUser?.entitlements?.planTier ?? null;
  // States where picking a plan feeds the checkout flow instead of change-plan
  const isCheckoutState =
    viewState === 'trial' || viewState === 'inactive' || viewState === 'canceled';
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;
  // In checkout states the breakdown/CTA should price the plan being chosen
  const checkoutPlanPricing = isCheckoutState ? (selectedPlan?.pricing ?? null) : null;
  // LTD businesses get a 400 from change-plan; CUSTOM plans are handled manually —
  // neither gets plan-change UI.
  const showPlanPicker =
    viewState !== 'ltd' && !subscriptionSummary?.isLtd && currentPlanTier !== 'CUSTOM';
  // Plan switching is blocked while another billing change is in flight
  const planChangeLockedReason =
    viewState === 'past_due' || hasPendingPayment
      ? t('billing.v2.plans.lockedPendingPayment')
      : viewState === 'scheduled' || isSubscriptionScheduledForCancellation
        ? t('billing.v2.plans.lockedCancellation')
        : scheduledPlanChange
          ? t('billing.v2.plans.lockedScheduled')
          : // Seat changes share the Stripe schedule with plan changes — switching
            // plans now would silently drop the scheduled seat change.
            hasScheduledChange
            ? t('billing.v2.plans.lockedScheduledSeats')
            : null;

  // ────────── Handlers (kept aligned with v1 semantics) ──────────

  const handleManagePaymentMethodAndInvoices = () => {
    const returnUrl = window.location.origin + '/account?tab=billing';
    dispatch(getCustomerPortalUrlAction.request({ returnUrl }));
  };

  // `plan` comes from the plan card's CTA; the hero buttons call this with no
  // argument and fall back to the picker selection, exactly as before. It must
  // be passed rather than set-then-read: setSelectedPlanId in the same tick
  // would leave this closure pricing the previous selection.
  const handleRenewSubscription = async (plan?: AvailablePlan) => {
    if (!ensureConfigured()) return;
    const planId = plan?.id ?? selectedPlanId;
    if (planId == null) {
      toast.error(t('billing.v2.plans.noPlanSelected'));
      return;
    }
    // Keep the picker and the hero total on the plan being bought.
    if (plan) setSelectedPlanId(plan.id);
    const pricing = plan?.pricing ?? checkoutPlanPricing;
    const planForCopy = plan ?? selectedPlan;
    const planName = planForCopy?.name ?? '';
    const base = pricing?.basePlanPrice ?? (subscriptionSummary?.basePlanPrice || 0);
    const perSeat = pricing?.pricePerTeamMember ?? (subscriptionSummary?.pricePerTeamMember || 0);
    const estimated = base + perSeat * (Number(totalSeats) || 0);
    const confirmed = await confirm({
      eyebrow: t('billing.confirm.startSubscriptionEyebrow'),
      title:
        planForCopy?.tier === 'PLUS' ? (
          <span className="bv2-confirm-title">
            <Crown className="bv2-confirm-crown" />
            {t('billing.confirm.startSubscription', { plan: planName })}
          </span>
        ) : (
          t('billing.confirm.startSubscription', { plan: planName })
        ),
      content:
        totalSeats > 0
          ? t('billing.confirm.proceedWithSeats', {
              count: totalSeats,
              plan: planName,
              amount: fmtBilling(estimated),
              currency: currencySymbol,
            })
          : t('billing.confirm.proceedSubscribe', {
              plan: planName,
              amount: fmtBilling(estimated),
              currency: currencySymbol,
            }),
      confirmationText: t('billing.confirm.continue'),
      cancellationText: t('billing.confirm.checkoutCancel'),
    });
    if (!confirmed) return;
    // Button state is driven by checkoutLoading (redux): the saga keeps it on
    // through the Stripe redirect and resets it with a toast on failure — no
    // local flag to get stuck.
    dispatch(
      createCheckoutSessionAction.request({
        planId,
        seats: totalSeats,
        successUrl: `${window.location.origin}/info?type=subscription-success`,
        cancelUrl: `${window.location.origin}/account`,
      }),
    );
  };

  const handleSubscriptionStatusChange = async () => {
    const isScheduled =
      currentUser?.subscription?.status === 'active' &&
      currentUser?.subscription?.cancelAtPeriodEnd;
    // Only true past_due (Stripe sub status = past_due/unpaid) triggers the immediate-cancel warning.
    // viewState='past_due' can also be triggered by a stuck seat-change pendingPayment while the sub
    // itself is still active and paid through the period — those keep the normal at-period-end copy.
    const isPastDue = currentUser?.entitlements?.status === 'past_due';
    // What continuing costs — the summary's prices are the current plan's.
    const monthly =
      (subscriptionSummary?.basePlanPrice || 0) +
      (subscriptionSummary?.pricePerTeamMember || 0) * (subscriptionSummary?.paidSeats || 0);
    const confirmed = await confirm({
      eyebrow: isScheduled
        ? t('billing.confirm.scheduledChangeEyebrow')
        : t('billing.confirm.cancelSubEyebrow'),
      title: isScheduled
        ? t('billing.confirm.keepSubTitle')
        : t('billing.confirm.cancelSubTitle'),
      content: isScheduled
        ? monthly > 0
          ? t('billing.confirm.keepSubscriptionContent', {
              date: formatDate(periodEnd),
              amount: fmtBilling(monthly),
              currency: currencySymbol,
            })
          : t('billing.confirm.keepSubscriptionContentNoPrice', { date: formatDate(periodEnd) })
        : isPastDue
          ? t('billing.confirm.cancelSubscriptionPastDueContent')
          : t('billing.confirm.cancelSubscriptionContent', { date: formatDate(periodEnd) }),
      confirmationText: isScheduled
        ? t('billing.confirm.keepSubConfirm')
        : isPastDue
          ? t('billing.confirm.cancelSubConfirmPastDue')
          : t('billing.confirm.cancelSubConfirm'),
      cancellationText: isScheduled
        ? t('billing.confirm.keepSubCancel')
        : t('billing.confirm.staySubscribed'),
    });
    if (!confirmed) return;
    dispatch(
      modifySubscriptionAction.request({
        action: isScheduled ? 'keep' : 'cancel',
      }),
    );
  };

  const handleCancelRemoval = async () => {
    const confirmed = await confirm({
      eyebrow: t('billing.confirm.scheduledChangeEyebrow'),
      title: t('billing.confirm.undoScheduledCancellation'),
      content: t('billing.confirm.undoScheduledContent'),
      confirmationText: t('billing.confirm.undoCancellation'),
      cancellationText: t('billing.confirm.keepScheduled'),
    });
    if (!confirmed) return;
    dispatch(cancelRemovalAction.request());
  };

  const handleUpgrade = async () => {
    const isLtd = currentUser?.entitlements?.status === 'ltd';
    const ltdHasNoSeats =
      isLtd && (subscriptionSummary?.paidSeats ?? 0) === 0;

    if (ltdHasNoSeats) {
      if (!ensureConfigured()) return;
      if ((Number(totalSeats) || 0) <= 0) {
        toast.info(t('billing.toast.alreadyScheduled'));
        return;
      }
      setUpdatingSeats(true);
      try {
        const response = await createLtdSeatsCheckoutSession({
          seats: totalSeats,
          successUrl: `${window.location.origin}/info?type=subscription-success`,
          cancelUrl: `${window.location.origin}/account`,
        });
        if (response.url) {
          window.location.href = response.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, t('billing.toast.updateFailed')));
      } finally {
        setUpdatingSeats(false);
      }
      return;
    }

    const status = currentUser?.entitlements?.status;
    const isTrial = status === 'trial';
    const isExpiredTrial = status === 'expired' || status === 'no_subscription';

    if (isTrial || isExpiredTrial) {
      if (!ensureConfigured()) return;
      if (selectedPlanId == null) {
        toast.error(t('billing.v2.plans.noPlanSelected'));
        return;
      }
      const planName = selectedPlan?.name ?? '';
      const base = checkoutPlanPricing?.basePlanPrice ?? (subscriptionSummary?.basePlanPrice || 0);
      const perSeat =
        checkoutPlanPricing?.pricePerTeamMember ?? (subscriptionSummary?.pricePerTeamMember || 0);
      const estimated = base + perSeat * (Number(totalSeats) || 0);
      const confirmed = await confirm({
        eyebrow: t('billing.confirm.startSubscriptionEyebrow'),
        title:
          selectedPlan?.tier === 'PLUS' ? (
            <span className="bv2-confirm-title">
              <Crown className="bv2-confirm-crown" />
              {t('billing.confirm.startSubscription', { plan: planName })}
            </span>
          ) : (
            t('billing.confirm.startSubscription', { plan: planName })
          ),
        content:
          totalSeats > 0
            ? t('billing.confirm.proceedWithSeats', {
                count: totalSeats,
                plan: planName,
                amount: fmtBilling(estimated),
                currency: currencySymbol,
              })
            : t('billing.confirm.proceedSubscribe', {
                plan: planName,
                amount: fmtBilling(estimated),
                currency: currencySymbol,
              }),
        confirmationText: t('billing.confirm.continue'),
        cancellationText: t('billing.confirm.checkoutCancel'),
      });
      if (!confirmed) return;
      // checkoutLoading (redux) drives the button state — see handleRenewSubscription.
      dispatch(
        createCheckoutSessionAction.request({
          planId: selectedPlanId,
          seats: totalSeats,
          successUrl: `${window.location.origin}/info?type=subscription-success`,
          cancelUrl: `${window.location.origin}/account`,
        }),
      );
      return;
    }

    // Active path: update existing seats
    const paid = subscriptionSummary?.paidSeats || 0;
    const scheduledNextTotal =
      subscriptionSummary?.scheduled?.scheduledSeats ?? null;
    const desiredTotal = totalSeats;
    if (scheduledNextTotal != null && desiredTotal === scheduledNextTotal) {
      toast.info(t('billing.toast.alreadyScheduled'));
      return;
    }
    if (desiredTotal === paid) return;

    const delta = desiredTotal - paid;
    const pricePerSeat = subscriptionSummary?.pricePerTeamMember || 0;
    const isAdding = delta > 0;
    const additionalCost = isAdding ? delta * pricePerSeat : 0;

    if (isAdding && !ensureConfigured()) return;

    // For seat increases, ask Stripe for the exact proration this change will
    // charge right now — the page-load preview in subscription-summary is
    // single-seat and goes stale as the period advances. Falls back to the
    // approximate client math if the preview call fails.
    setIsConfirming(true);
    let exactDueToday: number | null = null;
    if (isAdding) {
      try {
        const preview = await getSeatChangePreview(desiredTotal);
        exactDueToday = preview.amountDue;
      } catch {
        // keep exactDueToday null → approximate fallback below
      }
    }

    const proratedInfo = subscriptionSummary?.proratedSeatInfo ?? null;
    let addingContent: React.ReactNode = t('billing.confirm.addingSeatsContent', {
      count: delta,
      amount: fmtBilling(exactDueToday ?? additionalCost),
      currency: currencySymbol,
    });

    if (isAdding && proratedInfo) {
      const proratedTotal = exactDueToday ?? delta * proratedInfo.proratedPricePerSeat;
      const recurringCost = delta * proratedInfo.fullMonthlyPricePerSeat;
      addingContent = (
        <div className="flex cursor-default flex-col gap-4 pt-1">
          <div className="flex cursor-default items-baseline gap-1.5">
            <span className="cursor-default text-3xl font-bold tracking-tight tabular-nums text-foreground-1">
              {formatDecimalPrice(proratedTotal, billingCurrency)}
            </span>
            <span className="cursor-default text-sm font-medium text-foreground-3">
              {t('billing.confirm.dueTodaySuffix')}
            </span>
          </div>
          <p className="cursor-default text-sm leading-relaxed text-foreground-3 dark:text-foreground-2">
            {t('billing.confirm.coversUntilLine', {
              count: delta,
              date: formatDate(proratedInfo.nextChargeDate),
            })}
          </p>
          <p className="cursor-default text-sm leading-relaxed text-foreground-3 dark:text-foreground-2">
            {t('billing.confirm.afterThatRenews', {
              count: delta,
              currency: currencySymbol,
              amount: fmtBilling(recurringCost),
            })}
          </p>
        </div>
      );
    }

    const confirmed = await confirm({
      eyebrow: t('billing.confirm.seatChangeEyebrow'),
      title: isAdding ? (
        <span className="block cursor-default text-xl font-bold leading-tight tracking-tight text-foreground-1">
          {t('billing.confirm.confirmSeatIncrease', { count: delta })}
        </span>
      ) : (
        t('billing.confirm.confirmSeatDecrease')
      ),
      content: isAdding
        ? addingContent
        : t('billing.confirm.removingSeatsContent', { count: Math.abs(delta) }),
      confirmationText: isAdding
        ? t('billing.confirm.payAmount', {
            currency: currencySymbol,
            amount: fmtBilling(
              exactDueToday ??
                (proratedInfo
                  ? delta * proratedInfo.proratedPricePerSeat
                  : additionalCost),
            ),
          })
        : t('billing.confirm.removeSeats'),
      cancellationText: t('billing.confirm.cancel'),
    });
    setIsConfirming(false);
    if (!confirmed) return;

    try {
      setUpdatingSeats(true);
      const response = await updateSeats({ seats: totalSeats });
      if (response.requiresAction && response.clientSecret) {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) throw new Error('Stripe publishable key not configured');
        const stripe = await loadStripe(publishableKey);
        if (!stripe) throw new Error('Failed to load Stripe');
        const { error } = await stripe.confirmCardPayment(response.clientSecret);
        if (error) {
          // pending_if_incomplete keeps the sub at its original seat count until payment
          // succeeds, so voiding the failed proration invoice cleanly discards the attempt
          // and avoids leaving the user in a past_due-looking state.
          try {
            await abortPendingPayment();
          } catch {
            // If abort fails, fall back to the past_due UI (handled on next refresh).
          }
          toast.error(error.message || t('billing.toast.paymentFailed'));
          dispatch(getSubscriptionSummaryAction.request());
          dispatch(fetchCurrentUserAction.request());
        } else {
          toast.success(t('billing.toast.paymentConfirmed'));
          window.location.href = '/info?type=seats-update-success';
        }
      } else if (response.url) {
        window.location.href = response.url;
      } else if (response.success) {
        toast.success(t('billing.toast.seatsUpdated'));
        window.location.href = '/info?type=seats-update-success';
      } else {
        throw new Error('Seat update failed');
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('billing.toast.updateFailed')));
      dispatch(getSubscriptionSummaryAction.request());
      dispatch(fetchCurrentUserAction.request());
    } finally {
      setUpdatingSeats(false);
    }
  };

  const handleAbortPayment = async () => {
    try {
      setRetryingPayment(true);
      await abortPendingPayment();
      toast.success(t('billing.pendingPayment.aborted'));
      dispatch(getSubscriptionSummaryAction.request());
      dispatch(fetchCurrentUserAction.request());
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('billing.toast.updateFailed')));
    } finally {
      setRetryingPayment(false);
    }
  };

  // ────────── Derived values ──────────

  const basePlanCost =
    viewState === 'ltd'
      ? 0
      : (checkoutPlanPricing?.basePlanPrice ?? (subscriptionSummary?.basePlanPrice || 0));
  const seatPrice =
    checkoutPlanPricing?.pricePerTeamMember ?? (subscriptionSummary?.pricePerTeamMember || 0);
  const seatsForBreakdown =
    viewState === 'trial' ||
    viewState === 'inactive' ||
    viewState === 'active' ||
    viewState === 'canceled'
      ? Number(totalSeats) || 0
      : viewState === 'ltd'
        ? 0 // LTD: seats free
        : subscriptionSummary?.paidSeats || 0;
  const seatLineCost = seatsForBreakdown * seatPrice;
  const totalCost = basePlanCost + seatLineCost;
  const paidSeatsCount = subscriptionSummary?.paidSeats || 0;
  // Only meaningful for active subscriptions, where the stepper baseline is
  // paidSeats. In trial/inactive/canceled, the stepper is configuring an
  // initial subscription, not modifying one — there's no "previous" value.
  const seatDelta =
    viewState === 'active' || viewState === 'past_due'
      ? (Number(totalSeats) || 0) - paidSeatsCount
      : 0;
  // Retain the last positive delta so the proration banner keeps its content
  // legible during its close animation (when delta drops back to 0).
  const lastPositiveDelta = useRef(1);
  useEffect(() => {
    if (seatDelta > 0) lastPositiveDelta.current = seatDelta;
  }, [seatDelta]);

  const planName =
    subscriptionSummary?.planName || currentUser?.subscription?.planName || t('billing.freePlan');
  // In checkout states the hero/breakdown reflect the plan being chosen
  const displayPlanName = isCheckoutState && selectedPlan ? selectedPlan.name : planName;
  // Caps must follow the same plan the name and prices do — in checkout states
  // that is the selection, not the trial's entitlements.
  const displayMaxLocations =
    isCheckoutState && selectedPlan
      ? selectedPlan.maxLocations
      : (currentUser?.entitlements?.maxLocations ?? null);
  const trialDaysLeft = currentUser?.entitlements?.daysRemaining ?? 0;
  const trialEndsAt = currentUser?.subscription?.trialEndsAt;
  const periodEnd = currentUser?.subscription?.currentPeriodEnd;

  // ────────── Plan change (active subscription) ──────────

  const handleChangePlan = async (plan: AvailablePlan) => {
    if (changingPlan || plan.isCurrentPlan) return;
    const currentOrder = SELF_SERVE_TIER_ORDER[currentPlanTier ?? ''] ?? 0;
    const targetOrder = SELF_SERVE_TIER_ORDER[plan.tier] ?? 0;
    const isUpgradeChange = targetOrder > currentOrder;

    // Two selectable plans sharing a tier is a data problem (the backend rejects
    // the change too) — never present a lateral move as a downgrade.
    if (targetOrder === currentOrder) {
      toast.error(t('billing.toast.planChangeFailed'));
      return;
    }

    const paid = subscriptionSummary?.paidSeats || 0;
    const newMonthly = plan.pricing
      ? plan.pricing.basePlanPrice + plan.pricing.pricePerTeamMember * paid
      : null;

    if (isUpgradeChange) {
      if (!ensureConfigured()) return;
      // Exact proration from Stripe: prorated target-plan cost for the remaining
      // period minus the unused-time credit of the current plan (same preview
      // mechanism as seat changes). Best-effort — on failure the popup falls
      // back to the generic copy and Stripe still charges the correct amount.
      let preview: PlanChangePreviewResponse | null = null;
      setChangingPlan(true);
      try {
        preview = await getPlanChangePreview(plan.id);
      } catch {
        preview = null;
      } finally {
        setChangingPlan(false);
      }
      const confirmed = await confirm({
        eyebrow: t('billing.confirm.planChangeEyebrow'),
        title: t('billing.confirm.upgradePlanTitle', { plan: plan.name }),
        content:
          preview?.action === 'upgrade' ? (
            <div className="space-y-2 text-sm leading-relaxed">
              <p>{t('billing.confirm.upgradeProrationIntro', { plan: plan.name })}</p>
              <ul className="list-disc space-y-1.5 pl-4">
                <li>
                  {t('billing.confirm.upgradeProrationCharge', {
                    plan: plan.name,
                    date: formatDate(preview.periodEnd),
                    amount: fmtBilling(preview.chargedNow),
                    currency: currencySymbol,
                  })}
                </li>
                <li>
                  {t('billing.confirm.upgradeProrationCredit', {
                    plan: planName,
                    amount: fmtBilling(Math.abs(preview.creditedNow)),
                    currency: currencySymbol,
                  })}
                </li>
              </ul>
              <p className="font-medium">
                {t('billing.confirm.upgradeProrationDueNow', {
                  amount: fmtBilling(preview.amountDue),
                  currency: currencySymbol,
                })}
              </p>
              {newMonthly != null && (
                <p>
                  {t('billing.confirm.upgradeProrationRenewal', {
                    date: formatDate(preview.periodEnd),
                    amount: fmtBilling(newMonthly),
                    currency: currencySymbol,
                  })}
                </p>
              )}
            </div>
          ) : newMonthly != null ? (
            t('billing.confirm.upgradePlanContent', {
              plan: plan.name,
              amount: fmtBilling(newMonthly),
              currency: currencySymbol,
            })
          ) : (
            t('billing.confirm.upgradePlanContentNoPrice', { plan: plan.name })
          ),
        confirmationText: t('billing.confirm.upgradeNow'),
        cancellationText: t('billing.confirm.cancel'),
      });
      if (!confirmed) return;
    } else {
      // Current monthly at the same seat basis as newMonthly — the summary's
      // prices are the current plan's.
      const currentMonthly =
        (subscriptionSummary?.basePlanPrice || 0) +
        (subscriptionSummary?.pricePerTeamMember || 0) * paid;
      const usedLocations = subscriptionSummary?.numberOfLocations ?? 0;
      // A display-unlimited cap (100+) is no cap: never warn about it.
      const targetCap = isUnlimitedCap(plan.maxLocations) ? null : plan.maxLocations;
      const overCap = targetCap != null && usedLocations > targetCap;
      const confirmed = await confirm({
        eyebrow: t('billing.confirm.planChangeEyebrow'),
        title: t('billing.confirm.downgradePlanTitle', { plan: plan.name }),
        content: (
          <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed">
            <li>
              {newMonthly != null && currentMonthly > 0
                ? t('billing.confirm.downgradeWarnPeriodEnd', {
                    current: planName,
                    date: formatDate(periodEnd),
                    amount: fmtBilling(newMonthly),
                    old: fmtBilling(currentMonthly),
                    currency: currencySymbol,
                  })
                : t('billing.confirm.downgradeWarnPeriodEndNoPrice', {
                    current: planName,
                    date: formatDate(periodEnd),
                  })}
            </li>
            {/* Every self-serve downgrade lands on Base (no Web Studio); the
                capless variant keeps the Web Studio warning alone. */}
            <li>
              {targetCap != null
                ? t('billing.confirm.downgradeWarnLosses', { count: targetCap })
                : t('billing.confirm.downgradeWarnWebsiteBuilder')}
            </li>
            {overCap && (
              <li>
                {t('billing.confirm.downgradeOverLocationCap', {
                  count: usedLocations,
                  max: targetCap,
                  plan: plan.name,
                })}
              </li>
            )}
            <li>{t('billing.confirm.downgradeReversible', { date: formatDate(periodEnd) })}</li>
          </ul>
        ),
        confirmationText: t('billing.confirm.scheduleDowngrade'),
        cancellationText: t('billing.confirm.keepCurrentShort', { plan: planName }),
        destructive: true,
      });
      if (!confirmed) return;
    }

    setChangingPlan(true);
    try {
      const response = await changePlanApi({ planId: plan.id });
      if (response.action === 'upgraded' && response.requiresAction && response.clientSecret) {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) throw new Error('Stripe publishable key not configured');
        const stripe = await loadStripe(publishableKey);
        if (!stripe) throw new Error('Failed to load Stripe');
        const { error } = await stripe.confirmCardPayment(response.clientSecret);
        if (error) {
          // pending_if_incomplete keeps the sub on its original plan until payment
          // succeeds, so voiding the failed proration invoice cleanly discards the
          // attempt (same recovery path as seat updates).
          try {
            await abortPendingPayment();
          } catch {
            // If abort fails, fall back to the past_due UI (handled on next refresh).
          }
          toast.error(error.message || t('billing.toast.paymentFailed'));
        } else {
          // Full-page hop to the success screen (same pattern as seat updates): the
          // reload + reading time gives the plan-change webhook room to sync the plan
          // and entitlements, so billing and the website builder come back unlocked.
          window.location.href = '/info?type=plan-upgrade-success';
          return;
        }
      } else if (response.action === 'upgraded') {
        window.location.href = '/info?type=plan-upgrade-success';
        return;
      } else if (response.action === 'downgrade_scheduled') {
        toast.success(
          t('billing.toast.planDowngradeScheduled', {
            plan: response.scheduledPlan?.name ?? plan.name,
            date: formatDate(response.effectiveDate),
          }),
        );
      }
      dispatch(getSubscriptionSummaryAction.request());
      dispatch(fetchCurrentUserAction.request());
      dispatch(getPlansAction.request());
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('billing.toast.planChangeFailed')));
      dispatch(getSubscriptionSummaryAction.request());
      dispatch(fetchCurrentUserAction.request());
    } finally {
      setChangingPlan(false);
    }
  };

  const handleCancelPlanChange = async () => {
    if (cancellingPlanChange || !scheduledPlanChange) return;
    const body = t('billing.confirm.keepCurrentPlanContent', {
      target: scheduledPlanChange.planName,
      date: formatDate(scheduledPlanChange.effectiveDate),
    });
    const confirmed = await confirm({
      eyebrow: t('billing.confirm.scheduledChangeEyebrow'),
      title: t('billing.confirm.keepCurrentPlanTitle', { plan: planName }),
      // The seat warning only when there is a scheduled seat change to lose.
      content: hasScheduledChange
        ? `${body} ${t('billing.confirm.keepCurrentPlanSeats')}`
        : body,
      confirmationText: t('billing.confirm.keepCurrentPlanCta', { plan: planName }),
      cancellationText: t('billing.confirm.keepSwitchCta'),
    });
    if (!confirmed) return;
    setCancellingPlanChange(true);
    try {
      const response = await cancelPlanChangeApi();
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel plan change');
      }
      toast.success(t('billing.toast.planChangeCancelled'));
      dispatch(getSubscriptionSummaryAction.request());
      dispatch(fetchCurrentUserAction.request());
      dispatch(getPlansAction.request());
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('billing.toast.planChangeFailed')));
    } finally {
      setCancellingPlanChange(false);
    }
  };

  const renderHeroPrimaryAction = () => {
    switch (viewState) {
      case 'trial':
        return (
          <Button
            onClick={handleUpgrade}
            rounded="full"
            disabled={checkoutLoading}
            className="gap-2 bv2-btn-upgrade-hero"
          >
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('billing.v2.hero.upgradeCta', {
              amount: fmtBilling(totalCost),
              currency: currencySymbol,
            })}
            <ArrowRight className="h-4 w-4" />
          </Button>
        );
      case 'active':
        return (
          <Button
            variant="outline"
            rounded="full"
            onClick={handleManagePaymentMethodAndInvoices}
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {t('billing.paymentMethodInvoices')}
          </Button>
        );
      case 'past_due':
        return (
          <Button
            onClick={handleManagePaymentMethodAndInvoices}
            disabled={portalLoading}
            rounded="full"
            variant="destructive"
            className="gap-2 bv2-btn-upgrade-hero"
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {t('billing.v2.hero.managePayment')}
          </Button>
        );
      case 'canceled':
        return (
          <Button
            onClick={() => void handleRenewSubscription()}
            disabled={checkoutLoading}
            rounded="full"
            className="gap-2 bv2-btn-upgrade-hero"
          >
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('billing.v2.hero.renewCta', {
              amount: fmtBilling(totalCost),
              currency: currencySymbol,
            })}
            <ArrowRight className="h-4 w-4" />
          </Button>
        );
      case 'scheduled':
        return (
          <Button
            onClick={handleSubscriptionStatusChange}
            disabled={cancelLoading}
            rounded="full"
            className="gap-2 bv2-btn-upgrade-hero"
          >
            {cancelLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            {t('billing.keepSubscription')}
          </Button>
        );
      case 'inactive':
        return (
          <Button
            onClick={() => void handleRenewSubscription()}
            disabled={checkoutLoading}
            rounded="full"
            className="gap-2 bv2-btn-upgrade-hero"
          >
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('billing.v2.hero.startSubscription', {
              amount: fmtBilling(totalCost),
              currency: currencySymbol,
            })}
            <ArrowRight className="h-4 w-4" />
          </Button>
        );
      case 'ltd':
        return (
          <Button
            variant="outline"
            rounded="full"
            onClick={handleManagePaymentMethodAndInvoices}
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {t('billing.paymentMethodInvoices')}
          </Button>
        );
      case 'pending_inc':
      case 'pending_dec':
        return (
          <Button
            variant="outline"
            rounded="full"
            onClick={handleCancelRemoval}
            disabled={cancelRemovalLoading}
            className="gap-2"
          >
            {cancelRemovalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            {t('billing.v2.hero.revertChange')}
          </Button>
        );
      default:
        return null;
    }
  };

  const renderHeroSecondaryRow = () => {
    switch (viewState) {
      case 'trial':
        return (
          <>
            <span>
              <strong className="font-semibold text-foreground-1">{trialDaysLeft}</strong>{' '}
              {t('billing.v2.hero.daysLeft')}
            </span>
            <span className="bv2-sep">·</span>
            <span>{t('billing.ends', { date: formatDate(trialEndsAt) })}</span>
          </>
        );
      case 'active':
        return (
          <>
            <span>{t('billing.v2.hero.renews', { date: formatDate(periodEnd) })}</span>
            <span className="bv2-sep">·</span>
            <span>
              {t('billing.v2.hero.seatsLine', {
                seats: subscriptionSummary?.paidSeats || 0,
                used: subscriptionSummary?.usedSeats || 0,
              })}
            </span>
          </>
        );
      case 'pending_inc':
      case 'pending_dec':
        return (
          <span>
            {t('billing.v2.hero.goingToSeats', {
              count: subscriptionSummary?.scheduled?.scheduledSeats ?? 0,
              date: formatDate(subscriptionSummary?.scheduled?.nextPeriodStart),
            })}
          </span>
        );
      case 'scheduled':
        return (
          <>
            <span>{t('billing.v2.hero.activeUntil', { date: formatDate(periodEnd) })}</span>
            <span className="bv2-sep">·</span>
            <span>{t('billing.v2.hero.noFurtherCharges')}</span>
          </>
        );
      case 'past_due':
        return (
          <span style={{ color: 'var(--error)' }}>
            {t('billing.v2.hero.paymentFailedShort')}
          </span>
        );
      case 'canceled':
        return <span>{t('billing.v2.hero.endedOn', { date: formatDate(periodEnd) })}</span>;
      case 'ltd':
        return <span>{t('billing.v2.hero.lifetimeNote')}</span>;
      case 'inactive':
        return null;
      default:
        return null;
    }
  };

  const showHeroPrice =
    viewState !== 'trial' &&
    viewState !== 'inactive' &&
    viewState !== 'canceled' &&
    viewState !== 'past_due';

  const seatsLocked =
    hasScheduledChange ||
    // Seat changes share the Stripe schedule with a scheduled plan change —
    // applying one would silently replace the other, so lock seats meanwhile.
    !!scheduledPlanChange ||
    isSubscriptionScheduledForCancellation ||
    hasPendingPayment ||
    viewState === 'past_due' ||
    viewState === 'pending_inc' ||
    viewState === 'pending_dec' ||
    viewState === 'scheduled';

  const hideStepperEntirely = false;

  const onStepDown = () => {
    const used = subscriptionSummary?.usedSeats || 0;
    const desired = (Number(totalSeats) || 0) - 1;
    if (desired === -1) return;
    if (desired < used) {
      toast.info(t('billing.toast.seatsInUse', { count: used }), {
        action: {
          label: t('billing.toast.teamMembers'),
          onClick: () => navigate('/team-members'),
        },
        classNames: {
          actionButton: 'bv2-toast-action',
        },
      });
      setTotalSeats(used);
      return;
    }
    setTotalSeats(desired);
  };
  const onStepUp = () => setTotalSeats((Number(totalSeats) || 0) + 1);

  // ────────── Render ──────────

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="bv2-hero" style={{ display: 'block' }}>
          <Skeleton className="h-9 w-44 mb-3" />
          <Skeleton className="h-5 w-64" />
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // The whole tab is built on the summary. Without it every card would render
  // zero-filled placeholder values as if they were real account data - show a
  // recoverable error instead. A retained summary keeps rendering as before.
  if (summaryError && !subscriptionSummary) {
    return (
      <div className="space-y-5">
        <header className="bv2-page-header">
          <div>
            <h1>{t('tabs.billing')}</h1>
            <p>{t('billing.v2.headerSubtitle')}</p>
          </div>
        </header>
        <ErrorState
          variant="page"
          body={summaryError}
          onRetry={() => {
            dispatch(getSubscriptionSummaryAction.request());
            dispatch(getPlansAction.request());
            dispatch(getSmsBalanceAction.request());
            dispatch(getSmsPackagesAction.request());
            dispatch(getBusinessInvoicesAction.request({ limit: 20 }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ConfirmDialog />

      <header className="bv2-page-header">
        <div>
          <h1>{t('tabs.billing')}</h1>
          <p>{t('billing.v2.headerSubtitle')}</p>
        </div>
      </header>

      {/* Hero summary band */}
      <div className={`bv2-hero ${heroTone ? `bv2-tone-${heroTone}` : ''}`}>
        <div className="bv2-hero-left">
          <div className="bv2-hero-crest">
            <Crown className="h-5 w-5" />
          </div>
          <div className="bv2-hero-meta">
            <h2>
              <span>{t('billing.v2.hero.planName', { name: displayPlanName })}</span>
              <StatusPill state={viewState} />
            </h2>
            <div className="bv2-row2">{renderHeroSecondaryRow()}</div>
          </div>
        </div>
        <div className="bv2-hero-right">
          {showHeroPrice && (
            <div className="bv2-hero-price">
              {formatDecimalPrice(totalCost, billingCurrency)}
              <small>{t('billing.v2.hero.perMonthSuffix')}</small>
            </div>
          )}
          {viewState === 'past_due' && subscriptionSummary?.pendingPayment && (
            <div className="bv2-hero-price bv2-danger">
              {fmtBilling(subscriptionSummary.pendingPayment.amount)}
              <small>{(subscriptionSummary.pendingPayment.currency || '').toUpperCase()} {t('billing.v2.hero.dueSuffix')}</small>
            </div>
          )}
          {renderHeroPrimaryAction()}
        </div>
      </div>

      <div className="bv2-grid">
        {/* Left column */}
        <div className="bv2-col mb-6">
          {/* Subscription details card */}
          <Card>
            <CardContent>
              <Bv2CardHeader
                title={t('billing.v2.subscription.title')}
                subtitle={
                  viewState === 'ltd'
                    ? t('billing.v2.subscription.lifetimeSubtitle')
                    : undefined
                }
              />

              {/* State banners */}
              {viewState === 'trial' && (
                <div className="mb-4">
                  <Bv2Banner
                    tone="warn"
                    icon={<Sparkles className="h-4 w-4" />}
                    title={t('billing.v2.banners.trialEndsIn', { count: trialDaysLeft })}
                  >
                    <div className="bv2-trial-bar">
                      {/* Trials can be longer than the default 14 days (CRM-granted) —
                          stretch the denominator so the bar never lies or overflows */}
                      <div className="bv2-trial-strip">
                        <span
                          style={{
                            width: `${Math.min(100, Math.max(0, 100 - (trialDaysLeft / Math.max(14, trialDaysLeft)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="bv2-trial-meta">{trialDaysLeft}/{Math.max(14, trialDaysLeft)}</div>
                    </div>
                    <div className="mt-2 text-[13px] text-foreground-2">
                      {t('billing.v2.banners.trialBody', { date: formatDate(trialEndsAt) })}
                    </div>
                  </Bv2Banner>
                </div>
              )}

              {viewState === 'past_due' && (() => {
                const billingReason = subscriptionSummary?.pendingPayment?.billingReason;
                const isSeatChange = billingReason === 'subscription_update';

                return (
                  <div className="mb-4">
                    <Bv2Banner
                      tone="danger"
                      icon={<AlertTriangle className="h-4 w-4" />}
                      title={
                        isSeatChange
                          ? t('billing.pendingPayment.seatChangeTitle')
                          : t('billing.pendingPayment.renewalTitle')
                      }
                    >
                      {isSeatChange
                        ? t('billing.pendingPayment.seatChangeBody')
                        : subscriptionSummary?.pendingPayment?.status === 'requires_action'
                          ? t('billing.pendingPayment.requiresAction')
                          : t('billing.pendingPayment.requiresPaymentMethod')}

                      {isSeatChange && (
                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            rounded="full"
                            variant="outline"
                            onClick={handleAbortPayment}
                            disabled={retryingPayment}
                            className="bv2-btn-cancel-payment gap-1.5"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            {t('billing.pendingPayment.abortPayment')}
                          </Button>
                        </div>
                      )}
                    </Bv2Banner>
                  </div>
                );
              })()}

              {viewState === 'scheduled' && (
                <div className="mb-4">
                  <Bv2Banner
                    tone="warn"
                    icon={<CalendarClock className="h-4 w-4" />}
                    title={t('billing.v2.banners.cancelsOn', { date: formatDate(periodEnd) })}
                  >
                    {t('billing.v2.banners.cancelScheduledBody', {
                      date: formatDate(periodEnd),
                    })}
                  </Bv2Banner>
                </div>
              )}

              {(viewState === 'pending_inc' || viewState === 'pending_dec') && (
                <div className="mb-4">
                  <Bv2Banner
                    tone="info"
                    icon={<RefreshCcw className="h-4 w-4" />}
                    title={
                      viewState === 'pending_inc'
                        ? t('billing.v2.banners.addingSeatsTitle', {
                            count:
                              (subscriptionSummary?.scheduled?.scheduledSeats ?? 0) -
                              (subscriptionSummary?.paidSeats ?? 0),
                            date: formatDate(subscriptionSummary?.scheduled?.nextPeriodStart),
                          })
                        : t('billing.v2.banners.removingSeatsTitle', {
                            count:
                              (subscriptionSummary?.paidSeats ?? 0) -
                              (subscriptionSummary?.scheduled?.scheduledSeats ?? 0),
                            date: formatDate(subscriptionSummary?.scheduled?.nextPeriodStart),
                          })
                    }
                  >
                    {t('billing.v2.banners.pendingSeatsBody')}
                  </Bv2Banner>
                </div>
              )}

              {scheduledPlanChange && (
                <div className="mb-4">
                  <Bv2Banner
                    tone="info"
                    icon={<CalendarClock className="h-4 w-4" />}
                    title={t('billing.v2.banners.planChangeTitle', {
                      plan: scheduledPlanChange.planName,
                      date: formatDate(scheduledPlanChange.effectiveDate),
                    })}
                  >
                    {t('billing.v2.banners.planChangeBody')}
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        rounded="full"
                        variant="outline"
                        onClick={handleCancelPlanChange}
                        disabled={cancellingPlanChange}
                        className="gap-1.5"
                      >
                        {cancellingPlanChange ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-3.5 w-3.5" />
                        )}
                        {t('billing.v2.banners.keepCurrentPlanCta')}
                      </Button>
                    </div>
                  </Bv2Banner>
                </div>
              )}

              {viewState === 'canceled' && (
                <div className="mb-4">
                  <Bv2Banner
                    tone="neutral"
                    icon={<XCircle className="h-4 w-4" />}
                    title={t('billing.v2.banners.canceledTitle')}
                  >
                    {t('billing.v2.banners.canceledBody')}
                  </Bv2Banner>
                </div>
              )}

              {viewState === 'inactive' && (
                <div className="mb-4">
                  <Bv2Banner
                    tone="info"
                    icon={<Sparkles className="h-4 w-4" />}
                    title={t('billing.v2.banners.inactiveTitle')}
                  >
                    {t('billing.v2.banners.inactiveBody')}
                  </Bv2Banner>
                </div>
              )}

              {/* Cost breakdown — visible in all states */}
              {(
                <>
                  <div className="bv2-line-row">
                    <div className="bv2-lbl">
                      {t('billing.v2.subscription.planLine', { name: displayPlanName })}
                      {currentUser?.entitlements && (
                        <span className="bv2-sub">
                          {t('billing.v2.subscription.planLineSub', {
                            locations: isUnlimitedCap(displayMaxLocations)
                              ? t('billing.unlimited')
                              : displayMaxLocations,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="bv2-val">
                      {formatDecimalPrice(basePlanCost, billingCurrency)}
                      <small className="ml-0.5 text-[11.5px] font-normal text-foreground-2">
                        {t('billing.v2.subscription.perMonthShort')}
                      </small>
                    </div>
                  </div>

                  {viewState !== 'ltd' && (
                    <div className="bv2-line-row">
                      <div className="bv2-lbl">
                        {t('billing.teamSeats')}
                        <span className="bv2-sub">
                          {t('billing.v2.subscription.seatsLineSub', {
                            count: seatsForBreakdown,
                            unit: fmtBilling(seatPrice),
                            currency: currencySymbol,
                          })}
                        </span>
                      </div>
                      <div className="bv2-val">
                        {formatDecimalPrice(seatLineCost, billingCurrency)}
                        <small className="ml-0.5 text-[11.5px] font-normal text-foreground-2">
                          {t('billing.v2.subscription.perMonthShort')}
                        </small>
                      </div>
                    </div>
                  )}

                  {viewState === 'ltd' && (
                    <div className="bv2-line-row">
                      <div className="bv2-lbl">
                        {t('billing.teamSeats')}
                        <span className="bv2-sub">
                          {t('billing.v2.subscription.seatsLineSubLtd')}
                        </span>
                      </div>
                      <div className="bv2-val bv2-good">{t('billing.v2.subscription.free')}</div>
                    </div>
                  )}

                  <div className="bv2-line-total">
                    <div className="bv2-l">
                      {viewState === 'trial'
                        ? t('billing.v2.subscription.totalAfterTrial')
                        : viewState === 'ltd'
                          ? t('billing.v2.subscription.totalLtd')
                          : seatDelta !== 0
                            ? subscriptionSummary?.proratedSeatInfo?.nextChargeDate
                              ? t('billing.v2.subscription.totalStartingDate', {
                                  date: formatDate(
                                    subscriptionSummary.proratedSeatInfo.nextChargeDate,
                                  ),
                                })
                              : t('billing.v2.subscription.totalAfterUpdate')
                            : t('billing.total')}
                    </div>
                    <div className="bv2-r">
                      {formatDecimalPrice(totalCost, billingCurrency)}
                      {viewState !== 'ltd' && (
                        <small>{t('billing.v2.hero.perMonthSuffix')}</small>
                      )}
                    </div>
                  </div>

                  {viewState !== 'ltd' &&
                    subscriptionSummary?.proratedSeatInfo &&
                    (() => {
                      const info = subscriptionSummary.proratedSeatInfo;
                      const isOpen = seatDelta > 0;
                      const displayDelta = isOpen ? seatDelta : lastPositiveDelta.current;
                      const isZeroDay = info.daysRemaining === 0;
                      const isFullPeriod =
                        !isZeroDay && info.daysRemaining >= info.totalDaysInPeriod;
                      const monthlyAmount = fmtBilling(
                        displayDelta * info.fullMonthlyPricePerSeat,
                      );
                      const todayAmount = fmtBilling(
                        displayDelta * info.proratedPricePerSeat,
                      );
                      const showMath = !isFullPeriod && !isZeroDay;
                      return (
                        <div
                          className={cn(
                            'grid transition-[grid-template-rows] duration-200 ease-out',
                            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                          )}
                        >
                          <div className="overflow-hidden">
                            <div
                              role="status"
                              aria-live="polite"
                              aria-hidden={!isOpen}
                              className={cn(
                                'mt-3 mb-3 flex items-start gap-3.5 rounded-lg bg-surface-hover px-4 py-3 text-xs text-foreground-2',
                                'origin-top transition-[opacity,transform] duration-200 ease-out',
                                isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
                              )}
                            >
                              <Info
                                aria-hidden="true"
                                className="mt-0.5 h-4 w-4 flex-none text-info"
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="text-sm font-semibold leading-tight text-foreground-1">
                                  {isZeroDay
                                    ? t('billing.v2.subscription.addingSeatsZeroDayLine', {
                                        count: displayDelta,
                                      })
                                    : t('billing.v2.subscription.addingSeatsLine', {
                                        count: displayDelta,
                                      })}
                                </div>
                                <div className="leading-relaxed">
                                  {isZeroDay
                                    ? t('billing.v2.subscription.addingSeatsZeroDayExplainer', {
                                        monthlyAmount,
                                        currency: currencySymbol,
                                        date: formatDate(info.nextChargeDate),
                                      })
                                    : isFullPeriod
                                      ? t(
                                          'billing.v2.subscription.addingSeatsFullPeriodExplainer',
                                          {
                                            monthlyAmount,
                                            currency: currencySymbol,
                                            date: formatDate(info.nextChargeDate),
                                          },
                                        )
                                      : t('billing.v2.subscription.addingSeatsExplainer', {
                                          monthlyAmount,
                                          currency: currencySymbol,
                                          date: formatDate(info.nextChargeDate),
                                        })}
                                </div>
                                {showMath && (
                                  <div className="pt-0.5 font-mono text-[11px] tabular-nums text-foreground-3">
                                    {t('billing.v2.subscription.addingSeatsMath', {
                                      count: displayDelta,
                                      seatPrice: fmtBilling(info.fullMonthlyPricePerSeat),
                                      daysRemaining: info.daysRemaining,
                                      totalDays: info.totalDaysInPeriod,
                                      result: todayAmount,
                                      currency: currencySymbol,
                                    })}
                                  </div>
                                )}
                              </div>
                              {!isZeroDay && (
                                <div className="flex flex-none flex-col items-end leading-none">
                                  <span className="text-lg font-semibold tabular-nums text-foreground-1">
                                    {formatDecimalPrice(
                                      displayDelta * info.proratedPricePerSeat,
                                      billingCurrency,
                                    )}
                                  </span>
                                  <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-foreground-3">
                                    {t('billing.v2.subscription.todayLabel')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </>
              )}

              {/* Seat manager */}
              {!hideStepperEntirely && (
                <div className="bv2-seat-control">
                  <div className="bv2-seat-l">
                    <div className="bv2-seat-ttl">{t('billing.currentSeats')}</div>
                    <div className="bv2-seat-sub">
                      {t('billing.v2.subscription.seatsControlSub', {
                        used: subscriptionSummary?.usedSeats || 0,
                        unit: fmtBilling(seatPrice),
                        currency: currencySymbol,
                      })}
                    </div>
                  </div>
                  <div className="bv2-seat-r">
                    <div
                      className={`bv2-stepper${seatsLocked ? ' bv2-stepper-locked' : ''}`}
                      aria-disabled={seatsLocked || undefined}
                      title={seatsLocked ? t('billing.v2.banners.pendingSeatsBody') : undefined}
                    >
                      <button
                        type="button"
                        onClick={onStepDown}
                        disabled={seatsLocked || isConfirming}
                        aria-label="decrement seats"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <span className="bv2-stepper-v" aria-live="polite">
                        {totalSeats}
                      </span>
                      <button
                        type="button"
                        onClick={onStepUp}
                        disabled={seatsLocked || isConfirming}
                        aria-label="increment seats"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      rounded="full"
                      variant={viewState === 'past_due' ? 'destructive' : 'default'}
                      onClick={
                        viewState === 'pending_inc' || viewState === 'pending_dec'
                          ? handleCancelRemoval
                          : viewState === 'scheduled'
                            ? handleSubscriptionStatusChange
                            : viewState === 'past_due'
                              ? handleManagePaymentMethodAndInvoices
                              : handleUpgrade
                      }
                      disabled={
                        viewState === 'pending_inc' || viewState === 'pending_dec'
                          ? cancelRemovalLoading
                          : viewState === 'scheduled'
                            ? cancelLoading
                            : viewState === 'past_due'
                              ? portalLoading
                              : updatingSeats ||
                                checkoutLoading ||
                                seatsLocked ||
                                (viewState === 'active' && seatDelta === 0)
                      }
                      className="gap-1.5 bv2-btn-upgrade"
                    >
                      {(updatingSeats || checkoutLoading || cancelRemovalLoading || cancelLoading || (viewState === 'past_due' && portalLoading)) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (viewState === 'pending_inc' || viewState === 'pending_dec') ? (
                        <RefreshCcw className="h-3.5 w-3.5" />
                      ) : viewState === 'scheduled' ? (
                        <RefreshCcw className="h-3.5 w-3.5" />
                      ) : viewState === 'past_due' ? (
                        <ExternalLink className="h-3.5 w-3.5" />
                      ) : null}
                      {viewState === 'pending_inc' || viewState === 'pending_dec'
                        ? t('billing.v2.hero.revertChange')
                        : viewState === 'scheduled'
                          ? t('billing.keepSubscription')
                          : viewState === 'past_due'
                            ? t('billing.v2.hero.managePayment')
                            : viewState === 'ltd'
                              ? t('billing.upgrade')
                              : viewState === 'canceled'
                                ? t('billing.renewSubscription')
                                : viewState === 'active' && seatDelta > 0
                                  ? t('billing.addSeatsCount', { count: seatDelta })
                                  : viewState === 'active' && seatDelta < 0
                                    ? t('billing.removeSeatsCount', {
                                        count: Math.abs(seatDelta),
                                      })
                                    : viewState === 'trial' ||
                                        viewState === 'inactive' ||
                                        viewState === 'active'
                                      ? t('billing.updateSeats')
                                      : t('billing.applySeatChanges')}
                      {(viewState === 'ltd' ||
                        viewState === 'trial' ||
                        viewState === 'inactive' ||
                        viewState === 'active' ||
                        viewState === 'canceled') && (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Cancel link — active, past_due, or while a seat change is pending */}
              {(viewState === 'active' ||
                viewState === 'pending_inc' ||
                viewState === 'pending_dec' ||
                viewState === 'past_due') && (
                <div className="mt-4 text-right">
                  <button
                    type="button"
                    className="bv2-cancel-link"
                    onClick={handleSubscriptionStatusChange}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? t('billing.cancelling') : t('billing.cancelSubscription')}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {showPlanPicker && (
            <Bv2PlanPickerCard
              plans={plans}
              loading={plansLoading}
              isCheckoutState={isCheckoutState}
              selectedPlanId={selectedPlanId}
              // "The CTA's action is in flight": checkout-session creation in
              // checkout states (redux keeps it on through the Stripe
              // redirect), the change-plan call otherwise.
              changingPlan={isCheckoutState ? checkoutLoading : changingPlan}
              lockedReason={planChangeLockedReason}
              onSelect={(plan) => {
                if (isCheckoutState) {
                  // Same confirm-modal → Stripe flow as the hero's subscribe
                  // button, priced for the plan on the card.
                  void handleRenewSubscription(plan);
                } else {
                  void handleChangePlan(plan);
                }
              }}
              // Checkout is one quote across the page: the pill re-prices the
              // hero and the details card, not just this panel.
              onViewPlan={(plan) => setSelectedPlanId(plan.id)}
              viewState={viewState}
              user={currentUser ?? null}
              summary={subscriptionSummary ?? null}
              // Same seat basis the rest of the tab prices against: the stepper
              // while configuring a subscription, paid seats once there is one.
              seats={isCheckoutState ? Number(totalSeats) || 0 : subscriptionSummary?.paidSeats || 0}
            />
          )}

          <Bv2InvoiceDetailsCard />
        </div>

        {/* Right column */}
        <div className="bv2-col">
          <PlanUsageCard
            viewState={viewState}
            user={currentUser ?? null}
            summary={subscriptionSummary ?? null}
            smsCredits={smsBalance?.smsCredits ?? 0}
          />
          <Bv2SmsCard viewState={viewState} />
          <HistoryCard
            invoices={invoices}
            invoicesLoading={invoicesLoading}
            currency={subscriptionSummary?.currency || 'EUR'}
          />
        </div>
      </div>
    </div>
  );
};

// ────────── Plan picker (Standard vs Plus) ──────────

/** Whole plan morph: colour ramp, defocus, counting price. */
const PLAN_MORPH_MS = 240;
/** When the visible body swaps, hidden under the peak of the defocus blur. */
const PLAN_SWAP_MS = 70;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Bv2PlanPickerCard = ({
  plans,
  loading,
  isCheckoutState,
  selectedPlanId,
  changingPlan,
  lockedReason,
  onSelect,
  onViewPlan,
  viewState,
  user,
  summary,
  seats,
}: {
  plans: AvailablePlan[];
  loading: boolean;
  /** True when there's no active subscription — selection feeds checkout. */
  isCheckoutState: boolean;
  selectedPlanId: number | null;
  changingPlan: boolean;
  /** Non-null when switching plans is currently blocked (active subs only). */
  lockedReason: string | null;
  onSelect: (plan: AvailablePlan) => void;
  /** Fired when the switcher changes the viewed plan in checkout states, where
   *  the whole page quotes the prospective plan and must follow the pill. */
  onViewPlan?: (plan: AvailablePlan) => void;
  viewState: ViewState;
  user: AuthUser | null;
  summary: SubscriptionSummary | null;
  /** Seat basis for every price here. Mirrors the seat maths the rest of the
   *  tab uses, so the card can never disagree with the dialog it opens. */
  seats: number;
}) => {
  const { t } = useTranslation('settings');
  const { formatDecimalPrice } = useFormatPrice();

  // What the user has picked in the switch. Pure view state: picking a plan
  // here never starts a change, the footer CTA does that.
  const [pickedPlanId, setPickedPlanId] = useState<number | null>(null);
  // The body actually visible. Pinned to the outgoing plan on click, then
  // swapped PLAN_SWAP_MS later so the change lands under the defocus.
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [morph, setMorph] = useState<'idle' | 'out' | 'in'>('idle');

  const timers = useRef<number[]>([]);
  const raf = useRef<number | null>(null);
  const amountRef = useRef<HTMLSpanElement | null>(null);
  const lastTotal = useRef<number | null>(null);

  // The footer is the only part of the card whose height moves between plans —
  // the panel bodies share one grid cell, but the footer branches differ by a
  // helper line and a CTA. Measured rather than guessed, so the card can resize
  // instead of jumping. Callback ref: the node only exists once past `loading`.
  const [footH, setFootH] = useState<number | null>(null);
  const footRO = useRef<ResizeObserver | null>(null);
  const setFootNode = useCallback((node: HTMLDivElement | null) => {
    footRO.current?.disconnect();
    footRO.current = null;
    if (node == null || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      setFootH(box ? box.blockSize : entry.contentRect.height);
    });
    ro.observe(node);
    footRO.current = ro;
  }, []);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  };
  useEffect(() => clearTimers, []);

  // Derived, not stored: an explicit pick wins, otherwise checkout follows the
  // parent's selection, otherwise the plan the business is already on.
  const has = (id: number | null) => id != null && plans.some((p) => p.id === id);
  const viewPlanId: number | null = has(pickedPlanId)
    ? pickedPlanId
    : isCheckoutState && has(selectedPlanId)
      ? selectedPlanId
      : (plans.find((p) => p.isCurrentPlan) ??
          plans.find((p) => p.tier === 'STANDARD') ??
          plans[0])?.id ?? null;

  // Between morphs (or if a refetch dropped the pinned plan) the visible body
  // is simply the viewed one.
  const shownPlanId = has(activePlanId) ? activePlanId : viewPlanId;
  const shownPlan = plans.find((p) => p.id === shownPlanId) ?? null;
  const currentPlan = plans.find((p) => p.isCurrentPlan) ?? null;
  const billingCurrency =
    shownPlan?.pricing?.currency ?? summary?.currency ?? 'EUR';

  const totalFor = (plan: AvailablePlan | null) =>
    plan?.pricing ? plan.pricing.basePlanPrice + plan.pricing.pricePerTeamMember * seats : null;
  const shownTotal = totalFor(shownPlan);

  // The whole morph runs off the click (see the segment buttons below): pin
  // the outgoing body, defocus, swap at PLAN_SWAP_MS, resolve by PLAN_MORPH_MS.
  const switchTo = (planId: number) => {
    clearTimers();
    setPickedPlanId(planId);
    if (prefersReducedMotion() || shownPlanId == null) {
      setActivePlanId(planId);
      return;
    }
    setMorph('out');
    setActivePlanId(shownPlanId);
    timers.current.push(
      window.setTimeout(() => {
        setActivePlanId(planId);
        setMorph('in');
      }, PLAN_SWAP_MS),
    );
    timers.current.push(window.setTimeout(() => setMorph('idle'), PLAN_MORPH_MS));
  };

  // Count the headline price to its new amount across the rest of the morph.
  useEffect(() => {
    const from = lastTotal.current;
    lastTotal.current = shownTotal;
    const node = amountRef.current;
    if (node == null || from == null || shownTotal == null || from === shownTotal) return;
    if (prefersReducedMotion()) return;

    const duration = PLAN_MORPH_MS - PLAN_SWAP_MS;
    let start: number | null = null;
    const step = (now: number) => {
      if (start == null) start = now;
      const k = Math.min(1, (now - start) / duration);
      // ease-in-out cubic so the number lands together with the colour ramp
      const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      node.textContent = formatDecimalPrice(from + (shownTotal - from) * eased, billingCurrency);
      if (k < 1) raf.current = requestAnimationFrame(step);
      else raf.current = null;
    };
    raf.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlanId, shownTotal]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Bv2CardHeader title={t('billing.v2.plans.title')} />
          <Skeleton className="h-9 w-48 rounded-full" />
          <Skeleton className="mt-4 h-52 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) return null;

  const currentTierOrder = SELF_SERVE_TIER_ORDER[currentPlan?.tier ?? ''] ?? 0;
  const isCurrent = !isCheckoutState && !!shownPlan?.isCurrentPlan;
  const isUpgrade = (SELF_SERVE_TIER_ORDER[shownPlan?.tier ?? ''] ?? 0) > currentTierOrder;
  // Skin follows the *viewed* plan so the colour ramp starts on the click
  // frame; the body underneath swaps later, hidden by the defocus.
  const isPlus = plans.find((p) => p.id === viewPlanId)?.tier === 'PLUS';

  const periodEnd = user?.subscription?.currentPeriodEnd ?? null;
  const businessName = user?.business?.name ?? '';
  const scheduled = summary?.scheduledPlanChange ?? null;
  const scheduledToShown = !!scheduled && scheduled.planId === shownPlan?.id;
  const activeIndex = Math.max(0, plans.findIndex((p) => p.id === viewPlanId));
  const segWidth = `calc(${100 / plans.length}% - ${6 / plans.length}px)`;

  const statusLabel = (): { label: string; tone: string } => {
    switch (viewState) {
      case 'active':
        return { label: t('billing.status.active'), tone: 'bv2-t-good' };
      case 'trial':
        return { label: t('billing.status.trial'), tone: 'bv2-t-warn' };
      case 'past_due':
        return { label: t('billing.status.pastDue'), tone: 'bv2-t-danger' };
      case 'scheduled':
        return { label: t('billing.status.scheduledForCancellation'), tone: 'bv2-t-warn' };
      case 'pending_inc':
      case 'pending_dec':
        return { label: t('billing.v2.status.pendingChange'), tone: 'bv2-t-info' };
      case 'canceled':
        return { label: t('billing.status.canceled'), tone: 'bv2-t-muted' };
      default:
        return { label: t('billing.v2.status.noSubscription'), tone: 'bv2-t-muted' };
    }
  };

  const renderBody = (plan: AvailablePlan) => {
    const active = plan.id === shownPlanId;
    const planTotal = totalFor(plan);
    const planIsCurrent = !isCheckoutState && plan.isCurrentPlan;
    const planIsUpgrade = (SELF_SERVE_TIER_ORDER[plan.tier] ?? 0) > currentTierOrder;
    const planScheduled = !!scheduled && scheduled.planId === plan.id;

    const capLocations =
      isUnlimitedCap(plan.maxLocations) ? (
        t('billing.unlimited')
      ) : (
        <span className="bv2-plan-chip-num">{plan.maxLocations}</span>
      );
    const capTeam =
      isUnlimitedCap(plan.maxTeamMembers) ? (
        t('billing.unlimited')
      ) : (
        <span className="bv2-plan-chip-num">{plan.maxTeamMembers}</span>
      );

    let footState: { label: string; tone: string } | null = null;
    if (planIsCurrent) footState = statusLabel();
    else if (planScheduled)
      footState = {
        label: t('billing.v2.plans.effectiveFrom', { date: formatDate(scheduled?.effectiveDate) }),
        tone: 'bv2-t-info',
      };
    else if (!isCheckoutState && currentPlan)
      footState = {
        label: planIsUpgrade
          ? t('billing.v2.plans.effectiveNow')
          : t('billing.v2.plans.effectiveFrom', { date: formatDate(periodEnd) }),
        tone: 'bv2-t-muted',
      };

    return (
      <div key={plan.id} className="bv2-plan-body" data-active={active} aria-hidden={!active}>
        {plan.tier === 'PLUS' && (
          <div className="bv2-plan-top">
            <Crown className="bv2-plan-crown" />
            <span className="bv2-plan-badge">{t('billing.v2.plans.mostPopular')}</span>
          </div>
        )}

        <div className="bv2-plan-defocus">
          <div className="bv2-plan-eyebrow">
            {t('billing.v2.plans.planEyebrow', { plan: plan.name })}
          </div>

          <div className="bv2-plan-price-row">
            <div className="bv2-plan-price">
              {planTotal != null ? (
                <>
                  <span ref={active ? amountRef : undefined}>
                    {formatDecimalPrice(planTotal, plan.pricing?.currency ?? billingCurrency)}
                  </span>
                  <span className="bv2-plan-per">{t('billing.v2.hero.perMonthSuffix')}</span>
                  <span className="bv2-plan-vat">{t('billing.v2.plans.vatSuffix')}</span>
                </>
              ) : (
                '—'
              )}
            </div>
          </div>


          <div className="bv2-plan-chips">
            <span className="bv2-plan-chip">
              {t('billing.v2.usage.locations')} {capLocations}
            </span>
            <span className="bv2-plan-chip">
              {t('billing.v2.usage.teamSeats')} {capTeam}
            </span>
            {plan.features.websiteBuilder && (
              <span className="bv2-plan-chip">{t('billing.v2.plans.websiteBuilder')}</span>
            )}
          </div>
        </div>

        <div className="bv2-plan-panel-foot">
          <span className="bv2-plan-foot-left">
            {footState && (
              <>
                <span className={cn('bv2-plan-foot-state', footState.tone)}>
                  <span className="bv2-plan-dot" />
                  {footState.label}
                </span>
                {businessName && <span className="bv2-plan-foot-sep">|</span>}
              </>
            )}
            {businessName && <span className="bv2-plan-foot-biz">{businessName}</span>}
          </span>
          <span className="bv2-plan-foot-right">
            {planIsCurrent && periodEnd
              ? t('billing.v2.plans.renews', { date: formatDate(periodEnd) })
              : ''}
          </span>
        </div>
      </div>
    );
  };

  // ── Card footer: the state-dependent half ──

  /** Line items behind the total. Only when seats actually add to it — with
   *  no paid seats the plan price IS the total and the rows would restate it. */
  const totalLines = (plan: AvailablePlan | null) => {
    if (!plan?.pricing || seats <= 0) return null;
    const cur = plan.pricing.currency;
    return (
      <div className="bv2-plan-sum">
        <div className="bv2-plan-sum-row">
          <span>{t('billing.v2.plans.sumPlan', { plan: plan.name })}</span>
          <span>{formatDecimalPrice(plan.pricing.basePlanPrice, cur)}</span>
        </div>
        <div className="bv2-plan-sum-row">
          <span>
            {t('billing.v2.plans.sumSeats', {
              count: seats,
              price: formatDecimalPrice(plan.pricing.pricePerTeamMember, cur),
            })}
          </span>
          <span>{formatDecimalPrice(plan.pricing.pricePerTeamMember * seats, cur)}</span>
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    // Blocked by another billing change in flight.
    if (lockedReason && !isCheckoutState) {
      return (
        <div className="mt-4">
          <Bv2Banner
            tone={viewState === 'past_due' ? 'danger' : 'neutral'}
            icon={
              viewState === 'past_due' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )
            }
          >
            {lockedReason}
          </Bv2Banner>
        </div>
      );
    }

    if (!shownPlan) return null;

    // Checkout states: the CTA is the purchase action — confirm modal, then
    // Stripe. Always enabled: there is no live plan to be "selected" yet.
    if (isCheckoutState) {
      return (
        <div className="bv2-plan-foot" data-fading={morph === 'out'}>
          {totalLines(shownPlan)}
          <div className="bv2-plan-foot-copy">
            <div className="bv2-plan-foot-line">
              <Trans
                i18nKey="billing.v2.plans.totalOnSignup"
                t={t}
                values={{
                  amount:
                    shownTotal != null
                      ? `${formatDecimalPrice(shownTotal, billingCurrency)}${t('billing.v2.hero.perMonthSuffix')}`
                      : '—',
                }}
                components={{ bold: <strong /> }}
              />
            </div>
            <div className="bv2-plan-foot-help">{t('billing.v2.plans.chargedAtCheckout')}</div>
          </div>
          <Button
            type="button"
            rounded="full"
            loading={changingPlan}
            disabled={changingPlan}
            className="gap-1.5 bv2-btn-upgrade"
            onClick={() => onSelect(shownPlan)}
          >
            {t('billing.v2.plans.chooseCta', { plan: shownPlan.name })}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    // Viewing the plan you are already on: informational only.
    if (isCurrent) {
      return (
        <div className="bv2-plan-foot" data-fading={morph === 'out'}>
          {totalLines(shownPlan)}
          <div className="bv2-plan-foot-copy">
            <div className="bv2-plan-foot-line">
              {shownTotal != null && periodEnd && (
                <Trans
                  i18nKey="billing.v2.plans.nextInvoice"
                  t={t}
                  values={{
                    amount: formatDecimalPrice(shownTotal, billingCurrency),
                    date: formatDate(periodEnd),
                  }}
                  components={{ bold: <strong /> }}
                />
              )}
            </div>
          </div>
        </div>
      );
    }

    // Viewing the other plan. Upgrades apply immediately and are prorated
    // today; only downgrades wait for renewal, so the helper says which.
    return (
      <div className="bv2-plan-foot" data-fading={morph === 'out'}>
        {totalLines(shownPlan)}
        <div className="bv2-plan-foot-copy">
          <div className="bv2-plan-foot-line">
            <Trans
              i18nKey="billing.v2.plans.newInvoice"
              t={t}
              values={{
                amount:
                  shownTotal != null
                    ? `${formatDecimalPrice(shownTotal, billingCurrency)}${t('billing.v2.hero.perMonthSuffix')}`
                    : '—',
              }}
              components={{ bold: <strong /> }}
            />
          </div>
          <div className="bv2-plan-foot-help">
            {isUpgrade
              ? t('billing.v2.plans.applyImmediately', { date: formatDate(periodEnd) })
              : t('billing.v2.plans.applyAtRenewal', { date: formatDate(periodEnd) })}
          </div>
        </div>
        <Button
          type="button"
          rounded="full"
          loading={changingPlan}
          disabled={changingPlan || scheduledToShown}
          className="gap-1.5 bv2-btn-upgrade"
          onClick={() => onSelect(shownPlan)}
        >
          {isUpgrade
            ? t('billing.v2.plans.upgradeCta', { plan: shownPlan.name })
            : t('billing.v2.plans.downgradeCta', { plan: shownPlan.name })}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <Card className="bv2-plan-picker">
      <CardContent>
        <Bv2CardHeader
          title={t('billing.v2.plans.title')}
          subtitle={
            isCheckoutState
              ? t('billing.v2.plans.subtitleCheckout')
              : t('billing.v2.plans.subtitleActive')
          }
          action={
            <div className="bv2-plan-seg" role="group" aria-label={t('billing.v2.plans.title')}>
              <span
                className="bv2-plan-seg-thumb"
                style={{
                  left: 3,
                  width: segWidth,
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
              />
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  aria-pressed={plan.id === viewPlanId}
                  onClick={() => {
                    if (plan.id === viewPlanId) return;
                    switchTo(plan.id);
                    if (isCheckoutState) onViewPlan?.(plan);
                  }}
                >
                  {plan.tier === 'PLUS' && <Crown className="bv2-plan-seg-crown" />}
                  <span>{plan.name}</span>
                  {/* Marks the plan you are actually ON. Never the checkout
                      pick: in trial/inactive/canceled there is no live plan,
                      and reusing the dot there reads as "you're subscribed". */}
                  {!isCheckoutState && plan.isCurrentPlan && (
                    <span className="bv2-plan-seg-live" />
                  )}
                </button>
              ))}
            </div>
          }
        />

        <div className="bv2-plan-panel" data-skin={isPlus ? 'plus' : 'base'} data-morph={morph}>
          <span className="bv2-plan-skin" />
          <span className="bv2-plan-grain" />
          <div className="bv2-plan-stack">{plans.map(renderBody)}</div>
        </div>

        <div
          className="bv2-plan-footwrap"
          style={footH == null ? undefined : { height: footH }}
        >
          <div className="bv2-plan-foot-measure" ref={setFootNode}>
            {renderFooter()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ────────── Plan & Usage card ──────────

const PlanUsageCard = ({
  viewState,
  user,
  summary,
  smsCredits,
}: {
  viewState: ViewState;
  user: AuthUser | null;
  summary: SubscriptionSummary | null;
  smsCredits: number;
}) => {
  const { t } = useTranslation('settings');
  const isTrial = viewState === 'trial';
  const isInactive = viewState === 'inactive';

  const maxLocations = summary?.maxLocations ?? null;
  const usedLocations = summary?.numberOfLocations ?? 0;
  const seats = summary?.maxTeamMembers ?? null;
  const usedSeats = summary?.numberOfTeamMembers ?? 0;

  // Null checked inline so the compiler keeps its narrowing on the percentage
  // maths below; the helper owns the sentinel rule (-1, display-unlimited).
  const locationsUnlimited = maxLocations == null || isUnlimitedCap(maxLocations);
  const seatsUnlimited = seats == null || isUnlimitedCap(seats);

  const locPct =
    !locationsUnlimited && maxLocations > 0 ? (usedLocations / maxLocations) * 100 : 0;
  const seatPct = !seatsUnlimited && seats > 0 ? (usedSeats / seats) * 100 : 0;

  const locTone: 'ok' | 'warn' = locPct >= 80 ? 'warn' : 'ok';
  const seatTone: 'ok' | 'warn' = seatPct >= 80 ? 'warn' : 'ok';

  const smsCap = Math.max(smsCredits, 100);
  const smsRatio = smsCap > 0 ? smsCredits / smsCap : 0;
  const smsDots = Array.from({ length: 12 }, (_, i) => i / 12 < smsRatio);

  return (
    <Card>
      <CardContent>
        <Bv2CardHeader
          title={t('billing.v2.usage.title')}
          subtitle={t('billing.v2.usage.subtitle')}
        />
        <div className="bv2-usage-grid">
          {/* Locations */}
          <div className="bv2-usage-tile">
            <div className="bv2-usage-head">
              <div className="bv2-name">{t('billing.v2.usage.locations')}</div>
              {locationsUnlimited ? (
                <span className="bv2-usage-tag bv2-usage-tag-info">
                  {t('billing.unlimited')}
                </span>
              ) : (
                <span
                  className={`bv2-usage-tag ${
                    locTone === 'warn' ? 'bv2-usage-tag-warn' : 'bv2-usage-tag-ok'
                  }`}
                >
                  {locPct >= 100
                    ? t('billing.v2.usage.full')
                    : locPct >= 80
                      ? t('billing.v2.usage.nearLimit')
                      : `${Math.round(locPct)}%`}
                </span>
              )}
            </div>
            <div className="bv2-figure">
              <span className="bv2-num">{usedLocations}</span>
              <span className="bv2-denom">
                / {locationsUnlimited ? '∞' : maxLocations}
              </span>
            </div>
            {locationsUnlimited ? (
              <div style={{ height: 5 }} />
            ) : (
              <div className="bv2-bar-track">
                <div
                  className={`bv2-bar-fill ${
                    locTone === 'warn' ? 'bv2-tone-warn' : ''
                  }`}
                  style={{ width: `${Math.min(locPct, 100)}%` }}
                />
              </div>
            )}
            <div className="bv2-usage-meta">
              {locationsUnlimited
                ? t('billing.v2.usage.unlimited')
                : (maxLocations ?? 0) - usedLocations > 0
                  ? t('billing.v2.usage.locationsAvailable', {
                      count: (maxLocations ?? 0) - usedLocations,
                    })
                  : t('billing.v2.usage.full')}
            </div>
          </div>

          {/* Team seats */}
          <div className="bv2-usage-tile">
            <div className="bv2-usage-head">
              <div className="bv2-name">{t('billing.v2.usage.teamSeats')}</div>
              {isTrial || seatsUnlimited ? (
                <span className="bv2-usage-tag bv2-usage-tag-info">
                  {t('billing.v2.usage.unlimited')}
                </span>
              ) : (
                <span
                  className={`bv2-usage-tag ${
                    seatTone === 'warn' ? 'bv2-usage-tag-warn' : 'bv2-usage-tag-ok'
                  }`}
                >
                  {seatPct >= 100
                    ? t('billing.v2.usage.full')
                    : `${Math.round(seatPct)}%`}
                </span>
              )}
            </div>
            <div className="bv2-figure">
              {isTrial ? (
                <>
                  <span className="bv2-num">∞</span>
                  <span className="bv2-unit">{t('billing.v2.usage.trial')}</span>
                </>
              ) : (
                <>
                  <span className="bv2-num">{usedSeats}</span>
                  <span className="bv2-denom">/ {seatsUnlimited ? '∞' : seats}</span>
                </>
              )}
            </div>
            {isTrial || seatsUnlimited ? (
              <div style={{ height: 5 }} />
            ) : (
              <div className="bv2-bar-track">
                <div
                  className={`bv2-bar-fill ${
                    seatTone === 'warn' ? 'bv2-tone-warn' : ''
                  }`}
                  style={{ width: `${Math.min(seatPct, 100)}%` }}
                />
              </div>
            )}
            <div className="bv2-usage-meta">
              {isTrial ? (
                <>&nbsp;</>
              ) : seatsUnlimited ? (
                t('billing.v2.usage.unlimited')
              ) : (seats ?? 0) - usedSeats > 0 ? (
                t('billing.v2.usage.seatsUnfilled', {
                  count: (seats ?? 0) - usedSeats,
                })
              ) : (
                t('billing.v2.usage.seatsAllInvited')
              )}
            </div>
          </div>

          {/* SMS */}
          <div className="bv2-usage-tile bv2-span-2">
            <div className="bv2-usage-head">
              <div className="bv2-name">{t('billing.v2.usage.smsCredits')}</div>
              {isTrial ? (
                <span className="bv2-usage-tag bv2-usage-tag-info">
                  {t('billing.v2.usage.smsLockedTrial')}
                </span>
              ) : smsCredits === 0 ? (
                <span className="bv2-usage-tag bv2-usage-tag-warn">
                  {t('billing.v2.usage.empty')}
                </span>
              ) : (
                <span className="bv2-usage-tag bv2-usage-tag-ok">
                  {t('billing.v2.usage.healthy')}
                </span>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div className="bv2-figure" style={{ marginBottom: 0, marginTop: 0 }}>
                <span className="bv2-num">{smsCredits}</span>
                <span className="bv2-unit">{t('billing.v2.usage.creditsUnit')}</span>
              </div>
              <div className="bv2-dotrow">
                {smsDots.map((on, i) => (
                  <span key={i} className={on ? 'bv2-on' : ''} />
                ))}
              </div>
            </div>
            <div className="bv2-usage-meta">
              {t('billing.v2.usage.smsSubtitle')}
            </div>
          </div>
        </div>

        {!isInactive && (
          <div className="bv2-usage-foot">
            <span>
              {viewState === 'active' || viewState === 'scheduled' || viewState === 'pending_inc' || viewState === 'pending_dec' ? (
                <>
                  {t('billing.v2.usage.cycleResets')}{' '}
                  <strong>{formatDate(user?.subscription?.currentPeriodEnd)}</strong>
                </>
              ) : (
                <span>&nbsp;</span>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ────────── History card ──────────

const HistoryCard = ({
  invoices,
  invoicesLoading,
  currency,
}: {
  invoices: BusinessInvoice[];
  invoicesLoading: boolean;
  currency: string;
}) => {
  const { t } = useTranslation('settings');
  const isMobile = useIsMobile();
  const [seeMoreOpen, setSeeMoreOpen] = useState(false);
  const { formatPrice } = useFormatPrice();

  const summary = useMemo(() => {
    // "Total paid" counts only successful invoices, and only those in the
    // display currency — a failed renewal or a regional-pricing currency
    // switch must not inflate the number.
    const total = invoices
      .filter((inv) => inv.status !== 'failed')
      .filter((inv) => !inv.currency || inv.currency.toUpperCase() === currency.toUpperCase())
      .reduce((acc, inv) => acc + (inv.amountMinor || 0), 0);
    const last = invoices[0]?.createdAt;
    const yearNow = new Date().getFullYear();
    const ytdCount = invoices.filter(
      (i) => new Date(i.createdAt).getFullYear() === yearNow,
    ).length;
    return {
      total,
      count: invoices.length,
      ytdCount,
      last,
    };
  }, [invoices, currency]);

  const labelFor = (invoice: BusinessInvoice) => {
    if (invoice.invoiceType === 'sms_purchase') return t('billing.v2.history.types.smsPurchase');
    if (invoice.invoiceType === 'ltd_seats') return t('billing.v2.history.types.ltdSeats');
    const month = new Date(invoice.createdAt).toLocaleDateString(undefined, {
      month: 'long',
    });
    return `${t('billing.v2.history.types.subscription')} · ${month}`;
  };

  const iconFor = (invoice: BusinessInvoice) => {
    if (invoice.invoiceType === 'sms_purchase') return <MessageSquare className="h-3.5 w-3.5" />;
    if (invoice.invoiceType === 'ltd_seats') return <Receipt className="h-3.5 w-3.5" />;
    return <RefreshCcw className="h-3.5 w-3.5" />;
  };

  if (invoicesLoading) {
    return (
      <Card>
        <CardContent>
          <Bv2CardHeader title={t('billing.v2.history.title')} />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderInvoiceRow = (inv: BusinessInvoice) => (
    <div key={inv.id} className="bv2-hist-row">
      <div className="bv2-hist-icon">{iconFor(inv)}</div>
      <div className="bv2-hist-mid">
        <div className="bv2-l1">{labelFor(inv)}</div>
        <div className="bv2-l2">
          <span>{formatDate(inv.createdAt)}</span>
          {inv.status === 'failed' ? (
            <span
              className="bv2-pill bv2-pill-warn bv2-pill-paid"
              title={t('billing.v2.history.statusFailedHint')}
            >
              <span className="bv2-dot" />
              {t('billing.v2.history.statusFailed')}
            </span>
          ) : (
            <span className="bv2-pill bv2-pill-good bv2-pill-paid">
              <span className="bv2-dot" />
              {t('billing.v2.history.statusPaid')}
            </span>
          )}
        </div>
      </div>
      <div className="bv2-hist-amt">
        {formatPrice(inv.amountMinor, inv.currency || currency)}
      </div>
      <div className="flex items-center gap-1">
        {inv.oblioLink && (
          <a
            href={inv.oblioLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('billing.v2.history.download')}
            className="bv2-hist-dl"
          >
            <Download className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );

  const visibleInvoices = invoices.slice(0, 3);
  const hasMore = invoices.length > visibleInvoices.length;

  const allInvoicesContent = (
    <div className="bv2-hist-all">
      {invoices.map((inv) => renderInvoiceRow(inv))}
    </div>
  );

  return (
    <Card>
      <CardContent>
        <Bv2CardHeader title={t('billing.v2.history.title')} />
        {invoices.length === 0 ? (
          <div className="bv2-empty">
            <div className="bv2-empty-icon">
              <Receipt className="h-5 w-5" />
            </div>
            <h4>{t('billing.v2.history.empty.title')}</h4>
            <p>{t('billing.v2.history.empty.body')}</p>
          </div>
        ) : (
          <>
            <div className="bv2-hist-summary">
              <div>
                <div className="bv2-hs-lbl">{t('billing.v2.history.summary.totalPaid')}</div>
                <div className="bv2-hs-val">{formatPrice(summary.total, currency)}</div>
              </div>
              <div>
                <div className="bv2-hs-lbl">{t('billing.v2.history.summary.invoices')}</div>
                <div className="bv2-hs-val">
                  {summary.ytdCount}
                  {summary.ytdCount > 0 && (
                    <small> {t('billing.v2.history.thisYear')}</small>
                  )}
                </div>
              </div>
              <div>
                <div className="bv2-hs-lbl">{t('billing.v2.history.summary.lastPayment')}</div>
                <div className="bv2-hs-val" style={{ fontSize: 14 }}>
                  {formatDate(summary.last)}
                </div>
              </div>
            </div>
            <div>{visibleInvoices.map((inv) => renderInvoiceRow(inv))}</div>
            {hasMore && (
              <div className="bv2-hist-more">
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  size="sm"
                  onClick={() => setSeeMoreOpen(true)}
                  className="bv2-btn-compact"
                >
                  {t('billing.v2.history.seeMore')}
                </Button>
              </div>
            )}

            {isMobile ? (
              <Drawer open={seeMoreOpen} onOpenChange={setSeeMoreOpen}>
                <DrawerContent className="outline-none !z-[80] !bg-white dark:!bg-surface">
                  <DrawerHeader className="text-left">
                    <DrawerTitle>{t('billing.v2.history.allInvoices')}</DrawerTitle>
                    <DrawerDescription>
                      {t('billing.v2.history.allInvoicesDescription')}
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto">
                    {allInvoicesContent}
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Dialog open={seeMoreOpen} onOpenChange={setSeeMoreOpen}>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{t('billing.v2.history.allInvoices')}</DialogTitle>
                    <DialogDescription>
                      {t('billing.v2.history.allInvoicesDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto pr-1">
                    {allInvoicesContent}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ────────── SMS pack picker card (replaces the legacy SmsCredits chrome) ──────────

const getBestPackId = (packages: SmsPackage[]): number | null => {
  if (!packages.length) return null;
  let best = packages[0];
  let bestRatio = best.smsCount / best.priceMinor;
  for (const p of packages) {
    const ratio = p.smsCount / p.priceMinor;
    if (ratio > bestRatio) {
      best = p;
      bestRatio = ratio;
    }
  }
  return best.id;
};

const Bv2SmsCard = ({ viewState }: { viewState: ViewState }) => {
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  const { ensureConfigured } = useBillingDetailsContext();
  const { formatPrice } = useFormatPrice();
  const balance = useSelector(selectSmsBalance);
  const packages = useSelector(selectSmsPackages);
  const balanceLoading = useSelector(selectIsSmsBalanceLoading);
  const packagesLoading = useSelector(selectIsSmsPackagesLoading);
  const checkoutLoading = useSelector(selectIsSmsCheckoutLoading);

  const isTrial = viewState === 'trial';
  const isInactive = viewState === 'inactive';
  const isCanceled = viewState === 'canceled';

  const bestId = useMemo(() => getBestPackId(packages), [packages]);
  const baselinePerSms =
    packages.length > 0
      ? Math.min(...packages.map((p) => p.priceMinor / p.smsCount))
      : 0;
  const cheapestPerSms =
    packages.length > 0
      ? Math.max(...packages.map((p) => p.priceMinor / p.smsCount))
      : 0;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && packages.length > 0 && bestId != null) {
      initialized.current = true;
      setSelectedId(bestId);
    }
  }, [packages.length, bestId]);

  const selected = packages.find((p) => p.id === selectedId) ?? null;

  const handleBuy = () => {
    if (!selected || checkoutLoading || isCanceled) return;
    if (!ensureConfigured()) return;
    dispatch(
      createSmsCheckoutAction.request({
        packageId: selected.id,
        successUrl: `${window.location.origin}/info?type=sms-purchase-success`,
        cancelUrl: `${window.location.origin}/account?tab=billing`,
      }),
    );
  };

  if (balanceLoading || packagesLoading) {
    return (
      <Card id="sms-credits" className="scroll-mt-24">
        <CardContent>
          <Bv2CardHeader title={t('billing.v2.sms.title')} />
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="sms-credits" className="scroll-mt-24">
      <CardContent>
        <Bv2CardHeader
          title={t('billing.v2.sms.title')}
          subtitle={t('billing.v2.sms.subtitle')}
        />

        {isTrial ? (
          <Bv2Banner
            tone="warn"
            icon={<Lock className="h-4 w-4" />}
            title={t('billing.v2.sms.lockedTitle')}
          >
            {t('billing.v2.sms.lockedBody')}
          </Bv2Banner>
        ) : isInactive ? (
          <div className="bv2-empty">
            <div className="bv2-empty-icon">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h4>{t('billing.v2.sms.inactiveTitle')}</h4>
            <p>{t('billing.v2.sms.inactiveBody')}</p>
          </div>
        ) : (
          <>
            <div className="bv2-sms-balance">
              <div className="bv2-bal-l">
                <div className="bv2-bal-lbl">{t('billing.v2.sms.available')}</div>
                <div className="bv2-bal-val">
                  {balance?.smsCredits ?? 0}
                  <small>SMS</small>
                </div>
              </div>
              <div className="bv2-bal-r">
                {balance && balance.smsTotalUsed > 0 ? (
                  <>
                    <strong>{balance.smsTotalUsed}</strong>
                    {' '}
                    {t('billing.v2.sms.usedOf', { total: balance.smsTotalPurchased })}
                    <br />
                    {t('billing.v2.sms.creditsNeverExpire')}
                  </>
                ) : (
                  t('billing.v2.sms.creditsNeverExpire')
                )}
              </div>
            </div>

            {packages.length > 0 ? (
              <>
                <div className="bv2-sms-section-label">
                  {t('billing.v2.sms.topUp')}
                </div>
                <div className="bv2-sms-packs">
                  {packages.map((pkg) => {
                    const perSms = pkg.priceMinor / pkg.smsCount;
                    const savingsMinor =
                      cheapestPerSms > perSms
                        ? Math.round((cheapestPerSms - perSms) * pkg.smsCount)
                        : 0;
                    const isBest = pkg.id === bestId && packages.length > 1;
                    const isSelected = selectedId === pkg.id;
                    const showBaselineSavings =
                      baselinePerSms < perSms && perSms !== baselinePerSms;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        className={`bv2-sms-pack ${isSelected ? 'bv2-selected' : ''}`}
                        onClick={() => setSelectedId(pkg.id)}
                        disabled={checkoutLoading}
                      >
                        <span className="bv2-radio" />
                        <div className="bv2-pack-l">
                          <div className="bv2-pack-count">
                            {pkg.smsCount}
                            <small>SMS</small>
                            {isBest && (
                              <span className="bv2-pack-badge">
                                {t('billing.v2.sms.bestValue')}
                              </span>
                            )}
                          </div>
                          {savingsMinor > 0 && !showBaselineSavings && (
                            <div className="bv2-pack-savings">
                              <span className="bv2-save">
                                {t('billing.v2.sms.savingsLabel', {
                                  amount: formatPrice(savingsMinor, pkg.currency),
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="bv2-pack-rate">
                          <strong>{formatPrice(Math.round(perSms), pkg.currency)}</strong>
                          {t('billing.v2.sms.perSms')}
                        </div>
                        <div className="bv2-pack-price">
                          {formatPrice(pkg.priceMinor, pkg.currency)}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="bv2-sms-buy-row">
                  <div className="bv2-info">
                    <Info className="h-3 w-3" />
                    {t('billing.v2.sms.oneTimeNote')}
                  </div>
                  <Button
                    rounded="full"
                    onClick={handleBuy}
                    disabled={!selected || checkoutLoading || isCanceled}
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    {selected
                      ? t('billing.v2.sms.buyButton', {
                          count: selected.smsCount,
                          amount: formatPrice(selected.priceMinor, selected.currency),
                        })
                      : t('billing.v2.sms.selectPack')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="bv2-empty">
                <div className="bv2-empty-icon">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h4>{t('billing.v2.sms.noPacksTitle')}</h4>
                <p>{t('billing.v2.sms.noPacksBody')}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ────────── Invoice details card (replaces InvoiceBillingDetails) ──────────

const suggestLegalName = (
  type: BillingEntityType,
  suggestions: BillingDetailsSuggestions,
): string => {
  if (type === 'company') return suggestions.businessName?.trim() ?? '';
  const parts = [suggestions.firstName?.trim(), suggestions.lastName?.trim()].filter(
    Boolean,
  );
  return parts.join(' ');
};

interface InvoiceFormState {
  billingEntityType: BillingEntityType;
  legalName: string;
  fiscalCode: string;
  registrationNumber: string;
  billingAddress: string;
  billingCity: string;
  billingCounty: string;
  billingCountryCode: string;
}

const buildInitialInvoiceState = (details: BillingDetails): InvoiceFormState => {
  const type: BillingEntityType =
    (details.billingEntityType as BillingEntityType) ?? 'company';
  return {
    billingEntityType: type,
    legalName: details.legalName ?? suggestLegalName(type, details.suggestions),
    fiscalCode: details.fiscalCode ?? '',
    registrationNumber: details.registrationNumber ?? '',
    billingAddress: details.billingAddress ?? '',
    billingCity: details.billingCity ?? '',
    billingCounty: details.billingCounty ?? '',
    billingCountryCode: (
      details.billingCountryCode ??
      details.suggestions.countryCode ??
      ''
    ).toUpperCase(),
  };
};

const Bv2InvoiceDetailsCard = () => {
  const { t } = useTranslation('settings');
  const { details, isLoading, loadError, reload } = useBillingDetailsContext();
  const [form, setForm] = useState<InvoiceFormState | null>(null);
  const [snapshot, setSnapshot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!details) return;
    const initial = buildInitialInvoiceState(details);
    setForm(initial);
    setSnapshot(JSON.stringify(initial));
  }, [details]);

  const isDirty = useMemo(
    () => (form ? JSON.stringify(form) !== snapshot : false),
    [form, snapshot],
  );
  const isCompany = form?.billingEntityType === 'company';
  const isConfigured = !!details?.billingEntityType;
  const isCountryLocked = !!details?.suggestions.countryCode;
  const isRoCountry = (form?.billingCountryCode || '').toUpperCase() === 'RO';

  const isValid = useMemo(() => {
    if (!form) return false;
    const required = [
      form.legalName,
      form.billingAddress,
      form.billingCity,
      form.billingCounty,
      form.billingCountryCode,
    ];
    if (form.billingEntityType === 'company') required.push(form.fiscalCode);
    return required.every((v) => v.trim().length > 0);
  }, [form]);

  const setField = <K extends keyof InvoiceFormState>(
    key: K,
    value: InvoiceFormState[K],
  ) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleTypeChange = (next: BillingEntityType) => {
    if (!details) return;
    setForm((prev) => {
      if (!prev) return prev;
      const prevSuggestion = suggestLegalName(prev.billingEntityType, details.suggestions);
      const nextSuggestion = suggestLegalName(next, details.suggestions);
      const legalName =
        prev.legalName === '' || prev.legalName === prevSuggestion
          ? nextSuggestion
          : prev.legalName;
      return {
        ...prev,
        billingEntityType: next,
        legalName,
        ...(next === 'person' ? { fiscalCode: '', registrationNumber: '' } : {}),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !isDirty || !isValid || isSubmitting) return;
    const payload: UpdateBillingDetailsDTO = {
      billingEntityType: form.billingEntityType,
      legalName: form.legalName.trim(),
      billingAddress: form.billingAddress.trim(),
      billingCity: form.billingCity.trim(),
      billingCounty: form.billingCounty.trim(),
      billingCountryCode: form.billingCountryCode.trim().toLowerCase(),
    };
    if (form.billingEntityType === 'company') {
      payload.fiscalCode = form.fiscalCode.trim();
      payload.registrationNumber = form.registrationNumber.trim() || undefined;
    }
    setIsSubmitting(true);
    try {
      await updateBillingDetailsApi(payload);
      toast.success(t('billing.invoiceDetails.toastSuccess'));
      await reload();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('billing.invoiceDetails.toastFailure')));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Failed initial load: without details the form never initializes, so the
  // skeleton below would otherwise sit there forever with no way to recover.
  if (!isLoading && loadError && !details) {
    return (
      <Card id={INVOICE_BILLING_DETAILS_SECTION_ID} className="scroll-mt-24">
        <CardContent>
          <Bv2CardHeader title={t('billing.invoiceDetails.title')} />
          <ErrorState
            variant="section"
            body={loadError}
            onRetry={() => void reload()}
          />
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !form) {
    return (
      <Card id={INVOICE_BILLING_DETAILS_SECTION_ID} className="scroll-mt-24">
        <CardContent>
          <Bv2CardHeader title={t('billing.invoiceDetails.title')} />
          <div className="space-y-3">
            <Skeleton className="h-9 w-44" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id={INVOICE_BILLING_DETAILS_SECTION_ID} className="scroll-mt-24">
      <CardContent>
        <Bv2CardHeader
          title={t('billing.invoiceDetails.title')}
          subtitle={t('billing.invoiceDetails.description')}
          action={
            isConfigured ? (
              <span className="bv2-pill bv2-pill-good bv2-pill-verified">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t('billing.v2.invoice.verified')}
              </span>
            ) : null
          }
        />

        {!isConfigured && (
          <div className="mb-4">
            <Bv2Banner tone="info" icon={<Info className="h-4 w-4" />}>
              {t('billing.invoiceDetails.unconfiguredHint')}
            </Bv2Banner>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bv2-form">
          {/* Entity type segmented */}
          <div className="bv2-field">
            <span className="bv2-field-label">
              {t('billing.invoiceDetails.entityTypeLabel')}
            </span>
            <div className="relative flex min-w-[220px] self-start rounded-full border border-border bg-surface-hover p-0.5">
              <div
                aria-hidden="true"
                className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full bg-surface shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  transform:
                    form.billingEntityType === 'person'
                      ? 'translateX(100%)'
                      : 'translateX(0)',
                }}
              />
              {(['company', 'person'] as const).map((opt) => {
                const active = form.billingEntityType === opt;
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => handleTypeChange(opt)}
                    className={cn(
                      'bv2-seg-btn relative z-10 w-1/2 cursor-pointer rounded-full px-4 py-1 text-center text-[12.5px] font-medium transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                      active
                        ? 'text-foreground-1'
                        : 'text-foreground-2 hover:text-foreground-1',
                    )}
                  >
                    {opt === 'company'
                      ? t('billing.invoiceDetails.company')
                      : t('billing.invoiceDetails.person')}
                  </button>
                );
              })}
            </div>
            <p className="bv2-field-hint">
              {isCompany
                ? t('billing.invoiceDetails.companyHint')
                : t('billing.invoiceDetails.personHint')}
            </p>
          </div>

          <div className="bv2-card-content-enter" key={isCompany ? 'company' : 'person'}>
          {isCompany ? (
            <>
              <div className="bv2-form-row">
                <div className="bv2-field">
                  <label className="bv2-field-label" htmlFor="bv2-cui">
                    {t('billing.invoiceDetails.fiscalCode')}
                    {isRoCountry && <span className="bv2-flag-ro" aria-label="RO" />}
                  </label>
                  <input
                    id="bv2-cui"
                    className="bv2-field-input"
                    placeholder={t('billing.invoiceDetails.fiscalCodePlaceholder')}
                    value={form.fiscalCode}
                    onChange={(e) => setField('fiscalCode', e.target.value)}
                    maxLength={20}
                    required
                  />
                </div>
                <div className="bv2-field">
                  <label className="bv2-field-label" htmlFor="bv2-reg">
                    {t('billing.invoiceDetails.registrationNumber')}
                  </label>
                  <input
                    id="bv2-reg"
                    className="bv2-field-input"
                    placeholder={t('billing.invoiceDetails.registrationNumberPlaceholder')}
                    value={form.registrationNumber}
                    onChange={(e) => setField('registrationNumber', e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="bv2-form-row bv2-cols-1">
                <div className="bv2-field">
                  <label className="bv2-field-label" htmlFor="bv2-legal">
                    {t('billing.invoiceDetails.legalNameCompany')}
                  </label>
                  <input
                    id="bv2-legal"
                    className="bv2-field-input"
                    placeholder={t('billing.invoiceDetails.legalNameCompanyPlaceholder')}
                    value={form.legalName}
                    onChange={(e) => setField('legalName', e.target.value)}
                    maxLength={255}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bv2-form-row bv2-cols-1">
              <div className="bv2-field">
                <label className="bv2-field-label" htmlFor="bv2-fullname">
                  {t('billing.invoiceDetails.legalNamePerson')}
                </label>
                <input
                  id="bv2-fullname"
                  className="bv2-field-input"
                  placeholder={t('billing.invoiceDetails.legalNamePersonPlaceholder')}
                  value={form.legalName}
                  onChange={(e) => setField('legalName', e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
            </div>
          )}

          <div className="bv2-form-row bv2-cols-1">
            <div className="bv2-field">
              <label className="bv2-field-label" htmlFor="bv2-addr">
                {t('billing.invoiceDetails.address')}
              </label>
              <input
                id="bv2-addr"
                className="bv2-field-input"
                placeholder={t(
                  isRoCountry
                    ? 'billing.invoiceDetails.addressPlaceholderRo'
                    : 'billing.invoiceDetails.addressPlaceholder',
                )}
                value={form.billingAddress}
                onChange={(e) => setField('billingAddress', e.target.value)}
                maxLength={512}
                required
              />
            </div>
          </div>

          <div className="bv2-form-row">
            <div className="bv2-field">
              <label className="bv2-field-label" htmlFor="bv2-city">
                {t('billing.invoiceDetails.city')}
              </label>
              <input
                id="bv2-city"
                className="bv2-field-input"
                placeholder={t('billing.invoiceDetails.cityPlaceholder')}
                value={form.billingCity}
                onChange={(e) => setField('billingCity', e.target.value)}
                maxLength={128}
                required
              />
            </div>
            <div className="bv2-field">
              <label className="bv2-field-label" htmlFor="bv2-county">
                {t('billing.invoiceDetails.county')}
              </label>
              <input
                id="bv2-county"
                className="bv2-field-input"
                placeholder={t('billing.invoiceDetails.countyPlaceholder')}
                value={form.billingCounty}
                onChange={(e) => setField('billingCounty', e.target.value)}
                maxLength={128}
                required
              />
            </div>
          </div>

          <div className="bv2-form-row">
            <div className="bv2-field">
              <label className="bv2-field-label" htmlFor="bv2-country">
                {t('billing.invoiceDetails.countryCode')}
              </label>
              <input
                id="bv2-country"
                className="bv2-field-input"
                placeholder={t('billing.invoiceDetails.countryCodePlaceholder')}
                value={form.billingCountryCode}
                onChange={(e) =>
                  setField('billingCountryCode', e.target.value.toUpperCase().slice(0, 2))
                }
                maxLength={2}
                disabled={isCountryLocked}
                required
              />
            </div>
            <div />
          </div>

          <div className="bv2-form-foot">
            <Button
              type="submit"
              rounded="full"
              disabled={!isDirty || !isValid || isSubmitting}
              className="bv2-btn-compact"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              {t('billing.invoiceDetails.saveButton')}
            </Button>
          </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const BillingAndSubscriptionV2 = () => (
  <BillingDetailsProvider>
    <BillingAndSubscriptionV2Inner />
  </BillingDetailsProvider>
);

export default BillingAndSubscriptionV2;
