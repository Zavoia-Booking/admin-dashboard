import type { Page, Route, Request as PwRequest } from '@playwright/test'

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

// ─────────────── Subscription summary ───────────────

export type BillingState =
  | 'trial'
  | 'active'
  | 'past_due_renewal'
  | 'past_due_seat_change'
  | 'ltd'
  | 'ltd_no_seats'
  | 'canceled'
  | 'scheduled_cancellation'
  | 'pending_inc'
  | 'pending_dec'
  | 'inactive'

export type SummaryOverrides = {
  paidSeats?: number
  usedSeats?: number
  numberOfTeamMembers?: number
  numberOfLocations?: number
  maxLocations?: number
  maxTeamMembers?: number
  basePlanPrice?: number
  pricePerTeamMember?: number
  currency?: string
  scheduledSeats?: number | null
  nextPeriodStart?: string | null
  proratedPricePerSeat?: number | null
  fullMonthlyPricePerSeat?: number | null
  daysRemaining?: number
  totalDaysInPeriod?: number
}

const isoInDays = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

/**
 * Build a SubscriptionSummary that lines up with the requested view state.
 * Keep the shape consistent with the dashboard's `SubscriptionSummary` type
 * (src/features/settings/types.ts).
 */
export function sampleSubscriptionSummary(
  state: BillingState = 'trial',
  overrides: SummaryOverrides = {},
) {
  const base = overrides.basePlanPrice ?? 19.99
  const perSeat = overrides.pricePerTeamMember ?? 5
  const paidSeats = overrides.paidSeats ?? (state === 'trial' || state === 'inactive' ? 0 : 3)
  const usedSeats = overrides.usedSeats ?? Math.min(paidSeats, 2)
  const total = base + perSeat * paidSeats

  let scheduled: {
    scheduledSeats: number | null
    nextPeriodStart: string | null
    nextPeriodTeamMembersCost: number | null
    nextPeriodTotalMonthlyCost: number | null
  } | undefined

  if (state === 'pending_inc' || state === 'pending_dec' || overrides.scheduledSeats != null) {
    const scheduledSeats =
      overrides.scheduledSeats ??
      (state === 'pending_inc' ? paidSeats + 2 : Math.max(0, paidSeats - 1))
    scheduled = {
      scheduledSeats,
      nextPeriodStart: overrides.nextPeriodStart ?? isoInDays(14),
      nextPeriodTeamMembersCost: scheduledSeats * perSeat,
      nextPeriodTotalMonthlyCost: base + scheduledSeats * perSeat,
    }
  }

  let pendingPayment: any = null
  if (state === 'past_due_renewal') {
    pendingPayment = {
      status: 'requires_payment_method',
      clientSecret: null,
      amount: total,
      currency: overrides.currency ?? 'eur',
      invoiceUrl: 'https://stripe.test/invoice/in_test_renewal',
      billingReason: 'subscription_cycle',
    }
  } else if (state === 'past_due_seat_change') {
    pendingPayment = {
      status: 'requires_payment_method',
      clientSecret: null,
      amount: perSeat,
      currency: overrides.currency ?? 'eur',
      invoiceUrl: 'https://stripe.test/invoice/in_test_seat_change',
      billingReason: 'subscription_update',
    }
  }

  let proratedSeatInfo: any = null
  if (state === 'active' && overrides.proratedPricePerSeat !== null) {
    proratedSeatInfo = {
      proratedPricePerSeat: overrides.proratedPricePerSeat ?? 2.5,
      fullMonthlyPricePerSeat: overrides.fullMonthlyPricePerSeat ?? perSeat,
      daysRemaining: overrides.daysRemaining ?? 14,
      totalDaysInPeriod: overrides.totalDaysInPeriod ?? 30,
      nextChargeDate: overrides.nextPeriodStart ?? isoInDays(14),
    }
  }

  const isLtd = state === 'ltd' || state === 'ltd_no_seats'
  const ltdSeats = state === 'ltd_no_seats' ? 0 : paidSeats

  return {
    planTier: 'BASE',
    planName: 'Base',
    basePlanPrice: isLtd ? 0 : base,
    currentTeamMembersCount: usedSeats,
    pricePerTeamMember: perSeat,
    totalTeamMembersCost: paidSeats * perSeat,
    totalMonthlyCost: total,
    currency: (overrides.currency ?? 'eur').toUpperCase(),
    breakdown: [
      {
        description: 'Base Plan',
        quantity: 1,
        unitPrice: base,
        totalPrice: isLtd ? 0 : base,
      },
      {
        description: 'Team Seats',
        quantity: paidSeats,
        unitPrice: perSeat,
        totalPrice: paidSeats * perSeat,
      },
    ],
    paidSeats: isLtd ? ltdSeats : paidSeats,
    usedSeats,
    availableSeats: Math.max(0, paidSeats - usedSeats),
    numberOfLocations: overrides.numberOfLocations ?? 1,
    numberOfTeamMembers: overrides.numberOfTeamMembers ?? usedSeats,
    maxLocations: overrides.maxLocations ?? 5,
    maxTeamMembers: overrides.maxTeamMembers ?? paidSeats,
    scheduled,
    proratedSeatInfo,
    isLtd,
    ltdSince: isLtd ? '2025-01-01T00:00:00.000Z' : undefined,
    pendingPayment,
  }
}

