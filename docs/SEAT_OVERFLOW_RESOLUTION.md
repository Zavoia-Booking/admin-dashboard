# Seat Overflow Resolution Feature

## Overview

The **Seat Overflow Resolution** feature handles the scenario when a business owner reduces their team member seat count via subscription modification, but at the end of the billing period, the actual number of team members exceeds the newly paid seat count. This feature blocks the application UI and guides the owner through removing a team member while ensuring their appointments are properly handled.

## The Problem: Seat Overflow

### How Seat Overflow Occurs

1. **Business has subscription**: Base plan + 5 paid team member seats
2. **Owner schedules seat reduction**: Reduces to 4 seats (via billing settings)
3. **Reduction scheduled**: Stripe creates a subscription schedule; change takes effect at period end
4. **Period end arrives**: Stripe fires `customer.subscription.updated` webhook
5. **`paidTeamSeats` decreases**: Backend updates to 4
6. **Overcapacity detected**: `usedSeats (5) > paidSeats (4)` — **seat overflow**

### Why This Matters

- **Billing compliance**: The business is no longer entitled to maintain 5 team members at their current plan level
- **Legal/contractual**: The subscription agreement only covers 4 seats
- **Data integrity**: Cannot allow violations of the subscription terms

---

## Use Cases

### Use Case 1: Owner Reduces Seats to Downgrade Plan

**Scenario:**
- Owner has 5 team members and 5 paid seats
- Owner wants to reduce costs, schedules reduction to 3 seats
- At period end, reduction takes effect
- Owner now has 5 team members but only 3 paid seats

**User Flow:**
1. Owner logs in → sees `SeatOverflowGate` blocking the dashboard
2. Gate shows: "Your plan includes 3 seat(s), but you have 5 active team members"
3. Owner selects which team member to remove (e.g., "John Smith")
4. Gate shows John's 3 upcoming appointments:
   - Monday: Haircut @ Main Location (2:00 PM)
   - Wednesday: Coloring @ Main Location (10:00 AM)
   - Friday: Styling @ Downtown Location (4:00 PM)
5. Owner reassigns Monday appointment to "Sarah" (who can perform services at Main Location)
6. Owner reassigns Wednesday appointment to "Sarah"
7. Owner cancels Friday appointment (customer will be notified)
8. Owner confirms → John is removed, appointments handled, gate disappears

**Outcome:**
- Business now compliant: 4 active team members ≤ 3 paid seats
- Customers aren't left without appointments
- Services continue without interruption

---

### Use Case 2: Owner Cancels Subscription Entirely

**Scenario:**
- Owner has 3 team members and 3 paid seats
- Owner cancels subscription (marks `cancel_at_period_end = true`)
- At period end, subscription status changes to `canceled`
- `paidTeamSeats` remains 3 in the database (intentional, for renewal UX)
- BUT subscription is no longer active → different gate (`SubscriptionGate`) blocks access

**Why Seat Overflow Gate Doesn't Apply:**
- Seat overflow gate only shows when `isEntitled === true` (subscription is active)
- If subscription is expired/canceled, `SubscriptionGate` (z-[200]) blocks the page instead
- Seat overflow (z-[210]) is reserved for active subscriptions with overcapacity

---

### Use Case 3: Owner Has Free Trial, Trial Expires

**Scenario:**
- Owner in trial: unlimited team members allowed
- Owner has 8 team members (no seat payment yet)
- Trial period ends
- `entitlements.entitled = false` (trial expired)
- `SubscriptionGate` blocks access (payment issue, not seat overflow)

**Why Not Seat Overflow:**
- Trial subscriptions don't have a `paidTeamSeats` value (unlimited during trial)
- When trial expires, the subscription gate handles it (expired/payment required)
- Not a seat overflow scenario

---

### Use Case 4: Owner Accidentally Invited Too Many, Now Needs to Remove

**Scenario:**
- Owner has 4 paid seats
- Owner invited 5 team members during a busy period
- Invitation system should have blocked this, but somehow 5 accepted
- Now `usedSeats (5) > paidSeats (4)`

**User Flow:**
1. Owner is blocked by `SeatOverflowGate`
2. Selects one of the 5 to remove
3. Follows the same flow: reassign/cancel appointments, confirm removal
4. Gate disappears, business is compliant

---

### Use Case 5: Team Member Quit, Pending Appointments

**Scenario:**
- Employee resignation → need to remove immediately
- Owner doesn't want to wait for period end
- Team member has 10 upcoming appointments scheduled

**Manual Workflow (if needed before seat overflow triggers):**
- Owner goes to Team Members page
- Tries to remove member via "Remove from Organisation"
- System blocks: "Team member has 7 appointments" (cannot delete)
- Owner must reassign appointments first OR wait for `SeatOverflowGate` to force the issue

