# EVENTRA System Workflows & Flowcharts

This document specifies the end-to-end operational workflows for the **EVENTRA** Event Discovery, Booking & Ticketing Platform. Each flow is modeled with Mermaid flowcharts, sequence diagrams, and state machines to provide an exhaustive technical reference for development, QA, and security auditing.

---

## 1. User Registration & Login Flow

The platform provides role-aware authentication using JSON Web Tokens (JWT) stored in HTTP-Only cookies.

```mermaid
sequenceDiagram
    autonumber
    actor User as Attendee / Organizer
    participant Web as Next.js Web App
    participant API as Express API
    participant DB as Neon PostgreSQL (Prisma)

    %% Registration
    rect rgb(240, 248, 255)
    Note over User,DB: Account Registration Workflow
    User->>Web: Enter Name, Email, Password, and optional Phone
    Web->>API: POST /api/v1/auth/register { name, email, password, phone }
    activate API
    API->>DB: Check if email already exists
    alt Email already registered
        DB-->>API: Existing user found
        API-->>Web: 409 Conflict ("Email already in use")
        Web-->>User: Display alert: "Email already registered. Please log in."
    else Email available
        API->>API: Hash password with bcryptjs (salt rounds: 12)
        API->>DB: Create User (role: 'ATTENDEE', status: 'ACTIVE', emailVerified: false)
        API->>DB: Create UserProfile record
        API->>API: Sign Access Token (15m) & Refresh Token (7d)
        API-->>Web: Set HTTP-Only cookies (accessToken, refreshToken) + 201 Created
        deactivate API
        Web-->>User: Redirect to /verify-email to confirm account
    end
    end

    %% Login & Session Refresh
    rect rgb(255, 250, 240)
    Note over User,DB: User Login & Session Establishment
    User->>Web: Navigate to /login and enter Email & Password
    Web->>API: POST /api/v1/auth/login { email, password }
    activate API
    API->>DB: Query User by email (including profile)
    alt User not found or status == 'SUSPENDED'
        API-->>Web: 401 Unauthorized / 403 Forbidden ("Invalid credentials or suspended")
        Web-->>User: Display error message
    else Valid User
        API->>API: Compare password with bcryptjs.compare()
        alt Password Mismatch
            API-->>Web: 401 Unauthorized ("Invalid credentials")
        else Password Valid
            API->>API: Sign fresh Access Token & Refresh Token
            API-->>Web: Set HTTP-Only cookies + 200 OK (User Data & Role)
            deactivate API
            Web-->>User: Redirect to Role Dashboard (Admin -> /admin, Organizer -> /organizer, Attendee -> /events)
        end
    end
    end
```

---

## 2. Mock Email Verification Flow

To provide an instant, reliable verification experience during testing and demonstration without external SMTP failure risks, the platform implements a deterministic mock email verification flow using the fixed code `123456`.

```mermaid
sequenceDiagram
    autonumber
    actor User as Registered User
    participant Web as Next.js Web App (/verify-email)
    participant API as Express API (/api/v1/auth)
    participant DB as Neon PostgreSQL (Prisma)

    User->>Web: Views email verification prompt
    Note over User,Web: UI displays: "Enter verification code (Use test code: 123456)"

    alt User submits invalid code (e.g. 999999)
        User->>Web: Submits code: "999999"
        Web->>API: POST /api/v1/auth/verify-email { email, tokenOrOtp: "999999" }
        activate API
        API->>API: Verify tokenOrOtp == "123456"
        API-->>Web: 400 Bad Request ("Invalid verification code. Please check and try again.")
        deactivate API
        Web-->>User: Display red validation error banner
    else User submits valid mock code "123456"
        User->>Web: Submits code: "123456"
        Web->>API: POST /api/v1/auth/verify-email { email, tokenOrOtp: "123456" }
        activate API
        API->>DB: Query User by email
        alt User does not exist
            API-->>Web: 404 Not Found ("User account not found")
        else User exists
            API->>DB: UPDATE User SET emailVerified = true WHERE id = userId
            API->>DB: INSERT Notification ("Email verified successfully")
            API-->>Web: 200 OK { success: true, message: "Email verified successfully" }
            deactivate API
            Web-->>User: Display success modal and redirect to /events
        end
    end

    Note over User,Web: Optional Resend Code Workflow
    User->>Web: Clicks "Resend Code"
    Web->>API: POST /api/v1/auth/resend-verification { email }
    activate API
    API->>DB: Query User by email
    API-->>Web: 200 OK ("Verification code dispatched. Use test code 123456.")
    deactivate API
    Web-->>User: Show toast: "New verification code ready: 123456"
```

