# Zavoia Product, Market, Niche and Pricing Audit

**Audit date:** 2026-07-13  
**Market:** Romania first  
**Company stage:** Pre-launch  
**Product evidence:** the six local repositories as they existed in the working tree on 2026-07-13  
**Market evidence:** dated sources in [`ZAVOIA_RESEARCH_SOURCE_LEDGER_2026-07-13.csv`](ZAVOIA_RESEARCH_SOURCE_LEDGER_2026-07-13.csv)  
**Historical context only:** [`MARKET_RESEARCH_AUDIT.md`](MARKET_RESEARCH_AUDIT.md)

> This is a research and decision document. It changes no API, schema, Stripe object, plan record, entitlement, invoice setting, or public price. The API repository contained uncommitted website-publishing and catalogue work at audit time. Those capabilities are explicitly marked **WIP** and must not be represented as deployed merely because they exist in the local working tree.

## 1. Executive decision

### What Zavoia is today

Zavoia is a two-sided marketplace and operations SaaS for scheduled local services:

- a business product for locations, services, bundles, staff assignments, availability, appointments, customers, reviews, marketplace publication, subscriptions, SMS and an in-dashboard website editor;
- a customer marketplace on native/cross-platform app and web for discovery, availability, sequential service/bundle booking, appointment management, favourites and reviews;
- a legacy marketplace that is intentionally in maintenance mode.

That description is supported by the route and module surfaces in `src/App.tsx`, `../admin-api/src/modules/app.module.ts`, `../marketplace-app/app`, `../marketplace-app/features`, `../zavoia-web/src/app/[locale]`, and `../marketplace/vercel.json`. It does **not** imply that every capability is production-deployed.

The best present product fit is a named practitioner delivering fixed-duration, price-bearing, one-to-one services at a physical or remote location. It is not currently a class-capacity system, clinic record system, repair-shop management system, point of sale, payroll system, or ecommerce platform. Those boundaries follow directly from the appointment, service and booking models in `../admin-api/src/entities/appointment.entity.ts`, `../admin-api/src/entities/service.entity.ts`, `../admin-api/src/modules/marketplace/appointments/dto/create-booking.dto.ts`, and `../admin-api/src/modules/appointment/run-grouping.ts`.

### Launch recommendation

1. Launch first into beauty, spa/wellness, tattoo and piercing, where the current named-staff and sequential-service model fits without requiring a new scheduling primitive.
2. Sell predictable software plus Romanian marketplace distribution. Launch with **0% marketplace commission** while marketplace liquidity and attribution are unproven.
3. Price Standard at **59 RON/month + VAT**, Plus at **119 RON/month + VAT**, and each additional non-owner seat at **39 RON/month + VAT**.
4. Keep Plus commercially gated until a public renderer consumes the frozen published snapshot. The dashboard editor alone is not a customer website.
5. Make permanent design ownership a trust feature: every essential section and one base variant included; optional cosmetic/conversion variants sold once for the business; no lifetime pricing for functionality with continuing cost.
6. Before charging Romanian VAT, design and validate the entire tax path: the audited code sets the issuer as non-VAT-paying and hard-codes 19%; subscription Checkout attaches neither `automatic_tax` nor a tax rate; Oblio treats Stripe line amounts as net with VAT excluded. Romania's standard rate has been 21% since 2025-08-01 (`../admin-api/src/modules/oblio/oblio.service.ts`, `../admin-api/src/modules/oblio/vat.util.ts`, `../admin-api/src/modules/billing/billing.service.ts`; sources `romania_vat_21`, `anaf_vat_2025`). Simply changing 19 to 21 can create invoice/payment mismatches. This is a launch blocker, not a price-setting detail.

### Recommended launch prices

| Product | Recommended price | Launch policy |
|---|---:|---|
| Standard | **59 RON/month + VAT** | All shipped non-builder SaaS and marketplace capabilities; owner included; SMS credits/messages purchased separately |
| Plus | **119 RON/month + VAT** | Standard (including separate SMS purchases) plus a complete public website product, only after the public-renderer gate |
| Additional non-owner seat | **39 RON/month + VAT** | Same price on Standard and Plus |
| Trial | **14 days** | Current flow is Standard-only; monthly launch; no annual discount before retention evidence |
| Marketplace commission | **0% at launch** | Direct, marketplace and repeat bookings all remain predictable while liquidity is unproven |
| Standard cosmetic variant | **29 RON + VAT once** | Permanent licence for one business |
| Premium/conversion layout | **59 RON + VAT once** | Permanent licence; no continuing compute/support obligation |
| Complex functional section | **99 RON + VAT once** | Only when its operation has no material continuing cost |
| Coordinated site-look pack | **199 RON + VAT once** | Matching variants across the whole site |

These are recommendations, not facts already configured in Stripe. Test catalogue values and the stale marketing value of 100 RON/€20 per professional are excluded completely. The live plan types contain Stripe price identifiers but no authoritative commercial amount (`../admin-api/src/entities/plan.entity.ts`, `../admin-api/src/entities/plan-pricing.entity.ts`). The 100 RON/€20 amount is presentation data in `../zavoia-web/src/lib/marketing/pricing.ts`, not an approved price.

### The strategic truth in four buckets

| Bucket | Evidence-backed conclusion |
|---|---|
| **Current advantage** | Multi-item booking and service bundles (`CODE007`, `CODE011`, `CODE012`); staff/location/service overrides (`../admin-api/src/entities/locationService.entity.ts`, `../admin-api/src/entities/userServiceLocation.entity.ts`); marketplace plus business operations (`src/App.tsx`, `../marketplace-app/app`); owner-included seat accounting (`CODE004`); permanent per-business design-purchase foundation (`CODE018`); stronger present marketplace filtering than the May audit described (`CODE008`). |
| **Near-term opportunity** | A booking-native, merchant-controlled website with public rendering, custom-domain portability, SEO controls, first-party analytics and transparent attribution; direct bookings that remain commission-free; careful migration/export; optional compliance logs for beauty operators. |
| **Table-stakes gap** | Customer payments/deposits and auditable refunds; external calendar sync; WhatsApp; operational recurring appointments; public website delivery; custom domains; deeper CRM/analytics; service-text search; dependable SMS segment accounting. |
| **Do not claim** | “The only booking platform with a website builder”; live merchant websites; custom domains; customer deposits/payments/payouts; recurring appointment series; verified business/booking/rating scale; collected revenue where the dashboard is summing scheduled list price; healthcare/repair-shop/class-management compliance. |

## 2. Evidence rules and status vocabulary

This audit uses no hidden market-size, conversion, cost, churn or willingness-to-pay assumption. A statement is one of:

- **Evidence:** directly supported by code or a dated source.
- **Recommendation:** a decision proposed by this audit, not a statement of existing behaviour.
- **Scenario:** arithmetic with visible inputs, not a forecast.
- **Unknown:** the needed datum was not available or not verifiable.

Product statuses mean:

| Status | Meaning in this audit |
|---|---|
| **Implemented** | An end-to-end product path is present in the audited repository snapshot. Deployment and production usage are not inferred. |
| **WIP** | Code exists but is uncommitted, incomplete, internally gated, or lacks a required consumer. |
| **Dormant** | A model, field or old product surface exists but no current operational end-to-end journey was found. |
| **Marketing-only** | The claim or UI copy exists without matching product evidence. |
| **Recommended** | The capability is not shipped in the audited product and is proposed here. |
| **Unknown** | The audit could not prove presence or absence from available code and official documentation. |

External-source priority is: law/regulator/statistics body; official pricing/terms/help/product documentation; professional register or association; app store; then secondary analysis. Reviews, Reddit, Trustpilot and Capterra are used only to discover pain patterns. They are never used to calculate prevalence, market size, market share or a hard commercial fact. When official sources disagree, both remain visible.

Source references such as `mero_pricing` and `CODE008` resolve to the source ledger. Access date is 2026-07-13 unless a row states otherwise.

### Cross-repository absence-search manifest

Absence findings were produced by searching the six repository roots, then manually inspecting every relevant hit. Exclusions were `.git`, dependency directories, generated/build output, platform caches, lock files and the research artifacts themselves. The reproducible query families were:

```text
(stripe.?connect|connected.?account|appointment.?payment|customer.?payment|deposit|payout|refund)
(google.?calendar|outlook.?calendar|apple.?calendar|ical|caldav|calendar.?sync)
(whatsapp|twilio.?whatsapp)
(gift.?card|loyalty|referral|customer.?chat|conversation|messaging.?thread)
(point.?of.?sale|\bpos\b|inventory|payroll)
(recurringGroupId|recurringIndex|isRecurringParent|recurring.?appointment|create.?series|edit.?series)
(websitePublishedSnapshot|websiteIsPublished|published.?snapshot|public.?renderer)
(custom.?domain|domain.?mapping|\bdns\b|certificate|\bssl\b)
(site.?seo|seo.?controls|canonical|open.?graph|site.?analytics|pageview|published.?site.?event)
(service.?name|service.?description|service.?text|search.?service)
```

Search scope:

```text
../admin-api
.
../admin-crm
../marketplace
../marketplace-app
../zavoia-web
```

Hits were not treated as implementation merely because a word appeared. For example, Stripe refund hits for Zavoia's website purchases do not create merchant appointment refunds; calendar-block recurrence does not create recurring appointment series; marketing copy does not create a domain. `CODE023` records this method. The conclusion remains bounded to this snapshot and cannot prove a private integration outside the repositories.

## 3. Repository architecture and product boundary

| Repository | Audited role | Product evidence |
|---|---|---|
| `admin-api` | NestJS/TypeORM system of record for businesses, subscriptions, schedules, appointments, customers, marketplace, SMS, invoicing and website-builder state | `../admin-api/src/modules/app.module.ts`; `../admin-api/src/entities`; `../admin-api/src/modules` |
| `admin-dashboard` | Business-owner and staff operations UI, including website editor and checkout | `src/App.tsx`; `src/features` |
| `admin-crm` | Zavoia internal administration for plans, businesses and website catalogue operations | `../admin-crm/src/App.jsx`; `../admin-crm/src/features`; `../admin-api/src/modules/admin-crm` |
| `marketplace-app` | Customer app for search, listing, booking, appointments, favourites, profile and support | `../marketplace-app/app`; `../marketplace-app/features` |
| `zavoia-web` | Public marketing site, SEO landing pages and web marketplace/booking/account routes | `../zavoia-web/src/app/[locale]`; `../zavoia-web/src/data/seo.ts` |
| `marketplace` | Legacy customer web product currently returning maintenance responses | `../marketplace/vercel.json`; `../marketplace/api/maintenance.*` |

### Reproducibility manifest

| Repository | Branch | HEAD on 2026-07-13 | Working-tree state at audit |
|---|---|---|---|
| `admin-api` | `website-builder` | `8e6bb4b9b71c2095ff894cbedf17d5f1d716d6af` | Dirty: 33 porcelain entries, including material modified/untracked builder/search/catalogue work |
| `admin-crm` | `main` | `76779284f85d6f8d8101c99e245f1d3fe6716c37` | Dirty: 11 entries, primarily website catalogue administration |
| `admin-dashboard` | `builder` | `efd8fd4877da3edfb7f2bd700801e86368933762` | Clean before this audit; now contains only the two untracked audit artifacts from this task |
| `marketplace` | `main` | `a204d177ec3eb90055f465c8507a595d9e5b0638` | Dirty: 2 entries |
| `marketplace-app` | `industries` | `5a1f47b48524c0a9558202d836308b54a3ef2539` | Dirty: 2 entries |
| `zavoia-web` | `industries` | `8423c3e8dd7dbc1a4b3f11b665644b5314731bb0` | Clean |

Material non-HEAD API evidence was hashed at audit time:

| Working-tree artifact | SHA-256 |
|---|---|
| `../admin-api/src/modules/website-builder/section-registry.ts` | `a5482cc223888015ae81c8f2edade0d327bea3097f3bad2e827b37a0d0cd22fa` |
| `../admin-api/src/modules/website-builder/website-builder.service.ts` | `84efc3d1156c5c8fb944276e1e050120fd713896d90cad991c0c3ee14a7aeb76` |
| `../admin-api/src/modules/website-builder/website-builder.controller.ts` | `fc5712b12c08951627fa877199eb27ce1f2b440a15686a3c5f66e10109e730eb` |
| `../admin-api/src/entities/businessMarketplaceListing.entity.ts` | `f82d74f5996458b13ef18a6720b6b3e51ab35a7890cfbb053bb265ea83a671e6` |
| `../admin-api/src/entities/website-checkout-attempt.entity.ts` | `d01eb4c24ebd975d9009754b8eada1c06f5200ac01dc53e7e8b4c100aa7284c4` |
| `../admin-api/src/modules/website-variants/website-variants.service.ts` | `bfd773850d883da15b6d9b72da1a5179c9317d95af5d5471c5d396ad16825abe` |
| `../admin-api/scripts/add-website-draft-metadata.sql` | `9656dad2ed2ec90c5c912925c07b54da948a905de3cd0488f9c2075287cabff2` |
| `../admin-api/scripts/add-website-publish.sql` | `c75bd4ed0540aa648533cd0f735e97e3a739312de43b987336577e8d89e0b147` |
| `../admin-api/scripts/seed-website-variant-catalog.sql` | `51488fa00897ca892e3674daded6745d5484fda95c4ea23c4fd4339cd060c60a` |
| `../admin-api/docs/industry-taxonomy.md` | `95905f768c28cf9a7f467068cceb547fd08817468f5a7aad4aa2d8cb4ddc2ffd` |
| `../admin-api/docs/marketplace-search-architecture.md` | `2017b53f8c93054ba717cf67557201e6dfde9f5857e919a0250cabbdf692f8f7` |
| `../admin-crm/src/features/websiteSections/components/WebsiteSectionsTable.tsx` | `29d34c4825f04daa641e82e610ee97b760fb07499e9998d0ddbed82b8d38aa46` |
| `../admin-crm/src/features/websiteVariants/types.ts` | `56d0f14d73b52ce10fee51566f423e2214d527645ac15c0d8499e47412ab9840` |
| `../admin-api/src/modules/admin-crm/services/website-section-admin.service.ts` | `2f0c2eb9062b4f4e411942f79ca7d7912e3a86b4ca10e79925fc3ef565d90068` |
| `../admin-api/src/modules/admin-crm/services/website-variant-admin.service.ts` | `948034f1211f8f6859395510e122c4223d55e0e2460e58a2d8bdd4b576222f48` |

