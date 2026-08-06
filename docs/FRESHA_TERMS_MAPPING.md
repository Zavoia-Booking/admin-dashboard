# Fresha legal docs → Zavoia mapping (drafting reference)

**Date:** 1 Aug 2026 · **Source:** all 9 terms.fresha.com documents read in full (partner-terms via raw HTML, 169KB — WebFetch truncates it) · **Companions:** [ZAVOIA_TERMS_BLUEPRINT.md](./ZAVOIA_TERMS_BLUEPRINT.md), [ZAVOIA_PRODUCT_CAPABILITIES_AUDIT.md](./ZAVOIA_PRODUCT_CAPABILITIES_AUDIT.md)
**Implements:** skeleton pages live in `zavoia-web` at `/terms` + `/terms/[slug]` (registry: `zavoia-web/src/data/legal.ts`).

## Headline conclusions

1. **Fresha validates the blueprint's document split** (site ToU / booking ToS / privacy / cookies / partner terms / DPA ≈ blueprint §0.4), but is a peer for **structure and provider-obligation content only — NOT for EU/RO compliance**. Full-text grep of the partner terms: **zero** hits for P2B 2019/1150 apparatus (ranking, 15-day change notice, statement of reasons, mediation, business user), zero DSA moderation-transparency content.
2. **The single most transferable clause** — partner-terms §9 "Pay Cash In-Store" branch: *"Fresha is solely a technology provider and does not act as a commercial booking agent. No contract is created between the Client and the Partner until the appointment takes place"* + §12 "no cancellation fees for Pay Cash In-Store Bookings" + §12 no-retroactive-policy-changes rule. **Fresha drafted Zavoia's entire B3 non-binding model as its minor branch.** Add Fresha to blueprint §C peer table alongside Treatwell for the non-binding venue-paid flow.
3. Fresha's whole payments spine (agency appointment, payment-discharge, card capture, deposits/no-show charging, wallet/netting, terminals, store, vouchers, capital, Adyen docs) — **~half the wordcount — is SKIP** for Zavoia.
4. UK-specific content is **actively unlawful to copy** for RO: DUAA-2025 legitimate-interest and cookie-consent exemptions (privacy §4.4/§15.2), implied cookie consent, browser-settings-as-consent, UK IDTA / 2010 SCCs, ICO references, English law/courts, 1-year claim bars, class-action waivers.

## Do-not-copy list (would be unlawful/abusive under RO law)

