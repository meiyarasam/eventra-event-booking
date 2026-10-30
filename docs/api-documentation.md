# EVENTRA REST API Specification (v1)

This document provides complete technical specifications for all REST API endpoints of the **EVENTRA** Event Discovery, Booking & Ticketing Platform.

- **Base URL (Local)**: `http://localhost:5000/api/v1`
- **Base URL (Production)**: `https://[render-service-name].onrender.com/api/v1`
- **Interactive Swagger UI**: `http://localhost:5000/api/v1/docs`

---

## 1. Architectural Conventions & Protocols

### 1.1 Authentication & Authorization
All authenticated endpoints accept credentials through either:
1. **HTTP-Only Cookies**: Automatically set upon login/registration (`accessToken` with 15m expiry, `refreshToken` with 7d expiry).
2. **Authorization Header**: Standard Bearer token header (`Authorization: Bearer <accessToken>`).

Endpoints enforce Role-Based Access Control (RBAC):
- **Public**: Accessible without credentials.
- **Authenticated**: Requires a valid user session (`ATTENDEE`, `ORGANIZER`, or `ADMIN`).
- **ORGANIZER**: Requires `ORGANIZER` or `ADMIN` role.
- **ADMIN**: Strictly restricted to `ADMIN` role.

### 1.2 Standard Response Format
All responses adhere to a consistent JSON envelope:

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional operational feedback"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable explanation of error",
    "details": [ ... ]
  }
}
```

### 1.3 Common HTTP Status Codes
| Status Code | Meaning | Description |
| :--- | :--- | :--- |
| `200 OK` | Success | The request completed successfully. |
| `201 Created` | Created | A new entity (user, reservation, booking) was created. |
| `400 Bad Request` | Validation Failure | Payload contains invalid data or violated schema rules. |
| `401 Unauthorized` | Unauthenticated | Authentication token is missing, expired, or invalid. |
| `403 Forbidden` | Access Denied | Authenticated user lacks permission for this resource. |
| `404 Not Found` | Not Found | Target entity or route does not exist. |
| `409 Conflict` | Conflict | State conflict (e.g. duplicate email, sold-out seats, duplicate QR scan). |
| `410 Gone` | Resource Expired | Temporary inventory reservation has expired. |
| `429 Too Many Requests` | Rate Limited | Brute-force rate limit exceeded on `/auth` endpoints. |
| `500 Internal Error` | Server Failure | Uncaught exception on the API server. |

---

## 2. Authentication Module (`/auth`)

### `POST /auth/register`
Registers a new attendee account and creates an associated profile.
- **Access**: Public (Subject to Rate Limiting)
- **Request Body**:
```json
{
  "name": "Alex Attendee",
  "email": "alex@example.com",
  "password": "Password123!",
  "phone": "+1234567890"
}
```
- **Responses**:
  - `201 Created`: Sets `accessToken` & `refreshToken` HTTP-Only cookies, returns user entity.
  - `400 Bad Request`: Validation failure (weak password, invalid email format).
  - `409 Conflict`: Email address already registered.

### `POST /auth/login`
Authenticates an existing user and establishes secure session cookies.
- **Access**: Public (Subject to Rate Limiting)
- **Request Body**:
```json
{
  "email": "alex@example.com",
  "password": "Password123!"
}
```
- **Responses**:
  - `200 OK`: Sets session cookies, returns user entity and profile.
  - `401 Unauthorized`: Invalid credentials or suspended account.

### `POST /auth/logout`
Terminates the current user session by clearing auth cookies.
- **Access**: Authenticated
- **Responses**:
  - `200 OK`: Cookies cleared.

### `POST /auth/refresh`
Issues a new 15-minute access token using the valid HTTP-Only refresh token cookie.
- **Access**: Public (Requires valid `refreshToken` cookie)
- **Responses**:
  - `200 OK`: Sets new `accessToken` cookie.
  - `401 Unauthorized`: Expired or invalid refresh token.

### `GET /auth/me`
Retrieves identity and permissions for the currently authenticated user.
- **Access**: Authenticated
- **Responses**:
  - `200 OK`: Returns current user object with profile.

### `POST /auth/verify-email`
Verifies user account email. Uses the deterministic mock verification code `123456` in testing and demo modes, persisting `User.emailVerified = true` in PostgreSQL.
- **Access**: Public / Authenticated
- **Request Body**:
```json
{
  "email": "alex@example.com",
  "tokenOrOtp": "123456"
}
```
- **Responses**:
  - `200 OK`: Account email marked as verified.
  - `400 Bad Request`: Invalid verification code (any code other than `123456`).
  - `404 Not Found`: User not found.

### `POST /auth/resend-verification`
Dispatches a new mock verification code to the registered email address.
- **Access**: Public / Authenticated
- **Request Body**:
```json
{
  "email": "alex@example.com"
}
```
- **Responses**:
  - `200 OK`: Mock code `123456` dispatched.

### `POST /auth/forgot-password`
Initiates password recovery by generating a recovery token.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "alex@example.com"
}
```