These hashes detect later drift; they do not make uncommitted code reconstructable after the worktree changes. Preserve or commit that work separately if the exact product snapshot must be rebuilt.

### Business-owner journey

1. **Create and onboard.** The business flow creates the business and receives a 14-day Standard trial. The trial choice is explicit in `../admin-api/src/modules/wizard/wizard.controller.ts`; tier features come from `../admin-api/src/types/plan.ts` and `../admin-api/src/modules/entitlements/entitlements.service.ts`.
2. **Configure supply.** The owner manages locations (including physical/remote modes), services, bundles, team membership, assignments, schedules and overrides through `src/App.tsx`, `src/features/locations`, `src/features/services`, `src/features/bundles`, `src/features/teamMembers`, `src/features/assignments`, and their API modules under `../admin-api/src/modules`.
3. **Publish to discovery.** Marketplace listing data and publication state are handled in `../admin-api/src/modules/marketplace-listing`, `../admin-api/src/entities/businessMarketplaceListing.entity.ts`, and `src/features/marketplace`.
4. **Operate appointments.** Owners use calendar/manual appointment/customer views in `src/features/calendar` and `src/features/customers`, backed by `../admin-api/src/modules/appointment` and `../admin-api/src/modules/businessCustomers`.
5. **Monitor and respond.** Dashboard metrics, notifications and reviews exist in `../admin-api/src/modules/dashboard`, `../admin-api/src/modules/notifications`, `../admin-api/src/modules/review`, and the corresponding dashboard features. “Revenue” is not collected cash: the server computes potential revenue from scheduled list prices while excluding cancelled appointments (`../admin-api/src/modules/dashboard/dashboard.service.ts`).
6. **Pay Zavoia.** The owner pays a base plan plus additional non-owner seats, can buy SMS separately, and can buy permanent website variants/sections through one-time payment flows (`../admin-api/src/modules/billing/billing.service.ts`, `../admin-api/src/modules/sms`, `../admin-api/src/modules/website-variants`).

### Customer journey

1. **Discover.** The app and web expose search/list/map/business detail surfaces (`../marketplace-app/app`, `../marketplace-app/features/search`, `../marketplace-app/features/listings`, `../zavoia-web/src/app/[locale]/search`, `../zavoia-web/src/app/[locale]/business/[slug]/page.tsx`).
2. **Filter.** The API can match fuzzy business/location names, diacritic-tolerant industry tags, structured filters, geography, service/staff and availability (`../admin-api/src/modules/marketplace/public/marketplace-public.service.ts`). General free text is not a full service-name/description search; explicit service filters do exist.
3. **Choose.** Customers can inspect listing, services/bundles, staff and reviews in `../marketplace-app/features/listings`, `../marketplace-app/features/booking`, and the corresponding web routes.
4. **Identify.** Discovery can be public; protected actions use customer email/password or Google authentication, with verification, reset and account-linking flows across the API, app and web (`../admin-api/src/modules/marketplace/auth/customer-auth.controller.ts`, `../marketplace-app/features/auth`, `../zavoia-web/src/app/[locale]/auth`).
5. **Book.** A booking can contain sequential service or bundle items. Each item selects staff; same-staff adjacent items can be grouped into a composite run while staff changes produce separate appointment rows (`../admin-api/src/modules/marketplace/appointments/dto/create-booking.dto.ts`, `../admin-api/src/modules/appointment/run-grouping.ts`, `../admin-api/src/modules/marketplace/appointments/appointments.service.ts`). This is multi-service booking, not a multi-customer class.
6. **Manage and get help.** Customers can list/detail, cancel, reschedule, rebook and review appointments, manage profile/preferences/security, use the notification inbox and create support tickets (`../marketplace-app/features/appointments/api.ts`, `../marketplace-app/components/appointments/detail/appointment-detail-view.tsx`, `../marketplace-app/features/customer`, `../marketplace-app/features/support`, `../zavoia-web/src/app/[locale]/appointments`, `../zavoia-web/src/app/[locale]/account`, `../admin-api/src/modules/marketplace/customer`, `../admin-api/src/modules/marketplace/support`).
7. **Payment boundary.** No end-to-end customer appointment payment or deposit flow was found, and no external payment method is inferred. Current Stripe usage pays Zavoia for SaaS, SMS and website purchases, not the merchant for a customer appointment (`../admin-api/src/modules/billing`, `../admin-api/src/modules/sms`, `../admin-api/src/modules/website-variants`, `../admin-api/src/modules/oblio`).

## 4. Capability audit

### 4.1 Business operations

| Capability | Status | What the code supports / boundary | Source path(s) |
|---|---|---|---|
| Business onboarding and trial | **Implemented** | Standard-only trial for 14 days; trial does not boost Plus features | `../admin-api/src/modules/wizard/wizard.controller.ts`; `../admin-api/src/modules/entitlements/entitlements.service.ts` |
| Standard/Plus/Custom tier model | **Implemented** | Standard and Plus are self-serve; Custom is assigned outside self-serve | `../admin-api/src/types/plan.ts` |
| Location management | **Implemented** | Multiple physical/remote locations and location business settings | `src/features/locations`; `../admin-api/src/modules/location`; `../admin-api/src/entities/location.entity.ts` |
| Service catalogue | **Implemented** | Duration/price-bearing services used by assignments and booking | `src/features/services`; `../admin-api/src/modules/service`; `../admin-api/src/entities/service.entity.ts` |
| Bundles/packages | **Implemented** | Service collections bookable as contiguous bundle units; internal bundle service order is not durably modelled | `src/features/bundles`; `../admin-api/src/modules/bundle`; `../admin-api/src/entities/serviceBundle.entity.ts`; `../admin-api/src/entities/locationBundle.entity.ts` |
| Team management | **Implemented** | Owner plus non-owner business users | `src/features/teamMembers`; `../admin-api/src/modules/team`; `../admin-api/src/entities/userRole.entity.ts` |
| Granular permission designer | **Recommended** | Fixed application roles/role checks exist; no merchant-configurable permission matrix was found | `src/shared/lib/permissions.ts`; `src/features/auth/components/ProtectedRoute.tsx`; `../admin-api/src/guards` |
| Staff-service-location assignments | **Implemented** | Supply can vary by staff and location | `src/features/assignments`; `../admin-api/src/modules/assignments` |
| Availability and overrides | **Implemented** | Business/staff/location schedules and exceptions feed slot generation | `src/features/locations`; `src/features/calendar`; `../admin-api/src/modules/availability`; `../admin-api/src/modules/staff-schedule` |
| Manual appointments and calendar | **Implemented** | Owner-facing appointment operations | `src/features/calendar`; `../admin-api/src/modules/appointment` |
| Multi-service/composite booking | **Implemented** | Sequential item booking and run grouping | `../admin-api/src/modules/appointment/run-grouping.ts`; `../admin-api/src/modules/marketplace/appointments/appointments.service.ts` |
| Multi-customer classes/capacity | **Recommended** | Current appointment rows represent one customer/booking sequence, not class capacity | `../admin-api/src/entities/appointment.entity.ts`; `../admin-api/src/modules/marketplace/appointments/dto/create-booking.dto.ts` |
| Operational recurring appointments | **Dormant** | Recurrence metadata is stored/returned, but no series-creation or series-management journey was found; recurrence logic found is for calendar blocks | `../admin-api/src/entities/appointment.entity.ts`; `../admin-api/src/modules/marketplace/appointments/appointments.service.ts`; `../admin-api/src/modules/calendar-block` |
| Customer directory / light CRM | **Implemented** | Search, history, notes, custom fields, source and merge status; main list requests offset 0/limit 20 and has no visible paging/load-more | `src/features/customers/pages/customers.tsx`; `../admin-api/src/entities/businessCustomer.entity.ts`; `../admin-api/src/modules/businessCustomers/business-customer.service.ts` |
| Customer merge | **Implemented** | Duplicate records can be merged through the customer service | `../admin-api/src/modules/businessCustomers/business-customer.service.ts` |
| Customer history PDF | **Implemented** | History export exposed from the customer workflow | `src/features/customers`; `../admin-api/src/modules/businessCustomers` |
| Marketing automation, loyalty and campaigns | **Recommended** | No end-to-end domain was found; static offer UI is not an operational promotion system | `../marketplace-app/components/home/offers-overlay.tsx`; repository-wide searches recorded in `CODE023` |
| Dashboard metrics | **Implemented** | Counts and potential revenue analytics | `src/features/dashboard`; `../admin-api/src/modules/dashboard/dashboard.service.ts` |
| Owner support tickets | **Implemented** | Authenticated business owners can create tickets, exchange messages and view their support history | `src/features/support`; `../admin-api/src/modules/support` |
| Collected-revenue reporting | **Marketing-only** | UI wording can say revenue, but the server sums scheduled list price and is not reconciling merchant payments | `../admin-api/src/modules/dashboard/dashboard.service.ts`; `src/features/dashboard` |
| Review visibility | **Implemented** | Marketplace customer review lifecycle and owner read surface; business API is GET-only, with no reply/hide workflow | `../admin-api/src/modules/review/review.controller.ts`; `src/features/reviews`; `../marketplace-app/features/appointments/api.ts`; `../marketplace-app/features/listings/api.ts` |
| External calendar sync | **Recommended** | No Google/Apple/Outlook two-way calendar integration was found | repository-wide searches recorded in `CODE023` |
| WhatsApp messaging | **Recommended** | No operational WhatsApp provider/inbox/consent workflow was found | repository-wide searches recorded in `CODE023` |
| SMS purchase and send | **Implemented** | SMS is purchased separately and Twilio-backed | `../admin-api/src/modules/sms/sms.service.ts`; `../admin-api/src/modules/sms/sms-pricing.service.ts` |
| SMS segment-aware charging | **Recommended** | One internal credit is deducted per send call, while carrier billing is per segment | `../admin-api/src/modules/sms/sms.service.ts`; sources `twilio_ro_sms`, `twilio_segments` |
| Owner in-app notification inbox | **Implemented** | Owner notification domain and dashboard read-state surface exist | `../admin-api/src/modules/business-notification`; `src/features/notifications` |
| Customer email/SMS appointment reminders | **Implemented** | Reminder service sends configured customer email/SMS lifecycle messages subject to booking settings/preferences; push delivery is bounded by dormant device registration below | `../admin-api/src/modules/notifications/reminder.service.ts`; `../admin-api/src/entities/bookingSettings.entity.ts`; `../admin-api/src/modules/marketplace/customer/customer.controller.ts` |
| Customer notification inbox/read state | **Implemented** | Customer API and app inbox expose notification list/read state | `../admin-api/src/modules/marketplace/customer/customer.controller.ts`; `../marketplace-app/app/notifications-inbox.tsx`; `../marketplace-app/features/push-notifications/api.ts` |
| Customer device push-token registration | **Dormant** | Listener/token code exists, but registration has no call site and the hook does not request/register | `../marketplace-app/features/push-notifications/service.ts`; `../marketplace-app/features/push-notifications/hooks.ts`; `../marketplace-app/providers/push-notification-provider.tsx` |
| Customer deposits/payments | **Recommended** | Stripe is not connected to merchant appointment checkout | `../admin-api/src/modules/billing`; `../admin-api/src/modules/sms`; `../admin-api/src/modules/website-variants` |
| Merchant payouts/refunds | **Recommended** | No appointment-money ledger, connected-account payout or customer refund workflow was found | same as above; repository-wide searches recorded in `CODE023` |
| Payroll/POS/inventory | **Recommended** | Consider only if strategy expands; not part of the current product model and not needed for the recommended first launch claim | repository-wide searches recorded in `CODE023` |

### 4.2 Marketplace and customer experience

