# Zavoia SaaS — Complete Product Capabilities Audit

**Audit date:** 22 July 2026  
**Scope:** all six repositories found under `/home/ted/zavoia`  
**Revision:** second, deeper verification pass after product-owner review  
**Purpose:** a single evidence-based description of what Zavoia is, who it serves, what it currently offers, and which visible claims or code paths are not yet fully implemented.

## 1. How to read this document

This is a static code and documentation audit of the current working trees. It is not a production-environment, live-database, Stripe-account, deliverability, or app-store audit. A capability is treated as implemented when a concrete user surface and its supporting API/service were found. Where only part of that chain exists, the limitation is stated explicitly.

Status terms used below:

- **Implemented:** customer-facing or operator-facing UI and supporting application logic are present.
- **Substantially implemented:** the end-to-end foundations and most useful flows are present, but material limitations prevent an unqualified “implemented” verdict.
- **Backend-capable:** the API/data model exists, but a complete current user surface was not found.
- **Partial:** a substantial flow exists, but a material piece is missing, placeholder-based, or not connected.
- **Planned:** described in a plan/TODO but not implemented in the audited code.
- **Claim requiring reconciliation:** publicly promised, but contradicted by or absent from the implemented product.

The repository contained pre-existing uncommitted changes at audit time. This report describes the files as they existed on 22 July 2026 and does not claim that every audited change is deployed. No live production environment, provider account, database contents, build, or automated test was exercised for this documentation pass.

The second pass traced disputed and easily overstated capabilities step by step through:

1. visible business/customer controls;
2. request types and DTO validation;
3. controllers and authorization;
4. domain services and persistence;
5. scheduled jobs/provider side effects;
6. downstream calendar, availability, inbox, and public-client behavior.

### 1.1 Second-pass conclusions

| Area rechecked | Evidence-based verdict | Product interpretation |
|---|---|---|
| Recurring appointments | **Not currently creatable/manageable as a series** | Appointment rows contain dormant series metadata and customer web has a minimal read-only note, but no current business or customer payload supplies cadence, count, or end rules. |
| Recurring calendar blocks | **Implemented end to end** | Daily, weekly, biweekly, and monthly blocks are created, expanded in calendar views, and enforced in admin/customer availability. Series-exception and privacy caveats remain. |
| Email, SMS, push, and inbox communication | **Substantially implemented; not uniformly reliable or fully connected** | Real providers, templates, jobs, preferences, inboxes, and delivery records exist. Initial confirmations, repeat-event idempotency, retries, customer push registration, and some preference/client paths need correction. |
| Website Builder | **Editor, catalog, checkout, validation, and publish snapshot implemented** | The public renderer in `zavoia-web` is the product owner's explicitly stated next implementation item; it is not a current public capability yet. |
| Images and media | **Substantially implemented pipeline** | R2 storage, format validation, WebP conversion, EXIF rotation, metadata stripping, resizing, SVG sanitization, galleries, featured images, selection/reordering, and snapshot retention exist, with non-uniform hardening between upload paths. |
| Data export | **Individual customer-history PDF implemented** | The missing capability is bulk client-list/business-wide booking export, not all export functionality. |

## 2. Executive product summary

Zavoia is a two-sided, multi-tenant appointment marketplace and business operating system for service businesses.

For businesses, it combines:

- business onboarding and account management;
- multi-location setup;
- service, category, package, team, assignment, and schedule management;
- an operational calendar with availability and conflict controls;
- appointment and customer relationship management;
- a configurable public marketplace presence;
- online booking rules and automated customer communication;
- verified reviews for locations and professionals;
- analytics for bookings, capacity, revenue potential, and reputation;
- subscriptions, team seats, SMS credits, and invoicing;
- a premium website-builder editor and design marketplace;
- web and native-mobile access for business users.

For consumers, it combines:

- location-aware discovery and search;
- map and list browsing;
- business, location, service, package, and professional profiles;
- live availability and multi-item appointment booking;
- appointment management, favorites, reviews, notifications, and support;
- current web and native iOS/Android experiences.

For Zavoia's internal team, it provides an administration CRM for business oversight, content taxonomy, subscription plans, moderation, support, invoices, SMS pricing, email previews, and website-builder catalog management.

The core implemented commercial model is subscription software for the business side. Consumer bookings do not contain an implemented checkout/payment flow; the current operational model is payment directly to the business, normally at the venue. Zavoia does implement Stripe payments for its own SaaS subscriptions, team seats, SMS credit packs, and website-builder purchases.

## 3. Product ecosystem and repository map

| Repository | Product role | Main technology | Audited HEAD | Audit conclusion |
|---|---|---|---|---|
| `admin-api` | Shared application API, domain logic, integrations, data model, scheduled jobs, webhooks | NestJS, TypeORM, PostgreSQL/PostGIS, Stripe | `b19abeb` · 2026-07-21 | Authoritative source for implemented business rules and backend capability |
| `admin-dashboard` | Business-owner and team-member product; web plus Capacitor iOS/Android shell | React, Vite, Redux Saga, Tailwind/Radix, Mapbox, Recharts, Capacitor | `5142245` · 2026-07-21 | Current business operating surface |
| `admin-crm` | Zavoia internal operations console | React, Vite, MUI, Redux Saga | `c5283e0` · 2026-07-15 | Current internal administration surface |
| `zavoia-web` | Current public marketplace, marketing site, customer account, booking, SEO content, and Sanity Studio | Next.js, React, Mapbox, Sanity | `8423c3e` · 2026-07-05 | Current consumer web and public marketing surface |
| `marketplace-app` | Native consumer application | Expo/React Native, Mapbox, Expo services | `5a1f47b` · 2026-07-05 | Current native consumer surface, with several explicitly incomplete areas |
| `marketplace` | Earlier consumer web implementation | React, Vite, Redux Saga | `a204d17` · 2026-01-19 | Older prototype/parallel implementation; many content and booking screens use hard-coded demo data and should not be used as evidence of production capability |

The shared API is used by both sides of the marketplace. Business configuration controls what consumers can discover and book, and consumer activity flows back into business calendars, customers, notifications, analytics, and reviews.

## 4. Users, roles, and tenancy

### 4.1 Business owner

An owner can create and configure a business, complete onboarding, manage locations, services, packages, team members, assignments, customers, calendar, marketplace settings, website builder, subscription, SMS credits, notifications, invoices, and support.

### 4.2 Team member

A team member can be invited into a business and receives a role-scoped experience. Implemented access includes:

- dashboard data scoped to their work;
- their own calendar and appointments;
- customers associated with their work;
- assigned locations, services, and packages;
- a personal marketplace profile, portfolio, and reviews;
- notifications, support, and personal account settings.

The business dashboard currently derives these permissions from a front-end role map. The file explicitly describes backend-provided granular permissions as a future migration, so custom per-user permission editing is not a current product capability.

### 4.3 Customer

A customer can browse the marketplace, book, manage appointments, save favorites, maintain a consumer profile, control communication preferences, submit verified appointment reviews, receive an in-app inbox, and contact support. Zavoia platform-review APIs exist, but a connected customer submission UI was not found.

### 4.4 Dashboard-only user

When a former team member no longer belongs to any business, the account can remain as a dashboard user. This user retains personal profile, portfolio, reviews, account settings, and support access without business-management access.

### 4.5 Internal administrator

Zavoia staff authenticate separately into the internal CRM and can manage or inspect platform-wide business, user, plan, taxonomy, moderation, support, invoicing, SMS, email, and website-catalog data.

### 4.6 One identity, multiple contexts

The authentication model supports:

- one person holding owner, team-member, and/or customer roles;
- a person belonging to more than one business;
- business selection after login when multiple business memberships exist;
- adding marketplace/customer access to an existing business account instead of creating a duplicate identity;
- retaining unrelated roles when leaving a business or being offboarded.

## 5. End-to-end business journey

The implemented business journey is:

1. Register with email/password or Google and verify the identity.
2. Create or select a business context.
3. Complete the resumable setup wizard.
4. Configure the first location, hours, services, team, and assignments.
5. Configure marketplace visibility and online-booking rules.
6. Publish the business listing and location pages.
7. Receive marketplace bookings or create phone, walk-in, and admin bookings.
8. Operate the calendar, communicate changes, and manage the customer record.
9. Track appointment, capacity, revenue-potential, and review metrics.
10. Receive verified reviews from completed appointments.
11. Manage the SaaS plan, seats, SMS credits, billing details, and invoices.

Subscription state is enforced across this journey. When entitlement is missing or the subscription is past due/ended, protected writes are blocked and marketplace visibility/reminder behavior is affected, while read access and data retention are preserved.

## 6. Business-client capabilities

### 6.1 Registration, login, and account security — Implemented

- Email/password registration and login.
- Google authentication.
- Email-verification links and verification completion. The customer resend-verification endpoint is commented out; no standalone resend flow should be claimed.
- Forgot/reset password, set password, and change password.
- Change email with verification.
- Link and unlink Google from an existing account.
- Explicit account-linking flows when an email already has another Zavoia role.
- Access and refresh tokens, refresh-session tracking, logout, and multi-session handling.
- CSRF protection around refresh-token flows.
- Leave an organization without automatically deleting other roles.
- Personal account deletion with role-aware cleanup.
- Account/business selection when a user has multiple contexts.
- English/Romanian locale persisted through authentication and communication flows.

