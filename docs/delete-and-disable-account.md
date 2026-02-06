# Delete and Disable Account

This document explains how **Deactivate account** (disable) and **Delete account** work in the marketplace app: where they live in the UI, which APIs they call, and what happens on login when an account is disabled or scheduled for deletion.

---

## 1. Deactivate Account (Disable)

### What it does

- Marks the account as **inactive** (disabled).
- **Data is preserved.** The user can log in again later and reactivate; no data is removed.

### Where it lives

- **Screen:** Login & Security (`app/login-security.tsx`)
- **Entry:** “Deactivate account” row under the “Account” section, subtitle: “Temporarily disable your account”.

### User flow

1. User taps “Deactivate account”.
2. Alert: “Your account will be marked as inactive. You can reactivate it anytime by simply logging back in with your credentials. All your data will be preserved.”
3. User confirms with “Deactivate” (destructive).
4. App calls **deactivate** API, then **logs the user out** and navigates to `/(tabs)`.

### API

| Method | Endpoint | Response |
|--------|----------|----------|
| POST   | `/marketplace/customer/deactivate` | `{ ok: boolean }` |

- **Hook:** `useDeactivateAccount()` from `@/features/customer` (wraps `customerApi.deactivateAccount()`).

### Reactivation (when account is disabled)

- **No separate “reactivate” action in settings.** Reactivation happens at **login**.
- On **email/password login**, the backend can return `accountDisabled: true` in the auth response (see `features/auth/types.ts`).
- The app then shows an alert: “Account Inactive” / “Your account is currently inactive. Would you like to reactivate it?”
  - **“No, stay inactive”** → user is not logged in; app goes to home.
  - **“Reactivate”** → app sets auth state with the returned tokens, calls **reactivate** API in the background, then redirects to `/(tabs)` (user is logged in and account is active again).

**Reactivate API:**

| Method | Endpoint | Response |
|--------|----------|----------|
| POST   | `/marketplace/customer/reactivate` | `{ ok: boolean }` |

- Called from `features/auth/hooks.ts` in `handleReactivation()` after login when `data.accountDisabled === true` (uses `customerApi.reactivateAccount()`).

---

## 2. Delete Account

### What it does

- **Schedules** the account for permanent deletion (e.g. after 30 days), not immediate deletion.
- During the grace period the user can **log in and cancel** the scheduled deletion.
- After the grace period, the backend permanently deletes the account and data.

### Where it lives

- **Screen:** Account Settings (`app/account-settings.tsx`)
- **Entry:** “Delete account” in the “Danger zone” section, subtitle: “Permanently delete your account and data”.

### User flow

1. User taps “Delete account”.
2. Alert explains: account will be **scheduled for deletion** and **permanently removed after 30 days**; during that time they can log in and cancel; after 30 days data is permanently deleted and cannot be recovered.
3. User confirms with “Schedule Deletion” (destructive).
4. App calls **schedule deletion** API.
5. On success: shows “Account Scheduled for Deletion” with the `deletionScheduledAt` date; user taps OK and is **logged out** (via `logout.mutate()`).

### APIs

| Action | Method | Endpoint | Response |
|--------|--------|----------|----------|
| Schedule deletion | POST | `/marketplace/customer/delete` | `{ ok: boolean; deletionScheduledAt: string }` |
| Cancel deletion   | POST | `/marketplace/customer/cancel-delete` | `{ ok: boolean }` |

- **Hooks:**  
  - `useScheduleAccountDeletion()` → `customerApi.scheduleAccountDeletion()`  
  - `useCancelAccountDeletion()` → `customerApi.cancelAccountDeletion()`  
  (in `features/customer/hooks.ts`).

### Cancel scheduled deletion (at login)

- When the user **logs in** while the account is scheduled for deletion, the backend can return `accountScheduledForDeletion: true` in the auth response.
- The app shows an alert: “Account Scheduled for Deletion” / “Your account is scheduled to be deleted. Would you like to cancel the deletion and keep your account?”
  - **“Continue with deletion”** (destructive) → user is not logged in; app goes to home; deletion stays scheduled.
  - **“Keep my account”** → app sets auth state, calls **cancel deletion** API in the background, then redirects to `/(tabs)` (user is logged in and deletion is cancelled).

Cancel-deletion is implemented in `features/auth/hooks.ts` in `handleCancelDeletion()` (uses `customerApi.cancelAccountDeletion()`).

---

## 3. Auth response flags

Login (and related auth) responses can include:

- **`accountDisabled`** – account is deactivated; app shows reactivation prompt and may call `reactivate`.
- **`accountScheduledForDeletion`** – account has a scheduled deletion; app shows cancel-deletion prompt and may call `cancel-delete`.

Defined in `features/auth/types.ts` on `AuthResponse`:

```ts
accountDisabled?: boolean;
accountScheduledForDeletion?: boolean;
```

---

## 4. Summary

| Feature | Screen | Effect | Revert |
|--------|--------|--------|--------|
| **Deactivate** | Login & Security | Account marked inactive; data kept; user logged out | Log in → “Reactivate” → backend reactivates |
| **Delete** | Account Settings | Deletion scheduled (e.g. 30 days); user logged out | Log in before deadline → “Keep my account” → backend cancels deletion |

All customer account APIs (deactivate, reactivate, schedule deletion, cancel deletion) are in `features/customer/api.ts` and are used via the hooks in `features/customer/hooks.ts` and, for login-time flows, from `features/auth/hooks.ts`.
