# Subscription System Documentation

## Overview

The subscription system controls access to the platform based on a business's subscription status. It works through a coordinated system of **backend entitlements**, **API guards**, and **frontend gates** to ensure users cannot access features when their subscription is not active.

---

## 1. Subscription Statuses

The system recognizes five subscription statuses:

### **1.1 Trial Status**
- **State**: `trialEndsAt` field is set to a future date
- **Duration**: 14 days from business creation
- **Access**: Full access allowed
- **Marketplace**: Listing is visible
- **Reminders**: Sent normally
- **When Trial Ends**: User loses all write access; listing becomes hidden

### **1.2 Active Status**
- **State**: Subscription exists with `status = 'active'` in the Stripe subscription record
- **Duration**: From subscription start until cancellation or expiry
- **Access**: Full read and write access
- **Marketplace**: Listing is visible
- **Reminders**: Sent normally
- **Trigger**: User completes checkout and Stripe sends `checkout.session.completed` webhook

### **1.3 Past Due Status**
- **State**: Subscription exists with `status = 'past_due'` or `status = 'unpaid'`
- **Duration**: After first payment failure; Stripe retries for ~3-4 days before moving to unpaid
- **Access**: Read-only (can view data but cannot create/edit/delete)
- **Marketplace**: Listing is hidden
- **Reminders**: Not sent
- **UI Blocking**: Full-screen "Payment Issue" overlay with softer messaging
- **Trigger**: Payment fails and Stripe sends `invoice.payment_failed` or `customer.subscription.updated` webhook

### **1.4 Canceled Status**
- **State**: Subscription exists with `status = 'canceled'`
- **Duration**: After cancellation until the billing period ends (grace period)
- **Access**: Full access during grace period; read-only after period ends
- **Marketplace**: Listing is hidden immediately upon cancellation
- **Reminders**: Not sent
- **Trigger**: User initiates cancellation or Stripe sends `customer.subscription.deleted` webhook

### **1.5 No Subscription / Expired Status**
- **State**: No active subscription and trial has ended (`trialEndsAt` is in the past)
- **Duration**: Indefinite until user reactivates subscription
- **Access**: Read-only (can view data but cannot create/edit/delete)
- **Marketplace**: Listing is hidden
- **Reminders**: Not sent
- **UI Blocking**: Full-screen "Subscription Required" overlay
- **Trigger**: Trial expires or subscription is fully canceled and grace period ends

---

