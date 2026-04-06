// Centralized helpers for subscription/seat availability logic

type MinimalUser = {
  subscription?: { status?: string | null; trialEndsAt?: string | null } | null;
  entitlements?: { status?: string | null; paidTeamSeats?: number } | null;
};

type MinimalSubscriptionSummary = {
  currentTeamMembersCount?: number;
  /** Billing source of truth: prefer when present */
  paidSeats?: number;
  usedSeats?: number;
  availableSeats?: number;
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

  // Prefer subscription summary (billing API) for seat counts when available
  const paidSeatsFromSummary = subscriptionSummary?.paidSeats;
  const usedSeatsFromSummary = subscriptionSummary?.usedSeats;
  const availableSeatsFromSummary = subscriptionSummary?.availableSeats;

  const paidSeats =
    paidSeatsFromSummary !== undefined && paidSeatsFromSummary !== null
      ? paidSeatsFromSummary
      : (currentUser?.entitlements?.paidTeamSeats ?? undefined) !== undefined
        ? (currentUser?.entitlements?.paidTeamSeats as number)
        : (subscriptionSummary?.currentTeamMembersCount ?? 0);

  const usedSeats =
    usedSeatsFromSummary !== undefined && usedSeatsFromSummary !== null
      ? usedSeatsFromSummary
      : (teamMembersSummary?.active ?? 0) + (teamMembersSummary?.pending ?? 0);

  const availableSeats =
    availableSeatsFromSummary !== undefined && availableSeatsFromSummary !== null
      ? availableSeatsFromSummary
      : paidSeats - usedSeats;

  const hasAvailableSeats = availableSeats > 0;

  const subscriptionStatus = currentUser?.subscription?.status ?? null;
  const status = currentUser?.entitlements?.status;
  const isLtd = status === 'ltd';
  const isCancelled = subscriptionStatus === 'canceled' && !isLtd;
  const hasSubscription = status !== 'no_subscription' || isLtd;

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
    isLtd,
  };
}
