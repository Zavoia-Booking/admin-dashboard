export type PricingBreakdownItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type PricingSummary = {
  planTier: string;
  planName: string;
  basePlanPrice: number;
  currentTeamMembersCount: number;
  pricePerTeamMember: number;
  totalTeamMembersCost: number;
  totalMonthlyCost: number;
  currency: string;
  breakdown: PricingBreakdownItem[];
};

export type CheckoutPayload = {
  seats?: number;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutResponse = {
  url: string;
};

export type UpdateSeatsPayload = {
  seats: number;
  successUrl: string;
  cancelUrl: string;
};

export type UpdateSeatsResponse = {
  url?: string;
  success?: boolean;
  seats?: number;
  subscriptionId?: string;
  status?: string;
  requiresAction?: boolean;
  clientSecret?: string;
  paymentIntentStatus?: string;
  message?: string;
};

export type PendingUser = {
  id: number;
  email: string;
  role: string;
  createdAt: string;
};

export type PendingPaymentCost = {
  hasPendingPayments: boolean;
  pendingPaymentCount: number;
  pricePerSeat: number;
  totalCost: number;
  currency: string;
  currentPaidSeats?: number;
  newTotalSeats?: number;
  pendingUsers: PendingUser[];
};