| Capability | Status | What the code supports / boundary | Source path(s) |
|---|---|---|---|
| Customer authentication and recovery | **Implemented** | Email/password registration and login, verification/reset flows and social-account linking surfaces exist across API, app and web | `../admin-api/src/modules/marketplace/auth/customer-auth.controller.ts`; `../marketplace-app/features/auth`; `../zavoia-web/src/app/[locale]/auth` |
| Customer profile, preferences and account security | **Implemented** | Profile/preferences, password/security and account-deletion operations are exposed through the customer API and customer clients | `../admin-api/src/modules/marketplace/customer/customer.controller.ts`; `../marketplace-app/features/customer`; `../zavoia-web/src/app/[locale]/account` |
| Customer support tickets | **Implemented** | Authenticated customers can create, list, view, reply to and close tickets; guests can create tickets; app and web account support surfaces exist | `../admin-api/src/modules/marketplace/support`; `../marketplace-app/features/support`; `../zavoia-web/src/app/[locale]/account/_components/support-section.tsx` |
| Business marketplace publication | **Implemented** | Listing configuration and publish state exist | `src/features/marketplace`; `../admin-api/src/modules/marketplace-listing`; `../admin-api/src/entities/businessMarketplaceListing.entity.ts` |
| Business/location name search | **Implemented** | Fuzzy and substring matching | `../admin-api/src/modules/marketplace/public/marketplace-public.service.ts` |
| Diacritic-tolerant industry discovery | **WIP** | `unaccent`/similarity-assisted tag matching exists, but deployment is at risk because the initial migration provisions `postgis`/`pg_trgm`, not `unaccent` | `../admin-api/src/modules/marketplace/public/marketplace-public.service.ts`; `../admin-api/src/migrations/1783170407985-Init.ts` |
| Structured industry/tag filters | **Implemented** | Explicit structured filters | `../admin-api/src/modules/marketplace/public/marketplace-public.service.ts`; `../admin-api/docs/industry-taxonomy.md` |
| Geography and map search | **Implemented** | Location/map-point based search | `../admin-api/src/modules/marketplace/public/marketplace-public.service.ts`; `../marketplace-app/features/search`; `../marketplace-app/features/location` |
| Availability/service/staff filters | **WIP** | The API supports structured availability/service/staff filters, but customer search surfaces expose only a subset and mobile has no dedicated filters sheet | `../admin-api/src/modules/marketplace/public/marketplace-public.service.ts`; `../marketplace-app/app/(tabs)/search.tsx`; `../marketplace-app/features/search`; `../zavoia-web/src/app/[locale]/search` |
| General service-text search | **Recommended** | Free text is not a complete service name/description search; explicit service selection is supported | `../admin-api/src/modules/marketplace/public/marketplace-public.service.ts` |
| Search relaxation/fallback | **Implemented** | Ranked relaxation path exists when strict search is sparse | `../admin-api/src/modules/marketplace/public/marketplace-public.service.ts`; `../admin-api/docs/marketplace-search-architecture.md` |
| Listing/detail surface | **Implemented** | App and web business detail, service, team and reviews | `../marketplace-app/app`; `../marketplace-app/features/listings`; `../zavoia-web/src/app/[locale]/business/[slug]/page.tsx` |
| Customer booking | **Implemented** | Service/bundle booking with staff and slot selection across app and web | `../marketplace-app/features/booking/api.ts`; `../zavoia-web/src/app/[locale]/business/_components/business-detail.tsx`; `../zavoia-web/src/lib/api/marketplace/appointments.ts`; `../admin-api/src/modules/marketplace/appointments` |
| Booking idempotency | **WIP** | A 10-minute process-memory key cache exists; transaction conflict checks exist, but durable cross-process idempotency was not found | `../admin-api/src/modules/marketplace/appointments/appointments.service.ts` |
| Cancel/reschedule/rebook | **Implemented** | Customer lifecycle paths exist | `../marketplace-app/features/appointments/api.ts`; `../marketplace-app/components/appointments/detail/appointment-detail-view.tsx`; `../admin-api/src/modules/marketplace/appointments` |
| Favourites | **Implemented** | Customer save/list flow | `../marketplace-app/features/favorites`; `../zavoia-web/src/app/[locale]/saved` |
| Customer reviews | **Implemented** | Appointment-linked review flow; completed status is not enforced by submit service | `../marketplace-app/features/appointments/api.ts`; `../marketplace-app/features/listings/api.ts`; `../admin-api/src/modules/review`; `../admin-api/src/modules/marketplace/customer/customer.service.ts` |
| Promotion/offers engine | **Marketing-only** | Demo only: no endpoints exist; app returns fabricated London businesses, stock images, ratings and offers from placeholder data | `../marketplace-app/features/home/api.ts`; `../marketplace-app/features/home/placeholder-data.ts`; `../marketplace-app/components/home/offers-overlay.tsx` |
| Referral/loyalty/gift cards | **Recommended** | No end-to-end implementation found | repository-wide searches recorded in `CODE023` |
| Customer-provider chat | **Recommended** | No marketplace conversation domain found | repository-wide searches recorded in `CODE023` |
| Native/public web parity | **WIP** | Both app and web journeys exist, but route and feature depth differ | `../marketplace-app/app`; `../zavoia-web/src/app/[locale]` |
| Public SEO discovery structure | **WIP** | Static city/industry/locale pages are indexable but show “Businesses coming soon”; live search/business routes are noindex | `../zavoia-web/src/data/seo.ts`; `../zavoia-web/src/app/[locale]/[city]/[industry]/page.tsx`; `../zavoia-web/src/app/_components/category-content.tsx`; `../zavoia-web/src/app/[locale]/search/page.tsx`; `../zavoia-web/src/app/[locale]/business/[slug]/page.tsx` |
| Mobile Romanian localisation | **WIP** | EN/RO infrastructure exists, but substantial profile, booking-success, favourites, support/settings and search UI remains hard-coded English | `../marketplace-app/i18n`; `../marketplace-app/app/(tabs)/profile.tsx`; `../marketplace-app/app/booking-success.tsx`; `../marketplace-app/app/(tabs)/favorites.tsx` |
| Customer legal/company disclosures | **Marketing-only** | Launch blocker: mobile terms/cookie pages are Lorem Ipsum and company identifiers/contact details are fabricated placeholders; public web links point to absent legal routes | `../marketplace-app/app/terms-and-conditions.tsx`; `../marketplace-app/app/cookies-policy.tsx`; `../marketplace-app/app/company-details.tsx`; `../zavoia-web/src/components/shell/footer.tsx`; `../zavoia-web/src/app/[locale]/[city]/[industry]/page.tsx` |
| Newsletter signup | **Marketing-only** | Web footer shows success without calling an endpoint | `../zavoia-web/src/components/shell/footer.tsx` |
| Verified marketplace scale | **Marketing-only** | Public copy contains partner, booking and rating figures not substantiated by product records supplied to this audit | `../zavoia-web/src/i18n`; source `CODE019` |
| Legacy marketplace | **Dormant** | All non-API/public app traffic is rewritten to a 503/noindex maintenance handler | `../marketplace/vercel.json`; `../marketplace/api/maintenance.*` |

### 4.3 Billing and ownership

| Capability | Status | Evidence and boundary | Source path(s) |
|---|---|---|---|
| Owner included | **Implemented** | Billable seats exclude the owner | `../admin-api/src/modules/entitlements/entitlements.service.ts`; `../admin-api/src/modules/billing/billing.service.ts` |
| Non-owner seat billing | **Implemented** | Subscription contains base plus seat quantity | `../admin-api/src/entities/plan.entity.ts`; `../admin-api/src/modules/billing/billing.service.ts` |
| Regional price lookup | **Implemented** | Country/currency overrides can select Stripe price IDs | `../admin-api/src/entities/plan-pricing.entity.ts`; `../admin-api/src/modules/billing/billing.service.ts` |
| Upgrade/downgrade handling | **Implemented** | Immediate/prorated upgrades and period-end downgrade logic | `../admin-api/src/modules/billing/billing.service.ts` |
| Standard/Plus feature difference | **Implemented** | Only explicit tier feature flag is website builder | `../admin-api/src/types/plan.ts` |
| Lifetime deal support | **Implemented** | Alternate business entitlement path exists | `../admin-api/src/modules/billing/billing.service.ts`; `../admin-api/src/modules/entitlements/entitlements.service.ts` |
| Separate SMS checkout | **Implemented** | Regional packages and one-time payment | `../admin-api/src/modules/sms/sms-pricing.service.ts`; `../admin-api/src/entities/sms-purchase.entity.ts` |
| One-time website purchase foundation | **Implemented** | Committed Stripe `payment` checkout, webhook completion/history/refund revocation and dashboard cart exist | `../admin-api/src/modules/website-variants/website-variants.service.ts`; `src/features/website/api.ts`; `src/features/website/components/builder/VariantPurchaseDialog.tsx` |
| Website checkout hardening | **WIP** | Durable checkout attempts/status polling and related indexes are uncommitted | `../admin-api/src/entities/website-checkout-attempt.entity.ts`; `../admin-api/src/modules/website-variants/website-variants.service.ts` |
| Permanent design ownership | **Implemented** | Completed purchases are business-scoped and explicitly survive subscription downgrade; public website delivery remains absent | `../admin-api/src/entities/website-variant-purchase.entity.ts`; `../admin-api/src/entities/website-section-purchase.entity.ts` |
| Authoritative public prices | **Unknown** | No approved production amounts exist in repository truth; excluded test/stale amounts are not evidence | `../admin-api/src/entities/plan.entity.ts`; `../zavoia-web/src/lib/marketing/pricing.ts` |
| Correct Romanian VAT collection/invoicing | **WIP** | Launch blocker: issuer VAT flag false; VAT utility hard-coded to 19%; subscription Checkout attaches no tax; Oblio treats Stripe lines as net; current statutory standard is 21% | `../admin-api/src/modules/billing/billing.service.ts`; `../admin-api/src/modules/oblio/oblio.service.ts`; `../admin-api/src/modules/oblio/vat.util.ts`; `romania_vat_21`; `anaf_vat_2025` |

### 4.4 Internal operator/admin CRM

This is an internal operating surface, not a merchant or customer feature. Its existence matters to launch operations and catalogue governance, but it should not be marketed as customer-facing product value.

| Capability | Status | What the code supports / boundary | Source path(s) |
|---|---|---|---|
| Internal authentication and protected operator shell | **Implemented** | Login, protected routes and operator navigation exist | `../admin-crm/src/App.jsx`; `../admin-crm/src/features/auth`; `../admin-api/src/modules/admin-crm` |
| Business, owner and customer administration | **Implemented** | Operator list/detail surfaces cover businesses, owners and marketplace customers, including marketplace moderation controls | `../admin-crm/src/features/business`; `../admin-crm/src/features/business-owners`; `../admin-crm/src/features/customers`; `../admin-api/src/modules/admin-crm` |
| Plan and regional Stripe-price administration | **Implemented** | Operators can manage plans and country/currency pricing identifiers; this does not supply an approved production price | `../admin-crm/src/features/plans`; `../admin-api/src/modules/admin-crm/admin-crm.service.ts`; `../admin-api/src/entities/plan-pricing.entity.ts` |
| Support, tickets and review moderation | **Implemented** | Operator support/ticket queues and review administration are routed in the CRM | `../admin-crm/src/features/support`; `../admin-crm/src/features/tickets`; `../admin-crm/src/features/review`; `../admin-crm/src/features/reviews`; `../admin-api/src/modules/admin-crm` |
| Token and industry-taxonomy administration | **Implemented** | Verification/refresh-token and industry management surfaces exist | `../admin-crm/src/features/verification-tokens`; `../admin-crm/src/features/refresh-tokens`; `../admin-crm/src/features/industry`; `../admin-api/src/modules/admin-crm` |
| SMS catalogue and invoice operations | **Implemented** | Internal SMS package/catalogue and invoice/failed-payment retry operations exist | `../admin-crm/src/features/sms`; `../admin-crm/src/features/invoices`; `../admin-api/src/modules/admin-crm/services/sms-admin.service.ts`; `../admin-api/src/modules/admin-crm/services/invoice-admin.service.ts` |
| Website section/variant catalogue administration | **WIP** | Catalogue routes and CRUD foundations exist; commercial-field and checkout-related changes were uncommitted at audit time | `../admin-crm/src/features/websiteSections`; `../admin-crm/src/features/websiteVariants`; `../admin-api/src/modules/admin-crm/services/website-section-admin.service.ts`; `../admin-api/src/modules/admin-crm/services/website-variant-admin.service.ts`; `CODE041` |

## 5. Website-builder readiness

### What exists in the audited working tree

The editor has **12 section types and 37 implemented dashboard renderer variants**:

| Section type | Renderer variants | Base variant included by design |
|---|---:|---|
| Announcement | 3 | `bar` |
| Navigation | 1 | `default` |
| Hero | 1 | `default` |
| Marquee | 2 | `scroll` |
| About | 4 | `simple` |
| Locations | 3 | `switcher` |
| Gallery | 4 | `editorial` |
| Team | 2 | `portraits` |
| Interlude | 1 | `default` |
| Testimonials | 5 | `default` |
| FAQ | 6 | `accordion` |
| Footer | 5 | `default` |
| **Total** | **37** | **12 base variants** |

The count is reproducible from `src/features/website/components/builder/sectionCatalog.ts` and its API validation mirror at `../admin-api/src/modules/website-builder/section-registry.ts`. Navigation, hero and footer are required; announcement, navigation, hero and footer have fixed positional rules (`../admin-api/src/modules/website-builder/section-registry.ts`).

The current WIP API implements a draft/version/publish design in which publication freezes a validated snapshot and records publish metadata (`../admin-api/src/modules/website-builder/website-builder.service.ts`, `../admin-api/src/modules/website-builder/website-builder.controller.ts`, `../admin-api/src/entities/businessMarketplaceListing.entity.ts`, `../admin-api/scripts/add-website-publish.sql`, `../admin-api/scripts/add-website-draft-metadata.sql`). A committed purchase foundation already supports business-scoped permanent section/variant ownership, one-time Stripe checkout, completion/history and refund revocation (`../admin-api/src/entities/website-section-purchase.entity.ts`, `../admin-api/src/entities/website-variant-purchase.entity.ts`, `../admin-api/src/modules/website-variants/website-variants.service.ts`). Durable checkout-attempt idempotency and status polling are WIP hardening (`../admin-api/src/entities/website-checkout-attempt.entity.ts`; current uncommitted website-variant service changes).

The seed catalogue is not commercial evidence. It exposes 12 free base entries and 16 paid entries, leaves nine implemented non-base renderer variants undecided/hidden, and gives paid entries placeholder EUR 9 values (`../admin-api/scripts/seed-website-variant-catalog.sql`). Those amounts are excluded from this audit's recommendation.

### What does not yet make it a sellable website product

No marketplace customer surface consumes the published snapshot. Repository searches found no `websitePublishedSnapshot`/published-layout consumer in `marketplace-app`, `zavoia-web` or legacy `marketplace`. The current public web business route renders the ordinary marketplace listing and explicitly sets `index: false` (`../zavoia-web/src/app/[locale]/business/[slug]/page.tsx`).

| Required public-site component | Status at audit date | Evidence |
|---|---|---|
| Dashboard editor and local renderers | **Implemented** | `src/features/website/components/builder`; `src/features/website/components/builder/sectionCatalog.ts` |
| Draft/version API and schema | **WIP** | uncommitted `../admin-api/src/modules/website-builder`; `../admin-api/scripts/add-website-draft-metadata.sql` |
| Frozen publish snapshot | **WIP** | `../admin-api/src/modules/website-builder/website-builder.service.ts`; `../admin-api/scripts/add-website-publish.sql` |
| One-time checkout and permanent ownership | **Implemented** | Committed purchase entities/service and dashboard cart/dialog under `../admin-api/src/modules/website-variants`, `../admin-api/src/entities/website-*-purchase.entity.ts`, and `src/features/website` |
| Checkout idempotency/status hardening | **WIP** | uncommitted checkout-attempt entity, indexes and owner-scoped status polling in `../admin-api/src/modules/website-variants` and `../admin-api/scripts` |
| Public renderer consuming snapshot | **Recommended** | Launch blocker: no consumer in any customer-facing repo; `CODE013` |
| Public site routing and canonical URL | **Recommended** | no builder-site route in `zavoia-web`; `CODE013` |
| Merchant-owned custom domain and SSL | **Recommended** | no domain/DNS/certificate model or workflow found; `CODE013` |
| Page-level title/meta/OG/canonical controls | **Recommended** | no published-site SEO control model found; `CODE013` |
| Sitemap/robots behaviour for merchant site | **Recommended** | ordinary listing currently noindexed; `../zavoia-web/src/app/[locale]/business/[slug]/page.tsx` |
| Site traffic and conversion analytics | **Recommended** | no published-site pageview/source/conversion events found; `CODE013` |
| Domain/content/design export policy | **Recommended** | No documented merchant portability contract found; `CODE013` |

