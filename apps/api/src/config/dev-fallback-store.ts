import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import QRCode from 'qrcode';
import {
  UserRole,
  AccountStatus,
  EventStatus,
  ReservationStatus,
  BookingStatus,
  TicketStatus,
  PaymentStatus,
} from '@eventra/shared';
import { AppError } from '../utils/app-error';
import { emailService } from '../services/email.service';

export interface FallbackCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export interface FallbackTicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  totalQuantity: number;
  maxPerUser: number;
  saleStart?: Date;
  saleEnd?: Date;
  soldQuantity: number;
}

export interface FallbackEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  categoryId: string;
  category?: FallbackCategory;
  organizerId: string;
  organizer?: any;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  isOnline: boolean;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  capacity: number;
  status: EventStatus;
  cancellationPolicy: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  ticketTypes: FallbackTicketType[];
  _count?: { bookings: number };
}

export interface FallbackReservationItem {
  id: string;
  reservationId: string;
  ticketTypeId: string;
  quantity: number;
  price: number;
  ticketType?: FallbackTicketType;
}

export interface FallbackReservation {
  id: string;
  userId: string;
  eventId: string;
  expiresAt: Date;
  status: ReservationStatus;
  items: FallbackReservationItem[];
  event?: FallbackEvent;
}

export interface FallbackTicket {
  id: string;
  ticketReference: string;
  bookingId: string;
  ticketTypeId: string;
  attendeeId: string;
  seatNumber?: string;
  qrCode: string;
  qrCodeDataUrl?: string;
  status: TicketStatus;
  checkedInAt?: Date;
  createdAt: Date;
  ticketType?: FallbackTicketType;
  booking?: any;
  attendee?: any;
}

export interface FallbackBookingItem {
  id: string;
  bookingId: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  ticketType?: FallbackTicketType;
}

export interface FallbackBooking {
  id: string;
  bookingReference: string;
  userId: string;
  eventId: string;
  totalAmount: number;
  status: BookingStatus;
  createdAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  items: FallbackBookingItem[];
  tickets: FallbackTicket[];
  event?: FallbackEvent;
  user?: any;
  payment?: any;
}

