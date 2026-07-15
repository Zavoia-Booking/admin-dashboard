export type PricingBreakdownItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

// Self-serve plan tiers (CUSTOM is assigned manually and never self-serve switchable)
export type PlanTier = 'STANDARD' | 'PLUS' | 'CUSTOM';

export type PlanFeatures = {
  websiteBuilder: boolean;
};

// GET /plans/list — self-serve plans (STANDARD + PLUS) with pricing resolved
// for the business's country. Prices are in MAJOR units (backend divides
// Stripe unit_amount by 100). Null limits mean unlimited.
export type AvailablePlan = {
  id: number;
  name: string;
  tier: PlanTier;
  maxLocations: number | null;
  maxTeamMembers: number | null;
  features: PlanFeatures;
  pricing: {
    basePlanPrice: number;
    pricePerTeamMember: number;
    currency: string;
  } | null;
  isCurrentPlan: boolean;
};

export type PlansListResponse = {
  plans: AvailablePlan[];
};

// POST /billing/change-plan — upgrade applies immediately (with SCA support),
// downgrade is scheduled at the end of the current billing period.
export type ChangePlanResponse = {
  success: boolean;
  action: 'upgraded' | 'downgrade_scheduled';
  message?: string;
  // action === 'upgraded'
  planId?: number;
  planName?: string;
  planTier?: string;
  requiresAction?: boolean;
  clientSecret?: string | null;
  paymentIntentStatus?: string | null;
  // action === 'downgrade_scheduled'
  currentPlan?: { id: number; name: string; tier: string };
  scheduledPlan?: { id: number; name: string; tier: string };
  effectiveDate?: string | null;
};

// GET /billing/plan-change-preview — exact Stripe proration for an immediate
// upgrade: prorated target-plan cost for the remaining period (chargedNow)
// minus the unused-time credit of the current plan (creditedNow, ≤ 0).
// amountDue = chargedNow + creditedNow is what the card is charged today;
// the billing anchor (periodEnd) does not move.
export type PlanChangePreviewResponse = {
  action: 'upgrade' | 'downgrade_scheduled';
  amountDue: number;
  chargedNow: number;
  creditedNow: number;
  currency: string;
  periodEnd: string | null;
  effectiveDate: string | null;
};

// POST /billing/cancel-plan-change — releases the shared Stripe schedule,
// which also clears any scheduled seat change.
export type CancelPlanChangeResponse = {
  success: boolean;
  message?: string;
  cancelled?: boolean;
};

export type SubscriptionSummary = {
  planTier: string;
  planName: string;
  // Current plan details with tier-derived feature flags
  currentPlan?: {
    id: number;
    name: string;
    tier: string;
    features: PlanFeatures;
  } | null;
  // Scheduled plan change (e.g. a downgrade applying at the end of the period)
  scheduledPlanChange?: {
    planId: number;
    planName: string;
    planTier: string;
    effectiveDate: string | null;
  } | null;
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
  maxLocations: number | null; // Null = unlimited
  maxTeamMembers: number | null; // Null = unlimited
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
  // Plan to subscribe to. Required by the regular checkout flow;
  // ignored by the LTD seats checkout.
  planId?: number;
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
  plans: AvailablePlan[];
  error: string | null;
  isLoading: {
    subscriptionSummary: boolean;
    checkoutSession: boolean;
    customerPortal: boolean;
    modifySubscription: boolean;
    cancelRemoval: boolean;
    invoices: boolean;
    plans: boolean;
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