### `POST /auth/reset-password`
Updates password using a valid recovery token.
- **Access**: Public
- **Request Body**:
```json
{
  "token": "valid-recovery-token",
  "password": "NewSecurePassword123!"
}
```

---

## 3. Users & Profiles Module (`/users`)

### `GET /users/me`
Retrieves detailed profile of the authenticated user.
- **Access**: Authenticated

### `PATCH /users/me`
Updates user profile metadata.
- **Access**: Authenticated
- **Request Body**:
```json
{
  "phone": "+1987654321",
  "bio": "Passionate technology enthusiast and event speaker.",
  "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  "organizationName": "Innovate Tech",
  "websiteUrl": "https://innovatetech.example.com"
}
```

### `PATCH /users/me/password`
Changes account password after validating old password.
- **Access**: Authenticated
- **Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

### `POST /users/organizer-requests`
Submits an application to become an Event Organizer.
- **Access**: Authenticated (`ATTENDEE` role)
- **Request Body**:
```json
{
  "organizationName": "Metropolis Events Group",
  "reason": "We organize major technology conferences and concerts.",
  "websiteUrl": "https://metropolisevents.example.com"
}
```

---

## 4. Categories Module (`/categories`)

### `GET /categories`
Lists all event categories with active event counters and icons.
- **Access**: Public

### `GET /categories/:slug`
Retrieves details for a specific category by URL slug.
- **Access**: Public

---

## 5. Events Module (`/events`)

### `GET /events`
Public catalog with full-text search, multi-faceted filtering, and pagination.
- **Access**: Public
- **Query Parameters**:
  - `search` (string): Search query matching event title or description.
  - `category` (string): Category slug (e.g. `technology`, `music`).
  - `city` (string): Venue city filter.
  - `isOnline` (boolean): Filter for webinars / virtual gatherings.
  - `minPrice` (number): Minimum ticket price filter.
  - `maxPrice` (number): Maximum ticket price filter.
  - `freeOnly` (boolean): Return only events with ₹0 ticket tiers.
  - `timeframe` (string): `today`, `tomorrow`, `this_weekend`, or `upcoming`.
  - `sortBy` (string): `date_asc`, `date_desc`, `price_asc`, `price_desc`.
  - `page` (number, default: 1): Pagination page number.
  - `limit` (number, default: 12): Number of events per page.

### `GET /events/cities`
Returns an array of unique cities populated from active database venues.
- **Access**: Public

### `GET /events/saved`
Returns all events bookmarked by the authenticated user.
- **Access**: Authenticated

### `GET /events/:idOrSlug`
Retrieves complete event details including tiered ticket types, venue logistics, remaining seat capacity, and organizer profile.
- **Access**: Public (Optional Auth detects saved status)

### `POST /events/:id/save`
Toggles saving/bookmarking an event for the authenticated user.
- **Access**: Authenticated

### `POST /events`
Creates a new event draft with customized ticket tiers.
- **Access**: `ORGANIZER`, `ADMIN`
- **Request Body**:
```json
{
  "title": "Silicon Coast AI Summit 2026",
  "description": "Three days of immersive keynote sessions, developer workshops, and networking.",
  "categoryId": "category-uuid",
  "bannerUrl": "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  "startDate": "2026-11-20T09:00:00.000Z",
  "endDate": "2026-11-22T18:00:00.000Z",
  "timeZone": "Asia/Kolkata",
  "isOnline": false,
  "venueName": "International Convention Center",
  "venueAddress": "100 Tech Park Road",
  "city": "Bengaluru",
  "capacity": 1000,
  "cancellationPolicy": "Full refund up to 48 hours prior to event start.",
  "ticketTypes": [
    {
      "name": "General Admission",
      "description": "Full access to keynote sessions and expo floor.",
      "price": 499.00,
      "totalQuantity": 800,
      "maxPerUser": 5
    },
    {
      "name": "VIP All-Access",
      "description": "Includes speaker lounge, dinner banquet, and reserved seating.",
      "price": 1499.00,
      "totalQuantity": 200,
      "maxPerUser": 2
    }
  ]
}
```

### `PATCH /events/:id`
Updates logistics, description, or capacity of an event owned by the caller.
- **Access**: `ORGANIZER` (owner), `ADMIN`

### `POST /events/:id/submit`
Submits an event draft for administrative moderation (`DRAFT` ➔ `PENDING_APPROVAL`).
- **Access**: `ORGANIZER` (owner), `ADMIN`