---

## 3. Event Discovery, AI Search & Filtering Flow

```mermaid
flowchart TD
    Start([User visits /events]) --> Choice{Discovery Method}
    
    Choice -->|Standard Filters| FilterBranch[Select Category, City, Price, or Date Presets]
    Choice -->|Ask AI Natural Search| AIBranch[User types: 'free weekend tech events in San Francisco']
    
    AIBranch --> AIPost[POST /api/v1/ai/parse-search]
    AIPost --> AIService[AI Engine: Google Gemini API with Deterministic NLP Fallback]
    AIService --> StructuredParams[Extracted: city='San Francisco', isOnline=false, freeOnly=true]
    StructuredParams --> FilterBranch

    FilterBranch --> APIFetch[GET /api/v1/events with query parameters]
    APIFetch --> DBQuery[(PostgreSQL: SELECT * FROM Event WHERE status = 'PUBLISHED')]
    DBQuery --> Response[Return paginated events list with ticket pricing]
    Response --> GridView[Render Event Cards with live status badges]
    
    GridView --> SelectEvent[User clicks Event Card]
    SelectEvent --> DetailFetch[GET /api/v1/events/:idOrSlug]
    DetailFetch --> RenderDetail[Display event overview, venue, agenda, ticket tiers & countdown]
```

---

## 4. Organizer Event Creation & Publishing Flow

Organizers configure tiered tickets, seating capacity, and event descriptions with integrated Google Gemini AI assistance.

```mermaid
flowchart TD
    A([Organizer logs in]) --> B[Navigate to /organizer/events/new]
    B --> C[Fill Event Logistics: Title, Category, Dates, Venue/Online]
    C --> D{Need AI Copywriting?}
    
    D -->|Yes| E[Click 'Generate with AI']
    E --> F[POST /api/v1/ai/generate-description]
    F --> G[Gemini 1.5 synthesizes 2-3 paragraph marketing copy]
    G --> H[Populate Description Form]
    D -->|No| H
    
    H --> I[Configure Ticket Tiers: Name, Price, Quantity, Max/User]
    I --> J[Upload Event Banner Image / Cloudinary Preset]
    J --> K[Submit Form: POST /api/v1/events]
    K --> L[(Database: Event created with status DRAFT)]
    
    L --> M{Action Decision}
    M -->|Save as Draft| N([Event preserved as DRAFT for future editing])
    M -->|Submit for Approval| O[POST /api/v1/events/:id/submit]
    O --> P[(Update Event status to PENDING_APPROVAL)]
    P --> Q[Send In-App Notification to Platform Admins]
    Q --> R([Awaiting Admin Review])
```

---

## 5. Admin Moderation & Approval Workflow

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Organizer Creates Event
    DRAFT --> DRAFT: Organizer edits details or ticket types
    DRAFT --> PENDING_APPROVAL: Organizer submits event for review
    
    PENDING_APPROVAL --> APPROVED: Admin approves submission
    PENDING_APPROVAL --> REJECTED: Admin rejects submission (with feedback)
    
    REJECTED --> DRAFT: Organizer reviews feedback, updates details, and resubmits
    
    APPROVED --> PUBLISHED: Organizer or Admin publishes event live
    
    PUBLISHED --> COMPLETED: Event end date passes
    PUBLISHED --> CANCELLED: Organizer cancels event (triggers refunds/alerts)
    APPROVED --> CANCELLED: Organizer cancels event prior to publication