export async function mockSubscriptionSummary(
  page: Page,
  state: BillingState = 'trial',
  overrides: SummaryOverrides = {},
): Promise<void> {
  const body = sampleSubscriptionSummary(state, overrides)
  await page.route('**/api/billing/subscription-summary', (route) =>
    json(route, 200, body),
  )
}

// ─────────────── Billing details (real-shape mock) ───────────────

export type BillingDetailsOverrides = {
  configured?: boolean
  entityType?: 'company' | 'person'
  legalName?: string | null
  fiscalCode?: string | null
  registrationNumber?: string | null
  billingAddress?: string | null
  billingCity?: string | null
  billingCounty?: string | null
  billingCountryCode?: string | null
  suggestionsBusinessName?: string | null
  suggestionsCountryCode?: string | null
  suggestionsFirstName?: string | null
  suggestionsLastName?: string | null
}

export function sampleBillingDetails(overrides: BillingDetailsOverrides = {}) {
  const configured = overrides.configured ?? false
  const type = overrides.entityType ?? (configured ? 'company' : null)
  return {
    billingDetails: {
      billingEntityType: type,
      legalName: overrides.legalName ?? (configured ? 'Acme Studio SRL' : null),
      fiscalCode: overrides.fiscalCode ?? (configured && type === 'company' ? 'RO12345678' : null),
      registrationNumber:
        overrides.registrationNumber ?? (configured && type === 'company' ? 'J40/1234/2020' : null),
      billingAddress: overrides.billingAddress ?? (configured ? 'Bd. Magheru 12' : null),
      billingCity: overrides.billingCity ?? (configured ? 'Bucharest' : null),
      billingCounty: overrides.billingCounty ?? (configured ? 'Bucharest' : null),
      billingCountryCode: overrides.billingCountryCode ?? (configured ? 'ro' : null),
      suggestions: {
        businessName: overrides.suggestionsBusinessName ?? 'E2E Test Salon',
        countryCode: overrides.suggestionsCountryCode ?? null,
        firstName: overrides.suggestionsFirstName ?? 'E2E',
        lastName: overrides.suggestionsLastName ?? 'Owner',
      },
    },
  }
}

export async function mockBillingDetails(
  page: Page,
  overrides: BillingDetailsOverrides = {},
): Promise<void> {
  const body = sampleBillingDetails(overrides)
  await page.route('**/api/business/billing-details', (route) => {
    if (route.request().method() === 'GET') {
      return json(route, 200, body)
    }
    return route.fallback()
  })
}

export async function mockUpdateBillingDetails(
  page: Page,
  options: { behavior?: 'success' | 'failure'; status?: number } = {},
): Promise<{ requests: PwRequest[] }> {
  const requests: PwRequest[] = []
  await page.route('**/api/business/billing-details', (route) => {
    const req = route.request()
    if (req.method() !== 'PUT') return route.fallback()
    requests.push(req)
    if (options.behavior === 'failure') {
      return json(route, options.status ?? 500, { message: 'Failed to save' })
    }
    return json(route, 200, { message: 'Saved' })
  })
  return { requests }
}

// ─────────────── Checkout endpoints ───────────────

export type CheckoutMockOptions = {
  url?: string
  status?: number
  errorMessage?: string
}

/**
 * Mocks one of the checkout-creating endpoints. Captures the requests so
 * tests can assert on the payload (seats / packageId / returnUrl).
 *
 * Important: the helper does NOT navigate to the returned URL. It returns a
 * stub URL on a fake host so the test can assert that the app initiated
 * navigation without it actually leaving the dev server.
 */
