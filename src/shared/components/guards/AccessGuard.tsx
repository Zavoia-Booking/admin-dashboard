import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../../features/auth/selectors';
import { SubscriptionExpiredBanner } from '../common/subscription/SubscriptionExpiredBanner';
import SubscriptionBanner from '../common/subscription/SubscriptionBanner';

interface AccessGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showBanner?: boolean;
  redirectTo?: string;
}

/**
 * AccessGuard component that controls access based on user entitlements
 * 
 * Usage:
 * 1. Page-level blocking: <AccessGuard><YourPageContent /></AccessGuard>
 * 2. Feature-level blocking: <AccessGuard fallback={<UpgradePrompt />}><Feature /></AccessGuard>
 * 3. Banner-only: <AccessGuard showBanner={true}><Content /></AccessGuard>
 */
export const AccessGuard: React.FC<AccessGuardProps> = ({
  children,
  fallback,
  showBanner = false,
  redirectTo = '/settings?open=billing'
}) => {
  const currentUser = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  // If no user data, allow access (will be handled by auth guards)
  if (!currentUser) {
    return <>{children}</>;
  }

  // Check if user is entitled to access features
  const isEntitled = currentUser.entitlements?.entitled ?? false;
  const status = currentUser.entitlements?.status;
  const reason = currentUser.entitlements?.reason;

  // If entitled, show content
  if (isEntitled) {
    return (
      <>
        {showBanner && <SubscriptionBanner user={currentUser} />}
        {children}
      </>
    );
  }

  // Not entitled - determine the blocking strategy
  const isExpiredTrial = status === 'expired' || status === 'no_subscription';
  const isCancelledSubscription = currentUser.subscription?.status === 'canceled';

  // For expired trials or cancelled subscriptions, show full-page blocking
  if (isExpiredTrial || isCancelledSubscription) {
    return <SubscriptionExpiredBanner />;
  }

  // For other cases (past_due, etc.), show banner and fallback
  return (
    <>
      <SubscriptionBanner user={currentUser} />
      {fallback || (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {reason || 'Access restricted. Please check your subscription status.'}
          </p>
          <button
            onClick={() => navigate(redirectTo)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Manage Subscription
          </button>
        </div>
      )}
    </>
  );
};

/**
 * Hook to check access status
 */
export const useAccessControl = () => {
  const currentUser = useSelector(selectCurrentUser);
  
  const isEntitled = currentUser?.entitlements?.entitled ?? false;
  const status = currentUser?.entitlements?.status;
  const reason = currentUser?.entitlements?.reason;
  
  const isExpiredTrial = status === 'expired' || status === 'no_subscription';
  const isCancelledSubscription = currentUser?.subscription?.status === 'canceled';
  const isTrial = status === 'trial';
  const isActive = status === 'active';
  
  return {
    isEntitled,
    status,
    reason,
    isExpiredTrial,
    isCancelledSubscription,
    isTrial,
    isActive,
    currentUser
  };
};