### 6.2 Resumable business onboarding — Implemented

The owner setup wizard collects and saves:

- business name, industry, phone, email, description, logo;
- Instagram, Facebook, TikTok, Pinterest, and external website links;
- country, country code, timezone, billing/Stripe currency, and customer-facing business currency;
- one initial location with name, description, contact details, address, address components, coordinates, pin confirmation, timezone, working hours, and 24/7 mode;
- whether the owner works alone;
- email invitations for initial team members.

The wizard can save a draft, resume later, upload/replace a temporary logo, and mark setup complete. The initial team-invite DTO only contains email; assigning invited people to locations during onboarding is not evidenced in the completed API contract.

### 6.3 Business profile — Implemented

- Business name, description, contact details, logo, country, timezone, and currency.
- Industry association and public slug/vanity identifier.
- Social and external website links.
- Choice of customer-facing display currency separately from the Stripe billing currency.
- Billing/fiscal identity stored independently from public business identity.

### 6.4 Multi-location management — Implemented

Each business can create and manage multiple locations, subject to plan limits or per-business overrides. A location supports:

- name and description;
- independent or inherited business contact information;
- structured/manual address entry;
- latitude/longitude and confirmed map pin;
- its own timezone;
- weekday working hours or 24/7 operation;
- public/private marketplace visibility;
- online-booking enable/disable;
- assigned staff, services, and packages;
- featured image and portfolio gallery;
- cached average rating and review count;
- location-specific marketplace settings and searchable semantic attributes.

PostGIS-backed coordinates and marketplace-search indexing support nearby discovery and map results.

### 6.5 Location attributes — Implemented

Businesses can describe locations using managed dictionaries:

- **Amenities:** free Wi-Fi, on-site parking, nearby street parking, air conditioning, pet-friendly, kid-friendly, bike parking, outdoor seating, private treatment room, showers, and lockers.
- **Audience:** adults only, women only, men only, and LGBTQ+ friendly.
- **Values/ownership:** women-owned, LGBTQ+-owned, disability-owned, family business, independent business, eco-conscious, zero-waste, plastic-free, vegan, cruelty-free, and locally sourced.
- **Accessibility:** step-free entrance, accessible parking/restroom, hearing loop, sign language, large-print materials, service animals, sensory-friendly environment, and mobility aids.
- **Accepted payment methods:** cash, card, Apple Pay, Google Pay, bank transfer, and corporate invoice. These are descriptive tags for what the venue accepts, not payment processing by Zavoia.
- **Languages spoken:** 27 seeded language options. These are venue metadata, not 27 product-interface localizations.

### 6.6 Service catalog and categories — Implemented

- Service name and description.
- Price stored in minor currency units.
- Duration.
- Category and visual color.
- Display order.
- Assignment to one or more locations.
- Staff eligibility per service and location.
- Staff-specific price and duration overrides.
- Search, filtering, ordering, add, edit, and remove flows in the dashboard.

The business-facing currency selector contains EUR, USD, RON, GBP, CHF, SEK, NOK, DKK, PLN, CZK, HUF, BGN, and TRY. Currency support in a selector does not by itself guarantee that every external billing or fiscal integration supports every currency.

### 6.7 Packages/bundles — Implemented

- Combine multiple services into one bookable bundle.
- Calculate the bundle by service sum, fixed price, or percentage discount.
- Assign/enable the bundle by location.
- Preserve included-service details for customers.
- Display package savings in consumer surfaces.
- Book a package as one appointment selection while preserving its service snapshot.

### 6.8 Team management — Implemented

- Invite team members by email.
- Resend or cancel a pending invitation.
- View and update team records and status.
- Assign locations, services, and bundles.
- Maintain per-location service eligibility and custom duration/price overrides.
- Configure staff working schedules.
- Track and resolve team-seat overflow.
- Preview offboarding impact.
- Offboard one or multiple team members.
- Reassign or cancel affected future appointments during offboarding.
- Preview the impact of removing a person from a location.
- Preserve a former member's independent customer or personal-profile role where applicable.

### 6.9 Professional marketplace profiles — Implemented

Each professional can maintain a profile that is personal/global rather than duplicated per business:

- display name and profile image;
- professional title and biography;
- years of experience;
- interests and specialties;
- spoken languages;
- social links;
- portfolio images;
- public visibility;
- professional ratings and reviews.

Their active business assignments determine which locations, services, and booking contexts consumers can use.

### 6.10 Staff schedules — Implemented

- Per-person weekday schedules.
- Availability checks against staff hours.
- Location/service eligibility checks.
- Business and location hours considered with staff schedules.
- Timezone-aware availability.

### 6.11 Operational calendar — Implemented

- Desktop day, week, month, and list-style views, plus responsive/native-oriented calendar layouts.
- Filters for location, staff, appointment status, and booking source.
- Booking sources include marketplace, admin, phone, and walk-in.
- Calendar context, daily/weekly summaries, and available-slot APIs.
- Click-to-create and edit appointment flows.
- Drag-and-drop rescheduling on supported desktop views.
- Protection against invalid past, midnight, unavailable-staff, wrong-service, and out-of-hours moves.
- Appointment snapshots retain the customer, staff, location, service/package, price, duration, and currency as they existed when booked.
- Per-device display preferences for 12/24-hour time, color coding by status/service/staff, and whether cancelled appointments are shown.
- Last-selected location persistence and next-available-date guidance during appointment creation.

### 6.12 Appointment creation and management — Implemented

- Create a single-service or package appointment.
- Add multiple services/packages to one booking group.
- Merge adjacent same-staff items into a composite run while retaining item detail.
- Select an existing customer, create a customer quickly, or record a walk-in without a linked customer.
- Choose staff for each booking item.
- Validate availability and conflicts.
- Owner-only override of conflicts or working-hour restrictions with a required reason and audit fields.
- Update, reschedule, cancel, or delete appointments.
- Bulk status changes.
- Statuses: pending, confirmed, completed, no-show, and cancelled.
- Cancellation reason and customer-notification choice.
- Auto-confirm marketplace bookings when configured, otherwise keep them pending.

**Recurring appointment boundary after a second end-to-end trace:** recurring appointment-series creation is not implemented in the current worktrees.

- The appointment entity contains `recurringGroupId`, `recurringIndex`, and `isRecurringParent` groundwork.
- Neither the business single-appointment DTO, business grouped-booking DTO, consumer booking DTO, nor update DTO accepts a cadence, number of visits, weekdays, recurrence end, or series mutation scope.
- The dashboard appointment form sends location, customer, booking items, staff, time, notes, source, and override data—not recurrence data.
- `admin-create-group` means several services/packages sequenced inside one visit and merged into same-staff runs. It is not a repeating appointment series; those saved rows are explicitly standalone.
- Customer cancel/reschedule and business update/cancel target one appointment UUID/ID. Reminders and notifications are likewise scheduled per appointment row.
- The customer API can return the dormant group ID/index. Current web can therefore show only “Part of a recurring plan” for externally populated data; mobile hides its richer series strip because total and cadence are absent. The business calendar mapper does not return these series fields.

The current public Help Centre says a customer can choose a cadence and see progress such as “2 of 4.” That content is ahead of the implementation and requires correction. Unless a different private branch or service exists outside these audited worktrees, recurring appointments must remain planned; recurring **calendar blocks** are the feature that is fully implemented today.

### 6.13 Calendar blocks and unavailability — Implemented

Calendar blocks were reverified from the dashboard through recurrence expansion and customer availability. Blocks can apply to an entire business, one location, or one staff member and can be:

- one-time and timed, all-day, or multi-day;
- same-day recurring bases that repeat daily, weekly, every two weeks, or monthly;
- restricted to selected weekdays;
- ended on a date or left without a specified end;
- categorized as holiday, vacation, sick leave, lunch, break, meeting, personal, maintenance, or other;
- given an internal title and notes.

Implemented operational behavior includes:

- create, list, edit, and delete endpoints with tenant/scope authorization;
- owner “all locations” business blocks and per-location blocks;
- staff self-blocking only at assigned locations, when enabled, and only for owner-approved reason types;
- location-timezone recurrence expansion in day/week calendar responses and recurring occurrence counts in month summaries;
- monthly day clamping, such as 31 January to 28/29 February, and ISO-week-anchored biweekly patterns;
- recurrence badges, title, notes, reason, scope, and staff presentation across desktop and mobile calendar views;
- availability-index refresh after block mutations;
- conflict enforcement for admin creation/rescheduling and direct removal of blocked periods from customer web/mobile availability.

Important boundaries:

