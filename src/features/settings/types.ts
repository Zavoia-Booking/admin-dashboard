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
  numberOfLocations: number;
  numberOfTeamMembers: number;
  maxLocations: number;
  maxTeamMembers: number;
  scheduled?: {
    scheduledSeats: number | null;
    nextPeriodStart: string | null;
    nextPeriodTeamMembersCost: number | null;
    nextPeriodTotalMonthlyCost: number | null;
  };
  // Live Stripe preview: cost of adding ONE seat today.
  // Null for LTD / trial / no-subscription / pending-payment / preview-failure.
  // Multiply proratedPricePerSeat × N for an approximate "adding N seats today" total.
  proratedSeatInfo?: {
    proratedPricePerSeat: number;
    fullMonthlyPricePerSeat: number;
    daysRemaining: number;
    totalDaysInPeriod: number;
    nextChargeDate: string | null;
  } | null;
  isLtd?: boolean;        // True if this is a Life Time Deal account
  ltdSince?: string;      // When LTD was granted
  pendingPayment?: {
    status: string;           // 'requires_action' | 'requires_payment_method'
    clientSecret: string | null;
    amount: number;
    currency: string;
    invoiceUrl: string | null;
    // 'subscription_update' = seat-change failure → offer abort
    // 'subscription_cycle'  = renewal failure → offer retry / update PM / cancel
    billingReason: string | null;
  } | null;
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
    invoices: boolean;
  };
  // SMS State
  smsBalance: BusinessSmsInfo | null;
  smsPackages: SmsPackage[];
  smsPurchases: SmsPurchase[];
  smsPurchasesHasMore: boolean;
  smsPurchasesNextCursor: number | null;
  smsError: string | null;
  smsIsLoading: {
    balance: boolean;
    packages: boolean;
    checkout: boolean;
    purchases: boolean;
  };
  // Invoices
  invoices: BusinessInvoice[];
  invoicesHasMore: boolean;
  invoicesNextCursor: number | null;
};

// SMS Types
export type SmsPackage = {
  id: number;
  uuid: string;
  name: string;
  regionPricingId: number;
  smsCount: number;
  priceMinor: number;
  currency: string;
  isActive: boolean;
};

export type BusinessSmsInfo = {
  smsCredits: number;
  smsTotalPurchased: number;
  smsTotalUsed: number;
};

export type SmsPurchase = {
  id: number;
  businessId: number;
  packageId: number;
  smsQuantity: number;
  totalAmountMinor: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
};

export type SmsPackagesResponse = {
  data: SmsPackage[];
};

export type SmsBalanceResponse = {
  data: BusinessSmsInfo;
};

export type SmsPurchasesResponse = {
  data: SmsPurchase[];
  hasMore: boolean;
  nextCursor?: number;
};

export type SmsCheckoutPayload = {
  packageId: number;
  successUrl: string;
  cancelUrl: string;
};

export type SmsCheckoutResponse = {
  url: string;
};

export type BusinessInvoiceType = 'subscription' | 'sms_purchase' | 'ltd_seats';

export type BusinessInvoiceStatus = 'success' | 'failed';

export type BusinessInvoice = {
  id: number;
  invoiceType: BusinessInvoiceType;
  status: BusinessInvoiceStatus;
  amountMinor: number;
  currency: string;
  oblioLink: string | null;
  oblioNumber: string | null;
  oblioSeriesName: string | null;
  createdAt: string;
};

export type BusinessInvoicesResponse = {
  data: BusinessInvoice[];
  hasMore: boolean;
  nextCursor?: number;
};