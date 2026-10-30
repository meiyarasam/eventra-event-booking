# EVENTRA — AI-Powered Event Discovery, Booking & Ticketing Platform

[![Live Website](https://img.shields.io/badge/Live%20Website-Vercel-success?style=for-the-badge&logo=vercel)](https://eventra-lxtc0uqsr-meiyarasanmeiyarasan3-7028s-projects.vercel.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/meiyarasam/eventra-event-booking.git)

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Backend-Express.js%20TypeScript-000000?style=flat&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%205-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%28Neon%29-336791?style=flat&logo=postgresql)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20API-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Live Production Website:** [https://eventra-lxtc0uqsr-meiyarasanmeiyarasan3-7028s-projects.vercel.app/](https://eventra-lxtc0uqsr-meiyarasanmeiyarasan3-7028s-projects.vercel.app/)  
> **Source Repository:** [https://github.com/meiyarasam/eventra-event-booking.git](https://github.com/meiyarasam/eventra-event-booking.git)  
> **Technical Documentation:** [Architecture](docs/architecture.md) | [System Flows](docs/flows.md) | [ER Diagram](docs/er-diagram.md) | [REST API Docs](docs/api-documentation.md)

---

## Table of Contents

- [1. Problem Statement & Proposed Solution](#1-problem-statement--proposed-solution)
  - [1.1 Problem Statement](#11-problem-statement)
  - [1.2 Proposed Solution](#12-proposed-solution)
- [2. Complete Feature Catalog by User Role](#2-complete-feature-catalog-by-user-role)
  - [2.1 👤 Attendee Discovery & Booking Experience](#21--attendee-discovery--booking-experience)
  - [2.2 🎪 Organizer Studio, Lifecycle & Check-In](#22--organizer-studio-lifecycle--check-in)
  - [2.3 🛡️ Administrative Governance & Moderation](#23--administrative-governance--moderation)
  - [2.4 🤖 Google Gemini AI Capabilities](#24--google-gemini-ai-capabilities)
  - [2.5 ✉️ Transactional Email & Digital QR Passes](#25--transactional-email--digital-qr-passes)
  - [2.6 🔔 Global Notification & Toast System](#26--global-notification--toast-system)
- [3. Technology Stack Matrix](#3-technology-stack-matrix)
- [4. System Architecture & Workflows](#4-system-architecture--workflows)
  - [4.1 High-Level Architecture](#41-high-level-architecture)
  - [4.2 Two-Phase Concurrency-Safe Reservation Flow](#42-two-phase-concurrency-safe-reservation-flow)
- [5. Functional System Modules](#5-functional-system-modules)
- [6. System Requirements](#6-system-requirements)
  - [6.1 Functional Requirements](#61-functional-requirements)
  - [6.2 Non-Functional Requirements](#62-non-functional-requirements)
- [7. Monorepo Directory Structure](#7-monorepo-directory-structure)
- [8. Concurrency & Overselling Prevention Architecture](#8-concurrency--overselling-prevention-architecture)
- [9. Installation & Local Setup Guide](#9-installation--local-setup-guide)
- [10. Environment Variables Configuration](#10-environment-variables-configuration)
- [11. Role-Based Access Control & Demo Accounts](#11-role-based-access-control--demo-accounts)
- [12. Automated Testing & Verification](#12-automated-testing--verification)
- [13. Production Deployment Guide](#13-production-deployment-guide)
- [14. REST API Endpoint Summary](#14-rest-api-endpoint-summary)
- [15. Future Roadmap & Enhancements](#15-future-roadmap--enhancements)
- [16. Contributing Guidelines & License](#16-contributing-guidelines--license)

---

## 1. Problem Statement & Proposed Solution

### 1.1 Problem Statement
Event management and ticket booking can become challenging when event information, ticket availability, and booking records are handled through fragmented or unorganized systems. Attendees frequently find it difficult to discover relevant events, access accurate event logistics, and track their bookings in real-time. 

Organizers face challenges in managing event logistics, configuring ticket categories and dynamic pricing, maintaining seating capacities, and executing fraud-proof gate admissions. Administrators lack unified tools to moderate event publishing, review organizer credentials, and audit financial transactions. Furthermore, race conditions during high-demand flash sales often result in overselling, double bookings, and ticket fraud when systems lack inventory-locking concurrency controls.

### 1.2 Proposed Solution
**EVENTRA** is a centralized, full-stack event discovery, booking, and ticket management platform engineered for attendees, organizers, and administrators. It unites event publishing, natural-language discovery, inventory-aware ticket reservations, digital QR entry pass generation, and administrative governance in an integrated monorepo.

Key solutions delivered by EVENTRA include:
- **Two-Phase Inventory Reservation**: Locks ticket inventory inside interactive transactions with a 10-minute hold TTL, preventing overselling under high concurrency.
- **Cryptographic QR Digital Passes**: Issues high-density QR entry passes powered by opaque validation tokens (`ticketToken`) with real-time gate scanner validation and duplicate entry prevention.
- **Multi-Modal AI Integration**: Embeds Google Gemini 1.5 Flash for one-click marketing copywriting, natural-language search parsing, personalized event recommendations, and a 24/7 floating assistant.
- **Deterministic Mock Checkout & Verification**: Provides instant testing with simulated Card/UPI payments and deterministic email verification (`123456`) that updates database verification status with zero third-party dependencies.
- **Modular Monorepo Architecture**: Decouples the Next.js 14 App Router frontend, Express.js TypeScript API backend, and shared validation schemas (`@eventra/shared`).

---

## 2. Complete Feature Catalog by User Role

### 2.1 👤 Attendee Discovery & Booking Experience
- **Multi-Faceted Catalog Discovery**: Browse events dynamically filtered by verified cities, event categories, price range (including free admission filter), and date presets (`All Dates`, `Today`, `Tomorrow`, `This Weekend`, `Upcoming`).
- **Natural-Language AI Search**: Attendee search input powered by Google Gemini converts plain English sentences (e.g. *"free tech conferences in Bengaluru tomorrow"*) into structured database filter parameters.
- **10-Minute Hold Reservation**: Transparent 10:00 checkout countdown timer locking seats during payment completion.
- **Deterministic Payment Simulation**: Simulated payment processing supporting **Credit/Debit Card** (with customizable test outcomes) and **UPI Virtual Payment Address**.
- **Digital Passes Dashboard**: Dedicated ticket management ([`/tickets`](file:///d:/Files/Project/Event/apps/web/app/tickets/page.tsx) and [`/bookings/:id`](file:///d:/Files/Project/Event/apps/web/app/bookings/[id]/page.tsx)) with embedded scannable QR passes and printable ticket sheets.
- **Self-Service Cancellation**: Cancel eligible bookings up to 48 hours prior to event start with automated seat release back to the inventory pool.
- **Saved Events / Wishlist**: One-click bookmarking of upcoming events for future reference.

### 2.2 🎪 Organizer Studio, Lifecycle & Check-In
- **Event Authoring Studio**: Configure event logistics, time zones, physical venues or virtual webinar links, seat capacities, and tiered ticket types (e.g., General Admission, Early Bird, VIP).
- **AI Event Description Writer**: One-click generative copywriting powered by Google Gemini synthesizes marketing-ready descriptions with agenda bullets and audience highlights.
- **Approval Workflow**: Strict moderation pipeline transitions events: `DRAFT` ➔ `PENDING_APPROVAL` ➔ `APPROVED` ➔ `PUBLISHED`.
- **Live Check-In Scanner**: Real-time camera QR scanner ([`/organizer/scanner`](file:///d:/Files/Project/Event/apps/web/app/organizer/scanner/page.tsx)) or manual reference lookup. Validates entry passes, admits attendees, and rejects duplicate check-ins (`CHECKED_IN` status).
- **Sales Analytics Dashboard**: Real-time charts powered by Recharts tracking gross ticket revenue, capacity occupancy, and check-in rates.
- **Event Cancellation with Attendee Alerts**: Organizers can cancel events with a mandatory cancellation reason dialog. Cancelling an event atomically cancels all tickets, releases reservations, notifies booked attendees via in-app alerts, and sends email notifications.

### 2.3 🛡️ Administrative Governance & Moderation
- **Centralized Admin Console**: Dedicated dashboard at [`/admin`](file:///d:/Files/Project/Event/apps/web/app/admin/page.tsx) restricted to `ADMIN` accounts.
- **Platform Bookings & Ticket Audit**: Comprehensive platform bookings audit at [`/admin/bookings`](file:///d:/Files/Project/Event/apps/web/app/admin/bookings/page.tsx). Inspect ticket tiers, transaction references, attendee contact info, and trigger 1-click confirmation email resends.
- **System Announcement Broadcasts**: Dispatch broadcast notifications at [`/admin/notifications`](file:///d:/Files/Project/Event/apps/web/app/admin/notifications/page.tsx) to all registered users or targeted user roles.
- **Event Moderation Queue**: Review pending submissions with approval and rejection reason feedback.
- **User Governance**: Inspect attendee and organizer accounts, toggle active/suspended statuses, or perform soft deletions preserving historical booking records.
- **Organizer Applications Review**: Review attendee requests to become event organizers with one-click approval or structured rejection reasons.

### 2.4 🤖 Google Gemini AI Capabilities
The platform features a multi-tiered AI service ([`apps/api/src/modules/ai/ai.service.ts`](file:///d:/Files/Project/Event/apps/api/src/modules/ai/ai.service.ts)) integrating the **Google Gemini API** (`gemini-1.5-flash`) with high-precision deterministic NLP fallbacks:
1. **AI Event Description Writer**: Synthesizes 2-3 paragraph marketing copy from title, category, and venue inputs (`POST /api/v1/ai/generate-description`).
2. **Natural-Language Search Parsing**: Converts natural language queries into structured database filters (`POST /api/v1/ai/parse-search`).
3. **Personalized Event Recommendations**: Suggests events based on user booking history and trending categories (`GET /api/v1/ai/recommendations`).
4. **Floating AI Event Guide Chatbot**: 24/7 bottom-right floating widget ([`AIChatWidget`](file:///d:/Files/Project/Event/apps/web/components/ai/ai-chat-widget.tsx)) answering navigation, ticketing, and event questions (`POST /api/v1/ai/chat`).

### 2.5 ✉️ Transactional Email & Digital QR Passes
Powered by Nodemailer ([`apps/api/src/services/email.service.ts`](file:///d:/Files/Project/Event/apps/api/src/services/email.service.ts)) with an in-memory dev preview store for local testing:
- **Mock Email Verification**: Deterministic verification using fixed code `123456` immediately updates `User.emailVerified = true` in PostgreSQL.
- **Password Reset**: Single-use recovery tokens with 1-hour expiration.
- **Digital Ticket Delivery**: Sent upon booking confirmation with event details and high-resolution QR pass image attachments.
- **Event Cancellation Alerts**: Automated alerts dispatched if an organizer cancels an event.
- **Resend Capability**: Dedicated endpoint (`POST /api/v1/bookings/:id/resend-email`) for immediate receipt redelivery.

### 2.6 🔔 Global Notification & Toast System
- **Floating Toast Notifications**: Fixed at `fixed top-5 right-5 z-[9999]` with dark glassmorphic obsidian styling (`bg-[#0B151E]/95`), vivid status borders, micro-animations, and auto-dismiss/manual close.
- **Persistent In-App Notification Center**: Inbox drawer in the header navigation displaying booking receipts, moderation updates, cancellation notices, and admin announcements with unread count badges.

---

## 3. Technology Stack Matrix

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router, React) | `14.2.x` | Modern server/client component rendering, SEO metadata, routing. |
| **UI Library** | React | `18.3.x` | Interactive, component-driven user interface. |
| **Programming Language**| TypeScript | `5.5.x` | Static end-to-end type safety across client, server, and shared schemas. |
| **Styling & Theme** | Tailwind CSS | `3.4.x` | Responsive styling: obsidian theme (`#0B0F19`, `#111827`), brand orange (`#FF6A00`), coral (`#FF3D8E`). |
| **Icons & Visuals** | Lucide React | `0.428.x` | Scalable vector icon library. |
| **Client State** | Zustand | `4.5.x` | Reactive client state management (Auth session, Toast notifications). |
| **Server State & Caching**| TanStack React Query | `5.51.x` | Asynchronous data fetching, background refetching, mutation management. |
| **Forms & Validation** | React Hook Form + Zod | `7.52.x / 3.23.x` | High-performance form state with strict schema validation. |
| **Backend Runtime** | Node.js | `20.x LTS` | Server-side execution environment. |
| **Backend Framework** | Express.js | `4.19.x` | Modular, event-driven RESTful API backend. |
| **Database** | PostgreSQL (Neon) | `16.x` | Serverless relational database with PgBouncer connection pooling. |
| **ORM** | Prisma ORM | `5.18.x` | Schema migrations, relational models, and transactional queries. |
| **Security & Auth** | JWT + bcryptjs + Helmet | `9.0.x / 2.4.x` | HTTP-only cookie tokens, password hashing, and HTTP security headers. |
| **QR Code Engine** | qrcode / qrcode.react | `1.5.x / 3.1.x` | High-density DataURL and canvas QR generation for entry passes. |
| **AI Integration** | Google Gemini REST API | `gemini-1.5-flash`| Generative copywriting, NLP query interpretation, and chat reasoning. |
| **Email Transport** | Nodemailer | `10.2.x` | Standardized SMTP mail delivery with local development fallback store. |
| **Data Visualizations** | Recharts | `2.12.x` | SVG analytics charts for revenue, tickets sold, and check-in rates. |
| **Monorepo Management** | npm workspaces | `v10.x` | Multi-package workspace organizing `apps/web`, `apps/api`, and `packages/shared`. |
| **Shared Package** | `@eventra/shared` | Internal | Centralized validation schemas, DTOs, and TypeScript interfaces. |
| **Testing Suite** | Jest + ts-jest + Supertest | `29.x` | Automated backend integration and controller testing. |
| **API Documentation** | OpenAPI 3.0 / Swagger UI | `5.0.x` | Interactive API explorer hosted at `/api/v1/docs`. |

---

## 4. System Architecture & Workflows

### 4.1 High-Level Architecture

```mermaid
flowchart TD
    subgraph Client Layer
        Web[Next.js 14 Web Application - Port 3000]
        Scanner[Mobile QR Camera Scanner]
        AIWidget[Floating AI Assistant Widget]
    end

    subgraph API Gateway & Controllers
        API[Express.js TypeScript Server - Port 5000]
        AuthGuard[JWT Auth Guard & RBAC Middleware]
        RateLimit[Rate Limiter & Security Headers]
    end

    subgraph Service Layer
        AIService[AI Service - Gemini API + NLP Fallback]
        BookingService[Booking & Concurrency Engine]
        EmailService[Nodemailer SMTP Pipeline]
        EventService[Event Lifecycle & Moderation Engine]
        TicketService[QR Ticket & Check-In Service]
    end

    subgraph Persistence Layer
        Prisma[Prisma ORM 5]
        PostgreSQL[(Neon PostgreSQL Serverless)]
        DevStore[(In-Memory Dev Fallback Store)]
    end

    Web -->|REST / HTTP-Only Cookies| API
    Scanner -->|Check-In Scans| API
    AIWidget -->|Chat & NLP Queries| API
    API --> RateLimit --> AuthGuard
    AuthGuard --> AIService
    AuthGuard --> BookingService
    AuthGuard --> EventService
    AuthGuard --> TicketService
    BookingService --> EmailService
    EventService --> EmailService
    BookingService --> Prisma
    EventService --> Prisma
    TicketService --> Prisma
    Prisma -.->|Pooled & Direct TLS| PostgreSQL
    Prisma -.->|Offline Fallback| DevStore
```

### 4.2 Two-Phase Concurrency-Safe Reservation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant Web as Web Client
    participant API as Bookings API
    participant DB as Prisma / Database
    participant Worker as Expiry Worker
    participant Email as Email Service

    Attendee->>Web: Select ticket quantities & click Reserve
    Web->>API: POST /api/v1/bookings/reservations
    activate API
    API->>DB: Begin interactive transaction
    Note over DB: Calculate available = total - (sold + active_held)
    alt Available capacity < requested quantity
        DB-->>API: Conflict Error (Capacity Exceeded)
        API-->>Web: 409 Conflict: Insufficient remaining seats
    else Capacity Available
        DB->>DB: Create InventoryReservation (status: ACTIVE, expiresAt: now + 10m)
        DB-->>API: Commit transaction & return reservationId
        API-->>Web: 201 Created (10-minute hold lock active)
    end
    deactivate API

    Note over Web: 10-Minute Checkout Timer Starts

    alt Attendee abandons checkout / timer expires
        Worker->>DB: Poll for active reservations where expiresAt <= now()
        DB->>DB: Update status to EXPIRED (capacity restored instantly)
    else Attendee completes payment simulation
        Attendee->>Web: Submit Card / UPI payment
        Web->>API: POST /api/v1/bookings/pay
        activate API
        API->>DB: Begin interactive transaction
        DB->>DB: Verify reservation is ACTIVE and not expired
        DB->>DB: Create Booking record & generate individual Ticket rows
        DB->>DB: Increment soldQuantity on TicketType atomically
        DB->>DB: Mark reservation as CONFIRMED
        DB-->>API: Commit transaction
        API->>Email: Dispatch confirmation email with embedded QR passes
        API-->>Web: 200 OK (Booking Confirmed & QR passes issued)
        deactivate API
    end
```

---

## 5. Functional System Modules

| No. | Module Name | Core Capabilities & Endpoints |
| :--- | :--- | :--- |
| **1** | **User Authentication** | User registration, login, logout, mock email verification with code `123456`, password recovery, token refresh, and RBAC enforcement. |
| **2** | **Event Management** | Multi-attribute event creation, editing, category taxonomy, moderation lifecycle (`DRAFT` ➔ `PENDING_APPROVAL` ➔ `APPROVED` ➔ `PUBLISHED`), and cancellation. |
| **3** | **Ticket Management** | Tiered ticket types, dynamic pricing, seating capacities, per-user limits, and real-time inventory tracking. |
| **4** | **Booking & Reservation** | Two-phase inventory reservation with 10-minute TTL, Card/UPI payment simulation, atomic booking confirmation, and self-service cancellation. |
| **5** | **Digital Passes & QR Verification**| Cryptographic QR token generation, mobile camera check-in scanner, gate validation, and duplicate check-in prevention. |
| **6** | **Organizer Management** | Organizer promotion requests, event authoring studio, attendee manifests, and Recharts sales telemetry. |
| **7** | **Administration** | Overview telemetry, event moderation queue, organizer approval, user governance, platform bookings audit, and system announcement broadcasts. |
| **8** | **Notification Management** | In-app notification inbox drawer with unread badges, booking confirmations, cancellation notices, and admin broadcasts. |
| **9** | **Saved Events** | One-click bookmarking allowing users to save events for future booking reference. |
| **10**| **AI-Assisted Features** | Google Gemini 1.5 Flash integration for AI description generation, natural-language search parsing, personalized recommendations, and 24/7 floating chat guide. |

---

## 6. System Requirements

### 6.1 Functional Requirements
1. **User Authentication**: The system shall support user registration, login, session renewal, and password recovery.
2. **Mock Email Verification**: The system shall verify accounts using the fixed mock code `123456`, persisting `User.emailVerified = true` in PostgreSQL.
3. **Event Discovery**: Users shall be able to browse and search for events using keyword search, date presets, city filters, and natural-language AI search.
4. **Event Management**: Organizers shall be able to create, update, and manage events across their lifecycle.
5. **Ticket Tiering**: The system shall support multiple ticket types per event with independent pricing and seat quantities.
6. **Concurrency-Safe Reservation**: The system shall hold available ticket capacity for 10 minutes during checkout inside database transactions.
7. **Payment Simulation**: The system shall simulate Card and UPI payment flows, issuing immediate confirmations.
8. **Digital Pass Generation**: The system shall generate digital tickets with cryptographic QR tokens.
9. **Gate Scanner Verification**: The system shall validate QR passes via device camera and prevent duplicate admissions.
10. **Self-Service Cancellation**: Users shall be able to cancel bookings more than 48 hours before event start, automatically releasing reserved capacity.
11. **Organizer Requests**: Attendees shall be able to apply for organizer status subject to administrative review.
12. **Event Moderation**: Administrators shall review, approve, or reject event submissions with structured feedback.
13. **Notifications**: The system shall provide in-app alerts and glassmorphic toast notifications.
14. **AI Assistance**: The system shall support AI copywriting and query parsing via Google Gemini 1.5 Flash.

### 6.2 Non-Functional Requirements
1. **Security**: Enforce password hashing (`bcryptjs` salt 12), JWT access/refresh tokens in HTTP-Only cookies, Helmet security headers, and CORS origin validation.
2. **Data Integrity**: Concurrency control and database transactions shall eliminate ticket overselling and ghost bookings.
3. **Usability**: Responsive, dark-themed editorial UI with clear navigation, accessible form validation, and instant visual feedback.
4. **Maintainability**: Clean monorepo structure separating frontend, backend, and shared validation packages.
5. **Reliability**: Centralized error handling (`AppError`), deterministic fallbacks for AI and email services, and an in-memory dev store for offline execution.
6. **Responsiveness**: Fluid layout adapting across mobile, tablet, and desktop screens.
7. **Scalability**: Decoupled deployment on Vercel and Render with Neon connection pooling.
8. **Performance**: Sub-200ms API response times for indexed queries and fast client-side transitions via TanStack Query.
9. **Data Persistence**: Third Normal Form PostgreSQL schema managed with Prisma ORM.
10. **Compatibility**: Full compatibility with modern evergreen browsers (Chrome, Firefox, Safari, Edge).
11. **Auditability**: Administrative audit trail for approvals, status changes, and cancellations.

---

## 7. Monorepo Directory Structure

```
eventra-event-booking/
├── apps/
│   ├── web/                             # Next.js 14 App Router Frontend (Vercel)
│   │   ├── app/
│   │   │   ├── (auth)/                  # Auth portal routes
│   │   │   │   ├── login/               # Attendee & Organizer login
│   │   │   │   ├── register/            # Account registration
│   │   │   │   ├── verify-email/        # Mock OTP confirmation (Code: 123456)
│   │   │   │   ├── forgot-password/     # Password recovery dispatch
│   │   │   │   └── reset-password/      # New password configuration
│   │   │   ├── about/                   # About page with platform background
│   │   │   ├── admin/                   # Administrative operations
│   │   │   │   ├── bookings/            # Platform bookings & ticket management
│   │   │   │   ├── notifications/       # Announcement broadcast dispatch
│   │   │   │   ├── categories/          # Category taxonomy management
│   │   │   │   ├── coupons/             # Discount coupon management
│   │   │   │   ├── events/              # Event catalog management & moderation
│   │   │   │   ├── organizers/          # Organizer application review
│   │   │   │   └── users/               # User governance & status audit
│   │   │   ├── bookings/                # Attendee checkout & booking receipts
│   │   │   ├── events/                  # Public catalog with AI search & date presets
│   │   │   ├── organizer/               # Organizer studio, analytics & QR scanner
│   │   │   ├── tickets/                 # Attendee digital QR passes
│   │   │   ├── contact/                 # Platform support contact
│   │   │   ├── globals.css              # Custom tokens and utility animations
│   │   │   └── layout.tsx               # Root layout with providers & AI widget
│   │   ├── components/
│   │   │   ├── ai/                      # AIChatWidget component
│   │   │   ├── layout/                  # Header, Footer, PageAtmosphere
│   │   │   └── ui/                      # Accessible design system primitives
│   │   ├── lib/api.ts                   # Fetch API client with automatic token handling
│   │   └── store/                       # Zustand stores (Auth & Toast)
│   │
│   └── api/                             # Express.js TypeScript REST API (Render)
│       ├── prisma/
│       │   ├── schema.prisma            # PostgreSQL schema with 16 relational models
│       │   └── seed.ts                  # Seed script with test events & default users
│       └── src/
│           ├── config/                  # Environment, database, and dev fallback store
│           ├── middleware/              # Auth guard, RBAC, error handler, rate limiters
│           ├── modules/                 # Feature modules (controllers, routes, services)
│           │   ├── admin/               # Admin bookings, moderation, broadcasts
│           │   ├── ai/                  # AI description, search parsing, recommendations, chat
│           │   ├── auth/                # JWT auth, mock email verification, password reset
│           │   ├── bookings/            # 10-minute hold reservations, payments, tickets
│           │   ├── categories/          # Category catalog endpoints
│           │   ├── events/              # Event discovery, filtering, lifecycle
│           │   ├── notifications/       # In-app notification delivery
│           │   ├── organizers/          # Organizer applications and check-in
│           │   ├── tickets/             # QR check-in and pass verification
│           │   └── upload/              # Event banner upload handling
│           ├── services/
│           │   └── email.service.ts     # Nodemailer SMTP & dev preview mailer
│           ├── app.ts                   # Express server mounting & CORS
│           └── server.ts                # Bootstrap & reservation cleanup worker
│
├── packages/
│   └── shared/                          # Monorepo shared contract library
│       └── src/                         # TypeScript interfaces, DTOs, Zod schemas
│
├── docs/                                # Technical Architecture & Specification Documents
│   ├── architecture.md                  # Comprehensive system architecture & security spec
│   ├── flows.md                         # Detailed sequence diagrams & state machines
│   ├── flow-diagram.md                  # System flow diagram summary
│   ├── er-diagram.md                    # Entity-Relationship model & Prisma reference
│   └── api-documentation.md             # REST API endpoint reference & schemas
│
├── .env.example                         # Environment configuration template
├── package.json                         # Workspaces root definition
└── README.md                            # Comprehensive project documentation
```

---

## 8. Concurrency & Overselling Prevention Architecture

EVENTRA uses a dual-protection concurrency model implemented identically in both the PostgreSQL database layer ([`bookings.service.ts`](file:///d:/Files/Project/Event/apps/api/src/modules/bookings/bookings.service.ts)) and the fallback store ([`dev-fallback-store.ts`](file:///d:/Files/Project/Event/apps/api/src/config/dev-fallback-store.ts)):

1. **Pre-Booking Verification**:
   Before allocating a hold, the system calculates effective real-time availability:
   $$\text{Available Seats} = \text{Total Capacity} - \text{Sold Quantity} - \text{Active Unexpired Held Seats}$$
2. **Atomic Hold Allocation**:
   When an attendee selects seats, an `InventoryReservation` record is created inside an interactive transaction with status `ACTIVE` and an expiration timestamp `expiresAt = now() + 10m`.
3. **Automatic Expiration Cleanup**:
   An automated background worker runs periodically to transition abandoned reservations to `EXPIRED`, immediately releasing capacity back to the public pool.
4. **Isolated Payment Confirmation**:
   Final booking confirmation updates ticket inventory atomically:
   ```typescript
   await tx.ticketType.update({
     where: { id: item.ticketTypeId },
     data: { soldQuantity: { increment: item.quantity } },
   });
   ```
   If payment simulation fails or connection drops, the entire transaction rolls back cleanly with zero inventory leakage.

---

## 9. Installation & Local Setup Guide

### Prerequisites
- **Node.js**: `v18.18.0` or higher (`v20.x` LTS recommended)
- **NPM**: `v9.0.0` or higher
- **PostgreSQL Database** *(Optional in development)*: Local PostgreSQL instance or a free [Neon](https://neon.tech) database. If no database is connected, EVENTRA automatically activates its built-in in-memory fallback store.

### Step 1: Clone the Repository
```bash
git clone https://github.com/meiyarasam/eventra-event-booking.git
cd eventra-event-booking
```

### Step 2: Install Monorepo Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the template file to active configuration files:
```bash
# Windows (cmd / PowerShell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

### Step 4: Build Shared Validation Package
```bash
npm --workspace=packages/shared run build
```

### Step 5: (Optional) Initialize Database with Prisma
If connecting to a real PostgreSQL database:
```bash
# Generate Prisma Client
npm --workspace=apps/api run db:generate

# Push schema tables
npm --workspace=apps/api run db:push

# Seed database with sample categories, events, and default accounts
npm --workspace=apps/api run db:seed
```

### Step 6: Start Development Servers
Run the backend and frontend in separate terminals:

**Terminal 1 — Backend API (Port 5000):**
```bash
npm --workspace=apps/api run dev
```

**Terminal 2 — Frontend Web (Port 3000):**
```bash
npm --workspace=apps/web run dev
```

Open your browser and navigate to:
- **Web Application:** [`http://localhost:3000`](http://localhost:3000)
- **API Health Check:** [`http://localhost:5000/api/v1/health`](http://localhost:5000/api/v1/health)
- **Interactive Swagger Docs:** [`http://localhost:5000/api/v1/docs`](http://localhost:5000/api/v1/docs)

---

## 10. Environment Variables Configuration

Refer to the `.env.example` file in the root directory for placeholder configurations:

```ini
# ==========================================
# EVENTRA - Environment Configuration Template
# ==========================================

# -----------------
# API Service (.env for apps/api)
# -----------------
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# Frontend Origin for CORS & Cookie Setting
FRONTEND_URL=http://localhost:3000
COOKIE_DOMAIN=localhost

# PostgreSQL Database (Neon PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@ep-sample-pooler.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require

# Authentication Secrets (minimum 32 characters in production)
JWT_SECRET=your_super_secret_jwt_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_min_32_chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Default Admin & Demo Accounts Seed Configuration
ADMIN_NAME=Admin Eventra
ADMIN_EMAIL=admin@eventra.com
ADMIN_PASSWORD=AdminPassword123!

ORGANIZER_NAME=Sarah Organizer
ORGANIZER_EMAIL=organizer@eventra.com
ORGANIZER_PASSWORD=OrganizerPassword123!

ATTENDEE_NAME=Alex Attendee
ATTENDEE_EMAIL=attendee@eventra.com
ATTENDEE_PASSWORD=AttendeePassword123!

# Email Delivery (SMTP Service - Optional in Dev, fallback preview store used if omitted)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM="EVENTRA Support <support@eventra.com>"

# AI Integration (Google Gemini API - Optional in Dev, deterministic NLP fallback used if omitted)
GEMINI_API_KEY=your_gemini_api_key_here

# -----------------
# Web Application (.env for apps/web)
# -----------------
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> [!NOTE]
> Never commit actual database passwords, email credentials, or API keys to version control. In production, provide these values via your hosting platform's secure environment variable settings.

---

## 11. Role-Based Access Control & Demo Accounts

EVENTRA enforces strict separation of privileges across three user roles. When seeded, the following demo accounts are available:

| Role | Dedicated Login Portal | Sample Credentials | Access Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `/admin/login` | `admin@eventra.com`<br>`AdminPassword123!` | Moderate events, review organizer applications, audit users, manage platform bookings and tickets, dispatch announcements. |
| **Event Organizer** | `/login` | `organizer@eventra.com`<br>`OrganizerPassword123!` | Create and edit events, configure ticket tiers, cancel events with attendee notices, live camera QR check-in scanner, sales analytics. |
| **Attendee** | `/login` | `attendee@eventra.com`<br>`AttendeePassword123!` | Search and filter events, reserve tickets with temporary hold, simulate Card/UPI checkout, view and print digital QR passes. |

> **Mock Email Verification Note:**  
> When testing account registration, any registered email address can be instantly verified using the fixed mock verification code: `123456`.

---

## 12. Automated Testing & Verification

The backend includes a comprehensive Jest integration test suite covering critical transaction, authentication, and concurrency flows:

```bash
# Run backend test suite
npm --workspace=apps/api test
```

### Static Analysis & Type Checking
To verify type correctness across all workspaces without running a build:
```bash
# Typecheck Frontend Web Application
npm --workspace=apps/web exec -- tsc --noEmit

# Typecheck Backend API Server
npm --workspace=apps/api exec -- tsc --noEmit

# Typecheck Shared Package
npm --workspace=packages/shared exec -- tsc --noEmit
```

---

## 13. Production Deployment Guide

### A. Serverless Database Deployment (Neon PostgreSQL)
1. Create a free PostgreSQL database project at [Neon.tech](https://neon.tech).
2. Copy the **Pooled Connection String** to `DATABASE_URL` and the **Direct Connection String** to `DIRECT_URL`.
3. Apply database tables and seed initial data:
   ```bash
   DATABASE_URL="your-neon-pooler-url" DIRECT_URL="your-neon-direct-url" npm --workspace=apps/api run db:push
   DATABASE_URL="your-neon-pooler-url" npm --workspace=apps/api run db:seed
   ```

### B. Backend API Deployment (Render / Railway)
1. Create a new Web Service connected to your GitHub repository.
2. Settings:
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
3. Add production environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `SMTP_*`, and `GEMINI_API_KEY`.

### C. Frontend Web Deployment (Vercel)
- **Live Production URL:** [https://eventra-lxtc0uqsr-meiyarasanmeiyarasan3-7028s-projects.vercel.app/](https://eventra-lxtc0uqsr-meiyarasanmeiyarasan3-7028s-projects.vercel.app/)

1. Import the repository into [Vercel](https://vercel.com).
2. Framework Preset: **Next.js**.
3. Set **Root Directory** to `apps/web`.
4. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-api-domain.com/api/v1`
   - `NEXT_PUBLIC_APP_URL`: `https://eventra-lxtc0uqsr-meiyarasanmeiyarasan3-7028s-projects.vercel.app`
5. Click **Deploy**.

---

## 14. REST API Endpoint Summary

Below is a summary of major endpoints exposed by the EVENTRA REST API. For exhaustive schemas, request payloads, and status codes, consult [docs/api-documentation.md](docs/api-documentation.md).

| Module | Method & Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/v1/auth/register` | Public | Register new attendee account. |
| **Auth** | `POST /api/v1/auth/login` | Public | Login and establish HTTP-Only session cookies. |
| **Auth** | `POST /api/v1/auth/verify-email` | Public | Verify account with mock code `123456`. |
| **Auth** | `POST /api/v1/auth/refresh` | Public | Silent access token refresh via cookie. |
| **Auth** | `GET /api/v1/auth/me` | Authenticated | Retrieve profile and active role of current user. |
| **Events** | `GET /api/v1/events` | Public | Filtered catalog search with pagination. |
| **Events** | `GET /api/v1/events/:idOrSlug` | Public | Retrieve detailed event logistics & ticket tiers. |
| **Events** | `POST /api/v1/events` | Organizer / Admin | Create new event draft. |
| **Events** | `POST /api/v1/events/:id/publish` | Organizer / Admin | Publish approved event live. |
| **Bookings**| `POST /api/v1/bookings/reservations` | Authenticated | Place 10-minute hold lock on ticket capacity. |
| **Bookings**| `POST /api/v1/bookings/pay` | Authenticated | Settle mock payment & generate digital tickets. |
| **Bookings**| `POST /api/v1/bookings/:id/cancel` | Authenticated | Cancel booking & release reserved inventory. |
| **Tickets** | `GET /api/v1/tickets/me` | Authenticated | List all digital passes for attendee. |
| **Tickets** | `POST /api/v1/tickets/check-in` | Organizer / Admin | Scan QR token & record gate check-in. |
| **Admin** | `GET /api/v1/admin/overview` | Admin | Platform-wide analytics and queue counts. |
| **Admin** | `POST /api/v1/admin/events/:id/review`| Admin | Approve or reject event submission. |
| **Admin** | `POST /api/v1/admin/notifications/broadcast` | Admin | Dispatch announcement to users. |
| **AI** | `POST /api/v1/ai/generate-description`| Organizer / Admin | Synthesize marketing event description. |
| **AI** | `POST /api/v1/ai/parse-search` | Public | Parse natural language query into filters. |
| **AI** | `POST /api/v1/ai/chat` | Public | Floating event assistant chatbot. |
| **System** | `GET /api/v1/health` | Public | Service health & deployment timestamp. |
| **System** | `GET /api/v1/docs` | Public | Interactive OpenAPI / Swagger UI. |

---

## 15. Future Roadmap & Enhancements

- [ ] **Live Payment Gateway Integration**: Integrate Razorpay / Stripe for processing real-world credit cards, net banking, and UPI transactions.
- [ ] **Interactive Venue Seat Maps**: Interactive SVG / WebGL seat selection for reserved auditorium seating.
- [ ] **Native Mobile Application**: React Native / Expo companion app optimized for offline gate entry scanning.
- [ ] **Webhooks & Third-Party Integrations**: Outgoing webhook alerts for CRM and enterprise ticketing sync.
- [ ] **Multi-Currency Settlement**: Dynamic currency conversion and multi-currency pricing for global events.

---

## 16. Contributing Guidelines & License

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

### License
This project is open-source and distributed under the **MIT License**. See `LICENSE` for details.
