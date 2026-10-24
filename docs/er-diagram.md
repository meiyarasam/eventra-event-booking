# EVENTRA Entity-Relationship (ER) Model

The EVENTRA database is designed in Third Normal Form (3NF) on PostgreSQL with strict referential integrity, foreign key cascading where appropriate, and composite indexes on query paths.

```mermaid
erDiagram
    USER ||--o| USER_PROFILE : "has"
    USER ||--o{ ORGANIZER_REQUEST : "submits"
    USER ||--o{ EVENT : "organizes"
    USER ||--o{ INVENTORY_RESERVATION : "reserves"
    USER ||--o{ BOOKING : "places"
    USER ||--o{ SAVED_EVENT : "saves"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "triggers"
    USER ||--o{ TICKET : "checks_in"

    CATEGORY ||--o{ EVENT : "contains"
    
    EVENT ||--o{ TICKET_TYPE : "offers"
    EVENT ||--o{ INVENTORY_RESERVATION : "holds_for"
    EVENT ||--o{ BOOKING : "receives"
    EVENT ||--o{ SAVED_EVENT : "bookmarked_in"
    EVENT ||--o{ EVENT_APPROVAL : "reviewed_by"

    TICKET_TYPE ||--o{ RESERVATION_ITEM : "reserved_in"
    TICKET_TYPE ||--o{ BOOKING_ITEM : "billed_in"
    TICKET_TYPE ||--o{ TICKET : "generates"

    INVENTORY_RESERVATION ||--o{ RESERVATION_ITEM : "contains"
    INVENTORY_RESERVATION ||--o| BOOKING : "fulfills"

    BOOKING ||--o{ BOOKING_ITEM : "includes"
    BOOKING ||--o{ TICKET : "issues"
    BOOKING ||--o{ PAYMENT_SIMULATION : "settled_via"

    USER {
        uuid id PK
        string email UK
        string passwordHash
        string name
        enum role "ATTENDEE, ORGANIZER, ADMIN"
        enum status "ACTIVE, SUSPENDED"
        datetime createdAt
        datetime updatedAt
    }

    USER_PROFILE {
        uuid id PK
        uuid userId FK
        string phone
        string bio
        string avatarUrl
        string organizationName
        string websiteUrl
        datetime createdAt
        datetime updatedAt
    }

    ORGANIZER_REQUEST {
        uuid id PK
        uuid userId FK
        string organizationName
        string reason
        string websiteUrl
        enum status "PENDING, APPROVED, REJECTED"
        string rejectionReason
        uuid reviewedById FK
        datetime reviewedAt
        datetime createdAt
    }

    CATEGORY {
        uuid id PK
        string name UK
        string slug UK
        string description
        string icon
        datetime createdAt
    }

    EVENT {
        uuid id PK
        uuid organizerId FK
        uuid categoryId FK
        string title
        string slug UK
        string description
        string bannerUrl
        datetime startDate
        datetime endDate
        string timeZone
        boolean isOnline
        string venueName
        string venueAddress
        string city
        int capacity
        string cancellationPolicy
        enum status "DRAFT, PENDING_APPROVAL, APPROVED, PUBLISHED, REJECTED, CANCELLED, COMPLETED"
        string rejectionReason
        datetime createdAt
        datetime updatedAt
    }

    TICKET_TYPE {
        uuid id PK
        uuid eventId FK
        string name
        string description
        decimal price
        int totalQuantity
        int soldQuantity
        int maxPerUser
        datetime saleStartDate
        datetime saleEndDate
    }

    INVENTORY_RESERVATION {
        uuid id PK
        uuid eventId FK
        uuid userId FK
        datetime expiresAt
        enum status "ACTIVE, CONFIRMED, EXPIRED, CANCELLED"
        datetime createdAt
    }

    RESERVATION_ITEM {
        uuid id PK
        uuid reservationId FK
        uuid ticketTypeId FK
        int quantity
        decimal price
    }

    BOOKING {
        uuid id PK
        string bookingReference UK
        uuid userId FK
        uuid eventId FK
        uuid reservationId FK
        decimal totalAmount
        enum status "PENDING, CONFIRMED, CANCELLED, EXPIRED"
        datetime cancelledAt
        string cancellationReason
        datetime createdAt
    }

    BOOKING_ITEM {
        uuid id PK
        uuid bookingId FK
        uuid ticketTypeId FK
        int quantity
        decimal unitPrice
        decimal subtotal
    }

    TICKET {
        uuid id PK
        string ticketNumber UK
        string ticketToken UK
        uuid bookingId FK
        uuid ticketTypeId FK
        string attendeeName
        string attendeeEmail
        enum status "VALID, CHECKED_IN, CANCELLED, EXPIRED"
        datetime checkedInAt
        uuid checkedInById FK
        datetime createdAt
    }

    PAYMENT_SIMULATION {
        uuid id PK
        uuid bookingId FK
        uuid userId FK
        decimal amount
        string currency
        enum paymentMethod "CARD, UPI"
        enum status "PENDING, SUCCESS, FAILED"
        string transactionReference UK
        string failureReason
        string cardLast4
        string cardHolder
        string upiId
        datetime createdAt
    }

    SAVED_EVENT {
        uuid id PK
        uuid userId FK
        uuid eventId FK
        datetime createdAt
    }

    NOTIFICATION {
        uuid id PK
        uuid userId FK
        string title
        string message
        string type
        boolean isRead
        string link
        datetime createdAt
    }

    EVENT_APPROVAL {
        uuid id PK
        uuid eventId FK
        uuid adminId FK
        enum status
        string reason
        datetime createdAt
    }

    AUDIT_LOG {
        uuid id PK
        uuid userId FK
        string action
        string entityType
        string entityId
        string details
        string ipAddress
        string userAgent
        datetime createdAt
    }
```
