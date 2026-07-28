# Zavoia — Consumer-Law & Compliance Audit

**Date:** 22 July 2026
**Scope:** verification of the prior AI-assisted legal research (OUG 34/2014, OUG 18/2026, EU directives) against (a) the official legal texts and (b) the actual code in all repos under `/home/ted/zavoia`.
**Method:** three tracks — ① every legal claim re-verified against official sources only (Portal Legislativ / EUR-Lex / ANPC / gov.ro; no blogs used as authority); ② every code claim re-verified by independent agents **and** personally reproduced by direct file reads/greps; ③ peer-practice research on how large EU SaaS/marketplaces handle the same obligations, from their own live legal pages.
**Companion doc:** [ZAVOIA_PRODUCT_CAPABILITIES_AUDIT.md](./ZAVOIA_PRODUCT_CAPABILITIES_AUDIT.md) (what the product actually does).

---

## 0. Verdict on the prior research

The prior AI's research is **substantially accurate**. All of its major legal claims check out against the official texts, and all of its major code claims reproduce. Its final framing is also correct: the Dashboard subscriber is a **professional** buying business software (even as an individual with a personal card), and the only true "consumers" in the system are Marketplace customers — plus, potentially, a Dashboard buyer who genuinely purchases outside any trade or profession.

However, it made a number of errors and imprecisions that matter (Section 2), and it missed several items (Legea 365/2002 identity obligations, the soft opt-in rule in Legea 506/2004, the fact that the review/ranking transparency rules have been in force **since May 2022**, and the fact that the withdrawal-function deadline of **19 June 2026 has already passed**).

**The two dates that govern priorities:**

| Deadline | Obligation | Status |
|---|---|---|
| **19 June 2026** | Online withdrawal function (OUG 34/2014 art. 11¹) for online contracts with a statutory withdrawal right; payment-surcharge cap (art. 19¹) | In force. Attaches only where a booking concludes a **binding distance contract with a payment undertaking** and no exemption applies. Whether Zavoia bookings do that is currently **ambiguous** — the intended model is non-binding, but the UI says "Confirm booking"/"You're booked" with an exact Total and no terms exist to define anything. See §4.2.8: align terms + UI + operations on the non-binding model and get counsel sign-off before relying on it |
| **27 September 2026** | Environmental/durability-practice bans (Legea 363/2007 Annex 1 pts. 28–39 — social/ownership claims stay under the general misleading rules); software-update/digital-service info duties (OUG 34/2014 art. 6(1) l²–l³, art. 4(1) e⁴) | ~2 months away |

Everything else flagged (marketplace transparency, review verification, trader identity, e-commerce identity pages, marketing opt-in) has been binding law for years — those are not "new OUG 18 items," they are existing exposure.

---

## 1. Legal framework — verified against official sources

### 1.1 OUG 18/2026 — confirmed

