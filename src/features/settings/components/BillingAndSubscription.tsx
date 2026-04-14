import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Crown, ExternalLink, Loader2, Users, Calendar, CheckCircle, TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Progress } from '../../../shared/components/ui/progress';
import { Separator } from '../../../shared/components/ui/separator';
import { toast } from 'sonner';
import { selectCurrentUser } from '../../auth/selectors';
import { getSubscriptionSummaryAction, getCustomerPortalUrlAction, createCheckoutSessionAction, modifySubscriptionAction, cancelRemovalAction, getSmsBalanceAction, getSmsPackagesAction } from '../actions';
import { updateSeats, createLtdSeatsCheckoutSession, abortPendingPayment } from '../api';
import { useConfirmRadix } from '../../../shared/hooks/useConfirm';
import { useNavigate } from 'react-router-dom';
import {
  selectSubscriptionSummary,
  selectIsLoadingSubscriptionSummary,
  selectIsLoadingCustomerPortal,
  selectIsLoadingCheckoutSession,
  selectIsLoadingModifySubscription,
  selectIsLoadingCancelRemoval
} from '../selectors';
import { loadStripe } from '@stripe/stripe-js';
import SmsCredits from './SmsCredits';
import InvoiceBillingDetails from './InvoiceBillingDetails';
import { BillingDetailsProvider } from '../context/BillingDetailsProvider';
import { useBillingDetailsContext } from '../context/BillingDetailsContext';

