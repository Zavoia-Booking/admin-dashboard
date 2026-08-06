# DAC7 — implementation, data model and test scenarios

**Date:** 2 August 2026
**Scope:** the DAC7 ledger in `admin-api`, its CRM surface in `admin-crm`, and how to verify both.
**Related:** [ZAVOIA_TERMS_LAUNCH_CHECKLIST.md](./ZAVOIA_TERMS_LAUNCH_CHECKLIST.md) · [ZAVOIA_OPEN_LEGAL_DECISIONS_EXPLAINED.md](./ZAVOIA_OPEN_LEGAL_DECISIONS_EXPLAINED.md) (§6 DAC7) · public explainer at `/terms/dac7` in `zavoia-web`

---

## 1. What DAC7 is, in one paragraph

DAC7 (Council Directive (EU) 2021/514, transposed by OG 16/2023 into the Cod de procedură fiscală, art. 291^5 + Anexa 5) makes online platforms identify the sellers active on them and report their activity once a year to the tax authority — for a Romanian operator, to ANAF via **form F7000, by 31 January** for the preceding calendar year. It creates **no new tax**: it is information reporting. ANAF then exchanges the data with other member states.

Two facts drive the whole implementation:

- **It does not depend on handling payments.** The statutory test is whether the *consideration* is "known or **reasonably knowable**" by the platform. Zavoia never touches the money, so what it legitimately knows is the **booked price of appointments that took place** — not revenue, and not what was actually paid at the venue.
- **Personal services have no de-minimis threshold.** The 30-transactions / €2,000 exclusion applies to sellers of *goods* only. One reportable appointment in a year makes a seller reportable.

> **Scope is still an open question (gate D12).** Whether Zavoia is a *reporting platform operator* at all needs a written memo from Romanian tax counsel. The ledger is built and running anyway, because **this data cannot be reconstructed retroactively** — if the answer comes back "in scope", the year's activity must already have been captured. Nothing in the ledger is filed anywhere until that memo exists.

---

## 2. What gets recorded, and what does not

| Appointment | In the ledger? | Why |
|---|---|---|
| Customer books via the marketplace, business marks it **completed** | **Yes** | Platform-facilitated personal service, performed |
| Marketplace booking still pending / confirmed / cancelled / no-show | No | Nothing was performed |
| Business creates the appointment itself (`admin`) | No | Not facilitated by the platform |
| Phone booking typed in by staff (`phone`) | No | Same |
| Walk-in (`walk_in`) | No | Same |
| Business only pays a Zavoia subscription, no marketplace bookings | No | Reporting is activity-based, not subscription-based |

The filter is exactly: `status = 'completed' AND bookingSource = 'marketplace'`.

**Counting rule:** one Relevant Activity **per service performed**. A booking of three services is three activities; a bundle is flattened to the services inside it.

---

## 3. Entities

Both tables live in `admin-api/src/entities/` and were created by migration `1785900000000-Dac7Ledger`.

### 3.1 The rule that shapes both

Neither table has a foreign key to `business`, `appointment` or `service`, and every identity and price field is a **copy, not a join**. This is deliberate:

- the obligation to report **outlives the account** — a business can delete itself in March and ANAF can ask about it years later;
- retention is **at least 5 and at most 10 years** after the reporting period (ANAF DAC7 guide);
- a join would delete the evidence exactly when it is needed.

Consequently `account-deletion.service.ts` **must never** delete from these tables. It only stamps `sourceDeletedAt`. There is a comment in `purgeBusiness` saying so.

### 3.2 `dac7_seller` — identity snapshot

One row per **(business, reporting year)**. Identity is reported as it stood for that period, so next year's rename does not rewrite what was already filed.

| Column | Notes |
|---|---|
| `sourceBusinessId`, `sourceBusinessUuid` | Plain integers/strings — no relation, no cascade |
| `reportingYear` | Unique together with `sourceBusinessId` |
| `billingEntityType` | `company` → F7000 block **2.1.2** (Entitate); `person` → block **2.1.1** |
| `individualType` | `pfa` \| `natural_person` |
| `legalName`, `tradingName` | Legal name for the return, trading name for identification |
| `fiscalCode` | The reported TIN: CUI for a company or PFA, personal tax identifier for a plain individual |
| `tinIssuingCountry` | F7000 wants "orice NIF … **inclusiv fiecare stat membru emitent**" |
| `vatNumber`, `registrationNumber` | VAT number; Registrul Comerțului number (entities only) |
| `dateOfBirth` | Natural persons incl. PFA; companies have no equivalent field |
| `address`, `city`, `county`, `countryCode` | Primary address as reported |
| `contactEmail`, `contactPhone`, `ownerName`, `ownerEmail` | So a closed account can still be identified and contacted |
| `sourceDeletedAt` | Set when the business was purged. The row itself is retained |

