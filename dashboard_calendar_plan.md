# Dashboard Calendar — Product Functionality Plan (Location-First, Hard-Boundary)

> **Context:** You’re building an appointments marketplace (customer mobile app) + a business dashboard app.  
> This document focuses on the **business dashboard calendar** and the product behaviors it must support.

---

## 0) Executive Summary

The dashboard calendar is designed around a **single-location scope** to avoid a “spaghetti view.”  
Every calendar view, filter, and action happens **within exactly one selected location at a time**.

The system supports both business types:
- **Location-only businesses** (no team members): customers book the **location**.
- **Team-enabled businesses** (with staff): customers can book either:
  - the **location** (unassigned booking), or
  - a **specific staff member**.

The calendar enforces a strict **hard boundary**:
- **Location Working Hours are mandatory and absolute.**
- **Staff cannot extend or override location working hours.**

Unassigned bookings are a **first-class workflow** even when staff exist.

Capacity is **dynamic** in team-enabled mode:
- For a given **location + service + timeslot**, effective capacity is based on **eligible staff availability**.
- Admins can **override** capacity/conflict constraints with explicit reason and audit trail.

---

## 1) Golden Rules (Product Principles)

### 1.1 Location Scope
1. **Single Location Scope:** The calendar always displays **exactly one location**.  
   There is **no** “All Locations” combined grid view.
2. **Location Selector is persistent:** Switching location fully changes the context and data shown.

### 1.2 Working Hours (Hard Boundary)
3. **Hard Boundary:** Location working hours are **absolute**.  
   - Appointments must be scheduled within open hours.
   - Staff availability exists only within the location’s open window.
4. **No staff override:** Staff do **not** have separate working hours and cannot extend location hours (for now).

### 1.3 Hybrid Capability (Staff Optional + Unassigned Allowed)
5. **Staff is optional:** A location can operate with **0 staff** or **N staff**.
6. **Unassigned bookings allowed even when staff exist:**  
   - “Unassigned” is a valid appointment type.
   - Unassigned bookings can later be assigned to any eligible staff member.

### 1.4 Capacity + Conflicts + Overrides
7. **Capacity in staff-enabled mode is dynamic:**  
   Effective capacity depends on **eligible staff** for the service and their **availability** in that timeslot.
8. **Admin overrides allowed:** Admins can intentionally exceed capacity or override conflicts, but it must be explicit, permissioned, and auditable.

### 1.5 Timezone
9. **Times display in location timezone:** Calendar UI is rendered in the selected location’s timezone.

---

## 2) Key Concepts & Definitions

### 2.1 Appointment Target Types
Appointments always belong to a location, and can be:
- **Location-target (Unassigned):** No staff member is selected.  
  Used for location-only businesses, or as a “pool booking” when staff exists.
- **Staff-target (Assigned):** A specific staff member is selected.

### 2.2 Eligibility (for capacity & assignment)
A staff member is **eligible** for a booking if:
- They are assigned to the selected location, and
- They offer the selected service/bundle, and
- They are not blocked/time-off and not already booked for the given timeslot.

### 2.3 Working Hours, Blocks, and Exceptions
- **Working Hours (baseline):** Mandatory per location (set during onboarding and on location creation).
- **Location Blocks:** Prevent any booking at that location during open hours (exceptions).
- **Staff Blocks / Time Off:** Prevent booking that staff member during open hours (exceptions).
- **Closed Hours:** Not bookable by default (hard boundary), so blocks are typically unnecessary there.

---

## 3) Scope Container (Global Context)

### 3.1 Location Selector (Top Bar)
**Functionality**
- Always visible on the calendar screen.
- If the business has:
  - **1 location:** auto-select it.
  - **multiple locations:** default to last selected location (per user).

**Behavior**
- Switching location triggers a full refresh of:
  - appointments, blocks, time off
  - staff list for that location
  - services/bundles available at that location
  - location working hours

**Constraint**
- The system must enforce: **no combined multi-location schedule grid**.

**Quality of Life (Recommended)**
- Persist per-location UI state (view type, filters, selected date) to reduce friction.

---

## 4) Visualizing the Hard Boundary (Working Hours)

### 4.1 Calendar Rendering
- **Open Hours:** interactive scheduling area.
- **Closed Hours:** greyed/non-interactive area.

### 4.2 Interaction Rules
- Clicking closed hours does nothing (or shows a message: “Business is closed”).
- Creating/moving an appointment into closed hours is rejected with a clear error.
- Dragging into closed hours should **revert** (avoid silent snapping that changes time unexpectedly).

---

## 5) Views & Layouts (Inside One Location)

### 5.1 Day View (Ops Mode)
- **If staff exist:** show columns per staff member + **Unassigned lane/column**.
- **If no staff:** single wide column for the location.

### 5.2 Week View (Planning Mode)
- Shows Mon–Sun inside the selected location.
- If many staff exist, Week View may be staff-filtered on smaller screens for readability.