```

---

## 6. Concurrency-Safe Ticket Reservation (10-Minute Hold)

The two-phase reservation protocol locks seat inventory inside an interactive transaction to prevent overselling during high-concurrency booking rushes.

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant Web as Next.js Web App
    participant API as Bookings API
    participant Tx as Prisma $transaction
    participant DB as PostgreSQL (Neon)

    Attendee->>Web: Selects ticket tier and count (e.g. 2 x VIP)
    Attendee->>Web: Clicks "Proceed to Checkout"
    Web->>API: POST /api/v1/bookings/reservations { eventId, items: [{ ticketTypeId, quantity: 2 }] }
    activate API
    API->>Tx: Begin Interactive Transaction
    Tx->>DB: Clean expired holds: UPDATE InventoryReservation SET status = 'EXPIRED' WHERE expiresAt <= NOW()
    Tx->>DB: Query TicketType: totalQuantity, soldQuantity, and SUM(active held seats)
    
    alt Remaining Capacity < Requested (e.g. 1 seat left, requested 2)
        Tx-->>API: Rollback: Insufficient capacity
        API-->>Web: 409 Conflict ("Tickets sold out or temporarily held by another attendee")
        Web-->>Attendee: Display capacity alert banner with option to refresh
    else Sufficient Capacity Available
        Tx->>DB: INSERT InventoryReservation (status: 'ACTIVE', expiresAt: NOW() + 10m)
        Tx->>DB: INSERT ReservationItem records
        Tx-->>API: Commit Transaction
        API-->>Web: 201 Created { reservationId, expiresAt, totalAmount }
        deactivate API
        Web-->>Attendee: Redirect to Checkout with live 10:00 Countdown Timer
    end
```

---

## 7. Mock Payment Simulation & Booking Confirmation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant Web as Checkout Page (/bookings/[id])
    participant API as Express API
    participant Tx as Prisma $transaction
    participant DB as PostgreSQL (Neon)
    participant Email as Email Service

    Attendee->>Web: Chooses Payment Method (Credit/Debit Card or UPI)
    Attendee->>Web: Enters simulated cardholder or UPI ID
    Attendee->>Web: Clicks "Pay & Confirm Booking"
    Web->>API: POST /api/v1/bookings/pay { reservationId, paymentMethod, paymentDetails, simulateSuccess }
    activate API
    API->>Tx: Begin Interactive Transaction
    Tx->>DB: SELECT * FROM InventoryReservation WHERE id = :reservationId FOR UPDATE
    
    alt Reservation Status != 'ACTIVE' OR NOW() >= expiresAt
        Tx->>DB: UPDATE InventoryReservation SET status = 'EXPIRED'
        Tx-->>API: Rollback
        API-->>Web: 410 Gone ("Reservation expired. The tickets have been released.")
        Web-->>Attendee: Display expiration modal and offer return to catalog
    else Hold Active and Valid
        API->>API: Execute Mock Payment Simulation
        alt Simulation = Failure (Declined card test)
            Tx->>DB: INSERT PaymentSimulation (status: 'FAILED', failureReason: 'Card Declined')
            Tx-->>API: Commit failure log
            API-->>Web: 402 Payment Required ("Simulated payment declined. Please try another method.")
            Web-->>Attendee: Display payment error with retry button
        else Simulation = Success
            Tx->>DB: UPDATE InventoryReservation SET status = 'CONFIRMED'
            Tx->>DB: UPDATE TicketType SET soldQuantity = soldQuantity + :quantity
            Tx->>DB: INSERT Booking (status: 'CONFIRMED', bookingReference: 'EVT-...')
            Tx->>DB: INSERT BookingItem records
            loop For each reserved ticket seat
                Tx->>DB: Generate opaque UUID ticketToken
                Tx->>DB: INSERT Ticket (status: 'VALID', ticketNumber: 'TKT-...', ticketToken)
            end
            Tx->>DB: INSERT PaymentSimulation (status: 'SUCCESS', transactionReference: 'TXN-...')
            Tx->>DB: INSERT Notification ("Booking Confirmed")
            Tx-->>API: Commit Transaction
            API->>Email: Dispatch confirmation receipt with embedded QR passes
            API-->>Web: 200 OK { booking, tickets, qrPasses }
            deactivate API
            Web-->>Attendee: Redirect to /booking/success with printable digital passes
        end
    end