## 2. How Subscriptions Flow (Lifecycle)

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Business Creation (Wizard)                          │
├─────────────────────────────────────────────────────────────┤
│ • New business created with 14-day trial                    │
│ • business.trialEndsAt = now + 14 days                      │
│ • Cloud Task scheduled for trial expiry check               │
│ • Status: TRIAL (entitled=true)                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2a: During Trial (Days 1-14)                           │
├─────────────────────────────────────────────────────────────┤
│ • User has full access                                      │
│ • Marketplace listing is visible                            │
│ • Appointment reminders are sent                            │
│ • User sees trial countdown in billing settings             │
└─────────────────────────────────────────────────────────────┘
                    ↙                  ↓
        [User Upgrades]      [Trial Expires Day 14]
            ↓                         ↓
    ┌──────────────────┐    ┌──────────────────────┐
    │ STEP 2b: Checkout│    │ STEP 3: Trial Expired│
    ├──────────────────┤    ├──────────────────────┤
    │ User clicks      │    │ Cloud Task fires at  │
    │ "Upgrade Plan"   │    │ trial expiry time    │
    │ Stripe checkout  │    │ Check entitlement    │
    │ initiated        │    │ No active sub? Hide  │
    │                  │    │ listing              │
    └──────────────────┘    └──────────────────────┘
            ↓
    ┌──────────────────────┐
    │ STEP 4: Subscription │
    │ Activated            │
    ├──────────────────────┤
    │ checkout.session.    │
    │ completed fires      │
    │ Subscription created │
    │ with status=active   │
    │ business.trialEndsAt │
    │ = null               │
    │ Status: ACTIVE       │
    │ (entitled=true)      │
    └──────────────────────┘
            ↓
    ┌──────────────────────┐
    │ STEP 5a: Active Sub  │
    │ (Payment Success)    │
    ├──────────────────────┤
    │ • Full access        │
    │ • Marketplace visible│
    │ • Reminders sent     │
    │ • Can manage listing │
    └──────────────────────┘
        ↙           ↓           ↖
    [Cancel]  [Ongoing]  [Payment Fails]
      ↓                         ↓
    ┌──────────────────┐   ┌──────────────────────┐
    │ STEP 5b: Cancel  │   │ STEP 5c: Payment     │
    │ Subscription     │   │ Failed               │
    ├──────────────────┤   ├──────────────────────┤
    │ User clicks      │   │ invoice.payment_     │
    │ "Cancel"         │   │ failed fires OR      │
    │ Set cancelAtEnd  │   │ subscription.updated │
    │ = true           │   │ with status=past_due │
    │ Listing hidden   │   │ Listing hidden       │
    │ Read-only until  │   │ Read-only access     │
    │ period ends      │   │ Status: PAST_DUE     │
    │ Status: CANCELED │   │ (entitled=false)     │
    │ (grace period)   │   │ UI blocked with      │
    │ (entitled=true)  │   │ "Payment Issue"      │
    └──────────────────┘   └──────────────────────┘
            ↓                       ↓
    [Grace period ends]    [User fixes payment OR
    OR [Subscription           Stripe gives up after
        deleted]              ~4 days]
            ↓                       ↓
    ┌──────────────────┐   ┌──────────────────────┐
    │ STEP 6: Expired  │   │ STEP 4 (again):      │
    │ No Subscription  │   │ Subscription becomes │
    │                  │   │ active after payment │
    ├──────────────────┤   │ received             │
    │ Read-only access │   │ OR                   │
    │ Listing hidden   │   │                      │
    │ Reminders blocked│   │ STEP 6: If payment   │
    │ Status: EXPIRED/ │   │ never received,      │
    │ NO_SUBSCRIPTION  │   │ subscription becomes │
    │ (entitled=false) │   │ unpaid → canceled    │
    │ UI blocked with  │   │ → expired            │
    │ "Subscription    │   │                      │
    │ Required"        │   │ Status: EXPIRED      │
    │                  │   │ (entitled=false)     │
    └──────────────────┘   └──────────────────────┘
            ↓                       ↓
    [User reactivates]  [User reactivates]
            ↓                       ↓
    └─────────────────────────────┘
               ↓
         STEP 4: Subscription
         Activated (repeat)
```

---

## 3. Entitlement Computation

The system computes entitlements in `EntitlementsService.isBusinessEntitled()`:

```typescript
// Returns: EntitlementCheck {
//   entitled: boolean,
//   status: 'trial' | 'active' | 'expired' | 'no_subscription' | 'past_due',
//   reason?: string,
//   daysRemaining?: number
// }

