// Centralized helpers for subscription/seat availability logic

type MinimalUser = {
  subscription?: { status?: string | null; trialEndsAt?: string | null } | null;
  entitlements?: { status?: string | null; paidTeamSeats?: number } | null;
};

type MinimalSubscriptionSummary = {
  currentTeamMembersCount?: number;
};

type MinimalTeamMembersSummary = {
  active?: number;
  pending?: number;
};

export function computeSeatContext(params: {
  currentUser?: MinimalUser | null;
  subscriptionSummary?: MinimalSubscriptionSummary | null;
  teamMembersSummary?: MinimalTeamMembersSummary | null;
}) {
  const { currentUser, subscriptionSummary, teamMembersSummary } = params;

  const paidSeats =
    (currentUser?.entitlements?.paidTeamSeats ?? undefined) !== undefined
      ? (currentUser?.entitlements?.paidTeamSeats as number)
      : (subscriptionSummary?.currentTeamMembersCount ?? 0);

  const usedSeats = (teamMembersSummary?.active ?? 0) + (teamMembersSummary?.pending ?? 0);
  const availableSeats = paidSeats - usedSeats;
  const hasAvailableSeats = availableSeats > 0;

  const subscriptionStatus = currentUser?.subscription?.status ?? null;
  const isCancelled = subscriptionStatus === 'canceled';
  const status = currentUser?.entitlements?.status;
  const hasSubscription = status !== 'no_subscription';
  
  // Check if in trial - using both entitlements status and trialEndsAt
  const isTrial = status === 'trial' || (!!currentUser?.subscription?.trialEndsAt && new Date(currentUser.subscription.trialEndsAt) > new Date());

  return {
    paidSeats,
    usedSeats,
    availableSeats,
    hasAvailableSeats,
    isCancelled,
    hasSubscription,
    isTrial,
  };
}
