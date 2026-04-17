# Billing / Subscription → Mobile-Safe Copy Mapping

This document catalogues every billing-, subscription-, payment-, trial-, and seat-related UI surface in `admin-dashboard` and specifies, per surface, the native (Capacitor iOS/Android) treatment: **hidden entirely**, **collapsed to a neutral state**, or **re-worded via an i18n overlay**.

**Intended use:** feed this file to a copywriting AI pass. The output is a set of overlay JSON files placed at `src/locales/{en,ro}/{settings,teamMembers,navigation}.mobile.json`. Of the six paths, only `teamMembers.mobile.json` is expected to have content in the current design — the other two stay `{}` because the keys that would have been sensitive either never render on native (whole components gated) or already live under a mobile-safe branch (`subscriptionGate.native.*` in the base file). The runtime merges overlays on top of base namespaces when `config.IS_NATIVE === true` (see [src/shared/lib/i18n.ts](../src/shared/lib/i18n.ts)).

This document is **up to date with the implementation** in the same commit — code and guidance were rewritten together. If you change the gating in code, update the corresponding §2.x section here.

---

## 1. Policy — why this exists

Apple App Store **Guideline 3.1.1 (In-App Purchase)** prohibits apps from using non-IAP mechanisms to unlock in-app digital content or services, and from steering users to external purchase mechanisms. **Guideline 3.1.3(a)** defines the narrow "Reader" app carve-out (pre-paid content consumed in-app — magazines, newspapers, books, audio, music, video, cloud storage) and, for apps that qualify and receive Apple's External Link Account entitlement, permits a single external account-management link with strict UI requirements (system disclosure sheet, opens in the system browser, no price/offer language). **3.1.3(b)** is "Multiplatform Services" — it is not the reader clause, contrary to common confusion.

Google Play's equivalent is **Payments policy** + the User Choice Billing / external-offers programs (region-dependent, currently expanding in the US following the *Epic v. Google* injunction). Outside enrolled programs, Play's rules are close enough to Apple's that a single neutral posture across both native platforms is the safe default.

We deliberately **do not** use IAP — billing happens exclusively on the web via Stripe, saving the 15–30% store commission (same approach as Netflix, Disney+, Spotify, Fresha). Because we have not applied for Apple's reader / external-link-account entitlement, we treat the mobile build as **fully neutral**: no pricing, no purchase CTAs, no "manage subscription" deep links, and no language that reveals the commercial state of the account.

### What "neutral" means in practice

The mobile build must contain **zero** references to:

**Direct commercial nouns**
`subscription`, `subscribe`, `subscribed`, `subscribing`, `billing`, `bill`, `billed`, `invoice`, `payment`, `pay`, `paid` (as verb), `charge`, `charged`, `price`, `pricing`, `cost`, `fee`, `plan`, `tier`, `trial`, `free trial`, `Stripe`, `purchase`, `buy`, `checkout`, `credits` (as purchasable units), `upgrade`, `upgrading`, `downgrade`, `renew`, `renewal`, `cancellation`, `cancel subscription`, `reactivate`, `reactivation`.

**Currency & billing-cadence tokens**
`€`, `$`, `£`, `lei`, `RON`, `EUR`, `USD`; `per month`, `/month`, `/mo`, `monthly`, `per seat`, `per user`.

**Review-magnet phrasing** — not explicitly banned by policy text, but phrasing reviewers interpret as commercial intent when it appears alongside an entitlement block:
`restore full access`, `regain access`, `account setup expired`, `setup has expired`, `setup incomplete` (when paired with payment/activation), `manage subscription`, `manage plan`, `business data` (as hostage-copy in a locked state), `seat` as a countable quantity, `slot` when clearly = quota sold, `included in your plan`, `included team size`, `change account options` (when the only option would be buying more).

**Brand-adjacent product names to review case-by-case**
`Lifetime Deal`, `LTD`, `Founders Plan`, `Pro Plan`, etc. — these are commercial product names. Safer mobile wording: `Permanent Access`, `Ongoing Access`, `Account Access Included`. Only keep the original name if it is used purely as a visual badge with no purchase-adjacent context.