Real, published in **M.Of. 236 of 26 March 2026** (issued 19 March 2026). Official text: [Portal Legislativ, doc 308474](https://legislatie.just.ro/Public/DetaliiDocument/308474); [Nota de fundamentare, gov.ro](https://gov.ro/ro/guvernul/procesul-legislativ/note-de-fundamentare/nota-de-fundamentare-oug-nr-18-19-03-2026&page=1). It amends **Legea 363/2007** (unfair practices) and **OUG 34/2014** (consumer rights) and transposes:

- **Directive (EU) 2023/2673** ([EUR-Lex](https://eur-lex.europa.eu/eli/dir/2023/2673/oj/eng)) — distance financial services, **plus** the new withdrawal function inserted as CRD art. 11a. Verified verbatim: the function applies to **all distance contracts concluded through an online interface where a withdrawal right exists** — not only financial services. Applies from **19 June 2026** (OUG 18/2026 art. IV(1)).
- **Directive (EU) 2024/825** ([EUR-Lex](https://eur-lex.europa.eu/eli/dir/2024/825/oj/eng)) — green transition / anti-greenwashing. Applies from **27 September 2026** (OUG 18/2026 art. IV(2)).

### 1.2 The withdrawal function — OUG 34/2014 art. 11¹ (verified verbatim)

Where a statutory withdrawal right exists for an online-concluded contract, the trader must provide a withdrawal **function** that is:

1. continuously available during the whole withdrawal period, easily accessible, visible;
2. labelled **„Retrageți-vă din contract aici"** / "withdraw from contract here" or an equally unambiguous formulation;
3. backed by an online statement form collecting: consumer name, contract identifier, electronic channel for the confirmation;
4. completed via a separate confirmation action;
5. followed **without undue delay** by an acknowledgement of receipt on a **durable medium** including the statement's content and the date/time of submission.

A normal "Cancel appointment" flow with business-defined windows and fees is **not** this function.

### 1.3 OUG 34/2014 core provisions (consolidated text verified)

- **Consumer** (art. 2, via OG 21/1992 art. 2 pt. 2): natural person acting **outside** trade/industrial/craft/liberal-professional activity. The card used, the invoice name, and having/not having an SRL are all irrelevant; **purpose** decides. A solo operator running their services through the Dashboard acts professionally.
- **Healthcare excluded** (art. 3(3) lit. b): contracts for health services provided **by medical professionals** to patients are outside OUG 34 entirely.
- **Withdrawal exemptions** (art. 16): lit. a) service fully performed with express consent + acknowledgment of losing the right; **lit. l)** — accommodation (non-residential), goods transport, car rental, catering, or **services related to leisure activities, if the contract provides a specific date or period of performance**. Ordinary beauty/tutoring/home/professional services are **not** automatically exempt — classification per category is required.
- **Marketplace duties** (art. 6¹, in force since **OUG 58/2022**, i.e. May 2022): must disclose (a) main ranking parameters, (b) whether the third-party supplier is a trader (based on the supplier's own declaration), and (c) if not a trader, that consumer-protection rights do not apply to that contract.
- **New info duties** (from OUG 18/2026, apply 27 Sep 2026): art. 6(1) l²–l³ / art. 4(1) e⁴ — statutory conformity guarantee for digital content/services (the guarantee itself comes from **OUG 141/2021**, transposing Directive 2019/770, in force since 1 Jan 2022) and minimum software-update support period where the provider makes it available.
- **Payment surcharges** (art. 19¹, applies since 19 June 2026): fees charged to consumers for a payment method may not exceed the trader's own cost. Note: this is not substantively new — OUG 34/2014 art. 19 has contained the same cost-based cap since 2014; art. 19¹ restates/refines it. No Zavoia flow currently surcharges consumers.

### 1.4 Legea 363/2007 — green/social claims and reviews

- **OUG 18/2026 adds points 28–39 to Annex 1** (blacklisted practices — the prior research said "28–34", which is wrong). Verified against the official text; the additions include: generic environmental claims without demonstrable recognised excellent environmental performance; sustainability labels not based on a certification scheme or established by public authorities; environmental claims about the whole product/business when they concern only one aspect/activity; offsetting-based neutrality claims; presenting legally-required characteristics as distinctive; withholding that a software update negatively affects the product; presenting an update as necessary when it only enhances features; premature-consumables inducement; durability/repairability misrepresentations.
- **Review rules (since OUG 58/2022, May 2022, not new):** a trader who says reviews come from real consumers must take reasonable, proportionate steps to verify it, and must tell consumers **how** reviews are verified. Fake/commissioned reviews are blacklisted.
- **Ranking:** paid ranking must be disclosed; search-ranking main parameters must be available to consumers (this consumer-facing duty lives in OUG 34/2014 art. 6¹ + Legea 363/2007 — **not** in the P2B Regulation, see §2).

### 1.5 Other binding law the prior research under-covered

- **Legea 365/2002 (e-commerce), art. 5:** every service provider must give easy, direct, permanent, free access to: name, HQ/domicile, contact (phone/email), trade-registry number, fiscal code, plus VAT-status info. This is why the **fabricated "Marketplace App Ltd." company page and the missing company-details pages are violations today**, independent of consumer law.
- **Legea 506/2004, art. 12 (ePrivacy):** commercial communications by email/SMS/automated means require **prior express opt-in**. One exception (soft opt-in): addresses obtained from an actual sale may be used for **similar** products/services with a free, simple opt-out offered at collection and in every message. Defaulting `marketing* = true` at registration satisfies neither branch.
- **e-Factura B2C — corrected citation: OUG 120/2021 art. 10¹ (as amended by OUG 69/2024 and OUG 89/2025; ANAF guidance):** for B2C invoices, where the natural person supplies no CNP/fiscal code, the dedicated field is completed with the 13-zeros code. **"Never ask for CNP" is Zavoia's data-minimization choice, not the statutory rule** — the law permits invoicing without it; note an individual professional (PFA) has a CUI/CIF and is a different case. (Final field requirements → accountant; Oblio handles e-Factura forwarding, no direct ANAF integration in code — verified.)
- **ANPC / SAL / SOL (verified on anpc.ro):** the EU ODR ("SOL") platform was **abolished** — Regulation (EU) 2024/3228, decommissioned 20 July 2025. Do **not** link it. Current requirement (Ordin ANPC 449/2022, updated 2026 — Ordin 270/2026): display the **SAL pictogram, 250×50 px, linked to `https://reclamatiisal.anpc.ro`**; assets downloadable from anpc.ro. Standard practice (see peer section) is an ANPC link plus the SAL pictogram in the footer of every consumer-facing page.

---

## 2. Corrections to the prior AI research

Things the other AI got wrong or imprecise — **these were re-checked, not assumed**:

1. **Annex 1 additions are points 28–39, not "28–34".**
2. **Wrong legal basis for consumer-facing ranking disclosure.** It cited the P2B Regulation (2019/1150). P2B governs transparency **toward business users** (our providers). The consumer-facing duty to disclose main ranking parameters is OUG 34/2014 art. 6¹ + Legea 363/2007 (Omnibus, transposed by OUG 58/2022). Both apply to us — but to different audiences.
3. **Native `PolicyDisclosure` claim partially wrong.** It claimed the app "always presents a 24-hour free-cancellation promise and does not consume the allow/window flags." In fact the component **consumes real backend hours** (`cancellationHours` from the calendar API; 24 h is only the fallback), and the post-booking "My bookings" UI fully honours `allowCustomerCancellation`. The real defect is narrower: the **booking-flow API response omits `allowCustomerCancellation`**, so pre-booking copy can promise a cancellation window for a business that disabled customer cancellation entirely ([customer-booking.service.ts:132-139](/home/ted/zavoia/admin-api/src/modules/marketplace/customer/customer-booking.service.ts)).
4. **Web cancel-modal claim needs nuance.** The `?? 1440` fallback is practically unreachable (the API always sends the field, defaulting 0). The real defect: [cancel-modal.tsx](/home/ted/zavoia/zavoia-web/src/app/[locale]/appointments/_components/actions/cancel-modal.tsx) shows *"You're within the free window — cancelling now costs nothing"* **unconditionally**, without computing time-remaining vs the window — the backend may then reject the very cancellation the UI just called free.
5. **The web pre-booking step is better than implied.** `BookingDrawer`'s review step computes **real** cancellation/reschedule deadlines from the actual policy ("never a fabricated fallback window" — its own comment) and shows an explicit pay-at-venue note. The fabricated-window problem exists only post-booking (item 4).
6. **Cookie-consent urgency was overstated.** Verified in **source**: no named analytics/tracking SDKs found in admin-dashboard or zavoia-web (no GA/gtag/PostHog/Sentry/Hotjar/pixels; deps + entry points checked). Google sign-in is a redirect, not an embedded script. The only third-party runtime load found is **Mapbox GL on `/search`** (functional). Static inspection cannot prove "no tracking at all" — a deployed-site network/cookie/storage audit remains required (gate 14 in the blueprint). Today's gap is a missing cookie *notice/policy* and a consent gate to add **before** any marketing/analytics tech is introduced — not a proven unlawful-tracking problem.
7. **Sustainability/ownership tags are not consumer-visible anywhere — including the published website snapshot.** The prior research implied the Website-Builder read model (`valueTagIds`) was close to exposure. Verified: that field feeds an **authenticated builder-readiness check only**, and the published snapshot object **explicitly excludes** all tag IDs. The claims-governance work is therefore a **release gate** before any future exposure (and a UCPD-hygiene item for the dashboard UI itself), not a live violation.
8. **A customer cancellation email template exists** (`AppointmentCancellation.ts` + `sendCancellationNotification`) — but it is wired only to **business-initiated** dashboard cancellation. Customer self-cancel sends the customer nothing. The other AI said "no durable receipt" without noting the template exists and simply isn't hooked up — a materially easier fix.
9. **Several line-number citations were off** (e.g. the register checkbox is at `register-form.tsx:263-293`, not 74; the Google button at 313, not 263; placeholder notice at `legal-page.tsx:44-47`). Substance unaffected.
10. Its self-correction that a "Dashboard consumer" barely exists was **right**: the Dashboard is professional SaaS. The mixed-B2C/B2B design applies to **billing identity** (person vs company invoice), not to consumer-law classification.

### 2b. Round-2 corrections — accepted from the counter-review (23 Jul 2026, each independently re-verified)

A counter-review of this document challenged several conclusions. After re-verification against code and legal texts, the following were **accepted and folded in**:

1. **Booking classification reopened (the big one).** Round 1 treated the non-binding reservation model as available by declaration. CRD Recital 20 (verified verbatim) supports a mere appointment *request* being outside the distance-contract notion, but a **binding reservation** is likely inside, and contract formation is **national law** decided on objective intent — not on what terms declare. The current UI ("Confirm booking", "You're booked", exact Total, auto-confirm) conflicts with the intended non-binding model. §4.2.8 rewritten; art. 6(1)(k) reclassified from "required" to "voluntary clarity" in the no-contract scenario; counsel sign-off made a gate.
2. **Treatwell overgeneralized:** its non-binding carve-out covers only the embedded-widget pay-at-venue flow; its main prepaid bookings are binding. §5.2 takeaway corrected.
3. **`isVerified` misattributed:** it exists only on the legacy CRM `review` entity; the live `BusinessReview`/`ProfessionalReview` have no verification field. W8 corrected.
4. **"Unlimited bookings & clients" is true** (plan limits = locations + team members only) and was wrongly listed as misleading. Removed from D12; three *stronger* verified discrepancies added instead ("whole price" vs paid add-ons; 25-member calculator vs 20-member cap; export claim).
5. **`autoConfirmBookings` is server-side only** — the pre-submit wording split needs an API change. §4.2.4 corrected.
6. **New finding A7:** confirmation/cancellation emails are gated by the reminder preference + business email toggle — contract-essential messages must be decoupled.
7. **Surcharge cap not new** — art. 19 has said the same since 2014.
8. **Method honesty:** findings describe current working trees; production deploy-state was not separately audited — "live violation" wording qualified.
9. **Scope gaps** (GDPR, P2B provider-side, DSA, DAC7, EAA, e-contracting formalities, and the customer-account digital-service analysis) acknowledged — added as §4.6.
10. **Professional-use clause is evidence, not a waiver:** a genuinely private-purpose buyer would keep mandatory consumer rights despite the clause; the clause shifts facts/burden and deters, which is why peers use it. (For SMS credits/website variants the professional purpose is inherent in the product, so the point is academic there.)

**Challenged but NOT accepted** (already present or inaccurate in the counter-review): the native cancellation-disclosure gap was already finding N4; the per-category leisure-exemption caution was already in §5.3; W5 always said *legal* identity is omitted (display name/contact were never claimed missing); P2B was cited in round 1 (§2.2) as provider-facing — the accepted correction is that its provider-side duties belong in scope (§4.6), not that it was absent.

### 2c. Round 3 (counter-review of the terms blueprint, 23 Jul 2026) — accepted after re-verification

- **Legea 158/2008** (misleading/comparative advertising, Dir. 2006/114) — not Legea 363/2007 — is the correct basis for **B2B-facing** advertising claims; applies to the D12 pricing-page items aimed at business buyers (consumer-facing claims like W3 stay under L363/2007).
- **New code finding:** `GET /check-team-invitation` **auto-accepts** an invitation for an existing active user on merely opening the link — side-effecting GET, no explicit act, no terms ([auth.controller.ts:~1596](/home/ted/zavoia/admin-api/src/modules/auth/auth.controller.ts)).
- **New code finding:** the CUSTOMER role can be granted to an existing business account later via the `confirm_enable_marketplace` flow — marketplace-terms acceptance must trigger at **role enablement**, not only signup.
- Ownership/social tags are governed by the **general misleading-practice rules**, not Annex 1 pts. 28–39 (those additions are environmental/durability practices); `women-owned` is not art. 9 GDPR data by itself (`lgbtq-owned`/`disability-owned` can be).
- P2B content list expanded (arts. 3(1)(d)–(e), 3(2) longer notice, 4 restriction/reinstatement, 6 ancillary, 10 different-conditions), and the small-enterprise exemption downgraded to "expected, **unconfirmed**" pending actual headcount/turnover/linked-enterprise evidence.
- The B2B contracting party is the **workspace customer** (entity or individual professional); the owner accepts as representative.
- Full revision detail: [ZAVOIA_TERMS_BLUEPRINT.md](./ZAVOIA_TERMS_BLUEPRINT.md) §E (blueprint retitled to "Working Terms Architecture" — its conclusions are tagged REQ/COND/DEC/IMPL rather than presented as uniformly settled).

### 2d. Round 4 (23 Jul 2026) — accepted after re-verification

- **SaaS Agreement binds at workspace creation/trial activation, not signup** — verified: registration creates user + BusinessOwner with no workspace; the business (and 14-day trial) is created at wizard completion. Account/AUP terms are what bind at signup.
- **Legea 50/2024 art. 5 (verified):** Romanian intermediary-service providers must **notify ANCOM within 45 days** of starting the service (pre-existing providers: clock runs from ANCOM's secondary legislation; data changes notified within 10 days). New assessment gate — current task, not a growth task.
- **P2B art. 3(5) (verified verbatim):** the provider's identity must be *clearly visible* on the platform — provider-identity display is mandatory **independent of the booking classification**.
- **Ranking is per-surface, not one formula** — verified: homepage "latest" uses newest-first; other rails use review-count/name/rating orderings distinct from the search formula. Disclosure must inventory each ranked surface.
- **Health-data risk added (the largest art. 9 exposure):** bookings with psychology/medical/dental/physio/lab venues can reveal or imply customer health data — dedicated GDPR assessment (basis, access scoping, retention, notification contents).
- **Testimonials:** named individuals ("Dana Ionescu, Owner…") paired with **stock Unsplash photos** in source — cannot be labelled false without business evidence, but must enter a substantiation register: evidence them or remove them.
- Corrections applied for consistency: e-Factura citation → OUG 120/2021 art. 10¹; "green/social-claims bans" → environmental/durability (social under general rules); tracker claim limited to "none found in source, runtime audit pending"; SME exemption "expected, unconfirmed"; account deletion ≠ art. 11¹ function; "nothing financially binds" → "no payment obligation through Zavoia"; marketing fix needs **data migration** for existing `true` rows (confirmed defect is invalid stored consent — no marketing sender exists to make it active); OUG 49/2009 + public-visitor/guest-support surfaces added as gates.
- Recycled items not re-counted: reminder gating (A7), COMPLETED check (A4), native placeholders (N1/N2), marketing defaults (D7).

---

## 3. Verified code findings

Every finding below was reported by a verification agent **and** the load-bearing ones were personally reproduced by direct reads/greps. Line refs are to current working trees (22 Jul 2026).

### 3.1 Dashboard (admin-dashboard) + API — SaaS contracting side

| # | Finding | Evidence | Status |
|---|---|---|---|
| D1 | Registration has **one bundled checkbox** (Terms + Cookies + Privacy); value **never sent to the API**; nothing stored | [register-form.tsx:263-293, 74-83](/home/ted/zavoia/admin-dashboard/src/features/auth/components/register-form.tsx) | Confirmed ✓ (reproduced) |
| D2 | **Google sign-up bypasses the checkbox entirely** (button ungated; `GoogleAuthDTO` has no terms field) | register-form.tsx:313; google-auth.dto.ts | Confirmed ✓ (reproduced) |
| D3 | **No acceptance evidence anywhere in admin-api** — no DTO field, no entity/column, no table (repo-wide grep) | register.dto.ts; whole repo | Confirmed ✓ (reproduced) |
| D4 | Legal pages **self-identify as placeholder** ("This is placeholder content…"), EN+RO | legal-page.tsx:44-47; locales auth.json:216 | Confirmed ✓ |
| D5 | Team-invite acceptance flow shows **no terms at all**, records nothing | team-invitation.tsx; complete-invite.dto.ts | Confirmed ✓ |
| D6 | Billing supports `person` \| `company`; CUI required **only** for company; **CNP never collected** (correct posture) | business.service.ts:226-278 | Confirmed ✓ |
| D7 | **All six marketing/reminder preference columns default `true`**; registration never sets them; **no dashboard UI exists to change them** (only the marketplace customer settings write them) | user.entity.ts:222-250; migration Init.ts | Confirmed ✓ (reproduced) |
| D8 | Email footer legal links always use dashboard `FRONTEND_URL` — including customer-facing templates (confirmation, reminder, cancellation, review request, guest tickets); `MARKETPLACE_FRONTEND_URL` exists but is unused here | emails/layout.ts:66-69 | Confirmed ✓ (reproduced) |
| D9 | Stripe Checkout session sets **no `automatic_tax`, no `tax_id_collection`**; custom billing UI shows plan/price/renewal/trial but **no VAT treatment**; no consumer/professional classification anywhere | billing.service.ts:118-231; BillingAndSubscriptionV2.tsx | Confirmed ✓ (reproduced) |
| D10 | Oblio invoicing implemented; **zero direct ANAF/e-Factura code** (grep: 0 hits) | oblio module; repo-wide grep | Confirmed ✓ |
| D11 | No cookie banner — but also **no third-party trackers at all** (deps + index.html + main.tsx checked) | index.html, package.json | Confirmed ✓ (nuance vs prior research) |
| D12 | Public pricing copy contradicts the implemented model: "One plan. Every feature.", "deposits & no-show protection", "Payments with daily payouts" vs Standard/Plus tiers, location limits, and **no payment/deposit infrastructure**. Round-2 verified additions: *"Your subscription is the whole price"* (en.ts:2378) vs paid SMS packs + paid website variants; pricing calculator slider up to **25** members (en.ts trackMax) vs seeded plan cap of **20** team members; *"your data exports with you"* vs individual customer-PDF only. Correction: "Unlimited bookings & clients" is **actually true** (plan limits are locations + team members only) and was wrongly listed here in round 1 | en.ts:2363-2450; plan.entity.ts:37-44; capabilities audit §10.3 | Confirmed ✓ (reproduced) |

### 3.2 Marketplace web (zavoia-web)

| # | Finding | Evidence | Status |
|---|---|---|---|
| W1 | Customer signup (email **and** Google) shows **no legal notice whatsoever**; DTOs carry no acceptance; nothing recorded | register-form.tsx; auth-tabs.tsx:74-93; customer-register.dto.ts | Confirmed ✓ |
| W2 | **Zero legal routes exist** (full route inventory). Footer links to `legal/privacy`, `legal/terms`, `legal/cancellation` fall into the `[city]/[industry]` catch-all → clean 404 (the code comments the collision itself); `about`/`support` footer links also 404 | footer.tsx:103,122-123; [city]/[industry]/page.tsx:14-19,75-77 | Confirmed ✓ (reproduced — `find` returns nothing) |
| W3 | Help-centre claim **"Every business on Zavoia is identity-checked before it can accept bookings"** (EN+RO) — **no KYB/verification mechanism exists anywhere** (no column, no module) | en.ts:2708-2711; ro.ts:1510-1511 | Confirmed ✓ (reproduced) |
| W4 | Search ranking (similarity → distance/rating → recency) + 5-step relaxation ladder implemented server-side; **no user-facing ranking explanation**; default "rec" sort is a hidden, unlabelled state | marketplace-public.service.ts:1209-1274; sort-menu.tsx | Confirmed ✓ (reproduced) |
| W5 | Public listing API **omits legal identity entirely** (`legalName`, `fiscalCode`, `registrationNumber` stored but never exposed; grep of public module: 0 hits) | business.entity.ts:164-203; marketplace-public.service.ts:669-751 | Confirmed ✓ (reproduced) |
| W6 | Pre-booking review step: shows items, prices, total, duration, date/staff/location, **real** cancellation deadlines, pay-at-venue note. Missing: provider legal identity, VAT/tax mention, any terms/policy links. Button is always **"Confirm booking"** — the user cannot tell pre-submit whether it books instantly or only requests | BookingDrawer.tsx:1670-1881, 963-970, 493-494 | Confirmed ✓ |
| W7 | Post-booking cancel modal asserts "free window" **unconditionally** (no time-remaining check) | cancel-modal.tsx:36-38,104 | Confirmed ✓ |
| W8 | "Verified reviews / VERIFIED" badges exist **only in the for-business marketing mock-up**; the real consumer review list shows no verification indicator. Round-2 correction: the `isVerified` column belongs to the **legacy CRM `review` entity** (used only by admin-crm); the live `BusinessReview`/`ProfessionalReview` entities that `submitReview` writes have **no verification field at all** | for-business-content.tsx:686-732; review.entity.ts vs businessReview.entity.ts / professionalReview.entity.ts | Confirmed ✓ (corrected) |
| W9 | Money-flow narrative inconsistency: pricing page promises businesses "deposits & no-show protection" + "daily payouts" while consumer FAQ says "Zavoia never touches the money" — and no payment infra exists | en.ts:2377-2429, 2672-2677 | Confirmed ✓ (reproduced) |

### 3.3 Booking/review backend (admin-api)

| # | Finding | Evidence | Status |
|---|---|---|---|
| A1 | **No customer confirmation at booking creation** — neither auto-confirmed nor pending. Creation fires reminders + business push + staff notifications only. `sendConfirmationNotification` fires **only** on a later dashboard pending→confirmed transition — which auto-confirmed bookings never make. Net: **auto-confirmed marketplace bookings never get any confirmation message** | appointments.service.ts:780-825; appointment.controller.ts:900-908, 1357 | Confirmed ✓ (reproduced) |
| A2 | Confirmation email template contains provider/service/date/time/location only — **no price, no VAT, no cancellation terms, no trader identity** | AppointmentConfirmation.ts:6-13 | Confirmed ✓ |
| A3 | Customer self-cancel: business can disable entirely (E06), window enforced (E07); on success **only business/staff notified — customer gets nothing durable**. (Template + sender exist but are wired only to business-initiated cancellation) | appointments.service.ts:1157-1271; appointment.controller.ts:1565 | Confirmed ✓ (reproduced) |
| A4 | **`submitReview` never checks appointment status** — the COMPLETED check exists only on the UI-driving `canLeaveReview` flags. Direct API call can review a pending/confirmed/cancelled appointment. One-review-per-appointment lock does exist. Native copy claims "Every review is from a completed appointment" | customer.service.ts:50-140 (0 status hits); appointments.service.ts:349,366; reviews-tab.tsx:111-115 | Confirmed ✓ (reproduced) |
| A5 | Marketplace tag assignment validates **only existence + active**; no evidence/scope/expiry/verification model. Tag slugs offered: `eco-conscious, locally-sourced, plastic-free, cruelty-free, vegan, zero-waste` + `women-owned, lgbtq-owned, disability-owned, family-business, independent-business` | location-marketplace-tags.service.ts:205-243; EditLocationMarketplaceDetailsSlider.tsx:45-103 | Confirmed ✓ (reproduced) |
| A6 | Those tags are **not consumer-visible anywhere today** — absent from public marketplace API, native app, zavoia-web, and **explicitly excluded from the published website snapshot** (builder-readiness check only) | website-builder.service.ts:693-706; greps across all repos | Confirmed ✓ |
| A7 | **Operational emails are gated by the reminder preference:** `sendConfirmationNotification` and `sendCancellationNotification` resolve channels via `resolveChannels`, where email requires `settings?.emailEnabled && user.reminderEmail`. A customer who turns off "reminders" — or a business that disables email — silently loses **contractual** communications (confirmations, cancellations) too. Decouple contract-essential messages from preference toggles | reminder.service.ts:93-105, 377-434 | Confirmed ✓ (round 2, reproduced) |

### 3.4 Native app (marketplace-app)

| # | Finding | Evidence | Status |
|---|---|---|---|
| N1 | Terms **and** Cookies screens are Lorem Ipsum ("Last updated: December 2024"); **no privacy-policy screen exists at all** | terms-and-conditions.tsx:33-63; cookies-policy.tsx:34-59 | Confirmed ✓ (reproduced) |
| N2 | Company Details screen shows **fabricated legal identity**: "Marketplace App Ltd.", reg. 12345678, VAT RO12345678, "123 Business Street, Bucharest", fake email/phone/site — hardcoded, no API | company-details.tsx:33-77 | Confirmed ✓ (reproduced) |
| N3 | Registration (email + Google) shows no legal notice; records nothing | register.tsx; customer-register.dto.ts | Confirmed ✓ (reproduced) |
| N4 | Pre-booking policy card consumes real backend hours but the booking-flow API **omits `allowCustomerCancellation`** → can promise cancellation where it's disabled. Post-booking management honours the flags correctly | PolicyDisclosure.tsx:13-29; booking.tsx:666-669; customer-booking.service.ts:132-139 | Confirmed ✓ (reproduced; corrects prior research) |
| N5 | Booking button says just **"Book"**; success screen distinguishes pending/confirmed; the only "receipt" is the in-app ticket rendered from the API response (no email — consistent with A1); no VAT, no terms links, no trader identity pre-confirm | booking.tsx:684-692; booking-success.tsx:70-336 | Confirmed ✓ |
| N6 | Push: OS permission is **never requested** and no token is ever registered on fresh installs (`initializePushNotifications` defined, never called) — so `marketingPush: true` defaults are currently inert in practice; OS permission, appointment notifications, and marketing consent are not separated as concepts | push-notifications/service.ts:130-164; hooks.ts:64-67; provider comment | Confirmed ✓ |

---

## 4. What we have to do

The correct architecture is the one the prior research converged on, with the corrections above baked in. **Build the legal foundation once in admin-api; all three surfaces consume it.**

### 4.0 Foundation (admin-api) — before/with everything else

1. **Legal-document service:** versioned documents (type, locale, version, effective date, body/URL), served to dashboard, web, native. One active version per type/locale; never hardcode copy per surface.
2. **Acceptance-evidence records:** `(userId, documentType, version, locale, surface, method: email|google|invite|checkout, timestamp)`. Enforce server-side at registration (email **and** Google **and** invite) and at subscription checkout. Distinguish `terms_accepted` from `privacy_notice_presented` (privacy is acknowledged, not "consented").
3. **Flip all `marketing*` defaults to `false`** (entity + migration). Keep `reminder*` (operational) separate. Store opt-in history per channel (Legea 506/2004 art. 12; soft opt-in only with opt-out at collection + in every message). Add a real unsubscribe path before any marketing sending exists.
4. **Fix email footer links:** use `MARKETPLACE_FRONTEND_URL` for customer-facing templates; point to real legal routes once they exist.

### 4.1 Dashboard (professional SaaS contracting) — P0

*The Dashboard buyer is a professional. Individuals may subscribe without company data (person billing works today, D6); business info is required only for company invoices. Do not add company gates to registration.*

1. Replace the bundled checkbox with a notice covering **Account Terms + Privacy acknowledgment**; cookies handled separately. Same notice on Google path and team-invite completion; evidence recorded server-side (foundation §4.0.2).
2. Replace placeholder Terms/Privacy/Cookies with real EN/RO documents covering the actual product: subscriptions, seats, SMS credits, Website Builder purchases, marketplace publication, suspension/delisting, cancellation, post-subscription data access, controller-vs-processor split for provider-managed customer data.
3. State intended **professional use** in the SaaS terms. Decision needed (§6.1) on whether a genuine B2C purchase path (with consumer withdrawal + art. 11¹ function for the subscription itself) is offered or excluded.
4. Checkout: show plan, seat math, price, currency, VAT treatment, trial end + conversion, renewal, cancellation effects. On VAT specifically: Stripe `automatic_tax`/`tax_id_collection` is **one implementation option, not a legal requirement in itself** — first reconcile VAT display, Stripe price configuration, Oblio invoicing and any OSS/reverse-charge treatment **with the accountant**, then implement. Reconcile pricing-page copy (D12) — remove "one plan / whole-price / deposits / daily payouts / export" claims or ship the features (Legea 363/2007 misleading-practices risk, in force now).
5. Add Zavoia's real identity (Legea 365/2002 art. 5) to the site footer/legal pages + ANPC/SAL links on consumer-facing surfaces.

### 4.2 Marketplace web (consumer side) — P0

1. **Create the legal routes** (`/[locale]/legal/[doc]` — the catch-all comment already anticipates this): Customer Terms, Privacy, Cookies, booking/cancellation policy, company details (Legea 365/2002), complaints. EN + RO. Fix footer 404s including `about`/`support`.
2. **Signup notice + evidence** on email and Google paths ("By creating an account or continuing with Google, you agree to the Marketplace Terms and acknowledge the Privacy Notice"), recorded via §4.0.2.
3. **ANPC block:** ANPC link + SAL pictogram (250×50 → `https://reclamatiisal.anpc.ro`). The statutory placement requirement targets the **homepage**; a site-wide footer (the eMAG pattern) exceeds the minimum and is the recommended practice, not the literal requirement. **No SOL/ODR link** (platform abolished 20 July 2025).
4. **Contract clarity at booking:** state who provides the service (the provider), that payment is at the venue, and Zavoia's intermediary role. Split the wording: **"Send booking request"** when the business manually confirms vs scheduling wording when auto-confirmed — note `autoConfirmBookings` exists **only server-side** at creation time and is not exposed in any client-facing response, so this needs an **API change** (add it to the public listing/booking payload) before the UI can branch (W6). Link Terms + cancellation policy from the review step. Under the non-binding model (§4.2.8), avoid contract-conclusion language ("Confirm booking", "You're booked") in favour of scheduling language.
5. **Provider identity:** add public trader-identity fields (art. 6¹ + Legea 365/2002 via the provider's own obligations): legal name, CUI/registration where applicable, trader status (self-declared), and the consumer-rights warning for any non-trader category Zavoia chooses to allow (§6.2). Don't auto-publish Oblio billing fields — separate public fields with owner confirmation.
6. **Fix the "identity-checked" claim (W3) now** — remove or reword to what actually happens; reintroduce only with a real verification workflow. This is a live misleading-practice risk.
7. **Ranking transparency (in force since 2022):** a "How results are ranked" disclosure reachable from search (name similarity, distance, rating, recency + the relaxation ladder, which already returns labelled reasons — surface them); label the default sort ("Recommended") instead of a hidden state; disclose sponsored placement if ever introduced.
8. **Statutory withdrawal — conditional, and currently ambiguous (revised twice; this is the settled framing).**
   - **The law:** OUG 34/2014 covers contracts *"prin care consumatorul plătește sau se angajează la plata prețului"* (art. 3(1), verified) — pay **or undertake to pay**; payment at the venue does not by itself take a contract out of scope. But CRD **Recital 20** (verified verbatim) says the notion of distance contract *"should not include reservations made by a consumer through a means of distance communications to request the provision of a service from a professional, such as in the case of a consumer phoning to request an appointment with a hairdresser."* The Commission's CRD guidance draws the line between a mere appointment request (outside) and a **binding reservation** (likely inside). Whether a given flow forms a binding contract is decided by **national law** (Civil Code — objective intent + essential elements), not by what the terms declare.
   - **The facts:** Zavoia collects no payment, holds no deposits, and charges no cancellation/no-show fees — **no payment obligation arises through Zavoia**. Whether the overall flow (confirmed slot + identified service + exact price + provider acceptance) nonetheless forms a provider–customer contract is exactly the open classification question; a guaranteed exact price can *strengthen* the formation argument. The interface currently signals formation: **"Confirm booking"**, **"You're booked"**, an exact **Total**, auto-confirmation, stored price snapshots, with **no terms defining any of it**. (Note also: OUG 34 scope is payment **or**, for digital content/services, personal data as counter-performance — art. 3(1¹); see §4.6.1 for the account contract.)
   - **Conclusion:** the non-binding "appointment request" model is available and is the recommended posture, but it must be **made true**, not merely asserted: (a) Customer Terms state that scheduling creates no obligation to attend or pay and no contractual damages; (b) "confirmed" is defined as calendar-slot acceptance, not contract conclusion; (c) prices are labelled accurately (exact only where the venue guarantees the price; otherwise "from"/estimate); (d) UI wording, confirmation messages, provider rules and actual operations all say the same thing; (e) a plain statement that no statutory withdrawal right arises because no distance contract is concluded (voluntary clarity — art. 6(1)(k) formally applies only where a distance contract *is* concluded). **Romanian consumer-law counsel must approve the final wording and flow before Zavoia commercially relies on this classification** — this is a genuine open point of national contract law, not a formality.
   - **Hard triggers that end the non-binding model:** deposits, no-show fees, online payments, enforceable attendance obligations, binding quotes (the pricing page already *promises* deposits/payouts — D12; do not build them without this work), or Zavoia selling anything to consumers directly. Any of these → per-venue-type classification matrix (healthcare excluded per art. 3(3)(b); dated leisure per art. 16(l)) + art. 11¹ withdrawal function for covered categories.
   - **Expansion note:** contract formation is national law — the Romanian classification does not automatically export to other EU countries; a per-country review is needed before launch elsewhere.
9. **Booking communications:** send durable confirmations at creation for auto-confirmed bookings and "request received" for pending (A1); wire `sendCancellationNotification` into customer self-cancel (A3); enrich the confirmation template with price/currency, cancellation terms, provider identity, policy version (A2). Fix the cancel modal to compute the real deadline (W7).
10. **Reviews:** enforce `COMPLETED` (and ideally past `ends_at`) inside `submitReview` server-side (A4); expose the verification status; add a "How we verify reviews" disclosure (OUG 58/2022 duty); only then claim verified reviews publicly.

### 4.3 Native app — P0 (store-release blocker)

1. Delete Lorem Ipsum terms/cookies and the **fabricated company identity** (N1/N2 — the fake VAT/registration data is the single worst compliance artifact found; also an App Store/Play rejection risk). Consume the canonical legal-document API (§4.0.1) with cached offline copies; add the missing privacy screen.
2. Same signup notice + evidence as web (email + Google).
3. Booking parity: pass `allowCustomerCancellation` into the booking-flow API and honour it pre-booking (N4); same wording split (request vs book), terms links, and durable confirmation as web.
4. Notifications: implement the push-registration trigger deliberately (it's currently dead code); keep OS permission, appointment notifications, and marketing push as three separate consents; marketing off by default.
5. Align App Store / Play privacy declarations with actual SDK behaviour (Mapbox, Google auth, location, photos, calendar).

### 4.4 Green/social claims governance — deadline 27 Sep 2026 (P1, release gate)

Current exposure is **internal-only** (A6) — nothing is consumer-visible, so this is a gate before exposure plus dashboard hygiene, not a live violation:

1. Before any surface (marketplace filters, website renderer, native) ever shows `eco-conscious`/`zero-waste`/`plastic-free`/etc.: either drop generic sustainability labels or attach scope + evidence + provider attestation + review/expiry, with clear "provider-declared" (never "Zavoia verified") labelling. A "certified/verified sustainable" badge requires a qualifying certification scheme (Annex 1 pt. re sustainability labels).
2. Ownership tags (`women-owned` etc.) are factual self-declarations — keep them clearly provider-declared.
3. Rename the dashboard's generic "eco-conscious/sustainable" framing toward specific factual claims when this ships.
4. If tags ever drive search comparison/filtering, add the comparison-methodology disclosure (art. 6¹ family).

### 4.5 Priority summary

| Priority | Item | Why |
|---|---|---|
| **P0 – now** | W3 "identity-checked" claim; D12 pricing claims; N2 fake company identity; W2 dead legal links | Misleading/identity violations in the current code under law in force for years (deploy-state of these trees not separately verified — confirm what is live in production) |
| **P0 – launch blockers** | Legal foundation (§4.0), real documents + acceptance evidence on all 3 surfaces, marketing defaults off, ANPC/SAL footer, booking confirmations + contract clarity, review COMPLETED enforcement | Existing consumer/ePrivacy/e-commerce law |
| **P0 – with the legal docs** | Make the non-binding booking model true end-to-end (terms + UI wording + "confirmed" definition + price labelling + no-withdrawal statement), then **counsel sign-off** on the classification | See §4.2.8 — the model is available but currently ambiguous; terms alone cannot establish it |
| **Conditional gate** | Withdrawal classification matrix + art. 11¹ function — required **before** deposits/no-show fees/online payments/consumer sales ever ship (or a Dashboard B2C path), or if counsel concludes current bookings already form binding distance contracts | OUG 18/2026 art. IV(1), in force 19 Jun 2026 |
| **P1 – assessments** | GDPR mapping (incl. special-category risk of ownership tags), P2B provider-side duties, DSA baseline, DAC7 reporting-operator assessment, EAA/Legea 232/2022 microenterprise check, Legea 365/2002 contracting formalities | See §4.6 — regimes outside this audit's original scope |
| **P1 – by 27 Sep 2026** | Claims governance (§4.4); digital-service update/conformity info in legal docs | OUG 18/2026 art. IV(2) |
| **P2** | Ranking-disclosure polish, review-verification page, Mapbox cookie assessment, consent-gating scaffold for future analytics | In force, lower enforcement surface today |

### 4.6 Additional regimes to assess (added round 2 — outside this audit's original verification scope)

These were correctly identified by the counter-review as missing from a document titled "compliance audit". Listed with honest status: **flagged for assessment, not yet verified to the standard of §1–§3.**

1. **Customer-account contract (OUG 34 art. 3(1¹) + OUG 141/2021).** Even if bookings are non-binding, the free Marketplace account may itself be a consumer **digital-service contract** if Zavoia processes account data beyond what's strictly needed to provide the service or comply with law. Marketing defaults being `true` today makes the "exclusively necessary" exception hard to claim. Flipping defaults off and keeping data use minimal keeps this out of scope; otherwise the account contract needs its own information duties, the full OUG 141/2021 package (conformity, updates/security, remedies, modification rules, termination effects, content retrieval), and potentially its own withdrawal right — noting that **ordinary account deletion is not the art. 11¹ withdrawal function**, which has its own labelling, statement fields, confirmation step and durable acknowledgment.
2. **GDPR.** Full mapping needed: Zavoia as controller (accounts, marketing) vs processor (provider-managed customer records), notices, lawful bases, retention/deletion, subprocessors (Stripe, AWS SES, Twilio, Mapbox, Google, Cloudflare R2, Oblio), transfers, and security. Specific flag: **`women-owned` / `lgbtq-owned` / `disability-owned` tags can constitute special-category data (art. 9) about an identifiable solo owner** — even unexposed, they sit in the DB; self-declaration UX should capture explicit consent and the claims work (§4.4) must account for it.
3. **P2B Regulation (2019/1150) — provider side.** Applies to online intermediation services facilitating B2C transactions **regardless of where the transaction concludes** (offline included) — so it applies to Zavoia's provider relationship. Duties: plain-language provider T&Cs, 15-day notice for changes, ranking main parameters **in the provider T&Cs** (in addition to the consumer-facing art. 6¹ disclosure), grounds for suspension/termination with statement of reasons, differentiated-treatment disclosure. The internal complaint-handling system and mediation duties have **SME exemptions** (<50 staff, ≤€10m) that Zavoia is **expected** to fit — unconfirmed pending headcount/turnover/linked-enterprise evidence (blueprint gate 2). Folds into writing the provider terms — which don't exist yet.
4. **DSA.** Zavoia hosts listings and reviews → intermediary/hosting service, plausibly an "online platform". Micro/small-enterprise exemption removes most online-platform-chapter duties for now, but baseline duties apply regardless of size: points of contact, notice-and-action mechanism for illegal content, T&C moderation transparency, statement of reasons for removals. Trader-traceability (art. 30–31) ties back to the distance-contract classification and is size-exempt today — reassess on growth.
5. **DAC7 (Dir. 2021/514).** "Relevant activity" includes **personal services**, and platform payment is not the test — the question is whether consideration is *known or reasonably knowable* by the operator. Zavoia stores agreed prices but does not know whether visits happen or what is actually paid. Genuinely arguable both ways → needs a **tax-counsel assessment** of reporting-operator status before scale; not a code item today.
6. **Accessibility (EAA / Legea 232/2022).** In force since 28 June 2025 for covered consumer-facing e-commerce services. **Microenterprise exemption** (<10 staff, ≤€2m) likely covers Zavoia today — document that reliance, monitor thresholds, and prefer accessible-by-default UI now (cheaper than retrofitting).
7. **Legea 365/2002 contracting formalities (arts. 7–9).** Beyond identity info: technical steps to conclude a contract, means of correcting input errors, languages offered, storage/accessibility of the concluded contract, and **acknowledgment of receipt without undue delay** for online orders. Relevant to subscription checkout and to bookings regardless of their binding status — the missing booking acknowledgment (A1) also has this angle.

---

## 5. How big EU SaaS / marketplaces handle this

All quotes below come from the companies' **own live legal/help pages** (no blogs). The two most load-bearing quotes (Treatwell's withdrawal exclusion, Calendly's consumer ban) were re-fetched and verified verbatim a second time, independently of the research agent. Items that could not be pulled from a primary source are explicitly flagged.

### 5.1 How SaaS peers scope "professional use" (→ our §6.1 decision)

- **Calendly** ([Acceptable Use Policy](https://calendly.com/legal/acceptable-use-policy)) — bans consumer use outright: *"Using the Services for consumer purposes, as Calendly is intended for use by businesses and organizations"* is a prohibited activity. **(verified verbatim)**
- **Shopify** ([Terms of Service](https://www.shopify.com/legal/terms)) — user warranty: *"You confirm that you are receiving any Services provided by Shopify for the purposes of carrying on a business activity and not for any personal, household or family purpose."* Acceptance is notice-based: *"By signing up for a Shopify Account … you are agreeing to be bound by the following terms and conditions."* EMEA contracts under Irish law.
- **Fresha** ([Partner Terms](https://terms.fresha.com/partner-terms)) — grant *"solely for your internal business purposes"*; *"Fresha is a commercial booking agent and does not provide the Partner Services to the Client"*; the service contract is explicitly partner↔client.
- **Treatwell** ([Supplier Terms](https://www.treatwell.co.uk/info/supplier-terms-and-conditions/)) — a partner is *"a salon, spa, barber, **verified sole trader** or other approved venue"*: individuals are welcome as providers, but as verified professionals — exactly the posture we want (individual ≠ consumer).
- **Wix** (Terms of Use + refund policy) — the contrast case: **no** business/consumer exclusion at all; instead a *"14-day, money-back guarantee for new Premium or Studio site plans"* that operationally mirrors the EU withdrawal right for first purchases.

**Takeaway:** the market splits into (a) hard professional-purpose warranty (Shopify/Calendly/Fresha) and (b) no exclusion + voluntary 14-day refund (Wix). Recommended for Zavoia: Shopify-style professional-purpose confirmation in the SaaS terms + Treatwell-style "verified sole trader" framing for individual providers; optionally a Wix-style goodwill refund window on first purchase, which also de-risks any borderline consumer claim.

### 5.2 Marketplace contract model (→ our §4.2.4)

- **Treatwell** ([Booking T&C, BE/EN version](https://www.treatwell.be/en/info/booking-terms-and-conditions/)) — a booking *"will create two binding legal contracts"*: the Treatwell Contract and *"a contract between you and the relevant Partner in respect of the provision or supply of the Services"*; *"Treatwell takes and concludes your bookings as a commercial agent for its Partners"*; the Partner Contract forms when *"we send you a written confirmation (usually by email) ('Order Confirmation')"* — and notably, for *"Pay at Venue"* widget orders **"no binding contract is formed"**. **(verified verbatim)**
- Doctolib / Booksy / Planity all position themselves as intermediaries, but their exact clauses were **not verifiable from primary sources** (bot-blocked/PDF-unreadable) — treat as leads only.

**Takeaway (precision matters here):** Treatwell's *main* flow is prepaid and expressly **binding** — contract at the emailed Order Confirmation. The *"no binding contract is formed"* carve-out applies **only to the embedded-widget "Pay at Venue" flow**, not to pay-at-venue generally. So Treatwell is precedent that a venue-paid booking *can* be deliberately structured as non-binding — not that pay-at-venue is automatically non-binding, and not proof of how a Romanian court would classify our flow. It is a product reference, not legal authority (§4.2.8 governs).

### 5.3 Statutory withdrawal for dated bookings (→ our §4.2.8)

- **Treatwell** — disapplies the 14-day right explicitly and loudly (their caps): *"THE STATUTORY RIGHT OF WITHDRAWAL APPLICABLE TO DISTANCE AGREEMENTS IS NOT APPLICABLE TO THE CANCELLATION OF DATED BOOKINGS MADE VIA TREATWELL AS THIS RELATES TO LEISURE SERVICES WHERE A CERTAIN TIME IS SET ASIDE BY THE PARTNER."* Meanwhile gift cards **keep** the 14-day right. **(verified verbatim)**
- **Booksy** — withdrawal stance not verifiable from a primary source; flagged.

**Caution:** Treatwell is beauty/wellness-only, so a blanket art. 16(l) "leisure services" position is easier for them than for us — our taxonomy spans home services, education, professional services, automotive, and healthcare (the latter outside OUG 34 entirely). This is why our classification matrix must be per venue-type rather than one blanket clause, but Treatwell proves the exemption is the industry-standard anchor for dated beauty/wellness bookings, paired with a prominent disclosure and the partner's own cancellation window.

### 5.4 Trader-status disclosure (→ our §6.2)

- **Booking.com** — mandatory professional/private host self-assessment since 2020; EEA consumers see a *"managed by a private host"* label (consumer side confirmed; partner-page wording was fetch-blocked).
- **Airbnb** ([host declaration](https://www.airbnb.com/help/article/1321), [EU business-info display](https://www.airbnb.com/help/article/4176)) — hosts self-declare business vs private; status shown in search and listing; business hosts' legal identity (legal name, address, registry/VAT) displayed per DSA.
- **Treatwell / Booksy** — no trader/non-trader consumer disclosure exists because they **onboard only businesses/verified sole traders**.

**Takeaway:** supports the traders-only launch recommendation — it is what our direct competitors do, and it removes the art. 6¹ non-trader warning branch entirely. If we ever allow non-traders, Booking.com/Airbnb show the pattern (self-declaration + visible label).

### 5.5 Ranking transparency (→ our §4.2.7)

- **Booking.com** ([How we work](https://www.booking.com/content/how_we_work.html)) — discloses primary parameters (*click-through rate, gross bookings, net bookings*), commercial influences (*"How much commission they pay us … whether they're part of our Genius program or Preferred Partner (+) Program"*), and personalization with opt-out.
- **Airbnb** ([How search results work](https://www.airbnb.com/help/article/39)) — four main factors: quality (photos, ratings), popularity (engagement), price (total vs area), location, plus host behaviour and personalization.
- **Booksy** — sells **Boost** (paid visibility, *"you pay Booksy 30% of the total cost of the first visit"*) but publishes **no consumer-facing ranking page** we could find; **Treatwell** documents ranking factors only in partner help.

**Takeaway:** the large platforms publish a consumer-facing ranking page; the vertical booking players lag behind their legal duty. For us it's nearly free: `applySearchOrder` + the relaxation ladder already produce labelled, explainable logic — writing the page is mostly documentation.

### 5.6 Review verification (→ our §4.2.10)

- **Booking.com** ([review guidelines](https://www.booking.com/reviews_guidelines.html)) — *"The only way to leave a review is to first make a booking. That's how we know our reviews come from real guests"*; automated fake-review detection; 3-month post-stay window.
- **Treatwell** ([community guidelines](https://www.treatwell.co.uk/info/community-guidelines/)) — *"We only publish reviews where the appointment has taken place"*; reviews accepted up to 3 months after the appointment.
- **Trustpilot** ([trust page](https://corporate.trustpilot.com/trust)) — the open-platform contrast: anyone may review, backed by automated fraud detection and an optional "Verified" label on invited reviews.

**Takeaway:** our closed-loop architecture matches Booking.com/Treatwell — but they enforce completion server-side and disclose the mechanism. We need the `COMPLETED` enforcement (A4), a review window (3 months is the peer norm), and a "how reviews are verified" page before claiming it.

### 5.7 Romanian footer practice (ANPC/SAL) (→ our §4.2.3)

- **eMAG** — footer carries exactly two links: *"PROTECŢIA CONSUMATORILOR - A.N.P.C."* → `anpc.ro` and *"…A.N.P.C. – SAL (Soluționarea Alternativă a Litigiilor)"* → `reclamatiisal.anpc.ro`. **No ODR/SOL link.**
- **OLX** — minimal: a single "ANPC" link.
- **Fashion Days** — cautionary tale: its terms still point to the **defunct** EU SOL/ODR platform (`ec.europa.eu/consumers/odr`), a stale reference that now misleads.

**Takeaway:** copy eMAG — ANPC link + SAL link/pictogram (250×50 per ANPC), nothing pointing at the dead ODR platform.

### 5.8 Signup acceptance wording

- **Shopify** uses pure notice-based acceptance (*"By signing up … you are agreeing…"*) with no checkbox. Booksy's and Treatwell's live signup strings could not be captured from primary sources (bot-blocked) — flagged, not assumed.
- Notice-based acceptance is lawful and market-standard; a checkbox is simply stronger evidence. Our plan (notice + server-side versioned evidence on every path, including Google) is at or above peer practice — the current state (client-only checkbox on dashboard, nothing on marketplace) is below it.

### 5.9 Honestly unverified (do not rely on)

Booksy consumer/provider terms verbatim; Planity CGU/CGV verbatim; Doctolib CGU verbatim (PDF unreadable — intermediary framing is a search summary only); Booking.com partner-side trader definition verbatim; Treatwell/Booksy signup consent strings; Wix's dedicated EU-terms page (404). If any of these matter for a specific decision, capture them manually from the live sites.

---

## 6. Open business decisions (needed before implementation)

1. **Dashboard B2C path — yes or no?** Simplest lawful posture: terms state the Dashboard is for professional use (individuals welcome, acting professionally — person-type invoices already work). If we ever *sell* it for genuinely private use, that purchase needs consumer checkout: withdrawal right + art. 11¹ function + express-start consent for immediate access + consumer-terms set. Recommendation: professional-use-only at launch; revisit if a real B2C use-case appears.
2. **Non-trader providers on the Marketplace — allowed?** If yes: label them, show the art. 6¹ consumer-rights warning, and decide which service categories may lawfully be offered. Recommendation: traders-only at launch (every peer checked works this way) — it kills an entire compliance branch.
3. **Booking semantics per business:** keep both auto-confirm ("booking") and manual ("request") but expose which one applies pre-submit. Decide whether confirmed bookings create a payment obligation (no-show fees) — if ever yes, button wording must signal the obligation.
4. **Healthcare categories:** venues under Health & Medical (dental, medical specialists, physio, psychology…) fall outside OUG 34 for the **treatment contract** — but the classification matrix must be per venue-type and counsel-approved before the withdrawal function ships.
5. **Who is Zavoia's contracting entity** (SRL name, CUI, HQ) — required on every legal page, the native company-details screen, and email footers. Blocking item for writing any final document.

---

## 7. Sources (official/primary only)

**Romanian law**
- OUG 18/2026 — [Portal Legislativ doc 308474](https://legislatie.just.ro/Public/DetaliiDocument/308474) · [Nota de fundamentare (gov.ro)](https://gov.ro/ro/guvernul/procesul-legislativ/note-de-fundamentare/nota-de-fundamentare-oug-nr-18-19-03-2026&page=1)
- OUG 34/2014 (consolidated) — [Portal Legislativ doc 158913](https://legislatie.just.ro/Public/DetaliiDocument/158913)
- Legea 363/2007 — [Portal Legislativ doc 88290](https://legislatie.just.ro/Public/DetaliiDocument/88290)
- OUG 58/2022 (Omnibus transposition) — [Portal Legislativ doc 254946](https://legislatie.just.ro/Public/DetaliiDocumentAfis/254946)
- Legea 365/2002 (e-commerce) — republished text via [dataprotection.ro](https://www.dataprotection.ro/servlet/ViewDocument?id=453)
- Legea 506/2004 art. 12 — [Portal Legislativ doc 56973](https://legislatie.just.ro/Public/DetaliiDocumentAfis/56973)
- OUG 141/2021 (digital content/services conformity, Dir. 2019/770)
- OUG 89/2025 (e-Factura, incl. B2C 13-zeros rule) + ANAF guidance

**EU law**
- Directive (EU) 2023/2673 — [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2023/2673/oj/eng) (Art. 11a withdrawal function; apply from 19 Jun 2026)
- Directive (EU) 2024/825 — [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2024/825/oj/eng) (green claims; apply from 27 Sep 2026)
- Regulation (EU) 2024/3228 — repeal of the ODR platform (decommissioned 20 Jul 2025)
- Regulation (EU) 2019/1150 (P2B) — ranking transparency **toward business users**

**ANPC**
- [SAL system update — pictogram 250×50 + reclamatiisal.anpc.ro; SOL references removed (Ordin 449/2022 as amended, Ordin 270/2026)](https://anpc.ro/anpc-dezvolta-sistemul-sal-potrivit-cadrului-european-actual/)