const entitlement = entitlementsService.isBusinessEntitled(business);
```

**Logic**:
1. Check if `trialEndsAt > now` → return `{ entitled: true, status: 'trial' }`
2. Check if any subscription has `status === 'ACTIVE'` → return `{ entitled: true, status: 'active' }`
3. Check if any subscription has `status === 'PAST_DUE' || 'UNPAID'` → return `{ entitled: false, status: 'past_due' }`
4. Otherwise → return `{ entitled: false, status: 'expired' | 'no_subscription' }`

**Used By**:
- API Guards (blocking writes)
- Frontend Guards (showing locks/overlays)
- Reminder Service (skipping sends)
- Marketplace listing visibility logic

---

## 4. Backend Guards (admin-api)

### **4.1 SubscriptionGuard**
**Location**: `src/guards/subscription.guard.ts`

**Applied To**: All major controllers (marketplace, locations, services, calendar, etc.)

**Behavior**:

| Entitlement State | GET/HEAD/OPTIONS | POST/PUT/DELETE | With @AllowExpiredWrite |
|---|---|---|---|
| Trial (entitled) | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Active (entitled) | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Canceled (in grace) | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Canceled (past grace) | ✅ Allowed | ❌ 403 Forbidden | ✅ Allowed |
| Past Due / Unpaid | ✅ Allowed | ❌ 403 Forbidden | ✅ Allowed |
| Expired / No Sub | ✅ Allowed | ❌ 403 Forbidden | ✅ Allowed |

**@AllowExpiredWrite Decorator**:
- Routes marked with `@AllowExpiredWrite()` allow writes even when subscription is expired
- Used for: Stripe checkout endpoint (users need to renew even when expired)
- Examples: `POST /billing/checkout`, marketplace listing visibility updates

**How It Works**:
1. Extracts user's business from JWT
2. Calls `EntitlementsService.isBusinessEntitled()`
3. Checks HTTP method (GET = read, POST/PUT/DELETE = write)
4. If read-only → always allow
5. If write and not entitled:
   - Check if in grace period (subscription canceled but period hasn't ended) → allow
   - Otherwise → throw 403 Forbidden

**Sets on request.entitlement**:
```typescript
request.entitlement = {
  entitled: boolean,
  status: 'trial' | 'active' | 'expired' | 'no_subscription' | 'past_due',
  reason?: string,
  daysRemaining?: number
}
```

**Controllers can use**:
```typescript
@Post('publish')
@SubscriptionGuard
@AllowExpiredWrite()
async publishListing(@Req() req: any) {
  const { entitlement } = req; // Can read subscription status
  if (entitlement.status === 'past_due') {
    // Soft warning
  }
}
```

---

## 5. Frontend Guards (admin-dashboard)

### **5.1 SubscriptionGate (Global Overlay)**
**Location**: `src/shared/components/common/subscription/SubscriptionGate.tsx`

**Level**: Route-level (applies globally to all protected pages)

**Placement**: In `App.tsx` after all route definitions; rendered as global overlay

**Behavior**:

**Shows For**:
- `OWNER` role users only
- When `entitlements.entitled === false`
- All non-entitled statuses: `expired`, `no_subscription`, `past_due`, `canceled` (past period end)

**Does NOT Show For**:
- `TEAM_MEMBER` or `DASHBOARD_USER` roles
- When `entitled === true` (trial or active)
- On routes: `/settings/*`, `/info`, `/welcome`

**Visual Variants**:

**Variant A: "Subscription Required"** (for `expired`, `no_subscription`, `canceled`)
```
┌────────────────────────────────┐
│        🔒 (red icon)            │
│  Subscription Required          │
│  Page Access Unavailable        │
├────────────────────────────────┤
│ Your subscription is not active.│
│ To regain access to your        │
│ business data, please manage    │
│ your subscription.              │
├────────────────────────────────┤
│ [Manage Subscription] (red btn) │
├────────────────────────────────┤
│ All your data is safe and will  │
│ be restored once you renew.     │
└────────────────────────────────┘
```

**Variant B: "Payment Issue"** (for `past_due`)
```
┌────────────────────────────────┐
│    💳 (amber icon)              │
│  Payment Issue                  │
│  Payment Retrying               │
├────────────────────────────────┤
│ Your payment method is being    │
│ retried. Update your payment    │
│ information to restore full     │
│ access to your business.        │
├────────────────────────────────┤
│ [Update Payment Method] (amber) │
├────────────────────────────────┤
│ All your data is safe and will  │
│ be restored once you update.    │
└────────────────────────────────┘
```

**Z-Index**: `z-[200]` (sits above all page content)

**Implementation**:
```typescript
// SubscriptionGate reads from Redux
const currentUser = useSelector(selectCurrentUser);
const { pathname } = useLocation();

// Returns null (shows nothing) for:
// - No user data
// - TEAM_MEMBER or DASHBOARD_USER role
// - Entitled users (trial or active)
// - Routes: /settings, /info, /welcome

// Otherwise renders full-screen overlay with variant based on entitlement.status
if (entitlements.status === 'past_due') {
  return <PaymentIssueVariant />;
} else {
  return <SubscriptionRequiredVariant />;
}
```

### **5.2 AccessGuard (Per-Page Fallback)**
**Location**: `src/shared/components/guards/AccessGuard.tsx`

**Level**: Page-level (applied inside individual page components)

**Applied To**:
- Dashboard
- Team Members
- Customers
- Marketplace
- Assignments
- Notifications
- Support

**Behavior**:

**Shows For**:
- When `entitlements.entitled === false`
- Statuses: `expired`, `no_subscription`, `past_due`, `canceled`
- Replaces entire page content with lock screen

**Does NOT Show For**:
- `DASHBOARD_USER` role (they have no business)
- When `entitled === true`

**Visual Output**:
```
┌────────────────────────────────┐
│        🔒 (red icon)            │
│  Subscription Required          │
│  Page Access Unavailable        │
├────────────────────────────────┤
│ Your subscription is not active.│
│ ...                             │
│ [Manage Subscription]           │
└────────────────────────────────┘
```

**Props**:
```typescript
<AccessGuard
  showBanner={false}           // Show warning banner above content
  fallback={<CustomUI />}      // Custom UI if not entitled
  redirectTo="/settings?tab=billing"  // Where to send "Manage" clicks
>
  <YourPageContent />
</AccessGuard>
```

**Usage Example**:
```tsx
export default function CustomersPage() {
  return (
    <AccessGuard>
      <AppLayout>
        <div className="space-y-6">
          {/* Your page content only shows if entitled */}
          <CustomerList />
        </div>
      </AppLayout>
    </AccessGuard>
  );
}
```

**Hook for Programmatic Checks**:
```typescript
const { isEntitled, status, isExpiredTrial, isCancelledSubscription } = useAccessControl();

