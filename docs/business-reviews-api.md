# Business Reviews API

## Overview

The reviews feature allows business owners and team members to view and monitor reviews left by customers. Reviews are split into two categories:

- **Business Reviews** — Reviews left about the business as a whole (stored in `business_review` table)
- **Team Member Reviews** — Reviews left about individual team members/specialists (stored in `professional_review` table)

All endpoints are scoped to the authenticated user's business (via JWT). Both OWNER and TEAM_MEMBER roles have read access to business-level endpoints. Team members also have dedicated endpoints for viewing their own reviews.

---

## Business Scenarios

### 1. Business owner opens the Reviews tab on the Marketplace page
They land on a view showing **business reviews** by default. The page shows paginated reviews with customer names, star ratings, comments, and timestamps. A stats panel at the top shows the overall combined rating, business-only rating, and per-team-member breakdown.

### 2. Business owner filters reviews by star rating
They select a star rating (e.g., "3 stars") to see only reviews with that rating. Useful for identifying negative feedback.

### 3. Business owner switches to Team Member Reviews tab
They see reviews about their team members. Each review shows which team member it's about. They can filter by a specific team member to see only that person's reviews.

### 4. Business owner looks at stats overview
The stats endpoint provides a combined view: overall rating (business + team member reviews pooled), business-only rating with distribution, and per-team-member breakdown, so the owner can quickly compare team member performance.

### 5. Team member views their own reviews
A team member can view their own reviews and stats without seeing the full business picture.

### 6. Denormalized ratings
When a review is created/updated/deleted (currently via admin CRM, in the future via customer marketplace), the business and/or professional's cached `averageRating` and `totalReviews` fields are automatically recalculated. The business's cached rating is a **combined weighted average** of all business reviews + all team member reviews. These cached values are used in marketplace listing cards to display ratings without computing them on the fly.

---

## Base URL

```
/review
```

All endpoints require JWT authentication (`Authorization: Bearer <token>`).

---

## Endpoints

### GET /review/business-reviews

Returns paginated business reviews for the authenticated user's business.

**Roles:** OWNER, TEAM_MEMBER

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| offset | number | No | 0 | Pagination offset |
| limit | number | No | 20 | Items per page (max 100) |
| rating | number | No | — | Filter by star rating (1–5) |
| sortOrder | string | No | DESC | Sort by createdAt: `ASC` or `DESC` |

**Response (200):**

```json
{
  "message": "REVIEW.S01",
  "data": [
    {
      "id": 42,
      "rating": 5,
      "comment": "Great service, very professional!",
      "createdAt": "2026-02-10T14:22:00.000Z",
      "customer": {
        "id": 101,
        "firstName": "Maria",
        "lastName": "P.",
        "profileImage": "https://cdn.example.com/img/maria.jpg"
      }
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 48
  }
}
```

**Notes:**
- `customer.lastName` is abbreviated to first initial + period for privacy (e.g., "Popescu" → "P.")
- Only visible reviews are returned (`isVisible = true`)

---

### GET /review/team-member-reviews

Returns paginated professional/team member reviews for the authenticated user's business.

**Roles:** OWNER, TEAM_MEMBER

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| offset | number | No | 0 | Pagination offset |
| limit | number | No | 20 | Items per page (max 100) |
| rating | number | No | — | Filter by star rating (1–5) |
| teamMemberId | number | No | — | Filter by specific team member |
| sortOrder | string | No | DESC | Sort by createdAt: `ASC` or `DESC` |

**Response (200):**

```json
{
  "message": "REVIEW.S01",
  "data": [
    {
      "id": 78,
      "rating": 4,
      "comment": "Very skilled, would book again.",
      "createdAt": "2026-02-12T09:15:00.000Z",
      "customer": {
        "id": 101,
        "firstName": "Maria",
        "lastName": "P.",
        "profileImage": "https://cdn.example.com/img/maria.jpg"
      },
      "professional": {
        "id": 55,
        "firstName": "Andrei",
        "lastName": "Ionescu",
        "profileImage": "https://cdn.example.com/img/andrei.jpg"
      }
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 23
  }
}
```

**Error Responses:**

- `404` with code `REVIEW.E03` — teamMemberId was provided but that user does not belong to this business

**Notes:**
- `professional` field contains the team member who received the review
- If `teamMemberId` is not provided, returns all team member reviews across the business
- Only reviews from professionals assigned to business locations are included

---

### GET /review/stats

Returns aggregated review statistics for the business: overall combined rating, business-only stats, and per-team-member breakdown.

**Roles:** OWNER, TEAM_MEMBER

**Query Parameters:** None

**Response (200):**

```json
{
  "message": "REVIEW.S02",
  "data": {
    "overall": {
      "averageRating": 4.2,
      "totalReviews": 71
    },
    "business": {
      "averageRating": 4.3,
      "totalReviews": 48,
      "ratingDistribution": {
        "5": 22,
        "4": 15,
        "3": 6,
        "2": 3,
        "1": 2
      }
    },
    "teamMembers": [
      {
        "teamMemberId": 55,
        "firstName": "Andrei",
        "lastName": "Ionescu",
        "profileImage": "https://cdn.example.com/img/andrei.jpg",
        "averageRating": 4.7,
        "totalReviews": 15
      },
      {
        "teamMemberId": 56,
        "firstName": "Elena",
        "lastName": "Marinescu",
        "profileImage": null,
        "averageRating": 4.1,
        "totalReviews": 8
      }
    ]
  }
}
```

