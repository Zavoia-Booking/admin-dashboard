export type PricingBreakdownItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type SubscriptionSummary = {
  planTier: string;
  planName: string;
  basePlanPrice: number;
  currentTeamMembersCount: number;
  pricePerTeamMember: number;
  totalTeamMembersCost: number;
  totalMonthlyCost: number;
  currency: string;
  breakdown: PricingBreakdownItem[];
  paidSeats: number;        // User bought X seats
  usedSeats: number;        // Currently using X seats
  availableSeats: number;   // Can invite X more team members
  scheduled?: {
    scheduledSeats: number | null;
    nextPeriodStart: string | null;
    nextPeriodTeamMembersCost: number | null;
    nextPeriodTotalMonthlyCost: number | null;
  };
};

export type CheckoutPayload = {
  seats?: number;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutResponse = {
  url: string;
};


// Seats update/removal API contracts
export type UpdateSeatsPayload = {
  // number of seats to add (delta, not total)
  seats: number;
};

export type UpdateSeatsResponse = {
  success?: boolean;
  url?: string;                // optional Stripe Checkout URL
  requiresAction?: boolean;    // if payment intent requires confirmation
  clientSecret?: string | null;
};

export type PendingUser = {
  id: number;
  email: string;
  role: string;
  createdAt: string;
};

export type SettingsState = {
  subscriptionSummary: SubscriptionSummary | null;
  checkoutResponse: CheckoutResponse | null;
  customerPortalUrl: string | null;
  error: string | null;
  isLoading: {
    subscriptionSummary: boolean;
    checkoutSession: boolean;
    customerPortal: boolean;
    modifySubscription: boolean;
    cancelRemoval: boolean;
  };
};