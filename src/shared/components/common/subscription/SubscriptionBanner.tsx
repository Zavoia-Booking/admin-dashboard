import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CreditCard,Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/alert';
import { Button } from '../../ui/button';
import { getCustomerPortalUrl } from '../../../../features/settings/api';
import { toast } from 'sonner';
import type { AuthUser } from '../../../../features/auth/types';

interface SubscriptionBannerProps {
  user: AuthUser;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { subscription } = user;

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const returnUrl = window.location.origin + window.location.pathname;
      const { url } = await getCustomerPortalUrl(returnUrl);
      window.location.href = url;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to open customer portal');
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/settings?tab=billing');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isPeriodEnded = (endDate: string | null) => {
    if (!endDate) return true;
    return new Date(endDate) < new Date();
  };

  // Subscription cancelled - start new subscription via upgrade flow
  if (subscription?.status === 'canceled') {
    const periodEnded = isPeriodEnded(subscription.currentPeriodEnd);
    const daysRemaining = getDaysRemaining(subscription.currentPeriodEnd);
    
    if (periodEnded) {
      // Access has expired
      return (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30 mb-4">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <span className="font-medium text-red-900 dark:text-red-100">
                🚫 Subscription expired
              </span>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Your subscription has ended. Start a new subscription to restore access.
              </p>
            </div>
            <Button 
              onClick={handleUpgrade}
              size="sm"
              className="ml-4 bg-red-600 hover:bg-red-700"
            >
              Subscribe Now
            </Button>
          </AlertDescription>
        </Alert>
      );
    } else {
      // Still has time remaining but subscription is cancelled
      // Subscription is truly cancelled - need new checkout (no stripeSubscriptionId means it's gone)
      return (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 mb-4">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <span className="font-medium text-amber-900 dark:text-amber-100">
                ⚠️ Subscription cancelled
              </span>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Your access will end on {formatDate(subscription.currentPeriodEnd)} ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining). Start a new subscription to continue.
              </p>
            </div>
            <Button 
              onClick={handleUpgrade}
              size="sm"
              className="ml-4 bg-amber-600 hover:bg-amber-700"
            >
              Subscribe Again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
  }

  // Payment failed - retry in progress
  if (subscription?.status === 'past_due') {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30 mb-4">
        <CreditCard className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-medium text-red-900 dark:text-red-100">
              ❌ Payment failed
            </span>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Update your payment method to avoid service interruption.
            </p>
          </div>
          <Button 
            onClick={handleManageSubscription}
            disabled={loading}
            size="sm"
            className="ml-4 bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              'Update Payment'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Subscription unpaid - access blocked
  if (subscription?.status === 'unpaid') {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30 mb-4">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-medium text-red-900 dark:text-red-100">
              🚫 Subscription past due
            </span>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Your subscription is past due. Renew now to restore access.
            </p>
          </div>
          <Button 
            onClick={handleManageSubscription}
            disabled={loading}
            size="sm"
            className="ml-4 bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              'Renew Subscription'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Incomplete - initial payment incomplete
  if (subscription?.status === 'incomplete') {
    return (
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 mb-4">
        <CreditCard className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-medium text-amber-900 dark:text-amber-100">
              ⏳ Payment incomplete
            </span>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Complete your payment setup to activate your subscription.
            </p>
          </div>
          <Button 
            onClick={handleManageSubscription}
            disabled={loading}
            size="sm"
            className="ml-4 bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Incomplete expired - setup expired
  if (subscription?.status === 'incomplete_expired') {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30 mb-4">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-medium text-red-900 dark:text-red-100">
              ⏰ Setup expired
            </span>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Your payment setup has expired. Start a new subscription.
            </p>
          </div>
          <Button 
            onClick={handleUpgrade}
            size="sm"
            className="ml-4 bg-red-600 hover:bg-red-700"
          >
            Start New Subscription
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Active subscription but scheduled for cancellation
  if (subscription?.status === 'active' && subscription?.cancelAtPeriodEnd) {
    const daysRemaining = getDaysRemaining(subscription.currentPeriodEnd);
    
    return (
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 mb-4">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-medium text-amber-900 dark:text-amber-100">
              ⚠️ Subscription scheduled for cancellation
            </span>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Your subscription will be cancelled on {formatDate(subscription.currentPeriodEnd)} ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining). You'll continue to have access until then.
            </p>
          </div>
          <Button 
            onClick={handleManageSubscription}
            disabled={loading}
            size="sm"
            className="ml-4 bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              'Keep Subscription'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Active subscription - no banner needed
  return null;
};

export default SubscriptionBanner;