**Notes:**
- `overall` is the weighted average of ALL reviews (business + team member reviews pooled together). This matches the cached `business.averageRating` shown on marketplace listing cards.
- `business` is the average of business reviews only, with rating distribution
- `business.averageRating` is `null` if there are no business reviews
- `business.ratingDistribution` always has keys 1–5 (value is 0 if no reviews for that star)
- `teamMembers` array is sorted by totalReviews descending (most reviewed first)
- A team member only appears in the list if they have at least 1 visible review
- `averageRating` values are rounded to 1 decimal place

---

### GET /review/my-reviews

Returns paginated reviews for the currently logged-in team member.

**Roles:** TEAM_MEMBER

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| offset | number | No | 0 | Pagination offset |
| limit | number | No | 20 | Items per page (max 100) |
| rating | number | No | — | Filter by star rating (1–5) |
| sortOrder | string | No | DESC | Sort by createdAt: `ASC` or `DESC` |

**Response (200):**

```json
{
  "message": "REVIEW.S01",
  "data": [
    {
      "id": 78,
      "rating": 4,
      "comment": "Very skilled, would book again.",
      "createdAt": "2026-02-12T09:15:00.000Z",
      "customer": {
        "id": 101,
        "firstName": "Maria",
        "lastName": "P.",
        "profileImage": "https://cdn.example.com/img/maria.jpg"
      }
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 15
  }
}
```

**Notes:**
- Uses the logged-in user's ID automatically (no teamMemberId needed)
- Only visible reviews are returned (`isVisible = true`)
- `customer.lastName` is abbreviated for privacy

---

### GET /review/my-stats

Returns aggregated review statistics for the currently logged-in team member.

**Roles:** TEAM_MEMBER

**Query Parameters:** None

**Response (200):**

```json
{
  "message": "REVIEW.S02",
  "data": {
    "averageRating": 4.7,
    "totalReviews": 15,
    "ratingDistribution": {
      "5": 9,
      "4": 4,
      "3": 1,
      "2": 1,
      "1": 0
    }
  }
}
```

**Notes:**
- `averageRating` is `null` if the team member has no reviews
- `ratingDistribution` always has keys 1–5 (value is 0 if no reviews for that star)
- `averageRating` is rounded to 1 decimal place

---

## Data Models

### BusinessReview (business_review table)

| Field | Type | Description |
|-------|------|-------------|
| id | number | Auto-increment PK |
| customer | User | The customer who left the review |
| business | Business | The business being reviewed |
| appointment | Appointment | The appointment this review is linked to |
| rating | int | 1–5 stars |
| comment | text | Customer's review text (nullable) |
| isVisible | boolean | Hidden by super admin (default true) |
| createdAt | timestamptz | When review was created |

### ProfessionalReview (professional_review table)

| Field | Type | Description |
|-------|------|-------------|
| id | number | Auto-increment PK |
| customer | User | The customer who left the review |
| professional | User | The team member being reviewed |
| appointment | Appointment | The appointment this review is linked to |
| rating | int | 1–5 stars |
| comment | text | Customer's review text (nullable) |
| isVisible | boolean | Hidden by super admin (default true) |
| createdAt | timestamptz | When review was created |

### Cached Rating Fields

**Business entity** now has:
- `averageRating` — decimal(2,1), nullable, **combined** weighted average of all business reviews + team member reviews
- `totalReviews` — int, default 0, **combined** count of all visible business + team member reviews

**User entity** now has:
- `averageRating` — decimal(2,1), nullable, cached from professional_review (individual only)
- `totalReviews` — int, default 0, cached count of visible professional reviews (individual only)

These are automatically updated whenever a review is created, updated, or deleted. When a professional review changes, both the professional's individual rating and the business's combined rating are recalculated.

---

## Message Codes

| Code | Description |
|------|-------------|
| REVIEW.S01 | Reviews retrieved successfully |
| REVIEW.S02 | Review stats retrieved successfully |
| REVIEW.E01 | Failed to get reviews |
| REVIEW.E02 | Failed to get review stats |
| REVIEW.E03 | Team member not found or does not belong to this business |

---

## Frontend Implementation Notes

1. **Reviews tab** should live inside the Marketplace page in the business dashboard
2. **Default view** shows business reviews with the stats panel at the top
3. **Two sub-tabs**: "Business Reviews" and "Team Member Reviews"
4. **Overall rating badge** at the top of the stats panel — uses `stats.overall.averageRating` and `stats.overall.totalReviews` (this is what customers see on the marketplace)
5. **Business rating section** — uses `stats.business` for business-only average and distribution bar chart
6. **Team members section** — cards for each team member with their individual rating and count
7. **Star filter** — a row of clickable stars (1–5) to filter. Clicking the active star again clears the filter
8. **Team member filter** — a dropdown populated from the `stats.teamMembers` array (only members with reviews)
9. **Pagination** — use offset/limit with a "Load more" button or page numbers
10. **Sort** — default newest first (DESC). Optional toggle for oldest first
11. **Empty state** — "No reviews yet" when total is 0
12. **Team member dashboard** — team members see `GET /review/my-stats` for their own stats panel and `GET /review/my-reviews` for their paginated review list
