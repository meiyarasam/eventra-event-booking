# EVENTRA System Workflows & Flowcharts

This document specifies the operational flows for authentication, organizer onboarding, event management, ticketing, concurrency-safe booking, and check-in validation.

---

## 1. Authentication & Session Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js Web App
    participant API as Express API
    participant DB as Neon DB

    %% Registration
    rect rgb(240, 248, 255)
    Note over User,DB: Registration Flow
    User->>Web: Fill Registration (Name, Email, Password)
    Web->>API: POST /api/v1/auth/register
    API->>DB: Check if Email exists
    alt Email already registered
        API-->>Web: 409 Conflict (Email in use)
    else Email available
        API->>API: Hash password with bcryptjs (salt 12)
        API->>DB: Create User (Role: ATTENDEE) + Profile
        API->>API: Generate Access Token & Refresh Token
        API-->>Web: Set HTTP-Only Cookie + 201 Created (User Data)
        Web-->>User: Redirect to Discovery / Dashboard
    end
    end

    %% Login & Session Refresh
    rect rgb(255, 250, 240)
    Note over User,DB: Login & Session Refresh Flow
    User->>Web: Enter Email & Password
    Web->>API: POST /api/v1/auth/login
    API->>DB: Fetch User by Email
    API->>API: Compare password hash
    alt Invalid Credentials
        API-->>Web: 401 Unauthorized
    else Valid Credentials
        API->>API: Generate Access & Refresh Tokens
        API-->>Web: Set HTTP-Only Cookies (accessToken, refreshToken)
        Web-->>User: Authenticated Session Established
    end

    Note over User,DB: Automatic Token Refresh
    Web->>API: POST /api/v1/auth/refresh (Cookie: refreshToken)
    API->>API: Verify Refresh Token signature
    API->>DB: Validate user active status
    API-->>Web: Set new Access Token Cookie + 200 OK
    end
```

---

## 2. Organizer Onboarding & Approval Flow

```mermaid
flowchart TD
    A([Attendee logs in]) --> B[Navigate to 'Become an Organizer']
    B --> C[Submit Application Form: Org Name, Reason, Website]
    C --> D[POST /api/v1/organizer-requests]
    D --> E[(Database: OrganizerRequest created with status PENDING)]
    E --> F[In-app Notification sent to Admins]
    F --> G[Admin opens Admin Moderation Dashboard]
    G --> H{Admin Review Decision}
    H -->|Approve| I[PATCH /api/v1/admin/organizer-requests/:id/approve]
    H -->|Reject| J[PATCH /api/v1/admin/organizer-requests/:id/reject with reason]
    I --> K[(Update User Role to ORGANIZER & Request to APPROVED)]
    J --> L[(Request status to REJECTED with feedback)]
    K --> M[Send In-app notification to User: 'Application Approved!']
    L --> N[Send In-app notification to User with rejection reason]
    M --> O([User can now access Organizer Dashboard and create events])
    N --> P([User remains Attendee; can re-apply later])
```

---

## 3. Event Creation, Moderation, and Publication Flow

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Organizer creates event
    DRAFT --> DRAFT: Organizer edits details / adds ticket types
    DRAFT --> PENDING_APPROVAL: Organizer clicks 'Submit for Review'
    
    PENDING_APPROVAL --> APPROVED: Admin approves event
    PENDING_APPROVAL --> REJECTED: Admin rejects event (with feedback)
    
    REJECTED --> DRAFT: Organizer adjusts details and resubmits
    
    APPROVED --> PUBLISHED: Organizer or Auto-publish makes event live
    
    PUBLISHED --> COMPLETED: Event end date passes
    PUBLISHED --> CANCELLED: Organizer cancels event (triggers attendee refund/alert)
    APPROVED --> CANCELLED: Organizer cancels event
```

---

