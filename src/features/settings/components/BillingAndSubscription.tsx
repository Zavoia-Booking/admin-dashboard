import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Crown, ExternalLink, Loader2, Users, Calendar, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Progress } from '../../../shared/components/ui/progress';
import { Separator } from '../../../shared/components/ui/separator';
import { toast } from 'sonner';
import { selectCurrentUser } from '../../auth/selectors';
import { getSubscriptionSummaryAction, getCustomerPortalUrlAction, createCheckoutSessionAction, modifySubscriptionAction, cancelRemovalAction } from '../actions';
import { updateSeats } from '../api';
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

const BillingAndSubscription = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const loading = useSelector(selectIsLoadingSubscriptionSummary);
  const portalLoading = useSelector(selectIsLoadingCustomerPortal);
  const checkoutLoading = useSelector(selectIsLoadingCheckoutSession);
  const cancelLoading = useSelector(selectIsLoadingModifySubscription);
  const cancelRemovalLoading = useSelector(selectIsLoadingCancelRemoval);

  const [updatingSeats, setUpdatingSeats] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
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

    // cancelled subscription
    if (currentUser?.entitlements?.status === 'no_subscription') {
      setTotalSeats(subscriptionSummary?.paidSeats || 0);
    }
  }, [currentUser?.entitlements?.status, subscriptionSummary?.paidSeats, subscriptionSummary?.currentTeamMembersCount]);

  useEffect(() => {
    dispatch(getSubscriptionSummaryAction.request());
  }, []);

  const hasScheduledChange = !!(subscriptionSummary?.scheduled && subscriptionSummary.scheduled.scheduledSeats != null);
  const isSubscriptionScheduledForCancellation = currentUser?.subscription?.status === 'active' && currentUser?.subscription?.cancelAtPeriodEnd;

  const handleManagePaymentMethodAndInvoices = () => {
    const returnUrl = window.location.origin + '/settings?open=billing';
    dispatch(getCustomerPortalUrlAction.request({ returnUrl }));
  };

  const handleRenewSubscription = async () => {
    // Confirmation before creating a new subscription
    const base = subscriptionSummary?.basePlanPrice || 0;
    const perSeat = subscriptionSummary?.pricePerTeamMember || 0;
    const estimated = base + perSeat * (Number(totalSeats) || 0);
    const confirmed = await confirm({
      title: 'Start new subscription',
      content: totalSeats > 0 ?
        `Proceed to subscribe with ${totalSeats} total seat${totalSeats !== 1 ? 's' : ''}? You will be charged ${estimated.toFixed(2)}€ now.` :
        `Proceed to subscribe? You will be charged ${estimated.toFixed(2)}€ now.`,
      confirmationText: 'Continue',
      cancellationText: 'Cancel',
    });

    if (!confirmed) return;

    // Set loading state for renew subscription
    setUpdatingSeats(true);

    // Create new subscription with base plan + seats
    dispatch(createCheckoutSessionAction.request({
      seats: totalSeats,
      successUrl: `${window.location.origin}/info?type=subscription-success`,
      cancelUrl: `${window.location.origin}/settings`,
    }));
  };

  const handleSubscriptionStatusChange = async () => {
    const isScheduledForCancellation = currentUser?.subscription?.status === 'active' && currentUser?.subscription?.cancelAtPeriodEnd;

    const confirmed = await confirm({
      title: isScheduledForCancellation ? 'Keep Subscription' : 'Cancel Subscription',
      content: isScheduledForCancellation
        ? 'Are you sure you want to keep your subscription? This will undo the scheduled cancellation and your subscription will continue normally.'
        : 'Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period.',
      confirmationText: isScheduledForCancellation ? 'Keep Subscription' : 'Cancel Subscription',
      cancellationText: isScheduledForCancellation ? 'Keep Cancellation' : 'Keep Subscription',
    });

    if (!confirmed) return;

    dispatch(modifySubscriptionAction.request({ action: isScheduledForCancellation ? 'keep' : 'cancel' }));
  };

  const handleCancelRemoval = async () => {
    const confirmed = await confirm({
      title: 'Undo Scheduled Cancellation',
      content: 'Are you sure you want to undo the scheduled seat cancellation? Your current seats will remain active.',
      confirmationText: 'Undo Cancellation',
      cancellationText: 'Keep Scheduled',
    });

    if (!confirmed) return;

    dispatch(cancelRemovalAction.request());
  };

  const handleUpgrade = async () => {
    const isTrial = currentUser?.entitlements?.status === 'trial';
    const isExpiredTrial = currentUser?.entitlements?.status === 'expired' || currentUser?.entitlements?.status === 'no_subscription';

    if (isTrial || isExpiredTrial) {
      // Ask for confirmation before starting subscription from trial/expired trial
      const base = subscriptionSummary?.basePlanPrice || 0;
      const perSeat = subscriptionSummary?.pricePerTeamMember || 0;
      const estimated = base + perSeat * (Number(totalSeats) || 0);

      const confirmed = await confirm({
        title: 'Start new subscription',
        content: totalSeats > 0
          ? `Proceed to subscribe with ${totalSeats} total seat${totalSeats !== 1 ? 's' : ''}? You will be charged ${estimated.toFixed(2)}€ now.`
          : `Proceed to subscribe? You will be charged ${estimated.toFixed(2)}€ now.`,
        confirmationText: 'Continue',
        cancellationText: 'Cancel',
      });

      if (!confirmed) return;

      // Trial user or expired trial: Create checkout with configured seats or current team members
      setUpdatingSeats(true);

      dispatch(createCheckoutSessionAction.request({
        seats: totalSeats,
        successUrl: `${window.location.origin}/info?type=subscription-success`,
        cancelUrl: `${window.location.origin}/settings`,
      }));
    } else {
      // Active subscription: Update existing seats

      // Ask for confirmation before applying changes (delta strictly vs paid seats)
      const paid = subscriptionSummary?.paidSeats || 0;
      const scheduledNextTotal = subscriptionSummary?.scheduled?.scheduledSeats ?? null;
      const desiredTotal = totalSeats;

      // Scenario 1: user set the input to the already-scheduled next month total
      if (scheduledNextTotal != null && desiredTotal === scheduledNextTotal) {
        toast.info('You already have this change scheduled for the next billing period.');
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

      setIsConfirming(true);
      const confirmed = await confirm({
        title: isAdding ? 'Confirm seat increase' : 'Confirm seat reduction',
        content: isAdding
          ? `You are adding ${delta} seat${delta !== 1 ? 's' : ''}. You will be charged ${additionalCost.toFixed(2)}€ now.`
          : `You are removing ${Math.abs(delta)} seat${Math.abs(delta) !== 1 ? 's' : ''}. Removed seats remain active until the end of the billing period.`,
        confirmationText: isAdding ? 'Add seats' : 'Remove seats',
        cancellationText: 'Cancel',
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
            toast.error(error.message || 'Payment failed');
          } else {
            // Payment confirmed - redirect to success page
            toast.success('Payment confirmed! Seats updated successfully.');
            window.location.href = '/info?type=seats-update-success';
          }
        } else if (response.url) {
          // Redirect to Stripe payment page (Checkout flow)
          window.location.href = response.url;
        } else if (response.success) {
          // Payment completed without additional action
          toast.success('Seats updated successfully!');
          window.location.href = '/info?type=seats-update-success';
        } else {
          throw new Error('Seat update failed');
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to update seats');
      } finally {
        setUpdatingSeats(false);
      }
    }
  };

  const getStatusBadge = () => {
    const status = currentUser?.subscription?.status;
    const cancelAtPeriodEnd = currentUser?.subscription?.cancelAtPeriodEnd;

    if (currentUser?.entitlements?.status === 'trial') {
      return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
    }

    // Active but scheduled for cancellation
    if (status === 'active' && cancelAtPeriodEnd) {
      return <Badge className="bg-amber-100 text-amber-800">Scheduled for Cancellation</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-amber-100 text-amber-800">Past Due</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
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
      return `${seats} × ${(subscriptionSummary?.pricePerTeamMember || 0).toFixed(2)}€`;
    }
    // For active subscriptions, show paid seats in breakdown
    const seats = subscriptionSummary?.paidSeats || 0;
    return `${seats} × ${(subscriptionSummary?.pricePerTeamMember || 0).toFixed(2)}€`;
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
    <div className="max-w-md mx-auto space-y-6">
      <ConfirmDialog />
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading billing information...</p>
        </div>
      ) : (
        <>
          {/* Current Subscription Card */}
          <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                  <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Current Subscription</h3>
              </div>

              <div className="space-y-4">
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {subscriptionSummary?.planName || 'Free Plan'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {subscriptionSummary?.planTier || 'free'}
                    </p>
                  </div>
                  {getStatusBadge()}
                </div>

                {/* Trial Info */}
                {currentUser?.entitlements?.status === 'trial' && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Trial Active
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {currentUser.entitlements.daysRemaining} days remaining
                    </p>
                    {currentUser.subscription?.trialEndsAt && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Ends {formatDate(currentUser.subscription.trialEndsAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Subscription Scheduled for Cancellation */}
                {currentUser?.subscription?.status === 'active' && currentUser?.subscription?.cancelAtPeriodEnd && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Subscription Scheduled for Cancellation
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Your subscription will be cancelled on {currentUser.subscription.currentPeriodEnd ? formatDate(currentUser.subscription.currentPeriodEnd) : 'the end of your billing period'}. You'll continue to have access until then.
                    </p>
                  </div>
                )}

                {/* Pricing Breakdown */}
                {subscriptionSummary && (
                  <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Plan</span>
                      <span className="font-medium">
                        {subscriptionSummary.basePlanPrice.toFixed(2)}€/month
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Team Seats ({getTeamSeatsText()})
                      </span>
                      <span className="font-medium">
                        {getTeamSeatsCost().toFixed(2)}€/month
                      </span>
                    </div>

                    <Separator className="my-2" />

                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-primary">
                        {getTotalCost().toFixed(2)}€/month
                      </span>
                    </div>
                  </div>
                )}

                {/* Next Billing Date / Cancellation Date */}
                {currentUser?.subscription?.currentPeriodEnd && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {currentUser?.subscription?.cancelAtPeriodEnd ? 'Subscription ends' : 'Next billing date'}
                    </span>
                    <span className="font-medium">
                      {formatDate(currentUser.subscription.currentPeriodEnd)}
                    </span>
                  </div>
                )}

                {/* Seats Management */}
                <div className="space-y-3 border rounded-lg p-3 bg-background/60">
                  {(hasScheduledChange || isSubscriptionScheduledForCancellation) && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {isSubscriptionScheduledForCancellation ? 'Seat changes are locked' : 'Seat changes are locked'}
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {isSubscriptionScheduledForCancellation
                          ? 'Your subscription is scheduled for cancellation. To modify seats, first undo the subscription cancellation.'
                          : 'You have a scheduled seat change. To modify seats, first undo the scheduled cancellation.'
                        }
                      </p>
                    </div>
                  )}
                  {/* Show current seats */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Current seats</label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isConfirming || hasScheduledChange || isSubscriptionScheduledForCancellation}
                        onClick={() => {
                          const used = subscriptionSummary?.usedSeats || 0;
                          const desired = (Number(totalSeats) || 0) - 1;
                          if (desired === -1) {
                            return;
                          }
                          if (desired < used) {
                            toast.info(`You currently have ${used} seat${used !== 1 ? 's' : ''} in use. Remove a team member first to reduce seats.`, {
                              action: {
                                label: 'Team members',
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
                        readOnly={isConfirming || hasScheduledChange || isSubscriptionScheduledForCancellation}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^0-9]/g, '');
                          const nextVal = sanitized === '' ? 0 : Number(sanitized);
                          const used = subscriptionSummary?.usedSeats || 0;
                          if (nextVal < used) {
                            toast.info(`You currently have ${used} seat${used !== 1 ? 's' : ''} in use. Remove a team member first to reduce seats.`, {
                              action: {
                                label: 'Team members',
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
                        disabled={isConfirming || hasScheduledChange || isSubscriptionScheduledForCancellation}
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
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Scheduled for removal: {subscriptionSummary.paidSeats - subscriptionSummary.scheduled.scheduledSeats} seat{(subscriptionSummary.paidSeats - subscriptionSummary.scheduled.scheduledSeats) !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Available next month: {subscriptionSummary.scheduled.scheduledSeats} seat{subscriptionSummary.scheduled.scheduledSeats !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelRemoval}
                          disabled={cancelRemovalLoading}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          {cancelRemovalLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Undo'
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
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Adding {delta} seat{delta !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            You'll be charged <span className="font-semibold">{additionalCost.toFixed(2)}€</span> now for the additional seat{delta !== 1 ? 's' : ''}.
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
                        disabled={currentUser?.entitlements?.status === 'trial' ? checkoutLoading : updatingSeats || isSubscriptionScheduledForCancellation}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {(currentUser?.entitlements?.status === 'trial' ? checkoutLoading : updatingSeats) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {currentUser?.entitlements?.status === 'trial' ? 'Creating...' : 'Updating...'}
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {currentUser?.entitlements?.status === 'trial' ? 'Upgrade' : 'Apply Seat Changes'}
                          </>
                        )}
                      </Button>
                    </>
                  )}

                {/* Manage Payment Method and Invoices */}
                {
                  currentUser?.entitlements?.status === 'active' && (
                    <>
                      <Button
                        onClick={handleManagePaymentMethodAndInvoices}
                        disabled={portalLoading}
                        className="w-full"
                      >
                        {portalLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {'Loading...'}
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Payment Method & Invoices
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
                        disabled={checkoutLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {checkoutLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Renew Subscription
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
                        disabled={cancelLoading}
                        variant={isSubscriptionScheduledForCancellation ? "default" : "destructive"}
                        className={`w-full ${isSubscriptionScheduledForCancellation ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                      >
                        {cancelLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isSubscriptionScheduledForCancellation ? 'Keeping...' : 'Cancelling...'}
                          </>
                        ) : (
                          isSubscriptionScheduledForCancellation ? 'Keep my subscription' : 'Cancel Subscription'
                        )}
                      </Button>
                    </>
                  )
                }
              </div>
            </CardContent>
          </Card>

          {/* Team Seats Usage */}
          <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Team Member Seats</h3>
              </div>

              <div className="space-y-4">
                {/* Usage Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seats in use</span>
                    <span className="font-semibold">
                      {currentUser?.entitlements?.status === 'trial'
                        ? `${seatUsage.usedSeats} (Trial)`
                        : `${seatUsage.usedSeats} of ${seatUsage.paidSeats}`
                      }
                    </span>
                  </div>
                  <Progress value={seatUsage.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.entitlements?.status === 'trial'
                      ? 'Unlimited seats available during trial'
                      : `${subscriptionSummary?.availableSeats || 0} seat${(subscriptionSummary?.availableSeats || 0) !== 1 ? 's' : ''} available`
                    }
                  </p>
                </div>

                {/* Pricing Info */}
                {subscriptionSummary && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price per seat</span>
                      <span className="text-sm font-semibold">
                        {subscriptionSummary.pricePerTeamMember.toFixed(2)}€/month
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* Plan Features */}
          {currentUser?.entitlements && (
            <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Your Plan Includes</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Maximum Locations</span>
                    <span className="text-sm font-semibold">
                      {currentUser.entitlements.maxLocations === -1
                        ? 'Unlimited'
                        : currentUser.entitlements.maxLocations}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Maximum Team Members</span>
                    <span className="text-sm font-semibold">
                      {currentUser.entitlements.maxTeamMembers === -1
                        ? 'Unlimited'
                        : currentUser.entitlements.maxTeamMembers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default BillingAndSubscription;