**Commercial gate:** do not sell Plus as a functioning website product until a stable public route renders the frozen snapshot, preview/publish isolation is tested, and rollback works. Custom-domain, SEO and analytics can be phased, but the public renderer cannot.

### The website-builder claim must change

Website builders already exist in this category:

- SimplyBook.me documents templates, multiple pages, menu ordering, galleries, news/blog, iframe widgets and custom CSS (`simplybook_builder`), plus a €119 one-time custom-domain connection feature (`simplybook_domain`).
- Vagaro MySite documents a full booking website with ecommerce, blog, portfolio, forms and SEO; the US add-on is recurring and custom professional design is $299 once with $50 extra pages/revisions (`WB001`–`WB004`).
- Square Appointments offers a simple booking page or full Square website, with its current US plans at $0/$49/$149 per location (`WB007`–`WB009`).
- Planific includes a hosted site with nine content-zone types, with online booking from its Business tier (`planific_builder`, `planific_features`).
- Reservio offers a constrained booking-site editor, own subdomain/custom-domain options on higher plans, and preset sections/layouts (`reservio_booking_website`, `reservio_customization`, `reservio_domain`).

Therefore “no competitor has a website builder” is false. The defensible whitespace is narrower and better:

> A booking-native, merchant-controlled website combined with Romanian marketplace distribution, permanent design ownership, transparent booking attribution and merchant-owned custom-domain portability.

This is a **near-term opportunity**, not a current advantage, until the delivery gaps above are closed.

### Recommended ownership contract

The following is policy recommended by this audit, not current legal advice or a representation of existing terms:

1. The merchant owns uploaded copy, images, customer data and its registered domain.
2. Zavoia owns the builder software, renderer and Zavoia-created design system.
3. A paid section/variant licence is permanent for one business, including after redesign or plan downgrade. It becomes usable again when Plus is active.
4. Every essential section and at least one production-quality base variant is included in Plus. Core booking/site operability can never depend on an add-on.
5. Domains are registered to the merchant and charged separately at transparent pass-through cost. Zavoia must not create a non-transferable domain lock-in like the policy documented for domains bought through Vagaro (`WB005`).
6. AI generation, campaigns, advanced analytics, storage-heavy media or any feature with continuing compute/support cost remains subscription-priced, never a lifetime unlock.
7. Refund, deactivation and redesign semantics must be stated before checkout. Shopify's one-store theme licence (`WB040`), Framer's single-use licence (`WB052`) and Webflow's one-project licence (`WB048`) show that per-business licensing is familiar, but Zavoia should be more explicit about downgrade survival.

## 6. Competitive landscape

Prices below are the current official public values verified on 2026-07-13. They are not silently converted because country, VAT, card origin, staff/location unit, promotion and billing period materially change the comparison. “Not documented” means the cited official surfaces did not document it; it does not prove the capability does not exist in a private, beta or negotiated product.

### 6.1 Romania-first direct and nearby competitors

| Competitor | Current public commercial model | Discovery / website surface | Verified strategic reading | Sources |
|---|---|---|---|---|
| **MERO** | €34.99/month excluding VAT, one professional included; €9.99/additional active professional; unlimited bookings/SMS; 14-day trial | Romanian marketplace profile and booking links from owned channels; full merchant site builder not documented | The strongest direct benchmark in this audit. At the dated ECB reference rate used in §11.7, €34.99 is about 183.11 RON ex VAT; Zavoia must not claim feature parity in payments/reporting merely from a lower price | `mero_pricing`, `mero_product`, `mero_gift_cards`, `mero_appstore`, `ecb_fx_20260710` |
| **Stailer** | Web: 175 RON per 30 days for the whole salon, “+ VAT where applicable”; 25 RON credits; card-required seven-day trial; configurable 0%–100% new-client commission. App Store separately lists monthly Pro 239.99 RON and Individual 139.99 RON subscriptions | Auto-created web page and current business app | The channel-price conflict is unresolved. Current official surfaces show an operating offer; the May audit's “effectively offline” conclusion is stale and must not be repeated | `stailer_pricing`, `stailer_terms`, `stailer_model_change`, `stailer_appstore` |
| **Fresha** | Official pricing is geolocation-dynamic and produced conflicting audit-time renders: a USD view showed 19.95/month Independent, 14.95/month per bookable member, taxes excluded and 20%/USD 6 new-client fee; a PLN view showed 29/19 PLN, 23% tax excluded and the new-client line free. No stable Romania-specific numeral is used | Active Bucharest marketplace and profile/direct links; full merchant-controlled site builder not documented | Official help confirms monthly Independent/Team billing by bookable members and general one-time attribution mechanics. The conflict itself is why Zavoia must publish country-specific, auditable prices | `fresha_pricing`, `fresha_pricing_pln`, `fresha_plan_help`, `fresha_bucharest`, `fresha_profile`, `fresha_direct_links`, `fresha_new_client_fee` |
| **Notino Partner** | Basic free forever; Premium currently free in 2026 | Booking web/app plus retail-affiliate ecosystem | The zero price exists inside a broader retail/affiliate ecosystem and cannot be treated as a reproducible pure-SaaS floor | `notino_pricing`, `notino_about`, `notino_affiliate`, `notino_premium_update` |
| **Bookr** | Free: one staff and 100 appointments/month; Gold €24.99 monthly; Platinum €44.99 monthly; paid tiers list unlimited staff; annual €249.99/€449.99 | Marketplace and “Magic link” generated site/profile | The page says annual saves 20%, but listed totals are about 16.7% below twelve monthly payments; a separate EXTRA20 first-transaction offer has no end date. Generated presence is verified; free-form section editing/custom domain is not documented | `bookr_pricing`, `bookr_business`, `bookr_payments` |
| **Planific** | Services-family plans: Free, then 40/50/70 RON monthly + VAT for Basic/Business/Premium; annual-effective 34/42/59. Other subscription and combined plan families also exist | Hosted `name.planific.ro` site with nine zones; booking begins at Business | Directly disproves website-builder uniqueness. Its 50–70 RON Services-family business tiers anchor the low local range | `planific_pricing`, `planific_builder`, `planific_features` |
| **Programo** | 59 RON/month without SMS, routed through WhatsApp; 89 RON/month with unlimited SMS is presented as a no-end-date promotion from 139 RON (“save 36%”); 50-booking free allowance | Branded booking page | Direct anchor near Zavoia Standard, but VAT and included staff/location basis are not documented. “Unlimited SMS” is not a safe Zavoia promise while internal credits ignore segments | `programo_product_pricing` |
| **OcupaLoc** | 59.99 RON/month; 14-day trial; no booking commission | Public booking link | Nearly exact Standard price anchor; customer payment at booking explicitly not included | `ocupaloc_pricing` |
| **Planifico** | 0/99/199/399 RON monthly, excluding VAT; extra SMS 0.50 RON and WhatsApp 0.35 RON | Booking/operations product | Shows room for multi-tier local ARPU when notification limits and operations depth are explicit | `planifico_pricing`, `planifico_terms` |
| **Minara** | 0.20 RON/booking or 0.50 RON with SMS; the same page contradicts itself between the first 200 and first 300 bookings being free | Public salon page with gallery/team/services/map/booking | Usage pricing makes spend scale with bookings and transfers volume risk; the promotion allowance is unknown, VAT is not documented, and traction is unknown | `minara_pricing` |
| **Calendis** | Start/Optim/Nelimitat 39/65/95 RON per specialist/month excluding VAT; one-month trial; 0.16 RON/SMS on Start/Optim and SMS included on Nelimitat | Marketplace plus website/Facebook button | Current pricing is public, while terms still say price/details are agreed in writing. The calculator converts 65 to 77.35 gross—19%, not current 21%—and the features page separately says the first 100 SMS are granted once. Preserve these conflicts | `calendis_pricing`, `calendis_features`, `calendis_terms` |

Additional local price anchors—not substitutes for a two-sided marketplace—are MyAgenda at 25/39 RON VAT included and Sclipi at launch prices of 39/79/159 RON against 49/99/199, for 1/up-to-5/unlimited users. Sclipi separately advertises 20% off annual payment without totals, stacking rules or an end date; VAT is not documented (`myagenda_pricing`, `sclipi_pricing`).

### 6.2 International appointment and vertical SaaS comparators

| Competitor | Verified price/model | Relevant product pattern | What Zavoia should learn | Sources |
|---|---|---|---|---|
| **Booksy** | UK £40 + VAT/month and £5/additional user; optional Boost 30% once, minimum £5. Poland 145 PLN net plus 35 PLN/additional worker | Public Booksy profile, widget, marketplace, packages/memberships/loyalty | Optional acquisition fee can coexist with flat SaaS, but Romania is not a supported consumer country and official Boost pages conflict with stale 40% copy | `booksy_supported_countries`, `booksy_uk_pricing`, `booksy_boost`, `booksy_profile`, `booksy_features`, `booksy_poland_pricing` |
| **Treatwell** | UK 35% first marketplace booking; 0% repeat/direct; 2.5% + VAT online prepay; monthly software price quote-only | Customisable hosted Partner Page, widgets, conditional own-domain arrangement | Attribution and direct-booking protection are core trust mechanics; Romania is not a current country marketplace | `treatwell_countries`, `treatwell_pricing`, `treatwell_payments`, `treatwell_terms` |
| **SimplyBook.me** | Geo-dynamic audit render: €0/€13.90/€29.90/€59.90 monthly; annual-effective €0/€11.90/€24.90/€49.90; 50/100/500/2,000 bookings and 1/5/15/30 providers. Another official crawl rendered GBP £12.90/£25/£55 | Actual multi-page site builder and one-time custom-domain connection | Builder breadth and transparent add-on pricing are direct benchmarks; no Romania price is inferred from a dynamic page | `simplybook_pricing`, `simplybook_pricing_gbp`, `simplybook_builder`, `simplybook_domain` |
| **Reservio** | Free/Starter/Standard/Pro; paid Romanian numerals failed to render; Enterprise starts €40/month | Constrained booking site, domain on higher tiers; marketplace only Czechia/Slovakia; payments available in Romania | Do not infer marketplace distribution from SaaS availability; document limitations precisely | `reservio_ro_pricing`, `reservio_plan_overview`, `reservio_booking_website`, `reservio_customization`, `reservio_domain`, `reservio_marketplace_countries`, `reservio_payment_countries` |
| **Vagaro** | US limited-time base $23.99/month for one calendar, then $10/month per additional employee calendar through seven paid licences; MySite $20/month; expert design $299 once plus $50 extra page/revision | Full booking website, ecommerce/blog/forms/SEO, optional custom design | Recurring builder value and one-time design work can coexist; prices and currencies differ by country; avoid its non-transferable purchased-domain policy | `WB001`–`WB006` |
| **Square Appointments** | Current US unified plans $0/$49/$149 per location; old $29/$69 comparisons are stale | Simple booking page or full Square site; integrated commerce/payments | Product packaging can be simplified around an ecosystem; never reuse superseded pricing | `WB007`–`WB009` |
| **GlossGenius** | US $28/$56/$168 monthly; annual-effective $24/$48/$148 per month; 2.6% processing; each location pays the plan price | Hosted booking sites on all plans; premium themes on Gold/Platinum | Themes can help tier differentiation, but customers cannot access backend code/traffic-analysis API | `WB010`–`WB014` |
| **Mindbody** | US Starter begins $99/location/month; higher tiers quote-only | Branded web widgets; custom website via professional-services agreement | Enterprise/services revenue is different from a self-serve section store | `WB015`–`WB018` |
| **Boulevard** | Normal list $176/$293/$410 per month per location; an observed limited-time new-customer summer offer showed $140/$234/$328, with no end date | High-touch beauty operations; paid messages/add-ons | Zavoia launch price is not an enterprise operations price and should not pretend feature parity | `WB022`, `WB023` |
| **Zenoti** | Quote-only | The cited official sources document a configurable booking Webstore and booking subdomain; they do not document a general-purpose content-site builder | A transaction storefront can be powerful without being represented as a full website builder | `zenoti_pricing`, `WB019`–`WB021` |
| **Planfy** | £17/£37/£97 monthly excluding VAT | Widgets/profile pages, no booking commission | International low/mid SaaS anchor; Romanian-language page is still GBP and traction is unknown | `planfy_ro_pricing`, `planfy_booking_surfaces` |
| **Setmore** | Free; official sources conflict between $9 and $12 monthly for Pro, with $5 monthly on annual billing | Branded `.setmore.com` booking page; no native custom domain | Preserve official conflicts instead of picking a convenient number | `setmore_pricing`, `setmore_pro_help`, `setmore_faq`, `setmore_booking_page`, `setmore_url`, `setmore_setup_guide` |

### 6.3 Cross-industry website and design-marketplace analogues