### 5.3 Agenda/List View (Mobile Mode)
- Chronological list of bookings for a selected day.
- Should clearly label:
  - Unassigned vs assigned bookings
  - status (confirmed/cancelled/etc.)
  - staff member (if assigned)

### 5.4 Navigation
- Today button
- Next/previous day/week
- Date picker jump

---

## 6) Appointment Lifecycle (Actions)

### 6.1 Create Manual Appointment (Phone/Walk-in)
**Trigger**
- Tap/click empty slot or “New booking”.

**Minimum Inputs**
- Customer: search existing or create new
- Service/bundle
- Time (must be inside open hours)
- Optional: staff assignment if staff exist
- Notes (internal)

**Behavior**
- If staff exist:
  - Can create as **Unassigned** or **Assigned**.
- If no staff:
  - Always location-target (the location is the resource).

### 6.2 Edit / Reschedule
**Supported Changes**
- Change time/date
- Change service/bundle
- Assign or reassign staff (if staff exist)
- Update customer info and notes

**Validation Order**
1. Inside location working hours (primary)
2. Location-level constraints (blocks/capacity)
3. Staff-level constraints (if assigned)

### 6.3 Cancel / No-show / Completed
**Statuses**
- Confirmed
- Cancelled (keep record; don’t delete)
- No-show (phase-based if needed early)
- Completed (phase-based if needed early)

**Cancellation Reason (Recommended)**
- Optional but structured:
  - customer cancelled
  - business cancelled
  - duplicate/mistake
  - other (free text)

### 6.4 Appointment Detail Drawer (Core UX)
When opening an appointment, show a drawer/panel with:
- Customer card (name, phone, history shortcut)
- Service/bundle + price snapshot
- Assigned staff (or Unassigned)
- Status controls
- Actions: reschedule, edit, cancel, assign/reassign
- (Phase 2) history/logs: who changed what, when

---

## 7) Hybrid Logic (Unassigned vs Assigned)

### 7.1 Unassigned Lane (First-Class Workflow)
**Where it appears**
- Only when staff exist at the selected location.

**What it supports**
- Display of all unassigned bookings at that location/day/week
- Assign to staff:
  - drag/drop onto staff column, and/or
  - “Assign” action in appointment drawer
- Reschedule / Edit / Cancel
- Filters: “Unassigned only”
- Optional badge/counter: “Unassigned (N)”

### 7.2 Dynamic Capacity Model (Service/Timeslot-Based)
**Principle**
- Location has **capacity = 1 by default** for location-only (no staff) operation.

**When staff exist**
- Effective capacity for a timeslot is determined by:
  - **Eligible staff count for the selected service**
  - **Minus staff already booked or unavailable in that timeslot**
- Example:
  - 3 staff can perform Service X and are free at 10:00 → effective capacity at 10:00 is 3.
  - If 1 is booked and 1 is on lunch → effective capacity becomes 1.

**Unassigned bookings**
- Consume 1 unit of effective capacity.
- The system should prevent infinite stacking of unassigned bookings unless admin overrides.

### 7.3 Handling Staff Pool Changes (Operational Edge)
If staff availability changes after bookings exist (sick day, etc.):
- Existing bookings remain in the schedule,
- Calendar should surface “needs attention” signals (e.g., unassigned overload).

---

## 8) Blocking Time & Time Off (Availability Management)

### 8.1 Location Blocks (Global Exceptions)
**Purpose**
- “The whole location is unavailable” during otherwise open hours.

**Examples**
- emergency closure during open hours
- maintenance
- private event

**Visual**
- Full-width block spanning all columns (including Unassigned lane).

**Constraint**
- Must be within open hours (closed hours are already non-bookable).

### 8.2 Staff Blocks / Time Off (Personal Exceptions)
**Purpose**
- Location is open, but this staff member is unavailable.

**Examples**
- lunch
- sick
- training

**Visual**
- Block only in that staff member’s column.

**Notes**
- Because staff cannot override location hours, these blocks only matter within the open window.

---

## 9) Filters & Search (Location-Scoped)

### 9.1 Core Filters
- Staff: All vs specific staff member (if staff exist)
- Status: show/hide cancelled; optionally filter by status
- Unassigned: show only bookings needing assignment (if staff exist)
- Service/bundle filter
- Booking source filter: marketplace vs manual
- Customer search: name/phone/reference
- Quick time range (Agenda): Today / Tomorrow / Next 7 days (recommended)

### 9.2 Filter Behavior
- Filters apply only to the currently selected location.
- Reset filters action should be available.

---

## 10) Roles & Permissions (Dashboard)

### 10.1 Roles
- **Owner/Admin:** full access within selected location (view all, edit all, override).
- **Manager (optional):** similar visibility, configurable permissions.
- **Staff:** default view is own schedule; optional “open mode” visibility.

