# Zavoia Terms — Launch Checklist & Owner's Guide

**Date:** 1 August 2026
**What this covers:** the 12 drafted legal documents living in `zavoia-web/src/data/legal/` (published as drafts at `/terms` and `/ro/terms`), what every GATE means, what you must investigate/confirm/decide, whether publishing is legally enough, and the exact sequence to launch.
**Companions:** [ZAVOIA_TERMS_BLUEPRINT.md](./ZAVOIA_TERMS_BLUEPRINT.md) · [ZAVOIA_PRODUCT_CAPABILITIES_AUDIT.md](./ZAVOIA_PRODUCT_CAPABILITIES_AUDIT.md) · [ZAVOIA_OPEN_LEGAL_DECISIONS_EXPLAINED.md](./ZAVOIA_OPEN_LEGAL_DECISIONS_EXPLAINED.md) · [FRESHA_TERMS_MAPPING.md](./FRESHA_TERMS_MAPPING.md)

**State after the 1 Aug 2026 audit pass:** every document was cross-checked against the blueprint, the capabilities audit, the decisions document and the actual code by two independent verification passes; all HIGH findings were fixed (no clause obliges anyone to perform because of a booking; no claim describes a feature that doesn't exist without an explicit note; DAC7/DSA-art.30 are stated conditionally per the decisions doc). Every remaining unknown is an **amber note block** visible on the draft pages — there are no silent gaps.

---

## 1. What the GATES mean

Every amber box on a draft page is one of four kinds:

- **FACT gate** — a real-world fact only you/your accountant can supply (company data, emails, financials). No lawyer or engineer can fill these.
- **DEC gate** — a business decision you must make and record. The drafts assume a direction where one was discussed; the note says so.
- **IMPL gate** — the terms describe behaviour the product must actually have before publication. Publishing terms that describe non-existent behaviour is itself a consumer-law problem (misleading practice), so these block launch.
- **COUNSEL gate** — a legal classification that needs a short written opinion from a Romanian specialist. Not "review everything" — each one is a narrow, named question.

---

## 2. Your to-do list

### 2.1 Facts to supply (you / accountant)

- [ ] **Company identity (gate D1)** — legal name, J-number, CUI, VAT status, registered office, share capital. Fills `company-info`, `terms-of-use`, `privacy-policy`, `business-terms`. *Blocks everything — do this first.*
- [ ] **Official contact + privacy emails** — support email, privacy/DPO email, provider-complaints contact.
- [ ] **Enterprise-size evidence pack (gates D2/D13)** — from the accountant: headcount (annual work units), turnover, balance-sheet total, cap table, linked/partner enterprises. Decides the P2B small-enterprise exemption (mediation duty) and the EAA microenterprise exemption. One pack serves both; re-check annually.
- [ ] **Backup practices** — confirm what backup infrastructure actually exists before it can be listed in the DPA security annex (currently removed as unevidenced).

### 2.2 Decisions to make (record each in writing)

- [ ] **Traders-only launch (gate D8)** — the drafts assume only registered businesses (SRL/PFA) can list, validated via the ANAF API. Confirm this formally (this whole conversation's research supports it: unregistered individuals' recurring activity is illegal per OUG 44/2008, and Fresha-style laxity imports compliance debt).
- [ ] **Minimum age (gate D11)** — 16 or 18 for accounts; any per-category restrictions (tattoo/piercing).
- [ ] **Review window** — the [3 months] in `content-policy` is the peer norm; decide it AND implement it (it is not enforced in code today), or drop the claim.
- [ ] **Seat-billing definition** — marketing says "bookable staff", code bills *all* non-owner members (audit §10.3). Pick one; align code, pricing page and `business-terms`.
- [ ] **Retention windows** — post-termination data retention/export window (business-terms, provider-terms, dpa) and the per-category retention schedule in `privacy-policy`.
- [ ] **Review persistence after account deletion** — keep (anonymized?) or delete.
- [ ] **DPO designation** — likely advisable given health-venue bookings; decide with privacy counsel.
- [ ] **Prohibited-services list** — author the concrete list referenced by `provider-terms` §regulated-services.
- [ ] **Notice periods in business-terms** — the bracketed [30] days price-change and [10] days invoice-dispute are proposals; confirm.

### 2.3 Engineering prerequisites (IMPL gates — these block publication)

Priority order; the first three block *all* contractual documents:

- [ ] **Acceptance-evidence system** — record document version, accepting user, workspace, capacity, method, timestamp, locale per blueprint §0.2. *Verified 1 Aug: nothing exists in code.*
- [ ] **Fix the acceptance bypasses** — Google signup skips the terms checkbox; `GET /check-team-invitation` auto-accepts on open; customer-role enablement presents no terms. All three must become explicit actions.
- [ ] **Booking UI copy change** (decisions doc §2.4.B) — "Confirm booking" / "You're booked" → request/reserve language ("Request appointment", "Time reserved"), plus the short "service and payment are agreed directly with the provider" line. Remove the unsupported "venue cancellation fee may apply" copy.
- [ ] **Provider verification flow** — CUI collection at listing activation + ANAF v9 API validation + trader-status declaration + the consumer-facing trader label (OUG 34 art. 6¹). *None of it exists yet.*
- [ ] **Cookie consent banner** — per-category consent, persistent settings link, non-essential storage loads only after consent. Then run the **runtime storage audit (gate D14)** of the deployed site/apps and fill the cookie-policy tables.
- [ ] **Marketing consent fix (gate D15)** — flip `marketing*` defaults to false AND migrate/invalidate existing `true` rows; keep transactional messages unsuppressible by marketing toggles.
- [ ] **Notification layer fixes** (audit §6.20) — before terms may promise notifications: confirmation for auto-confirmed bookings, messages on bulk cancellations, honour channel preference, wire web inbox + fresh-install push. (Drafts currently promise nothing — deliberate.)
- [ ] **Policy snapshotting** — record the cancellation-policy version per booking (blueprint §0.2). Until built, the drafts honestly say windows "reflect the business's current settings"; after it ships, upgrade to grandfathering wording.
- [ ] **Content-report channel** — a report form or monitored address (DSA art. 16) named in `content-policy`.
- [ ] **Bulk export tooling** — before the DPA/provider-terms can promise export; lapse today = indefinite read-only, no export, no deletion.
- [ ] **Replace placeholder legal screens** — the native app's Lorem Ipsum terms and fabricated company details screen (audit §13/blueprint §0.3).
- [ ] **In-product L365/2002 formalities** — technical steps / error correction / contract storage description at the point of contracting (business side).

### 2.4 Counsel questions (narrow, written deliverables)

- [ ] **Booking-model opinion (the big one)** — a short Romanian-law opinion that the *completed* flow (final terms + new UI copy + provider prohibitions) produces the non-binding appointment-coordination effect management already decided. Feeds customer-terms, booking-policy, provider-terms.
- [ ] **DAC7 tax memo (gate D12)** — is Zavoia a reporting platform operator; is snapshotted-price-plus-manual-COMPLETED "reasonably knowable" consideration? Give tax counsel the factual pack from decisions doc §6.4 *plus this session's research (OECD FAQ 14, Finnish deeming guidance, Fresha/Treatwell practice — in FRESHA_TERMS_MAPPING context)*. Until answered, the drafts state DAC7 conditionally. **Ask counsel for three concrete outputs**: (1) in scope or not; (2) if in scope, the exact basis for the reported activity figure (booked list prices of completed appointments, or another measure) and the first reporting year; (3) whether the manual COMPLETED status is a sound basis. All three feed the `/terms/dac7` page, the Provider Terms §tax-reporting clause and the Privacy Notice legal-obligation purpose.
- [ ] **Free-account classification (OUG 141, gate D5)** — needs the purpose-by-purpose data map first (product supplies facts, counsel classifies).
- [ ] **DSA classification + duty map** — hosting/online-platform confirmation; whether art. 30 traceability attaches under the non-binding model; articles 11–18 inventory.
- [ ] **ANCOM notification (Law 50/2024, gate D9)** — prepare the data now; ask ANCOM in writing about timing (implementing decision still draft as of 23 Jul 2026); don't guess deadlines.
- [ ] **OUG 49/2009 matrix (gate D10)** — provider categories covered/excluded, information fields, and validation of an electronic short-notice agreement for <5-day appointments.
- [ ] **EAA/Law 232 accessibility opinion** — scope + the microenterprise exemption (using the accountant's pack; note the Romanian cross-reference defect in art. 4(5)).
- [ ] **Health-data (art. 9) assessment (gate D7)** — appointment data at medical/psych/dental/physio/lab venues: legal basis, access scoping, retention, notification content. Blocks parts of privacy-policy and the DPA.
- [ ] **Liability-cap drafting** — the 12-month-fees cap structure needs professional drafting for enforceability (Civil Code limits).
- [ ] **Final language review of the Romanian text** — the RO versions are working translations; a Romanian lawyer should polish legal register before publication (Legea 193/2000 plain-language standard).

---

## 3. Is publishing on the website enough? Do people have to "sign"?

Short answer: **publishing alone is NOT enough for the contractual documents, but nobody ever signs anything on paper.** Romanian/EU law fully recognizes electronic "click-wrap" acceptance (Civil Code consent rules + Legea 365/2002; eIDAS for electronic form). What matters is an **explicit act + stored evidence**, not a signature.

Per document:

| Document | Publishing enough? | What's required |
|---|---|---|
| Company info | ✅ Yes | Must simply be accessible (L365/2002 art. 5). Link it in the footer. |
| Privacy Notice | ✅ Yes | Information duty, not a contract — present it, link at data-collection points. **Do NOT ask people to "accept" it** (fake consent is a GDPR anti-pattern). |
| Cookie & Storage Notice | ⚠️ Publishing + **banner** | The notice informs; the **consent banner** does the legal work (per-category, before non-essential storage loads). Browser-settings language is not consent. |
| Content & Moderation Policy | ✅ Yes | Publish + operate the report route. Referenced by the terms. |
| Website Terms of Use | ⚠️ Mostly | For casual visitors, presentation suffices (weak browse-wrap). For account holders, fold acceptance into account creation. |
| Marketplace Customer Terms | ❌ No | **Click acceptance at account creation** and at customer-role enablement on existing accounts, evidence recorded. |
| Booking & Cancellation Policy | ✅ As info | Published + policy surfaced in the booking flow; it's a schedule under the customer terms, no separate acceptance. |
| Business Terms (SaaS) | ❌ No | **Click acceptance at workspace creation/trial activation** (not at signup!) + professional-purpose statement, recorded. |
| Provider Terms (P2B) | ❌ No — and also YES | Two duties: it must be **publicly available pre-contractually** (P2B art. 3 — publishing satisfies this) AND **accepted at listing activation**, recorded. |
| Account & User Terms | ❌ No | Explicit acceptance at signup / invitation completion (fix the GET auto-accept). |
| DPA | ❌ No | Incorporated into the Business Terms acceptance (standard SaaS practice — no separate signature needed unless a customer requests a countersigned copy). |
| DAC7 — Platform Tax Reporting | ✅ Yes | An explainer for listed businesses, not a contract — publish and link it from the Provider Terms. If the tax memo confirms scope, DAC7 also carries its own transparency duty: sellers must be *informed* that their data will be reported, and this page is how you discharge it. |

**The evidence you must store for every acceptance** (blueprint §0.2): document ID + version (ideally content hash) · the workspace/contract it binds · accepting user · represented person/company · claimed capacity · method (email/Google/invite/role-enablement) · timestamp · locale. This record is what wins a dispute — the checkbox alone is worthless if you can't prove which version was accepted, by whom, when.

**Changes after launch:** consumers get advance notice + right to leave (never "continued use = acceptance"); providers get ≥15 days on a durable medium (P2B art. 3(2)); existing bookings are never affected. Keep every historical version retrievable.

---

## 4. Launch sequence (recommended order)

1. **Now:** supply the facts (§2.1) → company-info, contact emails resolve immediately.
2. **Sprint 1 (engineering):** acceptance-evidence system + the three bypass fixes + booking UI copy + cookie banner. These unlock the most.
3. **In parallel:** make the §2.2 decisions; commission the two most important counsel items (booking-model opinion + DAC7 memo) and the accountant's size pack.
4. **Sprint 2:** provider verification flow (ANAF), marketing-consent migration, notification fixes, report channel, runtime storage audit → fill cookie tables.
5. **Counsel pass:** send the drafts (they're structured so counsel reviews *text*, not architecture); Romanian language polish.
6. **Publish:** resolve every amber note → set each document's `status: "published"` + `effectiveDate` in `zavoia-web/src/data/legal/*` (the draft banners disappear automatically) → wire the acceptance flows → keep `/terms` linked in the footer (already done).
7. **After launch:** ANCOM notification when the implementing decision lands; annual size re-check; re-open the reassessment triggers (decisions doc Phase 4) before ever adding payments, deposits, fees, commissions or non-trader providers.

## 5. What you do NOT need to worry about (decisions doc §12)

No withdrawal buttons for appointments · no five-day booking bans · no forced attendance/payment · no "we're late with ANCOM" panic · no assumption that DAC7 definitely applies · no consumer checkout on the Dashboard just because someone pays with a personal card · and no regulator pre-approves any of this — your protection is the documented reasoning trail these five docs now form.
