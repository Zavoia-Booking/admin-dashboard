# Admin Dashboard Account Management API

Self-service account management endpoints for business dashboard users (owners and team members) to disable, reactivate, schedule deletion, or cancel deletion of their own accounts.

## Overview

### Scope Behavior

**OWNER role** (per-business):
- Actions only affect the OWNER role for the specific business the user is logged into
- Does NOT affect TEAM_MEMBER roles at other businesses
- User can still access other businesses where they are a team member

**TEAM_MEMBER role** (global):
- Actions affect ALL TEAM_MEMBER roles across ALL businesses
- User is removed from every business they work at as a team member
- Does NOT affect OWNER role if they have their own business
- Treated as a single "team member identity"

---

## Endpoints

### POST `/auth/account/deactivate`

Deactivates the user's account.

**Auth:** Bearer token required (JwtAuthGuard)

**Request:** No body required

**Success Response:**
```json
{
  "message": "ACCOUNT.S01",
  "ok": true
}
```

**Error Response (team members exist):**
```json
{
  "statusCode": 400,
  "message": "ACCOUNT.E04",
  "code": "needs_to_remove_team_members",
  "details": {
    "teamMemberCount": 3
  }
}
```

**Behavior:**
- OWNER: Sets `status = 'disabled'` for OWNER role at current business only
- OWNER: **Must remove all team members first** before deactivating
- TEAM_MEMBER: Sets `status = 'disabled'` for ALL TEAM_MEMBER roles globally

---

### POST `/auth/account/reactivate`

Reactivates a disabled account.

**Auth:** Bearer token required (JwtAuthGuard)

**Request:** No body required

**Response:**
```json
{
  "message": "ACCOUNT.S02",
  "ok": true
}
```

**Behavior:**
- OWNER: Sets `status = 'active'` for OWNER role at current business only
- TEAM_MEMBER: Sets `status = 'active'` for ALL TEAM_MEMBER roles globally

---

### POST `/auth/account/delete`

Schedules account deletion in 30 days.

**Auth:** Bearer token required (JwtAuthGuard)

**Request:** No body required

**Success Response:**
```json
{
  "message": "ACCOUNT.S03",
  "ok": true,
  "deletionScheduledAt": "2026-03-07T12:00:00.000Z"
}
```

**Error Response (team members exist):**
```json
{
  "statusCode": 400,
  "message": "ACCOUNT.E04",
  "code": "needs_to_remove_team_members",
  "details": {
    "teamMemberCount": 3
  }
}
```

**Behavior:**
- OWNER: Schedules deletion for OWNER role at current business only
- OWNER: **Must remove all team members first** before scheduling deletion
- TEAM_MEMBER: Schedules deletion for ALL TEAM_MEMBER roles globally
- Deletion date is set to 30 days from request time

---

### POST `/auth/account/cancel-delete`

Cancels a scheduled account deletion.

**Auth:** Bearer token required (JwtAuthGuard)

**Request:** No body required

**Response:**
```json
{
  "message": "ACCOUNT.S04",
  "ok": true
}
```

**Behavior:**
- OWNER: Cancels deletion for OWNER role at current business only
- TEAM_MEMBER: Cancels deletion for ALL TEAM_MEMBER roles globally

---

## Login Response Changes

The login endpoint (`POST /auth/login`) now includes account status flags when applicable:

```json
{
  "accessToken": "...",
  "csrfToken": "...",
  "user": { ... },
  "accountDisabled": true,
  "accountScheduledForDeletion": true
}
```

**Flags:**
- `accountDisabled: true` - Present when account status is `'disabled'`
- `accountScheduledForDeletion: true` - Present when `deletionScheduledAt` is set

**Note:** Disabled users can still log in to access the reactivate endpoint.

---

## /me Endpoint Changes

The `/auth/me` endpoint now returns additional account management fields:

```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "OWNER",
  "businessId": 456,
  
  "accountStatus": "disabled",
  "deletionScheduledAt": "2026-03-07T12:00:00.000Z",
  "accountDisabled": true,
  "accountScheduledForDeletion": true,
  
  ...
}
```

**New Fields:**
- `accountStatus` - Current status: `'active'`, `'pending_acceptance'`, or `'disabled'`
- `deletionScheduledAt` - ISO date when account will be deleted (if scheduled)
- `accountDisabled` - Boolean flag, `true` when status is `'disabled'`
- `accountScheduledForDeletion` - Boolean flag, `true` when deletion is scheduled

---

## Message Codes

| Code | Description |
|------|-------------|
| `ACCOUNT.S01` | Account deactivated successfully |
| `ACCOUNT.S02` | Account reactivated successfully |
| `ACCOUNT.S03` | Account deletion scheduled successfully |
| `ACCOUNT.S04` | Account deletion cancelled successfully |
| `ACCOUNT.E01` | Failed to update account status |
| `ACCOUNT.E02` | Account role not found |
| `ACCOUNT.E03` | Cannot perform this action on your account |
| `ACCOUNT.E04` | Must remove all team members before disabling/deleting account |

---

## Frontend Implementation Guide

### Settings Page Flow

1. **Check account status on page load:**
   - Call `GET /auth/me`
   - Check `accountStatus`, `deletionScheduledAt`, `accountDisabled`, `accountScheduledForDeletion`

2. **Display appropriate UI:**
   - If `accountDisabled === true`: Show "Account Disabled" banner with reactivate option
   - If `accountScheduledForDeletion === true`: Show warning with `deletionScheduledAt` date and cancel option
   - If active: Show disable/delete options

3. **Handle actions:**
   - Disable: `POST /auth/account/deactivate`
   - Reactivate: `POST /auth/account/reactivate`
   - Delete: `POST /auth/account/delete` (show confirmation with 30-day notice)
   - Cancel Delete: `POST /auth/account/cancel-delete`

4. **Handle team members check (OWNER only):**
   - If deactivate/delete returns `code: "needs_to_remove_team_members"`:
     - Show message: "You must remove all team members before disabling or deleting your account"
     - Display `details.teamMemberCount` to show how many team members need to be removed
     - Link user to Team Management page to remove team members

### Login Flow

1. After successful login, check response for:
   - `accountDisabled`
   - `accountScheduledForDeletion`

2. If either flag is present:
   - Show appropriate warning/banner
   - Allow user to navigate to settings to manage their account

### Example Scenarios

**Scenario 1: User is OWNER of Business A, TEAM_MEMBER at Business B**
- Logged in as OWNER to Business A → deactivate → Only OWNER role for Business A is disabled
- Can still log in as TEAM_MEMBER to Business B

**Scenario 2: User is TEAM_MEMBER at Business B and Business C**
- Logged in as TEAM_MEMBER → deactivate → TEAM_MEMBER roles at BOTH B and C are disabled
- If also OWNER of Business A, that role is unaffected

---

## Error Handling

All endpoints follow standard error response format:

```json
{
  "statusCode": 400,
  "message": "ACCOUNT.E02",
  "error": "Bad Request"
}
```

Handle these error codes appropriately in the UI.