### 10.2 Permission Toggles (Common Needs)
- Staff can/can’t create manual appointments
- Staff can/can’t cancel appointments
- Staff can/can’t see customer phone/email
- Staff can/can’t view other staff schedules (restricted vs open mode)

---

## 11) Conflict & Override Handling (Explicit Admin Tool)

### 11.1 Normal Behavior (Non-admin)
- Prevent saving when:
  - outside open hours
  - location is blocked
  - capacity is exceeded
  - staff conflicts exist (if assigned)

### 11.2 Admin Override Behavior
Admins can override:
- Capacity constraints (overbook intentionally)
- Staff conflicts (optional separate toggle, recommended)
- (Optional later) out-of-hours bookings (not required now since hard boundary, but possible future toggle)

**Override UX Requirements**
- Show clear warning: “This slot is full / conflicts.”
- Admin-only button: “Override and Save”
- Capture reason (dropdown recommended, optional note)
- Mark the appointment visibly (badge: “Override/Overbooked”)
- Include in a filter (optional but useful): “Show overrides”

**Audit Trail (Strongly Recommended)**
- Who overrode
- When
- What rule was overridden (capacity / staff conflict)
- Reason

---

## 12) Settings Dependencies (Dashboard)

### 12.1 Location Setup Wizard (Mandatory)
On first account setup and on each new location creation:
- Location creation required
- Working hours required (Mon–Sun)
- Support:
  - closed days
  - split shifts
- Location timezone required (recommended)

### 12.2 Location Hours Management
- Edit weekly hours
- Set closed days
- Split shifts per day
- (Phase 3) date-specific schedule overrides (open late, close early)

### 12.3 Staff Assignment to Location
- Simple toggle/assignment: staff member is active at this location
- Staff list used for calendar columns and assignment actions

---

# Phased Delivery Plan

## Phase 1 — Strict MVP (Must Ship)
**Goal:** A usable, location-scoped calendar that supports manual bookings and basic operations.

### A) Scope & Working Hours
- Persistent location selector (single location context)
- Mandatory working hours per location enforced
- Calendar renders open vs closed hours (closed = non-interactive)

### B) Views
- Day View
  - Single column if no staff
  - Staff columns if staff exist (Unassigned lane optional in MVP UI, but unassigned must be supported as a state)
- Agenda/List View

### C) Appointment Actions
- Create manual appointment
  - within open hours
  - optional staff assignment if staff exist
  - allow Unassigned creation if staff exist
- Edit appointment time (basic reschedule)
- Cancel appointment (status-based, no deletion)

### D) Blocks
- Create location block (basic busy/closed exception during open hours)
- Create staff block/time off (basic busy/lunch)

### E) Filters (Basic)
- Status filter (hide cancelled)
- Staff filter (if staff exist)
- Customer search (recommended)

---

## Phase 2 — Operational Fluidity
**Goal:** Make day-to-day operations smooth for teams.

### A) Unassigned Workflow (First-Class UI)
- Unassigned lane/column (Day/Week)
- Unassigned-only filter + badge count
- Assign to staff:
  - drag/drop and/or drawer action
- SLA signal (optional): “Booked X hours ago, still unassigned”

### B) Interactions
- Drag & drop rescheduling
- Drag & drop staff reassignment (with validations)
- (Optional) Resize appointment if duration edits are allowed

### C) Status Expansion + History
- No-show status
- Completed status
- Activity history/logs visible in drawer (who changed/cancelled/overrode)

### D) Week View
- Week view for planning
- Staff filtering for week view on smaller screens

### E) Override Tooling
- Admin override for capacity and/or staff conflict
- Override reason capture + visible override badge
- Override events included in history

---

## Phase 3 — Automation & Advanced Scheduling
**Goal:** Reduce repetitive work and handle real-world scheduling patterns.

### A) Recurrence
- Recurring appointments (e.g., every Tuesday)
- Recurring blocks/time off (e.g., lunch daily at 12)

### B) Date-Specific Schedule Overrides
- Override normal weekly working hours for specific dates:
  - open late
  - close early
  - special open day

### C) Advanced Quality-of-Life (Optional)
- Saved filter presets
- Printable/exportable daily schedule
- “Needs attention” dashboards for overbooked/unassigned overload

---

## Appendix A — Suggested UI Modules (for Design Alignment)
- Calendar Screen (location picker, view switch, date nav, filters)
- Appointment Detail Drawer (the hub)
- Create/Edit Appointment Modal
- Create Block / Time Off Modal
- Unassigned Queue Panel (optional alongside lane)

---

## Appendix B — Checklist of Non-Negotiables
- Single location scope at all times
- Mandatory working hours per location + enforced hard boundary
- Staff cannot override location hours
- Unassigned bookings allowed even when staff exist
- Capacity is dynamic based on eligible staff availability
- Admin override exists, explicit + auditable