if (isExpiredTrial) {
  return <TrialExpiredMessage />;
}
```

---

## 6. Redundant Defense Layers

The system uses **three layers** of defense to prevent unauthorized access:

### **Layer 1: API Guard (Backend)**
- **Guard**: `SubscriptionGuard` on controllers
- **Behavior**: Blocks POST/PUT/DELETE operations at API level
- **Fallback**: Returns 403 Forbidden error
- **Cannot be bypassed**: Direct API calls to expired subscriptions fail

### **Layer 2: Global Overlay (Frontend)**
- **Guard**: `SubscriptionGate` global component
- **Behavior**: Shows full-screen overlay blocking all UI
- **Fallback**: User can only click "Manage Subscription" button
- **Benefit**: Immediate visual feedback; doesn't require page navigation

### **Layer 3: Per-Page Guard (Frontend)**
- **Guard**: `AccessGuard` on individual pages
- **Behavior**: Replaces page content with lock screen
- **Fallback**: Secondary defense if global overlay is somehow bypassed
- **Benefit**: Belt-and-suspenders; ensures even single pages are protected

**Example Flow**:
```
User with expired subscription tries to create a new service:

1. Global SubscriptionGate overlay shows immediately (Layer 2)
   User cannot see the form

2. If overlay is somehow dismissed/bypassed:
   AccessGuard on services page shows lock (Layer 3)
   Page content replaced with "Subscription Required"

3. If user somehow reaches API directly (e.g., fetch request):
   SubscriptionGuard rejects the POST request (Layer 1)
   Returns 403 Forbidden
