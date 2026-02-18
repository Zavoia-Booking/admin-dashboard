# Business Notifications API

All endpoints require `Authorization: Bearer <token>` header.
Available to roles: `owner`, `team_member`.

---

## Unread count (from `/me`)

The existing `GET /auth/me` response now includes:

```json
{
  "id": 1,
  "email": "owner@example.com",
  "role": "owner",
  "unreadNotificationsCount": 3,
  ...
}
```

Use `unreadNotificationsCount` to render a badge/pill on the notifications icon in the sidebar or navbar.

---

## 1. List notifications (paginated)

### `GET /business-notifications/list`

Returns paginated notifications for the currently logged-in user. The API automatically scopes results based on role:

- **Owner** sees: business-level notifications (no specific user target) + notifications targeted at the owner personally.
- **Team member** sees: only notifications targeted at them specifically. They do NOT see business-level notifications.

### Query params

| Param    | Type   | Required | Default | Description              |
| -------- | ------ | -------- | ------- | ------------------------ |
| `offset` | number | no       | `0`     | Number of items to skip  |
| `limit`  | number | no       | `20`    | Number of items to fetch |

### Example request

```
GET /business-notifications/list?offset=0&limit=20
```

### Response `200 OK`

```json
{
  "data": [
    {
      "id": 42,
      "businessId": 1,
      "userId": null,
      "type": "sms_credits_low",
      "title": "SMS credits running low",
      "body": "You have fewer than 10 SMS credits remaining. Purchase more to continue sending appointment reminders.",
      "data": null,
      "read": false,
      "createdAt": "2026-02-18T10:30:00.000Z"
    },
    {
      "id": 41,
      "businessId": 1,
      "userId": null,
      "type": "trial_ending",
      "title": "Trial period ending soon",
      "body": "Your free trial ends in 3 days. Subscribe to keep using all features.",
      "data": { "daysRemaining": 3 },
      "read": true,
      "createdAt": "2026-02-17T08:00:00.000Z"
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 2
  }
}
```

### Notification object shape

| Field        | Type                | Description                                                                            |
| ------------ | ------------------- | -------------------------------------------------------------------------------------- |
| `id`         | number              | Unique notification ID                                                                 |
| `businessId` | number              | Business this notification belongs to                                                  |
| `userId`     | number \| null      | `null` = business-level (owner sees it); number = targeted at that specific user        |
| `type`       | string              | Machine-readable type, e.g. `sms_credits_low`, `trial_ending`, `schedule_updated`      |
| `title`      | string              | Human-readable title                                                                   |
| `body`       | string              | Human-readable description                                                             |
| `data`       | object \| null      | Optional metadata (use for deep-linking, passing IDs, etc.)                            |
| `read`       | boolean             | Whether the user has marked this notification as read                                  |
| `createdAt`  | string (ISO 8601)   | When the notification was created                                                      |

---

## 2. Mark a single notification as read

### `PATCH /business-notifications/:id/read`

Marks a single notification as read. Scoped so users can only mark notifications they are allowed to see.

### Path params

| Param | Type   | Description      |
| ----- | ------ | ---------------- |
| `id`  | number | Notification ID  |

### Request body

None.

### Example request

```
PATCH /business-notifications/42/read
```

### Response `200 OK`

```json
{
  "message": "BUSINESS_NOTIFICATION.S02"
}
```

### Response `404 Not Found`

Returned if the notification doesn't exist or the user doesn't have access to it.

```json
{
  "message": "BUSINESS_NOTIFICATION.E01"
}
```

---

## 3. Mark all notifications as read

### `PATCH /business-notifications/read-all`

Marks all unread notifications as read for the current user (scoped by role, same targeting logic as the list endpoint).

### Request body

None.

### Example request

```
PATCH /business-notifications/read-all
```

### Response `200 OK`

```json
{
  "message": "BUSINESS_NOTIFICATION.S03",
  "data": {
    "updated": 5
  }
}
```

`updated` is the number of notifications that were marked as read.

---

## Message codes reference

| Code                         | Meaning                              |
| ---------------------------- | ------------------------------------ |
| `BUSINESS_NOTIFICATION.S01`  | Notifications retrieved successfully |
| `BUSINESS_NOTIFICATION.S02`  | Notification marked as read          |
| `BUSINESS_NOTIFICATION.S03`  | All notifications marked as read     |
| `BUSINESS_NOTIFICATION.E01`  | Notification not found               |
| `BUSINESS_NOTIFICATION.E02`  | Failed to process notification request |

---

## Known notification types

These are the `type` values that the backend will produce. Use them to render icons, colors, or route the user to specific pages on click.

| Type                    | Target      | Description                                          |
| ----------------------- | ----------- | ---------------------------------------------------- |
| `sms_credits_low`       | Business    | SMS credits are running low                          |
| `trial_ending`          | Business    | Free trial is about to expire                        |
| `schedule_updated`      | Team member | The owner changed the team member's schedule         |

More types will be added over time. The frontend should handle unknown types gracefully (display title + body as-is).

---

## Frontend integration guide

### Sidebar / navbar badge

On app load (or after `GET /auth/me`), read `unreadNotificationsCount` from the response and render a badge if > 0.

### Notifications page

1. Call `GET /business-notifications/list?offset=0&limit=20` on page mount.
2. Render notifications in a list, newest first (already sorted by the API).
3. Unread notifications (`read: false`) should be visually distinct (bold text, colored dot, background highlight, etc.).
4. When the user clicks on a notification or a "mark as read" button, call `PATCH /business-notifications/:id/read`.
5. Provide a "Mark all as read" button that calls `PATCH /business-notifications/read-all`.
6. Use standard offset pagination (load more / infinite scroll) by incrementing `offset` by `limit` on each fetch.
7. After marking as read, either refetch the list or update the item locally + decrement the badge count.

### Deep-linking via `data`

Some notifications may include a `data` object with a `screen` or `route` key. If present, navigate the user to that screen when they click the notification. Example:

```json
{
  "type": "sms_credits_low",
  "data": { "screen": "/settings/sms" }
}
```