- One database row represents the complete recurring block series. Editing it changes the series and deleting it removes every occurrence; there is no “this occurrence” or “this and future” exception flow.
- The edit UI intentionally hides scope and recurrence controls. Changing either requires deletion and recreation.
- Adding a block over existing appointments does not cancel, move, or notify them; it prevents new conflicting bookings.
- Disabling staff self-blocking forbids the action; it does not create an owner-approval queue.
- The standalone raw block-list query does not project future recurring occurrences, although the calendar day/week/summary APIs used by the visible product do.
- Existing title/notes clearing has edit-form limitations, and notes are not currently prefilled in that edit drawer.
- `showReasonToCustomers` and `customerMessage` entity fields are absent from create/update DTOs and the dashboard. They are not a configurable customer-message feature.
- All-day business/location block titles are nevertheless returned as customer calendar reasons and used by web as disabled-date tooltips. An internal title can therefore leak to customers despite the unused visibility flag.
- Business-wide timed blocks are encoded from the selected location timezone; a multi-timezone business needs an explicit rule for how that wall time should apply elsewhere.
- Direct API recurrence validation is weaker than the dashboard guardrails for weekday range, end-before-start, and unsupported multi-day recurring patterns.

### 6.14 Booking-policy configuration — Implemented

Businesses can configure:

- minimum and maximum booking lead time;
- slot interval from 5 to 120 minutes;
- buffer time;
- cancellation and rescheduling windows;
- whether customers may cancel or reschedule;
- automatic confirmation versus pending approval;
- whether customers choose a professional or may select any available professional;
- whether staff may cancel, reschedule, or block their own time;
- allowed staff block types;
- email and SMS notification enablement;
- one reminder offset or disabled. The dashboard offers 1, 2, 4, 12, 24, or 48 hours; the API accepts 0–168 hours;
- whether the minimum lead-time rule also applies to admin-created bookings.

### 6.15 Customer relationship management — Implemented

Business customers may originate from manual entry, marketplace bookings, or an import source marker. Implemented management includes:

- searchable/paginated customer list and picker;
- add a manual customer;
- automatically associate marketplace bookers;
- customer profile and contact details;
- business-specific notes and custom fields;
- active, blocked, archived, and merged states;
- recent and full paginated appointment history;
- milestones/history view;
- complete per-customer history PDF download;
- duplicate/conflict detection;
- merge duplicate customer records while retaining source metadata;
- edit and remove relationships.

The PDF flow fetches every history page and generates a localized, multi-page A4 document in the business calendar timezone. It includes appointment/milestone type, date/time, title/status, location, duration, price/currency or relationship source, generated count/date, and page numbering.

An `import` source value exists, and marketing mentions help importing clients, but no client-import workflow was found. No bulk client-list or business-wide appointment export endpoint/UI was found. Public “export client list and booking history” wording therefore remains unsupported even though individual customer-history PDF export is implemented.

### 6.16 Business dashboard and analytics — Implemented

Analytics are location-selectable and role-scoped. The dashboard provides:

- open/closed location state;
- active staff count;
- appointment counts for today, this week, and this month;
- potential revenue for today, this week, and this month;
- filled versus available capacity for those periods;
- status distribution across pending, confirmed, completed, no-show, and cancelled;
- the next five upcoming appointments;
- average rating, total reviews, and rating distribution;
- unresolved past appointments that still need a final status.

Owners see business-wide data. Team members receive their own appointment/review scope.

“Potential revenue” is operational appointment value, not evidence of payment collection or recognized revenue through Zavoia.

### 6.17 Marketplace listing management — Implemented

Owners can:

- publish and unpublish the listing;
- use business-sourced or listing-specific name, email, phone, and description fields;
- synchronize or override public business data;
- show/hide team, services, and locations;
- choose industry and venue tags;
- control location visibility and online booking;
- manage location portfolio images and featured image;
- order public listing categories;
- configure booking policies;
- view business, location, professional, and review presentation.

Platform moderation can block a listing, while the subscription system can hide it automatically when entitlement is lost and restore prior visibility when entitlement returns.

### 6.18 Reviews and reputation — Appointment reviews implemented; platform-review submission is backend-capable

- A completed appointment can generate one review opportunity.
- Customers can rate/comment on the location/business.
- Customers can separately rate/comment on each professional involved.
- Businesses see average, totals, distributions, filters, and review details.
- Team members see reviews tied to their work/profile.
- Rating totals are cached for business, location, and professional discovery surfaces.
- Businesses cannot selectively hide unfavorable verified reviews.
- Internal administrators can moderate location and professional review visibility from business inspection surfaces.
- Review-request emails are supported.

Separate API endpoints and persistence support one review of the Zavoia platform per user, public approved-review listing, and internal approve/reject/delete operations. A current customer submission UI and a connected `admin-crm` platform-review moderation UI were not found; the CRM's separate `ReviewsPage` is still a placeholder. Platform reviews should therefore be described as backend-capable, not a complete current user flow.

### 6.19 Business notifications — Implemented

- Persisted in-app notification list with pagination, read/unread state, mark one/all read, deletion, and deep-link payloads.
- Separate owner/global business visibility and staff-targeted visibility.
- Events for customer cancellation/rescheduling, appointment assignment/unassignment, team-member rescheduling/cancellation, team invitation acceptance/departure, support replies, unresolved end-of-day appointment summaries, and SMS-credit low/depleted state.
- Native business FCM token registration/refresh/logout cleanup and foreground/deep-link handling.
- Owner push scope: all appointment activity, only appointments assigned to the owner, or no mobile push. Assigned professionals receive relevant appointment-event push.

There is no broad billing-event inbox. The billing-adjacent in-app events found are SMS-credit low/depleted alerts; subscription and invoice lifecycle messages are principally email.

### 6.20 Automated email, SMS, push, and in-app communication — Substantially implemented; trigger, reliability, and client gaps remain

Zavoia has a real multi-channel communication platform rather than placeholder UI:

- AWS SES v2 email with 27 template source files, HTML/plain-text variants, English/Romanian translations, environment/allowlist safety gates, configuration-set support, and business-branded appointment sender names;
- SES SNS webhook signature verification plus persisted hard-bounce/complaint suppression; soft bounces and deliveries are logged;
- Twilio Messaging Service SMS with staging allowlisting, a business credit balance, usage categories/ledger, provider SID capture, and low/depleted alerts;
- Expo customer push plus a persisted customer inbox;
- Firebase/FCM business push plus the separate business inbox described above;
- Google Cloud Tasks for reminders, trial lifecycle, end-of-day review, seat-mismatch warnings, and availability sweeps;
- persisted appointment notification events and per-channel delivery rows containing status, attempts, provider ID, last error, and sent timestamp.

#### Appointment communication behavior

| Trigger | Customer communication actually created |
|---|---|
| Dashboard or marketplace creates an appointment already confirmed | Future reminder may be scheduled; **no immediate confirmation** is sent. |
| Marketplace creates a pending booking | Business-side booking notifications are created; the customer receives no “booking received/pending” message. |
| Business changes pending to confirmed | Conditional email, SMS, customer push/inbox, and future reminder. |
| Scheduled reminder | Conditional email, SMS, and customer push/inbox for confirmed appointments. One business-wide reminder time is supported. |
| Business/team reschedules | Conditional email, SMS, and customer push/inbox; business FCM/inbox also targets relevant staff/owner. Repeat-event defect applies below. |
| Customer reschedules | Business FCM/inbox plus a conditional reschedule update back to the customer. |
| Dedicated business cancellation with “notify customer” enabled | Conditional email, SMS, and customer push/inbox. The UI's email/SMS/both choice is not enforced. |
| Customer cancels | Owner/assigned-staff business notifications; no redundant customer cancellation message. |
| Generic update or bulk status changes to cancelled | Pending reminder is cancelled, but no customer cancellation message is created. |
| Appointment completed | Conditional email, SMS, and customer push/inbox review request, but only for marketplace-account customers. |
| Appointment is no-show | Reminder cancellation only. |

The implemented email/lifecycle catalog also covers account verification, password reset, account linking, old/new-address email changes, account-deletion instructions, team invitations/welcome/removal/leave, guest support confirmation/reply, 7-day and 3-day trial warnings, trial expiry, subscription termination, seat-overflow warnings, zero-SMS-credit alerts, and invoice-ready messages. An `invoice.payment_failed` event itself hides the listing and records state but does not send the payment-failed email immediately; that email is selected later if subscription deletion is attributed to payment failure.

#### Preferences and quiet hours

- Business settings control email, SMS, and one reminder offset. Manual customers use these settings plus their available contact details.
- Marketplace-account customers store marketing and appointment preference flags for email, SMS, and push.
- The current `reminder*` flags gate every appointment event—not only reminders—including confirmation, cancellation, reschedule, and review request.
- Marketing preferences are stored and editable, but no marketing campaign sender reads them.
- Reminder channel/contact choices are snapshotted when scheduled and are not re-read if the customer or business changes preferences/contact data before send time.
- Quiet hours are fixed, not configurable: 22:00–07:00 in the business timezone. The adjustment chooses 21:55 or 07:05 and applies only to deferred reminders; urgent updates and review requests are immediate. This differs from the dashboard copy that says 22:00–08:00.

#### Current reliability and integration boundaries

