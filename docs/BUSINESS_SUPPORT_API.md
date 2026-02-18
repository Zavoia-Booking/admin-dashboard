# Business Support API

All endpoints are under **Dashboard JWT** (business owner or team member). Send `Authorization: Bearer <access_token>`.

Base path: `/support`

Tickets are scoped per-business. All team members and owners of a business see the same ticket list. This prevents cross-business ticket leakage when a user has roles in multiple businesses.

---

## Authentication & Guards

- `JwtAuthGuard` — validates dashboard JWT
- `RolesGuard` — checks `@Roles(OWNER, TEAM_MEMBER)`
- `SubscriptionGuard` — validates active subscription

---

## Common response shape

Success:

```json
{
  "message": "SUPPORT.S01",
  "data": { ... }
}
```

Error (4xx/5xx): structured error with a `message` code (e.g. `SUPPORT.E03`). Use i18n keys `api.SUPPORT.*` for labels.

---

## Shared types

### Enums

| Enum           | Values                                              |
|----------------|------------------------------------------------------|
| `sourceType`   | `MARKETPLACE`, `DASHBOARD`, `GUEST`                  |
| `priority`     | `LOW`, `MEDIUM`, `HIGH`, `URGENT`                    |
| `status`       | `OPEN`, `IN_PROGRESS`, `CLOSED`, `REOPENED`          |
| `category`     | `bug`, `question`                                    |

### Ticket (response object)

| Field        | Type            | Description                                      |
|-------------|-----------------|--------------------------------------------------|
| `id`        | number          | Ticket ID                                        |
| `uuid`      | string          | Ticket UUID                                      |
| `sourceType`| string          | Always `DASHBOARD` for these APIs                |
| `businessId`| number          | Business that owns this ticket                   |
| `details`   | object          | See below                                        |
| `createdAt` | string          | ISO 8601                                         |
| `updatedAt` | string          | ISO 8601                                         |
| `resolvedAt`| string \| null  | ISO 8601 or null                                 |
| `createdBy` | string          | User ID (string) of the person who created it    |
| `priority`  | string          | Default `MEDIUM`                                 |
| `category`  | string          | `bug` \| `question`                              |
| `status`    | string          | `OPEN` \| `IN_PROGRESS` \| `CLOSED` \| `REOPENED` |
| `seen`      | boolean         | Whether business user has seen latest admin reply |
| `hasUnread` | boolean         | Convenience flag (inverse of `seen`), only on list endpoint |

### details

```ts
{
  history: Array<{
    message: string;
    createdBy: string;  // user id (string) — or "admin" when admin replies
  }>;
}
```

---

## Endpoints

### 1. Create support ticket

**POST** `/support/tickets`

**Roles:** `OWNER`, `TEAM_MEMBER`

**Request body**

| Field      | Type   | Required | Constraints          |
|-----------|--------|----------|----------------------|
| `category` | string | yes      | `bug` \| `question`  |
| `message`  | string | yes      | 1–10,000 chars       |

**Example request:**

```json
{
  "category": "bug",
  "message": "The calendar is not loading properly for our second location."
}
```

**Response body**

`data` is a single **Ticket** object with initial `details.history` of one entry.

**Example response:**

```json
{
  "message": "SUPPORT.S01",
  "data": {
    "id": 42,
    "uuid": "a1b2c3d4-...",
    "sourceType": "DASHBOARD",
    "businessId": 5,
    "category": "bug",
    "status": "OPEN",
    "priority": "MEDIUM",
    "createdBy": "17",
    "seen": true,
    "seenByAdmin": false,
    "resolvedAt": null,
    "details": {
      "history": [
        { "message": "The calendar is not loading properly for our second location.", "createdBy": "17" }
      ]
    },
    "createdAt": "2026-02-18T10:30:00.000Z",
    "updatedAt": "2026-02-18T10:30:00.000Z"
  }
}
```

**Success message:** `SUPPORT.S01`

---

### 2. List tickets

**GET** `/support/tickets`

**Roles:** `OWNER`, `TEAM_MEMBER`

No request body. No query params.

Returns all `DASHBOARD` tickets for the current business, newest first.

**Response body**

`data` is an array of **Ticket** objects. Each ticket includes a `hasUnread` boolean (true when there is an unread admin reply).

**Example response:**

```json
{
  "message": "SUPPORT.S02",
  "data": [
    {
      "id": 42,
      "uuid": "a1b2c3d4-...",
      "sourceType": "DASHBOARD",
      "businessId": 5,
      "category": "bug",
      "status": "OPEN",
      "priority": "MEDIUM",
      "createdBy": "17",
      "seen": false,
      "seenByAdmin": true,
      "hasUnread": true,
      "resolvedAt": null,
      "details": {
        "history": [
          { "message": "The calendar is not loading...", "createdBy": "17" },
          { "message": "We are looking into this.", "createdBy": "admin" }
        ]
      },
      "createdAt": "2026-02-18T10:30:00.000Z",
      "updatedAt": "2026-02-18T11:00:00.000Z"
    }
  ]
}
```

**Success message:** `SUPPORT.S02`

---

### 3. Get ticket by ID

**GET** `/support/tickets/:id`

**Roles:** `OWNER`, `TEAM_MEMBER`

**Path params**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | number | Ticket ID   |

No request body.

**Behavior:**
- Returns the ticket only if it belongs to the caller's business.
- Marks the ticket as `seen: true` (clears unread indicator).
- Marks any related business notifications as read.

**Response body**

`data` is a single **Ticket** with full `details.history`.

**Success message:** `SUPPORT.S03`
**Error (404):** `SUPPORT.E03` — Ticket not found or does not belong to this business.

---