These words may appear **only** on the web build. The same en / ro base JSON files ship to both platforms — native strips nothing out; it just replaces specific keys with the overlays, and gates whole components via `<WebOnly>` / `isNative` when replacement isn't enough.

### The scope reviewers look at — not just this file

App Store Review and Play Review examine **all user-facing surfaces**, not only the i18n JSON you ship. Everything below must be audited before a native release:

- **Hardcoded strings in TSX** — fallback labels, toasts, empty states, dialog titles, `aria-label`s.
- **Server-returned copy** — error messages from the API (`billing failed`, `subscription inactive`, etc.). Native clients must not surface raw backend strings that mention commercial state. Either translate on the client to a neutral message or have the backend emit a platform-aware error code.
- **Notifications** — push payloads, in-app toasts triggered by backend events. Push notification bodies are visible on the lock screen and are reviewed.
- **Emails & SMS** — templates opened or referenced from the native app. If a user taps a deep link from an email about "your subscription", that is still a concern.
- **Embedded webviews** — support articles, legal pages, the external website itself. If `/support` on web says "renew your subscription", and native users are sent there, the violation moves one click later. Use a native-specific support landing if needed.
- **Store listing metadata** — App Store screenshots, preview video, subtitle, promotional text, release notes, keywords. Price/"subscription" words in any of these are flagged.
- **Deep links & URL schemes** — any internal route the native app can reach (`/settings?tab=billing`, `/info?type=subscription-success`) must be either unreachable or safe-to-render on native.
- **Third-party SDKs with UI** — Stripe.js, Google Sign-In, analytics overlays. Stripe.js must not load on native.

The overlay JSON is just the first checkpoint. The downstream destinations matter equally.

### Mobile-safe substitution intent

The replacement copy should convey operational meaning without commercial intent. "Operational" means: does the user know what's happening and what to do? "Commercial" means: is there any hint of pricing, purchase, renewal, or entitlement-for-money?

| Concept on web | Neutral register on native |
|---|---|
| Subscription status / tier | "account", "your account" (drop status noun entirely when possible) |
| Billing / invoice | "account settings" |
| Payment issue / past due | "account issue" (do **not** say "payment", "failed", or "restore") |
| Trial period / trial active | omit — do not mention introductory periods at all |
| Upgrade / buy more seats | do not mention — route the user to support or remove the CTA |
| Renew | omit — use "Contact Support" |
| Cancel subscription | omit — no in-app cancel flow on native |
| Seat / seats (as quota) | "team capacity", "members added" (avoid "slot" where possible) |
| `€12/month` | never render any amount on native |

### Outbound-link discipline — single global pattern

There is **one** native CTA pattern, applied everywhere:

| Surface | Primary CTA | Secondary CTA |
|---|---|---|
| Blocking states (SubscriptionGate) | Contact Support → `/support` | Go Home → `/` |
| Non-blocking informational text (SubscriptionInfo, etc.) | Contact Support → `/support` | (none) |
| The `/account-info` screen itself | Open in browser → `https://staging-app.zavoia.com` | Back to app → `/` |

Outside `/account-info`, **no CTA navigates to the external website**. The website link is concentrated in one place so review surfaces have at most one outbound-link decision to make. No CTA anywhere on native should say "Visit our website", "Manage on website", or similar — those are upsell-shaped phrases.

The label "Open in browser" (not "Open website") is deliberate: it reads as a technical navigation, not a purchase or account-management funnel.

### Server-driven and API-leaked copy

A native build can still leak commercial wording even when every line of frontend code is clean — if the **backend** returns a string that gets surfaced verbatim. Examples that have caused real rejections in other apps: `"error": "Payment failed"`, `"error": "Subscription is past due"`, raw Stripe error messages bubbled into toasts.