### 3.3 `dac7_activity` — one row per service performed

| Column | Notes |
|---|---|
| `dac7SellerId` | Plain integer into `dac7_seller` |
| `sourceBusinessId`, `sourceAppointmentId`, `sourceAppointmentUuid` | Provenance, for justifying a figure later |
| `itemIndex` | Position of the service within its appointment |
| `serviceId`, `serviceName` | Snapshot; service may be deleted later |
| `activityDate` | The appointment's scheduled date |
| `reportingYear`, `reportingQuarter` | Derived from `activityDate` |
| `considerationMinor`, `currency` | Minor units, in the currency the business priced in — **stored as charged, never converted** |
| `platformFeeMinor` | Fees withheld by the platform. Always `0` today: Zavoia charges a flat subscription, nothing per booking |
| `status` | `active` \| `voided` |
| `voidedAt`, `voidedReason` | Why a row stopped counting |

**Unique index `(sourceAppointmentId, itemIndex)`** is the idempotency key — a replayed completion cannot double-count.

---

## 4. How it works at runtime

### 4.1 The single entry point

`Dac7Service.syncAppointment(appointmentId)` — called from `appointment.controller.ts` on **any status change**, at both update sites. It is idempotent and decides from scratch:

```
reportable? (status = completed AND source = marketplace)
├── yes → rows already exist? ── yes → re-activate any voided rows, then stop
│                            └── no  → snapshot seller for the year, expand services, insert
└── no  → void every active row for that appointment
```

Firing on *any* status change (not only on completion) is what makes an **undone completion** void the activity instead of leaving a reportable row behind. Failures are logged, never thrown — bookkeeping must not break a booking.

### 4.2 Expanding an appointment into services

| `bookingType` | Source of the services |
|---|---|
| `SERVICE` | The appointment itself → 1 activity |
| `BUNDLE` | `bundleServicesSnapshot[]` → 1 activity per service |
| `COMPOSITE` | `bookingItemsSnapshot[]`; each `type: 'bundle'` item is further expanded via its `bundleServices[]` |

### 4.3 Apportioning the price

A bundle usually costs less than its parts, so reporting each service at list price would **overstate** the consideration actually agreed. The appointment's real `price` is therefore split proportionally, with the rounding remainder given to the last service so the parts always sum back to the total.

Worked example — a 3-service bundle listed at 50 / 30 / 20 but sold for **80.00**:

```
parts = [40.00, 24.00, 16.00]   sum = 80.00 ✓   activities = 3
```

Edge cases covered: awkward rounding (`33.33 / 33.33 / 33.34`), and items with no individual prices (split evenly, remainder to the last).

### 4.4 Seller snapshot

Created on the seller's first activity in a year and refreshed while that year is still open (due diligence must be complete by **31 December** of the period). Once `sourceDeletedAt` is set the snapshot is frozen — there is no live business left to refresh it from.

### 4.5 Account deletion

`purgeBusiness` calls `dac7Service.markBusinessDeleted(businessId)` **before** the purge. The DAC7 rows keep the full identity; only the marker changes.

---

## 5. CRM surface

All under `AdminJwtAuthGuard`.

| Endpoint | Purpose |
|---|---|
| `GET /admin-crm/dac7/sellers` | Search + paginate sellers. Filters: `search`, `reportingYear`, `deleted` (`true`/`false`/omitted), `includeVoided` |
| `GET /admin-crm/dac7/sellers/:id` | One seller's full identity + per-quarter totals |
| `GET /admin-crm/dac7/activities` | Activity rows; filters as above plus `dac7SellerId`, `sourceBusinessId`, `reportingQuarter` |
| `GET /admin-crm/dac7/export` | CSV, same filters, default cap 100k rows |

`search` matches legal name, trading name, fiscal code, registration number, owner name/email, contact email, or an exact business id.

**UI:** `/dac7` in the CRM sidebar — filter bar, seller table, and a detail panel with identity, per-quarter totals and activity list. Deleted accounts are badged and carry a banner explaining why the record is retained. The **"Deleted only"** filter is the view for answering an ANAF query about a closed business.

**Export format:** CSV with a UTF-8 BOM (opens directly in Excel, keeps diacritics, streams without holding the export in memory). One row per service, amounts in **major units** so they read and sum without dividing. Cells beginning `= + - @` are prefixed with `'` to neutralise spreadsheet formula injection.

---

## 6. Playwright tests — implemented and passing

**Status: 14/14 green** (`npx playwright test e2e/dac7`). Files:

- `e2e/dac7/dac7-ledger.spec.ts` — the suite
- `e2e/fixtures/dac7-seed.ts` — DB assertions + appointment shaping helpers

Two real defects were found by writing these, both fixed:

