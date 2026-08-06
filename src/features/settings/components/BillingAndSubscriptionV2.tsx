import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
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
import DatePicker from '../../../shared/components/ui/date-picker';
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
  IndividualType,
  UpdateBillingDetailsDTO,
} from '../../business/types';
import { getCurrencySymbol } from '../../../shared/utils/currency';
import { useFormatPrice, resolveIntlLocale } from '../../../shared/hooks/useFormatPrice';
import i18n from '../../../shared/lib/i18n';
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

// The *app* language, not the browser's — a Romanian user on an English
// browser must not see 'Jul 3, 2026' between localized strings. Read at call
// time: every caller sits inside a component using `useTranslation`, so a
// language switch re-renders and re-derives the locale.
const billingLocale = () => resolveIntlLocale(i18n.resolvedLanguage || i18n.language);

// Stripe renders its own copy ('Your card was declined.') in the locale it was
// initialized with, so hand it the app language instead of letting it sniff the
// browser's.
const stripeLocale = (): 'ro' | 'en' =>
  (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('ro') ? 'ro' : 'en';

/**
 * getErrorMessage() forwards an Error's own message straight to the toast, so a
 * thrown diagnostic ('Failed to load Stripe') would surface untranslated. Log
 * the diagnostic and throw an empty Error instead — each catch already passes a
 * localized fallback, which getErrorMessage uses when the message is blank.
 */
// Declared as a function (not an arrow const) so TypeScript treats it as a
// never-returning call and narrows the checked value at each call site.
function failWithLocalizedFallback(diagnostic: string, detail?: unknown): never {
  console.error(`[billing] ${diagnostic}`, detail ?? '');
  throw new Error();
}

const formatDate = (input: string | null | undefined): string => {
  if (!input) return '—';
  return new Date(input).toLocaleDateString(billingLocale(), {
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

  const handleRenewSubscription = async () => {
    if (!ensureConfigured()) return;
    if (selectedPlanId == null) {
      toast.error(t('billing.v2.plans.noPlanSelected'));
      return;
    }
    const base = checkoutPlanPricing?.basePlanPrice ?? (subscriptionSummary?.basePlanPrice || 0);
    const perSeat =
      checkoutPlanPricing?.pricePerTeamMember ?? (subscriptionSummary?.pricePerTeamMember || 0);
    const estimated = base + perSeat * (Number(totalSeats) || 0);
    const confirmed = await confirm({
      eyebrow: t('billing.confirm.startSubscriptionEyebrow'),
      title: t('billing.confirm.startSubscription'),
      content:
        totalSeats > 0
          ? t('billing.confirm.proceedWithSeats', {
              count: totalSeats,
              amount: fmtBilling(estimated),
              currency: currencySymbol,
            })
          : t('billing.confirm.proceedSubscribe', {
              amount: fmtBilling(estimated),
              currency: currencySymbol,
            }),
      confirmationText: t('billing.confirm.continue'),
      cancellationText: t('billing.confirm.cancel'),
    });
    if (!confirmed) return;
    // Button state is driven by checkoutLoading (redux): the saga keeps it on
    // through the Stripe redirect and resets it with a toast on failure — no
    // local flag to get stuck.
    dispatch(
      createCheckoutSessionAction.request({
        planId: selectedPlanId,
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
    const confirmed = await confirm({
      eyebrow: isScheduled
        ? t('billing.confirm.scheduledChangeEyebrow')
        : t('billing.confirm.manageSubscriptionEyebrow'),
      title: isScheduled
        ? t('billing.confirm.keepSubscription')
        : t('billing.confirm.cancelSubscription'),
      content: isScheduled
        ? t('billing.confirm.keepSubscriptionContent')
        : isPastDue
          ? t('billing.confirm.cancelSubscriptionPastDueContent')
          : t('billing.confirm.cancelSubscriptionContent'),
      confirmationText: isScheduled
        ? t('billing.confirm.keepSubscription')
        : t('billing.confirm.cancelSubscription'),
      cancellationText: isScheduled
        ? t('billing.confirm.keepCancellation')
        : t('billing.confirm.keepSubscription'),
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
          failWithLocalizedFallback('LTD seats checkout returned no URL', response);
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
      const base = checkoutPlanPricing?.basePlanPrice ?? (subscriptionSummary?.basePlanPrice || 0);
      const perSeat =
        checkoutPlanPricing?.pricePerTeamMember ?? (subscriptionSummary?.pricePerTeamMember || 0);
      const estimated = base + perSeat * (Number(totalSeats) || 0);
      const confirmed = await confirm({
        eyebrow: t('billing.confirm.startSubscriptionEyebrow'),
        title: t('billing.confirm.startSubscription'),
        content:
          totalSeats > 0
            ? t('billing.confirm.proceedWithSeats', {
                count: totalSeats,
                amount: fmtBilling(estimated),
                currency: currencySymbol,
              })
            : t('billing.confirm.proceedSubscribe', {
                amount: fmtBilling(estimated),
                currency: currencySymbol,
              }),
        confirmationText: t('billing.confirm.continue'),
        cancellationText: t('billing.confirm.cancel'),
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
        if (!publishableKey) {
          failWithLocalizedFallback('VITE_STRIPE_PUBLISHABLE_KEY is not configured');
        }
        const stripe = await loadStripe(publishableKey, { locale: stripeLocale() });
        if (!stripe) {
          failWithLocalizedFallback('loadStripe() resolved null');
        }
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
        failWithLocalizedFallback('updateSeats() returned neither url nor success', response);
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
      const confirmed = await confirm({
        eyebrow: t('billing.confirm.planChangeEyebrow'),
        title: t('billing.confirm.downgradePlanTitle', { plan: plan.name }),
        content: (
          <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed">
            <li>
              {t('billing.confirm.downgradeWarnPeriodEnd', {
                plan: plan.name,
                date: formatDate(periodEnd),
              })}
            </li>
            <li>{t('billing.confirm.downgradeWarnWebsiteBuilder')}</li>
          </ul>
        ),
        confirmationText: t('billing.confirm.scheduleDowngrade'),
        cancellationText: t('billing.confirm.cancel'),
        destructive: true,
      });
      if (!confirmed) return;
    }

    setChangingPlan(true);
    try {
      const response = await changePlanApi({ planId: plan.id });
      if (response.action === 'upgraded' && response.requiresAction && response.clientSecret) {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
          failWithLocalizedFallback('VITE_STRIPE_PUBLISHABLE_KEY is not configured');
        }
        const stripe = await loadStripe(publishableKey, { locale: stripeLocale() });
        if (!stripe) {
          failWithLocalizedFallback('loadStripe() resolved null');
        }
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
    const confirmed = await confirm({
      eyebrow: t('billing.confirm.scheduledChangeEyebrow'),
      title: t('billing.confirm.keepCurrentPlanTitle'),
      content: t('billing.confirm.keepCurrentPlanContent', {
        plan: scheduledPlanChange.planName,
      }),
      confirmationText: t('billing.confirm.keepCurrentPlanCta'),
      cancellationText: t('billing.confirm.keepScheduled'),
    });
    if (!confirmed) return;
    setCancellingPlanChange(true);
    try {
      const response = await cancelPlanChangeApi();
      if (!response.success) {
        // response.message is a backend message code, translated downstream by
        // getErrorMessage; without one, fall back to the localized toast copy.
        if (response.message) throw new Error(response.message);
        failWithLocalizedFallback('cancelPlanChange() returned success=false with no message');
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
            onClick={handleRenewSubscription}
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
            onClick={handleRenewSubscription}
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
                            locations:
                              // Null = unlimited (backend contract); -1 kept as legacy sentinel
                              currentUser.entitlements.maxLocations == null ||
                              currentUser.entitlements.maxLocations === -1
                                ? t('billing.unlimited')
                                : currentUser.entitlements.maxLocations,
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
                        // `count` selects the plural form, `used` renders it —
                        // without count i18next never pluralizes at all.
                        count: subscriptionSummary?.usedSeats || 0,
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
                        aria-label={t('billing.v2.subscription.decrementSeatsAria')}
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
                        aria-label={t('billing.v2.subscription.incrementSeatsAria')}
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
              changingPlan={changingPlan}
              lockedReason={planChangeLockedReason}
              onSelect={(plan) => {
                if (isCheckoutState) {
                  setSelectedPlanId(plan.id);
                } else {
                  void handleChangePlan(plan);
                }
              }}
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

const Bv2PlanPickerCard = ({
  plans,
  loading,
  isCheckoutState,
  selectedPlanId,
  changingPlan,
  lockedReason,
  onSelect,
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
}) => {
  const { t } = useTranslation('settings');
  const { formatDecimalPrice, formatDecimalValue } = useFormatPrice();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Bv2CardHeader title={t('billing.v2.plans.title')} />
          <div className="bv2-plans">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) return null;

  const currentTierOrder =
    SELF_SERVE_TIER_ORDER[plans.find((p) => p.isCurrentPlan)?.tier ?? ''] ?? 0;

  return (
    <Card>
      <CardContent>
        <Bv2CardHeader
          title={t('billing.v2.plans.title')}
          subtitle={
            isCheckoutState
              ? t('billing.v2.plans.subtitleCheckout')
              : t('billing.v2.plans.subtitleActive')
          }
        />
        <div className="bv2-plans">
          {plans.map((plan) => {
            const isSelected = isCheckoutState && selectedPlanId === plan.id;
            const isCurrent = !isCheckoutState && plan.isCurrentPlan;
            const isUpgrade = (SELF_SERVE_TIER_ORDER[plan.tier] ?? 0) > currentTierOrder;
            const seatCurrencySymbol = plan.pricing
              ? getCurrencySymbol(plan.pricing.currency)
              : '';
            const actionDisabled = isCheckoutState
              ? isSelected
              : isCurrent || changingPlan || !!lockedReason;
            return (
              <div
                key={plan.id}
                className={cn(
                  'bv2-plan-card',
                  (isSelected || isCurrent) && 'bv2-selected',
                )}
              >
                <div className="bv2-plan-head">
                  <div className="bv2-plan-name">
                    {plan.tier === 'PLUS' && <Sparkles className="h-3.5 w-3.5" />}
                    {plan.name}
                  </div>
                  {isCurrent && (
                    <span className="bv2-pill bv2-pill-good">
                      <span className="bv2-dot" />
                      {t('billing.v2.plans.currentPlan')}
                    </span>
                  )}
                  {isSelected && (
                    <span className="bv2-pill bv2-pill-info">
                      <span className="bv2-dot" />
                      {t('billing.v2.plans.selected')}
                    </span>
                  )}
                </div>
                <div className="bv2-plan-price">
                  {plan.pricing ? (
                    <>
                      {formatDecimalPrice(plan.pricing.basePlanPrice, plan.pricing.currency)}
                      <small>{t('billing.v2.hero.perMonthSuffix')}</small>
                    </>
                  ) : (
                    '—'
                  )}
                </div>
                {plan.pricing && plan.pricing.pricePerTeamMember > 0 && (
                  <div className="bv2-plan-seat-price">
                    {t('billing.v2.plans.perSeat', {
                      amount: formatDecimalValue(
                        plan.pricing.pricePerTeamMember,
                        plan.pricing.currency,
                      ),
                      currency: seatCurrencySymbol,
                    })}
                  </div>
                )}
                <ul className="bv2-plan-features">
                  <li>
                    <CheckIcon className="h-3.5 w-3.5" />
                    {plan.maxLocations == null
                      ? t('billing.v2.plans.unlimitedLocations')
                      : t('billing.v2.plans.maxLocations', { count: plan.maxLocations })}
                  </li>
                  <li>
                    <CheckIcon className="h-3.5 w-3.5" />
                    {plan.maxTeamMembers == null
                      ? t('billing.v2.plans.unlimitedTeamMembers')
                      : t('billing.v2.plans.maxTeamMembers', { count: plan.maxTeamMembers })}
                  </li>
                  {plan.features.websiteBuilder ? (
                    <li>
                      <CheckIcon className="h-3.5 w-3.5" />
                      {t('billing.v2.plans.websiteBuilder')}
                    </li>
                  ) : (
                    <li className="bv2-plan-feature-muted">
                      <XCircle className="h-3.5 w-3.5" />
                      {t('billing.v2.plans.noWebsiteBuilder')}
                    </li>
                  )}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  rounded="full"
                  variant={
                    isCheckoutState
                      ? isSelected
                        ? 'outline'
                        : 'default'
                      : isCurrent || !isUpgrade
                        ? 'outline'
                        : 'default'
                  }
                  className="w-full gap-1.5"
                  disabled={actionDisabled}
                  title={
                    !isCheckoutState && !isCurrent && lockedReason ? lockedReason : undefined
                  }
                  onClick={() => onSelect(plan)}
                >
                  {!isCheckoutState && !isCurrent && changingPlan ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  {isCheckoutState
                    ? isSelected
                      ? t('billing.v2.plans.selectedCta')
                      : t('billing.v2.plans.chooseCta', { plan: plan.name })
                    : isCurrent
                      ? t('billing.v2.plans.currentPlan')
                      : isUpgrade
                        ? t('billing.v2.plans.upgradeCta', { plan: plan.name })
                        : t('billing.v2.plans.downgradeCta', { plan: plan.name })}
                </Button>
              </div>
            );
          })}
        </div>
        {lockedReason && !isCheckoutState && (
          <div className="mt-3">
            <Bv2Banner tone="neutral" icon={<Lock className="h-4 w-4" />}>
              {lockedReason}
            </Bv2Banner>
          </div>
        )}
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

  // Null = unlimited (backend contract); -1 kept as legacy sentinel
  const locationsUnlimited = maxLocations == null || maxLocations === -1;
  const seatsUnlimited = seats == null || seats === -1;

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
    const month = new Date(invoice.createdAt).toLocaleDateString(billingLocale(), {
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

// Date of birth travels as a plain 'YYYY-MM-DD' string (what the API stores and
// what a `date` column returns). Conversions use local date parts on purpose:
// `toISOString()` would shift the day across the UTC boundary for anyone east
// of Greenwich, turning a birthday into the day before.
const parseIsoDate = (value: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

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
  // Billing identity — also the invoice recipient
  billingEntityType: BillingEntityType;
  individualType: IndividualType;
  legalName: string;
  fiscalCode: string;
  registrationNumber: string;
  personalIdentificationNumber: string;
  dateOfBirth: string;
  billingAddress: string;
  billingCity: string;
  billingCounty: string;
  billingCountryCode: string;
}

const buildInitialInvoiceState = (details: BillingDetails): InvoiceFormState => {
  const type: BillingEntityType =
    (details.billingEntityType as BillingEntityType) ?? 'company';
  // The account country wins over anything stored: the server derives the
  // country from it, so showing a stored value here would only mislead.
  const country =
    details.suggestions.countryCode?.toUpperCase() ||
    (details.billingCountryCode ?? '').toUpperCase();
  return {
    billingEntityType: type,
    individualType: (details.individualType as IndividualType) ?? 'pfa',
    legalName: details.legalName ?? suggestLegalName(type, details.suggestions),
    fiscalCode: details.fiscalCode ?? '',
    registrationNumber: details.registrationNumber ?? '',
    personalIdentificationNumber: details.personalIdentificationNumber ?? '',
    dateOfBirth: details.dateOfBirth ?? '',
    billingAddress: details.billingAddress ?? '',
    billingCity: details.billingCity ?? '',
    billingCounty: details.billingCounty ?? '',
    billingCountryCode: country,
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
  const isPfa = !isCompany && form?.individualType === 'pfa';
  // A company and a PFA are identified by CUI; a plain natural person by CNP.
  const usesFiscalCode = isCompany || isPfa;
  const isConfigured = !!details?.billingEntityType;
  const isCountryLocked = !!details?.suggestions.countryCode;
  const isRoCountry = (form?.billingCountryCode || '').toUpperCase() === 'RO';

  // The holder must be at least 16 today (born on this day 16 years ago counts),
  // and a 120-year span covers every living holder.
  const dobBounds = useMemo(() => {
    const today = new Date();
    const max = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    return { max, min: new Date(today.getFullYear() - 120, 0, 1) };
  }, []);

  const isValid = useMemo(() => {
    if (!form) return false;
    const required = [
      form.legalName,
      form.billingAddress,
      form.billingCity,
      form.billingCounty,
      form.billingCountryCode,
    ];
    if (form.billingEntityType === 'company' || form.individualType === 'pfa') {
      required.push(form.fiscalCode);
    }
    // A PFA trades, so it is the individual we may have to report — its date of
    // birth is required. A plain individual is not a seller, so it stays optional.
    if (form.billingEntityType === 'person' && form.individualType === 'pfa') {
      required.push(form.dateOfBirth);
    }
    return required.every((v) => v.trim().length > 0);
  }, [form]);

  const setField = <K extends keyof InvoiceFormState>(
    key: K,
    value: InvoiceFormState[K],
  ) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  // Each tab is its own form: stored values reappear only on the tab they
  // were saved under; any other tab starts blank apart from account-derived
  // prefills (suggested legal name, locked country). Nothing typed on one tab
  // ever carries over to another.
  const buildFormForType = (
    type: BillingEntityType,
    individualType: IndividualType,
  ): InvoiceFormState => {
    const saved = buildInitialInvoiceState(details!);
    const matchesSaved =
      saved.billingEntityType === type &&
      (type === 'company' || saved.individualType === individualType);
    if (matchesSaved) return { ...saved, individualType };
    return {
      billingEntityType: type,
      individualType,
      legalName: suggestLegalName(type, details!.suggestions),
      fiscalCode: '',
      registrationNumber: '',
      personalIdentificationNumber: '',
      dateOfBirth: '',
      billingAddress: '',
      billingCity: '',
      billingCounty: '',
      billingCountryCode: (details!.suggestions.countryCode ?? '').toUpperCase(),
    };
  };

  const handleTypeChange = (next: BillingEntityType) => {
    if (!details) return;
    setForm((prev) => {
      if (!prev || prev.billingEntityType === next) return prev;
      return buildFormForType(next, prev.individualType);
    });
  };

  const handleIndividualTypeChange = (next: IndividualType) => {
    if (!details) return;
    setForm((prev) => {
      if (!prev || prev.individualType === next) return prev;
      return buildFormForType(prev.billingEntityType, next);
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
    if (form.billingEntityType === 'person') {
      payload.individualType = form.individualType;
      payload.dateOfBirth = form.dateOfBirth.trim() || undefined;
    }
    if (form.billingEntityType === 'company' || form.individualType === 'pfa') {
      payload.fiscalCode = form.fiscalCode.trim();
      payload.registrationNumber = form.registrationNumber.trim() || undefined;
    } else if (form.billingEntityType === 'person') {
      payload.personalIdentificationNumber =
        form.personalIdentificationNumber.trim() || undefined;
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
            {/* Grid rather than fixed halves: `1fr` columns stay equal but never
                narrower than their content, so a long label ("Persoană fizică")
                widens the whole track instead of wrapping onto a second line.
                The 50% indicator maths below still holds because the two
                columns remain equal. */}
            <div className="relative grid min-w-[220px] grid-cols-2 self-start rounded-full border border-border bg-surface-hover p-0.5">
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
                      'bv2-seg-btn relative z-10 cursor-pointer whitespace-nowrap rounded-full px-4 py-1 text-center text-[12.5px] font-medium transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
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
          {/* Individual sub-type: the two cases carry different identifiers. */}
          {!isCompany && (
            <div className="bv2-field">
              <span className="bv2-field-label">
                {t('billing.invoiceDetails.individualTypeLabel')}
              </span>
              <div className="relative grid min-w-[220px] grid-cols-2 self-start rounded-full border border-border bg-surface-hover p-0.5">
                <div
                  aria-hidden="true"
                  className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full bg-surface shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{
                    transform:
                      form.individualType === 'natural_person'
                        ? 'translateX(100%)'
                        : 'translateX(0)',
                  }}
                />
                {(['pfa', 'natural_person'] as const).map((opt) => {
                  const active = form.individualType === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleIndividualTypeChange(opt)}
                      className={cn(
                        'bv2-seg-btn relative z-10 cursor-pointer whitespace-nowrap rounded-full px-4 py-1 text-center text-[12.5px] font-medium transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                        active
                          ? 'text-foreground-1'
                          : 'text-foreground-2 hover:text-foreground-1',
                      )}
                    >
                      {opt === 'pfa'
                        ? t('billing.invoiceDetails.pfa')
                        : t('billing.invoiceDetails.naturalPerson')}
                    </button>
                  );
                })}
              </div>
              <p className="bv2-field-hint">
                {isPfa
                  ? t('billing.invoiceDetails.pfaHint')
                  : t('billing.invoiceDetails.naturalPersonHint')}
              </p>
            </div>
          )}

          {usesFiscalCode ? (
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
                    {isPfa
                      ? t('billing.invoiceDetails.registrationNumberPfa')
                      : t('billing.invoiceDetails.registrationNumber')}
                  </label>
                  <input
                    id="bv2-reg"
                    className="bv2-field-input"
                    placeholder={t(
                      isPfa
                        ? 'billing.invoiceDetails.registrationNumberPfaPlaceholder'
                        : 'billing.invoiceDetails.registrationNumberPlaceholder',
                    )}
                    value={form.registrationNumber}
                    onChange={(e) => setField('registrationNumber', e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="bv2-form-row bv2-cols-1">
                <div className="bv2-field">
                  <label className="bv2-field-label" htmlFor="bv2-legal">
                    {isCompany
                      ? t('billing.invoiceDetails.legalNameCompany')
                      : t('billing.invoiceDetails.legalNamePfa')}
                  </label>
                  <input
                    id="bv2-legal"
                    className="bv2-field-input"
                    placeholder={t(
                      isCompany
                        ? 'billing.invoiceDetails.legalNameCompanyPlaceholder'
                        : 'billing.invoiceDetails.legalNamePfaPlaceholder',
                    )}
                    value={form.legalName}
                    onChange={(e) => setField('legalName', e.target.value)}
                    maxLength={255}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bv2-form-row">
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
              <div className="bv2-field">
                {/* Romania's CNP is 13 digits; other countries issue their own
                    national tax ID, which can be longer and alphanumeric — so
                    outside RO the field accepts what the customer types. */}
                <label className="bv2-field-label" htmlFor="bv2-cnp">
                  {isRoCountry
                    ? t('billing.invoiceDetails.personalIdentificationNumber')
                    : t('billing.invoiceDetails.taxIdentificationNumber')}
                  {isRoCountry && <span className="bv2-flag-ro" aria-label="RO" />}
                </label>
                <input
                  id="bv2-cnp"
                  className="bv2-field-input"
                  inputMode={isRoCountry ? 'numeric' : 'text'}
                  placeholder={t(
                    isRoCountry
                      ? 'billing.invoiceDetails.personalIdentificationNumberPlaceholder'
                      : 'billing.invoiceDetails.taxIdentificationNumberPlaceholder',
                  )}
                  value={form.personalIdentificationNumber}
                  onChange={(e) =>
                    setField(
                      'personalIdentificationNumber',
                      isRoCountry
                        ? e.target.value.replace(/\D/g, '').slice(0, 13)
                        : e.target.value.slice(0, 32),
                    )
                  }
                  maxLength={isRoCountry ? 13 : 32}
                />
              </div>
            </div>
          )}

          {/* Natural persons — PFA included — are reported to ANAF with a date
              of birth; companies have no equivalent field. */}
          {!isCompany && (
            <div className="bv2-form-row">
              <div className="bv2-field">
                <label className="bv2-field-label" htmlFor="bv2-dob">
                  {isPfa
                    ? t('billing.invoiceDetails.dateOfBirth')
                    : t('billing.invoiceDetails.dateOfBirthOptional')}
                </label>
                <DatePicker
                  triggerId="bv2-dob"
                  value={parseIsoDate(form.dateOfBirth)}
                  onChange={(date) => setField('dateOfBirth', toIsoDate(date))}
                  minDate={dobBounds.min}
                  maxDate={dobBounds.max}
                  enableMonthYearSelect
                  placeholder={t('billing.invoiceDetails.dateOfBirthPlaceholder')}
                  mobileTitle={t('billing.invoiceDetails.dateOfBirth')}
                  className="!h-[38px] !rounded-[10px] !text-[13.5px]"
                />
              </div>
              <div />
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