Don't rely on backend discipline alone. Use the runtime sanitizer at [src/shared/lib/nativeMessageSanitizer.ts](../src/shared/lib/nativeMessageSanitizer.ts):

```ts
import { sanitizeNativeMessage } from '@/shared/lib/nativeMessageSanitizer';
toast.error(sanitizeNativeMessage(err.message));
```

On web it's a passthrough. On native, if the message contains any banned token (subscription, billing, payment, plan, trial, stripe, currency codes, etc.), it's replaced with the project-wide neutral fallback (`subscriptionGate.native.message`). Apply at every point where a non-curated string reaches the UI: API error toasts, generic catch-blocks, server-driven banner content. Do **not** use the sanitizer to launder hardcoded copy — fix that at source.

---

## 2. Screen inventory

Each section: **what renders on native** + **keys that must be overlaid**. Keys that are entirely hidden on native **do not need overlays** — they simply never render.

### 2.1 Settings page tabs

- **File:** [src/features/settings/pages/settings.tsx](../src/features/settings/pages/settings.tsx)
- **Native behaviour:** the `billing` tab is filtered out of the tab list; only `profile` and `advanced` render.
- **Overlay needed:** none for `tabs.billing` / `tabs.billingMobile` (tab never mounts).

### 2.2 BillingAndSubscription (the whole billing tab)

- **File:** [src/features/settings/components/BillingAndSubscription.tsx](../src/features/settings/components/BillingAndSubscription.tsx)
- **Native behaviour:** component never mounts (parent filters tab).
- **Overlay needed:** none. All `billing.*` keys under `settings.json` are unused on native. Do **not** add them to `settings.mobile.json`.

### 2.3 SmsCredits

- **File:** [src/features/settings/components/SmsCredits.tsx](../src/features/settings/components/SmsCredits.tsx)
- **Native behaviour:** never mounts (child of BillingAndSubscription which is hidden).
- **Overlay needed:** none. All `sms.*` keys unused on native.

### 2.4 SubscriptionGate — global blocking overlay

- **File:** [src/shared/components/common/subscription/SubscriptionGate.tsx](../src/shared/components/common/subscription/SubscriptionGate.tsx)
- **Native behaviour:** the component branches on `isNative` **before** any variant logic runs, and renders a single neutral block for every failure state (past_due, unpaid, incomplete, incomplete_expired, canceled, no_subscription, expired, non-owner). CTAs are **only** `Contact Support` (navigates to `/support`) + `Go Home` (navigates to `/`). No outbound website link. This keeps every per-variant key (`paymentIssue.*`, `setupIncomplete.*`, `subscriptionRequired.*`) unreachable on native.
- **Overlay needed:** none. All native-visible copy for this gate lives in the base namespace under `subscriptionGate.native.*` and is already mobile-safe. Per-variant keys (`paymentIssue.*`, `setupIncomplete.*`, `subscriptionRequired.*`) are web-only and do not need overlays.

Keys that render on native (already final, in base `settings.json`):

| Key | EN | RO |
|---|---|---|
| `subscriptionGate.native.title` | Account Needs Attention | Contul necesită atenție |
| `subscriptionGate.native.subtitle` | Access Restricted | Acces restricționat |
| `subscriptionGate.native.message` (owner) | This account needs attention before you can continue. Contact support for help. | Contul necesită atenție pentru a putea continua. Contactează suportul pentru ajutor. |
| `subscriptionGate.native.messageNonOwner` | This account is currently unavailable. Please contact your administrator. | Acest cont nu este disponibil momentan. Te rugăm contactează administratorul. |
| `subscriptionGate.native.contactSupport` | Contact Support | Contactează suportul |
| `subscriptionGate.native.goHome` | Go Home | Acasă |

If these strings need tonal adjustment, do it in the base JSON — they are mobile-safe by design and do not belong in the overlay files.

### 2.5 TrialBanner

