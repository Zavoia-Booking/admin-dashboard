# Life Time Deal (LTD) Users — Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [What is LTD?](#what-is-ltd)
3. [Business Rules](#business-rules)
4. [How LTD Works](#how-ltd-works)
5. [Admin Operations](#admin-operations)
6. [User Flows](#user-flows)
7. [Edge Cases & Special Behaviors](#edge-cases--special-behaviors)
8. [Technical Architecture](#technical-architecture)
9. [Testing Checklist](#testing-checklist)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

---

## Overview

**LTD (Life Time Deal) users** are special business accounts that receive **permanently free BASE plan features** but must pay only for additional team member seats. This is an exclusive offering for select customers who want lifetime access to core features at a fixed cost.

### Key Fact
> **LTD users NEVER pay for the BASE plan. They only pay per additional team member seat.**

---

## What is LTD?

### The LTD Guarantee
An LTD business is granted the following **permanently, at no recurring cost**:

| Feature | LTD Cost | Regular Plan Cost |
|---------|----------|-------------------|
| Base subscription | **FREE** | €49/month or plan price |
| Email reminders | **FREE** | Included in base |
| Push notifications | **FREE** | Included in base |
| Unlimited locations | **FREE** | Depends on plan (5-∞) |
| Unlimited services | **FREE** | Unlimited (all plans) |
| SMS messages | **Per credit** | Per credit (always paid) |
| Team member seats | **€XX/seat** | €XX/seat (same price) |

### How to Identify an LTD Business
- In the database: `business.isLtd = true`
- In the admin panel: Look for LTD status badge on business details
- API: `GET /billing/subscription-summary` returns `isLtd: true` and `basePlanPrice: 0`

---

## Business Rules

### 1. Platform Access
- ✅ **Always entitled** to use the platform (entitlement status = 'ltd')
- ✅ Reads (GET requests) always work
- ✅ Writes (POST/PUT/DELETE) always allowed (no subscription check)
- ✅ Never blocked by expired subscriptions, past_due payments, or trial expiry
- ✅ Cannot be revoked unless explicitly changed by admin

### 2. Feature Limits
| Feature | Limit | Who Sets It |
|---------|-------|-------------|
| Locations | Unlimited (or per `planOverrides`) | Plan + Admin override |
| Services | Unlimited | Plan default |
| Team members (owner) | Always allowed | N/A |
| Team members (additional) | = purchased seats | Per-seat Stripe billing |
| Reminders (email) | Unlimited | Plan default |
| Push notifications | Unlimited | Plan default |
| SMS | Limited by credits | Credit purchase |

### 3. Seat Requirements
- **Owner counts as 1** (no seat cost)
- **Each additional team member requires 1 purchased seat**
- **Cannot add team member without purchasing a seat first**
- **Team members are soft-capped by plan's `maxTeamMembers`** (usually 10-20 per plan, can be overridden)

### 4. Pricing
- **Base plan**: €0 (free, forever)
- **Seats**: €XX/month per seat (standard pricing, no discount)
- **SMS**: Pay-as-you-go credits (not part of LTD guarantee)
- **No hidden fees or surprise charges**

### 5. Cancellation & Revocation
- **Base plan cannot be canceled** (already free)
- **Seat subscription can be canceled** (pauses seat additions)
- **Admin can revoke LTD status** (requires explicit action)
- **If LTD revoked**: Business must purchase regular plan to continue

---

## How LTD Works

### The LTD Flow at a Glance

```
┌─────────────────────────────────────────────────────────┐
│  Admin grants LTD via PUT /admin-crm/business/:id/ltd   │
├─────────────────────────────────────────────────────────┤
│  isLtd = true, ltdSince = now, trialEndsAt = null       │
├─────────────────────────────────────────────────────────┤
│  User (LTD business owner) wants to add team members    │
├─────────────────────────────────────────────────────────┤
│  User clicks "Add Team Member" → blocked (0 seats)      │
├─────────────────────────────────────────────────────────┤
│  User redirected to "Purchase Seats" → POST /ltd-seats-checkout
├─────────────────────────────────────────────────────────┤
│  Stripe session created (seats-only, no base price)     │
├─────────────────────────────────────────────────────────┤
│  User completes payment for 1-N seats                   │
├─────────────────────────────────────────────────────────┤
│  Stripe webhook: checkout.session.completed             │
├─────────────────────────────────────────────────────────┤
│  ltdSeatStripeSubscriptionId set, paidTeamSeats updated │
├─────────────────────────────────────────────────────────┤
│  User can now add team members (up to paidTeamSeats)    │
└─────────────────────────────────────────────────────────┘
```

### Data Model

#### Business Entity Fields
```typescript
// LTD-specific columns
isLtd: boolean                          // Master LTD flag
ltdSince: Date | null                   // When LTD was granted
ltdSeatStripeSubscriptionId: string | null // Seats-only Stripe sub

// Unchanged (but reused differently)
stripeSubscriptionId: string | null     // Regular subscription (always null for LTD)
paidTeamSeats: number                   // How many team members can be added
```

#### Subscription Records
- **Regular businesses**: One subscription record with base + seats line items
- **LTD businesses**: One subscription record with **only seats** line items
- Both are tracked in the `Subscription` entity with `teamSeats` field

---

## Admin Operations

### Granting LTD Status

**Endpoint**: `PUT /admin-crm/business/:id/ltd`

**Request**:
```json
{
  "isLtd": true
}
```

**Response**:
```json
{
  "id": 123,
  "name": "Acme Salon",
  "isLtd": true,
  "ltdSince": "2026-03-30T15:47:00.000Z",
  "stripeSubscriptionId": null,
  "ltdSeatStripeSubscriptionId": null,
  "paidTeamSeats": 0,
  "trialEndsAt": null
}
```

**What happens**:
- ✅ Sets `isLtd = true`
- ✅ Sets `ltdSince = now`
- ✅ Clears `trialEndsAt` (trial superseded by LTD)
- ✅ Does NOT create a Stripe subscription (user will do this via checkout)
- ✅ `paidTeamSeats` starts at 0 (user must purchase seats first)

**Preconditions**:
- Business must exist
- Business must NOT already be LTD (error if already LTD)

### Revoking LTD Status

**Endpoint**: `PUT /admin-crm/business/:id/ltd`

**Request**:
```json
{
  "isLtd": false
}
```

**What happens**:
- ✅ Sets `isLtd = false`
- ✅ Clears `ltdSince`
- ✅ Clears `ltdSeatStripeSubscriptionId` (unlink seats sub)
- ✅ Sets `paidTeamSeats = 0` (remove seat allowance)
- ⚠️ **Admin must cancel Stripe seat subscription manually** (via Stripe dashboard if needed)

**Preconditions**:
- Business must exist
- Business must be LTD (error if not LTD)

**Post-revocation**:
- Business falls back to trial + regular subscription model
- If no regular subscription exists, business loses platform access (expired/no_subscription)
- **Existing team members are NOT removed**, but business cannot invite new ones until subscribed

### Viewing LTD Businesses

All admin CRM list/get endpoints now include LTD fields:

**GET `/admin-crm/business/list`** (filtered):
```json
{
  "data": [
    {
      "id": 123,
      "name": "Acme Salon",
      "isLtd": true,
      "ltdSince": "2026-03-30T15:47:00.000Z",
      "ltdSeatStripeSubscriptionId": "sub_...",
      "paidTeamSeats": 3,
      "createdAt": "2026-01-01T..."
    }
  ],
  "total": 15,
  "hasMore": false
}
```

**Filter by LTD**: Use filter builder with `isLtd = true`

---

## User Flows

### For an LTD Business Owner

#### 1. First Time: No Seats Purchased Yet

**State**:
- `isLtd = true`, `paidTeamSeats = 0`
- Owner can use all features (locations, services, reminders, etc.)
- Cannot add team members (no seats)

**User tries to add team member**:
```
1. Navigate to Team Members page
2. Click "Invite Team Member"
3. ❌ Error: "You have 0 team member seats. Purchase seats to continue."
4. Offered link: "Purchase Seats" → POST /billing/ltd-seats-checkout
5. Redirects to Stripe Checkout (seats-only, no base plan cost)
6. User selects N seats and completes payment
7. Stripe webhook updates paidTeamSeats = N
8. User can now add up to N team members
```

#### 2. After Purchasing Seats

**State**:
- `isLtd = true`, `paidTeamSeats = 5` (example)
- Seat subscription exists: `ltdSeatStripeSubscriptionId = "sub_..."`
- Owner + 4 team members (all invited)

**User wants to add 2 more team members**:
```
1. Click "Invite Team Member" (works, has 1 seat available)
2. Invite team member → success
3. Click again (0 seats left)
4. ❌ Error: "You have 0 available team member seats."
5. Offered link: "Add More Seats" → POST /update-seats endpoint
6. Checkout for additional seats (prorated)
7. Stripe invoice issued, payment processed
8. Webhook updates paidTeamSeats
9. User can continue adding members
```

#### 3. Checking Billing & Pricing

**User navigates to Billing/Plans page**:
```
GET /billing/subscription-summary

Response:
{
  "isLtd": true,
  "ltdSince": "2026-03-30T15:47:00.000Z",
  "planTier": "BASE",
  "planName": "Base Plan",
  "basePlanPrice": 0,           // ← Always 0 for LTD
  "pricePerTeamMember": 9.99,   // € per seat
  "paidSeats": 5,
  "usedSeats": 5,
  "availableSeats": 0,
  "totalMonthlyCost": 49.95,    // 5 seats × €9.99
  "breakdown": [
    {
      "description": "Team Seats",
      "quantity": 5,
      "unitPrice": 9.99,
      "totalPrice": 49.95
    }
  ],
  "scheduled": { ... }
}
```

**UI shows**:
- ✅ Base Plan: FREE (with "LTD" badge)
- ✅ 5 team member seats @ €9.99/month = €49.95/month
- ✅ **Total: €49.95/month** (not €99.98 which would be base + seats)

---

## Edge Cases & Special Behaviors

### 1. LTD Seat Subscription Goes `past_due`

**Scenario**: Stripe cannot charge the card for seat subscription

**What happens**:
- ✅ **Business retains full access** (LTD early-return in `isBusinessEntitled`)
- ⚠️ Stripe will retry payment automatically
- ⚠️ After max retries, subscription status = `past_due`
- 🚫 If subscription is deleted (unpaid after all retries), `paidTeamSeats` is set to 0
- Result: Business locked out of adding new team members (but existing ones remain)

**Admin should**:
- Monitor Stripe past_due subscriptions
- Reach out to customer for payment update
- Can manually set `paidTeamSeats` if payment later succeeds

### 2. LTD Business with Team Members Above Limit

**Scenario**: Plan's `maxTeamMembers` is 10, but somehow 15 team members exist

**How it happens**:
- Admin grants LTD, user adds 15 seats
- Admin changes plan to one with `maxTeamMembers = 10`
- No auto-deletion occurs

**What happens**:
- ✅ Existing 15 team members are NOT removed
- 🚫 User blocked from inviting new members (limit reached)
- 🚫 User cannot invite anyone until under the limit

**Admin should**:
- Remove some team members, OR
- Increase `maxTeamMembers` via `planOverrides`, OR
- Ensure plan matches LTD business needs before granting LTD

### 3. LTD Seat Subscription Deleted (User Cancels Seats)

**Scenario**: User cancels their seat subscription via Stripe billing portal

**What happens**:
- Stripe webhook: `customer.subscription.deleted`
- API checks: is this the LTD seat subscription? (`ltdSeatStripeSubscriptionId === sub.id`)
- ✅ Clears `ltdSeatStripeSubscriptionId`
- ✅ Sets `paidTeamSeats = 0`
- ⚠️ User can no longer invite team members

**UI shows**:
- "You have 0 team member seats"
- Existing team members remain (not removed)
- Link to "Purchase Seats" is offered again

### 4. Regular Subscription Webhook for LTD Business

**Scenario**: Somehow an LTD business also has a regular subscription (shouldn't happen, but edge case)

**Webhook** `customer.subscription.updated`:
- Checks: is this the LTD seat sub? → No
- Checks: is this the regular base sub? → Yes, but `stripeSubscriptionId` is null
- Result: Update is logged but does NOT overwrite business record
- ✅ LTD status is preserved

### 5. LTD User Manually Adjusts Seats in Stripe Dashboard

**Scenario**: User logs into Stripe portal and changes seat quantity

**What happens**:
- Stripe webhook: `customer.subscription.updated`
- API recalculates `teamSeats` from subscription items
- Updates `paidTeamSeats` to new quantity
- ✅ Works correctly (in-flight changes are synced)

### 6. SMS Credits for LTD Users

**Is SMS included?** NO

**What happens**:
- SMS is **always credit-based**, regardless of plan type
- LTD does NOT grant free SMS
- `reminderService` checks: `smsCredits > 0` before sending SMS
- If `smsCredits = 0`, SMS reminders are skipped
- User must purchase SMS credits separately (same as all other plans)

**SMS Pricing**:
```
Admin endpoint: POST /admin-crm/sms-packages (define package pricing)
User endpoint:  POST /billing/checkout (mode: 'payment', type: 'sms_purchase')
```

### 7. LTD with `planOverrides`

**Scenario**: Admin wants to give an LTD business custom limits

**What happens**:
- `planOverrides` field still applies: `{ maxLocations: 99, maxTeamMembers: 50 }`
- `getEffectiveLimits()` merges plan defaults + overrides
- ✅ Overrides work for LTD just like regular plans
- LTD base cost is still 0 (overrides only affect limits, not pricing)

### 8. Trial Expired, Then Grant LTD

**Scenario**: Business was on trial, trial expired, now admin grants LTD

**What happens**:
- `setLtdStatus(id, true)` clears `trialEndsAt = null`
- ✅ `isBusinessEntitled()` now returns `status: 'ltd'` (not 'expired')
- ✅ Platform access is restored

### 9. LTD User Tries to Change Their Own Plan

**Scenario**: LTD user navigates to billing and tries to upgrade/downgrade

**Expected behavior**:
- ❌ Should NOT allow changing away from BASE plan
- Should show: "Your LTD account is locked to the Base Plan. Contact support to make changes."

**Implementation note**: Checkout flow should guard against non-LTD tier requests from LTD businesses

### 10. Marketplace Listing for LTD Users

**What happens**:
- LTD is treated like any other active entitlement
- If `isBusinessEntitled().entitled = true`, marketplace listing is allowed to be published
- No special rules for LTD businesses in marketplace

---

## Technical Architecture

### Database Schema

```sql
-- Added to business table:
ALTER TABLE business ADD COLUMN isLtd BOOLEAN DEFAULT FALSE;
ALTER TABLE business ADD COLUMN ltdSince TIMESTAMPTZ NULL;
ALTER TABLE business ADD COLUMN ltdSeatStripeSubscriptionId VARCHAR(128) NULL;
CREATE INDEX idx_business_isLtd ON business(isLtd);
```

### Entitlements Service

```typescript
// isBusinessEntitled() logic

if (business.isLtd) {
  return { entitled: true, status: 'ltd' };  // ← LTD always entitled
}

// ... trial check ...
// ... active subscription check ...
// ... past_due check ...
```

**Key**: LTD check is FIRST, before trial/past_due/active checks.

### Billing Service

#### Methods Added/Modified

| Method | Change | Purpose |
|--------|--------|---------|
| `createLtdSeatsCheckoutSession()` | NEW | Create seats-only Stripe session (no base price) |
| `handleWebhook()` case `'checkout.session.completed'` | MODIFIED | Added LTD branch with `metadata.type: 'ltd_seats'` |
| `handleWebhook()` case `'customer.subscription.deleted'` | MODIFIED | Added LTD cleanup (clear `ltdSeatStripeSubscriptionId`) |
| `updateSubscriptionSeats()` | MODIFIED | Use `ltdSeatStripeSubscriptionId` instead of `stripeSubscriptionId` for LTD |
| `scheduleSubscriptionSeats()` | MODIFIED | Same as above |
| `getSubscriptionSummary()` | MODIFIED | Early return for LTD via `getLtdSubscriptionSummary()` |
| `getLtdSubscriptionSummary()` | NEW | Return pricing with `basePlanPrice: 0` |

#### Stripe Session Structure

**Regular subscription** (non-LTD):
```javascript
{
  mode: 'subscription',
  line_items: [
    { price: 'price_base', quantity: 1 },        // ← Base plan
    { price: 'price_seat', quantity: 2 },        // ← Optional seats
  ],
  metadata: { businessId: '123' }  // type field absent
}
```

**LTD seat subscription**:
```javascript
{
  mode: 'subscription',
  line_items: [
    { price: 'price_seat', quantity: 2 },        // ← Only seats
  ],
  metadata: { businessId: '123', type: 'ltd_seats' }  // ← Type marker
}
```

### Admin CRM Service

#### New Method

```typescript
async setLtdStatus(businessId: string, isLtd: boolean): Promise<Business>
```

**Grant** (`isLtd = true`):
- Set `isLtd = true`
- Set `ltdSince = new Date()`
- Clear `trialEndsAt`
- Guard: Cannot grant if already LTD

**Revoke** (`isLtd = false`):
- Set `isLtd = false`
- Clear `ltdSince`
- Clear `ltdSeatStripeSubscriptionId`
- Set `paidTeamSeats = 0`
- Guard: Cannot revoke if not LTD

---

## Testing Checklist

### Unit Tests

- [ ] `EntitlementsService.isBusinessEntitled()` returns `status: 'ltd'` for LTD business
- [ ] `EntitlementsService.canInviteTeamMember()` uses `min(paidTeamSeats, maxTeamMembers)` for LTD
- [ ] `EntitlementsService.canCreateLocation()` returns true for LTD (no location limits)
- [ ] `BillingService.createLtdSeatsCheckoutSession()` throws error if business not LTD
- [ ] `BillingService.createLtdSeatsCheckoutSession()` creates seats-only session (no base price)
- [ ] `BillingService.getLtdSubscriptionSummary()` returns `basePlanPrice: 0` and `isLtd: true`
- [ ] `AdminCrmService.setLtdStatus(id, true)` prevents double-grant
- [ ] `AdminCrmService.setLtdStatus(id, false)` prevents revoke of non-LTD

### Integration Tests

#### Grant LTD
- [ ] Create test business on trial
- [ ] Call `setLtdStatus(id, true)`
- [ ] Verify: `isLtd = true`, `ltdSince = now`, `trialEndsAt = null`
- [ ] Verify: `SubscriptionGuard` allows writes without subscription
- [ ] Verify: Platform fully accessible

#### Purchase Seats as LTD
- [ ] Call `createLtdSeatsCheckoutSession()` with businessId and seats=3
- [ ] Verify: Stripe session created with only seat line items
- [ ] Verify: Metadata contains `type: 'ltd_seats'`
- [ ] Simulate Stripe webhook: `checkout.session.completed`
- [ ] Verify: `ltdSeatStripeSubscriptionId` populated
- [ ] Verify: `paidTeamSeats = 3`

#### Add Team Members
- [ ] Attempt to invite team member with `paidTeamSeats = 0`
- [ ] Verify: Blocked with error "0 seats available"
- [ ] Purchase 2 seats (see above)
- [ ] Invite 1 team member
- [ ] Verify: Succeeds, `paidTeamSeats = 1` remaining
- [ ] Invite another
- [ ] Verify: Succeeds, `paidTeamSeats = 0` remaining
- [ ] Attempt to invite 3rd
- [ ] Verify: Blocked

#### Seat Subscription Deleted
- [ ] After purchasing seats, simulate Stripe webhook: `customer.subscription.deleted` with `ltdSeatStripeSubscriptionId`
- [ ] Verify: `ltdSeatStripeSubscriptionId = null`
- [ ] Verify: `paidTeamSeats = 0`
- [ ] Verify: Cannot invite team members

#### Revoke LTD
- [ ] Call `setLtdStatus(id, false)`
- [ ] Verify: `isLtd = false`, `ltdSince = null`, `ltdSeatStripeSubscriptionId = null`
- [ ] Verify: Business requires subscription to continue
- [ ] Verify: `SubscriptionGuard` blocks writes (expired)

#### SMS for LTD
- [ ] Grant LTD to business
- [ ] Trigger reminder that would send SMS
- [ ] Verify: SMS skipped if `smsCredits = 0`
- [ ] Purchase SMS credits
- [ ] Trigger reminder again
- [ ] Verify: SMS sent, credits decremented

### E2E Tests (UI)

- [ ] Admin dashboard: Search for LTD businesses
- [ ] Admin dashboard: View LTD business details, confirm LTD badge
- [ ] Admin dashboard: Grant LTD status to a trial business
- [ ] Admin dashboard: Revoke LTD status
- [ ] User dashboard (LTD): View billing summary showing €0 base, seat costs only
- [ ] User dashboard (LTD): Attempt to add team member with 0 seats → blocked
- [ ] User dashboard (LTD): Click "Purchase Seats" → Stripe checkout seats-only
- [ ] User dashboard (LTD): Complete checkout → can now add team members
- [ ] User dashboard (LTD): View email reminders firing (free)
- [ ] User dashboard (LTD): View multiple locations created (unlimited, free)

---

## Troubleshooting

### Problem: "User granted LTD but is still blocked from adding team members"

**Diagnosis**:
1. Check: Is `isLtd = true`? → If false, LTD was not actually granted
2. Check: Is `paidTeamSeats > 0`? → If 0, user must purchase seats first
3. Check: Is `ltdSeatStripeSubscriptionId` populated? → If null, no seat sub exists
4. Check: Current team member count = `paidTeamSeats`? → If equal, no available seats

**Solution**:
- Confirm LTD was granted: `SELECT isLtd, ltdSince FROM business WHERE id = ?`
- Manually purchase seats via checkout, or
- Manually update `paidTeamSeats` to grant free seats (rare, admin-only)

### Problem: "LTD subscription shows up in Stripe but not in database"

**Diagnosis**:
1. Webhook may not have fired
2. Webhook may have failed

**Check**:
- Stripe dashboard: View subscription, check webhook deliveries
- API logs: Search for LTD checkout session webhooks
- Database: `SELECT ltdSeatStripeSubscriptionId FROM business WHERE id = ?`

**Solution**:
- Retry webhook from Stripe dashboard (if available)
- Manually insert subscription record (careful!)
- Contact support if persistence issue

### Problem: "User has 0 seats but can still add team members"

**Diagnosis**:
- Possible race condition (webhook not yet processed)
- Possible old cached data in browser

**Solution**:
1. Hard refresh browser (`Ctrl+Shift+R`)
2. Check database: `paidTeamSeats` value
3. If database is wrong, manually correct

### Problem: "Revoked LTD but user still has access"

**Diagnosis**:
1. Check: `isLtd = false` after revoke? → If true, revoke failed
2. Check: Does regular subscription exist? → If no, should be blocked
3. Check: Is trial still active? → If yes, still entitled

**Solution**:
- If trial is still active, it's being used (expected)
- Assign a plan and subscription manually to lock user out, or
- Force trial expiry: set `trialEndsAt = past date`

### Problem: "SMS is being sent for free to LTD users"

**Diagnosis**:
- `reminderService` checks SMS credits even for LTD
- Check: `business.smsCredits` value

**Solution**:
- SMS is never included in LTD; user must buy credits
- If user has credits, SMS will send (and deduct credits)
- Expected behavior; no fix needed

---

## FAQ

### Q: Can an LTD user downgrade or upgrade their plan?
**A**: No. LTD users are locked to the BASE plan. Their plan cannot be changed via the checkout flow. Only admins can modify an LTD user's plan assignment in the CRM.

### Q: Do LTD users pay any monthly fees?
**A**: Only for seats. The BASE plan features are 100% free forever. SMS is additional and credit-based (not included).

### Q: What happens to an LTD user's existing team members if we revoke LTD?
**A**: They are NOT removed. The user simply cannot add new team members until they subscribe to a regular plan. Existing team members remain invited.

### Q: Can an LTD user have multiple seats subscriptions?
**A**: No. Only one `ltdSeatStripeSubscriptionId` can exist at a time. If a new seats subscription is created, it overwrites the old one.

### Q: Is LTD status transferable between businesses?
**A**: No. LTD is per-business. If a user owns multiple businesses, each must be granted LTD separately.

### Q: What if an LTD user cancels their seats subscription mid-cycle?
**A**: Stripe prorates the refund. The user immediately loses the ability to add team members (gets 0 seats).

### Q: Can we offer LTD discounts on seats?
**A**: No. LTD users pay full price for seats. LTD only covers the BASE plan, not seat pricing.

### Q: What if an LTD business's payment method fails for seat renewal?
**A**: Stripe marks the subscription as `past_due` and retries. The user retains full platform access (LTD guarantee). Once payment succeeds, the subscription is active again.

### Q: How do we handle LTD users during platform maintenance?
**A**: Same as everyone else. LTD status doesn't change maintenance windows or SLA commitments.

### Q: Can an LTD user have a future trial?
**A**: If you revoke LTD and set `trialEndsAt` in the future, yes. But LTD and trial are mutually exclusive while LTD is active.

### Q: Is there an API for users to check their LTD status?
**A**: Yes. `GET /billing/subscription-summary` returns `isLtd: boolean` and `ltdSince` date.

### Q: What permissions are required to grant/revoke LTD?
**A**: Admin CRM access. The `PUT /admin-crm/business/:id/ltd` endpoint is admin-only.

### Q: Can we A/B test LTD offers?
**A**: LTD is currently a manual admin grant. No self-serve signup. You could build a campaign page that links to an admin-provisioning workflow.

### Q: What's the typical LTD customer profile?
**A**: Early adopters, strategic partnerships, or customers acquired at a steep discount who prefer a flat lifetime fee over recurring billing.

---

## Summary

**LTD is simple at a conceptual level**:
- **Grant**: 1 click in admin → Business is LTD forever
- **Use**: Works exactly like a free BASE plan, but with paid seats
- **Scale**: Business can grow by purchasing more seats as needed
- **End**: Admin can revoke if needed, business falls back to normal subscription model

**For product teams**:
- Show "LTD" badge to admins so they know what they're looking at
- In billing UI, clearly show "Base Plan: FREE (LTD)" so users understand
- Offer "Purchase Seats" button (not "Subscribe" button) to avoid confusion
- Don't offer plan upgrades or tier options to LTD users

**For support teams**:
- LTD users can't cancel (always free base)
- Only way to "remove" an LTD user is to revoke LTD status
- SMS is never included; clarify this in onboarding
- Seat pricing is standard (no discount for LTD)

---

**Last updated**: 2026-03-30
**Maintained by**: Engineering Team
**Related docs**: [Billing Architecture](./BILLING.md), [Subscription Webhooks](./WEBHOOKS.md)
