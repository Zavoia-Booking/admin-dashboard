# Business Dashboard - SMS Module API

Base URL: `/sms`

All endpoints require **business owner authentication** (JWT + OWNER role).

---

## Overview

The SMS module allows business owners to:
1. **View available SMS packages** - Localized to their country/region
2. **Check their SMS balance** - Credits remaining, total purchased, total used
3. **Purchase SMS packages** - Redirect to Stripe Checkout
4. **View purchase history** - Past completed purchases

### Localized Pricing

Packages are **automatically filtered by the business's country**. The business entity has a `countryCode` field (ISO 3166-1 alpha-2, e.g., "ro", "de") that determines which region's packages they see.

- If `countryCode` is not set → empty packages list
- If `countryCode` has no matching region → empty packages list
- Otherwise → only packages for that region are returned

---

## TypeScript Interfaces

```typescript
// Region pricing - defines per-SMS costs for a group of countries
interface SmsRegionPricing {
  id: number;
  uuid: string;
  name: string;                    // e.g., "Romania", "Western Europe"
  countryCodes: string[];          // e.g., ["ro"], ["de", "fr", "es"]
  currency: string;                // e.g., "eur"
  baseCost: number;                // Base cost per SMS (e.g., 0.0800)
  vatPercent: number;              // VAT percentage (e.g., 19.00)
  mobileFeePercent: number;        // Mobile carrier fee % (e.g., 5.00)
  stripeFeePercent: number;        // Stripe fee % (e.g., 2.90)
  stripeFeeFixed: number;          // Fixed Stripe fee (e.g., 0.25)
  finalPricePerSms: number;        // Final price per SMS (e.g., 0.1500)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// SMS package with computed discount info
interface SmsPackageWithDiscount {
  id: number;
  uuid: string;
  name: string;                    // e.g., "100 SMS Pack", "Business Pack"
  regionPricingId: number;
  smsCount: number;                // Number of SMS in package (e.g., 100, 500)
  priceMinor: number;              // Actual price in cents (e.g., 1500 = €15)
  fullPriceMinor: number;          // Full price without discount (e.g., 1800 = €18)
  discountPercent: number | null;  // Discount % if any (e.g., 10, 20, null)
  currency: string;                // e.g., "eur"
  isActive: boolean;
}

// Business SMS balance info
interface BusinessSmsInfo {
  smsCredits: number;              // Available SMS credits
  smsTotalPurchased: number;       // Total SMS ever purchased
  smsTotalUsed: number;            // Total SMS ever used
}

// Purchase record
interface SmsPurchase {
  id: number;
  businessId: number;
  packageId: number;
  smsQuantity: number;             // SMS purchased
  totalAmountMinor: number;        // Amount paid in cents
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: Date;
}

// Paginated purchases response
interface PaginatedPurchases {
  data: SmsPurchase[];
  hasMore: boolean;
  nextCursor?: number;             // Use as cursor param for next page
}

// Checkout session response
interface CheckoutResponse {
  url: string;                     // Stripe Checkout URL - redirect user here
}

// Packages response (includes region info)
interface PackagesResponse {
  data: SmsPackageWithDiscount[];
  region: SmsRegionPricing | null; // The region for this business (null if not set)
}
```

---

## API Endpoints

### GET `/sms/packages`

Get SMS packages available for the business's country/region.

**Use case:** Display packages for purchase. Automatically filtered by business's `countryCode`.

**Response:**
```typescript
{
  data: SmsPackageWithDiscount[];
  region: SmsRegionPricing | null;
}
```