- **File:** [src/features/teamMembers/components/TrialBanner.tsx](../src/features/teamMembers/components/TrialBanner.tsx)
- **Native behaviour:** component returns `null` when `isNative` — banner never renders.
- **Overlay needed:** none. `trialBanner.*` keys unused on native.

### 2.6 TrialStatusCard (setup wizard launch step)

- **File:** [src/shared/components/common/subscription/TrialStatusCard.tsx](../src/shared/components/common/subscription/TrialStatusCard.tsx)
- **Native behaviour:** component returns `null` when `isNative` — card never renders.
- **Overlay needed:** none. (All strings in this card are currently hardcoded English, not i18n keys — so no keys to overlay anyway.)

### 2.7 SeatOverflowGate — blocks new team member invites when seats are full

- **File:** [src/features/teamMembers/components/SeatOverflowGate.tsx](../src/features/teamMembers/components/SeatOverflowGate.tsx)
- **Native behaviour:** the "Add more seats" payment option and its confirm/pay flow are hidden (`<WebOnly>` wrap + default `selectedOption` forced to `'remove'`). Only the "Remove a team member" path renders. The native path must not reference pricing, commerce, or even that extra capacity could be bought elsewhere.
- **Overlay needed:** **YES** — the remaining on-screen keys still contain "seat", "plan", and the "add more seats or..." option language.

| Key (namespace `teamMembers`) | Current EN | Required mobile rewrite |
|---|---|---|
| `seatOverflow.title` | You've exceeded your seat limit | "Your team is full" — removes "seat" and quota framing. |
| `seatOverflow.subtitlePlan_one` / `_other` | Your plan includes {{paidSeats}} seat(s). | "This account allows {{paidSeats}} team member(s)." — removes "plan" and "seat". |
| `seatOverflow.subtitleUsage_one` / `_other` | You currently have {{usedSeats}} active team member(s). | Keep — already neutral. |
| `seatOverflow.subtitleAction` | To continue, add more seats or remove a team member. | "To invite a new member, first remove someone from your team." — drops the "add more seats" clause entirely; no hint that extra capacity can be purchased online. |
| `seatOverflow.optionRemove` | Remove a team member | Keep. |
| `seatOverflow.optionRemoveDesc` | Choose a team member and reassign or cancel their upcoming appointments. | Keep. |
| `seatOverflow.optionPay`, `optionPayDesc_*`, `payConfirmTitle`, `payConfirmDesc_*`, `confirmPay`, `paying`, `paymentSuccess`, `paymentSuccessDesc`, `paymentContinue`, `paymentFailed` | (entire pay flow) | **No overlay needed** — never read on native (UI wrapped in `<WebOnly>`). |
| `seatOverflow.step1Title` through `seatOverflow.offboardFailed` | (remove-member flow strings) | Keep — all neutral. |

### 2.8 SubscriptionInfo — in the invite-member slider

- **File:** [src/features/teamMembers/components/SubscriptionInfo.tsx](../src/features/teamMembers/components/SubscriptionInfo.tsx)
- **Native behaviour:** all "Go to billing" / "Renew Subscription" / "Purchase Seats" **buttons** are wrapped in `<WebOnly>` and don't render. The surrounding message text still displays and must be rewritten to avoid commercial-state wording.
- **Overlay needed:** **YES** for the text keys. Button labels don't render on native, so their keys need no overlay.

The copy below deliberately avoids:

- "active / inactive" (implies paid state)
- "right now" (implies later-after-payment)
- "renew", "purchase", "upgrade"
- "seat / slot" quota framing (prefer "team capacity" / "members added" / "spots")
- "Visit our website for account options" (`options` reads as upsell)
- Any mention that team size can be changed by buying online