```

---

## 7. Marketplace Listing Visibility Control

When subscription changes, marketplace listing visibility is updated:

### **When Listing is Hidden**:
1. **Subscription deleted** (`customer.subscription.deleted` webhook)
   - Calls `hideListingOnExpiry(businessId)`
   - Sets `listing.isVisible = false`

2. **Payment fails** (`invoice.payment_failed` webhook)
   - Calls `hideListingOnExpiry(businessId)`
   - Sets `listing.isVisible = false`

3. **Subscription becomes past_due/unpaid** (`customer.subscription.updated` webhook)
   - Calls `hideListingOnExpiry(businessId)`
   - Sets `listing.isVisible = false`

4. **Trial expires** (Cloud Task fires at `trialEndsAt`)
   - Webhook `POST /webhooks/trial-expiry` fires
   - Calls `hideListingOnExpiry(businessId)`
   - Sets `listing.isVisible = false`

### **When Listing is Shown Again**:
- User reactivates subscription
- Listing must be republished manually via `POST /publish`
- New subscription makes listing eligible again

### **Note on `isVisible` vs `isListed`**:
- `isVisible`: Controls marketplace visibility (can toggle via API)
- `isListed`: Permanent published state (can only be set via publish flow)
- `hideListingOnExpiry()` only sets `isVisible = false`
- Listing remains `isListed = true` so it can be shown again after renewal

---

## 8. Appointment Reminders Control

The `ReminderService.processReminder()` checks entitlement before sending:

```typescript
// When a reminder is about to be sent:
const business = await this.entitlementsService.getBusiness(eventId.businessId);
const entitlement = this.entitlementsService.isBusinessEntitled(business);

if (!entitlement.entitled) {
  // Skip sending reminder and mark as done
  this.logger.log(`Skipping reminder: subscription not active (${entitlement.status})`);
  await this.markEventDone(eventId);
  return { success: true, reason: 'subscription_expired' };
}

// Otherwise send via SMS/push normally
```

**Result**:
- Reminders NOT sent for: `expired`, `no_subscription`, `past_due`, `canceled` (past grace)
- Reminders ARE sent for: `trial`, `active`, `canceled` (during grace)
- Saves SMS costs when users are not paying

---

## 9. Redux State & Data Flow

### **Redux Stores**:

**Auth Slice** (`src/features/auth/reducer.ts`):
```typescript
state.auth.user = {
  // ... other fields ...
  subscription: {
    status: string | null,           // Stripe status (active, canceled, etc.)
    planTier: string | null,
    planName: string | null,
    currentPeriodEnd: string | null,
    cancelAtPeriodEnd: boolean,
    trialEndsAt: string | null       // When trial ends (or null if active sub)
  },
  entitlements: {
    entitled: boolean,               // Main gate: true/false
    status: 'trial' | 'active' | 'expired' | 'no_subscription' | 'past_due' | null,
    reason?: string,
    daysRemaining: number,
    maxLocations: number,
    maxTeamMembers: number,
    paidTeamSeats: number
  }
}
```

**Settings Slice** (`src/features/settings/reducer.ts`):
```typescript
state.settings.subscriptionSummary = {
  paidSeats: number,
  usedSeats: number,
  availableSeats: number,
  basePlanPrice: number,
  pricePerTeamMember: number,
  totalMonthlyCost: number,
  breakdown: { ... },
  scheduled: { ... }
}
```

### **Data Flow**:
```
1. User logs in
   ↓
2. GET /auth/me called
   ↓
3. Backend computes entitlements
   business.trialEndsAt, subscriptions[]
   ↓
   EntitlementsService.isBusinessEntitled()
   ↓
4. Returns: { entitled, status, daysRemaining, ... }
   ↓
5. Stored in Redux: state.auth.user.entitlements
   ↓
6. Components read via:
   - selectCurrentUser hook
   - useAccessControl hook
   ↓
7. SubscriptionGate checks entitlements.entitled
   ↓
8. AccessGuard checks entitlements.status
   ↓
9. API calls check user permissions in request.entitlement
```

---

## 10. Common Scenarios & Outcomes

### **Scenario 1: User in Trial, Clicks "Upgrade"**
```
Trial Day 10
User: "I want to subscribe now"
  ↓
Frontend: Navigate to /settings?tab=billing
  ↓
User clicks: "Upgrade Plan"
  ↓
Stripe Checkout modal opens
  ↓
User: Completes payment
  ↓
Stripe: Fires checkout.session.completed webhook
  ↓
