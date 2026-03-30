import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { selectCurrentUser } from '../../../../features/auth/selectors';
import { UserRole } from '../../../types/auth';

/**
 * SubscriptionGate - Global overlay that blocks UI when subscription is not active
 *
 * Applies to OWNER role only. Shows nothing for:
 * - Team members (they can't fix subscription issues)
 * - Dashboard users (they have no business)
 * - Users with active entitlements (trial or active subscription)
 *
 * Excludes routes:
 * - /settings/* (billing tab must be accessible to reactivate)
 * - /info (info pages like post-checkout success)
 * - /welcome (setup wizard)
 *
 * Two visual variants:
 * - Variant A: "Subscription Required" for expired/cancelled/no_subscription
 * - Variant B: "Payment Issue" for past_due (softer messaging)
 */
export const SubscriptionGate: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Return nothing if no user data yet
  if (!currentUser) {
    return null;
  }

  // Only apply gate to OWNER role — team members can't fix subscription issues
  if (currentUser.role !== UserRole.OWNER) {
    return null;
  }

  // If user is entitled (trial or active), don't block
  const isEntitled = currentUser.entitlements?.entitled ?? false;
  if (isEntitled) {
    return null;
  }

  // Exclude /settings (any tab) and /info and /welcome routes
  if (
    pathname.startsWith('/settings') ||
    pathname.startsWith('/info') ||
    pathname.startsWith('/welcome')
  ) {
    return null;
  }

  const status = currentUser.entitlements?.status;

  // Determine variant based on status
  const isPastDue = status === 'past_due';

  // Base overlay container
  const overlayClasses =
    'fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm';
  const bgClasses = isPastDue ? 'bg-amber-950/80' : 'bg-black/80';

  return (
    <div className={`${overlayClasses} ${bgClasses}`}>
      <Card className={isPastDue ? 'max-w-md w-full border-amber-200 shadow-lg' : 'max-w-md w-full border-red-200 shadow-lg'}>
        <CardContent className="pt-6 pb-8 px-6 text-center space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            {isPastDue ? (
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>

          {/* Title & Status */}
          {isPastDue ? (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                Payment Issue
              </h2>
              <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Payment Retrying</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-red-900 dark:text-red-100">
                Subscription Required
              </h2>
              <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Page Access Unavailable</span>
              </div>
            </div>
          )}

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 text-base">
            {isPastDue
              ? 'Your payment method is being retried. Update your payment information to restore full access to your business.'
              : 'Your subscription is not active. To regain access to your business data, please manage your subscription.'}
          </p>

          {/* Action Button */}
          <div className="pt-4">
            <Button
              onClick={() => navigate('/settings?tab=billing')}
              className={
                isPastDue
                  ? 'w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-6 text-base'
                  : 'w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 text-base'
              }
              size="lg"
            >
              {isPastDue ? 'Update Payment Method' : 'Manage Subscription'}
            </Button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            All your data is safe and will be restored once you{' '}
            {isPastDue ? 'update your payment.' : 'renew.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGate;