- A unique key on appointment + event type + reminder hours means cancelling and recreating a reminder after rescheduling collides with the old row. It also blocks a second instant event of the same type for an appointment. Repeat rescheduling/notification is therefore not reliable.
- Failed channels are recorded but not retried. Reminder task handlers acknowledge processing errors and mark events done; no retry/backoff or stuck-processing recovery worker was found. A task-scheduling failure can leave a pending row with no executor.
- The defensive send-time terminal-status check compares uppercase strings with lowercase appointment enum values, so that race-condition safeguard is ineffective even though normal mutation paths attempt task cancellation.
- The cancellation drawer sends an email/SMS/both selection and the DTO accepts it, but the controller ignores it. Only the overall notify-customer switch changes behavior; preferences/settings determine channels and push may also send.
- Customer inbox creation is coupled to the push channel. Disabling push can also remove appointment inbox rows, and scheduled reminder inbox creation requires an existing push token.
- The native customer app defines Expo token initialization but does not call it in the audited tree. Existing tokens can work and the native inbox works, but new-install OS push registration is not end to end.
- The current `zavoia-web` notification panel is an explicit unconnected TODO.
- Appointment emails are localized by business-country-derived locale; appointment SMS, customer push, and persisted inbox copy are currently English. Business FCM has translation data but currently resolves English.
- Twilio API acceptance is treated as sent without a delivery-status webhook and deducts one credit per API request rather than per SMS segment. Expo immediate ticket errors are processed, but delivery receipts are not polled. SES delivery is logged but not correlated into a generic outbound-email ledger.
- Only appointment events use the common event/delivery ledger; account, support, billing, lifecycle, and business-push sends do not share it.
- The review-request email uses a `zavoia://` deep link that does not match the audited mobile application's `marketplaceapp` scheme.

Zavoia can accurately describe reminders and lifecycle communication as a substantial capability. It should not promise that every booking gets an immediate confirmation, failed messages are retried, repeat rescheduling is fully reliable, customer OS/web notifications are fully wired, or marketing automation is shipped until these paths are corrected.

### 6.21 SMS credits — Implemented

- Region-specific SMS packages and prices.
- One-time Stripe checkout for credit packs.
- Current balance, total purchased, and total used.
- Purchase and usage history.
- Business UI states that credits do not expire.
- Low-balance/out-of-credit notifications.
- Subscription/trial eligibility checks.
- Internal management of SMS regions, packages, discounts, and activation.

### 6.22 Support — Implemented

- Authenticated owner/team ticket creation and ticket list.
- Ticket detail, conversation/replies, and close action.
- Customer support within the public web and mobile account.
- Guest support submission protected by rate limiting.
- Internal ticket listing, filtering, creation, reply, edit, and deletion.
- Guest ticket confirmation and guest-reply emails.
- Internal CRM replies to authenticated business/customer tickets create the appropriate in-app inbox row; they do not currently send business/customer OS push.

The audited ticket payloads are text-based. No support-file attachment upload or malware-scanning flow was found.

### 6.23 Subscription and team-seat billing — Implemented

- 14-day trial fields and reminder/expiry jobs.
- Stripe subscription checkout.
- Stripe customer portal.
- Base-plan and per-seat price structure.
- Regional price resolution by business country.
- Subscription summary and available-plan API.
- Immediate prorated upgrades.
- End-of-period downgrades.
- Seat-change preview and proration.
- Immediate seat additions and scheduled seat reductions.
- Cancel scheduled plan/seat changes.
- Cancel at period end and undo cancellation.
- Detect incomplete/pending payments.
- Update payment method, retry, or abort eligible failed proration changes.
- Subscription and seat history/state handling.
- Read-preserving write block when the subscription is not entitled.
- Marketplace listing hide/restore behavior on loss/return of entitlement.
- Life Time Deal accounts managed internally: base platform access without a recurring base fee, with additional seats billable.

The business native shell deliberately limits or hides subscription purchasing surfaces to respect app-store policy; billing is principally handled through web/Stripe.

### 6.24 Billing details and invoices — Implemented; e-Factura submission not evidenced

Businesses can store company or individual billing identity, including fiscal code, legal name, trade-register number, billing address, city, county/state, and country code.

Paid Stripe events generate idempotent Oblio invoice records for:

- subscriptions;
- SMS purchases;
- Life Time Deal seat charges;
- website-builder variant/theme purchases.

Invoices store status, Oblio series/number, PDF/download link, amount, currency, VAT rate/rule, and failure details. Businesses can list/download invoices; internal staff can inspect failed invoices and retry them. The owner receives an invoice-ready email.

An older `e-factura-plan.md` describes Romanian e-Factura/ANAF submission as TODO and is now stale about the absence of fiscal fields and local invoices. Current code has Oblio invoicing, but the audited code does not track ANAF submission/acceptance/rejection states. Do not claim direct e-Factura submission until that production behavior is separately verified.

### 6.25 Website Builder — Editor/backend implemented; `zavoia-web` renderer is the next planned item

The owner-only `/website` workspace is plan-feature gated. It provides:

- load and explicitly save a versioned draft;
- optimistic-concurrency protection and conflict resolution;
- desktop, tablet, and mobile preview modes;
- section visibility and ordering controls;
- required/pinned section rules;
- unsaved-change protection;
- content/readiness validation before publish;
- hero-media upload/delete;
- theme color and font selection;
- preview of locked premium designs before purchase;
- one cart/Stripe checkout for premium variants, sections, colors, and fonts;
- purchase reconciliation and permanent ownership records;
- publish a frozen snapshot;
- unpublish while retaining the saved snapshot.

Most website content is deliberately sourced from existing business data—locations, services, team, galleries, and reviews. Net-new content includes bilingual FAQ and announcement content, plus builder-specific headings/taglines, about story, established year, and presentation controls.

Media selection is also implemented inside the builder. Gallery publishing requires at least four visible images, defaults to an automatically selected set of eight, and supports up to 16. Automatic selection is featured-first, de-duplicated, and distributed deterministically across locations; owners can switch to manual selection and drag/keyboard ordering. About imagery and location-specific service feature imagery can be selected from existing portfolios.

The builder catalog contains 12 section types and 47 implemented variants:

| Section | Available designs |
|---|---|
| Announcement | Ribbon, Pill, Ticker |
| Navigation | Editorial, Capsule, Split, Underlay |
| Hero | Text panel, Cinematic, Poster, Portal, Drift, Tumble |
| Moving service strip | Scroll, Loop |
| About | Manifesto, Editorial, Story |
| Services | Feature, Cards, Bento |
| Locations | Panorama, Showcase, Bento, Atlas |
| Gallery | Bento, Carousel, Masonry, Mosaic, Fan |
| Team | Portraits, Roster, Columns, Carousel |
| Reviews | Wall, Marquee, Showcase, Spotlight, Deck |
| FAQ | Grid, Accordion, Index |
| Footer | Directory, Editorial, Signature, Masthead, Marque |

The theme catalog contains 30 colors (5 included and 25 premium) and 14 fonts (4 included and 10 premium). Announcement and moving-strip styles are paid-only; other major sections have an included base design. Current API code makes website-builder access a Plus-tier feature and validates ownership at publish time.

**Current delivery boundary and stated roadmap:** no audited consumer repository currently reads `websitePublishedSnapshot`, `websiteIsPublished`, `pageLayout`, `pageTheme`, or the website-builder API. The current public business page is the standard marketplace listing. The product owner has identified the public renderer in `zavoia-web` as the next implementation item. Until that renderer and serving route are connected and verified, Zavoia has a complete authoring/purchasing/publish-snapshot system, but not a live end-to-end custom website offering.

### 6.26 Image and media management — Implemented with path-specific limitations

#### Shared upload and adjustment pipeline

Cloudflare R2 is the main product-media object store through its S3-compatible API. Most active upload flows perform the following work:

1. accept a browser/native multipart image and show an immediate local preview where supported;
2. enforce a 10 MB application limit and a context-specific format list;
3. sanitize SVG or inspect/re-encode raster media;
4. auto-rotate from EXIF orientation;
5. resize eligible raster images without enlargement and preserve aspect ratio;
6. convert/re-encode to WebP at quality 80 and strip metadata;
7. store a UUID filename under a functional R2 prefix with original name, MIME, and upload time metadata;
8. persist both public URL and storage key so later replacement/deletion can clean the object.

The common format set is JPEG/JPG, PNG, WebP, AVIF, and sanitized SVG where that context allows vector media. Public product media is served through public URLs; a presigned one-hour read helper exists but no active product endpoint/caller was found.

#### Media capabilities by product area

