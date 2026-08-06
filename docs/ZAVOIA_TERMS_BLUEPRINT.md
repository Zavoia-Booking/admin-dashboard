# Zavoia — Working Terms Architecture

**Status: working outline — subject to classification decisions and Romanian counsel approval. Not a settled specification.**

**Date:** 23 July 2026 (rev. 2 — restructured after counter-review; accepted corrections listed in §E)
**What this is:** the clause architecture for Zavoia's contract documents, with the legal basis for each element. Legal bases were verified against official sources in [ZAVOIA_LEGAL_COMPLIANCE_AUDIT.md](./ZAVOIA_LEGAL_COMPLIANCE_AUDIT.md). Every element is tagged: **[REQ]** confirmed legal requirement · **[COND]** conditional on a classification/decision · **[DEC]** business decision · **[IMPL]** implementation prerequisite in code.

---

## 0. Parties, acceptance model, and product facts

### 0.1 Who contracts with whom (corrected, rev. 3)
- **B2B side:** the contracting party is the **workspace customer** — a legal entity, **or an individual acting professionally (in which case the owner IS the party in person)**; otherwise the owner accepts as authorized representative. Terms and acceptance records must capture which of the two it is. **[REQ — general contract law]**
- **Timing (verified in code):** registration creates the user + BusinessOwner **with no workspace**; the business is created later at wizard completion, together with the 14-day trial ([auth.controller.ts:~1078](/home/ted/zavoia/admin-api/src/modules/auth/auth.controller.ts), [wizard.controller.ts:~343](/home/ted/zavoia/admin-api/src/modules/wizard/wizard.controller.ts)). Therefore: **Account/AUP terms bind at signup; the SaaS Agreement binds at workspace creation / trial activation** — not before.
- **B2C side:** the customer contracts with Zavoia for the platform/account; any service contract is with the provider (see B3).
- One identity can be owner, team member and marketplace customer across businesses, and roles are acquired **in both directions over time** (customer→owner, business user→customer) → acceptance must be **role-, workspace- and document-specific**, triggered per the matrix in §0.2.