const BillingAndSubscriptionInner = () => {
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  const { ensureConfigured } = useBillingDetailsContext();
  const currentUser = useSelector(selectCurrentUser);
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const loading = useSelector(selectIsLoadingSubscriptionSummary);
  const portalLoading = useSelector(selectIsLoadingCustomerPortal);
  const checkoutLoading = useSelector(selectIsLoadingCheckoutSession);
  const cancelLoading = useSelector(selectIsLoadingModifySubscription);
  const cancelRemovalLoading = useSelector(selectIsLoadingCancelRemoval);

  const [updatingSeats, setUpdatingSeats] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const hasPendingPayment = !!subscriptionSummary?.pendingPayment;
  const currencySymbol = subscriptionSummary?.currency === 'RON' ? 'lei' : '€';
  const [totalSeats, setTotalSeats] = useState<number>(0);
  const { ConfirmDialog, confirm } = useConfirmRadix();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.entitlements?.status === 'active') {
      const paid = subscriptionSummary?.paidSeats || 0;
      setTotalSeats(paid);
    }

    if (currentUser?.entitlements?.status === 'trial') {
      setTotalSeats(subscriptionSummary?.currentTeamMembersCount || 0);
    }

    if (currentUser?.entitlements?.status === 'expired') {
      setTotalSeats(subscriptionSummary?.currentTeamMembersCount || 0);
    }

    if (currentUser?.entitlements?.status === 'ltd') {
      setTotalSeats(subscriptionSummary?.paidSeats || 0);
    }

    // cancelled subscription
    if (currentUser?.entitlements?.status === 'no_subscription') {
      setTotalSeats(subscriptionSummary?.paidSeats || 0);
    }
  }, [currentUser?.entitlements?.status, subscriptionSummary?.paidSeats, subscriptionSummary?.currentTeamMembersCount]);

  const hasFetched = useRef(false);
  
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      dispatch(getSubscriptionSummaryAction.request());
      // Fetch SMS data alongside subscription summary
      dispatch(getSmsBalanceAction.request());
      dispatch(getSmsPackagesAction.request());
    }
  }, [dispatch]);

  const hasScheduledChange = !!(subscriptionSummary?.scheduled && subscriptionSummary.scheduled.scheduledSeats != null);
  const isSubscriptionScheduledForCancellation = currentUser?.subscription?.status === 'active' && currentUser?.subscription?.cancelAtPeriodEnd;

  const handleManagePaymentMethodAndInvoices = () => {
    const returnUrl = window.location.origin + '/account?tab=billing';
    dispatch(getCustomerPortalUrlAction.request({ returnUrl }));
  };

  const handleRenewSubscription = async () => {
    if (!ensureConfigured()) return;

    // Confirmation before creating a new subscription
    const base = subscriptionSummary?.basePlanPrice || 0;
    const perSeat = subscriptionSummary?.pricePerTeamMember || 0;
    const estimated = base + perSeat * (Number(totalSeats) || 0);
    const confirmed = await confirm({
      title: t('billing.confirm.startSubscription'),
      content: totalSeats > 0
        ? t('billing.confirm.proceedWithSeats', { count: totalSeats, amount: estimated.toFixed(2), currency: currencySymbol })
        : t('billing.confirm.proceedSubscribe', { amount: estimated.toFixed(2), currency: currencySymbol }),
      confirmationText: t('billing.confirm.continue'),
      cancellationText: t('billing.confirm.cancel'),
    });

    if (!confirmed) return;

    // Set loading state for renew subscription
    setUpdatingSeats(true);

    // Create new subscription with base plan + seats
    dispatch(createCheckoutSessionAction.request({
      seats: totalSeats,
      successUrl: `${window.location.origin}/info?type=subscription-success`,
      cancelUrl: `${window.location.origin}/account`,
    }));
  };

  const handleSubscriptionStatusChange = async () => {
    const isScheduledForCancellation = currentUser?.subscription?.status === 'active' && currentUser?.subscription?.cancelAtPeriodEnd;

    const confirmed = await confirm({
      title: isScheduledForCancellation ? t('billing.confirm.keepSubscription') : t('billing.confirm.cancelSubscription'),
      content: isScheduledForCancellation
        ? t('billing.confirm.keepSubscriptionContent')
        : t('billing.confirm.cancelSubscriptionContent'),
      confirmationText: isScheduledForCancellation ? t('billing.confirm.keepSubscription') : t('billing.confirm.cancelSubscription'),
      cancellationText: isScheduledForCancellation ? t('billing.confirm.keepCancellation') : t('billing.confirm.keepSubscription'),
    });

    if (!confirmed) return;

    dispatch(modifySubscriptionAction.request({ action: isScheduledForCancellation ? 'keep' : 'cancel' }));
  };

  const handleCancelRemoval = async () => {
    const confirmed = await confirm({
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
    const ltdHasNoSeats = isLtd && (subscriptionSummary?.paidSeats ?? 0) === 0;

    // Handle first-time seat purchase for LTD user
    if (ltdHasNoSeats) {
      if (!ensureConfigured()) return;
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
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || t('billing.toast.updateFailed'));
      } finally {
        setUpdatingSeats(false);
      }
      return;
    }

    // LTD with existing seats falls through to active subscription handling (updateSeats)
    const isTrial = currentUser?.entitlements?.status === 'trial';
    const isExpiredTrial = currentUser?.entitlements?.status === 'expired' || currentUser?.entitlements?.status === 'no_subscription';

    if (isTrial || isExpiredTrial) {
      if (!ensureConfigured()) return;

      // Ask for confirmation before starting subscription from trial/expired trial
      const base = subscriptionSummary?.basePlanPrice || 0;
      const perSeat = subscriptionSummary?.pricePerTeamMember || 0;
      const estimated = base + perSeat * (Number(totalSeats) || 0);

      const confirmed = await confirm({
        title: t('billing.confirm.startSubscription'),
        content: totalSeats > 0
          ? t('billing.confirm.proceedWithSeats', { count: totalSeats, amount: estimated.toFixed(2), currency: currencySymbol })
          : t('billing.confirm.proceedSubscribe', { amount: estimated.toFixed(2), currency: currencySymbol }),
        confirmationText: t('billing.confirm.continue'),
        cancellationText: t('billing.confirm.cancel'),
      });

      if (!confirmed) return;

      // Trial user or expired trial: Create checkout with configured seats or current team members
      setUpdatingSeats(true);

      dispatch(createCheckoutSessionAction.request({
        seats: totalSeats,
        successUrl: `${window.location.origin}/info?type=subscription-success`,
        cancelUrl: `${window.location.origin}/account`,
      }));
    } else {
      // Active subscription: Update existing seats

      // Ask for confirmation before applying changes (delta strictly vs paid seats)
      const paid = subscriptionSummary?.paidSeats || 0;
      const scheduledNextTotal = subscriptionSummary?.scheduled?.scheduledSeats ?? null;
      const desiredTotal = totalSeats;

      // Scenario 1: user set the input to the already-scheduled next month total
      if (scheduledNextTotal != null && desiredTotal === scheduledNextTotal) {
        toast.info(t('billing.toast.alreadyScheduled'));
        return;
      }

      // Scenario 2: no change vs paid seats
      if (desiredTotal === paid) {
        return;
      }
      const delta = desiredTotal - paid;
      const pricePerSeat = subscriptionSummary?.pricePerTeamMember || 0;
      const isAdding = delta > 0;
      const additionalCost = isAdding ? delta * pricePerSeat : 0;

      if (isAdding && !ensureConfigured()) return;

      setIsConfirming(true);
      const confirmed = await confirm({
        title: isAdding ? t('billing.confirm.confirmSeatIncrease') : t('billing.confirm.confirmSeatDecrease'),
        content: isAdding
          ? t('billing.confirm.addingSeatsContent', { count: delta, amount: additionalCost.toFixed(2), currency: currencySymbol })
          : t('billing.confirm.removingSeatsContent', { count: Math.abs(delta) }),
        confirmationText: isAdding ? t('billing.confirm.addSeats') : t('billing.confirm.removeSeats'),
        cancellationText: t('billing.confirm.cancel'),
      });
      setIsConfirming(false);

      if (!confirmed) return;

      try {
        setUpdatingSeats(true);
        const response = await updateSeats({ seats: totalSeats });

        // Check if payment requires additional authentication
        if (response.requiresAction && response.clientSecret) {
          // Handle client-side payment confirmation
          const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

          if (!publishableKey) {
            throw new Error('Stripe publishable key not configured');
          }

          const stripe = await loadStripe(publishableKey);
          if (!stripe) {
            throw new Error('Failed to load Stripe');
          }

          // Confirm the payment - this will open Stripe's payment UI if needed
          const { error } = await stripe.confirmCardPayment(response.clientSecret);

          if (error) {
            toast.error(error.message || t('billing.toast.paymentFailed'));
          } else {
            // Payment confirmed - redirect to success page
            toast.success(t('billing.toast.paymentConfirmed'));
            window.location.href = '/info?type=seats-update-success';
          }
        } else if (response.url) {
          // Redirect to Stripe payment page (Checkout flow)
          window.location.href = response.url;
        } else if (response.success) {
          // Payment completed without additional action
          toast.success(t('billing.toast.seatsUpdated'));
          window.location.href = '/info?type=seats-update-success';
        } else {
          throw new Error('Seat update failed');
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || t('billing.toast.updateFailed'));
      } finally {
        setUpdatingSeats(false);
      }
    }
  };

  const handleRetryPayment = async () => {
    const pending = subscriptionSummary?.pendingPayment;
    if (!pending) return;

    // If card failed / missing, redirect to Stripe hosted invoice page to update payment method
    if (pending.status === 'requires_payment_method') {
      if (pending.invoiceUrl) {
        window.location.href = pending.invoiceUrl;
      } else {
        // Fallback: open customer portal
        dispatch(getCustomerPortalUrlAction.request({ returnUrl: window.location.href }));
      }
      return;
    }

    // If requires 3DS authentication, use Stripe.js to confirm
    if (pending.status === 'requires_action' && pending.clientSecret) {
      try {
        setRetryingPayment(true);
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) throw new Error('Stripe publishable key not configured');

        const stripe = await loadStripe(publishableKey);
        if (!stripe) throw new Error('Failed to load Stripe');

        const { error } = await stripe.confirmCardPayment(pending.clientSecret);
        if (error) {
          toast.error(error.message || t('billing.toast.paymentFailed'));
        } else {
          toast.success(t('billing.toast.paymentConfirmed'));
          // Refresh to pick up updated state
          dispatch(getSubscriptionSummaryAction.request());
        }
      } catch (err: any) {
        toast.error(err?.message || t('billing.toast.paymentFailed'));
      } finally {
        setRetryingPayment(false);
      }
    }
  };

  const handleAbortPayment = async () => {
    try {
      setRetryingPayment(true);
      await abortPendingPayment();
      toast.success(t('billing.pendingPayment.aborted'));
      dispatch(getSubscriptionSummaryAction.request());
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || t('billing.toast.updateFailed'));
    } finally {
      setRetryingPayment(false);
    }
  };

  const getStatusBadge = () => {
    const status = currentUser?.subscription?.status;
    const cancelAtPeriodEnd = currentUser?.subscription?.cancelAtPeriodEnd;

    if (currentUser?.entitlements?.status === 'ltd') {
      return <Badge className="bg-success-bg text-success border-success-border">Lifetime Deal</Badge>;
    }

    if (currentUser?.entitlements?.status === 'trial') {
      return <Badge className="bg-info-bg text-info border-info-border">{t('billing.status.trial')}</Badge>;
    }

    // Active but scheduled for cancellation
    if (status === 'active' && cancelAtPeriodEnd) {
      return <Badge className="bg-warning-bg text-warning border-warning-border">{t('billing.status.scheduledForCancellation')}</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge className="bg-success-bg text-success border-success-border">{t('billing.status.active')}</Badge>;
      case 'canceled':
        return <Badge className="bg-error-bg text-error border-error-border">{t('billing.status.canceled')}</Badge>;
      case 'past_due':
        return <Badge className="bg-warning-bg text-warning border-warning-border">{t('billing.status.pastDue')}</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border">{t('billing.status.inactive')}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateSeatUsage = () => {
    const isTrial = currentUser?.entitlements?.status === 'trial';

    if (isTrial) {
      // Trial: Use current team members count (can invite unlimited)
      const usedSeats = subscriptionSummary?.currentTeamMembersCount || 0;
      return { paidSeats: 0, usedSeats, percentage: 0 };
    } else {
      // Active subscription: Use paid seats and used seats
      const paidSeats = subscriptionSummary?.paidSeats || 0;
      const usedSeats = subscriptionSummary?.usedSeats || 0;
      const percentage = paidSeats > 0 ? (usedSeats / paidSeats) * 100 : 0;
      return { paidSeats, usedSeats, percentage };
    }
  };

  const seatUsage = calculateSeatUsage();

  const getTeamSeatsText = () => {
    if (currentUser?.entitlements?.status === 'trial') {
      const seats = subscriptionSummary?.currentTeamMembersCount || 0;
      return `${seats} × ${(subscriptionSummary?.pricePerTeamMember || 0).toFixed(2)} ${currencySymbol}`;
    }
    // For active subscriptions, show paid seats in breakdown
    const seats = subscriptionSummary?.paidSeats || 0;
    return `${seats} × ${(subscriptionSummary?.pricePerTeamMember || 0).toFixed(2)} ${currencySymbol}`;
  };

  const getTeamSeatsCost = () => {
    if (currentUser?.entitlements?.status === 'trial') {
      const seats = subscriptionSummary?.currentTeamMembersCount || 0;
      return seats * (subscriptionSummary?.pricePerTeamMember || 0);
    }
    // For active subscriptions, calculate based on desired seats or paid seats
    const seats = subscriptionSummary?.paidSeats || 0;
    return seats * (subscriptionSummary?.pricePerTeamMember || 0);
  };

  const getTotalCost = () => {
    const basePlanCost = subscriptionSummary?.basePlanPrice || 0;
    const teamSeatsCost = getTeamSeatsCost();
    return basePlanCost + teamSeatsCost;
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog />
      {loading ? (
        <div className="space-y-6">
          {/* Current Subscription Card Skeleton */}
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-px w-full my-2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                </div>
                <div className="space-y-3 border border-border rounded-lg p-3 bg-surface/60">
                  <Skeleton className="h-4 w-28" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-10 w-full rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Seat Usage Summary Skeleton */}
          <Card className="border border-border/60 bg-white dark:bg-card overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded shrink-0" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-2 w-48" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-9 w-32 rounded-full shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* SMS Credits Section Skeleton */}
          <Card className="border border-border/60 bg-white dark:bg-card overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full sm:w-[calc(33.333%-0.5rem)] rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan Features Skeleton */}
          <Card className="border border-border/60 bg-white dark:bg-card overflow-hidden mb-12">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-10 w-40 rounded-full" />
                  <Skeleton className="h-10 w-44 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Pending Payment Banner */}
          {subscriptionSummary?.pendingPayment && (
            <Card className="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                      {t('billing.pendingPayment.title')}
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {subscriptionSummary.pendingPayment.status === 'requires_action'
                        ? t('billing.pendingPayment.requiresAction')
                        : t('billing.pendingPayment.requiresPaymentMethod')}
                    </p>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      {t('billing.pendingPayment.amount', {
                        amount: subscriptionSummary.pendingPayment.amount.toFixed(2),
                        currency: subscriptionSummary.pendingPayment.currency,
                      })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subscriptionSummary.pendingPayment.status === 'requires_payment_method' && (
                        <Button
                          onClick={handleRetryPayment}
                          disabled={retryingPayment}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          size="sm"
                        >
                          {t('billing.pendingPayment.updatePaymentMethod')}
                        </Button>
                      )}
                      {subscriptionSummary.pendingPayment.status === 'requires_action' && (
                        <Button
                          onClick={handleRetryPayment}
                          disabled={retryingPayment}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          size="sm"
                        >
                          {retryingPayment ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t('billing.pendingPayment.retrying')}
                            </>
                          ) : (
                            t('billing.pendingPayment.completePayment')
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={handleAbortPayment}
                        disabled={retryingPayment}
                        variant="outline"
                        size="sm"
                        className="border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      >
                        {t('billing.pendingPayment.abortPayment')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Subscription Card */}
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground-1">{t('billing.currentSubscription')}</h3>
              </div>

              <div className="space-y-4">
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {subscriptionSummary?.planName || t('billing.freePlan')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {subscriptionSummary?.planTier || 'free'}
                    </p>
                  </div>
                  {getStatusBadge()}
                </div>

                {/* Trial Info */}
                {currentUser?.entitlements?.status === 'trial' && (
                  <div className="bg-info-bg border border-info-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-info" />
                      <span className="text-sm font-medium text-foreground-1">
                        {t('billing.trialActive')}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-2">
                      {t('billing.daysRemaining', { count: currentUser.entitlements.daysRemaining })}
                    </p>
                    {currentUser.subscription?.trialEndsAt && (
                      <p className="text-xs text-foreground-3 mt-1">
                        {t('billing.ends', { date: formatDate(currentUser.subscription.trialEndsAt) })}
                      </p>
                    )}
                  </div>
                )}

                {/* Subscription Scheduled for Cancellation */}
                {currentUser?.subscription?.status === 'active' && currentUser?.subscription?.cancelAtPeriodEnd && (
                  <div className="bg-warning-bg border border-warning-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium text-foreground-1">
                        {t('billing.scheduledForCancellation')}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-2">
                      {t('billing.cancellationInfo', {
                        date: currentUser.subscription.currentPeriodEnd ? formatDate(currentUser.subscription.currentPeriodEnd) : t('billing.endOfPeriod'),
                      })}
                    </p>
                  </div>
                )}

                {/* Pricing Breakdown */}
                {subscriptionSummary && (
                  <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{subscriptionSummary.breakdown?.[0]?.description || t('billing.basePlan')}</span>
                      <span className="font-medium">
                        {subscriptionSummary.basePlanPrice.toFixed(2)} {currencySymbol}/month
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {subscriptionSummary.breakdown?.[1]?.description || t('billing.teamSeats')} ({getTeamSeatsText()})
                      </span>
                      <span className="font-medium">
                        {getTeamSeatsCost().toFixed(2)} {currencySymbol}/month
                      </span>
                    </div>

                    <Separator className="my-2" />

                    <div className="flex justify-between">
                      <span className="font-semibold">{t('billing.total')}</span>
                      <span className="text-xl font-bold text-primary">
                        {getTotalCost().toFixed(2)} {currencySymbol}/month
                      </span>
                    </div>
                  </div>
                )}

                {/* Next Billing Date / Cancellation Date */}
                {currentUser?.subscription?.currentPeriodEnd && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {currentUser?.subscription?.cancelAtPeriodEnd ? t('billing.subscriptionEnds') : t('billing.nextBillingDate')}
                    </span>
                    <span className="font-medium">
                      {formatDate(currentUser.subscription.currentPeriodEnd)}
                    </span>
                  </div>
                )}

                {/* Seats Management */}
                <div className="space-y-3 border border-border rounded-lg p-3 bg-surface/60">
                  {(hasScheduledChange || isSubscriptionScheduledForCancellation) && (
                    <div className="bg-info-bg border border-info-border rounded-lg p-3">
                      <div className="text-sm font-medium text-foreground-1">
                        {t('billing.seatChangesLocked')}
                      </div>
                      <p className="text-xs text-foreground-2 mt-1">
                        {isSubscriptionScheduledForCancellation
                          ? t('billing.subscriptionLockedHint')
                          : t('billing.scheduledChangeLockedHint')
                        }
                      </p>
                    </div>
                  )}
                  {/* Show current seats */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">{t('billing.currentSeats')}</label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        rounded="full"
                        disabled={isConfirming || hasScheduledChange || isSubscriptionScheduledForCancellation || hasPendingPayment}
                        onClick={() => {
                          const used = subscriptionSummary?.usedSeats || 0;
                          const desired = (Number(totalSeats) || 0) - 1;
                          if (desired === -1) {
                            return;
                          }
                          if (desired < used) {
                            toast.info(t('billing.toast.seatsInUse', { count: used }), {
                              action: {
                                label: t('billing.toast.teamMembers'),
                                onClick: () => navigate('/team-members')
                              }
                            });
                            setTotalSeats(used);
                            return;
                          }
                          setTotalSeats(desired);
                        }}
                      >
                        -
                      </Button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={subscriptionSummary?.usedSeats || 0}
                        step={1}
                        value={totalSeats}
                        readOnly={isConfirming || hasScheduledChange || isSubscriptionScheduledForCancellation || hasPendingPayment}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^0-9]/g, '');
                          const nextVal = sanitized === '' ? 0 : Number(sanitized);
                          const used = subscriptionSummary?.usedSeats || 0;
                          if (nextVal < used) {
                            toast.info(t('billing.toast.seatsInUse', { count: used }), {
                              action: {
                                label: t('billing.toast.teamMembers'),
                                onClick: () => navigate('/team-members')
                              }
                            });
                            setTotalSeats(used);
                            return;
                          }
                          setTotalSeats(nextVal);
                        }}
                        className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        placeholder="0"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        rounded="full"
                        disabled={isConfirming || hasScheduledChange || isSubscriptionScheduledForCancellation || hasPendingPayment}
                        onClick={() => {
                          const next = (Number(totalSeats) || 0) + 1;
                          setTotalSeats(next);
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Show scheduled removal */}
                  {subscriptionSummary?.scheduled?.scheduledSeats != null && (
                    <div className="bg-warning-bg border border-warning-border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-foreground-1">
                            {t('billing.scheduledRemoval', { count: subscriptionSummary.paidSeats - subscriptionSummary.scheduled.scheduledSeats })}
                          </div>
                          <div className="text-xs text-foreground-2 mt-1">
                            {t('billing.availableNextMonth', { count: subscriptionSummary.scheduled.scheduledSeats })}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          rounded="full"
                          onClick={handleCancelRemoval}
                          disabled={cancelRemovalLoading}
                          className="text-info hover:text-info"
                        >
                          {cancelRemovalLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t('billing.undo')
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show adding seats info (delta strictly vs paid seats) */}
                  {(() => {
                    const paid = subscriptionSummary?.paidSeats || 0;
                    const desiredTotal = Number(totalSeats) || 0;
                    const delta = desiredTotal - paid;
                    const pricePerSeat = subscriptionSummary?.pricePerTeamMember || 0;

                    if (currentUser?.entitlements?.status === 'no_subscription') {
                      return null;
                    }

                    if (delta > 0) {
                      const additionalCost = delta * pricePerSeat;
                      return (
                        <div className="bg-info-bg border border-info-border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-info" />
                            <span className="text-sm font-medium text-foreground-1">
                              {t('billing.addingSeats', { count: delta })}
                            </span>
                          </div>
                          <p className="text-xs text-foreground-2">
                            {t('billing.additionalCharge', { count: delta, amount: additionalCost.toFixed(2), currency: currencySymbol })}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Upgrade Seats Button */}
                {
                  currentUser?.entitlements?.status !== 'no_subscription' && (
                    <>
                      <Button
                        onClick={handleUpgrade}
                        rounded="full"
                        disabled={currentUser?.entitlements?.status === 'trial' ? checkoutLoading : updatingSeats || isSubscriptionScheduledForCancellation || hasPendingPayment}
                        className="w-full bg-success hover:bg-success-border text-white"
                      >
                        {(currentUser?.entitlements?.status === 'trial' ? checkoutLoading : updatingSeats) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {currentUser?.entitlements?.status === 'trial' ? t('billing.creating') : t('billing.updating')}
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {currentUser?.entitlements?.status === 'trial' ? t('billing.upgrade') : t('billing.applySeatChanges')}
                          </>
                        )}
                      </Button>
                    </>
                  )}

                {/* Manage Payment Method and Invoices */}
                {
                  (currentUser?.entitlements?.status === 'active' || currentUser?.entitlements?.status === 'ltd') && (
                    <>
                      <Button
                        onClick={handleManagePaymentMethodAndInvoices}
                        rounded="full"
                        disabled={portalLoading}
                        className="w-full"
                      >
                        {portalLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('billing.loadingShort')}
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('billing.paymentMethodInvoices')}
                          </>
                        )}
                      </Button>
                    </>
                  )
                }

                {/* Renew Subscription Button */}
                {
                  currentUser?.entitlements?.status === 'no_subscription' && (
                    <>
                      <Button
                        onClick={handleRenewSubscription}
                        rounded="full"
                        disabled={checkoutLoading}
                        className="w-full bg-info hover:bg-info-border text-white"
                      >
                        {checkoutLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('billing.creating')}
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {t('billing.renewSubscription')}
                          </>
                        )}
                      </Button>
                    </>
                  )
                }

                {/* Cancel Subscription / Keep Subscription Button */}
                {
                  currentUser?.entitlements?.status === 'active' && (
                    <>
                      <Button
                        onClick={handleSubscriptionStatusChange}
                        rounded="full"
                        disabled={cancelLoading}
                        variant={isSubscriptionScheduledForCancellation ? "default" : "destructive"}
                        className={`w-full ${isSubscriptionScheduledForCancellation ? 'bg-success hover:bg-success-border text-white' : ''}`}
                      >
                        {cancelLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isSubscriptionScheduledForCancellation ? t('billing.keeping') : t('billing.cancelling')}
                          </>
                        ) : (
                          isSubscriptionScheduledForCancellation ? t('billing.keepSubscription') : t('billing.cancelSubscription')
                        )}
                      </Button>
                    </>
                  )
                }
              </div>
            </CardContent>
          </Card>

          {/* Seat Usage Summary */}
          <Card className="border border-border/60 bg-card overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-base font-semibold text-foreground-1">{t('billing.seatUsage')}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {currentUser?.entitlements?.status === 'trial'
                        ? seatUsage.usedSeats
                        : `${seatUsage.usedSeats} / ${seatUsage.paidSeats}`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {currentUser?.entitlements?.status === 'trial'
                        ? t('billing.inUseTrial')
                        : t('billing.seatsUsed')}
                    </span>
                  </div>
                  {currentUser?.entitlements?.status !== 'trial' && (
                    <Progress value={seatUsage.percentage} className="h-2 mt-2 max-w-xs" />
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {currentUser?.entitlements?.status === 'trial'
                      ? t('billing.unlimitedTrial')
                      : t('billing.availableToInvite', { count: subscriptionSummary?.availableSeats ?? 0 })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  rounded="full"
                  onClick={() => navigate('/team-members')}
                  className="shrink-0 gap-1.5 font-normal group"
                >
                  {t('billing.manageTeam')}
                  <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SMS Credits Section */}
          <SmsCredits />

          {/* Plan Features - Last section */}
          {currentUser?.entitlements && (
            <Card className="border border-border/60 bg-card overflow-hidden mb-12">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-success/10">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground-1">{t('billing.yourPlanIncludes')}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-muted/50 border border-border/60">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      <span className="text-sm text-foreground-2">{t('billing.maxLocations')}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {currentUser.entitlements.maxLocations === -1
                          ? t('billing.unlimited')
                          : currentUser.entitlements.maxLocations}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-muted/50 border border-border/60">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      <span className="text-sm text-foreground-2">{t('billing.maxTeamMembers')}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {currentUser.entitlements.maxTeamMembers === -1
                          ? t('billing.unlimited')
                          : currentUser.entitlements.maxTeamMembers}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Billing Details */}
          <InvoiceBillingDetails />
        </>
      )}
    </div>
  );
};

const BillingAndSubscription = () => (
  <BillingDetailsProvider>
    <BillingAndSubscriptionInner />
  </BillingDetailsProvider>
);

export default BillingAndSubscription;