**With Seat Overflow:**
- If owner also reduced seats → `SeatOverflowGate` forces resolution
- Owner must handle all appointments before removal

---

## Component Architecture

### SeatOverflowGate (`SeatOverflowGate.tsx`)

**Location:** `src/features/teamMembers/components/SeatOverflowGate.tsx`

**Responsibility:**
- Detects when `usedSeats > paidSeats && isEntitled === true`
- Renders 2-step wizard modal (z-[210], above `SubscriptionGate`)
- Manages local state for member selection and appointment actions
- Dispatches `offboardTeamMemberAction` when confirmed

**Show Condition:**
```typescript
const shouldShow =
  currentUser?.role === UserRole.OWNER &&        // Only for business owners
  isEntitled === true &&                          // Subscription is active
  paidSeats > 0 &&                                // Has a real paid plan
  usedSeats > paidSeats;                          // Overcapacity detected
```

**Z-index Strategy:**
- `SeatOverflowGate`: z-[210] (top layer)
- `SubscriptionGate`: z-[200] (expired/payment issue)
- When both conditions true (edge case): SeatOverflowGate shows on top

---

### Two-Step Wizard Flow

#### Step 1: Select Member to Remove

**Display:**
- Grid of team member cards (excludes OWNER role)
- Each card shows: avatar, name, email
- Single-select highlighting
- "Next" button (disabled until selection made)

**On Next Click:**
- Fetches upcoming appointments for selected member
  - Query: `POST /appointments/list` with `{ teamMember: memberId, status: ['pending', 'confirmed'] }`
  - Filters for upcoming appointments (scheduled_at > now)
- Fetches location context for each appointment's location
  - Query: `GET /calendar/location-context/:locationId` (for service.staffIds)
- **If 0 appointments:**
  - Skips Step 2 entirely
  - Directly dispatches `offboardTeamMemberAction` with empty reassignments
  - Removes member immediately, gate disappears on success
- **If > 0 appointments:**
  - Transitions to Step 2
  - Initializes `appointmentActions` map with all IDs → null (force explicit selection)

#### Step 2: Reassign/Cancel Appointments

**Display:**
- List of appointment cards (upcoming, pending/confirmed only)
- Each card shows: service name, date/time, customer name
- Staff picker dropdown for each appointment
  - Filtered by: `service.staffIds` ∩ `locationTeamMembers` (who can perform the service)
  - Excludes the member being removed
  - Shows availability status (optional, for UX clarity)
- "Will cancel" / "Will reassign" indicator per appointment
- Back button → returns to Step 1
- "Confirm & Remove Member" button

**Staff Picker Filtering:**
```typescript
// Get the service for this appointment
const service = locationContext.services.find(s => s.serviceId === appointment.serviceId);

// Get eligible staff: those who can perform the service at this location
const eligibleStaff = service?.staffIds ?? [];

// Map to team member objects, filter out the removed member
const selectableStaff = locationTeamMembers.filter(
  member => eligibleStaff.includes(member.userId) && member.userId !== selectedMember.id
);
```

**Reassignment Logic:**
- If staff selected: `appointmentActions.set(appointmentId, newStaffUserId)`
- If "Cancel" checked: `appointmentActions.set(appointmentId, null)`
- All appointments must have an action (no "leave unassigned" option)

**On Confirm:**
- Dispatches `offboardTeamMemberAction.request({ id, appointmentActions })`
- Saga processes actions → calls API → refreshes subscription + team list
- Gate disappears when `usedSeats <= paidSeats` after refresh

---

## Backend API

### Endpoint: `POST /team-members/:id/offboard`

**Purpose:** Atomically handle appointment reassignment/cancellation, unlink staff from services/locations, and remove team member

**Request Body:**
```json
{
  "appointmentActions": [
    { "appointmentId": 101, "newStaffUserId": 5 },   // Reassign to staff #5
    { "appointmentId": 102, "newStaffUserId": null }, // Cancel
    { "appointmentId": 103, "newStaffUserId": 7 }
  ]
}
```