Backend:
  - Creates new Subscription record (status=active)
  - Updates business.stripeSubscriptionId
  - Sets business.trialEndsAt = null
  ↓
Frontend: GET /auth/me called
  ↓
Entitlements recomputed:
  - entitlements.entitled = true
  - entitlements.status = 'active'
  ↓
Result: SubscriptionGate overlay disappears
  User has full access
  Marketplace listing stays visible
  Reminders continue to send
```

### **Scenario 2: Trial Expires Without Upgrade**
```
Trial Day 14, 23:59:59
User hasn't upgraded
  ↓
Cloud Task scheduled at trialEndsAt fires
  ↓
Backend: POST /webhooks/trial-expiry called
  ↓
Endpoint checks:
  - business.id = 123
  - entitlement = isBusinessEntitled(business)
  - entitlement.entitled = false (no active sub, trial is over)
  ↓
Calls: marketplaceListingService.hideListingOnExpiry(123)
  - Sets listing.isVisible = false
  ↓
Next time user visits any page:
  ↓
ProtectedRoute: GET /auth/me called
  ↓
Entitlements recomputed:
  - entitlements.entitled = false
  - entitlements.status = 'expired'
  ↓
Result: SubscriptionGate shows "Subscription Required" overlay
  User cannot see any page content
  Marketplace listing is hidden
  Reminders will not send
```

### **Scenario 3: Payment Fails During Active Subscription**
```
User: Active subscription
Stripe: Charges card each month on due date
Month 2: Card declined → payment fails
  ↓
Stripe: Fires invoice.payment_failed webhook
  ↓
Backend logs failure
  ↓
Stripe: Automatically retries payment (3-4 days)
  ↓
Meanwhile, Stripe: Fires customer.subscription.updated
  - status: 'past_due'
  ↓
Backend:
  - Updates Subscription record (status=past_due)
  - Calls hideListingOnExpiry() → listing.isVisible = false
  ↓
Next time user visits any page:
  ↓
GET /auth/me called
  ↓
Entitlements recomputed:
  - entitlements.entitled = false
  - entitlements.status = 'past_due'
  ↓
Result: SubscriptionGate shows "Payment Issue" overlay
  Message: "Your payment is being retried..."
  Button: "Update Payment Method"
  User can access /settings?tab=billing to update payment
  Marketplace listing is hidden
  Reminders will not send
```

### **Scenario 4: User Cancels Active Subscription**
```
User: Active subscription
User: Clicks "Cancel Subscription" in /settings?tab=billing
  ↓
Frontend: POST /billing/modify-subscription?action=cancel
  ↓
Backend: Updates Stripe subscription
  - Stripe sets: cancel_at_period_end = true
  - Subscription stays active until billing period ends
  ↓
Backend:
  - Updates Subscription record
  - Sets cancelAtPeriodEnd = true
  ↓
Result:
  - entitlements.entitled = true (still in period)
  - User has read & write access until period end
  - Marketplace listing is hidden
  - Reminders continue to send
  ↓
User sees: "Subscription will cancel on [date]"
           "Keep Subscription" button to undo
  ↓
[Billing period end date arrives]
  ↓
Stripe: Fires customer.subscription.deleted webhook
  ↓
Backend: Sets subscription.status = 'canceled'
  ↓
Next time user visits:
  ↓
Entitlements recomputed:
  - entitlements.entitled = false
  - entitlements.status = 'expired'
  ↓