### 0.2 Acceptance triggers and evidence **[IMPL]**
**Document/role/trigger matrix:**
| Event | Document(s) |
|---|---|
| Public visit / guest support | Website-use + privacy information presented — no invented "consent" |
| Account creation or any role acquisition | Account/AUP terms |
| Workspace creation / trial activation | SaaS Agreement (customer or authorized representative) |
| Listing activation | Provider/P2B Schedule (available **pre-contractually** per P2B art. 3(1)(b) — click-acceptance at activation is Zavoia's implementation choice, not a P2B mandate) |
| Every CUSTOMER-role enablement path | Marketplace Customer Terms |
| Each booking | Record the applicable provider-policy/cancellation-policy **version** |
| Marketing | Separate consent per channel |

**Evidence per event:** document ID + version (ideally content hash) · workspace/contract it binds · accepting user · represented person/company · claimed capacity/authority · method (email/Google/invite/role-enablement) · timestamp · locale.

**Verified code gaps this must close:** dashboard Google signup bypasses the terms checkbox entirely; `GET /check-team-invitation` **auto-accepts an invitation for an existing active user on merely opening the link** (side-effecting GET, no action, no terms — [auth.controller.ts:~1596](/home/ted/zavoia/admin-api/src/modules/auth/auth.controller.ts)); and the **CUSTOMER role can be granted to an existing business account later** via the `confirm_enable_marketplace` flow ([customer-auth.controller.ts:~488-504](/home/ted/zavoia/admin-api/src/modules/marketplace/auth/customer-auth.controller.ts)) — so Marketplace Terms must be presented and recorded **whenever CUSTOMER access is enabled**, not only at signup.

### 0.3 Product facts the documents must cover (verified in code)
Standard/Plus **and Custom** plans; **Lifetime Deal** businesses with paid extra seats; one-time Website Builder purchases; SMS credit packs; purchasing is **web-only inside a product that also ships a Capacitor native shell** (store-policy implications to be assessed); native marketplace app currently has no signup notice, Lorem Ipsum terms, no privacy page, and a fabricated Company Details screen — replacing these is an **[IMPL]** requirement of this architecture, not a drafting note.

### 0.4 Recommended document set
1. **B2B SaaS Agreement** (workspace customer ↔ Zavoia)
2. **Order/Plan/Billing Schedule** (tiers incl. Custom/LTD, seats, SMS, Website Builder one-time purchases, trial)
3. **Marketplace Provider / P2B Schedule** — accepted **when a listing is activated**, not buried in the SaaS terms **[REQ once listing]**
4. **Authorized-User / Account Terms** (team members, invitees)
5. **Marketplace Customer Terms** (consumers, web + native)
6. **Booking & Provider-Policy Schedule** — aligned on both sides (see B3/A7)
7. **Review / content / moderation policy + DSA notice route**
8. **DPA built on an activity-level role map** (see A10) + verified vendor-role list
9. **Privacy Notice, Cookie/Storage Notice, Company-Information page** (Legea 365/2002 art. 5)

---

## A. B2B side (SaaS Agreement + schedules)

**Regime:** Civil Code freedom of contract. OUG 34/2014 and Legea 193/2000 do not apply **where the buyer actually acts professionally** — the terms state the intended professional purpose (evidence/burden-shifting), but cannot conclusively determine a person's status **[COND]**. Misleading B2B advertising is governed by **Legea 158/2008** (Dir. 2006/114) — not Legea 363/2007, which protects consumers. P2B Reg. 2019/1150 imposes mandatory content (A6). Legea 365/2002 arts. 5, 7–9 apply. GDPR per role map (A10).

### A1. Parties & identity **[REQ]**
Zavoia entity per Legea 365/2002 art. 5 (**gate: entity details unknown**). Workspace customer as party; owner as representative with capacity warranty (§0.1).

### A2. Professional purpose **[DEC — scope/evidence choice, not a statutory requirement]**
Shopify-style confirmation (*"…for the purposes of carrying on a business activity and not for any personal, household or family purpose"*); Calendly-style consumer-use prohibition; Treatwell-style "verified sole trader" admission of individuals. Legal effect: **relevant evidence of intended professional purpose** — it cannot strip mandatory rights from a genuinely private-purpose buyer.

### A3. Account & acceptance **[IMPL]**
Notice-based acceptance on every path (email, Google, invite completion — replacing the GET auto-accept with an explicit act) + §0.2 evidence.

### A4. Services & entitlements **[REQ — accuracy]**
Describe the real model only: Standard/Plus/Custom, LTD, location/team limits, seats, SMS credits, Website Builder. No deposits/payouts/imports/bulk-export promises while unbuilt — basis for B2B-facing claims: **Legea 158/2008**; consumer-facing claims: Legea 363/2007.

### A5. Pricing, billing, renewal, trial **[REQ — accuracy; VAT [DEC with accountant]]**
Stripe mechanics, renewal/proration, real trial terms, price-change notice + termination right. Oblio invoicing (person/company; CUI only for company; never CNP — e-Factura B2C 13-zeros per OUG 89/2025).

### A6. Marketplace Provider / P2B Schedule **[REQ — Reg. 2019/1150, verified]**
Accepted at listing activation. Must contain:
- grounds for **restriction**, suspension and termination (arts. 3(1)(c), 4) — statement of reasons; 30-day prior notice for termination (with statutory exceptions); clarification/redress path and **reinstatement incl. data re-access** on revocation;
- changes: ≥15-day durable-medium notice, **longer where providers need technical/commercial adaptations** (art. 3(2)); no retroactive changes; proportionate termination rights (art. 8);
- **ranking** main parameters + relative importance + whether remuneration can influence ranking (art. 5) — relevance/distance/rating/recency + labelled fallback; today: payment has no influence (disclose if that ever changes);
- **additional distribution channels & affiliate programmes** (art. 3(1)(d)) — n/a today, state it;
- **effects on provider IP ownership/control** (art. 3(1)(e)) — listing content licence;
- **ancillary goods/services** description if any are offered to consumers through the platform (art. 6);
- **restrictions on offering different conditions through other channels** — state any, with grounds (art. 10); none today;
- **differentiated treatment** disclosure (art. 7) — none today, state it;
- **data access** during and after contract, incl. third-party sharing (art. 9);
- complaints/mediation (arts. 11–12): small-enterprise exemption **expected but unconfirmed — [DEC/gate: confirm headcount, turnover, balance sheet and linked-enterprise status per Rec. 2003/361 before relying on it]**; provide a voluntary complaints contact regardless;
- plain, intelligible, publicly available including pre-contractually (art. 3(1)) — Fresha/Treatwell publish theirs;
- **provider identity clearly visible** on the platform (art. 3(5), verified verbatim) — a P2B duty that applies **regardless of the consumer-law booking classification**;
- conditions under which **business users may terminate** the relationship (art. 8(b));
- a precise definition of the **Provider Business vs the individual professional** performing the appointment (who is the P2B business user, who appears in listings).

### A7. Provider status, compliance & the booking model **[REQ + COND]**
Provider self-declares trader status (feeds art. 6¹ consumer disclosure); warrants listing/price accuracy; holds own licences/fiscal/consumer-law duties. **If the non-binding booking model is adopted [DEC], this schedule must impose it on providers**: platform "confirmation" is calendar-slot acceptance, not contractual acceptance; providers may not pursue cancellation/no-show charges or damages **through the platform**; the service contract (scope + price) is concluded directly with the customer. Claims/tags: sustainability claims fall under Legea 363/2007 **Annex 1 pts. 28–39** (from 27 Sep 2026); **ownership/social claims (women-owned, lgbtq-owned, disability-owned) are governed by the general misleading-practice rules**, not those annex points (Dir. 2024/825 extends misleading-action scope to environmental **and social** characteristics — counsel to confirm exact RO article numbering).

### A8. Team & seats
Invite authority, Account Terms at completion (explicit act — see §0.2), seat billing, offboarding.

### A9. Content, IP & moderation **[REQ — DSA baseline, size-independent]**
Terms must **describe content restrictions and moderation policies, procedures and tools, including whether review is algorithmic or human** (DSA art. 14); operational notice-and-action route and statements of reasons for removals/restrictions; P2B art. 4 alignment for provider-facing actions.

### A10. Data protection **[REQ — per-activity role map, not a blanket label]**
Establish roles **per processing activity** (EDPB controller/processor guidance): provider-entered CRM records → likely Zavoia-as-processor (DPA with the **full art. 28(3) contents** — subject-matter, duration, nature/purpose, data categories, instructions, confidentiality, security, sub-processing, assistance, deletion/return, audit); marketplace identity, bookings, reviews, security, support, platform ops → likely Zavoia-as-independent-controller; check candidates for joint controllership. **Vendors are not automatically subprocessors** — classify Stripe, Google (OAuth), **Firebase Admin, Google Cloud Tasks, Expo push**, Oblio, AWS SES, Twilio, Mapbox, Cloudflare per service and purpose; publish the verified list.

**Special categories — two distinct risks:** (a) `lgbtq-owned` / `disability-owned` tags can reveal art. 9 data of an identifiable solo owner (`women-owned` is not art. 9 by itself); (b) **the larger one: appointment data itself** — bookings with psychology, medical, dental, physiotherapy or laboratory venues (all in the live taxonomy) can reveal or strongly imply **health data** of marketplace customers. Needs a dedicated art. 9 assessment: necessity, legal basis, who can see it (staff scoping), retention, deletion, and what appears in notifications/emails **[gate]**.

### A11–A15
Suspension/termination + post-termination data (mirrors A6); B2B liability caps — **possible within Civil Code limits** (no exclusion for intent/gross negligence; enforceability needs counsel drafting, not a "permissible" assumption); versioned changes (P2B 15-day floor); Romanian law/courts; Legea 365/2002 arts. 7–9 formalities (technical steps, error correction, storage, languages, acknowledgment — the acknowledgment duty attaches to the *order* model finally chosen **[COND]**).

---

## B. Marketplace Customer Terms

**Regime:** Legea 193/2000 (plain language, no Annex-blacklisted clauses — style constraint on everything below) **[REQ]**; Legea 363/2007 (practice-based — applies regardless of contract formation) **[REQ]**; OUG 34/2014 arts. 6/6¹ **[COND — attach to the distance-contract classification]**; Legea 365/2002; Legea 506/2004 art. 12; OG 38/2015; GDPR; OUG 141/2021 **[COND]**.

### B1. Who we are & roles **[REQ]**
Zavoia identity (L365 art. 5). Role statement — corrected wording: Zavoia operates the platform; **"if and when a service contract is concluded, it is between you and the provider"**; payment happens directly with the provider; Zavoia never handles customer money.

### B2. The account **[COND — pending data-purpose map]**
Free account; features; deletion. Whether the account is an OUG 34 art. 3(1¹)/OUG 141 digital-service contract **cannot be settled by terms wording** — it requires mapping every actual purpose (account ops, bookings, reviews, favourites, personalization, fraud, analytics, improvement, marketing) **[gate]**. Marketing = separate per-channel opt-in (L506/2004 art. 12), never bundled. **[IMPL]:** flip `marketing*` defaults; separate transactional messages from "reminder" preferences (confirmations/cancellations must not be suppressible by a reminder toggle).

### B3. Bookings — target model **[DEC + COND + counsel gate]**
The defensible target (CRD Recital 20): booking reserves a calendar slot; creates no obligation to attend, purchase or pay; no Zavoia-side charges or damages; "confirmed" = slot accepted; the service contract forms later with the provider. **Terms alone cannot create this result** — it requires: (a) matching UI/messages (drop "Confirm booking"/"You're booked") **[IMPL]**; (b) the provider-side obligations in A7 **[IMPL/REQ]**; (c) honest price presentation — the product currently supports **only exact prices with exact snapshots**, so either prices are contractually guaranteed-as-shown by providers or "from"/estimate labelling must be **built** before the terms can say prices may vary **[IMPL/DEC]**; (d) Romanian counsel approval of the classification **[gate]**. *Fallback branch:* any flow classified as contract-forming instead gets the OUG 34 art. 6(1) information set, per-venue-type art. 16/art. 3(3)(b) exemption mapping, and the art. 11¹ withdrawal function where a right survives.

### B4. Providers — status & responsibility **[REQ basis split]**
Trader-status and responsibility disclosures: formally OUG 34 art. 6¹ **[COND on classification]**, but materially required regardless via Legea 363/2007 misleading-omission rules — so implement them in all scenarios. Traders-only launch **[DEC]**; otherwise non-trader label + statutory warning.

### B5. Ranking **[REQ — unconditional]**
Main parameters in plain words + labelled fallbacks + no-paid-placement statement. Basis: Legea 363/2007 (via OUG 58/2022) — practice-based, applies regardless of contract formation; art. 6¹ adds the marketplace-specific duty where distance contracts form. **The disclosure must inventory each ranked surface, not describe one formula** (verified in code: search uses similarity/distance/rating/recency, but homepage "latest" uses newest-first, other rails use review-count, name, or rating orderings, plus the labelled relaxation ladder).

### B6. Reviews **[REQ = honesty; policy = product choice]**
The **legal requirement** is honest disclosure of whether and how reviews are verified (L363/2007). The **product policy** — only completed appointments may review, within a window (3 months = peer norm) — is Zavoia's choice, and claiming it requires the server-side COMPLETED enforcement first **[IMPL — currently absent]**.

### B7–B8. Policies, acceptable use, liability
Provider cancellation windows displayed honestly (fix the unconditional "free window" copy) **[IMPL]**; liability limited to platform duties **within Legea 193/2000 constraints**.

### B9. Complaints, ANPC & SAL **[REQ — accurately framed]**
Support channel; ANPC information. Two distinct bases: (a) OG 38/2015 art. 25 — the website/terms SAL listing applies where the trader commits or is obliged to use SAL, and SAL information on a durable medium is mandatory after an unresolved direct complaint; (b) **Ordin ANPC 449/2022 as amended by Ordin 270/2026 — a separate pictogram requirement for qualifying trader sites administering sales/orders/advertising**; Zavoia's direct applicability should be resolved as its own question, not assumed away. Practical outcome either way: adopt the eMAG pattern (ANPC link + SAL pictogram 250×50 → reclamatiisal.anpc.ro). No ODR/SOL references.

### B10–B14
Privacy/cookies presented separately; **if the account is classified as a paid-with-data digital service [COND], OUG 141/2021 brings the full package** — conformity, updates/security, remedies, modification rules, termination effects, content retrieval — not just two disclosure lines; versioned changes; Romanian law with mandatory consumer protections, RO text authoritative; L365 arts. 7–9 formalities per the final contract-formation model **[COND]**.

---

## C. Peer alignment (primary sources, verified)

| Topic | Peer | Zavoia element |
|---|---|---|
| Business-only SaaS | Shopify warranty; Calendly AUP ban; Fresha "internal business purposes" | A2 |
| Sole traders | Treatwell "verified sole trader" | A2/A7 |
| Provider is the trader | Fresha; Treatwell (agent model) | A7/B1 |
| Non-binding venue-paid flow | Treatwell **widget** pay-at-venue only ("no binding contract is formed") | B3 (as deliberate design, not precedent of automatic effect) |
| Withdrawal exclusion | Treatwell art. 16(l) clause for dated bookings | B3 fallback |
| Ranking pages | Booking.com "How we work"; Airbnb article 39 | A6/B5 |
| Review verification statements | Booking.com; Treatwell | B6 |
| RO footer | eMAG (ANPC + SAL, no ODR) | B9 |

## D. Decision gates before drafting
1. Zavoia contracting entity details. 2. Enterprise-size evidence for P2B (and DSA) exemptions — headcount, turnover/balance sheet, linked enterprises. 3. Booking contract-formation model (+ counsel; note a guaranteed exact price can *strengthen* the formation argument, and any future paid flow reclassifies **that flow**, not every booking). 4. Provider-side booking obligations (prohibit attendance/payment/fee/damages obligations arising from the platform request, whether pursued through Zavoia **or outside it**). 5. Customer-account data classification (purpose-by-purpose map — cannot be resolved by terms wording or default-flipping alone). 6. GDPR activity-level role map + vendor roles. 7. **Health-data (art. 9) assessment for medical/psychology/dental/physio/lab bookings.** 8. Trader verification approach (or remove the "identity-checked" claim). 9. **ANCOM notification under Legea 50/2024 art. 5** — Romanian intermediary providers must notify within 45 days of starting the service (for pre-existing providers the clock runs from ANCOM's secondary legislation; changes notified within 10 days); resolve Zavoia's classification and whether/when the notification is due **now**, not at scale. 10. **OUG 49/2009 (Services Directive)** provider-information duties — field-by-field legal basis before mandating public CUI/registry display for every listing. 11. Minors/age policy for accounts. 12. DAC7 applicability (tax counsel). 13. Accessibility (EAA) applicability vs microenterprise status. 14. Runtime tracking/storage audit of deployed sites + confirmation of **which revisions are actually deployed** (repo trees ≠ production). 15. **Marketing-consent data migration** — flipping entity defaults does not fix rows already stored as `true`; existing users need a migration/re-consent strategy. 16. **Claims & testimonials substantiation register** — named testimonials (currently paired with stock photos in source), "identity-checked", deposits/payouts/export/"every feature": each either evidenced by the business or removed. 17. Privacy/legal surfaces for **public visitors and guest-support submissions**, not only registered users.

## F. Fresha-derived candidate additions — status (1 Aug 2026, from [FRESHA_TERMS_MAPPING.md](./FRESHA_TERMS_MAPPING.md); drafted in zavoia-web `/terms` skeletons, pending counsel)

**Incorporated into the drafts:** image/person-consent mechanics (provider-terms §listing-content) · connected-client-records clause (provider-terms §connected-records) · client-complaint SLA 48h/14d (provider-terms §bookings-obligations) · reviews-non-optional + reply standards + anti-manipulation (provider-terms §reviews) · marketing/SEO usage permission for city×category pages (provider-terms §distribution-transparency) · policy-version-at-booking + existing-bookings grandfathering (booking-policy, customer-terms) · authorized-user vicarious responsibility (business-terms §team) · independent-controller cooperation + 24h incident notice (business-terms §data-protection) · invoice-dispute window + late-payment ladder + no-set-off (business-terms §billing/§general-provisions) · **regulated/prohibited-services warranty** (provider-terms §regulated-services — prohibited-list document still to be authored) · general provisions: assignment, change-of-control notice, notices, survival, entire agreement (business-terms §general-provisions) · one-account/non-transferability (terms-of-use §accounts) · geographic-scope statement (terms-of-use §governing-law) · customer health-info disclosure duty (customer-terms §health-information) · ADM/profiling section in privacy notice (privacy §ranking-profiling) · native-app/SDK storage in cookie notice (cookie-policy §what-we-use) · new-features clause with P2B notice (business-terms §services-plans).

**Dropped as inapplicable (verified 1 Aug 2026):** staff-usage analytics transparency — no analytics SDK exists in admin-dashboard/admin-api/zavoia-web (package.json grep), so there is no tracking to disclose; revisit only if product analytics are ever added.

**Still open (business decisions):** billing-unit definition ("bookable staff" vs all non-owner seats — audit §10.3 reconciliation) · review-persistence-after-account-deletion policy · prohibited-services list document · DPO designation.

## E. Revision notes

### Rev. 3 (round-4 counter-review, 23 Jul 2026 — each item re-verified before acceptance)
Accepted: SaaS Agreement binds at **workspace creation/trial activation**, not signup (verified: owner registered with no workspace; business created at wizard completion); individual professional can personally be the party; document/role/trigger matrix adopted (§0.2) incl. public-visitor and guest-support surfaces; P2B additions verified — **art. 3(5) provider-identity visibility** (applies regardless of booking classification), art. 8(b), provider-business definition, pre-contractual availability; **Legea 50/2024 art. 5 ANCOM notification** (verified — 45-day duty, new gate 9); OUG 49/2009 assessment added; **health-data art. 9 risk of medical/psych bookings** added (the largest special-category exposure — bigger than the ownership tags); full art. 28(3) DPA contents + Firebase/Cloud Tasks/Expo vendors; ranking disclosure must inventory **each ranked surface** (verified: homepage/rails use different orderings than search); e-Factura citation corrected to **OUG 120/2021 art. 10¹ as amended** ("never CNP" reframed as a data-minimization choice; a PFA has a CUI); professional-purpose clause retagged **[DEC]** ("relevant evidence", not "burden-shifting"); B2B liability caps qualified (Civil Code limits); SAL pictogram order treated as a direct-applicability question; marketing fix requires **data migration**, not just new defaults (and the confirmed problem is invalid stored consent, not proven active marketing — no sender exists); "nothing financially binds the customer" softened to the verified fact (no payment obligation **through Zavoia**); account deletion is **not** the art. 11¹ withdrawal function; testimonials moved to a substantiation register (named people + stock photos in source — verify with the business or remove). Rejected as recycled: reminder-preference gating, missing COMPLETED check, native placeholders, SME-exemption caveat (already in rev. 2 blueprint; audit wording aligned now).

### Rev. 2 (round-3 counter-review)
Accepted from counter-review, each re-verified: workspace customer (not owner) as B2B party; acceptance record schema + CUSTOMER-role-enablement trigger (code: `confirm_enable_marketplace`); GET invite auto-accept defect; P2B additions (arts. 3(1)(d)(e), 3(2) longer notice, 4 restriction/reinstatement, 6, 10) + separate Provider Schedule + SME exemption unconfirmed; **Legea 158/2008** for B2B advertising claims; B1/B3 contradiction fixed; exact-price-only product reality; account classification requires a data map, not terms wording; OUG 141 full-consequence list; GDPR per-activity roles, vendors not auto-subprocessors, `women-owned` not art. 9; DSA art. 14 detail; review policy vs legal duty split; OG 38/2015 art. 25 conditional framing; ownership/social tags governed by general misleading rules, not Annex pts. 28–39; Custom/LTD/one-time/native-shell product facts added; title downgraded from "verified specification" to working architecture. Rejected as already-covered: native-app placeholder findings, COMPLETED-check absence, marketing defaults (all in the audit since round 1).