| Defect | Symptom | Fix |
|---|---|---|
| **`markBusinessDeleted` never stamped anything** | After account deletion `sourceDeletedAt` stayed `null`, so a purged business looked live in the CRM | TypeORM renders a bare `null` in a criteria object as `= NULL`, which matches no rows. Replaced with `IsNull()` |
| **`dac7_*` missing from the e2e truncate list** | Rows survived between runs; because `RESTART IDENTITY` recycles appointment ids, a new run read a *previous* run's activity as its own and asserted the wrong quarter | Added `dac7_activity` / `dac7_seller` to `admin-api/test/e2e-truncate.ts` |

> The second one is worth remembering: **nothing in production deletes these tables** — that is the entire point of them — so tests are the only place that must clean them explicitly.

### Seeding approach

Appointments are created through the same `POST /api/appointments/admin-create` the dashboard uses, then their `bookingSource` (and, for bundle/composite cases, their snapshots) are rewritten directly in the test DB. Driving the full customer-side marketplace booking flow would test the *booking* flow; what matters here is that a marketplace-sourced completed appointment produces the right rows. Status changes go through the real `PUT /api/appointments/:id`, which is what fires the hook.

Because the hook is fire-and-forget, assertions poll (`waitForActivities`, `waitForStatus`) rather than sleeping.

### What the suite covers

| Group | Tests |
|---|---|
| Recording rules | marketplace+completed recorded · seller snapshot with company identity · PFA snapshot (CUI + date of birth) · admin/phone/walk-in ignored (3) · confirmed and cancelled not recorded |
| Per-service expansion | discounted 3-service bundle → 3 rows apportioned `[4000, 2400, 1600]` summing to 8000 · composite (2 services + 2-service bundle) → 4 rows · quarter/year derived across Q1–Q4 |
| Corrections | un-completing voids (not deletes) · re-completing reactivates the same row id, no duplicate · cancelling after completion voids |
| Deletion survival | appointment row gone, activity + identity + totals retained, `sourceDeletedAt` stamped |

### Verified directly in the database

After the run, querying `zavoia_test_db` confirms the ledger holds what it should:

```
Bundle apportionment   Tuns 4000 · Spalat 2400 · Coafat 1600     (sums to 8000 ✓)
Composite expansion    Manichiura · Pedichiura · Masaj · Masca   (4 rows ✓)
Quarters               2026-02-10→Q1  2026-05-20→Q2  2026-07-01→Q3  2026-12-31→Q4
Voided rows            data intact, reason "appointment status=cancelled source=marketplace"
Deleted account        legalName/fiscalCode/address/ownerEmail retained, marked=true
Orphaned activity      appointment row gone, activity still present and active
Integrity              0 activities without a seller · 0 duplicate (appointment,itemIndex)
```

The orphan row is the point of the whole design: the appointment no longer exists, and the reportable activity does.

## 7. Further scenarios (not yet implemented)

The suite lives in `admin-dashboard/e2e` (chromium, `workers: 1`, real `admin-api` + test DB on **port 5433**, `zavoia_test_db`). DAC7 assertions must hit the **real database** via `withTestDb` from `e2e/fixtures/test-db.ts` — mocking the API would prove nothing, since the whole feature is a database side-effect.

Suggested location: `e2e/dac7/`, with a `e2e/fixtures/dac7-seed.ts` following the pattern of `reconciliation-seed.ts` (seed through the same HTTP endpoints the dashboard calls; touch the DB only to assert).

### Helper to add

```ts
// e2e/fixtures/dac7-seed.ts
export async function dac7ActivitiesForAppointment(appointmentId: number) {
  return withTestDb(async (c) => {
    const res = await c.query(
      `SELECT * FROM dac7_activity WHERE "sourceAppointmentId" = $1 ORDER BY "itemIndex"`,
      [appointmentId],
    )
    return res.rows
  })
}

export async function dac7SellerFor(businessId: number, year: number) {
  return withTestDb(async (c) => {
    const res = await c.query(
      `SELECT * FROM dac7_seller WHERE "sourceBusinessId" = $1 AND "reportingYear" = $2`,
      [businessId, year],
    )
    return res.rows[0] ?? null
  })
}
```

### 7.1 Recording — implemented, see §6

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | **Marketplace + completed → recorded** | Seed business with a marketplace booking; mark it completed in the calendar UI | 1 `dac7_activity` row, `status='active'`, `considerationMinor` = appointment price, `activityDate` = scheduled date |
| 2 | **Admin-created appointment → ignored** | Create an appointment from the dashboard, complete it | **0** rows for that appointment |
| 3 | **Phone / walk-in → ignored** | Same with `bookingSource` `phone` and `walk_in` | 0 rows each |
| 4 | **Pending / confirmed → not yet recorded** | Marketplace booking left confirmed | 0 rows |
| 5 | **Cancelled / no-show → not recorded** | Marketplace booking → cancelled | 0 rows |
| 6 | **Seller snapshot created** | After scenario 1 | `dac7_seller` row exists for (businessId, year) with `legalName`, `fiscalCode`, `countryCode` copied from the business's billing identity |