| Key (namespace `teamMembers`) | Current EN | Required mobile rewrite |
|---|---|---|
| `subscriptionInfo.teamMembers` | Team Members | Keep. |
| `subscriptionInfo.trialMessage` | During your trial period, you can invite unlimited team members to explore features together! | "You can invite team members to explore features together." — drops "trial", "right now", and "unlimited" (all imply a tiered model). |
| `subscriptionInfo.subscriptionRequired` | Subscription required | "This feature isn't available". Intentionally vague — do not hint at payment. |
| `subscriptionInfo.subscriptionRequiredDescription` | You need an active subscription to invite team members. | "This feature isn't available for this account. Contact support for help." |
| `subscriptionInfo.goToBilling` | Go to billing | No overlay needed — button hidden. |
| `subscriptionInfo.subscriptionCancelled` | Subscription Required | "This feature isn't available" — same posture as `subscriptionRequired`; collapse both states to one message on native. |
| `subscriptionInfo.subscriptionCancelledDescription` | Your subscription has been cancelled. To invite team members, you need to renew your subscription first. | "This feature isn't available for this account. Contact support for help." (same as `subscriptionRequiredDescription`.) |
| `subscriptionInfo.renewSubscription` | Renew Subscription | No overlay needed — button hidden. |
| `subscriptionInfo.paidSeats` | Paid Seats | "Team Capacity" — operational term, no commercial hint. (If paranoid-safe needed, drop the label entirely and show only the count.) |
| `subscriptionInfo.usedSeats` | Used Seats | "Members Added". |
| `subscriptionInfo.availableSeats` / `_other` | You have {{count}} available seat(s). No additional charge for this invitation. | "You have {{count}} spot(s) available." — drops "No additional charge" (monetary reference). |
| `subscriptionInfo.allSeatsInUse` | All Seats In Use | "Team is Full". |
| `subscriptionInfo.allSeatsInUseDescription` | You currently have all seats in use. To invite a new team member, you will need to purchase an additional seat first. | "Your team is full. To invite someone new, first remove a team member." — no mention that capacity can be expanded online. One-way action on native. |
| `subscriptionInfo.ltdActive` | Lifetime Deal Active | "Ongoing Access" (or just "Access Enabled" if paranoid-safe). "Lifetime Deal" is commercial branding and signals purchase; drop it on native regardless of whether you judge it borderline. |
| `subscriptionInfo.ltdNoSeats` | Your Lifetime Deal includes free platform access. Purchase team member seats to start inviting your team. | "Your account includes platform access. Contact support to add team members." — removes "Lifetime Deal", "free", "Purchase", "seats", and the website reference. |
| `subscriptionInfo.ltdPurchaseSeats` | Purchase Seats | No overlay needed — button hidden. |

### 2.9 info-page (post-payment redirects)

- **File:** [src/features/settings/pages/info-page.tsx](../src/features/settings/pages/info-page.tsx)
- **Native behaviour:** reached only via Stripe-hosted-checkout return URLs, which never fire on native (no Stripe on native). Unreachable from the native app.
- **Overlay needed:** none. `infoPages.*` keys unused on native.

### 2.10 Navigation / sidebar

- **File:** [src/shared/navigation/app-sidebar.tsx](../src/shared/navigation/app-sidebar.tsx)
- **Native behaviour:** no billing-specific menu items exist today (billing is a sub-tab under Settings). Settings menu item stays visible on native, but the billing tab within it is filtered out.
- **Overlay needed:** none. `navigation.mobile.json` can stay `{}` unless a future billing nav item is added.

### 2.11 AccountWebInfoPage (new, native-only neutral screen)

- **File:** [src/features/settings/pages/AccountWebInfoPage.tsx](../src/features/settings/pages/AccountWebInfoPage.tsx)
- **Route:** `/account-info`
- **Native behaviour:** shown when the app needs to tell the user that account/billing options are only available on the web. Copy is already mobile-safe in the base `settings.json`:

| Key | EN | RO |
|---|---|---|
| `accountWebInfo.title` | Manage your account online | Gestionează-ți contul online |
| `accountWebInfo.description` | Some account settings are managed on our website. Sign in from any browser to continue. | Unele setări ale contului se administrează pe site-ul nostru. Conectează-te dintr-un browser pentru a continua. |
| `accountWebInfo.openWebsite` | Open in browser | Deschide în browser |
| `accountWebInfo.backHome` | Back to app | Înapoi la aplicație |