**Authorization:**
- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@Roles(UserRole.OWNER)` — only business owners
- `@AllowExpiredWrite()` — works even if subscription expired (edge case)

**Flow:**
1. **Validate**: Member exists, is not OWNER, belongs to business
2. **Prevent self-removal**: Compare `id` parameter against `user.id`
3. **Process appointments**:
   - For each action:
     - If `newStaffUserId` is null: call `appointmentService.cancelAppointment(appointmentId, 'Staff member removed - seat overflow resolution')`
     - Otherwise: call `appointmentService.updateWithRelations(appointmentId, { staff_users: [{ id: newStaffUserId }] })`
   - No working-hour checks (via `updateWithRelations`, not standard update)
   - No conflict checks (staff is being reassigned to same time slot; if conflicts, `overrideConflicts` is implicit)
4. **Unlink from services**:
   - Call `usersService.removeAllServiceAssignmentsForBusiness(id, businessId)`
   - Deletes all `user_service_location` rows where userId matches and location belongs to business
5. **Unlink from locations**:
   - Fetch team member's locations via `findTeamMemberById`
   - For each location: call `usersService.removeUserFromLocation(id, locationId)`
6. **Remove team member**:
   - Call `teamService.remove(businessId, id)`
   - Deletes UserRole, cleans tokens, sends removal email
7. **Return**: `{ message: 'TEAM.S05' }`

**Error Handling:**
- CustomException errors: re-thrown with appropriate status codes
- Generic errors: 500 with `TEAM.E13` message code
- Appointment update failures: transaction partially rolls back; recommend retry

---

### Supporting Service Methods

#### `UsersService.removeAllServiceAssignmentsForBusiness(userId, businessId)`

**Purpose:** Unlink a team member from all their service assignments within a business

**Implementation:**
```typescript
async removeAllServiceAssignmentsForBusiness(userId: number, businessId: number): Promise<void> {
  await this.userServiceLocationRepository
    .createQueryBuilder()
    .delete()
    .from(UserServiceLocation)
    .where('userId = :userId', { userId })
    .andWhere(
      'locationId IN (SELECT id FROM location WHERE "businessId" = :businessId)',
      { businessId }
    )
    .execute();
}
```

**Query Logic:**
- Deletes all rows from `user_service_location` where:
  - `userId` matches
  - `locationId` belongs to the business (via subquery)
- This removes the staff member from all service assignments at all business locations

---

## Data Flow Diagrams

### Happy Path: Seat Overflow Detected → Removed Successfully

```
[Subscription Updated Webhook]
          ↓
[Stripe: paidTeamSeats reduced]
          ↓
[usedSeats > paidSeats detected]
          ↓
[SeatOverflowGate Mounts]
    ↓         ↓
[Step 1]   [Step 2]
  Select    Reassign/
  Member    Cancel
    ↓         ↓
  [Confirm]
    ↓
[offboardTeamMemberAction.request]
    ↓
[Backend: POST /team-members/:id/offboard]
    ↓
[Update Appointments → Remove Services → Remove Locations → Delete UserRole]
    ↓
[Success Response]
    ↓
[Saga: getSubscriptionSummaryAction.request() + listTeamMembersAction.request()]
    ↓
[Redux State Updated: usedSeats <= paidSeats]
    ↓
[Gate Show Condition False → Gate Disappears]
    ↓
[User can access dashboard]
```

### Edge Case: 0 Appointments (Skip Step 2)

```
[SeatOverflowGate: Step 1]
    ↓
[Select Member + Click Next]
    ↓
[Fetch Appointments for Member]
    ↓
[Empty List Returned]
    ↓
[Dispatch offboardTeamMemberAction Immediately]
    ↓ [Skip Step 2]
[Backend: offboardTeamMemberAction]
    ↓