### 4. Add message to ticket

**POST** `/support/tickets/:id/messages`

**Roles:** `OWNER`, `TEAM_MEMBER`

**Path params**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | number | Ticket ID   |

**Request body**

| Field     | Type   | Required | Constraints      |
|----------|--------|----------|------------------|
| `message` | string | yes      | 1–10,000 chars   |

**Example request:**

```json
{
  "message": "I still have the same problem after clearing the cache."
}
```

**Behavior:**
- Appends a new entry to `details.history` with the caller's user ID.
- Sets `seenByAdmin: false` so admin knows there is a new reply.
- Only allowed when ticket status is `OPEN`, `IN_PROGRESS`, or `REOPENED`.
- Returns 400 if ticket is `CLOSED`.

**Response body**

`data` is the updated **Ticket** with the new message appended to `details.history`.

**Success message:** `SUPPORT.S04`
**Error (404):** `SUPPORT.E03` — Ticket not found.
**Error (400):** `SUPPORT.E04` — Cannot add message to a closed ticket.

---

### 5. Close ticket

**PUT** `/support/tickets/:id/close`

**Roles:** `OWNER`, `TEAM_MEMBER`

**Path params**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | number | Ticket ID   |

No request body.

**Behavior:**
- Sets `status: "CLOSED"` and `resolvedAt` to the current timestamp.
- Returns 404 if ticket not found or does not belong to the business.

**Response body**

`data` is the updated **Ticket** with `status: "CLOSED"`.

**Example response:**

```json
{
  "message": "SUPPORT.S05",
  "data": {
    "id": 42,
    "status": "CLOSED",
    "resolvedAt": "2026-02-18T14:00:00.000Z"
  }
}
```

**Success message:** `SUPPORT.S05`
**Error (404):** `SUPPORT.E03` — Ticket not found.

---

## Message codes (i18n)

Use these under `api.SUPPORT`:

| Code          | Usage                                 |
|--------------|---------------------------------------|
| `SUPPORT.S01` | Ticket created                       |
| `SUPPORT.S02` | List retrieved                       |
| `SUPPORT.S03` | Ticket details retrieved             |
| `SUPPORT.S04` | Message added                        |
| `SUPPORT.S05` | Ticket closed                        |
| `SUPPORT.E01` | Failed to get tickets                |
| `SUPPORT.E02` | Failed to create ticket              |
| `SUPPORT.E03` | Ticket not found                     |
| `SUPPORT.E04` | Cannot add message (ticket closed)   |
| `SUPPORT.E05` | Failed to add message                |
| `SUPPORT.E06` | Failed to close ticket               |

---

## Business scenarios

### Scenario 1: Business owner opens a support ticket

1. Owner navigates to **Settings > Support** (or a "Help" section).
2. Owner selects a category (`bug` or `question`) and writes a message.
3. Frontend calls `POST /support/tickets` with `{ category, message }`.
4. Ticket is created with `status: OPEN`. Owner sees it in the ticket list.

### Scenario 2: Team member views tickets

1. Team member opens the support section.
2. Frontend calls `GET /support/tickets`.
3. All tickets for this business are returned (not just the ones that team member created).
4. Tickets with `hasUnread: true` should be visually highlighted (admin replied but nobody from the business has opened it yet).

### Scenario 3: Viewing a specific ticket (conversation view)

1. User clicks a ticket from the list.
2. Frontend calls `GET /support/tickets/:id`.
3. Full conversation history is in `data.details.history`.
4. Each history entry has `createdBy` — match against `"admin"` to distinguish admin replies from business user messages.
5. The ticket is automatically marked as seen (clears unread badge).

### Scenario 4: Replying to a ticket

1. User types a reply message in the conversation view.
2. Frontend calls `POST /support/tickets/:id/messages` with `{ message }`.
3. If ticket is `CLOSED`, the API returns 400 (`SUPPORT.E04`). Frontend should disable the reply input or show a "ticket is closed" message.
4. On success, the updated ticket (with new message) is returned.

### Scenario 5: Closing a ticket

1. User clicks a "Close ticket" button.
2. Frontend calls `PUT /support/tickets/:id/close`.
3. Ticket status changes to `CLOSED` and `resolvedAt` is set.
4. The reply input should be disabled after closing.

### Scenario 6: Admin replies to a business ticket (handled by admin CRM, not these endpoints)

1. Admin replies via the admin CRM panel.
2. Admin's reply is appended to `details.history` with `createdBy: "admin"`.
3. Ticket's `seen` is set to `false` — so next time a business user lists tickets, `hasUnread` will be `true`.
4. A `BusinessNotification` is created so the dashboard shows a notification badge.

### Scenario 7: Multi-business user

1. A user is an owner of Business A and a team member of Business B.
2. When logged in under Business A, `GET /support/tickets` returns only Business A's tickets.
3. When logged in under Business B, only Business B's tickets are returned.
4. The `businessId` on each ticket ensures complete isolation between businesses.

---

## UI considerations

- **Ticket list page:** Show ticket category (as badge/icon), status (color-coded), subject (first message truncated), `createdAt` date, and unread indicator based on `hasUnread`.
- **Conversation view:** Chat-like layout. Messages from business users (match `createdBy` against current user ID or any non-"admin" value) on one side, admin messages (`createdBy === "admin"`) on the other. Show timestamps if desired (not stored per-message currently, but the ticket `updatedAt` reflects the last activity).
- **New ticket form:** Category dropdown (`bug`, `question`) + message textarea. Submit button creates the ticket.
- **Close button:** Visible when ticket status is not `CLOSED`. After closing, disable the reply input.
- **Empty state:** When no tickets exist, show an empty state with a "Create your first ticket" CTA.