| Area | User-visible behavior | Adjustment/storage behavior | Important boundary |
|---|---|---|---|
| Business and wizard logo | Browse/drag, preview, replace/remove; 10 MB hard and 2 MB recommended size | Sanitized SVG remains vector; non-WebP raster is rotated, capped to 1024 px longest side, converted to WebP | Existing WebP bypasses the logo resize branch; business-profile replacement is not transactional, and wizard completion has the storage-key ownership issue below. |
| Team/professional avatar | Upload/replace profile image with fallback icon/avatar | Same logo-style raster/SVG pipeline | Old object is deleted before new upload/save, so failure can leave a broken DB reference or orphaned replacement. |
| Location marketplace gallery | Up to 16 images, sequential upload, duplicate detection, featured-image selection/change, carousel, remove | JPEG/PNG/WebP/AVIF, 10 MB; first upload becomes featured | Last photo of a public location cannot be removed; media used by a published Website snapshot is protected. No manual crop/focal editor. |
| Professional portfolio | Current dashboard UX allows up to 10, sequential upload, duplicate detection, carousel/remove | JPEG/PNG/WebP/AVIF, 10 MB | Ten-image cap is client-only; backend has no matching count limit or concurrency lock. |
| Customer avatar | Web selector plus native camera/library, optimistic preview and rollback | Native picker provides 1:1 crop and quality 0.8; backend stores under `profile-images` | Web has only `image/*` client filtering; server replacement deletes old media first. |
| Website Builder hero | Upload, replace/delete, publish-readiness checks, conflict reconciliation | Strict decode, 24 MP ceiling, no SVG/animation, EXIF rotation, maximum 1024 px, WebP q80 | Strong transactional rollback and preservation while a published snapshot references the old hero; normalized WebP is currently encoded twice. |
| Website gallery/about/service photos | Automatic/manual selection from location media, featured-first balancing, de-duplication, drag/keyboard order | Exact selected references are frozen in the published snapshot | These controls select/order existing images; they are not a general crop/retouch editor. |
| Sanity blog imagery | Cover hotspot crop, inline images, optional alt text | Sanity automatic format and max-fit variants at requested 640/960/1600 widths | Managed by Sanity rather than Zavoia's R2 upload service. |

Most dashboard/public display components use `object-cover` or `object-contain`, responsive frames, lazy loading, fade-in, and missing/broken-image placeholders. Apart from native customer square cropping and Sanity hotspot selection, no general manual rotate, crop, zoom, focal-point, filter, or retouch editor was found. “Adjusting” a normal Zavoia upload means automatic orientation, aspect-preserving resize, format conversion, metadata removal, featured selection, and presentation cropping—not destructive user-authored image editing.

#### Lifecycle and cleanup behavior

- Website hero replacement is the strongest path: upload first, rollback the new object on version/database failure, and keep an old object while a published snapshot still references it.
- Location gallery deletion commits the database change first, then removes R2 best-effort; a featured deletion promotes the first remaining image.
- Deleting a location is blocked if the live Website snapshot still needs its media.
- Business deletion collects business logo, draft/published Website hero, location portfolios, and business-exclusive professional portfolios for best-effort cleanup.
- Professional/customer self-deletion can leave professional portfolio objects because the profile row is removed before its keys are returned to the cleanup orchestrator.
- Wizard completion re-downloads a temporary logo into the final business folder, but currently trusts the client-supplied `logoKey` without proving it belongs to the authenticated owner's `wizard-drafts/{ownerUuid}` prefix. A known cross-tenant object key could therefore be copied and its source deleted; this is a high-priority storage-ownership defect, not a product capability.
- Generic single/logo/bulk upload endpoints exist but have no active frontend caller, caller-controlled folder names, no ownership record/deletion route, and weaker content validation than the dedicated feature endpoints. They should not be treated as a polished customer feature.

Outside the strict Website hero path, optimization is best-effort: conversion failure falls back to storing the original raster, existing WebP may avoid resize, and the 24 MP decoded-pixel ceiling is not universal. The safe product statement is “Zavoia automatically optimizes most raster uploads,” not “every image is always normalized to 1024 px.”

## 7. Consumer marketplace capabilities

### 7.1 Discovery and search — Implemented on current web; substantially implemented on mobile

- Home discovery using current marketplace data.
- Latest businesses and nearby businesses.
- Available-today and curated business discovery surfaces.
- Brand/business collection endpoint and presentation support.
- Industry/category browsing.
- Grouped free-text results: fuzzy location-name results, separate business-name matches, and English/Romanian industry-tag-name resolution with typo/diacritic tolerance.
- Search by industry and one or more venue tags.
- City/neighborhood prefix and trigram-fuzzy search.
- Current-location geolocation.
- Latitude/longitude radius search up to the API maximum of 500 km.
- Date-availability filtering.
- Service and professional constraints at API level when evaluating date availability.
- Map pins, list results, pagination, and bulk listing retrieval.
- Recent searches/recently viewed experiences.
- Per-card next-available date/time hints.
- SEO landing pages by city and industry on the current web product.

Marketplace discovery uses two levels of availability logic:

- `map_point` stores static discovery facts such as coordinates, open-day bitmask, industry/tags, and shortest service duration;
- a 30-day `staff_availability_day` index stores per-staff/location/date largest free gap and earliest free start after working hours, recurring/one-time blocks, appointments, and buffers are applied.

The availability index refreshes incrementally after relevant writes and through a daily sweep. Search uses it for fast candidate filtering and next-available hints; final calendar/slot/booking validation remains authoritative and rechecks live constraints.

When an exact query returns no locations, the backend applies a labeled relaxation ladder so the UI can explain alternatives: remove date, remove soft tags, widen radius to 2×/4× up to 500 km, keep the same industry nearby, then recommend nearby/top-rated results. Text search orders by similarity, then distance or rating; geo-only search orders nearest first; unfiltered results favor rating and recency.

Important discovery boundary: the free-text query does **not** search service names. A service ID can constrain duration/capable-staff availability for a selected date, while text such as “hair salon” works because it resolves to a venue tag. UI copy that implies arbitrary service-name text search is broader than the current query.

Map clients render pins from returned indexed listing/location cards. The `map-tiles` module maintains search/map-point rows; no current custom map-tile-serving endpoint was found.

The native app's featured-business and promotional home sections explicitly call placeholder hooks because their backend endpoints do not yet exist. Those sections are not reliable current capabilities.

The native search filter control also notes that a dedicated filter sheet does not yet exist, and some home-page business cards still contain TODOs for routing into the otherwise implemented listing page.

### 7.2 Marketplace coverage — Implemented taxonomy

The current seed supports 14 broad industries and 77 specific venue types.

| Industry | Examples of venue types |
|---|---|
| Beauty | Hair salon, barbershop, nail salon, makeup artist, brows/lashes, waxing, tanning |
| Spa & Wellness | Day spa, massage, sauna/steam, wellness center, holistic therapy |
| Skin & Aesthetics | Facial/skincare, medical aesthetics, laser/IPL, med spa, permanent makeup, body contouring |
| Tattoo & Piercing | Tattoo, piercing, tattoo removal |
| Health & Medical | Dental, medical specialists, physiotherapy, psychology, nutrition, chiropractic, optometry, laboratory |
| Fitness & Sports | Personal training, gym, yoga/Pilates, martial arts, dance, sports coaching, swimming lessons |
| Pets | Grooming, veterinary, training, boarding/sitting |
| Automotive | Repair/garage, ITP, detailing, tires, body/paint, auto glass |
| Home Services | Cleaning, plumbing, electrical, HVAC, handyman, painting, landscaping, pest control, appliance repair, moving |
| Professional Services | Accounting/tax, law, notary, consulting, financial/insurance, translation |
| Education & Coaching | Tutoring, language/music lessons, driving school, life/career coaching, arts/crafts |
| Events & Creative | Photography, videography, event planning, wedding services |
| Tailoring & Repairs | Tailoring, shoe, watch/jewelry, phone/electronics repair |
| Other | Generic fallback without seeded sub-tags |

Romanian taxonomy translations are included in the canonical seed.

### 7.3 Business and location pages — Implemented on current web

- Featured image and portfolio gallery.
- Business/location name, category, address, and distance.
- Average rating, review count, and review browsing.
- Favorite/save action.
- Share action.
- Services grouped by category.
- Packages with included services and savings.
- Multi-select service/package booking entry.
- Team/professional presentation.
- About information, working hours, contact details, and directions.
- Persistent desktop/mobile booking actions.

### 7.4 Live booking — Implemented

- Select one or more services/packages.
- Choose a location.
- Browse a date calendar and live available slots.
- Select a specific professional per item or let the system use an eligible professional when policy permits.
- Review the selected items, staff, time, duration, and total service price.
- Submit with an idempotency key to avoid duplicate bookings.
- Receive confirmed or pending state based on business policy.
- Create appointment records, notify the business about the marketplace booking, and schedule applicable customer reminders. Immediate customer confirmation is not sent when the booking is created already confirmed; see section 6.20.

The displayed service total is the value expected at the business. No implemented customer Stripe/payment/deposit endpoint was found.

### 7.5 Customer appointments — Implemented on current web and native app

- Upcoming and past appointment list.
- Appointment detail with business, location, service/package, staff, status, notes, and timing.
- Cancel within the business policy window.
- Reschedule against fresh availability within policy.
- Rebook from a past appointment.
- Submit reviews after eligible completed appointments.
- Add to Google Calendar from the current web appointment detail through a prefilled calendar-template URL.
- Add an appointment to the device calendar on native mobile.
- Native detail actions and communication/navigation affordances.

### 7.6 Saved/favorites — Implemented

- Favorite businesses.
- Favorite locations.
- Favorite professionals.
- Grouped saved view in customer products.
- Auth-aware favorite state in public results and details.