[Success → Gate Disappears]
```

---

## Error Scenarios & Recovery

### Scenario: Staff Member Cannot Perform Service

**Problem:**
- Owner tries to reassign appointment to a staff member
- That staff member doesn't have the service enabled

**Current Behavior:**
- Backend's `appointmentService.updateWithRelations` validates this
- If validation fails, returns 400 error
- Frontend toast shows error message
- Saga dispatches failure action, user can retry

**Recovery:**
- User must select a different staff member
- OR cancel the appointment instead

---

### Scenario: Network Error During Offboard

**Problem:**
- API call to `POST /team-members/:id/offboard` fails mid-operation
- Some appointments reassigned, but removal incomplete

**Current Behavior:**
- Backend transaction should roll back (depending on database isolation level)
- Frontend receives error
- User can retry

**Improvement Needed:**
- Ensure appointment reassignment is wrapped in a transaction with member removal
- If any step fails, all changes roll back

---

### Scenario: Subscription Re-activated During Offboard

**Problem:**
- Owner initiates offboard with seat overflow
- Meanwhile, subscription is renewed/upgraded (seats increased)
- Now `usedSeats <= paidSeats`, but offboard is in flight

**Current Behavior:**
- Offboard completes anyway (member removed)
- Subscription refresh shows no overflow
- Gate disappears (correct)

**Edge Case:**
- If this happens frequently, consider adding a pre-flight check

---

## Testing Checklist

### Unit Tests

- [ ] `selectIsOffboarding` selector returns correct boolean
- [ ] `offboardTeamMemberAction` creates correct action payload
- [ ] `offboardTeamMemberApi` makes correct POST request

### Integration Tests (Backend)

- [ ] `POST /team-members/:id/offboard` with 0 appointments → member removed, no errors
- [ ] `POST /team-members/:id/offboard` with appointments → appointments reassigned, member removed
- [ ] `POST /team-members/:id/offboard` with cancelled appointments → appointments cancelled, member removed
- [ ] Attempting offboard on OWNER role → 403 Forbidden
- [ ] Attempting offboard with non-existent member → 404 Not Found
- [ ] Attempting offboard by non-OWNER → 403 Forbidden

### Integration Tests (Frontend)

- [ ] Gate shows when `usedSeats > paidSeats && isEntitled`
- [ ] Gate hides when `usedSeats <= paidSeats`
- [ ] Gate hides for non-OWNER roles
- [ ] Step 1: OWNER members filtered out
- [ ] Step 1: Selecting member fetches appointments
- [ ] Step 1 → Step 2: With appointments, transitions
- [ ] Step 1 → Offboard: With 0 appointments, skips Step 2
- [ ] Step 2: Staff picker only shows eligible staff
- [ ] Step 2: Can toggle appointments between reassign and cancel
- [ ] Step 2: Back button returns to Step 1
- [ ] Step 2: Confirm button dispatches action and shows loading state
- [ ] Gate disappears on successful offboard
- [ ] Toast shows success message
- [ ] Subscription summary refreshes (usedSeats updates)
- [ ] Team members list refreshes

### E2E Tests (Manual)

1. **Setup**: Create business with 3 paid seats, 3 team members with upcoming appointments
2. **Action**: Reduce seats to 2 via billing settings
3. **Expected**: Gate blocks dashboard
4. **Action**: Select a member to remove
5. **Expected**: Step 2 shows their appointments
6. **Action**: Reassign 1 appointment, cancel 1 appointment
7. **Expected**: Button shows loading state
8. **Expected**: Success toast appears
9. **Expected**: Gate disappears
10. **Expected**: Team members page shows 2 remaining members
11. **Expected**: Cancelled appointment is gone; reassigned appointment shows new staff member

---

## Future Enhancements

### 1. Batch Offboarding

Currently: One member at a time
Future: Allow selecting multiple members to remove (if overflow > 1)

### 2. Appointment Conflict Resolution

Currently: Staff picker shows all eligible staff without real-time conflict check
Future: Show availability per staff member in the picker (green = available, amber = conflict)

### 3. Automatic Reassignment Suggestions

Currently: Owner must manually pick staff
Future: AI-suggest the best staff based on availability, skill fit, workload

### 4. Notification to Removed Member

Currently: Removal email sent, but no pre-removal notification
Future: Send email 7 days before action: "Your seat is expiring, owner is reviewing options"

### 5. Undo Period

Currently: Member is immediately removed
Future: 24-hour "undo" period where owner can restore member if they upgrade their plan

---

## Configuration

### Feature Flags (If Needed)

```typescript
// In feature config
{
  seatOverflowGateEnabled: true,
  seatOverflowAutoResolution: false,  // Auto-pick first eligible staff if true
  appointmentReassignmentNotifyCustomer: true
}
```

### Message Codes Used

- `TEAM.S05` — Team member offboarded successfully
- `TEAM.E13` — Failed to remove team member (generic error)
- Custom toast messages via i18n: `teamMembers:seatOverflow.*`

---

## Related Features

- **[SUBSCRIPTION_SYSTEM.md](./SUBSCRIPTION_SYSTEM.md)** — How subscription changes flow and seat counts update
- **Team Member Management** — Removing members manually (different from offboarding)
- **Appointment Reassignment** — Existing `AddAppointmentSlider` pattern reused for staff picker
- **Calendar Context** — Location services and staff availability via `GET /calendar/location-context/:locationId`

---

## Glossary

| Term | Definition |
|------|-----------|
| **Seat Overflow** | `usedSeats > paidSeats` — more active team members than paid subscription allows |
| **Offboard** | Process of reassigning/cancelling a team member's appointments and removing them |
| **Eligible Staff** | Team members who can perform a service at a location (per service.staffIds) |
| **SeatOverflowGate** | Full-screen modal overlay blocking dashboard during seat overflow |
| **Step 1** | Select which team member to remove |
| **Step 2** | Reassign or cancel that member's upcoming appointments |
| **paidTeamSeats** | Count of team member seats purchased in current subscription |
| **usedSeats** | Count of active (non-OWNER) team members in the business |