class DevFallbackStore {
  public users: any[] = [];
  public categories: FallbackCategory[] = [];
  public events: FallbackEvent[] = [];
  public reservations: FallbackReservation[] = [];
  public bookings: FallbackBooking[] = [];
  public tickets: FallbackTicket[] = [];
  public notifications: any[] = [];
  public organizerRequests: any[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Categories
    this.categories = [
      { id: 'cat-1', name: 'Technology', slug: 'technology', description: 'Conferences, hackathons, cloud summits, and AI workshops.', icon: 'Cpu' },
      { id: 'cat-2', name: 'Music & Concerts', slug: 'music', description: 'Live acoustic sets, electronic festivals, and symphony galas.', icon: 'Music' },
      { id: 'cat-3', name: 'Business & Finance', slug: 'business', description: 'Executive leadership forums, startup pitches, and venture networks.', icon: 'Briefcase' },
      { id: 'cat-4', name: 'Education & Workshops', slug: 'education', description: 'Interactive masterclasses, scientific seminars, and coding bootcamps.', icon: 'GraduationCap' },
      { id: 'cat-5', name: 'Arts & Culture', slug: 'arts-culture', description: 'Modern art exhibits, theater performances, and literary salons.', icon: 'Palette' },
    ];

    // 2. Users
    const adminHash = await bcrypt.hash('AdminPassword123!', 10);
    const organizerHash = await bcrypt.hash('OrganizerPassword123!', 10);
    const attendeeHash = await bcrypt.hash('AttendeePassword123!', 10);

    const adminUser = {
      id: 'usr-admin-1',
      email: 'admin@eventra.com',
      name: 'Admin Eventra',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      createdAt: new Date(),
      profile: {
        bio: 'Lead Platform Administrator for EVENTRA.',
        phone: '+91 98201 92831',
        organizationName: 'EVENTRA Core Operations',
      },
    };

    const organizerUser = {
      id: 'usr-org-1',
      email: 'organizer@eventra.com',
      name: 'Sarah Jenkins',
      passwordHash: organizerHash,
      role: UserRole.ORGANIZER,
      status: AccountStatus.ACTIVE,
      createdAt: new Date(),
      profile: {
        bio: 'Curator of premiere technology summits and creative conferences across North America.',
        phone: '+1 (555) 014-9982',
        organizationName: 'Horizon Event Group',
        websiteUrl: 'https://horizon-events.example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      },
    };

    const attendeeUser = {
      id: 'usr-att-1',
      email: 'attendee@eventra.com',
      name: 'Alex Chen',
      passwordHash: attendeeHash,
      role: UserRole.ATTENDEE,
      status: AccountStatus.ACTIVE,
      createdAt: new Date(),
      profile: {
        bio: 'Software engineer, live music enthusiast, and avid summit attendee.',
        phone: '+1 (555) 012-3344',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      },
    };

    this.users.push(adminUser, organizerUser, attendeeUser);

    // 3. Events
    const rawEvents = [
      {
        id: 'evt-1',
        title: 'Global Software Architecture Summit 2026',
        slug: 'global-software-architecture-summit-2026',
        description: 'Join over 1,200 senior software architects, distributed systems designers, and tech leaders for two intensive days of deep-dive keynotes, peer engineering reviews, and hands-on system design workshops covering microservices, event-driven scalability, and production resilience.',
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-1',
        startDate: new Date('2026-11-18T09:00:00Z'),
        endDate: new Date('2026-11-19T18:00:00Z'),
        timeZone: 'America/New_York',
        isOnline: false,
        venueName: 'Jacob K. Javits Convention Center',
        venueAddress: '429 11th Ave',
        city: 'New York',
        capacity: 800,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Full refund available up to 48 hours prior to event commencement.',
        ticketTypes: [
          { id: 'tt-1', name: 'Early Bird Pass', price: 199.0, totalQuantity: 200, maxPerUser: 4, soldQuantity: 35 },
          { id: 'tt-2', name: 'Standard Full Conference', price: 299.0, totalQuantity: 450, maxPerUser: 6, soldQuantity: 80 },
          { id: 'tt-3', name: 'VIP Executive Pass & Dinners', price: 599.0, totalQuantity: 150, maxPerUser: 2, soldQuantity: 20 },
        ],
      },
      {
        id: 'evt-2',
        title: 'NextGen AI & Cloud Infrastructure Expo',
        slug: 'nextgen-ai-cloud-infrastructure-expo',
        description: 'Explore the frontier of foundation models, enterprise LLM deployment, high-throughput GPU clusters, and modern cloud infrastructure. Featuring keynotes from chief AI scientists and cloud architects.',
        bannerUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-1',
        startDate: new Date('2026-12-02T10:00:00Z'),
        endDate: new Date('2026-12-03T17:30:00Z'),
        timeZone: 'America/Los_Angeles',
        isOnline: false,
        venueName: 'Moscone West Center',
        venueAddress: '800 Howard St',
        city: 'San Francisco',
        capacity: 1200,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Cancellations eligible until 72 hours before start.',
        ticketTypes: [
          { id: 'tt-4', name: 'Expo Hall Access', price: 49.0, totalQuantity: 600, maxPerUser: 8, soldQuantity: 50 },
          { id: 'tt-5', name: 'All-Access Pass', price: 249.0, totalQuantity: 450, maxPerUser: 4, soldQuantity: 110 },
          { id: 'tt-6', name: 'Founder & Investor Access', price: 499.0, totalQuantity: 150, maxPerUser: 2, soldQuantity: 25 },
        ],
      },
      {
        id: 'evt-3',
        title: 'Neon Nights: Electronic Symphony Experience',
        slug: 'neon-nights-electronic-symphony',
        description: 'An electrifying fusion of a 60-piece live philharmonic orchestra with world-renowned synthesizer artists and modular sound designers, accompanied by immersive laser projection mapping.',
        bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-2',
        startDate: new Date('2026-11-28T20:00:00Z'),
        endDate: new Date('2026-11-28T23:30:00Z'),
        timeZone: 'America/Chicago',
        isOnline: false,
        venueName: 'The Aragon Ballroom',
        venueAddress: '1106 W Lawrence Ave',
        city: 'Chicago',
        capacity: 1500,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Tickets are non-refundable after purchase.',
        ticketTypes: [
          { id: 'tt-7', name: 'General Admission Floor', price: 65.0, totalQuantity: 1000, maxPerUser: 6, soldQuantity: 220 },
          { id: 'tt-8', name: 'Balcony Reserved Seating', price: 95.0, totalQuantity: 350, maxPerUser: 4, soldQuantity: 95 },
          { id: 'tt-9', name: 'VIP Orchestra Box & Merch', price: 180.0, totalQuantity: 150, maxPerUser: 4, soldQuantity: 40 },
        ],
      },
      {
        id: 'evt-4',
        title: 'Acoustic Sunset Series: Indie Artists Live',
        slug: 'acoustic-sunset-series-indie-live',
        description: 'An intimate open-air twilight concert showcasing rising singer-songwriters, folk trios, and acoustic ensembles beneath the coastal redwoods.',
        bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-2',
        startDate: new Date('2026-12-10T17:30:00Z'),
        endDate: new Date('2026-12-10T21:00:00Z'),
        timeZone: 'America/Los_Angeles',
        isOnline: false,
        venueName: 'Greek Theatre Amphitheater',
        venueAddress: '2001 Gayley Rd',
        city: 'Berkeley',
        capacity: 500,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Refunds permitted up to 48 hours before doors open.',
        ticketTypes: [
          { id: 'tt-10', name: 'Lawn Seating', price: 35.0, totalQuantity: 350, maxPerUser: 6, soldQuantity: 60 },
          { id: 'tt-11', name: 'Reserved Pavilion Bench', price: 75.0, totalQuantity: 150, maxPerUser: 4, soldQuantity: 30 },
        ],
      },
      {
        id: 'evt-5',
        title: 'Venture Forward: Angel & Seed Capital Forum',
        slug: 'venture-forward-angel-seed-capital-forum',
        description: 'The definitive quarterly summit bringing together early-stage venture capitalists, active angel syndicates, and seed-stage founders seeking actionable term sheet insights and direct pitch sessions.',
        bannerUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-3',
        startDate: new Date('2026-11-22T08:30:00Z'),
        endDate: new Date('2026-11-22T17:00:00Z'),
        timeZone: 'America/New_York',
        isOnline: false,
        venueName: 'Financial District Harvard Club',
        venueAddress: '27 W 44th St',
        city: 'New York',
        capacity: 350,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Strict cancellation policy: 50% refund before 7 days out.',
        ticketTypes: [
          { id: 'tt-12', name: 'Founder Registration', price: 150.0, totalQuantity: 200, maxPerUser: 2, soldQuantity: 45 },
          { id: 'tt-13', name: 'Accredited Investor Seat', price: 350.0, totalQuantity: 150, maxPerUser: 2, soldQuantity: 35 },
        ],
      },
      {
        id: 'evt-6',
        title: 'SaaS Metrics & Product-Led Growth Intensive',
        slug: 'saas-metrics-product-led-growth-intensive',
        description: 'Master retention benchmarks, cohort net expansion, automated onboarding funnels, and enterprise sales efficiency with operators from hyper-growth B2B software companies.',
        bannerUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-3',
        startDate: new Date('2026-12-05T13:00:00Z'),
        endDate: new Date('2026-12-05T18:00:00Z'),
        timeZone: 'UTC',
        isOnline: true,
        venueName: 'Virtual Interactive Stage',
        city: 'Online',
        capacity: 1000,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Free cancellation anytime prior to live broadcast start.',
        ticketTypes: [
          { id: 'tt-14', name: 'Free Virtual Pass', price: 0.0, totalQuantity: 700, maxPerUser: 2, soldQuantity: 120 },
          { id: 'tt-15', name: 'Workshop Pass + Recordings', price: 89.0, totalQuantity: 300, maxPerUser: 5, soldQuantity: 80 },
        ],
      },
      {
        id: 'evt-7',
        title: 'Full-Stack TypeScript & Cloud Mastery Workshop',
        slug: 'fullstack-typescript-cloud-mastery-workshop',
        description: 'A comprehensive 8-hour hands-on code laboratory. Build production distributed architectures with Next.js, Prisma, PostgreSQL, Docker, and CI/CD pipelines.',
        bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-4',
        startDate: new Date('2026-11-25T09:00:00Z'),
        endDate: new Date('2026-11-25T17:00:00Z'),
        timeZone: 'America/Los_Angeles',
        isOnline: false,
        venueName: 'DevHub Collaborative Space',
        venueAddress: '488 4th St',
        city: 'San Francisco',
        capacity: 120,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Cancellations permitted up to 48h before workshop.',
        ticketTypes: [
          { id: 'tt-16', name: 'General Student Pass', price: 120.0, totalQuantity: 80, maxPerUser: 2, soldQuantity: 25 },
          { id: 'tt-17', name: 'Professional Ticket with 1:1 Review', price: 250.0, totalQuantity: 40, maxPerUser: 2, soldQuantity: 15 },
        ],
      },
      {
        id: 'evt-8',
        title: 'Data Engineering & Modern ETL Architectures',
        slug: 'data-engineering-modern-etl-architectures',
        description: 'A masterclass on real-time streaming, lakehouse storage layers, data quality contracts, and orchestrating robust DAGs for high-scale analytics.',
        bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-4',
        startDate: new Date('2026-12-14T10:00:00Z'),
        endDate: new Date('2026-12-14T16:00:00Z'),
        timeZone: 'America/Denver',
        isOnline: false,
        venueName: 'Colorado Innovation Commons',
        venueAddress: '1600 Wynkoop St',
        city: 'Denver',
        capacity: 150,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Full refund up to 72 hours before start.',
        ticketTypes: [
          { id: 'tt-18', name: 'Standard Seat', price: 140.0, totalQuantity: 110, maxPerUser: 3, soldQuantity: 40 },
          { id: 'tt-19', name: 'VIP Front Row + Book', price: 210.0, totalQuantity: 40, maxPerUser: 2, soldQuantity: 12 },
        ],
      },
      {
        id: 'evt-9',
        title: 'Metropolis Contemporary Art Biennial 2026',
        slug: 'metropolis-contemporary-art-biennial-2026',
        description: 'Witness boundary-pushing kinetic sculptures, generative algorithmic visuals, and large-scale physical installations from 45 international contemporary artists.',
        bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-5',
        startDate: new Date('2026-11-30T10:00:00Z'),
        endDate: new Date('2026-12-06T20:00:00Z'),
        timeZone: 'America/Los_Angeles',
        isOnline: false,
        venueName: 'The Broad Contemporary Hall',
        venueAddress: '221 S Grand Ave',
        city: 'Los Angeles',
        capacity: 3000,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Refunds permitted up to 24 hours prior to chosen entry slot.',
        ticketTypes: [
          { id: 'tt-20', name: 'Weekday General Admission', price: 28.0, totalQuantity: 1800, maxPerUser: 6, soldQuantity: 300 },
          { id: 'tt-21', name: 'Weekend Priority Entry', price: 42.0, totalQuantity: 900, maxPerUser: 6, soldQuantity: 180 },
          { id: 'tt-22', name: 'Curator-Led Private Tour', price: 95.0, totalQuantity: 300, maxPerUser: 4, soldQuantity: 70 },
        ],
      },
      {
        id: 'evt-10',
        title: 'Modern Architecture & Urbanism Symposium',
        slug: 'modern-architecture-urbanism-symposium',
        description: 'A critical gathering exploring biophilic city design, mass timber high-rises, and climate-adaptive civic infrastructure with leading structural architects.',
        bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-5',
        startDate: new Date('2026-12-18T14:00:00Z'),
        endDate: new Date('2026-12-19T18:00:00Z'),
        timeZone: 'America/Chicago',
        isOnline: false,
        venueName: 'Chicago Architecture Center',
        venueAddress: '111 E Wacker Dr',
        city: 'Chicago',
        capacity: 400,
        status: EventStatus.PUBLISHED,
        cancellationPolicy: 'Standard 48-hour cancellation policy.',
        ticketTypes: [
          { id: 'tt-23', name: 'Symposium Pass', price: 85.0, totalQuantity: 320, maxPerUser: 4, soldQuantity: 80 },
          { id: 'tt-24', name: 'Fellowship Student Pass', price: 30.0, totalQuantity: 80, maxPerUser: 2, soldQuantity: 20 },
        ],
      },
      {
        id: 'evt-11',
        title: 'DevOps & Kubernetes World Congress [Pending Review]',
        slug: 'devops-kubernetes-world-congress',
        description: 'A comprehensive gathering on multi-cluster orchestration, GitOps automation, eBPF telemetry, and zero-trust cloud network security.',
        bannerUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-1',
        startDate: new Date('2026-12-28T09:00:00Z'),
        endDate: new Date('2026-12-29T17:00:00Z'),
        timeZone: 'America/New_York',
        isOnline: false,
        venueName: 'Boston Convention & Exhibition Center',
        venueAddress: '415 Summer St',
        city: 'Boston',
        capacity: 600,
        status: EventStatus.PENDING_APPROVAL,
        cancellationPolicy: 'Refunds permitted up to 48 hours before start.',
        ticketTypes: [
          { id: 'tt-25', name: 'Standard Delegate', price: 199.0, totalQuantity: 400, maxPerUser: 4, soldQuantity: 0 },
          { id: 'tt-26', name: 'VIP Track', price: 399.0, totalQuantity: 200, maxPerUser: 2, soldQuantity: 0 },
        ],
      },
      {
        id: 'evt-12',
        title: 'Global Fintech & Decentralized Ledger Forum [Draft]',
        slug: 'global-fintech-decentralized-ledger-forum',
        description: 'Examining the future of cross-border settlements, regulatory compliance in decentralized finance, and automated clearing houses.',
        bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1600&q=80',
        categoryId: 'cat-3',
        startDate: new Date('2027-01-15T09:00:00Z'),
        endDate: new Date('2027-01-16T18:00:00Z'),
        timeZone: 'Europe/London',
        isOnline: false,
        venueName: 'ExCeL London Exhibition Centre',
        city: 'London',
        capacity: 500,
        status: EventStatus.DRAFT,
        cancellationPolicy: 'Full refund up to 72 hours prior to event.',
        ticketTypes: [
          { id: 'tt-27', name: 'Standard Pass', price: 150.0, totalQuantity: 350, maxPerUser: 4, soldQuantity: 0 },
          { id: 'tt-28', name: 'VIP Investor', price: 350.0, totalQuantity: 150, maxPerUser: 2, soldQuantity: 0 },
        ],
      },
    ];

    for (const raw of rawEvents) {
      const cat = this.categories.find((c) => c.id === raw.categoryId);
      const evt: FallbackEvent = {
        ...raw,
        organizerId: 'usr-org-1',
        organizer: organizerUser,
        category: cat,
        createdAt: new Date(),
        updatedAt: new Date(),
        ticketTypes: raw.ticketTypes.map((tt) => ({ ...tt, eventId: raw.id, maxPerUser: 10 })),
        _count: { bookings: 5 },
      };
      this.events.push(evt);
    }

    // 4. Sample Confirmed Booking with QR Ticket for Attendee
    const sampleEvent = this.events[0];
    const sampleTicketType = sampleEvent.ticketTypes[2]; // VIP
    const sampleBookingId = 'bkg-demo-1';
    const sampleTicketRef = 'TKT-DEMO-VIP-101';
    const sampleQrToken = crypto.randomBytes(24).toString('hex');
    const qrDataUrl = await QRCode.toDataURL(sampleQrToken, { margin: 1, width: 300 });

    const sampleTicket: FallbackTicket = {
      id: 'tkt-demo-1',
      ticketReference: sampleTicketRef,
      bookingId: sampleBookingId,
      ticketTypeId: sampleTicketType.id,
      attendeeId: attendeeUser.id,
      seatNumber: 'VIP-A01',
      qrCode: sampleQrToken,
      qrCodeDataUrl: qrDataUrl,
      status: TicketStatus.VALID,
      createdAt: new Date(),
      ticketType: sampleTicketType,
      attendee: attendeeUser,
    };

    const sampleBooking: FallbackBooking = {
      id: sampleBookingId,
      bookingReference: 'BKG-DEMO2026',
      userId: attendeeUser.id,
      eventId: sampleEvent.id,
      totalAmount: sampleTicketType.price,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
      items: [
        {
          id: 'bi-demo-1',
          bookingId: sampleBookingId,
          ticketTypeId: sampleTicketType.id,
          quantity: 1,
          unitPrice: sampleTicketType.price,
          subtotal: sampleTicketType.price,
          ticketType: sampleTicketType,
        },
      ],
      tickets: [sampleTicket],
      event: sampleEvent,
      user: attendeeUser,
      payment: {
        id: 'pmt-demo-1',
        status: PaymentStatus.SUCCESS,
        amount: sampleTicketType.price,
        paymentMethod: 'CARD',
      },
    };

    sampleTicket.booking = sampleBooking;
    this.bookings.push(sampleBooking);
    this.tickets.push(sampleTicket);

    // 5. Initial Notifications
    this.notifications.push(
      {
        id: 'notif-1',
        userId: attendeeUser.id,
        title: 'Booking Confirmed!',
        message: 'Your VIP pass for Global Software Architecture Summit 2026 is confirmed.',
        type: 'BOOKING_CONFIRMED',
        read: false,
        createdAt: new Date(),
      },
      {
        id: 'notif-2',
        userId: organizerUser.id,
        title: 'Event Approved',
        message: 'Global Software Architecture Summit 2026 was approved and is now published.',
        type: 'EVENT_APPROVED',
        read: true,
        createdAt: new Date(),
      }
    );

    // 6. Initial Organizer Requests
    this.organizerRequests.push({
      id: 'org-req-1',
      userId: attendeeUser.id,
      organizationName: 'HyperScale Events Inc.',
      websiteUrl: 'https://hyperscale-events.example.com',
      bio: 'Premier technology conferences and developer summits organizer.',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: attendeeUser.id,
        name: attendeeUser.name,
        email: attendeeUser.email,
        role: attendeeUser.role,
        createdAt: attendeeUser.createdAt,
      },
    });
  }

