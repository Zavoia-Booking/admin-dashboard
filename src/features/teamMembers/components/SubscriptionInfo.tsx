import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import type { AuthUser } from '../../auth/types';
import type { SubscriptionSummary } from '../../settings/types';

interface SubscriptionInfoProps {
  currentUser: AuthUser | null;
  subscriptionSummary: SubscriptionSummary | null;
  onClose: () => void;
}

export const SubscriptionInfo: React.FC<SubscriptionInfoProps> = ({
  currentUser,
  subscriptionSummary,
  onClose,
}) => {
  const navigate = useNavigate();

  const paidSeats = currentUser?.entitlements?.paidTeamSeats ?? subscriptionSummary?.currentTeamMembersCount ?? 0;
  const usedSeats = subscriptionSummary?.usedSeats ?? 0;
  const availableSeats = paidSeats - usedSeats;
  const hasAvailableSeats = availableSeats > 0;

  const subscriptionStatus = currentUser?.subscription?.status;
  const isCancelled = subscriptionStatus === 'canceled';
  const entStatus = currentUser?.entitlements?.status;
  const isExpiredOrNoSubscription = entStatus === 'expired' || entStatus === 'no_subscription';
  
  // Check if in trial - based on trialEndsAt field, not subscription status
  const trialEndsAt = currentUser?.subscription?.trialEndsAt;
  const isTrial = !!trialEndsAt && new Date(trialEndsAt) > new Date();

  // Case 1: Trial - unlimited invitations
  if (isTrial) {
    return (
      <>
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Team Members</span>
          </div>
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            {usedSeats}
          </span>
        </div>

        <div className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
          ✓ During your trial period, you can invite unlimited team members to explore features together!
        </div>
      </>
    );
  }

  // Case 2: Expired trial or no subscription - must subscribe
  if (isExpiredOrNoSubscription) {
    return (
      <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg space-y-3">
        <p className="font-semibold text-base">⚠️ Subscription required</p>
        <p>
          You need an active subscription to invite team members.
        </p>
        <Button 
          onClick={() => {
            onClose();
            navigate('/settings?open=billing');
          }}
          variant="outline"
          className="w-full"
        >
          Go to billing
        </Button>
      </div>
    );
  }

  // Case 3: Cancelled - need to renew
  if (isCancelled) {
    return (
      <div className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-lg space-y-3">
        <p className="font-semibold text-base">🚫 Subscription Required</p>
        <p>
          Your subscription has been cancelled. To invite team members, you need to renew your subscription first.
        </p>
        <Button 
          onClick={() => {
            onClose();
            navigate('/settings?open=billing');
          }}
          className="w-full mt-2 bg-red-600 hover:bg-red-700"
        >
          Renew Subscription
        </Button>
      </div>
    );
  }

  // Case 4: Active subscription
  return (
    <>
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Paid Seats</span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {paidSeats}
        </span>
      </div>
      
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Used Seats</span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {usedSeats} / {paidSeats}
        </span>
      </div>

      {hasAvailableSeats ? (
        <div className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
          ✓ You have {availableSeats} available seat{availableSeats !== 1 ? 's' : ''}. No additional charge for this invitation.
        </div>
      ) : (
        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg space-y-2">
          <p className="font-semibold">⚠️ All Seats In Use</p>
          <p>
            You currently have all seats in use. To invite a new team member, you will need to purchase an additional seat first.
          </p>
        </div>
      )}
    </>
  );
};