$100 liability cap (partner terms) · "review terms regularly" amendments with continued-use acceptance (violates P2B art. 3(2) and L193/2000) · suspension-on-suspicion without statement of reasons (P2B art. 4) · client-data IP/database-rights assignment to platform (conflicts with A10 processor role) · anti-steering/booking-diversion clauses (protect a commission Zavoia doesn't charge; art. 10 exposure) · "not suited for the platform" removal ground · message-credit forfeiture (Zavoia promises non-expiry) · broad consumer indemnity · implied cookie consent · UK statutes throughout.

## Highest-value ADAPTs (steal the drafting, fix the law)

| Fresha source | What to take | Zavoia doc |
|---|---|---|
| Partner §9 Pay-Cash branch + §12 | Non-binding booking model + no platform cancellation fees + policy-version-at-booking | provider-terms, customer-terms, booking-policy |
| Partner §23 warranties | Registered-business warranty ("sole proprietor managing a registered business…") — Zavoia adds ANAF API validation on top | provider-terms |
| Partner §11.1/11.3 | Image/person consent collection + recording + withdrawal | provider-terms |
| Partner §11.6 | Connected client records clause (cross-platform identity linking, provider-as-controller duties) | provider-terms, privacy |
| Partner §13 | Client-complaint SLA (48h ack / 14d resolve); reviews non-optional; reply standards | provider-terms |
| Partner §20 | Independent-controller cooperation (mutual DSR assistance, 24h partner incident notice) — validates A10 activity-level split | business-terms, dpa |
| Partner §22 | Invoice-dispute window, no-set-off, late-payment ladder, tax-registration warranty | business-terms |
| Privacy (whole) | Per-context controller/processor role table — direct A10 match | privacy |
| ToU §10 | Notice-and-action mechanics: report fields, decision notices, 14-day appeal | content-policy |
| ToS §12 | Restriction-grounds catalogue (minus payment items); provider-side customer blocking disclosure | customer-terms |
| ToS §5.3 | Customer health-info disclosure duty (rework vs. art. 9 gate D7) | customer-terms |
| ToS §17 | "Changes don't affect existing bookings" grandfathering | customer-terms |
| ToS §18 | Complaint escalation ladder (provider → review → platform) — add ANPC/SAL | customer-terms |
| DPA §6 | Public sub-processor list + 30-day notice + objection→terminate | dpa |
| Cookies | Named-cookie tables (provider/purpose/expiry) — content must come from runtime audit (gate D14) | cookie-policy |
| /entities | One canonical "who you contract with" page pattern → L365/2002 art. 5 page | company-info |
| /payment-processors | Incorporation-by-reference architecture → use for the published vendor list, not payments | dpa, privacy |
| Adyen §37 | The best-drafted change clause in the stack (30-day notice + termination right + legal-change carve-out) — better base than Fresha's own | business-terms, provider-terms |
| Adyen §9 | Automated-decision human-intervention right — template if listing moderation is ever automated | content-policy |

## Blueprint-mandated content in NO Fresha document (draft from scratch)

OUG 34/2014 **art. 6¹** marketplace disclosures (trader status, obligation split) · **P2B art. 5 ranking** per surface (B5 inventory: search similarity/distance/rating/recency; homepage newest-first; rails by review-count/name/rating; relaxation ladder) · P2B art. 3(2) **15-day change notice** · P2B art. 4 statement-of-reasons/redress/reinstatement · P2B arts. 11–12 complaints/mediation (SME-exemption gate D2) · P2B art. 9 **provider** post-term data access (Fresha secures only its own!) · P2B arts. 3(1)(d)/(e), 3(5), 6, 7, 10 statements · DSA art. 14 moderation transparency + art. 17 statements of reasons · DSA art. 30 traceability (Fresha outsources to Adyen KYC; Zavoia does it contractually + ANAF) · **DAC7 clauses** (CUI/TIN collection, annual ANAF reporting, data-or-suspension) · review-verification statement (B6) · ANPC + SAL, no ODR (B9) · L365/2002 art. 5 full identity block + arts. 7–9 formalities · withdrawal-rights architecture for service bookings (B3 fallback; peer = Treatwell art. 16(l)) · cookie **consent** regime (L506/2004 art. 4) · per-channel marketing opt-in (art. 12) · ANSPDCP (not ICO) · art. 9 health-data treatment of booking data (Fresha's DPA *excludes* special categories — untenable for Zavoia) · RO-authoritative bilingual text · L193/2000 plain-language register.

## Candidate blueprint additions surfaced by Fresha (not currently in blueprint)

Provider side: image/person consent mechanics · connected-records clause · client-complaint SLA · review-participation duties · "Bookable Staff"-style billing-unit definition (forces audit §10.3 seat-billing reconciliation) · authorized-user vicarious responsibility · new-features/default-settings clause (with P2B notice) · regulated/prohibited-services warranty (critical for medical/dental/psych taxonomy) · staff-usage analytics transparency · marketing/SEO usage permission (Zavoia already runs SEO city×category pages on listing data with no authorizing clause) · change-of-control notice.
Consumer side: one-account/non-transferability rule · geographic-restrictions clause · health-info disclosure duty · existing-bookings grandfathering · ADM/profiling section in privacy notice · review-persistence-after-deletion policy · internal DP-complaints procedure · native-app/SDK storage in cookie notice · DPO-designation decision.

## Fresha document → Zavoia document map

| Fresha | Zavoia (/terms/…) | Notes |
|---|---|---|
| /terms-use | terms-of-use | ~70% adaptable; fix acceptance model, moderation, liability, law |
| /terms-service | customer-terms + booking-policy | Structurally inverted: binding-at-confirmation + agency → non-binding + no payments |
| /privacy-policy | privacy-policy | Role-table architecture yes; UK statutes, ICO, DUAA out; add health-data section |
| /cookies | cookie-policy | Table format yes; consent layer must be built (none at Fresha) |
| /data-protection | dpa | B2B DPA (not consumer!); replace 2010 SCCs/UK IDTA with EU 2021 SCCs; no special-category exclusion |
| /partner-terms | business-terms + provider-terms + account-terms | ~10 of 25 sections SKIP (payments/terminals/store/vouchers/capital/AI) |
| /entities | company-info | One-entity version; L365 art. 5 completeness |
| /payment-processors | — (skip) | Pattern only: incorporation-by-reference for vendor list |
| /adyen-for-platforms | — (skip) | Pattern only: §37 change clause, §9 ADM rights, §4 KYC-update duty |