### 7.7 Customer account — Implemented

- First/last name, profile image, phone, date of birth, and address fields.
- Change email and password.
- Google link/unlink.
- Notification preferences for marketing and appointment reminders across email, SMS, and push where supported.
- Customer role/account deactivation and role-aware data cleanup.
- Support ticket history and conversation.

The native app's “create password” action for Google-only users is explicitly marked coming soon, even though other password-management flows exist. Editing the address for certain home-visit appointment details is also marked coming soon. Its “Join online” appointment action is a stub because the backend appointment model has no online-meeting-link field.

### 7.8 Consumer notifications — Inbox implemented on native; OS push and current web are partial

- Backend inbox with unread count, mark read, and mark all read.
- Customer Expo push-token registration endpoints and storage.
- Native marketplace inbox with pagination, badges, read state, and appointment deep links.
- User communication preferences.

The native app defines its token-initialization flow but does not invoke it in the audited tree. Existing tokens can receive pushes, but new-install registration is not currently end to end. Appointment inbox creation is also coupled to the push preference/channel. The current Next.js web notification panel contains an explicit TODO to connect it to the customer-notification inbox API. Do not describe customer OS push or the web header inbox as fully live until these paths are wired.

### 7.9 Professional detail on native — Partial

The API supports professional profile, reviews, booking context, and location data, and the mobile repository contains substantial professional/team-member detail components. However, the canonical `app/professional/[id].tsx` route currently renders “Coming Soon.” Consumer-web professional presentation is more complete than this native route.

### 7.10 Consumer support — Implemented

- Authenticated customer tickets and replies.
- Guest support submission.
- Support history inside the web account and native app.
- Internal staff response in the CRM.

## 8. Public website, marketing, content, and SEO

The current `zavoia-web` repository provides:

- bilingual English/Romanian public routes;
- marketplace home and search;
- business detail and booking;
- customer authentication, account, appointments, and saved pages;
- “For Business” and pricing pages;
- help center;
- blog index, category, article, reading-time, and related-article presentation;
- Sanity CMS and embedded Sanity Studio;
- SEO metadata, sitemap, and robots routes;
- city/industry landing pages;
- content revalidation API.

The site positions Zavoia for salons, clinics, fitness, automotive, pet, home-service, professional-service, education, and creative businesses, with a commission-free/pay-at-venue value proposition.

The SEO landing-page implementation is currently narrower than the complete marketplace taxonomy. It pre-renders bilingual combinations for nine Romanian cities—Bucharest, Cluj-Napoca, Timișoara, Iași, Constanța, Brașov, Sibiu, Craiova, and Oradea—and seven beauty/wellness categories: barbers, nail salons, hair salons, beauty salons, massage, spa, and tattoo studios. That produces 126 locale/city/category route combinations with canonical and EN/RO alternate links. The sitemap also includes localized home/blog routes and localized Sanity posts. The other marketplace industries remain discoverable/searchable but do not yet have equivalent static city/industry SEO coverage.

## 9. Internal Zavoia operations CRM

The internal CRM is not a client product, but it is part of the operational SaaS capability.

### 9.1 Business oversight

- List/filter businesses.
- Inspect business profile, team, services, locations, reviews, and marketplace state.
- View and block/unblock marketplace exposure.
- Assign Life Time Deal status.
- Inspect business owners and onboarding/wizard data.

### 9.2 User/security operations

- Inspect customer accounts.
- List and inspect refresh tokens. Dedicated CRM revoke/delete refresh-token endpoints were not found.
- Inspect/revoke/delete verification tokens.
- Admin authentication/session management.

### 9.3 Plans and pricing

- Create, edit, delete, and list plans.
- Configure default Stripe base/seat prices.
- Configure regional country-code price overrides and currency.
- Businesses can choose/change self-serve plans through billing flows. A backend plan-assignment service exists, but the dedicated internal CRM assignment endpoint is commented out and should not be treated as a current operator control.

### 9.4 Taxonomy

- Create/edit/delete industries.
- Create/edit/delete industry venue tags.
- Manage canonical marketplace classification.

### 9.5 Review moderation

- Inspect location/business and professional reviews.
- Manage review visibility.
- Generic review administration endpoints also exist.
- Platform-review approve/reject/delete backend endpoints exist, but no connected current CRM UI was found; the separate CRM reviews page is placeholder content.

### 9.6 Support operations

- List/filter/create tickets.
- View conversations.
- Reply, edit, and delete.
- Work with owner, team-member, customer, and guest-originated support flows.

### 9.7 Invoice operations

- List business and failed invoices.
- View invoice details and failure information.
- Retry failed Oblio invoice creation.
- Inspect/update business fiscal information.

### 9.8 SMS operations

- Create/edit/delete SMS regions.
- Create/edit/delete packages.
- Configure credits, prices, discounts, currency, and activation.

### 9.9 Website-builder catalog operations

- Create/edit/delete website sections.
- Create/edit/delete section variants.
- Configure included/base status, activation, order, descriptions, prices, and regional pricing.
- Manage theme assets through API/catalog data.

### 9.10 Email operations

- List email templates.
- Render previews with sample data.
- Send test emails.

## 10. Commercial model and entitlements

### 10.1 Implemented backend model

The current backend defines:

- **Standard** self-serve tier;
- **Plus** self-serve tier;
- **Custom** internally assigned tier;
- base monthly subscription plus per-team-seat price;
- country-specific regional pricing overrides;
- plan limits with optional per-business overrides;
- website builder enabled for Plus and disabled for Standard/Custom in the current code-level entitlement map;
- Life Time Deal handling with no recurring base subscription and paid extra seats.

The current database seed defines:

| Tier | Seeded maximum locations | Seeded maximum non-owner team members | Website Builder |
|---|---:|---:|---|
| Base / Standard | 5 | 20 | No |
| Plus | 20 | 20 | Yes |
| Custom | Internally configured | Internally configured | Current code says No |

Null plan limits or per-business overrides can represent customized/unlimited allowances. The live Stripe amounts and production database configuration were not audited.

### 10.2 Current public marketing model

The public site currently advertises:

- one `Zavoia Business` plan;
- €20 per bookable member/month in English or 100 RON in Romanian;
- every feature included;
- unlimited locations;
- 14-day no-card trial;
- no commission, setup fee, or contract;
- owner/admin access free;
- billing only for bookable people;
- client/payment exports;
- deposits/no-show protection and payments with daily payouts.

### 10.3 Reconciliation required before using pricing copy as a product contract

The public message and implemented billing model do not currently describe the same product:

| Public promise | Implemented evidence | Status |
|---|---|---|
| One plan, every feature | Standard and Plus are self-serve; Website Builder is Plus-only | **Conflict** |
| Unlimited locations | Current seed limits Standard to 5 and Plus to 20, with overrides possible | **Conflict** |
| Pay only for bookable people; admin/reception free | Backend bills non-owner team seats and does not evidence a “bookable” seat distinction | **Conflict/needs verification** |
| Deposits and no-show protection | Booking policy exists, but no deposit collection/hold mechanism was found | **Unsupported claim** |
| Payments with daily payouts | Consumer payment processing/payout infrastructure was not found | **Unsupported claim** |
| Export client list and booking history | Individual customer-history PDF exists; no bulk client-list or business-wide booking export was found | **Partially supported; public wording is broader than implementation** |
| Help import the client list | No import UI/API was found | **Unsupported claim** |
| VAT invoices every cycle | Oblio invoice generation is implemented; live VAT/Stripe/Oblio configuration still requires operational verification | **Code-supported, production verification needed** |
| No commission/pay at venue | No consumer transaction endpoint was found; venue payment matches implemented booking flow | **Consistent** |

This is the most important product-governance issue found in the audit. Sales, website copy, plan configuration, entitlement code, and Stripe products should be reconciled into one authoritative commercial definition.

## 11. Integrations and platform capabilities

### 11.1 Data and search

- PostgreSQL through TypeORM.
- PostGIS/geospatial marketplace search and map indexing.
- Fuzzy location/business/tag/city search, radius filters, progressive fallback recommendations, availability filters, next-available hints, and pagination.
- A precomputed 30-day per-staff availability index maintained incrementally and by daily sweep, with authoritative live slot/booking revalidation.
- Snapshot-based appointment history so later catalog changes do not rewrite past bookings.
- Multi-tenant business scoping across operational records.

### 11.2 Maps and location

- Mapbox in business and consumer surfaces.
- Map/geocoding abstraction and structured address coordinates.
- Current-location discovery on supported devices.
- Search/location-card data supplies map pins; no custom Zavoia tile-serving endpoint is currently active.

### 11.3 Storage and media

- Cloudflare R2 through the S3-compatible SDK, public URL construction, UUID keys, object metadata, existence/download/delete/bulk-delete helpers, and an unused signed-read helper.
- Server-side SVG sanitization, raster signature/decoder checks where applicable, EXIF orientation, aspect-preserving resize, WebP quality-80 conversion, and metadata removal.
- Business logos, customer/team avatars, professional portfolios, 16-image location galleries with featured selection, Website hero/gallery references, and account/location cleanup paths.
- Sanity's separate hotspot/responsive image pipeline for blog/editorial media.