export async function mockCheckoutEndpoint(
  page: Page,
  endpoint:
    | '/api/billing/checkout'
    | '/api/billing/ltd-seats-checkout'
    | '/api/billing/customer-portal'
    | '/api/sms/checkout',
  options: CheckoutMockOptions = {},
): Promise<{ requests: PwRequest[] }> {
  const requests: PwRequest[] = []
  await page.route(`**${endpoint}`, (route) => {
    requests.push(route.request())
    if (options.status && options.status >= 400) {
      return json(route, options.status, { message: options.errorMessage ?? 'Failed' })
    }
    return json(route, 200, {
      url: options.url ?? `https://stripe.test${endpoint}/redirect-cs_test_${Date.now()}`,
    })
  })
  return { requests }
}

// ─────────────── Update seats ───────────────

export type UpdateSeatsResult =
  | { kind: 'success' }
  | { kind: 'requires_action'; clientSecret?: string }
  | { kind: 'redirect'; url?: string }
  | { kind: 'error'; status?: number; message?: string }

export async function mockUpdateSeats(
  page: Page,
  result: UpdateSeatsResult = { kind: 'success' },
): Promise<{ requests: PwRequest[] }> {
  const requests: PwRequest[] = []
  await page.route('**/api/billing/update-seats', (route) => {
    requests.push(route.request())
    switch (result.kind) {
      case 'success':
        return json(route, 200, { success: true })
      case 'requires_action':
        return json(route, 200, {
          requiresAction: true,
          clientSecret: result.clientSecret ?? 'pi_test_secret_xyz',
        })
      case 'redirect':
        return json(route, 200, {
          url: result.url ?? 'https://stripe.test/checkout/cs_test_redirect',
        })
      case 'error':
        return json(route, result.status ?? 500, {
          message: result.message ?? 'Failed to update seats',
        })
    }
  })
  return { requests }
}

// ─────────────── Subscription mutations ───────────────

export async function mockSubscriptionMutation(
  page: Page,
  options: {
    modifySubscription?: 'success' | { error: number }
    cancelRemoval?: 'success' | { error: number }
    abortPendingPayment?: 'success' | { error: number }
  } = {},
): Promise<{
  modifyRequests: PwRequest[]
  cancelRemovalRequests: PwRequest[]
  abortRequests: PwRequest[]
}> {
  const modifyRequests: PwRequest[] = []
  const cancelRemovalRequests: PwRequest[] = []
  const abortRequests: PwRequest[] = []

  await page.route('**/api/billing/modify-subscription**', (route) => {
    modifyRequests.push(route.request())
    const setting = options.modifySubscription ?? 'success'
    if (typeof setting === 'object') {
      return json(route, setting.error, { message: 'Failed' })
    }
    return json(route, 200, { success: true })
  })

  await page.route('**/api/billing/cancel-removal', (route) => {
    cancelRemovalRequests.push(route.request())
    const setting = options.cancelRemoval ?? 'success'
    if (typeof setting === 'object') {
      return json(route, setting.error, { message: 'Failed' })
    }
    return json(route, 200, { success: true })
  })

  await page.route('**/api/billing/abort-pending-payment', (route) => {
    abortRequests.push(route.request())
    const setting = options.abortPendingPayment ?? 'success'
    if (typeof setting === 'object') {
      return json(route, setting.error, { message: 'Failed' })
    }
    return json(route, 200, { success: true })
  })

  return { modifyRequests, cancelRemovalRequests, abortRequests }
}

// ─────────────── SMS endpoints ───────────────

export type SmsPackageOverrides = Partial<{
  id: number
  uuid: string
  name: string
  smsCount: number
  priceMinor: number
  currency: string
  isActive: boolean
}>

export function sampleSmsPackage(overrides: SmsPackageOverrides = {}) {
  return {
    id: 1,
    uuid: 'pkg-uuid-1',
    name: 'Starter',
    regionPricingId: 1,
    smsCount: 100,
    priceMinor: 5000,
    currency: 'eur',
    isActive: true,
    ...overrides,
  }
}

export const SAMPLE_SMS_PACKAGES = [
  sampleSmsPackage({ id: 1, name: 'Starter', smsCount: 100, priceMinor: 5000 }),
  sampleSmsPackage({ id: 2, name: 'Growth', smsCount: 500, priceMinor: 20000 }),
  sampleSmsPackage({ id: 3, name: 'Pro', smsCount: 1000, priceMinor: 35000 }),
]