These are the final mobile-safe copy — no overlay required. Deliberate choices:

- "Open in browser" (not "Open website") reads as technical navigation, not a purchase funnel.
- "Some account settings" (not "account settings, team size, and other options") drops specifics and the word "options" (upsell-shaped).
- Description does not hint at *what* is managed on the website — reviewers who can't guess the commercial purpose of the link will also be less likely to flag it.

This is the **only** place in the native app that contains an outbound website link. Do not reintroduce a website CTA anywhere else.

---

## 3. Output schema for the second AI pass

The second AI must produce exactly six files, matching this shape (only populate keys that actually need to change — omit everything else):

### `src/locales/en/settings.mobile.json`

Can be `{}`. SubscriptionGate collapses to `subscriptionGate.native.*` on native (already in base `settings.json`, already mobile-safe). All other `settings` keys either never render on native (billing tab is hidden) or are already neutral. Only add an overlay entry if you find a specific key that (a) renders on native and (b) carries commercial wording — which should not happen given the current gating.

```json
{}
```

### `src/locales/en/teamMembers.mobile.json`

```json
{
  "subscriptionInfo": {
    "trialMessage": "You can invite team members to explore features together.",
    "subscriptionRequired": "This feature isn't available",
    "subscriptionRequiredDescription": "This feature isn't available for this account. Contact support for help.",
    "subscriptionCancelled": "This feature isn't available",
    "subscriptionCancelledDescription": "This feature isn't available for this account. Contact support for help.",
    "paidSeats": "Team Capacity",
    "usedSeats": "Members Added",
    "availableSeats": "You have {{count}} spot available.",
    "availableSeats_other": "You have {{count}} spots available.",
    "allSeatsInUse": "Team is Full",
    "allSeatsInUseDescription": "Your team is full. To invite someone new, first remove a team member.",
    "ltdActive": "Ongoing Access",
    "ltdNoSeats": "Your account includes platform access. Contact support to add team members."
  },
  "seatOverflow": {
    "title": "Your team is full",
    "subtitlePlan_one": "This account allows {{paidSeats}} team member.",
    "subtitlePlan_other": "This account allows {{paidSeats}} team members.",
    "subtitleAction": "To invite a new member, first remove someone from your team."
  }
}
```

Every native-visible string above: (a) does not mention website navigation except the centralized `/account-info` screen (SubscriptionInfo points users to support instead); (b) does not use "right now", "active", "renew", "upgrade", or "options"; (c) has one possible action — "Contact Support" — and no pricing path.

### `src/locales/en/navigation.mobile.json`

```json
{}
```

### `src/locales/ro/*.mobile.json`

Same shape as EN, translated. Romanian plural forms: `_one`, `_few`, `_other` (i18next uses CLDR rules for `ro`). Use `_few` for 2–19 and for all counts with last two digits in that range (e.g. 102 → `_few`). See `ro/teamMembers.json` base for the CLDR splits in use.

---

## 4. Verification checklist

Three layers. Pass **all three** before shipping a native build.

### 4.1 Overlay JSON correctness

- [ ] All six overlay files are valid JSON.
- [ ] Keys in overlays correspond to keys in the base namespace (no dangling keys).
- [ ] Every key marked "Rewrite" in §2 is present in the overlay; every key marked "Keep" or "No overlay needed" is absent.
- [ ] Romanian pluralization uses the same `_one` / `_few` / `_other` suffixes as the base file for the same root key.

### 4.2 Built-bundle word audit

Run after `npm run build -- --mode mobile-prod` on the produced `dist/` (this catches both overlays and hardcoded strings in TSX):