Result: SubscriptionGate shows "Subscription Required" overlay
```

---

## 11. Troubleshooting

### **User sees overlay but should have active sub**
1. Check `business.subscriptions` table for active subscription
2. Verify `subscription.status = 'ACTIVE'`
3. Check `business.plan_id` is set (not null)
4. Call `GET /auth/me` to verify entitlements are computed correctly
5. Check Redux state: `entitlements.entitled` should be `true`

### **Marketplace listing is visible but shouldn't be**
1. Check `subscription` status in database
2. Verify `POST /webhooks/trial-expiry` or `POST /webhooks/eod-status-check` webhook was called
3. Check `marketplace_listing.is_visible` field (should be `false`)
4. If still visible, run manual query: `UPDATE marketplace_listing SET is_visible = false WHERE business_id = X`

### **Reminders are still being sent**
1. Check `ReminderService.processReminder()` logs
2. Verify entitlements check is working: `entitlements.entitled` should be `false`
3. Check if subscription status is actually `ACTIVE` (reminders do send in this case)
4. Verify `business.subscriptions` relation is loaded with all records

### **User can access write endpoints despite expired sub**
1. Verify `SubscriptionGuard` is applied to the controller
2. Check if endpoint has `@AllowExpiredWrite()` decorator (intentional for billing endpoints)
3. Verify `subscription.currentPeriodEnd` is in the past
4. Check logs: SubscriptionGuard should throw 403 Forbidden

---

## 12. Configuration & Environment

### **Backend .env.local**:
```env
# Cloud Tasks for trial expiry checking
TRIAL_EXPIRY_WEBHOOK_URL=https://api-staging.zavoia.com/webhooks/trial-expiry
CLOUD_TASKS_SERVICE_ACCOUNT=cr-zavoia-api@project-id.iam.gserviceaccount.com
```

### **Frontend (No env needed)**:
- Entitlements fetched from `GET /auth/me`
- Computed automatically by `SubscriptionGate` and `AccessGuard`

---

## 13. Summary Table

| User State | Reads | Writes | Marketplace | Reminders | UI Status |
|---|---|---|---|---|---|
| **Trial (0-14 days)** | ✅ | ✅ | Visible | ✅ Sent | Normal |
| **Active Sub** | ✅ | ✅ | Visible | ✅ Sent | Normal |
| **Canceled (Grace)** | ✅ | ✅ | Hidden | ❌ Not Sent | Normal |
| **Canceled (Expired)** | ✅ | ❌ | Hidden | ❌ Not Sent | Locked |
| **Past Due / Unpaid** | ✅ | ❌ | Hidden | ❌ Not Sent | Payment Issue |
| **Trial Expired** | ✅ | ❌ | Hidden | ❌ Not Sent | Locked |
| **No Subscription** | ✅ | ❌ | Hidden | ❌ Not Sent | Locked |

---

## 14. Related Files

### **Backend (admin-api)**
- `src/entities/business.entity.ts` - Business subscription fields
- `src/entities/subscription.entity.ts` - Subscription entity
- `src/modules/entitlements/entitlements.service.ts` - Core entitlement logic
- `src/guards/subscription.guard.ts` - API endpoint guard
- `src/modules/billing/billing.service.ts` - Webhook handlers
- `src/modules/notifications/reminder.service.ts` - Reminder checks
- `src/modules/marketplace-listing/marketplace-listing.service.ts` - Listing visibility

### **Frontend (admin-dashboard)**
- `src/features/auth/types.ts` - Entitlements type definition
- `src/features/auth/selectors.ts` - Redux selectors
- `src/features/auth/reducer.ts` - Auth state management
- `src/shared/components/common/subscription/SubscriptionGate.tsx` - Global overlay
- `src/shared/components/guards/AccessGuard.tsx` - Per-page guard
- `src/features/settings/pages/settings.tsx` - Billing management UI

---

## 15. Future Improvements

1. **Email Notifications**
   - Send email 7 days before trial expires
   - Send email when payment fails
   - Add to `trial_will_end` webhook handler

2. **Enhanced UI**
   - Show exact payment retry date in "Payment Issue" overlay
   - Show countdown in trial banner
   - Add "Manage Payment Method" direct link in overlay

3. **Admin Tools**
   - Dashboard to see businesses by subscription status
   - Manual subscription status override (for testing/support)
   - Bulk trial extension tool

4. **Metrics**
   - Track trial→active conversion rate
   - Track churn reasons (canceled vs payment failed)
   - Monitor grace period usage

---

**Last Updated**: 2026-03-30
**Version**: 1.0