### `POST /events/:id/publish`
Publishes an approved event live to the public catalog (`APPROVED` ➔ `PUBLISHED`).
- **Access**: `ORGANIZER` (owner), `ADMIN`

### `POST /events/:id/cancel`
Cancels an event. Atomically marks tickets as cancelled, restores seat allocations, dispatches alerts, and triggers cancellation emails.
- **Access**: `ORGANIZER` (owner), `ADMIN`
- **Request Body**:
```json
{
  "reason": "Unforeseen venue maintenance emergency."
}
```

### `DELETE /events/:id`
Deletes an event draft.
- **Access**: `ORGANIZER` (owner), `ADMIN`

---

## 6. Bookings & Reservations Module (`/bookings`)

### `POST /bookings/reservations`
Places an atomic 10-minute hold lock on requested ticket capacity.
- **Access**: Authenticated
- **Request Body**:
```json
{
  "eventId": "event-uuid",
  "items": [
    { "ticketTypeId": "type-uuid-1", "quantity": 2 }
  ]
}
```
- **Responses**:
  - `201 Created`: Returns `reservationId`, `expiresAt` (NOW + 10m), and calculated amounts.
  - `409 Conflict`: Insufficient inventory remaining.

### `GET /bookings/reservations/:id`
Checks the remaining TTL and validity of an active hold.
- **Access**: Authenticated

### `POST /bookings/pay`
Executes simulated payment settlement and confirms the booking.
- **Access**: Authenticated
- **Request Body**:
```json
{
  "reservationId": "reservation-uuid",
  "paymentMethod": "CARD",
  "simulateSuccess": true,
  "paymentDetails": {
    "cardLast4": "4242",
    "cardHolder": "Alex Attendee"
  }
}
```
- **Responses**:
  - `200 OK`: Confirmed booking object with scannable digital tickets.
  - `402 Payment Required`: Simulated payment declined.
  - `410 Gone`: Reservation expired.

### `GET /bookings/me`
Retrieves purchase history for the authenticated attendee.
- **Access**: Authenticated

### `GET /bookings/:id`
Retrieves a specific booking with order line items and individual ticket passes.
- **Access**: Authenticated (owner or Admin)

### `POST /bookings/:id/cancel`
Cancels an eligible booking (more than 48 hours prior to event start) and restores capacity.
- **Access**: Authenticated (owner)
- **Request Body**:
```json
{
  "reason": "Scheduling conflict"
}
```

### `POST /bookings/:id/resend-email`
Triggers redelivery of confirmation receipt and digital QR tickets via email.
- **Access**: Authenticated (owner or Admin)

---

## 7. Tickets & Gate Check-In Module (`/tickets`)

### `GET /tickets/me`
Lists all active, checked-in, and historical tickets for the attendee.
- **Access**: Authenticated

### `GET /tickets/:id`
Retrieves detailed ticket information and cryptographic QR token.
- **Access**: Authenticated (owner, event organizer, or Admin)

### `POST /tickets/validate`
Validates a ticket token without marking it checked in (preview mode).
- **Access**: `ORGANIZER`, `ADMIN`
- **Request Body**:
```json
{
  "ticketToken": "opaque-cryptographic-uuid"
}
```

### `POST /tickets/check-in`
Atomically marks a ticket as checked in and records gate admission.
- **Access**: `ORGANIZER` (event owner), `ADMIN`
- **Request Body**:
```json
{
  "ticketToken": "opaque-cryptographic-uuid"
}
```
- **Responses**:
  - `200 OK`: Admission confirmed with attendee name and ticket tier.
  - `403 Forbidden`: Caller does not organize this event.
  - `404 Not Found`: Invalid ticket token.
  - `409 Conflict`: Ticket already checked in (`checkedInAt` timestamp returned).

---

## 8. Organizer Studio Module (`/organizer`)

### `GET /organizer/dashboard`
Returns organizer analytics: gross ticket sales revenue, total tickets issued, occupancy rate, and upcoming event dates.
- **Access**: `ORGANIZER`, `ADMIN`

### `GET /organizer/events`
Lists all events managed by the authenticated organizer.
- **Access**: `ORGANIZER`, `ADMIN`

### `GET /organizer/events/:id/attendees`
Returns an exportable attendee manifest for a specific event with check-in statuses.
- **Access**: `ORGANIZER` (owner), `ADMIN`

---

## 9. Administrative Operations Module (`/admin`)

### `GET /admin/overview`
Platform-wide telemetry: total user accounts, gross transaction volume, active events, and pending moderation queues.
- **Access**: `ADMIN`

### `GET /admin/events`
Full platform event catalog audit.
- **Access**: `ADMIN`

### `POST /admin/events`
Direct administrative event creation.
- **Access**: `ADMIN`

### `GET /admin/events/pending`
Queue of events submitted for moderation.
- **Access**: `ADMIN`