  private generateReference(prefix: string): string {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${Date.now().toString().slice(-4)}${randomHex}`;
  }

  // 1. Create Reservation
  public async createReservation(
    userId: string,
    input: { eventId: string; items: { ticketTypeId: string; quantity: number }[] }
  ) {
    await this.init();
    const event = this.events.find((e) => e.id === input.eventId);
    if (!event) throw AppError.notFound('Event not found');
    if (event.status !== EventStatus.PUBLISHED) {
      throw AppError.badRequest('This event is not currently open for bookings.');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    // Clean up expired reservations
    this.reservations.forEach((r) => {
      if (r.status === ReservationStatus.ACTIVE && new Date(r.expiresAt) <= now) {
        r.status = ReservationStatus.EXPIRED;
      }
    });

    let totalAmount = 0;
    const reservationItemsData: {
      id: string;
      ticketTypeId: string;
      ticketTypeName: string;
      price: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    for (const item of input.items) {
      const ticketType = event.ticketTypes.find((tt) => tt.id === item.ticketTypeId);
      if (!ticketType) {
        throw AppError.badRequest(`Invalid ticket type: ${item.ticketTypeId}`);
      }

      // Calculate active held reservations to prevent concurrency overselling
      const activeHeld = this.reservations
        .filter((r) => r.status === ReservationStatus.ACTIVE && new Date(r.expiresAt) > now)
        .flatMap((r) => r.items)
        .filter((i) => i.ticketTypeId === ticketType.id)
        .reduce((sum, i) => sum + i.quantity, 0);

      const available = Math.max(0, ticketType.totalQuantity - ticketType.soldQuantity - activeHeld);
      if (item.quantity > available) {
        throw AppError.conflict(
          `Insufficient ticket capacity for "${ticketType.name}". Only ${available} seat(s) remaining.`
        );
      }
      const price = Number(ticketType.price);
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      reservationItemsData.push({
        id: `rsv-item-${crypto.randomUUID().slice(0, 8)}`,
        ticketTypeId: ticketType.id,
        ticketTypeName: ticketType.name,
        price,
        quantity: item.quantity,
        subtotal,
      });
    }

    const reservationId = `rsv-${crypto.randomUUID().slice(0, 8)}`;
    const newReservation: FallbackReservation = {
      id: reservationId,
      userId,
      eventId: event.id,
      expiresAt,
      status: ReservationStatus.ACTIVE,
      items: reservationItemsData.map((item) => ({
        id: item.id,
        reservationId,
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        price: item.price,
      })),
      event,
    };

    this.reservations.push(newReservation);

    return {
      id: newReservation.id,
      eventId: event.id,
      userId,
      expiresAt: newReservation.expiresAt.toISOString(),
      status: newReservation.status,
      items: reservationItemsData,
      totalAmount,
    };
  }

  // 2. Get Reservation By ID
  public async getReservationById(reservationId: string, userId: string) {
    await this.init();
    const reservation = this.reservations.find((r) => r.id === reservationId);
    if (!reservation) throw AppError.notFound('Reservation not found');
    if (reservation.userId !== userId) throw AppError.forbidden('Unauthorized access to reservation');

    const now = new Date();
    const isExpired = reservation.status === ReservationStatus.ACTIVE && new Date(reservation.expiresAt) <= now;
    if (isExpired) {
      reservation.status = ReservationStatus.EXPIRED;
    }

    const event = this.events.find((e) => e.id === reservation.eventId);

    const items = reservation.items.map((i) => {
      const tt = event?.ticketTypes.find((t) => t.id === i.ticketTypeId);
      const price = tt ? Number(tt.price) : i.price;
      return {
        ticketTypeId: i.ticketTypeId,
        ticketTypeName: tt?.name || 'Standard Pass',
        price,
        quantity: i.quantity,
        subtotal: price * i.quantity,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: reservation.id,
      eventId: reservation.eventId,
      userId: reservation.userId,
      expiresAt: reservation.expiresAt.toISOString(),
      status: reservation.status,
      event,
      items,
      totalAmount,
      booking: (reservation as any).bookingId
        ? this.bookings.find((b) => b.id === (reservation as any).bookingId) || { id: (reservation as any).bookingId }
        : null,
    };
  }

  // 3. Process Payment and Confirm
  public async processPaymentAndConfirm(
    userId: string,
    input: {
      reservationId: string;
      paymentMethod: any;
      simulateSuccess?: boolean;
      paymentDetails?: any;
    }
  ) {
    await this.init();
    const reservation = this.reservations.find((r) => r.id === input.reservationId);
    if (!reservation) throw AppError.notFound('Reservation not found');
    if (reservation.userId !== userId) throw AppError.forbidden('Unauthorized payment attempt');
    if (reservation.status === ReservationStatus.CONFIRMED) {
      throw AppError.badRequest('This reservation has already been paid and confirmed.');
    }

    const now = new Date();
    if (reservation.status !== ReservationStatus.ACTIVE || new Date(reservation.expiresAt) <= now) {
      reservation.status = ReservationStatus.EXPIRED;
      throw AppError.gone('Your ticket reservation has expired. Please select tickets again.');
    }

    const event = this.events.find((e) => e.id === reservation.eventId);
    if (!event) throw AppError.notFound('Associated event not found');

    const totalAmount = reservation.items.reduce((acc, item) => {
      const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
      return acc + (tt ? Number(tt.price) : item.price) * item.quantity;
    }, 0);

    // If simulated payment is set to fail
    if (input.simulateSuccess === false) {
      throw AppError.badRequest('Payment simulation failed: The simulated transaction was declined.');
    }

    reservation.status = ReservationStatus.CONFIRMED;

    const bookingReference = this.generateReference('BKG');
    const bookingId = `bkg-${crypto.randomUUID().slice(0, 8)}`;
    (reservation as any).bookingId = bookingId;
    const transactionReference = this.generateReference('TXN');

    const user = this.users.find((u) => u.id === userId) || {
      id: userId,
      name: 'Event Attendee',
      email: 'attendee@eventra.com',
    };

    const issuedTickets: any[] = [];
    const bookingItems: FallbackBookingItem[] = [];

    for (const item of reservation.items) {
      const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
      if (tt) {
        tt.soldQuantity += item.quantity;
      }
      const unitPrice = tt ? Number(tt.price) : item.price;
      const subtotal = unitPrice * item.quantity;

      bookingItems.push({
        id: `bi-${crypto.randomUUID().slice(0, 8)}`,
        bookingId,
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
        ticketType: tt,
      });

      for (let i = 0; i < item.quantity; i++) {
        const ticketNumber = this.generateReference('TKT');
        const ticketToken = crypto.randomUUID();
        const qrPayload = JSON.stringify({ ticketToken, ticketNumber });
        const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300,
        });

        const ticket: FallbackTicket = {
          id: `tkt-${crypto.randomUUID().slice(0, 8)}`,
          ticketReference: ticketNumber,
          bookingId,
          ticketTypeId: item.ticketTypeId,
          attendeeId: userId,
          seatNumber: `SEAT-${(tt?.soldQuantity || 1) + i}`,
          qrCode: ticketToken,
          qrCodeDataUrl: qrCodeUrl,
          status: TicketStatus.VALID,
          createdAt: new Date(),
          ticketType: tt,
          attendee: user,
        };

        this.tickets.push(ticket);
        issuedTickets.push({
          id: ticket.id,
          ticketNumber,
          ticketToken,
          bookingId,
          ticketTypeId: item.ticketTypeId,
          ticketTypeName: tt?.name || 'Standard Pass',
          price: unitPrice,
          seatNumber: ticket.seatNumber,
          status: TicketStatus.VALID,
          attendeeName: user.name,
          attendeeEmail: user.email,
          eventName: event.title,
          eventBannerUrl: event.bannerUrl,
          eventStartDate: event.startDate.toISOString(),
          venueName: event.venueName,
          city: event.city,
          isOnline: event.isOnline,
          qrCodeUrl,
          createdAt: ticket.createdAt.toISOString(),
        });
      }
    }

    const newBooking: FallbackBooking = {
      id: bookingId,
      bookingReference,
      userId,
      eventId: event.id,
      totalAmount,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
      items: bookingItems,
      tickets: this.tickets.filter((t) => t.bookingId === bookingId),
      event,
      user,
      payment: {
        id: `pmt-${crypto.randomUUID().slice(0, 8)}`,
        amount: totalAmount,
        currency: 'INR',
        paymentMethod: input.paymentMethod,
        status: PaymentStatus.SUCCESS,
        transactionReference,
        createdAt: new Date(),
      },
    };

    this.bookings.push(newBooking);

    // In-app notification
    this.notifications.push({
      id: `notif-${Date.now()}`,
      userId,
      title: 'Booking Confirmed!',
      message: `Your booking for "${event.title}" is confirmed. Ref: ${bookingReference}`,
      type: 'BOOKING_CONFIRMED',
      link: `/bookings/${bookingId}`,
      read: false,
      createdAt: new Date(),
    });

    // Safely dispatch digital ticket confirmation email with QR codes
    const targetEmail = user.email || 'attendee@eventra.com';
    emailService.sendTicketConfirmationEmail(targetEmail, {
      bookingReference,
      eventTitle: event.title,
      eventDate: new Date(event.startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      eventTime: new Date(event.startDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      venueName: event.venueName,
      city: event.city,
      isOnline: event.isOnline,
      totalAmount,
      tickets: issuedTickets.map((t) => ({
        ticketNumber: t.ticketNumber,
        ticketToken: t.ticketToken,
        ticketTypeName: t.ticketTypeName,
        attendeeName: t.attendeeName,
        price: t.price,
        qrCodeDataUrl: t.qrCodeUrl,
      })),
    }).catch((err) => {
      console.warn('⚠️ Non-fatal: Failed to send ticket confirmation email in dev fallback store:', err.message);
    });

    return {
      booking: {
        id: newBooking.id,
        bookingReference: newBooking.bookingReference,
        userId: newBooking.userId,
        eventId: newBooking.eventId,
        totalAmount: Number(newBooking.totalAmount),
        status: newBooking.status,
        createdAt: newBooking.createdAt.toISOString(),
        event,
        tickets: issuedTickets,
      },
    };
  }

  // 4. Get My Bookings
  public async getMyBookings(userId: string) {
    await this.init();
    const userBookings = this.bookings.filter((b) => b.userId === userId);
    return userBookings.map((b) => {
      const event = this.events.find((e) => e.id === b.eventId) || b.event;
      const bTickets = this.tickets.filter((t) => t.bookingId === b.id);
      return {
        id: b.id,
        bookingReference: b.bookingReference,
        userId: b.userId,
        eventId: b.eventId,
        totalAmount: Number(b.totalAmount),
        status: b.status,
        cancelledAt: b.cancelledAt?.toISOString() || null,
        cancellationReason: b.cancellationReason || null,
        createdAt: b.createdAt.toISOString(),
        event,
        tickets: bTickets.map((t) => ({
          id: t.id,
          ticketNumber: t.ticketReference,
          ticketToken: t.qrCode,
          bookingId: t.bookingId,
          ticketTypeId: t.ticketTypeId,
          ticketTypeName: t.ticketType?.name || 'Pass',
          price: Number(t.ticketType?.price || 0),
          seatNumber: t.seatNumber,
          status: t.status,
          attendeeName: t.attendee?.name || 'Attendee',
          attendeeEmail: t.attendee?.email || '',
          eventName: event?.title || 'Event',
          eventBannerUrl: event?.bannerUrl || '',
          eventStartDate: event ? event.startDate.toISOString() : new Date().toISOString(),
          venueName: event?.venueName || 'Venue',
          city: event?.city || 'City',
          isOnline: event?.isOnline || false,
          qrCodeUrl: t.qrCodeDataUrl,
          checkedInAt: t.checkedInAt?.toISOString() || null,
          createdAt: t.createdAt.toISOString(),
        })),
        payment: b.payment
          ? {
              id: b.payment.id,
              paymentMethod: b.payment.paymentMethod,
              status: b.payment.status,
              transactionReference: b.payment.transactionReference || 'TXN-DEV',
              createdAt: (b.payment.createdAt || b.createdAt).toISOString(),
            }
          : null,
      };
    });
  }

  // 5. Get Booking by ID
  public async getBookingById(bookingId: string, userId: string) {
    await this.init();
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.userId !== userId) throw AppError.forbidden('Unauthorized access to booking');

    const event = this.events.find((e) => e.id === booking.eventId) || booking.event;
    const bTickets = this.tickets.filter((t) => t.bookingId === booking.id);

    return {
      id: booking.id,
      bookingReference: booking.bookingReference,
      userId: booking.userId,
      eventId: booking.eventId,
      totalAmount: Number(booking.totalAmount),
      status: booking.status,
      cancelledAt: booking.cancelledAt?.toISOString() || null,
      cancellationReason: booking.cancellationReason || null,
      createdAt: booking.createdAt.toISOString(),
      event,
      items: booking.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
        ticketType: i.ticketType,
      })),
      tickets: bTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketReference,
        ticketToken: t.qrCode,
        bookingId: t.bookingId,
        ticketTypeId: t.ticketTypeId,
        ticketTypeName: t.ticketType?.name || 'Pass',
        price: Number(t.ticketType?.price || 0),
        seatNumber: t.seatNumber,
        status: t.status,
        attendeeName: t.attendee?.name || 'Attendee',
        attendeeEmail: t.attendee?.email || '',
        eventName: event?.title || 'Event',
        eventBannerUrl: event?.bannerUrl || '',
        eventStartDate: event ? event.startDate.toISOString() : new Date().toISOString(),
        venueName: event?.venueName || 'Venue',
        city: event?.city || 'City',
        isOnline: event?.isOnline || false,
        qrCodeUrl: t.qrCodeDataUrl,
        checkedInAt: t.checkedInAt?.toISOString() || null,
        createdAt: t.createdAt.toISOString(),
      })),
      payment: booking.payment
        ? {
            id: booking.payment.id,
            paymentMethod: booking.payment.paymentMethod,
            status: booking.payment.status,
            transactionReference: booking.payment.transactionReference || 'TXN-DEV',
            createdAt: (booking.payment.createdAt || booking.createdAt).toISOString(),
          }
        : null,
    };
  }

  // 5b. Cancel Booking Fallback
  public async cancelBooking(bookingId: string, userId: string, reason?: string) {
    await this.init();
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.userId !== userId) throw AppError.forbidden('You are not authorized to cancel this booking');

    if (booking.status === BookingStatus.CANCELLED) {
      return { message: 'Booking has already been cancelled', booking };
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw AppError.badRequest(`Booking in status '${booking.status}' cannot be cancelled`);
    }

    const now = new Date();
    const event = this.events.find((e) => e.id === booking.eventId) || booking.event;

    // Check 48 hours cancellation policy
    if (event?.startDate) {
      const eventStart = new Date(event.startDate);
      const hoursDifference = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursDifference < 48) {
        throw AppError.badRequest(
          'Cancellation is not permitted within 48 hours of the event start time as per event policy.'
        );
      }
    }

    // Check if tickets checked in
    const bTickets = this.tickets.filter((t) => t.bookingId === booking.id);
    const anyCheckedIn = bTickets.some((t) => t.status === TicketStatus.CHECKED_IN);
    if (anyCheckedIn) {
      throw AppError.badRequest('Cannot cancel a booking where tickets have already been checked in.');
    }

    // 1. Mark booking CANCELLED
    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = now;
    booking.cancellationReason = reason || 'Cancelled by attendee.';

    // 2. Mark tickets CANCELLED
    bTickets.forEach((t) => {
      t.status = TicketStatus.CANCELLED;
    });

    // 3. Return capacity to ticket types
    if (booking.items && event) {
      for (const item of booking.items) {
        const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
        if (tt) {
          tt.soldQuantity = Math.max(0, (tt.soldQuantity || 0) - item.quantity);
        }
      }
    }

    // 4. Create in-app notification
    this.notifications.push({
      id: `notif-${Date.now()}`,
      userId,
      title: 'Booking Cancelled',
      message: `Your booking (${booking.bookingReference}) for "${event?.title || 'Event'}" has been cancelled.`,
      type: 'BOOKING_CANCELLED',
      link: `/bookings/${booking.id}`,
      read: false,
      isRead: false,
      createdAt: now,
    });

    return {
      message: 'Booking cancelled successfully. Inventory has been released.',
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        cancelledAt: now.toISOString(),
        cancellationReason: booking.cancellationReason,
      },
    };
  }

  // 6. Get My Tickets
  public async getMyTickets(userId: string) {
    await this.init();
    const userTickets = this.tickets.filter((t) => t.attendeeId === userId);
    return userTickets.map((t) => {
      const booking = this.bookings.find((b) => b.id === t.bookingId);
      const event = this.events.find((e) => e.id === booking?.eventId) || booking?.event;
      return {
        id: t.id,
        ticketNumber: t.ticketReference,
        ticketToken: t.qrCode,
        bookingId: t.bookingId,
        ticketTypeId: t.ticketTypeId,
        ticketTypeName: t.ticketType?.name || 'General Admission',
        price: Number(t.ticketType?.price || 0),
        seatNumber: t.seatNumber,
        status: t.status,
        attendeeName: t.attendee?.name || 'Alex Attendee',
        attendeeEmail: t.attendee?.email || 'attendee@eventra.com',
        eventName: event?.title || 'Event Pass',
        eventBannerUrl: event?.bannerUrl || '',
        eventStartDate: event ? event.startDate.toISOString() : new Date().toISOString(),
        venueName: event?.venueName || 'Convention Hall',
        city: event?.city || 'Virtual',
        isOnline: event?.isOnline || false,
        qrCodeUrl: t.qrCodeDataUrl,
        checkedInAt: t.checkedInAt?.toISOString() || null,
        createdAt: t.createdAt.toISOString(),
      };
    });
  }

  // 7. Get Ticket by ID
  public async getTicketById(ticketId: string, userId: string, userRole?: UserRole) {
    await this.init();
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw AppError.notFound('Ticket not found');

    const booking = this.bookings.find((b) => b.id === ticket.bookingId);
    const event = this.events.find((e) => e.id === booking?.eventId) || booking?.event;

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketReference,
      ticketToken: ticket.qrCode,
      bookingId: ticket.bookingId,
      ticketTypeId: ticket.ticketTypeId,
      ticketTypeName: ticket.ticketType?.name || 'General Admission',
      price: Number(ticket.ticketType?.price || 0),
      status: ticket.status,
      attendeeName: ticket.attendee?.name || 'Alex Attendee',
      attendeeEmail: ticket.attendee?.email || 'attendee@eventra.com',
      eventName: event?.title || 'Event Pass',
      eventBannerUrl: event?.bannerUrl || '',
      eventStartDate: event ? event.startDate.toISOString() : new Date().toISOString(),
      venueName: event?.venueName || 'Convention Hall',
      city: event?.city || 'Virtual',
      isOnline: event?.isOnline || false,
      qrCodeUrl: ticket.qrCodeDataUrl,
      checkedInAt: ticket.checkedInAt?.toISOString() || null,
      createdAt: ticket.createdAt.toISOString(),
    };
  }

  // 8. Validate and Check-In Ticket
  public async validateTicket(tokenOrNumber: string) {
    await this.init();
    const trimmed = tokenOrNumber.trim();
    let token = trimmed;
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.ticketToken) token = parsed.ticketToken;
      } catch {}
    }

    const ticket = this.tickets.find(
      (t) => t.qrCode === token || t.ticketReference === token || t.id === token
    );
    if (!ticket) throw AppError.notFound('Invalid ticket: No matching ticket found');

    const booking = this.bookings.find((b) => b.id === ticket.bookingId);
    const event = this.events.find((e) => e.id === booking?.eventId);

    return {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketReference,
        attendeeName: ticket.attendee?.name || 'Attendee',
        attendeeEmail: ticket.attendee?.email || '',
        ticketTypeName: ticket.ticketType?.name || 'General',
        status: ticket.status,
        checkedInAt: ticket.checkedInAt?.toISOString() || null,
        eventName: event?.title || 'EVENTRA Event',
      },
      isValid: ticket.status === TicketStatus.VALID,
    };
  }

  public async checkInTicket(tokenOrNumber: string) {
    await this.init();
    const trimmed = tokenOrNumber.trim();
    let token = trimmed;
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.ticketToken) token = parsed.ticketToken;
      } catch {}
    }

    const ticket = this.tickets.find(
      (t) => t.qrCode === token || t.ticketReference === token || t.id === token
    );
    if (!ticket) throw AppError.notFound('Invalid ticket token or reference.');
    if (ticket.status === TicketStatus.CHECKED_IN) {
      throw AppError.conflict('Ticket has already been checked in. Duplicate check-ins are rejected.');
    }
    if (ticket.status === TicketStatus.CANCELLED) {
      throw AppError.badRequest('This ticket has been CANCELLED and is not valid for entry.');
    }

    ticket.status = TicketStatus.CHECKED_IN;
    ticket.checkedInAt = new Date();

    const booking = this.bookings.find((b) => b.id === ticket.bookingId);
    const event = this.events.find((e) => e.id === booking?.eventId);

    return {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketReference,
        status: ticket.status,
        checkedInAt: ticket.checkedInAt.toISOString(),
        attendeeName: ticket.attendee?.name || 'Attendee',
        eventName: event?.title || 'EVENTRA Event',
      },
      message: 'Ticket checked in successfully!',
    };
  }

  // 9. Organizer Dashboard Fallback
  public async getOrganizerDashboard(organizerId: string) {
    await this.init();
    const orgEvents = this.events;
    const publishedEvents = orgEvents.filter((e) => e.status === EventStatus.PUBLISHED).length;
    const pendingEvents = orgEvents.filter((e) => e.status === EventStatus.PENDING_APPROVAL).length;

    let totalSoldTickets = 0;
    let grossRevenue = 0;
    let totalCheckedIn = 0;

    const eventPerformance = orgEvents.slice(0, 8).map((e) => {
      const eBookings = this.bookings.filter((b) => b.eventId === e.id);
      const rev = eBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
      const sold = e.ticketTypes.reduce((sum, tt) => sum + (tt.soldQuantity || 0), 0);
      const chk = this.tickets.filter((t) => t.ticketType?.eventId === e.id && t.status === TicketStatus.CHECKED_IN).length;

      totalSoldTickets += sold;
      grossRevenue += rev;
      totalCheckedIn += chk;

      return {
        id: e.id,
        title: e.title,
        status: e.status,
        revenue: rev,
        soldTickets: sold,
        capacity: e.capacity,
        checkedIn: chk,
        startDate: e.startDate.toISOString(),
      };
    });

    return {
      summary: {
        totalEvents: orgEvents.length,
        publishedEvents,
        pendingEvents,
        totalSoldTickets,
        grossRevenue,
        totalCheckedIn,
        checkInRatePercentage: totalSoldTickets > 0 ? Math.round((totalCheckedIn / totalSoldTickets) * 100) : 0,
      },
      eventPerformance,
      recentBookings: this.bookings.slice(0, 10).map((b) => {
        const ev = this.events.find((e) => e.id === b.eventId) || b.event;
        return {
          id: b.id,
          bookingReference: b.bookingReference,
          totalAmount: Number(b.totalAmount),
          createdAt: b.createdAt.toISOString(),
          status: b.status,
          user: { name: b.user?.name || 'Alex Attendee', email: b.user?.email || 'attendee@eventra.com' },
          event: { title: ev?.title || 'Event' },
        };
      }),
    };
  }

  // 10. Admin Overview Fallback
  public async getAdminOverview() {
    await this.init();
    const confirmedBookings = this.bookings.filter((b) => b.status === BookingStatus.CONFIRMED);
    const grossVolume = confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

    return {
      summary: {
        totalUsers: this.users.length,
        totalEvents: this.events.length,
        pendingEventsCount: this.events.filter((e) => e.status === EventStatus.PENDING_APPROVAL).length,
        pendingOrganizersCount: this.organizerRequests.filter((r) => r.status === 'PENDING').length,
        confirmedBookingsCount: confirmedBookings.length,
        grossVolume,
      },
      categories: this.categories.map((c) => ({
        id: c.id,
        name: c.name,
        eventsCount: this.events.filter((e) => e.categoryId === c.id).length,
      })),
      recentUsers: this.users.slice(0, 5).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: (u.createdAt || new Date()).toISOString(),
      })),
      recentBookings: confirmedBookings.slice(0, 5).map((b) => {
        const ev = this.events.find((e) => e.id === b.eventId) || b.event;
        return {
          id: b.id,
          bookingReference: b.bookingReference,
          totalAmount: Number(b.totalAmount),
          createdAt: b.createdAt.toISOString(),
          user: { name: b.user?.name || 'Alex Attendee', email: b.user?.email || 'attendee@eventra.com' },
          event: { title: ev?.title || 'Event' },
        };
      }),
    };
  }

  // 11. User Profile Fallback
  public async getUserProfile(userId: string) {
    await this.init();
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw AppError.notFound('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatarUrl: user.profile?.avatarUrl || null,
      phone: user.profile?.phone || null,
      bio: user.profile?.bio || null,
      organizationName: user.profile?.organizationName || null,
      websiteUrl: user.profile?.websiteUrl || null,
      latestOrganizerRequest: null,
      createdAt: (user.createdAt || new Date()).toISOString(),
    };
  }

  // 12. Notifications Fallback
  public async getUserNotifications(userId: string) {
    await this.init();
    const userNotifs = [...this.notifications]
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return {
      notifications: userNotifs.map((n) => {
        const isRead = n.isRead !== undefined ? Boolean(n.isRead) : Boolean(n.read);
        return {
          ...n,
          isRead,
          read: isRead,
          createdAt: (n.createdAt || new Date()).toISOString(),
        };
      }),
      unreadCount: userNotifs.filter((n) => !(n.isRead !== undefined ? n.isRead : n.read)).length,
    };
  }

  public async markNotificationAsRead(notificationId: string, userId: string) {
    await this.init();
    const notif = this.notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (notif) {
      notif.read = true;
      notif.isRead = true;
    }
    return notif ? { ...notif, isRead: true, read: true } : null;
  }

  public async markAllNotificationsAsRead(userId: string) {
    await this.init();
    this.notifications.filter((n) => n.userId === userId).forEach((n) => {
      n.read = true;
      n.isRead = true;
    });
    return { message: 'All notifications marked as read' };
  }

  // 13. Admin Moderation & Users Fallback
  public async getPendingEvents() {
    await this.init();
    return this.events
      .filter((e) => e.status === EventStatus.PENDING_APPROVAL)
      .map((e) => ({
        ...e,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        createdAt: (e.createdAt || new Date()).toISOString(),
        updatedAt: (e.updatedAt || new Date()).toISOString(),
        organizer: e.organizer || {
          id: e.organizerId,
          name: 'Conference Organizer',
          email: 'organizer@eventra.com',
          profile: { organizationName: 'Eventra Enterprise Events', websiteUrl: 'https://eventra.example.com' },
        },
      }));
  }

  public async reviewEvent(
    eventId: string,
    adminId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ) {
    await this.init();
    const ev = this.events.find((e) => e.id === eventId);
    if (!ev) throw AppError.notFound('Event not found');
    ev.status = status === 'APPROVED' ? EventStatus.APPROVED : EventStatus.REJECTED;
    if (status === 'REJECTED') {
      ev.rejectionReason = rejectionReason || 'Event submission does not meet platform guidelines.';
    }
    return {
      ...ev,
      startDate: ev.startDate.toISOString(),
      endDate: ev.endDate.toISOString(),
      createdAt: (ev.createdAt || new Date()).toISOString(),
      updatedAt: (ev.updatedAt || new Date()).toISOString(),
    };
  }

  public async getOrganizerRequests(status?: string) {
    await this.init();
    let list = this.organizerRequests;
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    return list.map((r) => ({
      ...r,
      createdAt: (r.createdAt || new Date()).toISOString(),
      updatedAt: (r.updatedAt || new Date()).toISOString(),
      user: {
        ...r.user,
        createdAt: (r.user?.createdAt || new Date()).toISOString(),
      },
    }));
  }

  public async reviewOrganizerRequest(
    requestId: string,
    adminId: string,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ) {
    await this.init();
    const req = this.organizerRequests.find((r) => r.id === requestId);
    if (!req) throw AppError.notFound('Organizer request not found');
    req.status = decision;
    req.reviewedById = adminId;
    req.reviewedAt = new Date();
    if (decision === 'REJECTED') {
      req.rejectionReason = rejectionReason || 'Criteria not met.';
    } else {
      const u = this.users.find((user) => user.id === req.userId);
      if (u) u.role = UserRole.ORGANIZER;
    }
    return {
      ...req,
      createdAt: (req.createdAt || new Date()).toISOString(),
      updatedAt: (req.updatedAt || new Date()).toISOString(),
    };
  }

  public async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: UserRole,
    status?: AccountStatus
  ) {
    await this.init();
    let filtered = [...this.users];
    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      );
    }
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    return {
      users: paginated.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        phone: u.profile?.phone || null,
        organizationName: u.profile?.organizationName || null,
        eventsCount: this.events.filter((e) => e.organizerId === u.id).length,
        bookingsCount: this.bookings.filter((b) => b.userId === u.id).length,
        createdAt: (u.createdAt || new Date()).toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getUserDetails(userId: string) {
    await this.init();
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw AppError.notFound('User not found');

    const userBookings = this.bookings.filter((b) => b.userId === userId);
    const userEvents = this.events.filter((e) => e.organizerId === userId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: (user.createdAt || new Date()).toISOString(),
      updatedAt: (user.updatedAt || user.createdAt || new Date()).toISOString(),
      profile: {
        bio: user.profile?.bio || null,
        phone: user.profile?.phone || null,
        avatarUrl: user.profile?.avatarUrl || null,
        organizationName: user.profile?.organizationName || null,
        websiteUrl: user.profile?.websiteUrl || null,
      },
      stats: {
        bookingsCount: userBookings.length,
        eventsCount: userEvents.length,
        totalSpent: userBookings
          .filter((b) => b.status === BookingStatus.CONFIRMED)
          .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0),
      },
      hasAssociatedRecords: userBookings.length > 0 || userEvents.length > 0,
      recentBookings: userBookings.slice(0, 5).map((b) => {
        const ev = this.events.find((e) => e.id === b.eventId) || b.event;
        return {
          id: b.id,
          bookingReference: b.bookingReference,
          totalAmount: Number(b.totalAmount),
          status: b.status,
          eventTitle: ev?.title || 'Event',
          createdAt: (b.createdAt || new Date()).toISOString(),
        };
      }),
      recentEvents: userEvents.slice(0, 5).map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        startDate: e.startDate.toISOString(),
      })),
    };
  }

  public async deleteUser(
    targetUserId: string,
    adminId: string,
    options?: { action?: 'delete' | 'deactivate' | 'permanent' }
  ) {
    await this.init();
    if (targetUserId === adminId) {
      throw AppError.badRequest('You cannot delete your own administrator account.');
    }

    const targetUser = this.users.find((u) => u.id === targetUserId);
    if (!targetUser) throw AppError.notFound('User not found.');

    if (targetUser.role === UserRole.ADMIN) {
      const activeAdmins = this.users.filter(
        (u) => u.role === UserRole.ADMIN && u.status === AccountStatus.ACTIVE
      ).length;
      if (activeAdmins <= 1) {
        throw AppError.badRequest('Cannot delete or remove the last active platform administrator account.');
      }
    }

    const userBookings = this.bookings.filter((b) => b.userId === targetUserId);
    const userEvents = this.events.filter((e) => e.organizerId === targetUserId);
    const hasAssociated = userBookings.length > 0 || userEvents.length > 0;

    if (options?.action === 'deactivate' || (hasAssociated && options?.action !== 'permanent')) {
      targetUser.status = AccountStatus.SUSPENDED;
      return {
        success: true,
        action: 'deactivated',
        message: `User account for "${targetUser.name}" has been deactivated to preserve their ${userBookings.length} booking(s) and transaction records.`,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          status: AccountStatus.SUSPENDED,
        },
        bookingsPreserved: userBookings.length,
        eventsPreserved: userEvents.length,
      };
    } else {
      const userIndex = this.users.findIndex((u) => u.id === targetUserId);
      if (userIndex !== -1) {
        this.users.splice(userIndex, 1);
      }
      this.reservations = this.reservations.filter((r) => r.userId !== targetUserId);
      if (options?.action === 'permanent') {
        this.bookings = this.bookings.filter((b) => b.userId !== targetUserId);
        this.events = this.events.filter((e) => e.organizerId !== targetUserId);
      }
      return {
        success: true,
        action: 'deleted',
        message: `User account for "${targetUser.name}" (${targetUser.email}) has been permanently deleted.`,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
      };
    }
  }

  public async updateUserStatus(targetUserId: string, adminId: string, status: AccountStatus, _reason?: string) {
    await this.init();
    if (targetUserId === adminId) {
      throw AppError.badRequest('Administrators cannot change their own account status');
    }
    const user = this.users.find((u) => u.id === targetUserId);
    if (!user) throw AppError.notFound('User not found');
    user.status = status;
    return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
  }

  // 14. Organizer Dashboard & Attendee Fallbacks
  public async getMyEvents(organizerId: string, status?: EventStatus) {
    await this.init();
    let events = this.events.filter((e) => e.organizerId === organizerId);
    if (status) {
      events = events.filter((e) => e.status === status);
    }
    return events.map((e) => ({
      ...e,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      createdAt: (e.createdAt || new Date()).toISOString(),
      updatedAt: (e.updatedAt || new Date()).toISOString(),
    }));
  }

  public async getEventAttendees(eventId: string, organizerId: string, userRole: UserRole) {
    await this.init();
    const event = this.events.find((e) => e.id === eventId);
    if (!event) throw AppError.notFound('Event not found');
    const bookings = this.bookings.filter((b) => b.eventId === eventId && b.status === BookingStatus.CONFIRMED);
    const tickets = bookings.flatMap((b) => b.tickets || []);
    return {
      event: { id: event.id, title: event.title, startDate: event.startDate.toISOString() },
      totalAttendees: tickets.length,
      checkedInCount: tickets.filter((t) => t.status === TicketStatus.CHECKED_IN).length,
      attendees: tickets.map((t) => ({
        ticketId: t.id,
        ticketNumber: t.ticketReference,
        ticketToken: t.qrCode,
        ticketTypeName: t.ticketType?.name || 'General Admission',
        attendeeName: t.attendee?.name || 'Attendee',
        attendeeEmail: t.attendee?.email || 'attendee@eventra.com',
        status: t.status,
        checkedInAt: t.checkedInAt?.toISOString() || null,
        bookingReference: t.booking?.bookingReference || 'BKG-REF',
        issuedAt: (t.createdAt || new Date()).toISOString(),
      })),
    };
  }

  // 15. Event Creation & Mutation Fallbacks
  public async getAllAdminEvents(options: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    await this.init();
    let filtered = [...this.events];

    if (options.status && options.status !== 'ALL') {
      filtered = filtered.filter((e) => e.status === options.status);
    }

    if (options.category && options.category !== 'ALL') {
      filtered = filtered.filter(
        (e) => e.categoryId === options.category || e.category?.slug === options.category
      );
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.venueName?.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      events: paginated.map((ev) => {
        const bookingsCount = this.bookings.filter((b) => b.eventId === ev.id).length;
        return {
          id: ev.id,
          organizerId: ev.organizerId,
          categoryId: ev.categoryId,
          title: ev.title,
          slug: ev.slug,
          description: ev.description,
          bannerUrl: ev.bannerUrl,
          startDate: ev.startDate.toISOString(),
          endDate: ev.endDate.toISOString(),
          timeZone: ev.timeZone,
          isOnline: ev.isOnline,
          venueName: ev.venueName,
          venueAddress: ev.venueAddress,
          city: ev.city,
          capacity: ev.capacity,
          cancellationPolicy: ev.cancellationPolicy,
          status: ev.status,
          rejectionReason: ev.rejectionReason,
          createdAt: (ev.createdAt || new Date()).toISOString(),
          updatedAt: (ev.updatedAt || new Date()).toISOString(),
          organizer: ev.organizer
            ? {
                id: ev.organizer.id,
                name: ev.organizer.name,
                email: ev.organizer.email,
              }
            : {
                id: ev.organizerId,
                name: 'Platform Administrator',
                email: 'admin@eventra.com',
              },
          category: ev.category,
          ticketTypes: (ev.ticketTypes || []).map((tt) => ({
            id: tt.id,
            eventId: tt.eventId,
            name: tt.name,
            price: Number(tt.price),
            totalQuantity: Number(tt.totalQuantity),
            soldQuantity: Number(tt.soldQuantity || 0),
            availableQuantity: Math.max(0, Number(tt.totalQuantity) - Number(tt.soldQuantity || 0)),
            maxPerUser: Number(tt.maxPerUser || 10),
          })),
          _count: {
            bookings: bookingsCount,
          },
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async createEvent(userId: string, input: any) {
    await this.init();
    const id = `evt-${Date.now()}`;
    const baseSlug = (input.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    const cat = this.categories.find((c) => c.id === input.categoryId || c.slug === input.categoryId) || this.categories[0];
    const user = this.users.find((u) => u.id === userId) || this.users.find((u) => u.role === UserRole.ADMIN);

    const ticketTypes: FallbackTicketType[] = (input.ticketTypes && input.ticketTypes.length > 0
      ? input.ticketTypes
      : [{ name: 'General Admission', price: 0, totalQuantity: Number(input.capacity || 100), maxPerUser: 10 }]
    ).map((tt: any, idx: number) => ({
      id: `tt-${id}-${idx + 1}`,
      eventId: id,
      name: tt.name,
      price: Number(tt.price || 0),
      totalQuantity: Number(tt.totalQuantity || 100),
      maxPerUser: Number(tt.maxPerUser || 10),
      soldQuantity: 0,
    }));

    const newEvent: FallbackEvent = {
      id,
      title: input.title,
      slug,
      description: input.description,
      bannerUrl: input.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
      categoryId: cat.id,
      category: cat,
      organizerId: userId,
      organizer: user,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      timeZone: input.timeZone || 'UTC',
      isOnline: !!input.isOnline,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      city: input.city,
      capacity: Number(input.capacity || 100),
      status: input.status || EventStatus.PUBLISHED,
      cancellationPolicy: input.cancellationPolicy || 'Standard refund policy',
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketTypes,
    };

    this.events.unshift(newEvent);
    return newEvent;
  }

  public async updateEvent(eventId: string, userId: string, userRole: UserRole, input: any) {
    await this.init();
    const ev = this.events.find((e) => e.id === eventId);
    if (!ev) throw AppError.notFound('Event not found');
    if (ev.organizerId !== userId && userRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You are not authorized to update this event');
    }

    if (input.categoryId) {
      const cat = this.categories.find((c) => c.id === input.categoryId || c.slug === input.categoryId);
      if (cat) {
        ev.categoryId = cat.id;
        ev.category = cat;
      }
    }

    if (Array.isArray(input.ticketTypes) && input.ticketTypes.length > 0) {
      ev.ticketTypes = input.ticketTypes.map((tt: any, idx: number) => ({
        id: tt.id || `tt-${ev.id}-${idx + 1}`,
        eventId: ev.id,
        name: tt.name,
        price: Number(tt.price || 0),
        totalQuantity: Number(tt.totalQuantity || 50),
        maxPerUser: Number(tt.maxPerUser || 10),
        soldQuantity: Number(tt.soldQuantity || 0),
      }));
    }

    Object.assign(ev, {
      ...(input.title ? { title: input.title } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.bannerUrl ? { bannerUrl: input.bannerUrl } : {}),
      ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
      ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
      ...(input.timeZone ? { timeZone: input.timeZone } : {}),
      ...(input.isOnline !== undefined ? { isOnline: input.isOnline } : {}),
      ...(input.venueName !== undefined ? { venueName: input.venueName } : {}),
      ...(input.venueAddress !== undefined ? { venueAddress: input.venueAddress } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.capacity ? { capacity: Number(input.capacity) } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.cancellationPolicy ? { cancellationPolicy: input.cancellationPolicy } : {}),
      updatedAt: new Date(),
    });
    return ev;
  }

  public async adminUpdateEventStatus(eventId: string, status: EventStatus, reason?: string) {
    await this.init();
    const ev = this.events.find((e) => e.id === eventId);
    if (!ev) throw AppError.notFound('Event not found');
    ev.status = status;
    if (reason !== undefined) {
      ev.rejectionReason = reason;
    }
    ev.updatedAt = new Date();
    return ev;
  }

  public async submitForApproval(eventId: string, userId: string) {
    await this.init();
    const ev = this.events.find((e) => e.id === eventId);
    if (!ev) throw AppError.notFound('Event not found');
    if (ev.organizerId !== userId) {
      throw AppError.forbidden('You are not authorized to submit this event');
    }
    ev.status = EventStatus.PENDING_APPROVAL;
    ev.updatedAt = new Date();
    return ev;
  }

  public async publishEvent(eventId: string, userId: string, userRole: UserRole) {
    await this.init();
    const ev = this.events.find((e) => e.id === eventId);
    if (!ev) throw AppError.notFound('Event not found');
    if (ev.organizerId !== userId && userRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You are not authorized to publish this event');
    }
    ev.status = EventStatus.PUBLISHED;
    ev.updatedAt = new Date();
    return ev;
  }

  public async cancelEvent(eventId: string, userId: string, userRole: UserRole, reason?: string) {
    await this.init();
    const ev = this.events.find((e) => e.id === eventId);
    if (!ev) throw AppError.notFound('Event not found');
    if (ev.organizerId !== userId && userRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You are not authorized to cancel this event');
    }
    if (ev.status === EventStatus.CANCELLED) {
      throw AppError.badRequest('This event is already cancelled');
    }

    const cancelReason = reason || 'Event was cancelled by the organizer.';
    ev.status = EventStatus.CANCELLED;
    ev.rejectionReason = cancelReason;
    ev.updatedAt = new Date();

    // Invalidate/void active reservations so no new bookings can occur
    this.reservations.forEach((r) => {
      if (r.eventId === eventId && r.status === ReservationStatus.ACTIVE) {
        r.status = ReservationStatus.EXPIRED;
      }
    });

    // Void confirmed bookings, tickets, send in-app notifications and emails
    const confirmedBookings = this.bookings.filter((b) => b.eventId === eventId && b.status === BookingStatus.CONFIRMED);
    for (const b of confirmedBookings) {
      b.status = BookingStatus.CANCELLED;
      b.cancelledAt = new Date();
      b.cancellationReason = cancelReason;

      // Void all tickets
      const bTickets = this.tickets.filter((t) => t.bookingId === b.id);
      bTickets.forEach((t) => {
        t.status = TicketStatus.CANCELLED;
      });

      // Send in-app notification
      this.notifications.push({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: b.userId,
        title: `Event Cancelled: ${ev.title}`,
        message: `The event "${ev.title}" has been cancelled by the organizer. Reason: ${cancelReason}. Your digital tickets have been voided and test refund processed.`,
        type: 'EVENT_CANCELLED',
        link: `/bookings/${b.id}`,
        read: false,
        isRead: false,
        createdAt: new Date(),
      });

      // Send cancellation email
      const attendeeEmail = b.user?.email || bTickets[0]?.attendee?.email || 'attendee@eventra.com';
      const attendeeName = b.user?.name || bTickets[0]?.attendee?.name || 'Attendee';
      emailService.sendEventCancellationEmail(attendeeEmail, attendeeName, ev.title, cancelReason).catch((err) => {
        console.warn('⚠️ Non-fatal: Failed to send event cancellation email in dev fallback store:', err.message);
      });
    }

    return ev;
  }

  public async deleteEvent(eventId: string, userId: string, userRole: UserRole) {
    await this.init();
    const index = this.events.findIndex((e) => e.id === eventId);
    if (index === -1) throw AppError.notFound('Event not found');
    const ev = this.events[index];
    if (ev.organizerId !== userId && userRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You are not authorized to delete this event');
    }
    this.events.splice(index, 1);
    this.reservations = this.reservations.filter((r) => r.eventId !== eventId);
    return { message: 'Event removed successfully' };
  }

  public async adminDeleteEvent(eventId: string) {
    await this.init();
    const index = this.events.findIndex((e) => e.id === eventId);
    if (index === -1) throw AppError.notFound('Event not found');
    const ev = this.events[index];
    const bookingsCount = this.bookings.filter((b) => b.eventId === eventId).length;

    this.events.splice(index, 1);
    this.reservations = this.reservations.filter((r) => r.eventId !== eventId);

    return {
      success: true,
      message: `Event "${ev.title}" permanently deleted.`,
      bookingsAffected: bookingsCount,
    };
  }

  public async getAllAdminBookings(options?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    await this.init();
    let filtered = [...this.bookings];
    if (options?.status && options.status !== 'ALL') {
      filtered = filtered.filter((b) => b.status === options.status);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.bookingReference.toLowerCase().includes(q) ||
          b.user?.name?.toLowerCase().includes(q) ||
          b.user?.email?.toLowerCase().includes(q) ||
          b.event?.title?.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);
    return {
      bookings: paginated.map((b) => {
        const ev = this.events.find((e) => e.id === b.eventId) || b.event;
        const bTickets = this.tickets.filter((t) => t.bookingId === b.id);
        return {
          id: b.id,
          bookingReference: b.bookingReference,
          userId: b.userId,
          eventId: b.eventId,
          totalAmount: Number(b.totalAmount),
          status: b.status,
          createdAt: b.createdAt.toISOString(),
          cancelledAt: b.cancelledAt?.toISOString() || null,
          cancellationReason: b.cancellationReason || null,
          user: {
            id: b.user?.id || b.userId,
            name: b.user?.name || 'Attendee',
            email: b.user?.email || 'attendee@eventra.com',
          },
          event: {
            id: ev?.id || b.eventId,
            title: ev?.title || 'Platform Event',
            startDate: ev?.startDate ? ev.startDate.toISOString() : new Date().toISOString(),
          },
          ticketsCount: bTickets.length,
          tickets: bTickets.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketReference,
            status: t.status,
            ticketTypeName: t.ticketType?.name || 'Standard Pass',
            price: Number(t.ticketType?.price || 0),
          })),
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  public async broadcastNotification(input: { title: string; message: string; targetRole?: string }) {
    await this.init();
    let recipients = this.users;
    if (input.targetRole && input.targetRole !== 'ALL') {
      recipients = recipients.filter((u) => u.role === input.targetRole);
    }
    for (const u of recipients) {
      this.notifications.push({
        id: `notif-bc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: u.id,
        title: input.title,
        message: input.message,
        type: 'SYSTEM_ANNOUNCEMENT',
        read: false,
        isRead: false,
        createdAt: new Date(),
      });
    }
    return {
      success: true,
      deliveredCount: recipients.length,
      message: `Announcement broadcast successfully delivered to ${recipients.length} user(s).`,
    };
  }
}

export const devFallbackStore = new DevFallbackStore();

export function isPrismaConnectionError(error: any): boolean {
  if (!error) return false;
  const msg = error.message || '';
  const name = error.name || '';
  return (
    name === 'PrismaClientInitializationError' ||
    name === 'PrismaClientRustPanicError' ||
    msg.includes("Can't reach database server") ||
    msg.includes('Connection refused') ||
    msg.includes('connection timed out') ||
    msg.includes('P1001') ||
    msg.includes('P1000') ||
    msg.includes('P1002') ||
    msg.includes('P1003')
  );
}