### 7.2 Per-service expansion — implemented, see §6

| # | Scenario | Expected |
|---|---|---|
| 7 | **Single service** | 1 row, `itemIndex = 0` |
| 8 | **Bundle of 3 services** | **3** rows, `itemIndex` 0/1/2, each with its own `serviceName` |
| 9 | **Bundle price ≠ sum of parts** | `SUM(considerationMinor) = appointment.price` exactly (the apportionment invariant) |
| 10 | **Composite / merged run of 2 services + 1 bundle of 2** | **4** rows |
| 11 | **Quarter derivation** | Appointment on 2026-02-10 → `reportingQuarter = 1`; on 2026-07-01 → `3`; on 2026-12-31 → `4` |
| 12 | **Currency preserved** | Business priced in EUR → `currency = 'eur'`, no conversion applied |

> The apportionment invariant in #9 is the single most valuable assertion in the suite — it is what keeps reported totals from drifting away from what the customer was quoted.

### 7.3 Corrections — implemented, see §6

| # | Scenario | Expected |
|---|---|---|
| 13 | **Un-complete an appointment** | Completed → confirmed: all rows become `status='voided'`, `voidedAt` set, `voidedReason` populated. Rows are **not deleted** |
| 14 | **Re-complete it** | Rows return to `status='active'`, `voidedAt` cleared; **row count unchanged** (no duplicates) |
| 15 | **Idempotency** | Trigger the completion twice (repeat the request) | Still exactly N rows — the `(sourceAppointmentId, itemIndex)` unique index holds |
| 16 | **Cancel after completion** | Rows voided, not deleted |

### 7.4 Deletion survival — implemented, see §6

| # | Scenario | Expected |
|---|---|---|
| 17 | **Delete the business account** | After `purgeBusiness`: `dac7_seller` and `dac7_activity` rows **still exist** |
| 18 | **Deletion marker** | `dac7_seller.sourceDeletedAt` is set; identity fields (`legalName`, `fiscalCode`, `address`, `ownerEmail`) are **still readable** |
| 19 | **Appointment is gone but activity remains** | `SELECT FROM appointment WHERE id = X` → 0 rows; `dac7_activity` for that id → still present |
| 20 | **Totals unchanged** | `SUM(considerationMinor)` for the seller is identical before and after deletion |

Scenario 17–20 are the ones to run before any release that touches `account-deletion.service.ts`. A regression there is silent and unrecoverable.

### 7.5 CRM surface — API-level (still to write)

The CRM app (`admin-crm`) has **no Playwright project**; adding one is optional. Until then, cover the endpoints with `request` calls from the existing suite using an admin session:

| # | Scenario | Expected |
|---|---|---|
| 21 | `GET /admin-crm/dac7/sellers?search=<CUI>` | Finds the seller by fiscal code |
| 22 | `?deleted=true` | Returns only sellers whose account was deleted — the ANAF-query view |
| 23 | `?deleted=false` | Excludes them |
| 24 | `GET /dac7/sellers/:id` | `quarters[]` totals match the sum of that seller's active activities |
| 25 | `includeVoided=false` (default) | Voided rows excluded from counts and totals |
| 26 | `GET /dac7/export` | `content-type: text/csv`, body starts with a UTF-8 BOM, header row matches the documented column list, row count = active activities for the filter |
| 27 | **CSV injection** | A service or business name starting with `=` is exported prefixed with `'` |
| 28 | **Unauthenticated** | All five endpoints return 401 without an admin session |

### 7.6 What not to test

- Whether Zavoia is in scope for DAC7 — a legal question, not a code path.
- F7000 XML generation and submission — **not implemented yet** (see below).

---

## 8. Not implemented yet

| Item | Note |
|---|---|
| F7000 XML/PDF generation + submission | Export is CSV staging only. Real filing goes through DUKINTEGRATOR → e-guvernare.ro with a qualified certificate |
| Annual seller statement | DAC7 requires sending each reported seller their own copy, **also by 31 January** |
| Data-request + 2 reminders + 60-day restriction flow | Statutory escalation when a seller does not supply their data |
| Retention job | 5–10 year prune after the reporting period |
| RON conversion | Stored in native currency by design; conversion is a filing-time decision |
| Platform-fee mapping | `platformFeeMinor` is hardcoded `0`; the memo should confirm a flat subscription is not a reportable per-activity fee |
| Privacy Notice entry | The retention of DAC7 data after account deletion must be stated there |
| `legal_seller_id` divergence | Today seller = business. The column exists so a franchise or in-salon professional can differ later |
