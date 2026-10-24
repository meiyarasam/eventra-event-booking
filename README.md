# EVENTRA — AI-Powered Event Discovery, Booking & Ticketing Platform

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Backend-Express.js%20TypeScript-000000?style=flat&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%205-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%28Neon%29-336791?style=flat&logo=postgresql)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20API-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Repository:** `eventra-ai-event-platform`  
> A full-stack, enterprise-grade event discovery, booking, and ticket management platform engineered with concurrency-safe inventory reservations, cryptographic QR entry passes, automated email delivery, and multi-modal Google Gemini AI integrations.

---

## Table of Contents

- [1. Executive Summary & Overview](#1-executive-summary--overview)
- [2. Architectural Highlights & Problems Solved](#2-architectural-highlights--problems-solved)
- [3. Complete Feature Catalog](#3-complete-feature-catalog)
  - [3.1 🤖 Artificial Intelligence Capabilities](#31--artificial-intelligence-capabilities)
  - [3.2 👤 Attendee Discovery & Booking Experience](#32--attendee-discovery--booking-experience)
  - [3.3 🎪 Organizer Studio, Lifecycle & Check-In](#33--organizer-studio-lifecycle--check-in)
  - [3.4 🛡️ Administrative Governance & Moderation](#34--administrative-governance--moderation)
  - [3.5 ✉️ Transactional Email & Digital QR Passes](#35--transactional-email--digital-qr-passes)
  - [3.6 🔔 Global Notification & Toast System](#36--global-notification--toast-system)
- [4. Technology Stack Matrix](#4-technology-stack-matrix)
- [5. System Architecture & Workflows](#5-system-architecture--workflows)
- [6. Monorepo Directory Structure](#6-monorepo-directory-structure)
- [7. Concurrency & Overselling Prevention Architecture](#7-concurrency--overselling-prevention-architecture)
- [8. Installation & Local Setup Guide](#8-installation--local-setup-guide)
- [9. Environment Variables Configuration](#9-environment-variables-configuration)
- [10. Administrator Account & Service Configuration](#10-administrator-account--service-configuration)
- [11. Role-Based Access Control & Default Accounts](#11-role-based-access-control--default-accounts)
- [12. Automated Testing & Verification](#12-automated-testing--verification)
- [13. Production Deployment Guide](#13-production-deployment-guide)
- [14. Future Roadmap](#14-future-roadmap)
- [15. Contributing Guidelines & License](#15-contributing-guidelines--license)

---

## 1. Executive Summary & Overview

**EVENTRA** (`eventra-ai-event-platform`) is an open-source, full-stack event discovery, reservation, and ticketing solution. It bridges the gap between high-demand flash sales and system reliability by combining a reactive Next.js 14 frontend with an Express.js / TypeScript microservices-ready backend.

The platform eliminates ticket overselling through two-phase temporary inventory reservations with automatic 10-minute TTL expiry, provides cryptographic digital QR tickets for mobile entry, and embeds Google Gemini generative AI across the entire attendee and organizer lifecycle.

---

## 2. Architectural Highlights & Problems Solved

| Traditional Ticketing Issue | EVENTRA Engineering Solution |
| :--- | :--- |
| **Race Conditions & Overselling** | **Atomic Inventory Locking:** Temporary 10-minute hold reservation inside database transactions (`prisma.$transaction`) with background worker cleanup. |
| **Ticket Fraud & Scalping** | **Cryptographic QR Passes:** Single-use opaque validation tokens rendered into high-density QR codes with instant duplicate check-in rejection. |
| **Monolithic Coupling** | **Workspace Monorepo:** Decoupled Next.js 14 App Router frontend and Express.js REST API backend with shared validation schemas (`@eventra/shared`). |
| **Ghost Bookings & Lost Receipts** | **Automated Email Pipeline:** Instant dispatch of digital tickets with embedded QR codes, time-limited OTP account verification, and organizer cancellation alerts. |
| **Manual Event Copywriting** | **Google Gemini AI Studio:** 1-click generative event description synthesis grounded in category, venue, and highlights. |
| **Clunky Keyword Search** | **Natural-Language Search Parsing:** Interprets plain English queries (e.g., *"free tech events this weekend in San Francisco"*) into structured database filter parameters. |

---

## 3. Complete Feature Catalog

### 3.1 🤖 Artificial Intelligence Capabilities

The platform features a multi-tiered AI service ([`apps/api/src/modules/ai/ai.service.ts`](file:///d:/Files/Project/Event/apps/api/src/modules/ai/ai.service.ts)) integrating the **Google Gemini API** (`gemini-1.5-flash`) with high-precision deterministic NLP fallbacks:

```
                                  ┌────────────────────────┐
                                  │   Google Gemini API    │
                                  └───────────▲────────────┘
                                              │ (REST / API Key)
┌───────────────────────┐         ┌───────────┴────────────┐
│   User / Organizer    │ ──────► │   EVENTRA AI Service   │
│   Frontend Action     │         └───────────┬────────────┘
└───────────────────────┘                     │ (Fallback / Offline)
                                  ┌───────────▼────────────┐
                                  │ Deterministic Engine   │
                                  └────────────────────────┘
```

1. **✨ AI Event Description Writer:**
   - Available directly inside Organizer and Admin event creation/edit forms.
   - Generates comprehensive, marketing-ready 2-3 paragraph descriptions with agenda bullets and audience highlights from basic title, category, and venue inputs.
   - Endpoint: `POST /api/v1/ai/generate-description` (Protected).

2. **🔍 Natural-Language Event Search:**
   - Attendee search bar on `/events` featuring an **"Ask AI"** discovery input.
   - Converts natural sentences (e.g. *"music concerts under ₹500 in New York tomorrow"*) into structured parameters: `category`, `city`, `timeframe`, `minPrice`, `maxPrice`, and `freeOnly`.
   - Endpoint: `POST /api/v1/ai/parse-search` (Public).

3. **🎯 Personalized Event Recommendations:**
   - Dedicated "Recommended For You" showcase section atop the catalog based on user activity, booking history, and trending categories.
   - Endpoint: `GET /api/v1/ai/recommendations` (Public / User-personalized).

4. **💬 Floating AI Event Guide Chatbot:**
   - Accessible from every page via a floating action widget in the bottom-right corner ([`AIChatWidget`](file:///d:/Files/Project/Event/apps/web/components/ai/ai-chat-widget.tsx)).
   - Answers questions regarding platform navigation, digital QR pass retrieval, ticket policies, verification, and live events.
   - Endpoint: `POST /api/v1/ai/chat` (Public).

---

### 3.2 👤 Attendee Discovery & Booking Experience

- **Catalog Exploration:** Filter events dynamically by verified cities (populated from active database venues), event categories, price range, and free admission.
- **Date Presets:** 1-click filter pills for `All Dates`, `Today`, `Tomorrow`, `This Weekend`, and `Upcoming`.
- **Live Inventory Countdown:** Transparent 10-minute countdown timer while holding selected tickets during checkout.
- **Deterministic Mock Checkout:** Simulated payment processing supporting **Credit/Debit Card** (with customizable test outcomes) and **UPI Virtual Payment Address**.
- **Digital Passes Dashboard:** Dedicated pass management ([`/tickets`](file:///d:/Files/Project/Event/apps/web/app/tickets/page.tsx) and [`/bookings/:id`](file:///d:/Files/Project/Event/apps/web/app/bookings/[id]/page.tsx)) with embedded scannable QR passes and printable ticket sheets.
- **Self-Service Cancellation:** Cancel eligible reservations up to 48 hours prior to event start with automated seat release back to the inventory pool.

---

### 3.3 🎪 Organizer Studio, Lifecycle & Check-In

- **Event Authoring Studio:** Configure event logistics, time zones, physical venues or virtual webinar links, seat capacities, and tiered ticket types (e.g., General Admission, Early Bird, VIP).
- **Approval Workflow:** Strict moderation pipeline transitions events: `DRAFT` ➔ `PENDING_APPROVAL` ➔ `APPROVED` ➔ `PUBLISHED`.
- **Organizer Event Cancellation:** Organizers can cancel events with a mandatory cancellation reason dialog. Cancelling an event atomically marks tickets as `CANCELLED`, releases reservations, notifies booked attendees via in-app alerts, and sends email notifications.
- **Live Check-In Scanner:** Real-time QR scanner using device camera or manual reference lookup. Validates entry passes and prevents duplicate check-ins (`CHECKED_IN` status).
- **Sales Analytics:** Real-time charts powered by Recharts tracking gross ticket revenue, capacity occupancy, and check-in rates.

---

### 3.4 🛡️ Administrative Governance & Moderation

- **Centralized Admin Console:** Dedicated dashboard at [`/admin`](file:///d:/Files/Project/Event/apps/web/app/admin/page.tsx) strictly restricted to `ADMIN` accounts.
- **Bookings & Ticket Management:** Comprehensive platform bookings audit at [`/admin/bookings`](file:///d:/Files/Project/Event/apps/web/app/admin/bookings/page.tsx). Inspect ticket tiers, transaction references, attendee contact info, and trigger 1-click confirmation email resends.
- **System Announcement Broadcasts:** Dispatch broadcast notifications at [`/admin/notifications`](file:///d:/Files/Project/Event/apps/web/app/admin/notifications/page.tsx) to all registered users or targeted user roles.
- **Event Moderation Queue:** Review pending submissions with approval and rejection reason feedback.
- **User Governance:** Inspect attendee and organizer accounts, toggle active/suspended statuses, or perform soft deletions preserving historical booking records.

---

### 3.5 ✉️ Transactional Email & Digital QR Passes

Powered by Nodemailer ([`apps/api/src/services/email.service.ts`](file:///d:/Files/Project/Event/apps/api/src/services/email.service.ts)) with an in-memory dev preview store for local testing:

- **Email Verification:** Dispatches secure 6-digit OTP codes and activation links upon registration.
- **Password Reset:** Secure single-use password recovery tokens with 1-hour expiration.
- **Digital Ticket Delivery:** Dispatched immediately upon successful booking confirmation. Features formatted event details, seat allocations, and embedded high-resolution QR code images.
- **Cancellation Notices:** Automatic attendee dispatch when an organizer cancels an event.
- **Resend Capability:** Dedicated authenticated endpoint (`POST /api/v1/bookings/:id/resend-email`) for immediate receipt redelivery.

---

### 3.6 🔔 Global Notification & Toast System

- **Top-Right Floating Toasts:** Fixed at `fixed top-5 right-5 z-[9999]` with dark glassmorphic obsidian styling (`bg-[#0B151E]/95`), vivid status borders, micro-animations, and auto-dismiss/manual close.
- **Persistent In-App Notification Center:** Inbox drawer in the header navigation displaying booking receipts, moderation updates, cancellation notices, and admin announcements with unread count badges.

---

## 4. Technology Stack Matrix

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router, React) | `14.2.x` | Modern server/client component rendering, SEO metadata, routing. |
| **Language** | TypeScript | `5.5.x` | End-to-end type safety across client, server, and shared schemas. |
| **Styling & Theme** | Tailwind CSS | `3.4.x` | Obsidian theme (`#0B0F19`, `#111827`), brand orange (`#FF6A00`), coral (`#FF3D8E`). |
| **Icons & Visuals** | Lucide React | `0.428.x` | Scalable vector icon library. |
| **Client State** | Zustand | `4.5.x` | Reactive client state management (Auth, Toast notifications). |
| **Server State & Caching**| TanStack React Query | `5.51.x` | Asynchronous data fetching, background refetching, mutation management. |
| **Forms & Validation** | React Hook Form + Zod | `7.52.x / 3.23.x` | High-performance form state with strict schema validation. |
| **Backend Runtime** | Node.js + Express.js | `20.x / 4.19.x` | Modular, event-driven RESTful API backend. |
| **Database & ORM** | Neon PostgreSQL + Prisma | `5.18.x` | Relational serverless database with connection pooling and schema migrations. |
| **Security & Auth** | JWT + bcryptjs + Helmet | `9.0.x / 2.4.x` | HTTP-only cookie tokens, password hashing, and HTTP security headers. |
| **AI Integration** | Google Gemini REST API | `v1beta` | Generative copywriting, NLP query interpretation, and chat reasoning. |
| **Email Transport** | Nodemailer | `10.2.x` | Standardized SMTP mail delivery with local development fallback store. |
| **QR Code Engine** | node-qrcode | `1.5.x` | High-density DataURL and canvas QR generation for entry passes. |
| **Data Visualizations** | Recharts | `2.12.x` | SVG analytics charts for revenue, tickets sold, and check-in rates. |

---

## 5. System Architecture & Workflows

### Architectural Topology

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
        AIService[AI Service - Gemini API + NLP]
        BookingService[Booking & Concurrency Engine]
        EmailService[Nodemailer SMTP Pipeline]
        EventService[Event Lifecycle & Moderation Engine]
    end

    subgraph Persistence Layer
        Prisma[Prisma ORM]
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
    BookingService --> EmailService
    EventService --> EmailService
    BookingService --> Prisma
    EventService --> Prisma
    Prisma -.->|Connected| PostgreSQL
    Prisma -.->|Offline Fallback| DevStore
```

### Two-Phase Ticket Reservation & Concurrency Flow

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

## 6. Monorepo Directory Structure

```
eventra-ai-event-platform/
├── apps/
│   ├── web/                             # Next.js 14 App Router Frontend
│   │   ├── app/
│   │   │   ├── (auth)/                  # Auth portal routes
│   │   │   │   ├── login/               # Attendee & Organizer login
│   │   │   │   ├── register/            # Account registration
│   │   │   │   ├── verify-email/        # OTP / token confirmation
│   │   │   │   ├── forgot-password/     # Password recovery dispatch
│   │   │   │   └── reset-password/      # New password configuration
│   │   │   ├── about/                   # About page with concert atmosphere & contact
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
│   └── api/                             # Express.js TypeScript REST API
│       ├── prisma/
│       │   ├── schema.prisma            # PostgreSQL schema with relational models
│       │   └── seed.ts                  # Seed script with test events & default users
│       └── src/
│           ├── config/                  # Environment, database, and dev fallback store
│           ├── middleware/              # Auth guard, RBAC, error handler, rate limiters
│           ├── modules/                 # Feature modules (controllers, routes, services)
│           │   ├── admin/               # Admin bookings, moderation, broadcasts
│           │   ├── ai/                  # AI description, search parsing, recommendations, chat
│           │   ├── auth/                # JWT auth, email verification, password reset
│           │   ├── bookings/            # Reservations, payments, ticket generation
│           │   ├── categories/          # Category catalog endpoints
│           │   ├── coupons/             # Coupon validation endpoints
│           │   ├── events/              # Event discovery, filtering, lifecycle
│           │   ├── notifications/       # In-app notification delivery
│           │   ├── organizers/          # Organizer applications and check-in
│           │   └── tickets/             # QR check-in and pass verification
│           ├── services/
│           │   └── email.service.ts     # Nodemailer SMTP & dev preview mailer
│           ├── app.ts                   # Express server mounting & CORS
│           └── server.ts                # Bootstrap & reservation cleanup worker
│
├── packages/
│   └── shared/                          # Monorepo shared library
│       └── src/                         # TypeScript interfaces, DTOs, Zod schemas
│
├── docs/                                # Technical architecture & flow specifications
├── .env.example                         # Environment configuration template
├── package.json                         # Workspaces root definition
└── README.md                            # Comprehensive project documentation
```

---

## 7. Concurrency & Overselling Prevention Architecture

EVENTRA uses a dual-protection concurrency model implemented identically in both the PostgreSQL database layer ([`bookings.service.ts`](file:///d:/Files/Project/Event/apps/api/src/modules/bookings/bookings.service.ts)) and the fallback store ([`dev-fallback-store.ts`](file:///d:/Files/Project/Event/apps/api/src/config/dev-fallback-store.ts)):

1. **Pre-Booking Verification:**
   Before allocating a hold, the system calculates effective real-time availability:
   $$\text{Available Seats} = \text{Total Capacity} - \text{Sold Quantity} - \text{Active Unexpired Held Seats}$$
2. **Atomic Hold Allocation:**
   When an attendee selects seats, an `InventoryReservation` record is created inside an interactive transaction with status `ACTIVE` and an expiration timestamp `expiresAt = now() + 10m`.
3. **Automatic Expiration Cleanup:**
   An automated background worker runs periodically to transition abandoned reservations to `EXPIRED`, immediately releasing capacity back to the public pool.
4. **Isolated Payment Confirmation:**
   Final booking confirmation updates ticket inventory atomically:
   ```typescript
   await tx.ticketType.update({
     where: { id: item.ticketTypeId },
     data: { soldQuantity: { increment: item.quantity } },
   });
   ```
   If payment simulation fails or connection drops, the entire transaction rolls back cleanly with zero inventory leakage.

---

## 8. Installation & Local Setup Guide

### Prerequisites
- **Node.js**: `v18.18.0` or higher (`v20.x` LTS recommended)
- **NPM**: `v9.0.0` or higher
- **PostgreSQL Database** *(Optional in development)*: A local PostgreSQL instance or a free [Neon](https://neon.tech) database. If no database is connected, EVENTRA automatically activates its built-in in-memory fallback store.

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/eventra-ai-event-platform.git
cd eventra-ai-event-platform
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

# Seed database with sample categories, events, and accounts
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

## 9. Environment Variables Configuration

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

## 10. Administrator Account & Service Configuration

### Creating or Accessing the Administrator Account
EVENTRA provisions an initial administrator account automatically when seeding the database or initializing the development store:

1. **Default Administrator Email:** `admin@eventra.com`
2. **Default Administrator Password:** Configured via `ADMIN_PASSWORD` in your `.env` (default in seed: `AdminPassword123!`).
3. **Dedicated Admin Login:** Navigate directly to [`http://localhost:3000/admin/login`](http://localhost:3000/admin/login). Non-admin roles attempting to log in here are rejected with an access denial alert.

### Configuring Google Gemini AI Service
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Add the key to your backend `.env`:
   ```bash
   GEMINI_API_KEY="your_actual_gemini_api_key"
   ```
3. Restart the API server. If `GEMINI_API_KEY` is not provided, the platform automatically activates its built-in deterministic NLP pattern-matching engine for description generation, search parsing, and recommendations.

### Configuring SMTP Email Delivery
1. Provide standard SMTP credentials (such as Gmail App Password, SendGrid, or Mailgun):
   ```bash
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your_email@gmail.com"
   SMTP_PASS="your_16_digit_app_password"
   SMTP_FROM="EVENTRA Support <support@eventra.com>"
   ```
2. When SMTP credentials are omitted in development, all outgoing emails (verification codes, password reset links, ticket confirmation with QR passes) are safely logged to the console and preserved in the in-memory `emailService.devSentEmails` preview store.

---

## 11. Role-Based Access Control & Default Accounts

EVENTRA enforces strict separation of privileges across three user roles:

| Role | Dedicated Login Portal | Sample Credentials | Access Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `/admin/login` | `admin@eventra.com`<br>`AdminPassword123!` | Moderate events, review organizer applications, audit users, manage platform bookings and tickets, dispatch announcements. |
| **Event Organizer** | `/login` | `organizer@eventra.com`<br>`OrganizerPassword123!` | Create and edit events, configure ticket tiers, cancel events with attendee notices, live camera QR check-in scanner, sales analytics. |
| **Attendee** | `/login` | `attendee@eventra.com`<br>`AttendeePassword123!` | Search and filter events, reserve tickets with temporary hold, simulate Card/UPI checkout, view and print digital QR passes. |

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
1. Import repository into [Vercel](https://vercel.com).
2. Select Framework Preset: **Next.js**.
3. Set **Root Directory** to `apps/web`.
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-api-domain.com/api/v1`
   - `NEXT_PUBLIC_APP_URL`: `https://your-web-domain.com`
5. Click **Deploy**.

---

## 14. Future Roadmap

- [ ] **Seat Map Selection:** Interactive SVG venue seat maps for reserved auditorium seating.
- [ ] **Native Mobile Application:** React Native / Expo companion app for specialized offline entry scanning.
- [ ] **Webhooks & Integrations:** Outgoing webhook notifications for enterprise CRM and Zapier integration.
- [ ] **Multi-Currency Settlement:** Dynamic currency conversion for international ticket sales.

---

## 15. Contributing Guidelines & License

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

### License
This project is open-source and distributed under the **MIT License**. See `LICENSE` for details.