| Analogue | Verified commercial pattern | Pricing implication for Zavoia | Sources |
|---|---|---|---|
| **Wix** | Its US pricing article lists Free/Light/Core/Business/Business Elite at $0/$17/$29/$39/$159 per month and says Core enables payments and online bookings; the same article later says Core is $28 | A functioning general-purpose builder plus bookings carries a recurring price far above a cosmetic one-time variant, but the billing cycle/tax and $29-versus-$28 conflict must remain explicit | `WB024`–`WB027` |
| **Squarespace + Acuity** | Website plan and Acuity are separately billed; Acuity supports deposits, packages/memberships and reminders | Modular recurring pricing is normal when products have continuing operational cost | `WB028`–`WB033` |
| **GoDaddy** | Premium annual promotional price around $14.99/month; professional build is quote-only | Promotional website prices are not reliable permanent willingness-to-pay anchors | `WB034`–`WB036` |
| **Webflow** | Starter free; Basic $15/month and Premium $25/month, both billed yearly per site with applicable taxes added; salon templates observed at $29/$49/$79 once | Documents recurring site hosting and a one-time full-template market; different currency/scope means these are category anchors, not a direct RON price comparison | `WB045`–`WB049` |
| **Framer** | Yearly-billed Basic $10/month and Pro $30/month per site; extra editors $20/month, content editors $10/month, tax added by location; salon full-site template example $29 once | Documents recurring hosting and creator-sold templates; different currency/scope prevents treating $29 as equivalent to a 29 RON section | `WB050`–`WB054` |
| **Shopify** | Full themes include free options and observed premium examples around $280–$430; one store per licence | Per-business permanent licensing is familiar; mature ecommerce themes are a higher-scope category, not a direct price equivalent for a Zavoia pack | `WB037`–`WB041` |
| **Section Store / Hazify** | Section Store's catalogue was observed from free to about $9 once; Hazify lists $5 once; optional bundles/subscriptions are also offered | The one-time micro-purchase model exists in an adjacent ecosystem; these vendor examples are not market-wide adoption or willingness-to-pay evidence | `WB042`–`WB044` |
| **Elementor / Envato** | Subscription libraries; completed-project licence can survive cancellation; restrictions prohibit asset reuse in automated builders | Zavoia must create or license its own assets and state post-cancellation rights clearly | `WB055`, `WB057`–`WB060` |

### 6.4 Price-normalisation register

This register prevents unlike numbers from being treated as equivalent. “Not documented” means the dated official source did not state the field; it is not an assumption that no tax, limit or contract term applies. Prices are left in their published currencies.

#### Romania-first and nearby comparators

| Comparator | Geography / currency | VAT or tax treatment | Billing period and commercial unit | Promotion or unresolved conflict | Sources |
|---|---|---|---|---|---|
| MERO | Romania / EUR | Excluding VAT | €34.99 monthly, one professional; €9.99 per additional active professional | 14-day trial; no dated price promotion documented | `mero_pricing` |
| Stailer | Romania / RON | “+ VAT where applicable” | 175 RON per 30 days for the whole salon; App Store IAPs are monthly subscriptions | Web price conflicts with Pro 239.99 / Individual 139.99 App Store prices | `stailer_pricing`, `stailer_terms`, `stailer_appstore` |
| Fresha | Geo-dynamic / USD and PLN observations | USD view: local sales tax excluded; PLN view: 23% tax excluded | Monthly Independent or per bookable team member | USD render 19.95/14.95 and 20%/$6 acquisition fee conflicts with PLN render 29/19 and free acquisition line; no Romania numeral inferred | `fresha_pricing`, `fresha_pricing_pln`, `fresha_plan_help` |
| Notino Partner | Romania / free | No monetary VAT line | Basic and Premium plan/workspace; staff/location charging basis not documented | Premium is currently free and can change; not treated as a durable market cost floor | `notino_pricing`, `notino_premium_update` |
| Bookr | Romania / EUR | Not documented | Monthly or annual plan; Free caps one staff/100 appointments; Gold/Platinum list unlimited staff | “Save 20% annually” conflicts with €249.99/€449.99 totals, about 16.7% below twelve monthly payments; EXTRA20 first-transaction offer has no end date | `bookr_pricing` |
| Planific | Romania / RON | Plus VAT | Services-family business plan: monthly 40/50/70 or annual-effective 34/42/59; other plan families exist | No price promotion documented | `planific_pricing` |
| Programo | Romania / RON | Not documented | Monthly business offer; staff/location unit not documented | 89 is promoted from 139 with no end date; 59 no-SMS route uses WhatsApp | `programo_product_pricing` |
| OcupaLoc | Romania / RON | Not documented | Fixed 59.99 monthly business subscription; staff/location unit not documented | 14-day trial; no price promotion documented | `ocupaloc_pricing` |
| Planifico | Romania / RON | Excluding VAT | Monthly plan with tiered user/client/notification allowances | No price promotion documented | `planifico_pricing`, `planifico_terms` |
| Minara | Romania / RON | Not documented | Per completed booking: 0.20, or 0.50 with SMS | Same page says both first 200 and first 300 bookings free; current allowance is unknown | `minara_pricing` |
| Calendis | Romania / RON | Excluding VAT | Monthly per specialist: 39/65/95 | One-month free trial; price page conflicts with sales-agreed terms; calculator uses 19% on 65 while statutory rate is 21%; feature page separately grants first 100 SMS once | `calendis_pricing`, `calendis_terms`, `calendis_features`, `romania_vat_21` |
| MyAgenda | Romania / RON | VAT included | Monthly Standard/Premium plan: 25/39; staff/location unit not documented | No price promotion documented | `myagenda_pricing` |
| Sclipi | Romania / RON | Not documented | 39/79/159 launch prices for 1/up-to-5/unlimited users; annual payment separately advertised at 20% off | Compared with 49/99/199; totals, stacking, duration and end date are not documented | `sclipi_pricing` |

#### International appointment SaaS and adjacent builders

| Comparator | Geography / currency | VAT or tax treatment | Billing period and commercial unit | Promotion or unresolved conflict | Sources |
|---|---|---|---|---|---|
| Booksy | UK / GBP; Poland / PLN | UK plus VAT; Poland net | UK monthly £40/business + £5/user; Poland 145 PLN/business + 35 PLN/additional worker | Seven-day UK trial; current Boost 30% conflicts with stale official 40% copy | `booksy_uk_pricing`, `booksy_poland_pricing`, `booksy_boost` |
| Treatwell | UK / GBP or percentage | VAT explicitly added where cited | Subscription quote-only; 35% on first marketplace booking, 0% repeat/direct, 2.5% online prepayment | No public subscription numeral; Romania is not a supported marketplace | `treatwell_pricing`, `treatwell_payments`, `treatwell_countries` |
| SimplyBook.me | Geo-dynamic / EUR and GBP observations | Not documented on cited render | Monthly/annual-effective plan with booking/provider caps | EUR 0/13.90/29.90/59.90 monthly and 0/11.90/24.90/49.90 annual-effective conflicts with a GBP crawl; no Romania quote inferred | `simplybook_pricing`, `simplybook_pricing_gbp` |
| Reservio | Romania-facing / paid currency unresolved | Not documented | Free/Starter/Standard/Pro with booking limits; Enterprise starts €40/month | Paid Romania numerals failed to render; USD payment-fee presentation does not resolve Romanian SaaS price | `reservio_ro_pricing`, `reservio_plan_overview` |
| Vagaro | US / USD, with separate CA/UK/AU values | Not documented | US limited-time $23.99/month for one calendar, +$10 each through seven paid calendars; MySite $20/month; $299 one-time custom design | Base is explicitly limited-time; regional currencies/prices differ; expert design excludes ongoing MySite hosting | `WB001`, `WB004` |
| Square Appointments | US / USD | Taxes can add; exact treatment not documented | $0/$49/$149 monthly per location | Current unified packaging replaced older $29/$69 comparisons; no current promotion documented | `WB007`, `WB009` |
| GlossGenius | US / USD | Subscription tax not documented | Per location: $28/$56/$168 monthly or $24/$48/$148 annual-effective; processing 2.6% | Annual discount is explicit; promotion dependency otherwise not inferred | `WB010`, `WB011` |
| Mindbody | US / USD | Not documented | Starter begins $99 monthly per location; higher tiers quote-only | Starting price only; contract/add-ons unknown | `WB015` |
| Boulevard | US / USD | Not documented | Normal $176/$293/$410 monthly per location | New-customer summer offer $140/$234/$328 had no end date; page's billing selector does not make extracted commitment unambiguous | `WB022` |
| Zenoti | International / quote | Not documented | Price, billing period and commercial unit not public | Quote-only; no numeric normal or promotional price inferred | `zenoti_pricing` |
| Planfy | Romanian-language page / GBP | Excluding VAT | £17/£37/£97 monthly plan; tier limits, not Romanian traction | No price promotion documented | `planfy_ro_pricing` |
| Setmore | Global / USD | Not documented | Per user: official pages agree on $5/month annual-effective but conflict at $9 versus $12 monthly | Official-source conflict retained; no promotion inferred | `setmore_pricing`, `setmore_pro_help`, `setmore_faq` |
| Wix | US article / USD | Not documented | Per site/account: $0/$17/$29/$39/$159 monthly figures; exact cited article does not document billing cycle | Same article later says Core $28, not $29; geography and checkout can change presentation | `WB024`, `WB025` |
| Squarespace + Acuity | Location-dependent / observed USD starting point | Checkout/location dependent | Website subscription per site; Acuity is separately billed; website annual starting price observed at $19/month | Localised numerals differ; higher Acuity values not treated as universal | `WB028`–`WB032` |
| GoDaddy | US / USD | Not documented | Annual promotional website pricing per site; Premium observed around $14.99/month | Introductory price and renewal/geography can differ; professional build is quote-only | `WB034`, `WB035` |
| Webflow | Global / USD | Applicable taxes added at checkout | Per site, yearly billed: Starter free, Basic $15/month, Premium $25/month | Current page advertises yearly savings; May 2026 packaging supersedes stale comparisons | `WB045`, `WB046` |
| Framer | Global / USD | Applicable sales tax added by location | Yearly billed per site: Basic $10/month, Pro $30/month; editors/add-ons separate | No price promotion documented | `WB050` |
| Shopify themes | Global / localised currencies | Country/tax/checkout dependent | Platform subscription recurring; paid theme is one-time and licensed to one store | Catalogue and prices change; observed $280–$430 premium themes are examples, not a market statistic | `WB037`–`WB041` |
| Section Store / Hazify | Global / USD | Not documented | One-time per section for one Shopify store/theme, with optional subscription offers | Vendor catalogues observed from free to about $9 and at $5; not market-wide willingness-to-pay evidence | `WB042`–`WB044` |

## 7. Pain points Zavoia can credibly address

Pain patterns below come from official pricing/terms/help mechanics or are recommendations derived from them. No prevalence claim is made.

| Pain / trust problem | Verified market mechanism | Zavoia's current position | Required proof before claiming superiority |
|---|---|---|---|
| Unpredictable marketplace acquisition fees | Fresha's USD render showed 20% once/minimum while another localization showed free; Treatwell lists 35% first marketplace visit; Booksy optional Boost 30%; Stailer configurable 0%–100% (`fresha_pricing`, `fresha_pricing_pln`, `fresha_new_client_fee`, `treatwell_pricing`, `booksy_boost`, `stailer_terms`) | Can launch at 0%; no merchant appointment-money flow exists (`CODE023`) | Publish an attribution definition and a 0% launch policy; show every booking source in owner/customer records |
| Owned traffic being confused with marketplace acquisition | Fresha documents direct links and new-client attribution; Treatwell distinguishes direct/repeat (`fresha_direct_links`, `fresha_new_client_fee`, `treatwell_pricing`) | Customer source metadata exists in the light CRM (`CODE026`) | Persist immutable source evidence from click through completed visit; provide dispute export before any Boost product |
| Merchant brand lives on platform profile | MERO, Booksy, Fresha and Setmore document profiles/pages/widgets (`mero_product`, `booksy_profile`, `fresha_profile`, `setmore_booking_page`) | Dashboard builder exists, but no public site delivery (`CODE013`, `CODE015`) | Public snapshot renderer, merchant domain, SEO and analytics must be live |
| Unclear downgrade/reactivation rights for purchased design | Theme/template markets use one-store/project licences; some libraries limit ongoing access (`WB040`, `WB048`, `WB052`, `WB057`, `WB059`) | Committed purchase records model permanent per-business ownership; public delivery is absent and checkout hardening is WIP (`CODE018`, `CODE013`) | Test reactivation-after-downgrade semantics end to end; publish the policy in checkout/terms |
| Domain lock-in | Vagaro says domains purchased through it cannot transfer; several booking products use platform URLs/subdomains (`WB005`, `fresha_profile`, `setmore_url`, `reservio_domain`) | No Zavoia domain workflow exists (`CODE013`) | Domain registered to merchant, standard DNS records, export/transfer runbook |
| “Revenue” without cash reconciliation | MERO, Treatwell, Planific and Square document payment capabilities; Zavoia dashboard currently sums scheduled list price (`mero_product`, `treatwell_payments`, `planific_features`, `WB007`, `CODE021`) | Current label risks overclaim | Rename to potential/scheduled revenue until appointment payments and refunds reconcile |
| Notification bundle hides carrier exposure | Competitors include or meter SMS differently; Twilio charges per segment (`mero_pricing`, `planifico_pricing`, `calendis_features`, `twilio_ro_sms`, `twilio_segments`) | One credit per API call, regardless of segments (`CODE022`) | Segment count, encoding preview, country-aware cost and atomic credit reservation |
| Hard migration/data lock-in | International suites distinguish customer content from platform/profile/template rights (`WB006`, `WB026`, `WB033`, `WB036`) | Customer history and PDF exist, but full portable export/import was not proven (`CODE026`, `CODE028`) | CSV/API export for customers, services, staff, appointments and review references; import validation and read-only lapse grace |
| Customer list has no visible navigation beyond the first 20 results | Current customer page fetches offset 0, limit 20, with search but no visible paging (`CODE027`) | A concrete current Zavoia weakness | Pagination or infinite load, saved filters and export before calling CRM “deep” |

Zavoia should not position itself as “Fresha/MERO but cheaper.” The defensible **post-renderer opportunity** is predictable ownership and distribution: a merchant runs appointments, receives Romanian discovery, and—once public rendering and domain portability ship—controls its direct web presence and permanent design licences with transparent fee attribution.

## 8. Romania context and niche decision

