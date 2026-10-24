# EVENTRA REST API Documentation (v1)

Base URL: `http://localhost:5000/api/v1` (Production: `https://[render-service-name].onrender.com/api/v1`)  
Interactive Swagger UI: `http://localhost:5000/api/v1/docs`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new attendee account.
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "+1234567890"
}
```
- **Responses**:
  - `201 Created`: User record created, HTTP-only cookie set.
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Email already exists.

### `POST /auth/login`
Authenticates a user and establishes secure HTTP-only cookies.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Responses**:
  - `200 OK`: Sets `accessToken` & `refreshToken` cookies, returns user DTO.
  - `401 Unauthorized`: Invalid credentials.

### `POST /auth/logout`
Clears authentication cookies.
- **Access**: Authenticated

### `POST /auth/refresh`
Refreshes the access token using the HTTP-only refresh token cookie.
- **Access**: Public (requires valid cookie)

### `GET /auth/me`
Retrieves the currently authenticated user's profile and active role.
- **Access**: Authenticated

### `POST /auth/verify-email`
Validates 6-digit verification code or signed token to confirm attendee email.
- **Access**: Public / Authenticated
- **Request Body**:
```json
{
  "tokenOrOtp": "123456",
  "email": "jane@example.com"
}
```

### `POST /auth/resend-verification`
Dispatches a new verification code to the registered email address.
- **Access**: Public / Authenticated
- **Request Body**:
```json
{
  "email": "jane@example.com"
}
```

---

## 2. Event Discovery & Management Endpoints

### `GET /events`
Public catalog with search, category filtering, price range, city, date, and pagination.
- **Query Parameters**:
  - `search`: string (matches title or description)
  - `category`: string (category slug)
  - `city`: string
  - `isOnline`: boolean
  - `minPrice`: number
  - `maxPrice`: number
  - `sortBy`: `date_asc` | `date_desc` | `price_asc` | `price_desc`
  - `page`: number (default: 1)
  - `limit`: number (default: 12)

### `GET /events/:idOrSlug`
Retrieves single event details including ticket types, live inventory counts, and organizer bio.
- **Access**: Public

### `POST /events`
Creates a new event draft with custom ticket types.
- **Access**: `ORGANIZER`, `ADMIN`
- **Request Body**:
```json
{
  "title": "Global Tech Summit 2026",
  "description": "The premier gathering for software architects and engineers.",
  "categoryId": "category-uuid",
  "bannerUrl": "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  "startDate": "2026-11-15T09:00:00.000Z",
  "endDate": "2026-11-16T18:00:00.000Z",
  "timeZone": "America/New_York",
  "isOnline": false,
  "venueName": "Metropolitan Convention Center",
  "venueAddress": "100 Tech Blvd",
  "city": "San Francisco",
  "capacity": 500,
  "ticketTypes": [
    {
      "name": "General Admission",
      "price": 149.00,
      "totalQuantity": 400,
      "maxPerUser": 5
    },
    {
      "name": "VIP All-Access",
      "price": 399.00,
      "totalQuantity": 100,
      "maxPerUser": 2
    }
  ]
}
```

### `POST /events/:id/submit`
Submits an event draft for administrative approval.
- **Access**: `ORGANIZER` (must own event)

---

## 3. Concurrency-Safe Booking & Ticketing

### `POST /bookings/reservations`
Atomically holds ticket inventory for 10 minutes.
- **Access**: `ATTENDEE`, `ORGANIZER`, `ADMIN`
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
  - `201 Created`: Returns `reservationId`, `expiresAt`, itemized amounts.
  - `409 Conflict`: Insufficient capacity/inventory.

### `POST /bookings/:id/pay`
Executes mock payment and converts active reservation into confirmed tickets.
- **Access**: Authenticated (must own reservation)
- **Request Body**:
```json
{
  "reservationId": "res-uuid",
  "paymentMethod": "CARD",
  "simulateSuccess": true,
  "paymentDetails": {
    "cardLast4": "4242",
    "cardHolder": "Jane Doe"
  }
}
```
- **Responses**:
  - `200 OK`: Confirmed booking and generated digital QR tickets.
  - `410 Gone`: Reservation expired.
  - `402 Payment Required`: Simulated payment declined.

### `POST /bookings/:id/cancel`
Cancels a confirmed booking if eligible under cancellation policy.
- **Access**: Authenticated (owner)

---

## 4. Ticket Verification & Check-In

### `POST /tickets/validate`
Validates a ticket token without marking it checked in (preview mode).
- **Access**: `ORGANIZER`, `ADMIN`

### `POST /tickets/check-in`
Atomically checks in an attendee using their unique QR token or ticket number.
- **Access**: `ORGANIZER` (event owner), `ADMIN`
- **Request Body**:
```json
{
  "ticketToken": "opaque-secure-uuid-token"
}
```
- **Responses**:
  - `200 OK`: Check-in recorded with attendee name and ticket type.
  - `409 Conflict`: Already checked in.
  - `403 Forbidden`: Unauthorized for this event.

---

## 5. Administration Endpoints

### `GET /admin/overview`
Platform-wide stats (total users, total bookings, gross revenue, pending approvals).
- **Access**: `ADMIN`

### `GET /admin/events/pending`
Queue of events submitted for moderation.
- **Access**: `ADMIN`

### `POST /admin/events/:id/approve`
Approves an event, transitioning status to `APPROVED` or `PUBLISHED`.
- **Access**: `ADMIN`

### `POST /admin/events/:id/reject`
Rejects an event with structured feedback for the organizer.
- **Access**: `ADMIN`

### `GET /admin/organizer-requests`
Lists pending organizer applications.
- **Access**: `ADMIN`

### `POST /admin/organizer-requests/:id/approve`
Approves organizer privileges for a user.
- **Access**: `ADMIN`

### `PATCH /admin/users/:id/status`
Suspends or reactivates a user account.
- **Access**: `ADMIN`