export async function mockSmsApi(
  page: Page,
  options: {
    packages?: ReturnType<typeof sampleSmsPackage>[]
    smsCredits?: number
    smsTotalPurchased?: number
    smsTotalUsed?: number
    purchases?: Array<Record<string, unknown>>
  } = {},
): Promise<void> {
  const packages = options.packages ?? SAMPLE_SMS_PACKAGES
  const balance = {
    smsCredits: options.smsCredits ?? 0,
    smsTotalPurchased: options.smsTotalPurchased ?? 0,
    smsTotalUsed: options.smsTotalUsed ?? 0,
  }

  await page.route('**/api/sms/packages', (route) =>
    json(route, 200, { data: packages }),
  )
  await page.route('**/api/sms/balance', (route) =>
    json(route, 200, { data: balance }),
  )
  await page.route('**/api/sms/purchases**', (route) =>
    json(route, 200, {
      data: options.purchases ?? [],
      hasMore: false,
      nextCursor: undefined,
    }),
  )
}

// ─────────────── Business invoices ───────────────

export type InvoiceOverrides = Partial<{
  id: number
  invoiceType: 'subscription' | 'sms_purchase' | 'ltd_seats'
  status: 'success' | 'failed'
  amountMinor: number
  currency: string
  oblioLink: string | null
  oblioNumber: string | null
  oblioSeriesName: string | null
  createdAt: string
}>

export function sampleInvoice(overrides: InvoiceOverrides = {}) {
  return {
    id: 1,
    invoiceType: 'subscription' as const,
    status: 'success' as const,
    amountMinor: 1999,
    currency: 'eur',
    oblioLink: 'https://oblio.test/invoice/1',
    oblioNumber: '1',
    oblioSeriesName: 'ZAV',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

export async function mockBusinessInvoices(
  page: Page,
  invoices: ReturnType<typeof sampleInvoice>[] = [],
): Promise<void> {
  await page.route('**/api/billing/invoices**', (route) =>
    json(route, 200, {
      data: invoices,
      hasMore: false,
      nextCursor: undefined,
    }),
  )
}

// ─────────────── Stripe.js stub for inline 3DS ───────────────

/**
 * Installs a stub `window.Stripe` factory whose `confirmCardPayment` resolves
 * with the requested outcome. The dashboard calls `loadStripe()` from
 * `@stripe/stripe-js`, which checks `window.Stripe` first and reuses it if
 * present — so injecting via `addInitScript` (runs on every navigation,
 * before any page script) is more reliable than intercepting the script
 * fetch.
 *
 * Calls are recorded on `window.__e2eStripeCalls` so tests can assert via
 * `page.evaluate`.
 */
export async function mockStripeJs(
  page: Page,
  options: {
    confirmCardPaymentResult?:
      | { kind: 'success' }
      | { kind: 'error'; message?: string }
  } = {},
): Promise<void> {
  const outcome = options.confirmCardPaymentResult ?? { kind: 'success' }
  await page.addInitScript((result) => {
    ;(window as any).__e2eStripeCalls = []
    ;(window as any).Stripe = function () {
      return {
        confirmCardPayment: async (clientSecret: string) => {
          ;(window as any).__e2eStripeCalls.push({
            method: 'confirmCardPayment',
            clientSecret,
          })
          if (result.kind === 'error') {
            return { error: { message: result.message ?? 'Payment failed' } }
          }
          return {
            paymentIntent: { id: 'pi_test_succeeded', status: 'succeeded' },
          }
        },
      }
    }
  }, outcome)
  // Also block the real Stripe.js script in case loadStripe still tries to
  // fetch it (e.g. on a page navigation that resets window.Stripe).
  await page.route(/https:\/\/js\.stripe\.com\/.*/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '/* stub-stripe-js: window.Stripe is provided via addInitScript */',
    }),
  )
}

/**
 * Convenience: mock every billing endpoint with safe, empty defaults so the
 * page renders without 404s. Tests typically override one or two endpoints
 * after this with more specific responses.
 */
export async function mockBillingDefaults(
  page: Page,
  options: {
    state?: BillingState
    summary?: SummaryOverrides
    billingDetails?: BillingDetailsOverrides
    invoices?: ReturnType<typeof sampleInvoice>[]
    smsPackages?: ReturnType<typeof sampleSmsPackage>[]
    smsCredits?: number
    smsTotalPurchased?: number
    smsTotalUsed?: number
  } = {},
): Promise<void> {
  await mockSubscriptionSummary(page, options.state ?? 'trial', options.summary ?? {})
  await mockBillingDetails(page, options.billingDetails ?? {})
  await mockBusinessInvoices(page, options.invoices ?? [])
  await mockSmsApi(page, {
    packages: options.smsPackages,
    smsCredits: options.smsCredits,
    smsTotalPurchased: options.smsTotalPurchased,
    smsTotalUsed: options.smsTotalUsed,
  })
}