Romania's official context documents a digitalisation gap in the covered enterprise population but does not establish Zavoia's TAM. The European Commission's 2025 SME fact sheet estimates 929,463 SMEs in the 2024 Romanian non-financial business economy, including 876,813 micro enterprises (`macro_sme_2025`). Eurostat reported that 72.1% of Romanian enterprises in its covered sample had very low digital intensity in 2023 (`digital_intensity_2023`) and 3.1% used AI in 2024 (`ai_adoption_2024`). Those ICT statistics largely cover enterprises with at least ten persons and selected NACE activities, so they cannot be presented as rates for salons or Zavoia's micro-business audience. The Commission's 2025 Digital Decade report independently describes Romanian SME digitalisation as lagging (`digital_decade_ro_2025`).

No verified niche-business total is used in this report. INSSE TEMPO identifies tables for economically active enterprises and local units by four-digit CAEN, but numeric cells could not be exported in the research environment (`insse_enterprise_tables`). ONRC legal registrations are not interchangeable with INSSE active enterprises or locations. CAEN Rev.3 began in 2025 and split the previous beauty category, so Rev.2 and Rev.3 series must not be joined without an official reallocation (`caen_rev3_beauty`).

The ranking below is therefore a **qualitative product-fit recommendation**, not a TAM ranking. It uses only:

- fit with Zavoia's audited one-to-one, named-resource scheduling model;
- additional data/workflow primitives the niche requires;
- documented regulatory sensitivity;
- official supply/context measures used strictly as proxies, never as paying-business counts.

### Rank 1 — Beauty, spa/wellness, tattoo and piercing

**Why first:** the current services, staff, locations, bundles, sequential booking, portfolios/gallery-oriented listing and reviews fit this niche with the least new scheduling logic (`../admin-api/src/entities/service.entity.ts`, `../admin-api/src/entities/appointment.entity.ts`, `../admin-api/src/modules/appointment/run-grouping.ts`, `src/features/website/components/builder/sectionCatalog.ts`). The strongest Romanian marketplace comparators—MERO, Stailer, Notino Partner—and global comparators—Fresha, Booksy, Treatwell, Vagaro, GlossGenius—validate the category's software pattern, not Zavoia demand.

Romania's Order 1648/2024 and its hygiene norms govern beauty, tattoo, piercing and dermal-implant salons, including qualified-operator, client/procedure and disinfection/sterilisation record obligations; the norms permit electronic records (`beauty_order_1648`, `beauty_hygiene_norms_2024`).

**Current fit:** appointment discovery and operations.  
**Near-term vertical opportunity:** structured consent/procedure/lot/sterilisation and retention logs, generated from official requirements and reviewed by Romanian counsel.  
**Do not claim:** regulatory compliance from generic notes/custom fields. The current CRM is not a purpose-built hygiene register.

### Rank 2 — Lawyers, accountants, tax advisers and other scheduled professional consultations

Official supply proxies document professional counts without identifying buyers: 23,445 active lawyers in 2025 (`lawyers_active_2025`); 5,671 individual liberal accounting professionals and 12,776 authorised accounting entities at 2024 year-end, among non-additive CECCAR categories (`accounting_sector_2024`); 4,180 active tax consultants at 2024 Q4 (`tax_consultants_2024`); and 2,696 notaries in function in the 2025 post structure (`notaries_2025`). These are people/entities/posts, not distinct firms, locations or SaaS customers.

**Why second:** fixed-duration in-person/remote consultation, named adviser, staff/location hours and direct web presence fit the core model.  
**Required before a vertical claim:** intake/questionnaires; document request/upload; confidentiality-aware notes and permissions; conflict/matter boundaries for legal work; e-sign integration; recurring series for ongoing engagements; invoicing/accounting integration.  
**Position now:** discovery, scheduling and marketplace listing—not practice management. A branded merchant website becomes valid only after the public-renderer gate.

### Rank 3 — Private tutoring, language and career coaching

Romania had 2.8688 million pre-university pupils in 2024–2025 (`education_system_2024_25`), but pupil population is not tutoring demand. Eurostat reported 10% of Romanian internet users aged 16–74 used an online course or learning material in the prior three months in 2023 (`online_learning_2023`); that is not private-lesson purchasing. Affordability also cannot be presumed: 31.8% of Romanian children faced child-specific material deprivation in 2024 (`child_deprivation_2024`).

**Why third:** private one-to-one lessons/coaching fit durations, remote locations and named tutors.  
**Required before broad tutoring positioning:** guardian/minor accounts and consent; operational recurring series; package-credit balances; lesson notes/homework; cancellation policy; online meeting integration. Classes/courses require capacity and cohort logic not present today.  
**Position now:** private one-to-one tutoring/coaching only.

### Rank 4 — Pet grooming; veterinary only as discovery/scheduling

FEDIAF publishes Romanian dog/cat household estimates, but its methodology says Romanian pet-population figures use consulting estimates where national-association data were unavailable (`pet_households_2025`, `pet_methodology_2026`). Dog and cat household shares overlap and must not be added. The veterinary college supplies a live unit register, while its own verification report warns that ceased/nonexistent units can remain pending removal (`vet_unit_register`, `vet_register_review_2019_24`). Grooming units have specific veterinary-sanitary registration/facility rules (`pet_grooming_rules_2024`).

**Why fourth:** grooming is a named-provider, timed service, but the customer is an owner acting for a dependent animal.  
**Required for grooming depth:** pet/dependent profiles, species/breed/size/coat/temperament, vaccination and incident fields, pet-linked history and reminders.  
**Veterinary boundary:** booking/discovery only until clinical records, consent, prescription/lab workflows and veterinary-specific compliance are designed.

### Rank 5 — Healthcare only as booking/web presence

Official professional measures are supply proxies: the Romanian College of Physicians reported 61,934 physicians with valid practice approval on 2026-04-07 plus more than 22,000 residents (`doctors_2026`); the dental college reports approximate density/utilisation ratios rather than practice counts (`dentistry_access_2026`); the physiotherapy college operates an authorisation register but no verified national independent-practice count was extracted (`physio_authorisation`, `physio_caen_rev3`).

Health data are special-category data under GDPR Article 9 (`gdpr_article9`). Romanian patient-rights law protects condition, investigation, diagnosis, prognosis, treatment and personal data confidentiality (`patient_rights_law`). Telemedicine has additional organisational, quality, patient-rights and confidentiality rules (`telemedicine_rules`).

**Position now:** discovery, neutral appointment scheduling and a non-clinical marketplace listing. A separate merchant website becomes valid only after the public-renderer gate.  
**Not ready for:** clinical intake/records, diagnostic/treatment notes, telemedicine, medical billing, referral/prescription or a claim of clinical compliance. Generic customer notes and custom fields must not become an ungoverned health record.

### Rank 6 — Auto detailing and simple ITP lead scheduling

Eurostat reported 417 passenger cars per 1,000 Romanian residents in 2022 and places Romania among countries with a high share of cars older than 20 years in 2024 (`car_motorisation_2022`, `car_fleet_age_2024`). These are fleet-context proxies, not appointment demand. ITP is performed by RAR or authorised/monitored operators, with live county lists (`rar_itp_authorisation`, `rar_itp_live_list`). RAR's 2024 complaint totals are selected reports, not quality prevalence or software demand (`rar_activity_2024`).

**Why sixth:** simple detailing/ITP lead slots can fit duration/location scheduling.  
**Required for repair operations:** vehicle/VIN/dependent profiles, bay/lift/resource capacity, estimates/work orders, parts, technician stages, warranty, inspection documents, customer authorisation and payments.  
**Position now:** detailing and simple ITP lead scheduling—not repair-shop management.

### Rank 7 — Private personal training, not classes/studios

Eurostat's broad sport-employment series places sport at 0.28% of Romanian employment in 2023 and records a 25% Romanian decline in 2024 (`sport_employment_2023`, `sport_employment_2024`). It includes more than trainers and is not a gym/coach count.

**Why seventh:** one-to-one PT fits, but typical studio economics quickly require class capacity, rooms/equipment, memberships, credits, waitlists and check-in.  
**Position now:** private trainer appointments only. Do not sell class/studio management until capacity-based scheduling exists.

### Niches explicitly not ranked from fabricated TAM

Practitioner registers, occupied professional posts, registered units, pupils, pets, cars, household shares and broad employment categories are supply/context proxies only. They cannot be multiplied by an invented conversion rate or price to claim ARR. The missing decision data are:

- verified active business/location counts by current CAEN and county;
- share using a bookable software product today;
- price actually paid, switching cost and contract cycle;
- average non-owner seat count and SMS segment volume;
- marketplace discovery behaviour by city/category;
- retention and willingness to pay after real product use.

Those remain **Unknown** until measured.

## 9. Product strategy and sequencing

The sequence is recommendation, not an engineering estimate. Priority reflects truthfulness, money/compliance risk and whether a missing piece blocks the promised product.

### P0 — required before paid launch or the relevant commercial claim

1. **Truthful acquisition surfaces.** Remove or evidence the 2,400+ partners, 120k monthly bookings, 4.8 rating, nine-city scale, customer deposits/payments, daily payouts, recurring-appointment, universal business-verification and completed-appointment-only review claims in `../zavoia-web/src/i18n/dictionaries`. Qualify cancellation as each merchant's policy. Gate/remove mobile London demo businesses, ratings and offers from `../marketplace-app/features/home/placeholder-data.ts` and `../marketplace-app/features/home/api.ts`.
2. **Working acquisition CTA.** The for-business CTA only triggers a toast and the pricing CTA has no handler/link (`../zavoia-web/src/app/_components/for-business/for-business-content.tsx`, `../zavoia-web/src/app/[locale]/pricing/_components/pricing-calc.tsx`). Connect them to a real trial/onboarding path before paid traffic.
3. **Legal/company truth.** Replace mobile Lorem Ipsum terms/cookie text and fabricated company/VAT/address/contact data; create the absent web privacy/terms/cancellation routes; remove stale London footer/404 links; wire newsletter consent and submission. Evidence: `../marketplace-app/app/terms-and-conditions.tsx`, `../marketplace-app/app/cookies-policy.tsx`, `../marketplace-app/app/company-details.tsx`, `../zavoia-web/src/components/shell/footer.tsx`.
4. **VAT/invoicing correctness.** Build a reviewed 21% tax-collection path if Zavoia is VAT-registered; confirm issuer status, Price treatment, Stripe Checkout tax, EU B2C OSS, B2B reverse charge and Oblio totals with a Romanian accountant. Code evidence: `../admin-api/src/modules/billing/billing.service.ts`, `../admin-api/src/modules/oblio/oblio.service.ts`, `../admin-api/src/modules/oblio/vat.util.ts`.
5. **Booking concurrency and idempotency.** Replace process-local idempotency with durable keys and enforce database-level overlap protection. Current evidence: `../admin-api/src/modules/marketplace/appointments/appointments.service.ts`; `../admin-api/src/entities/appointment.entity.ts`.
6. **Availability fail-closed policy.** Decide and test what missing/malformed staff schedule means. Current booking code can treat it as available while enforcing location hours (`../admin-api/src/modules/marketplace/customer/customer-booking.service.ts`, `../admin-api/src/modules/marketplace/appointments/appointments.service.ts`).
7. **SMS economics.** Reserve/deduct atomically, count GSM-7/UCS-2 segments before send, price country/encoding exposure, and do not offer unlimited SMS. Current one-credit-per-call path: `../admin-api/src/modules/sms/sms.service.ts`.
8. **Website public renderer gate.** If Plus is sold, render the frozen snapshot publicly, test rollback/unknown variants, and publish ownership/refund/downgrade terms. Otherwise launch Standard only and label website work private beta.
9. **Customer payments/deposits only when real.** Add a merchant settlement architecture, connected-account/KYC approach, appointment payment ledger, refunds/disputes, cancellation-policy evidence and payout status before any claim. Current Stripe billing is Zavoia-side only.

### P1 — table stakes for the differentiated offer

1. Merchant-owned custom domain, automated SSL, canonical URL, sitemap/robots, titles/descriptions/OG, 301 redirects and transfer runbook.
2. First-party site analytics: visits, booking-start, completed booking, source/UTM, service/staff/location, with consent controls and raw export.
3. Auditable booking source receipts from first touch to completed appointment; immutable enough to support disputes.
4. External Google/Apple/Outlook calendar connection with explicit one-way/two-way semantics and conflict ownership.
5. WhatsApp opt-in templates, delivery/failure visibility and per-message cost; do not hide it in “unlimited.”
6. Service-name/description search and a real filter sheet. Ensure `unaccent` is provisioned by migration before relying on taxonomy search (`../admin-api/src/migrations/1783170407985-Init.ts`, `../admin-api/src/modules/marketplace/public/marketplace-public.service.ts`).
7. Customer-list pagination/export/import, saved segments and accurate source history. The present owner view requests offset 0/limit 20 and exposes no load-more (`src/features/customers/pages/customers.tsx`); history PDF is not a portable client export (`src/features/customers/buildCustomerHistoryPdf.ts`).
8. Operational recurring appointment series with create/edit-one/edit-future/cancel-series behaviour, collision handling and clear customer reminders.
9. Review replies/moderation policy. Current business review API is GET-only (`../admin-api/src/modules/review/review.controller.ts`).
10. Invoke and permission-test customer push registration or remove the dormant promise. Registration logic has no call site (`../marketplace-app/features/push-notifications/service.ts`, `../marketplace-app/features/push-notifications/hooks.ts`, `../marketplace-app/providers/push-notification-provider.tsx`).

### P2 — earn vertical depth after retention evidence

- Beauty: structured procedure/consent/hygiene/sterilisation logs.
- Consultations: forms, documents, e-sign and confidentiality-scoped access.
- Tutoring: guardian/dependent, package balances, recurring lessons; only later classes.
- Pet: pet profile, vaccination/incident history and reminders.
- Health: remain scheduling-only unless a separate compliance programme approves clinical processing.
- Auto: vehicle and simple job intake before any work-order system.
- Fitness: memberships/credits/capacity/waitlists/check-in before studio positioning.

### Features that should not distract the launch

Do not build POS, inventory, payroll, repair work orders, electronic health records or class management merely to extend the niche list. Each changes Zavoia's data model, compliance and support burden. Complete the intended marketplace–operations–owned-web loop first.

## 10. Pricing recommendation and rationale

### 10.1 Standard — 59 RON/month + VAT