```bash
# banned nouns
grep -irE '\b(subscription|subscribe|billing|bill(ed)?|invoice|payment|paid|charge[d]?|price|pricing|cost|fee|plan|tier|trial|stripe|purchase|buy|checkout|upgrade|downgrade|renew(al)?|cancel(lation)?|reactivate|reactivation)\b' dist/

# currency & cadence
grep -iE '(€|lei\b|\bRON\b|\bEUR\b|\bUSD\b|/month|per month|/mo\b|monthly|per seat|per user)' dist/

# review-magnet phrasing
grep -iE '(restore full access|regain access|setup has expired|manage subscription|included team size|change account options|available to invite|member slot)' dist/
```

All three must return zero matches (exempting vendor minified chunks — run the greps against your own source + locales, not bundled third-party JS, or diff against a web-build baseline).

- [ ] Banned-noun grep: clean.
- [ ] Currency / cadence grep: clean.
- [ ] Review-magnet phrasing grep: clean.

### 4.3 Runtime + downstream audit

Load the actual native app (Capacitor simulator or device build).

- [ ] `npm run android` then DOM-inspect every screen: Dashboard, Calendar, Team Members (trigger SeatOverflowGate), Settings (tabs Profile & Advanced), Support, `/account-info`. No banned word visible.
- [ ] Same as above with language switched to RO.
- [ ] SubscriptionGate — manually induce each state (past_due, incomplete, incomplete_expired, canceled, no_subscription). Native shows neutral block each time; no variant leaks commercial wording.
- [ ] SeatOverflowGate — with `usedSeats > paidSeats`, native shows only the remove-member option. No pay flow, no pricing.
- [ ] `/support` page in native context — content itself is neutral (no "billing", "payment", "subscription"). Already verified at time of writing, re-check if the support copy changes.
- [ ] `/account-info` — renders, opens the **system browser** (not a webview) when "Open website" is tapped.
- [ ] Stripe.js is not loaded on native (`window.Stripe` undefined; check network panel — no `js.stripe.com` request).
- [ ] API error-message rendering: trigger a failed subscription API call (e.g., force-navigate a native build somewhere that would call billing endpoints) and confirm no raw backend string containing "subscription"/"billing" reaches the UI. If it does, add a client-side neutralizer at the toast layer.
- [ ] Push-notification payloads (staging FCM/APNs): no commercial wording.
- [ ] Deep links from transactional emails: opening a "subscription update" email link in the native app either lands on a neutral screen or opens in the browser. Test at least the cancel-success and seat-update redirect URLs.
- [ ] App Store / Play Store listing assets (screenshots, subtitle, promotional text, release notes, keywords) reviewed for the same banned words — this is a separate pre-submission checklist outside this repo, but must happen.

### 4.4 iOS-specific extra caution

- [ ] No outbound website CTA on any blocking state (SubscriptionGate). Website link lives only on `/account-info`.
- [ ] No webview wraps external URLs from the app. Opens in Safari (system browser).
- [ ] If pursuing Apple's external-link-account entitlement later, re-read 3.1.3(a) requirements and add the system disclosure sheet before the browser handoff. Without the entitlement, keep the current stricter posture.

---

## 5. Where the runtime plumbing lives (reference)

- Platform detection source of truth: [src/app/config/env.ts](../src/app/config/env.ts) — `config.IS_NATIVE`, `config.PLATFORM`.
- Hook: [src/shared/hooks/usePlatform.ts](../src/shared/hooks/usePlatform.ts) — `usePlatform()`.
- Conditional render components: [src/shared/components/common/platform/PlatformGate.tsx](../src/shared/components/common/platform/PlatformGate.tsx) — `<WebOnly>`, `<NativeOnly>`, `<PlatformGate web={..} ios={..} android={..} native={..} />`.
- Route guard: [src/shared/components/common/platform/WebOnlyRoute.tsx](../src/shared/components/common/platform/WebOnlyRoute.tsx) — wraps a route element and redirects to `/account-info` on native.
- i18n overlay loader: [src/shared/lib/i18n.ts](../src/shared/lib/i18n.ts) — merges `*.mobile.json` bundles on top of base namespaces when `config.IS_NATIVE` is true.
