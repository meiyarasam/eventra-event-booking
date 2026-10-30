# EVENTRA — System Flow Diagrams

This document illustrates the end-to-end lifecycle flows for the **EVENTRA** Event Discovery, Booking & Ticketing Platform:
1. Registration & Mock Email Verification Flow
2. Event Creation, Draft Submission & Admin Approval Lifecycle
3. Concurrency-Safe Ticket Reservation (10-Minute Hold)
4. Mock Payment Simulation & Idempotent Confirmation
5. Scannable QR Pass Gate Admission & Double-Entry Rejection
6. Self-Service Booking Cancellation & Inventory Release

---

## 1. Registration & Mock Email Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant Web as Next.js 14 Frontend
    participant API as Express REST API
    participant DB as Neon PostgreSQL (Prisma)

    Attendee->>Web: Submits name, email, password
    Web->>API: POST /api/v1/auth/register
    API->>DB: Check email uniqueness
    API->>API: Hash password with bcryptjs (salt 12)
    API->>DB: Create User (Role: ATTENDEE, emailVerified: false)
    API->>API: Generate Access Token & Refresh Token
    API-->>Web: Set HTTP-Only Auth Cookies + User Data
    Web-->>Attendee: Prompt to verify email (/verify-email) with mock code note
    
    Attendee->>Web: Enters fixed mock verification code: 123456
    Web->>API: POST /api/v1/auth/verify-email { email, tokenOrOtp: "123456" }
    API->>DB: UPDATE User SET emailVerified = true WHERE email = :email
    API-->>Web: 200 OK (Account Fully Verified)
    Web-->>Attendee: Redirect to Discover Events (/events)
```

---

## 2. Event Creation & Admin Approval Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Organizer Creates Event
    DRAFT --> PENDING_APPROVAL: Organizer Submits for Review
    PENDING_APPROVAL --> APPROVED: Admin Approves Event
    PENDING_APPROVAL --> REJECTED: Admin Rejects with Reason
    REJECTED --> DRAFT: Organizer Updates Details and Resubmits
    APPROVED --> PUBLISHED: Organizer or Admin Publishes Event Live
    PUBLISHED --> CANCELLED: Organizer Cancels (Attendees Notified)
    PUBLISHED --> COMPLETED: Event End Date Passes
```

---

## 3. Concurrency-Safe Ticket Reservation (10-Minute Hold)

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant Web as Next.js Frontend
    participant API as Express API
    participant Tx as DB Interactive Transaction

    Attendee->>Web: Selects ticket tier & quantity
    Web->>API: POST /api/v1/bookings/reservations
    API->>Tx: BEGIN TRANSACTION (SERIALIZABLE)
    Tx->>Tx: Purge expired reservations (expiresAt <= now)
    Tx->>Tx: Check availableQuantity >= requestedQuantity
    alt Insufficient Capacity
        Tx-->>API: ROLLBACK
        API-->>Web: 409 Conflict ("Insufficient inventory")
        Web-->>Attendee: Display capacity alert banner
    else Inventory Available
        Tx->>Tx: Insert InventoryReservation (ACTIVE, 10 min TTL)
        Tx->>Tx: Insert ReservationItem rows
        Tx-->>API: COMMIT
        API-->>Web: 201 Created (reservationId, expiresAt)
        Web-->>Attendee: Redirect to Checkout with 10:00 Countdown Timer
    end
```

---

## 4. Mock Payment Simulation & Idempotent Confirmation

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant Web as Next.js Frontend
    participant API as Express API
    participant Tx as DB Transaction

    Attendee->>Web: Chooses Card / UPI & clicks "Confirm Booking"
    Web->>API: POST /api/v1/bookings/pay
    API->>Tx: Verify reservation active & not expired
    alt Simulation = DECLINE
        API->>Tx: Record PaymentSimulation (status: FAILED)
        API-->>Web: 402 Payment Declined
        Web-->>Attendee: Display payment failure alert with retry option
    else Simulation = SUCCESS
        Tx->>Tx: Mark InventoryReservation CONFIRMED
        Tx->>Tx: Increment soldQuantity on TicketTypes
        Tx->>Tx: Create Booking (Status: CONFIRMED)
        Tx->>Tx: Record PaymentSimulation (Status: SUCCESS, unique reference)
        loop For each reserved ticket
            Tx->>Tx: Generate unique opaque ticketToken
            Tx->>Tx: Generate unique ticketNumber (TKT-XXXX)
            Tx->>Tx: Insert Ticket (Status: VALID)
        end
        Tx-->>API: COMMIT
        API-->>Web: 200 OK (bookingId, tickets, QR passes)
        Web-->>Attendee: Redirect to /booking/success with printable digital passes
    end
```

---

## 5. Gate Admission & Check-In Validation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Venue Staff / Organizer
    participant Scanner as Organizer Scanner Web App
    participant API as Express REST API
    participant DB as PostgreSQL Database

    Staff->>Scanner: Scans QR code or enters ticketNumber
    Scanner->>API: POST /api/v1/tickets/check-in { ticketToken }
    API->>DB: Query ticket by opaque token
    alt Ticket not found
        API-->>Scanner: 404 Not Found ("Invalid ticket")
        Scanner-->>Staff: Red "Access Denied" Alert
    else Ticket belongs to different event
        API-->>Scanner: 403 Forbidden ("Wrong event admission")
        Scanner-->>Staff: Red "Access Denied: Wrong Event"
    else Ticket status == CHECKED_IN
        API-->>Scanner: 409 Conflict ("Already checked in at [time]")
        Scanner-->>Staff: Amber "Duplicate Entry Alert"
    else Ticket status == VALID
        API->>DB: Atomically UPDATE Ticket SET status = 'CHECKED_IN', checkedInAt = NOW()
        API-->>Scanner: 200 OK ("Admission Confirmed")
        Scanner-->>Staff: Green "Pass Verified — Admit One"
    end
```

---

## 6. Booking Cancellation & Inventory Release

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant Web as Next.js Frontend
    participant API as Express API
    participant Tx as DB Transaction

    Attendee->>Web: Requests cancellation with reason
    Web->>API: POST /api/v1/bookings/:id/cancel
    API->>Tx: Verify booking ownership & eligibility (> 48h before event start)
    Tx->>Tx: Mark Booking CANCELLED
    Tx->>Tx: Mark all associated Tickets CANCELLED
    Tx->>Tx: Decrement soldQuantity on TicketTypes (restore capacity)
    Tx-->>API: COMMIT
    API-->>Web: 200 OK ("Booking cancelled, capacity restored")
    Web-->>Attendee: Updated status badge & cancellation receipt
```