**Example Response (business has countryCode = "ro"):**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "pkg-100",
      "name": "100 SMS Pack",
      "regionPricingId": 1,
      "smsCount": 100,
      "priceMinor": 1500,
      "fullPriceMinor": 1500,
      "discountPercent": null,
      "currency": "eur",
      "isActive": true
    },
    {
      "id": 2,
      "uuid": "pkg-500",
      "name": "500 SMS Pack",
      "regionPricingId": 1,
      "smsCount": 500,
      "priceMinor": 6000,
      "fullPriceMinor": 7500,
      "discountPercent": 20,
      "currency": "eur",
      "isActive": true
    }
  ],
  "region": {
    "id": 1,
    "uuid": "abc-123",
    "name": "Romania",
    "countryCodes": ["ro"],
    "currency": "eur",
    "finalPricePerSms": 0.15,
    ...
  }
}
```

**Example Response (business has no countryCode set):**
```json
{
  "data": [],
  "region": null
}
```

**UI Handling:**
- If `region` is `null`, show message: "Please set your country in settings to view SMS packages"
- If `data` is empty but `region` exists, show: "No packages available for your region yet"

---

### GET `/sms/balance`

Get the business's current SMS balance.

**Use case:** Show remaining credits in dashboard header or SMS settings page.

**Response:**
```typescript
{
  data: BusinessSmsInfo
}
```

**Example Response:**
```json
{
  "data": {
    "smsCredits": 347,
    "smsTotalPurchased": 500,
    "smsTotalUsed": 153
  }
}
```

---

### POST `/sms/checkout`

Create a Stripe Checkout session for purchasing an SMS package.

**Use case:** User clicks "Buy" on a package, redirect them to Stripe.

**Request Body:**
```typescript
{
  packageId: number;     // Required - ID of package to purchase
  successUrl: string;    // Required - URL to redirect after successful payment
  cancelUrl: string;     // Required - URL to redirect if user cancels
}
```

**Example Request:**
```json
{
  "packageId": 2,
  "successUrl": "https://app.example.com/sms/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://app.example.com/sms/packages"
}
```

**Response:**
```typescript
{
  url: string  // Stripe Checkout URL
}
```

**Example Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Flow:**
1. Call this endpoint with packageId and redirect URLs
2. Redirect user to the returned `url`
3. User completes payment on Stripe
4. Stripe redirects to `successUrl` or `cancelUrl`
5. Webhook automatically credits SMS to business

**Errors:**
- `404` - Package not found or inactive

---

### GET `/sms/purchases`

Get paginated purchase history (completed purchases only).

**Use case:** Show transaction history in SMS settings.

**Query Parameters:**
- `limit` (optional, number) - Items per page, default 20, max 100
- `cursor` (optional, number) - Cursor for pagination (previous `nextCursor`)

**Response:**
```typescript
{
  data: SmsPurchase[];
  hasMore: boolean;
  nextCursor?: number;
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 45,
      "businessId": 123,
      "packageId": 2,
      "smsQuantity": 500,
      "totalAmountMinor": 6000,
      "currency": "eur",
      "status": "completed",
      "stripeCheckoutSessionId": "cs_test_...",
      "stripePaymentIntentId": "pi_...",
      "createdAt": "2024-01-20T14:30:00Z"
    }
  ],
  "hasMore": true,
  "nextCursor": 44
}
```

**Pagination Example:**
```typescript
// First page
const page1 = await fetch('/sms/purchases?limit=10');
// { data: [...], hasMore: true, nextCursor: 35 }

// Next page
const page2 = await fetch('/sms/purchases?limit=10&cursor=35');
// { data: [...], hasMore: false }
```

---

## UI Components Suggested

### 1. SMS Balance Card
Display in dashboard or settings header:
```
┌─────────────────────────────────┐
│  SMS Credits: 347               │
│  ─────────────────────────────  │
│  Used: 153  |  Total: 500       │
│                    [Buy More →] │
└─────────────────────────────────┘
```

### 2. Package Selection (with region info)
Show region name at top, then packages:
```
┌─────────────────────────────────────────────────────────┐
│  📍 SMS Pricing for: Romania                            │
│     Price per SMS: €0.15                                │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   100 SMS Pack   │  │   200 SMS Pack   │  │   500 SMS Pack   │
│                  │  │      ┌─────┐     │  │     ┌──────┐     │
│     €15.00       │  │  €27 │ -10%│     │  │ €60 │ -20% │     │
│                  │  │      └─────┘     │  │     └──────┘     │
│                  │  │   was €30.00     │  │   was €75.00     │
│     [Buy Now]    │  │     [Buy Now]    │  │     [Buy Now]    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 3. No Region Set State
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  Country Not Set                                    │
│                                                         │
│  Please set your country in Business Settings to        │
│  view available SMS packages.                           │
│                                                         │
│                    [Go to Settings →]                   │
└─────────────────────────────────────────────────────────┘
```

### 4. Purchase History Table
```
┌────────────────┬──────────┬──────────┬─────────────────┐
│ Date           │ Package  │ SMS      │ Amount          │
├────────────────┼──────────┼──────────┼─────────────────┤
│ Jan 20, 2024   │ 500 Pack │ 500      │ €60.00          │
│ Jan 5, 2024    │ 100 Pack │ 100      │ €15.00          │
│ Dec 15, 2023   │ 200 Pack │ 200      │ €27.00          │
└────────────────┴──────────┴──────────┴─────────────────┘
                                        [Load More]
```

---

## Helper Functions

```typescript
// Format price from minor units (cents) to display
function formatPrice(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(minorUnits / 100);
}

// Example: formatPrice(1500, 'eur') → "€15.00"

// Calculate savings
function calculateSavings(priceMinor: number, fullPriceMinor: number): number {
  return fullPriceMinor - priceMinor;
}

// Example: calculateSavings(6000, 7500) → 1500 (€15 saved)
```

---

## Error Codes

| Code | Description |
|------|-------------|
| SMS.E04 | Package not found |
| SMS.E10 | Internal server error |
| SMS.E11 | Country code not found in any region |
