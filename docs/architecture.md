# EVENTRA Application Architecture

## 1. System Overview

EVENTRA is built as a modular full-stack event discovery, booking, and ticketing platform designed for high concurrency, strict role-based access control, and independent deployment of the frontend and backend services.

```mermaid
graph TB
    subgraph Client["Client Tier (Browser / Mobile Web)"]
        User["Attendees, Organizers & Admins"]
    end

    subgraph Frontend["Frontend Tier (Vercel)"]
        NextApp["Next.js 14 App Router"]
        RQ["TanStack Query (Cache & Server State)"]
        Zustand["Zustand Store (UI State & Auth Cache)"]
        NextApp --> RQ
        NextApp --> Zustand
    end

    subgraph APITier["Backend API Tier (Render)"]
        ExpressApp["Express.js REST API (/api/v1)"]
        
        subgraph Middlewares["Security & Transport Pipeline"]
            Helmet["Helmet Security Headers"]
            CORS["Strict CORS Middleware"]
            RateLimit["Rate Limiter (Brute-force protection)"]
            AuthMid["JWT & HTTP-only Cookie Auth"]
            RoleMid["Role-Based Access Control (RBAC)"]
        end

        subgraph Modules["Domain Modules"]
            AuthMod["Auth Module"]
            UserMod["User & Profile Module"]
            EventMod["Event & Category Module"]
            ReserveMod["Inventory Reservation Engine"]
            BookingMod["Booking & Confirmation Service"]
            PaymentMod["Mock Payment Simulation Engine"]
            TicketMod["QR Code Generation & Check-In"]
            AdminMod["Admin Moderation & Audit Module"]
            NotifMod["Notification Service"]
        end
    end

    subgraph DataStorage["Data & Cloud Services Tier"]
        NeonDB[("Neon Serverless PostgreSQL")]
        PrismaORM["Prisma ORM (Connection Pooler & Direct)"]
        Cloudinary["Cloudinary (Event Banners / Assets)"]
        EmailService["Email Notification Provider (Optional)"]
    end

    User -->|"HTTPS (Browser)"| NextApp
    NextApp -->|"HTTPS / REST API with Cookies"| ExpressApp
    ExpressApp --> Middlewares
    Middlewares --> Modules
    Modules --> PrismaORM
    PrismaORM -->|"SSL / TLS"| NeonDB
    Modules -.->|"Asset Uploads"| Cloudinary
    Modules -.->|"Transactional Alerts"| EmailService
```

---

## 2. Tier Breakdown

### 2.1 Client & Frontend Application (`apps/web`)
- **Framework**: Next.js 14 using the App Router.
- **State Management**:
  - **TanStack Query**: Server-state caching, automatic background refetching, and mutation invalidation.
  - **Zustand**: Client-side session and UI state (modals, ticket selection drafts, toast notifications).
- **Forms & Validation**: React Hook Form coupled with Zod schemas sourced from `@eventra/shared`.
- **UI & Styling**: Vanilla CSS and Tailwind CSS following an editorial, premium design aesthetic (navy/charcoal text, warm off-white background, restrained coral accents, and clear subtle borders).
- **Analytics & Visuals**: Recharts for organizer and admin metrics; `qrcode.react` for rendering digital QR passes.

### 2.2 Backend API Service (`apps/api`)
- **Runtime**: Node.js with Express.js written in TypeScript with strict typing.
- **Modular Structure**: Domain-driven feature modules (`auth`, `users`, `events`, `categories`, `tickets`, `bookings`, `payments`, `organizers`, `notifications`, `admin`).
- **Validation**: Incoming requests are validated at the middleware level using Zod.
- **Centralized Error Handling**: Custom `AppError` class mapping business exceptions to standardized HTTP status codes and structured JSON responses.

### 2.3 Database Tier (Neon PostgreSQL & Prisma ORM)
- **Engine**: PostgreSQL hosted on Neon Serverless.
- **Connection Management**:
  - `DATABASE_URL`: Utilizes Neon's connection pooler for high-throughput runtime queries.
  - `DIRECT_URL`: Direct TCP connection for Prisma migrations and schema pushes.
- **Data Integrity**: Foreign keys with cascading rules, database-level unique constraints, transaction-wrapped inventory reservations, and indexes on lookup columns.

---

## 3. Concurrency & Inventory Reservation Architecture

To prevent overselling under high concurrency (flash sales and popular events), EVENTRA uses a two-phase reservation pattern:

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant API as Express API
    participant DB as Neon PostgreSQL (Prisma)
    
    Attendee->>API: POST /api/v1/bookings/reservations (Items: TicketTypeId, Quantity)
    activate API
    API->>DB: Begin Serializable/Interactive Transaction
    DB->>DB: Clean expired reservations for event
    DB->>DB: Check (TotalCapacity - SoldTickets - ActiveReservations) >= Requested
    alt Insufficient Inventory
        DB-->>API: Rollback & Error: Insufficient tickets available
        API-->>Attendee: 409 Conflict (Sold out or held by others)
    else Sufficient Inventory
        DB->>DB: Create InventoryReservation (Expires in 10 mins)
        DB->>DB: Commit Transaction
        API-->>Attendee: 201 Created (Reservation ID & TTL countdown)
    end
    deactivate API

    Note over Attendee,API: Attendee proceeds to Mock Payment during 10-minute window

    Attendee->>API: POST /api/v1/bookings/:id/pay (Payment Details)
    activate API
    API->>DB: Begin Interactive Transaction
    DB->>DB: Verify Reservation is ACTIVE and not expired (now() < expiresAt)
    alt Reservation Expired
        DB->>DB: Mark Reservation EXPIRED
        API-->>Attendee: 410 Gone (Reservation expired, tickets released)
    else Reservation Valid
        API->>API: Execute Mock Payment Engine (Simulate success/failure)
        DB->>DB: Mark Reservation CONFIRMED
        DB->>DB: Increment TicketType.soldQuantity
        DB->>DB: Create Booking record
        DB->>DB: Generate Individual Tickets with unique QR tokens
        DB->>DB: Record PaymentSimulation log
        DB->>DB: Create In-App Notification
        DB->>DB: Commit Transaction
        API-->>Attendee: 200 OK (Booking confirmation & QR Ticket passes)
    end
    deactivate API
```

---

## 4. Security Architecture

1. **Authentication**: Short-lived JSON Web Tokens (15 minutes) signed with HMAC-SHA256, paired with rotating Refresh Tokens (7 days) stored in `HttpOnly`, `SameSite=Lax`, and `Secure` cookies.
2. **Password Security**: Passwords hashed using `bcryptjs` with salt rounds = 12. Plaintext passwords are never logged or stored.
3. **Role-Based Authorization (RBAC)**: Strict role guards on backend routes verifying token identity against the database, preventing privilege escalation.
4. **Ownership Validation**: Every operation on events, bookings, tickets, and profiles verifies that `req.user.id` owns the target entity or possesses `ADMIN` privileges.
5. **No Client Trust**: Ticket prices, totals, capacities, and validity are calculated exclusively on the server.
6. **QR Code Security**: QR codes store an opaque cryptographically-random UUID token (`ticketToken`). The check-in endpoint validates this token server-side, preventing ticket forgery.