Standard should include every shipped non-builder SaaS/marketplace capability, the owner seat, the current appointment workflow, and no marketplace booking commission at launch. **SMS messages/credits remain separately purchased.** Do not advertise an “unlimited” plan limit until production limits and cost controls are verified.

Why 59 RON is honest:

- It sits beside OcupaLoc's 59.99 RON and Programo's 59 RON without-SMS offer (`ocupaloc_pricing`, `programo_product_pricing`).
- It is above Planific Basic/Business at 40/50 RON + VAT and above MyAgenda's simpler 25/39 RON VAT-included offer (`planific_pricing`, `myagenda_pricing`), reflecting the added marketplace and multi-service operations stack.
- It is below MERO's €34.99 excluding VAT and Bookr Gold's €24.99 (`mero_pricing`, `bookr_pricing`), appropriate while Zavoia is pre-launch and still lacks customer payments, mature analytics, calendar sync and WhatsApp.
- It does not copy Notino Partner's zero price, which exists inside a broader retail/affiliate ecosystem (`notino_pricing`, `notino_affiliate`).

This is a positioning recommendation, not an empirically measured optimum. Only a paid cohort can establish willingness to pay and retention.

### 10.2 Plus — 119 RON/month + VAT

Plus should be exactly Standard plus a complete public website product. The 60 RON uplift is recurring compensation for hosting, publishing reliability, rendering, SEO/runtime maintenance, analytics storage and support. Domain registration is separately billed at transparent pass-through cost; a custom-domain connection/SSL workflow must not create ownership lock-in. Plus must not be activated commercially for an editor whose snapshot has no public consumer.

Why 119 RON is defensible after the gate:

- Planific validates a local hosted-builder pattern, though at a constrained 50–70 RON total (`planific_pricing`, `planific_builder`). Zavoia's higher price requires demonstrably deeper design control, merchant-domain portability and marketplace attribution.
- SimplyBook, Vagaro and Square prove full booking websites are not unique; each cited model has a paid plan/add-on relationship (`simplybook_builder`, `WB001`–`WB003`, `WB007`–`WB009`).
- Wix demonstrates a recurring general-builder plan with payments and scheduling (`WB024`). Framer and Webflow separately demonstrate recurring site hosting, custom-domain/SEO capability and creator-template ecosystems, not native booking in the cited plans (`WB045`, `WB050`). Zavoia is not competing with their total design breadth; its value must be native business/booking data and Romanian distribution.

If the public renderer is not ready, **do not discount Plus**. Do not sell it.

### 10.3 Additional non-owner seat — 39 RON/month + VAT

The existing billing model counts non-owner members and uses a base plus seat quantity (`../admin-api/src/modules/entitlements/entitlements.service.ts`, `../admin-api/src/modules/billing/billing.service.ts`). Keep one seat price across tiers so team economics stay legible.

MERO lists €9.99/additional professional, Booksy UK lists £5/additional user, and Calendis Start is 39 RON per specialist/month (`mero_pricing`, `booksy_uk_pricing`, `calendis_pricing`). These are country, product-scope and charging-unit benchmarks—not normalized equivalents: Calendis bills every specialist, while Zavoia includes the owner and charges only non-owner seats. The 39 RON recommendation preserves a meaningful but lower-than-base seat increment and makes team revenue legible. Whether roles should be billed uniformly is unknown; do not invent receptionist/readonly discounts until usage and support data exist.

### 10.4 Trial, billing period and commission

- **Trial:** retain the implemented 14-day **Standard-only** trial; trial entitlements do not unlock Plus (`../admin-api/src/modules/wizard/wizard.controller.ts`, `../admin-api/src/modules/entitlements/entitlements.service.ts`). Decide how a merchant can evaluate Plus only after the public website exists.
- **Billing period:** monthly only at launch. An annual discount before measured retention converts product risk into refund/support risk and obscures churn.
- **Commission:** 0% at launch. Marketplace supply/liquidity and causal acquisition are unknown.
- **Future optional Boost:** 15% once on a completed, genuinely marketplace-acquired first visit; direct-link, merchant-site and repeat bookings remain 0%. This is a future recommendation only. Do not launch it until click/source attribution, cancellation/no-show, refund, reschedule, identity-merge, cash-payment, dispute and merchant export rules are auditable. Fresha's general help, Booksy and Treatwell show the one-time attribution model; Fresha's conflicting localized numerals show why rates must be country-specific (`fresha_new_client_fee`, `fresha_pricing`, `fresha_pricing_pln`, `booksy_boost`, `treatwell_pricing`). No Boost margin is modelled here: Stripe Connect/account/payout liability and cost depend on the funds-flow design (`stripe_connect`).

### 10.5 One-time section and variant prices

| Add-on | Price + VAT | Inclusion boundary | Evidence/rationale |
|---|---:|---|---|
| Standard cosmetic variant | **29 RON once** | Visual treatment of an existing included section | Adjacent Shopify vendors offer free/low-dollar one-time sections; different platform/currency means this supports the purchase pattern, not direct price equivalence (`WB042`–`WB044`) |
| Premium/conversion layout | **59 RON once** | Material composition/interaction improvement using existing data | Webflow's $29/$49/$79 salon templates show a one-time design-asset category but are full sites in another currency; the Zavoia item must provide more than colour/font changes (`WB047`) |
| Complex functional section | **99 RON once** | New behaviour with no recurring operating cost | Higher design/test burden; prohibited for AI/campaign/analytics/ongoing third-party cost |
| Coordinated site-look pack | **199 RON once** | Matching variants across the whole site | Shopify premium themes document a mature full-theme category; their USD prices and ecommerce scope are not treated as direct willingness-to-pay equivalence (`WB038`) |

The values are a coherent launch ladder, not statistically optimised demand. Publish the difference between cosmetic, conversion and functional before checkout. Never charge for the only viable navigation, hero, services/booking entry, location/contact or footer.

## 11. Reproducible unit economics

### 11.1 Known inputs

- Recommended prices are ex-VAT.
- Romania's standard VAT rate is 21% (`romania_vat_21`, `anaf_vat_2025`, `WB062`, `WB063`).
- Stripe Romania publishes 1.5% + 1 RON for standard EEA cards, 1.9% + 1 RON for premium EEA cards, 2.5% + 1 RON for UK cards and 3.25% + 1 RON for international cards, plus 2% if currency conversion is required (`stripe_ro_pricing`).
- Stripe's Romanian page publishes pay-as-you-go Billing at 0.7% of Billing volume. The current subscription implementation uses Stripe subscriptions/invoices, so the recurring tables model that fee separately; actual account/contract treatment remains unknown (`stripe_ro_billing`; `../admin-api/src/modules/billing/billing.service.ts`). One-time website purchases use Stripe `mode: payment` and are modelled without the Billing fee (`../admin-api/src/modules/website-variants/website-variants.service.ts`).
- Only irrecoverable tax on Stripe's services is an economic cost; input-VAT recovery, reverse-charge treatment and cash-flow timing require confirmation from Zavoia's Romanian accountant. Any irrecoverable processor-service tax, negotiated/account-specific fee, Radar add-on or other enabled paid product is **Unknown** and excluded from the numeric tables (`stripe_ro_pricing`).
- A received dispute is 100 RON and manually countering it is another 100 RON, with the countered fee returned only for a won dispute (`stripe_ro_pricing`).
- Zavoia payroll, founder compensation, support time, CAC, hosting by account, observability, email, storage, refunds, bad debt, legal/accounting, app-store costs and fixed operating expenses were not present as reliable cost inputs in the repositories. They remain **Unknown**.

The base scenario below is explicitly a **standard EEA card, RON charge, 21% VAT, no refund/dispute**. It is not an assumption about the future card mix.

### 11.2 Formula

For an ex-VAT list price `P`:

```text
Gross customer charge        G = P × 1.21
Stripe standard-EEA fee      F = G × 0.015 + 1.00
Stripe Billing volume       BV = provider-defined Billing volume
Stripe Billing fee           B = BV × 0.007
Payment-only amount         C0 = P − F              [one-time purchase]
Subscription amount         C1 = P − F − B          [recurring subscription]
True contribution margin    CM = C0 or C1
                                − irrecoverable Stripe service tax/account-specific charges
                                − variable infrastructure
                                − variable support
                                − expected refund/chargeback loss
                                − any SMS subsidy
                                − other per-account variable cost
Break-even accounts             = ceil(monthly fixed operating expense / weighted CM)
```

VAT is collected tax, not Zavoia revenue. Stripe documents the percentage of Billing volume but the cited page does not define here whether that volume equals the VAT-inclusive charge. To keep the table reproducible, its explicit conservative scenario sets `BV = G`; actual invoices must replace it with Stripe's charged Billing volume. Neither `C0` nor `C1` is profit or full contribution margin.

### 11.3 Price-line calculation

| Ex-VAT price `P` | Gross at 21% | Stripe Payments fee, standard EEA | Payment-only `C0` | `C0 / P` |
|---:|---:|---:|---:|---:|
| 29 RON | 35.09 | 1.53 | 27.47 | 94.7% |
| 39 RON | 47.19 | 1.71 | 37.29 | 95.6% |
| 59 RON | 71.39 | 2.07 | 56.93 | 96.5% |
| 99 RON | 119.79 | 2.80 | 96.20 | 97.2% |
| 119 RON | 143.99 | 3.16 | 115.84 | 97.3% |
| 199 RON | 240.79 | 4.61 | 194.39 | 97.7% |

This table is directly applicable to one-time add-ons. The 1 RON fixed fee makes the 29 RON add-on less efficient than a pack. This supports a cart/pack flow but is not permission to hide prices or force bundling. Recurring plans subtract the additional Billing scenario in §11.5.

### 11.4 Card-mix sensitivity

| Price | Standard EEA `C0` | Premium EEA `C0` | UK card `C0` | International card `C0` |
|---:|---:|---:|---:|---:|
| 29 | 27.47 | 27.33 | 27.12 | 26.86 |
| 59 | 56.93 | 56.64 | 56.22 | 55.68 |
| 119 | 115.84 | 115.26 | 114.40 | 113.32 |
| 199 | 194.39 | 193.42 | 191.98 | 190.17 |

This excludes the additional 2% where currency conversion is required and excludes Billing. For a subscription, subtract another 0.7% of gross in the pay-as-you-go Billing scenario. Romania-first RON prices reduce the need for conversion but do not prove the card mix.

### 11.5 Seats and account profiles

“People” below means owner plus non-owner users; only non-owner seats are added. Each row is a steady-state scenario with one successful monthly card charge per account. It excludes mid-cycle proration, multiple invoices/charges, failed-payment attempts, retries and recovery-event fees; actual Stripe invoices must replace the scenario.

| Scenario | Ex-VAT MRR | Gross charged | Payments fee | Billing 0.7% | Stripe-only subscription `C1` |
|---|---:|---:|---:|---:|---:|
| Standard solo | 59 | 71.39 | 2.07 | 0.50 | 56.43 |
| Standard, 3 people (2 seats) | 137 | 165.77 | 3.49 | 1.16 | 132.35 |
| Standard, 6 people (5 seats) | 254 | 307.34 | 5.61 | 2.15 | 246.24 |
| Plus solo | 119 | 143.99 | 3.16 | 1.01 | 114.83 |
| Plus, 3 people (2 seats) | 197 | 238.37 | 4.58 | 1.67 | 190.76 |
| Plus, 6 people (5 seats) | 314 | 379.94 | 6.70 | 2.66 | 304.64 |

No average team size is inferred.

### 11.6 Best-case break-even account floors

The following deliberately overstates per-account contribution because it sets every unknown per-account variable cost to zero. The resulting account counts are **best-case lower bounds**: real break-even can only require the same or more accounts under these prices. “Plus mix” is a scenario input, not a forecast; seats and add-ons are excluded. The 10k/25k/50k/100k RON fixed-OPEX columns are an illustrative input grid for the formula, **not estimates of Zavoia's operating expenses**.

| Plus share | Weighted `C1` | 10k RON fixed OPEX | 25k RON | 50k RON | 100k RON |
|---:|---:|---:|---:|---:|---:|
| 0% | 56.43 | 178 | 444 | 887 | 1,773 |
| 25% | 71.03 | 141 | 352 | 704 | 1,408 |
| 50% | 85.63 | 117 | 292 | 584 | 1,168 |
| 75% | 100.23 | 100 | 250 | 499 | 998 |
| 100% | 114.83 | 88 | 218 | 436 | 871 |

Actual break-even must substitute measured `CM`, not `C1`. For example, if an account costs `I` infrastructure, `S` support, `R` expected refund/dispute loss and `N` notification subsidy per month:

```text
Standard true CM = 56.43 − I_standard − S_standard − R_standard − N_standard
Plus true CM     = 114.83 − I_plus − S_plus − R_plus − N_plus
```

If the result is zero or negative, no subscriber count creates contribution profit under that pricing/cost profile.

The price-floor formula can be run without inventing a target. If `V` is measured per-account variable cost and `T` is the contribution Zavoia chooses to require, then under the same standard-EEA/Billing scenario:

```text
Minimum recurring ex-VAT price P = (T + V + 1.00) / (1 − 1.21 × (0.015 + 0.007))
                                  = (T + V + 1.00) / 0.97338

Minimum one-time ex-VAT price P  = (T + V + 1.00) / (1 − 1.21 × 0.015)
                                  = (T + V + 1.00) / 0.98185
```

This is the honest control: once real support/infrastructure cost and required contribution are supplied, the formula either validates 59/119/29/59/99/199 or produces the necessary floor.

### 11.7 SMS exposure

Twilio's official Romania messaging page lists outbound SMS at $0.0781 per segment before possible carrier fees and a $0.001 failed-message processing fee (`twilio_ro_sms`). Twilio documents that GSM-7, Unicode and concatenation change segment count (`twilio_segments`). The API deducts one Zavoia credit per successful send call rather than per provider segment (`../admin-api/src/modules/sms/sms.service.ts`).

Using the ECB reference rates from 2026-07-10 solely as a dated conversion scenario—EUR/RON 5.2333 and EUR/USD 1.1430—one USD is approximately 4.5786 RON, so $0.0781 is approximately **0.358 RON per segment before carrier fees** (`ecb_fx_20260710`, `ecb_usd_fx_20260710`). A two-segment message approximately doubles provider cost while current internal deduction remains one credit. No SMS package price should be approved until real encoding, segments, destination, delivery failures and included-message usage are measured.