## 4. Concurrency-Safe Ticket Booking & Mock Payment Flow

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant UI as Event Details Page
    participant API as Booking Service
    participant DB as Neon PostgreSQL

    Attendee->>UI: Selects Ticket Type & Quantity (e.g. 2 x VIP)
    UI->>API: POST /api/v1/bookings/reservations
    
    rect rgb(245, 255, 245)
    Note over API,DB: Transactional Inventory Reservation
    API->>DB: BEGIN TRANSACTION
    API->>DB: Clean expired reservations for event
    API->>DB: Check remaining inventory: (Capacity - Sold - ActiveReservations)
    alt Stock Insufficient
        API->>DB: ROLLBACK
        API-->>UI: 400 Bad Request / 409 Conflict ("Tickets sold out")
    else Stock Available
        API->>DB: Create InventoryReservation (TTL: 10 mins)
        API->>DB: Create ReservationItems
        API->>DB: COMMIT
        API-->>UI: 201 Created (reservationId, expiresAt, totalAmount)
    end
    end

    UI-->>Attendee: Display Checkout Screen with 10:00 Countdown Timer
    Attendee->>UI: Chooses Payment Method (Simulated Card or UPI)
    Attendee->>UI: Clicks "Complete Payment"
    UI->>API: POST /api/v1/bookings/:id/pay

    rect rgb(255, 245, 245)
    Note over API,DB: Transactional Confirmation & Ticket Issuance
    API->>DB: BEGIN TRANSACTION
    API->>DB: Lock Reservation row & check status is ACTIVE and now() < expiresAt
    alt Reservation Expired
        API->>DB: Set status EXPIRED
        API->>DB: COMMIT
        API-->>UI: 410 Gone ("Reservation expired, tickets released")
    else Reservation Active
        API->>API: Execute Mock Payment Engine
        alt Payment Failed (Test Failure Card or Sim Fail)
            API->>DB: Record PaymentSimulation (status: FAILED)
            API->>DB: COMMIT
            API-->>UI: 402 Payment Required ("Simulated payment declined")
        else Payment Succeeded
            API->>DB: Update Reservation status to CONFIRMED
            API->>DB: Create Booking record (Status: CONFIRMED)
            API->>DB: Increment TicketType.soldQuantity by reserved count
            API->>DB: Generate Ticket records (Status: VALID, unique ticketToken & ticketNumber)
            API->>DB: Record PaymentSimulation (status: SUCCESS)
            API->>DB: Create In-app Notification ("Booking Confirmed")
            API->>DB: COMMIT
            API-->>UI: 200 OK (Booking details + QR Ticket passes)
            UI-->>Attendee: Display Booking Confirmation & Digital QR Tickets
        end
    end
    end
```

---

## 5. Booking Cancellation Flow

```mermaid
flowchart TD
    A([Attendee opens 'My Bookings']) --> B[Select eligible confirmed booking]
    B --> C[Click 'Cancel Booking']
    C --> D[Display Policy Modal: Check cancellation deadline]
    D --> E[Confirm Cancellation]
    E --> F[POST /api/v1/bookings/:id/cancel]
    F --> G{Server Eligibility Validation}
    G -->|Event within 48h or Already Cancelled| H[400 Bad Request: Ineligible for cancellation]
    G -->|Eligible| I[BEGIN TRANSACTION]
    I --> J[Mark Booking status = CANCELLED]
    I --> K[Mark all associated Tickets = CANCELLED]
    I --> L[Decrement TicketType.soldQuantity]
    I --> M[Record Audit Log & Create Notification]
    I --> N[COMMIT TRANSACTION]
    N --> O[200 OK: Booking cancelled, inventory released]
    O --> P([Updated Booking Status reflected in Attendee & Organizer views])
```

---

## 6. QR Code Check-In Validation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Organizer as Event Organizer / Staff
    participant Scanner as Camera QR Scanner / Manual Input
    participant API as Ticket Check-In API
    participant DB as Neon PostgreSQL

    Organizer->>Scanner: Scan Attendee's Digital QR Ticket
    Scanner->>API: POST /api/v1/tickets/check-in (ticketToken)
    
    API->>DB: Verify Event Ownership (Organizer owns the ticket's event)
    alt Organizer does not own this event
        API-->>Organizer: 403 Forbidden ("You are not authorized to check in for this event")
    else Authorized
        API->>DB: BEGIN TRANSACTION (Row Lock on Ticket)
        API->>DB: SELECT * FROM Ticket WHERE ticketToken = :ticketToken
        
        alt Ticket Not Found
            API->>DB: ROLLBACK
            API-->>Organizer: 404 Not Found ("Invalid ticket token")
        else Ticket Status == CANCELLED
            API->>DB: ROLLBACK
            API-->>Organizer: 400 Bad Request ("Ticket has been cancelled")
        else Ticket Status == CHECKED_IN
            API->>DB: ROLLBACK
            API-->>Organizer: 409 Conflict ("Already checked in at " + checkedInAt)
        else Ticket Status == VALID
            API->>DB: UPDATE Ticket SET status = 'CHECKED_IN', checkedInAt = now(), checkedInById = :userId
            API->>DB: COMMIT
            API-->>Organizer: 200 OK ("Check-in Successful! Attendee: Alex Attendee, Ticket: VIP")
        end
    end
```