### `GET /admin/events/:id`
Inspects complete event details and audit history.
- **Access**: `ADMIN`

### `PATCH /admin/events/:id` & `PUT /admin/events/:id`
Administratively edits event parameters.
- **Access**: `ADMIN`

### `PATCH /admin/events/:id/status`
Forces event status update (`DRAFT`, `APPROVED`, `PUBLISHED`, `CANCELLED`).
- **Access**: `ADMIN`

### `DELETE /admin/events/:id`
Removes an event and cleans associated records.
- **Access**: `ADMIN`

### `POST /admin/events/:id/review`
Approves or rejects an event submission with feedback.
- **Access**: `ADMIN`
- **Request Body**:
```json
{
  "status": "APPROVED",
  "reason": "Event details and ticketing parameters verified."
}
```

### `GET /admin/organizer-requests`
Lists pending organizer applications.
- **Access**: `ADMIN`

### `POST /admin/organizer-requests/:id/review`
Approves or rejects an organizer application, updating user role to `ORGANIZER`.
- **Access**: `ADMIN`
- **Request Body**:
```json
{
  "status": "APPROVED"
}
```

### `GET /admin/users`
Lists all registered users with role and status filters.
- **Access**: `ADMIN`

### `GET /admin/users/:id`
Detailed user audit including booking history, organizer profile, and tickets.
- **Access**: `ADMIN`

### `PATCH /admin/users/:id/status`
Suspends or reactivates an account.
- **Access**: `ADMIN`
- **Request Body**:
```json
{
  "status": "SUSPENDED"
}
```

### `DELETE /admin/users/:id`
Soft-deletes or purges a user record.
- **Access**: `ADMIN`

### `GET /admin/bookings`
Comprehensive platform booking ledger for financial and ticket auditing.
- **Access**: `ADMIN`

### `GET /admin/notifications`
Lists system broadcast notices.
- **Access**: `ADMIN`

### `POST /admin/notifications/broadcast`
Dispatches a system-wide announcement to all registered users or specific roles.
- **Access**: `ADMIN`
- **Request Body**:
```json
{
  "title": "Platform Scheduled Maintenance",
  "message": "Routine database maintenance will occur on Sunday at 02:00 UTC.",
  "targetRole": "ALL"
}
```

---

## 10. In-App Notifications Module (`/notifications`)

### `GET /notifications`
Retrieves recent in-app notifications and unread counter for the caller.
- **Access**: Authenticated

### `PATCH /notifications/read-all`
Marks all notifications as read.
- **Access**: Authenticated

### `PATCH /notifications/:id/read`
Marks a specific notification as read.
- **Access**: Authenticated

---

## 11. Asset Upload Module (`/upload`)

### `POST /upload/banner`
Uploads an event banner image. Routes to Cloudinary when configured; falls back safely to image URLs or base64 data URIs.
- **Access**: `ORGANIZER`, `ADMIN`
- **Request Body**:
```json
{
  "image": "data:image/jpeg;base64,...",
  "imageUrl": "https://images.unsplash.com/photo-1540575467063-178a50c2df87"
}
```
- **Responses**:
  - `200 OK`: Returns secure image URL.

---

## 12. Artificial Intelligence Module (`/ai`)

### `POST /ai/generate-description`
Generates comprehensive marketing descriptions from title, venue, and category inputs using Google Gemini 1.5 Flash (with deterministic fallback).
- **Access**: Authenticated (`ORGANIZER`, `ADMIN`)
- **Request Body**:
```json
{
  "title": "Future of Cloud Computing 2026",
  "category": "Technology",
  "venue": "Convention Center",
  "city": "Bengaluru"
}
```

### `POST /ai/parse-search`
Parses natural-language user queries into structured search filters.
- **Access**: Public
- **Request Body**:
```json
{
  "query": "free outdoor music concerts in Mumbai this weekend"
}
```
- **Responses**:
  - `200 OK`: Structured filter parameters (`category`, `city`, `freeOnly`, `timeframe`).

### `GET /ai/recommendations`
Returns personalized or trending event suggestions.
- **Access**: Public / Optional Auth (personalized if authenticated)

### `POST /ai/chat`
Answers questions regarding platform navigation, digital QR tickets, and live events.
- **Access**: Public / Optional Auth
- **Request Body**:
```json
{
  "message": "How do I download my QR entry pass?",
  "history": []
}
```

---

## 13. System Health & OpenAPI Documentation

### `GET /health`
Returns operational status and deployment metadata.
- **Access**: Public
- **Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-10-30T10:00:00.000Z",
  "service": "eventra-api",
  "environment": "production"
}
```

### `GET /docs`
Interactive Swagger UI serving the OpenAPI 3.0 specification.
- **Access**: Public