See section 6.26 for the path-specific differences; validation, decoded-pixel limits, transactional replacement, and cleanup are not uniform across every endpoint.

### 11.4 Billing and invoicing

- Stripe Checkout, subscriptions, portal, invoices, proration, schedules, webhooks, and one-time purchases.
- Oblio invoice generation, record keeping, PDF links, VAT-rule calculation, notifications, and retries.
- Regional plan/SMS/catalog pricing data structures.

### 11.5 Messaging

- AWS SES v2 email infrastructure.
- Google Cloud Tasks for scheduled reminders/jobs.
- Twilio SMS.
- Firebase Admin and Expo-compatible push delivery.
- Separate customer/business in-app inbox records and appointment event/per-channel delivery records.
- Internal jobs/webhooks for reminder dispatch, availability sweeps, end-of-day appointment handling, trial reminders/expiry, and seat-mismatch checks.
- SES hard-bounce/complaint suppression and SMS credit/usage accounting.

Provider integration does not imply universal provider-confirmed delivery or retry: appointment failures currently have no backoff worker, Twilio acceptance is treated as sent, Expo receipts are not polled, and customer new-install push registration is not connected.

### 11.6 Native mobile

- Capacitor iOS/Android shell for the business dashboard.
- Expo/React Native consumer application for iOS/Android.
- Native push, haptics, keyboard/preferences, media/image picker, location, map, calendar integration, and sharing/downloading where used.
- Current consumer web can create a prefilled Google Calendar event; native consumer detail uses device-calendar integration. No `.ics` generation/attachment or two-way external-calendar synchronization flow was found despite the appointment `icalSequence` groundwork field.

### 11.7 Observability and operations

- Structured Pino logging.
- Trace/correlation integration.
- Health and database checks.
- Swagger/OpenAPI support.
- Webhook idempotency and booking idempotency controls.

## 12. Security, privacy, and reliability controls found

- JWT access and refresh-token strategies for business, customer, and internal-admin contexts.
- Refresh-token tracking/revocation and CSRF tokens.
- Google identity verification and controlled account-linking.
- Role and subscription guards.
- Rate-limit guards for login, registration, search, booking, email, linking, and guest support paths.
- Tenant-aware service queries and role-scoped dashboard/calendar results.
- Idempotent consumer booking and Stripe webhook fulfillment.
- Audit logging for security and operational actions.
- Account deletion and role-aware orphan cleanup.
- GDPR-conscious customer merging that avoids overwriting the global consumer identity with business-local fields.
- Untrusted upload file-size/type/signature defenses and SVG sanitization, with strict decoded-pixel/animation defenses on Website hero media.

Important code-level hardening gaps:

- rate limiting is in-memory/per application instance, with comments recommending Redis for multi-instance accuracy;
- pending Google-link transactions are in-memory with a Redis/database recommendation;
- sensitive reauthentication proofs are an in-memory development/local placeholder;
- several rate-limit annotations in authentication/admin code are commented out;
- email sending remains synchronous and appointment delivery failures have no queue/retry/backoff recovery;
- the separate internal email-preview/test controller has its admin guard commented out, unlike the guarded main CRM controller;
- wizard completion accepts a client-supplied logo storage key, copies it, and deletes the source without verifying that it belongs to the authenticated owner's `wizard-drafts/{ownerUuid}` prefix. This is a high-severity cross-tenant object ownership risk in static review;
- generic upload endpoints let an authenticated caller select the folder, create no ownership record, provide no paired deletion route, and contain MIME/extension/signature bypasses. No active frontend caller was found, but the endpoints remain exposed code paths;
- only Website hero and location portfolio paths set Multer's pre-buffer size limit; several other endpoints reject oversize input only after the request has been buffered;
- business/team/customer image replacement often deletes the old object before a new upload/database save is secure, and some self-deletion paths can orphan professional portfolio objects;
- calendar-block customer visibility fields are not enforced consistently: an internal all-day block title can be returned to public booking UI as a disabled-date reason;
- appointment-notification uniqueness, terminal-status comparison, and task-acknowledgement behavior create the repeat-event and no-retry reliability gaps described in section 6.20.

These do not erase the implemented controls, but they should be resolved or deployment-verified before representing the platform as horizontally hardened.

## 13. Localization and accessibility

- Core business dashboard and current public web include English and Romanian UI/content.
- Email templates contain English/Romanian localization paths; business push also has translation data.
- Industry and industry-tag seeds include Romanian translations.
- Business timezone is carried through scheduling and reminders.
- Venue spoken-language metadata supports 27 languages.
- UI components use established accessible primitives in many dashboard areas.

Limitations found:

- 27 venue languages do not mean 27 localized applications; the audited product UI is primarily English/Romanian.
- Appointment SMS, customer push, and persisted inbox copy are currently English. Business FCM currently resolves English despite its translation data.
- The deferred email audit identifies two CTA colors that fail WCAG AA contrast and calls for an accessibility pass.
- The business-dashboard Terms, Privacy, and Cookies routes explicitly display a notice saying the legal copy is placeholder content.

## 14. Explicitly partial, planned, or not evidenced

The following must not be presented as fully shipped without additional evidence:

1. **Public website-builder rendering:** editor/backend/purchases/publish snapshot exist; the `zavoia-web` renderer is the product owner's next planned implementation, not a current public surface.
2. **Consumer payments, deposits, and payouts:** not found; consumer booking is pay-at-venue/direct-to-business.
3. **Bulk customer and appointment export:** individual customer-history PDF is implemented; client-list and business-wide booking export are not.
4. **Customer import:** public copy mentions help importing, but no product workflow was found.
5. **Unified one-plan pricing:** contradicted by Standard/Plus/Custom backend architecture.
6. **Unlimited locations:** contradicted by the current Base/Plus seed limits, except where manually overridden.
7. **Bookable-only seat billing:** backend seat accounting appears based on non-owner team members, not a bookable flag.
8. **Customer notification delivery:** native inbox exists, but new-install Expo token initialization is not called, inbox creation is coupled to the push channel, and the current web panel is not wired.
9. **Native professional canonical route:** currently “Coming Soon.”
10. **Native featured/promotional feeds:** placeholder hooks awaiting backend endpoints.
11. **Native search filters and selected home-card routing:** dedicated filter sheet and some business-page transitions are still TODO.
12. **Native Google-only create-password flow:** explicitly coming soon.
13. **Native home/online appointment extras:** home-visit address editing is coming soon; online meeting link/action has no backend field and is stubbed.
14. **Recurring appointment series:** schema/read-only display groundwork exists, but creation, cadence/count/end rules, series mutation, and complete customer presentation do not. Current Help Centre series copy is ahead of the product.
15. **Granular custom staff permissions:** role-map only; backend-driven permissions are future work.
16. **Calendar-block occurrence exceptions/customer messaging:** recurring blocks work, but there is no single/future-occurrence edit; visibility/message fields are unexposed and an internal all-day title can leak to disabled-date UI.
17. **Romanian e-Factura/ANAF status:** Oblio invoicing exists; direct submission/status tracking was not evidenced.
18. **Final legal copy in business dashboard:** routes currently identify their own content as placeholder.
19. **Global/distributed rate limiting and reauth/link state:** current in-memory implementations need production hardening.
20. **Uniformly reliable automated communication:** initial already-confirmed bookings get no confirmation; reminder recreation/repeat events collide; failed channels are not retried; cancellation method selection is ignored; terminal-status race protection is broken.
21. **Marketing automation/unsubscribe workflow:** marketing preferences are stored, but no campaign sender or one-click unsubscribe endpoint/header flow was found.
22. **Zavoia platform-review user/CRM flow:** persistence and APIs exist, but no current customer submission or connected moderation UI was found.
23. **External calendar sync/`.ics`:** web Google Calendar and native device-calendar actions exist; `.ics` generation/attachment and two-way synchronization do not.
24. **Full-taxonomy city SEO:** current static SEO routes cover nine cities and seven beauty/wellness categories, not all 14 marketplace industries/77 venue types.
25. **Uniform/private image pipeline:** most uploads are public, optimization/decoded-pixel enforcement is path-specific, and replacement/cleanup is not universally transactional.
26. **Internal operator controls implied by backend services:** the plan-assignment service and platform-review admin endpoints are not connected to complete current CRM UI; refresh tokens are list-only in CRM.
27. **Older `marketplace` application:** business detail, location/category results, booking confirmation, profile, blog, pricing pages contain demo/hard-coded content; it is not a trustworthy source of current product promises.

## 15. Safe current product statement

Based on the implemented evidence, a defensible product description is:

> Zavoia is a commission-free appointment marketplace and operating platform for service businesses. Businesses manage locations, services and packages, team availability, appointments, customers, reviews, reminders, marketplace visibility, analytics, subscriptions, and communications from one system. Customers discover businesses by category and location, compare services and professionals, book live availability, manage appointments, save favorites, and leave verified reviews on web and mobile. Clients pay the business directly; Zavoia monetizes the business software through subscriptions and optional operational/design purchases.