### 11.8 Refunds, disputes and infrastructure

One-time add-ons have high processor-only retention, but a refund can erase the sale while consumed support/design effort remains. Stripe states that original processing and currency-conversion fees are generally not returned on refunds (`stripe_ro_pricing`). The model must record:

- gross refund value and any non-returned original processing cost under the applicable Stripe terms;
- dispute incidence and the 100 RON/100 RON fee path;
- support minutes by product/tier;
- preview/render/storage/CDN cost per published site;
- email/push/SMS cost by triggered event;
- failed-payment recovery and involuntary churn;
- domain procurement/support separately from subscription revenue.

Until those are measured, it is honest to report the calculated Stripe-only remainder under the stated scenarios. It is not honest to say the company is profitable.

## 12. Claim correction register

This register supersedes claims in the public surfaces and May 2026 audit where current primary evidence or current code differs. It does not edit those surfaces.

| Existing/implied claim | Audit disposition | Correct statement and evidence |
|---|---|---|
| Stailer is effectively offline / a vacuum exists | **Retract as stale** | Current official pricing, terms and App Store surfaces document an active offer at 175 RON + VAT and current applications (`stailer_pricing`, `stailer_terms`, `stailer_appstore`). No health/market-share conclusion is inferred. |
| No competitor has a website builder | **False** | SimplyBook.me, Vagaro, Square and Planific document website builders; Reservio has a constrained booking-site builder (`simplybook_builder`, `WB002`, `WB008`, `planific_builder`, `reservio_booking_website`). |
| Zavoia Plus currently supplies a merchant website | **Unsupported / premature** | Editor, variants and purchase foundation exist; publish is WIP; no public renderer consumes the snapshot (`src/features/website/components/builder`; `../admin-api/src/modules/website-builder`; customer-repo searches in `CODE013`). |
| 12 section types and 37 variants are purchasable | **Partly false** | 12/37 renderers are implemented, but seed exposes 12 free + 16 paid catalogue entries, hides/omits nine non-base variants and uses placeholder EUR 9 (`../admin-api/scripts/seed-website-variant-catalog.sql`). |
| Marketplace search is only name-based and diacritic-sensitive | **Stale** | Current API supports fuzzy business/location names and `unaccent`/similarity taxonomy tags plus structured/geographic/availability filters. Service free-text remains a gap, filter UI is incomplete and `unaccent` migration provisioning is missing (`../admin-api/src/modules/marketplace/public/marketplace-public.service.ts`; `../admin-api/src/migrations/1783170407985-Init.ts`; `../marketplace-app/app/(tabs)/search.tsx`). |
| Zavoia has 2,400+ businesses / 120k monthly bookings / 4.8 rating / nine-city proven scale | **Do not publish without dated evidence** | These values appear in copy but no auditable product dataset or independent evidence was supplied (`../zavoia-web/src/i18n/dictionaries/en.ts`; `../zavoia-web/src/i18n/dictionaries/ro.ts`). Nine configured SEO cities are not proven active supply. |
| Customer deposits, online payments and daily payouts | **Marketing-only** | Copy exists; no appointment-money, merchant settlement or payout implementation was found (`../zavoia-web/src/i18n/dictionaries`; `../admin-api/src/modules/billing`; `../admin-api/src/modules/sms`; `../admin-api/src/modules/website-variants`). |
| Recurring appointments are operational | **Marketing-only / dormant model** | Appointment recurrence fields exist, but no customer/admin series creation and management flow was found. Recurring calendar blocks are a different capability (`../admin-api/src/entities/appointment.entity.ts`; `../admin-api/src/modules/calendar-block`; `../zavoia-web/src/i18n/dictionaries`). |
| Dashboard “revenue” is money earned/collected | **Misleading** | `potentialRevenue` sums non-cancelled scheduled snapshot prices and does not reconcile payment/refund state (`../admin-api/src/modules/dashboard/dashboard.service.ts`). Use “potential scheduled revenue.” |
| Unlimited locations/team | **Unknown** | Plan rows contain `maxLocations` and `maxTeamMembers`; actual production values were not available (`../admin-api/src/entities/plan.entity.ts`). Do not say “as many locations as you like” without plan-record evidence. |
| Import/export client list | **Unsupported as self-serve** | History PDF exists; no customer-list CSV import/export UI/API was found. Concierge migration may be offered only if a real process exists (`src/features/customers/buildCustomerHistoryPdf.ts`; `../admin-api/src/modules/businessCustomers`). |
| Rich analytics/exports | **Overstated** | Dashboard summary exists, but several analytics components are dormant/unmounted and revenue is potential, not collected (`../admin-api/src/modules/dashboard`; `src/features/dashboard`). |
| Push notification registration is operational | **Dormant** | Listener/inbox code exists, but token registration has no call site and the hook says it does not request/register (`../marketplace-app/features/push-notifications/service.ts`; `../marketplace-app/features/push-notifications/hooks.ts`; `../marketplace-app/providers/push-notification-provider.tsx`). |
| Public SEO pages distribute live businesses | **WIP structure, not live directory** | Static city/industry pages are indexable but render “Businesses coming soon”; live search and business pages are noindex (`../zavoia-web/src/app/[locale]/[city]/[industry]/page.tsx`; `../zavoia-web/src/app/_components/category-content.tsx`; `../zavoia-web/src/app/[locale]/search/page.tsx`; `../zavoia-web/src/app/[locale]/business/[slug]/page.tsx`). |
| Offers/Editor's Pick are real merchant promotions | **Demo/marketing-only** | The mobile home API falls back to placeholder London businesses, stock imagery, ratings and offers because endpoints do not exist; web Editor's Pick reuses latest listings rather than a curation fetch (`../marketplace-app/features/home/api.ts`; `../marketplace-app/features/home/placeholder-data.ts`; `../zavoia-web/src/app/_components/home-content.tsx`). |
| Named testimonials and tenure statements are verified | **Unknown** | Public dictionary entries and stock images are not proof/consent records (`../zavoia-web/src/i18n/dictionaries/en.ts`; `../zavoia-web/src/i18n/dictionaries/ro.ts`). Remove until documented. |
| Every business is identity-checked before booking | **Marketing-only / unsafe** | Owners can self-publish and internal admin can block/unblock; no KYB/identity-verification workflow or credential evidence was found (`../admin-api/src/modules/marketplace-listing/marketplace-listing.service.ts`; `../admin-crm/src/features/business/components/MarketplaceTab.tsx`; public claim in `../zavoia-web/src/i18n/dictionaries`). |
| Every review comes from a completed appointment | **Not fully enforced** | Review records are appointment/customer-linked, but the submit service does not enforce completed status at the backend boundary (`../admin-api/src/modules/marketplace/customer/customer.service.ts`). |
| Every booking has free cancellation until 24 hours | **False as universal policy** | Cancellation enablement/window is merchant-configurable (`../admin-api/src/entities/bookingSettings.entity.ts`; `../admin-api/src/modules/marketplace-listing/dto/update-booking-settings.dto.ts`). Say “subject to the business's policy.” |
| App/web legal and company pages are launch-ready | **False / blocker** | Mobile terms and cookie pages contain Lorem Ipsum, company identifiers are fabricated placeholders, and public-web footer legal links have no matching routes (`../marketplace-app/app/terms-and-conditions.tsx`; `../marketplace-app/app/cookies-policy.tsx`; `../marketplace-app/app/company-details.tsx`; `../zavoia-web/src/components/shell/footer.tsx`). |
| Any location can operate without assigned staff | **Needs qualification** | Admin appointments may omit staff only when a location has zero assigned team members; otherwise at least one is required (`../admin-api/src/modules/appointment/appointment.controller.ts`). |
| Existing public price is 100 RON plus €20/member | **Stale and excluded** | It is marketing presentation data, while plan models store Stripe identifiers and fetch live amounts; no approved prices are set (`../zavoia-web/src/lib/marketing/pricing.ts`; `../admin-api/src/entities/plan.entity.ts`; `../admin-api/src/modules/billing/billing.service.ts`). |
| Current invoices/checkouts apply 21% VAT | **False** | Current code sets issuer VAT payer false, VAT utility to 19%, Stripe subscription checkout does not enable automatic tax/tax rates, and Oblio treats line amounts as net with VAT excluded (`../admin-api/src/modules/oblio/oblio.service.ts`; `../admin-api/src/modules/oblio/vat.util.ts`; `../admin-api/src/modules/billing/billing.service.ts`). |

## 13. Launch measurement plan—replace unknowns with evidence

This plan deliberately sets no fabricated success thresholds. Before recruitment, Zavoia should write the decision threshold and owner for each metric so results cannot be reinterpreted after the fact.

| Decision | Measure from real use | Required segmentation |
|---|---|---|
| Is 59 RON retained? | trial start, activation, payment conversion, 30/60/90-day logo and revenue retention, cancellation reason | niche, city, solo/team, migration source |
| Does Plus earn a 60 RON uplift? | site publish rate, domain connection, unique site visits, booking-start/completion, Plus downgrade/churn, support minutes | template/variant, niche, traffic source, new/existing merchant |
| Is 39 RON/seat accepted? | invited vs active users, billable seats, seat removals before renewal, role usage | owner/non-owner role, business size, tier |
| Are variants worth 29/59/99? | view-to-cart, cart-to-pay, refund, reuse after redesign, support time | variant, section, price band, business/tier |
| Does the marketplace create incremental demand? | first-touch source, completed first visit, direct/repeat share, cancellations/no-shows, disputed attribution | city, niche, business age, device/channel |
| What does SMS cost? | encoding, segments, destination, delivered/failed, provider/carrier fee, internal credits | message type, locale, country, length |
| What is true CM? | processor fees, infra by account/site, storage/CDN, email/SMS, support minutes/cost, refunds/disputes | tier, seats, site status, niche |
| Which niche is next? | activation time, configuration gaps, booking completion, support taxonomy, retention | niche and missing workflow |

The research cannot answer these from competitor pricing. They require Zavoia telemetry and invoices.

## 14. Acceptance and launch gates

### Evidence acceptance

- [x] All six repositories audited as one product system.
- [x] Existing `MARKET_RESEARCH_AUDIT.md` preserved as historical research.
- [x] Product facts carry repository paths.
- [x] Competitor prices retain country/currency/VAT/billing/staff/location/promotion context.
- [x] Official contradictions remain visible: Setmore monthly price; Booksy Boost stale-vs-current copy; Stailer web-vs-App-Store channel price; Fresha and SimplyBook localisation; Bookr annual-discount claim versus totals; Minara 200-versus-300 free allowance; Calendis public price versus sales-agreed terms and stale-19%-VAT calculator; Wix Core $29-versus-$28; Reservio unrendered Romanian numerals.
- [x] Practitioner/register/population statistics are labelled as proxies, never TAM.
- [x] Calculations expose inputs and formulas.
- [x] Missing company cost data is explicit; no full-company profitability claim is made.

### Product launch gates

- [ ] Replace unsupported public scale, payment, payout, recurring and testimonial claims.
- [ ] Remove/gate mobile placeholder London offers/businesses and connect real marketplace data.
- [ ] Replace Lorem Ipsum/fabricated mobile legal and company content; add real web legal routes; remove stale London/404 footer links; wire or remove fake-success newsletter signup.
- [ ] Complete Romanian localisation across customer-critical mobile flows.
- [ ] Connect trial/pricing CTAs to a functioning onboarding path.
- [ ] Verify production plan limits and publish an accurate feature table.
- [ ] Design/test VAT collection, Stripe Price/tax configuration and Oblio reconciliation with a Romanian accountant; do not merely change 19 to 21.
- [ ] Make booking idempotency and overlap protection durable across processes.
- [ ] Make SMS credit/segment accounting atomic and cost-aware.
- [ ] Label scheduled list-price analytics accurately.
- [ ] If selling Plus, complete and test public snapshot rendering, preview/publish isolation and rollback.
- [ ] If selling custom domains, ensure merchant registration/transfer, SSL, canonical and support procedures.
- [ ] If selling customer payments/deposits, complete KYC/settlement/refund/dispute/cancellation-policy flows first.
- [ ] Add data export and lapse-safe access policy before positioning portability as an advantage.

## 15. Final positioning recommendation

Do not lead with “all-in-one” or “cheaper Fresha.” Both invite feature comparison against mature payments, POS, marketing and enterprise operations products Zavoia does not yet match.

Lead with a specific promise:

> **Appointments, Romanian discovery and a website the business controls—one predictable subscription, direct bookings kept direct, and designs bought once.**

Use the promise only in stages:

1. **Now:** appointments + marketplace + simple operations at 59 RON + VAT, 0% commission.
2. **After public-site gate:** merchant website + custom-domain/SEO/analytics path at 119 RON + VAT.
3. **After attributable liquidity:** optional 15% first-visit Boost, never mandatory and never on direct/repeat bookings.
4. **After retention evidence:** one vertical workflow at a time, starting with beauty compliance support rather than broad niche marketing.

This gives Zavoia a credible competitive wedge without pretending the current code already delivers the entire vision.

## 16. Explicit unknowns and limits

- Production deployment state and production database contents were not available; code presence is not deployment proof.
- The API worktree contained user-owned uncommitted website/search/catalogue changes. They were audited but not modified.
- Production Stripe price objects, card mix, negotiated Stripe terms, production plan limits and refunds were excluded/unavailable.
- Zavoia payroll, support cost, CAC, fixed OPEX, infrastructure invoices and customer-level gross margin were unavailable.
- No paid cohort exists from which to estimate willingness to pay, conversion, retention or churn.
- INSSE/ONRC current niche business/location counts were not safely extractable and remain unknown.
- Dynamic marketplace listing counts and vendor scale claims are not market share.
- Official feature absence is worded “not documented” for competitors; for Zavoia, absence findings are limited to the audited repositories and searches recorded in the ledger.
- Regulatory notes identify scope and risk; they are not legal, tax, medical or accounting advice.
- Competitor pricing will change. Recheck the ledger sources on the day public Zavoia prices are approved.