```

---

## 8. QR Ticket Generation & Gate Scanner Check-in Flow

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    actor Staff as Venue Staff / Organizer
    participant Scanner as Mobile QR Camera Scanner (/organizer/scanner)
    participant API as Ticket Check-in API
    participant DB as Neon PostgreSQL

    Attendee->>Staff: Presents mobile screen with Digital QR Pass
    Staff->>Scanner: Points camera at QR code (decodes opaque ticketToken)
    Scanner->>API: POST /api/v1/tickets/check-in { ticketToken }
    activate API
    API->>DB: Query Ticket by ticketToken (joined with Event and TicketType)
    
    alt Ticket Token Not Found
        API-->>Scanner: 404 Not Found ("Invalid entry ticket")
        Scanner-->>Staff: Red Alert: "UNKNOWN TICKET"
    else Caller does not own Event (and is not Admin)
        API-->>Scanner: 403 Forbidden ("Unauthorized: You do not manage this event")
        Scanner-->>Staff: Red Alert: "WRONG EVENT ADMISSION"
    else Ticket Status == 'CANCELLED'
        API-->>Scanner: 400 Bad Request ("Ticket was cancelled by purchaser")
        Scanner-->>Staff: Red Alert: "VOID / CANCELLED TICKET"
    else Ticket Status == 'CHECKED_IN'
        API-->>Scanner: 409 Conflict ("Duplicate entry: Already checked in at " + checkedInAt)
        Scanner-->>Staff: Amber Alert: "DUPLICATE PASS — ALREADY ADMITTED"
    else Ticket Status == 'VALID'
        API->>DB: UPDATE Ticket SET status = 'CHECKED_IN', checkedInAt = NOW(), checkedInById = staffId
        API->>DB: INSERT AuditLog ("Ticket Checked In")
        API-->>Scanner: 200 OK { attendeeName, ticketType, checkedInAt }
        deactivate API
        Scanner-->>Staff: Green Banner: "ADMIT ONE — Alex Attendee (VIP Pass)"
        Scanner-->>Staff: Play admission chime & trigger subtle haptic vibration
    end
```

---

## 9. Self-Service Booking Cancellation Flow

```mermaid
flowchart TD
    A([Attendee visits /tickets or /bookings/:id]) --> B[Select Confirmed Booking]
    B --> C[Click 'Cancel Booking']
    C --> D[Display Cancellation Policy & Confirmation Modal]
    D --> E[Attendee enters cancellation reason & confirms]
    E --> F[POST /api/v1/bookings/:id/cancel]
    
    F --> G{Server Eligibility Validation}
    G -->|Event starts in less than 48 hours| H[400 Bad Request: Ineligible under 48h cancellation policy]
    G -->|Already Cancelled| I[400 Bad Request: Booking already cancelled]
    
    G -->|Eligible for Cancellation| J[Begin Database Interactive Transaction]
    J --> K[UPDATE Booking SET status = 'CANCELLED', cancelledAt = NOW()]
    J --> L[UPDATE Ticket SET status = 'CANCELLED' WHERE bookingId = :id]
    J --> M[UPDATE TicketType SET soldQuantity = soldQuantity - quantity]
    J --> N[INSERT Notification to Attendee & Organizer]
    J --> O[Commit Transaction]
    
    O --> P[Dispatch Cancellation Email Alert]
    P --> Q[200 OK: Booking cancelled, capacity returned to pool]
    Q --> R([UI updates status badge to CANCELLED and hides QR entry pass])
```

---

## 10. Role-Based Access Control (RBAC) & Route Protection Flow

```mermaid
flowchart TD
    Req([Client HTTP Request]) --> AuthGuard{JWT Present in Cookie / Header?}
    
    AuthGuard -->|No| PublicCheck{Route is Public?}
    PublicCheck -->|Yes| AllowPublic[Execute Route Controller]
    PublicCheck -->|No| RejectAuth[401 Unauthorized: Authentication Required]
    
    AuthGuard -->|Yes| VerifyToken[Verify JWT Signature & Expiration]
    VerifyToken -->|Invalid / Expired| RejectToken[401 Unauthorized: Invalid Token]
    VerifyToken -->|Valid| FetchUser[Retrieve User from DB & Check status == 'ACTIVE']
    
    FetchUser -->|Suspended| RejectSuspended[403 Forbidden: Account Suspended]
    FetchUser -->|Active| RoleCheck{requireRole matches User.role?}
    
    RoleCheck -->|Matches or is ADMIN| ExecuteEndpoint[Execute Protected Feature Controller]
    RoleCheck -->|Insufficient Role| RejectRole[403 Forbidden: Insufficient Permissions]
```