Until the highlighted mismatches are resolved, avoid adding “one plan,” “every feature,” “unlimited locations,” “deposits,” “daily payouts,” “bulk exports,” “recurring bookings,” “every booking receives an immediate confirmation,” “marketing automation,” or “live custom website” to contractual or sales claims.

## 16. Audit source index

### `admin-api`

Audited source areas include authentication, users, wizard onboarding, business, locations, assignments, services, categories, bundles, team, team-member accounts, staff schedules, appointments, calendar, calendar blocks and recurrence expansion, business customers, dashboard analytics, availability indexing, map-point discovery/search relaxation, marketplace listing/public search/booking, customer appointments/auth/profile/favorites/notifications/support, reviews, platform reviews, billing/plans, SMS, Oblio, Website Builder/variants/published media snapshots, R2 uploads/cleanup, SES/Twilio/Expo/FCM communication, Cloud Tasks, webhooks, entities, migrations, canonical seed files, and product API documents.

### `admin-dashboard`

Audited routes and feature areas include setup, dashboard, calendar/blocks/preferences, locations, services/bundles, assignments, team members/offboarding, customers and history PDF generation, marketplace listing/location imagery, reviews, Website Builder/media selection, notifications/push, support, business/account/billing/SMS settings, personal assignments/profile/portfolio/reviews/account, native Capacitor configuration, permissions, localization, and legal pages.

### `admin-crm`

Audited business, owner, customer, plan, industry/tag, review, platform-review, ticket, invoice, SMS, email-test, website-section/variant, refresh-token, and verification-token areas, plus their API contracts.

### `zavoia-web`

Audited home/search/map and search fallback presentation, city/industry SEO coverage, business details/media, booking, authentication, account/avatar, appointments/Google Calendar/recurring note, saved items, support, notification placeholder, pricing/for-business marketing, Help Centre claims, blog/Sanity imagery, sitemap/robots, and localization.

### `marketplace-app`

Audited home/search/map, listing/media viewer, booking components, appointments/detail/device-calendar/actions/reviews/recurring view-model, saved items, account/security/preferences/avatar crop, notification inbox/token initialization, support, professional routes/components, native location/media/push behavior, and explicit TODO/placeholder paths.

### `marketplace`

Audited routing, authentication/account linking, listing API, and representative business, location/category, booking, profile, blog, pricing, and legal pages. It was classified as an older prototype/parallel surface because material pages are demo-driven and its latest commit predates the other active consumer work.

### 16.1 Second-pass evidence anchors

Paths below are relative to `/home/ted/zavoia`. They identify the principal implementation chain used to resolve the challenged findings; they are not the only files reviewed.

| Finding | Principal evidence chain |
|---|---|
| Recurring appointments | `admin-api/src/entities/appointment.entity.ts`; business create/group/update DTOs and `admin-api/src/modules/appointment/appointment.controller.ts`; `admin-api/src/modules/marketplace/appointments/dto/create-booking.dto.ts`; `admin-dashboard/src/features/calendar/components/AddAppointmentSlider.tsx`; `zavoia-web/src/app/[locale]/appointments/[uuid]/_components/sections.tsx`; `marketplace-app/features/appointments/view-model.ts` |
| Recurring calendar blocks | `admin-api/src/entities/calendarBlock.entity.ts`; `admin-api/src/modules/calendar-block/` DTO/controller/service; `admin-api/src/modules/calendar/calendar.service.ts`; `admin-dashboard/src/features/calendar/components/CreateBlockDrawer.tsx`; calendar API/saga and desktop/mobile block presentation components |
| Email/SMS/push/inbox automation | `admin-api/src/email/email.service.ts`; `admin-api/src/modules/sms/sms.service.ts`; `admin-api/src/modules/notifications/reminder.service.ts`; `admin-api/src/modules/notifications/cloud-tasks.service.ts`; notification event/delivery entities; customer/business push and inbox services; `marketplace-app/providers/push-notification-provider.tsx`; `zavoia-web/src/components/shell/notif-panel.tsx` |
| Website Builder and media | `admin-api/src/modules/website-builder/`; `admin-api/src/modules/upload/upload.service.ts` and `upload.config.ts`; listing/location/professional/customer media services; `admin-dashboard/src/features/website/`; marketplace and profile upload components; Sanity image schemas/helpers in `zavoia-web` |
| Customer PDF and discovery rescan | `admin-dashboard/src/features/customers/buildCustomerHistoryPdf.ts`; `CustomerHistorySlider.tsx`; `admin-api/src/modules/marketplace/public/marketplace-public.service.ts`; `dto/search-marketplace.dto.ts`; `admin-api/src/modules/availability/availability-index.service.ts`; `admin-api/src/modules/map-tiles/map-point.service.ts` |

## 17. Recommended source-of-truth hierarchy

For future product decisions, use this order:

1. current API entities, guards, controllers, and services for domain behavior;
2. current business/consumer UI wired to those APIs for actual user availability;
3. current database migrations and canonical seeds for catalog/entitlement defaults;
4. operational docs updated after the relevant implementation;
5. public marketing copy only after it has been reconciled with items 1–4.

This hierarchy prevents older plans, prototypes, placeholder pages, and aspirational copy from being mistaken for shipped product functionality.

## 18. Updated implementation plan from the second audit

This is a forward plan derived from the audit findings and product-owner priorities, not a statement of shipped capability.

### 18.1 Next product delivery — public Website Builder renderer in `zavoia-web`

This is the next implementation item explicitly supplied by the product owner.

1. Add a public, read-only API contract that resolves an eligible published Website by stable public identity and returns only the frozen published snapshot—not the mutable draft.
2. Define unlisted, hidden, blocked, unsubscribed, unpublished, and missing-snapshot behavior before exposing the route.
3. Implement the 12-section/47-variant snapshot renderer in `zavoia-web`, preserving section order, required sections, theme/font ownership, responsive behavior, bilingual overrides, and frozen media references.
4. Reuse or extract the dashboard preview's canonical schema/rendering logic so public output does not drift from the authoring preview.
5. Add public metadata, canonical/alternate URLs, structured SEO data, sitemap strategy, and cache/revalidation behavior.
6. Handle publish replacement and unpublish immediately without breaking media still referenced by the previous public snapshot.
7. Verify desktop/mobile accessibility, performance, media failures, all included/premium variants, and standard marketplace-page coexistence before selling “live custom website.”

### 18.2 Communication correctness before stronger automation claims

1. Redesign appointment-event uniqueness so a reminder can be rescheduled and repeated event types have explicit occurrence/idempotency keys.
2. Send confirmation for appointments created already confirmed, or change copy/product policy deliberately if that is not intended.
3. Fix lowercase terminal-status checks and honor the cancellation email/SMS/both selection.
4. Add retry/backoff, stuck-processing recovery, and task-scheduling reconciliation; separate transport acceptance from confirmed delivery where providers support it.
5. Re-read current preferences/contact/subscription state at send or document exactly which fields intentionally remain snapshotted.
6. Decouple persisted customer inbox rows from OS push preference/token presence.
7. Invoke native customer token initialization, wire the `zavoia-web` inbox, and align review deep links with the real app scheme/routes.
8. Localize SMS, push, and stored inbox copy, then implement marketing send/unsubscribe only if marketing automation is actually in scope.

### 18.3 Media/security hardening

1. Require wizard-logo keys to belong to the authenticated owner's draft prefix and never delete a caller-supplied cross-tenant key.
2. Remove unused generic upload routes or add strict role, folder allowlists, ownership records, full magic/decoder checks, paired deletion, and rollback.
3. Apply pre-buffer request limits and decoded-pixel/animation defenses consistently to every raster path.
4. Make logo/avatar replacement upload-first and transactional; add reconciliation for orphaned objects and professional self-deletion.
5. Enforce the professional portfolio maximum server-side and fix path-specific duplicate/concurrency gaps.
6. Decide whether universal 1024-pixel normalization is desired; if so, include existing WebP and remove best-effort original fallback.
7. Fix calendar-block title exposure before internal notes are used routinely.

### 18.4 Recurring appointments, if they remain a product requirement

Do not treat the three existing metadata columns as a finished foundation. A complete design needs:

1. recurrence rule/cadence, interval, weekdays/month-day, timezone, start, count/end date, and total-occurrence contract;
2. transactional series creation with conflict/availability validation for every occurrence;
3. clear handling for partial conflicts, overrides, pricing/staff snapshots, and idempotent retries;
4. business and customer creation UX;
5. “this occurrence,” “this and future,” and “whole series” edit/cancel semantics;
6. series-aware reminders, notifications, reviews, rebooking, and customer detail/timeline data;
7. public Help Centre copy only after the implemented behavior matches it.

### 18.5 Product-contract reconciliation

1. Align public pricing with Standard/Plus/Custom tiers, location limits, and actual seat accounting.
2. Remove or implement deposits, consumer payments/payouts, client import, and bulk exports.
3. Change “export booking history” copy to the implemented individual customer PDF unless bulk export is built.
4. Expand city/industry SEO deliberately beyond the current nine-city/seven-category matrix if full-taxonomy coverage is a goal.
5. Finish legal copy and document communication consent/legal basis before stronger compliance claims.
