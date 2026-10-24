import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting EVENTRA database seed...');

  // 1. Create Default Categories
  const categoriesData = [
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Conferences, hackathons, cloud summits, and AI workshops.',
      icon: 'Cpu',
    },
    {
      name: 'Music & Concerts',
      slug: 'music',
      description: 'Live acoustic sets, electronic festivals, and symphony galas.',
      icon: 'Music',
    },
    {
      name: 'Business & Finance',
      slug: 'business',
      description: 'Executive leadership forums, startup pitches, and venture networks.',
      icon: 'Briefcase',
    },
    {
      name: 'Education & Workshops',
      slug: 'education',
      description: 'Interactive masterclasses, scientific seminars, and coding bootcamps.',
      icon: 'GraduationCap',
    },
    {
      name: 'Arts & Culture',
      slug: 'arts-culture',
      description: 'Modern art exhibits, theater performances, and literary salons.',
      icon: 'Palette',
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = record;
  }
  console.log(`✅ Seeded ${Object.keys(categories).length} categories.`);

  // 2. Hash Seed Passwords
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminPassword123!', 12);
  const organizerPasswordHash = await bcrypt.hash(process.env.ORGANIZER_PASSWORD || 'OrganizerPassword123!', 12);
  const attendeePasswordHash = await bcrypt.hash(process.env.ATTENDEE_PASSWORD || 'AttendeePassword123!', 12);

  // 3. Seed Users
  const admin = await prisma.user.upsert({
    where: { email: (process.env.ADMIN_EMAIL || 'admin@eventra.com').toLowerCase() },
    update: {},
    create: {
      email: (process.env.ADMIN_EMAIL || 'admin@eventra.com').toLowerCase(),
      name: process.env.ADMIN_NAME || 'Platform Administrator',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: 'Lead Platform Administrator for EVENTRA.',
          phone: '+91 98201 92831',
          organizationName: 'EVENTRA Core Operations',
        },
      },
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: (process.env.ORGANIZER_EMAIL || 'organizer@eventra.com').toLowerCase() },
    update: {},
    create: {
      email: (process.env.ORGANIZER_EMAIL || 'organizer@eventra.com').toLowerCase(),
      name: process.env.ORGANIZER_NAME || 'Sarah Jenkins',
      passwordHash: organizerPasswordHash,
      role: 'ORGANIZER',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: 'Curator of premiere technology summits and creative conferences across North America.',
          phone: '+1 (555) 014-9982',
          organizationName: 'Horizon Event Group',
          websiteUrl: 'https://horizon-events.example.com',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        },
      },
    },
  });

  const attendee = await prisma.user.upsert({
    where: { email: (process.env.ATTENDEE_EMAIL || 'attendee@eventra.com').toLowerCase() },
    update: {},
    create: {
      email: (process.env.ATTENDEE_EMAIL || 'attendee@eventra.com').toLowerCase(),
      name: process.env.ATTENDEE_NAME || 'Alex Chen',
      passwordHash: attendeePasswordHash,
      role: 'ATTENDEE',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: 'Software engineer, live music enthusiast, and avid summit attendee.',
          phone: '+1 (555) 012-3344',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        },
      },
      notifications: {
        create: [
          {
            title: 'Welcome to EVENTRA',
            message: 'Explore upcoming conferences and live performances in your city.',
            type: 'WELCOME',
          },
        ],
      },
    },
  });
  console.log(`✅ Seeded 3 primary test accounts: Admin, Organizer, Attendee.`);

  // 4. Seed 12 Realistic Events with Multiple Ticket Types
  const eventsData = [
    {
      title: 'Global Software Architecture Summit 2026',
      slug: 'global-software-architecture-summit-2026',
      description:
        'Join over 1,200 senior software architects, distributed systems designers, and tech leaders for two intensive days of deep-dive keynotes, peer engineering reviews, and hands-on system design workshops covering microservices, event-driven scalability, and production resilience.',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'technology',
      startDate: new Date('2026-11-18T09:00:00Z'),
      endDate: new Date('2026-11-19T18:00:00Z'),
      timeZone: 'America/New_York',
      isOnline: false,
      venueName: 'Jacob K. Javits Convention Center',
      venueAddress: '429 11th Ave',
      city: 'New York',
      capacity: 800,
      status: 'PUBLISHED',
      cancellationPolicy: 'Full refund available up to 48 hours prior to event commencement.',
      ticketTypes: [
        { name: 'Early Bird Pass', price: 199.0, totalQuantity: 200, maxPerUser: 4 },
        { name: 'Standard Full Conference', price: 299.0, totalQuantity: 450, maxPerUser: 6 },
        { name: 'VIP Executive Pass & Dinners', price: 599.0, totalQuantity: 150, maxPerUser: 2 },
      ],
    },
    {
      title: 'NextGen AI & Cloud Infrastructure Expo',
      slug: 'nextgen-ai-cloud-infrastructure-expo',
      description:
        'Explore the frontier of foundation models, enterprise LLM deployment, high-throughput GPU clusters, and modern cloud infrastructure. Featuring keynotes from chief AI scientists and cloud architects.',
      bannerUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'technology',
      startDate: new Date('2026-12-02T10:00:00Z'),
      endDate: new Date('2026-12-03T17:30:00Z'),
      timeZone: 'America/Los_Angeles',
      isOnline: false,
      venueName: 'Moscone West Center',
      venueAddress: '800 Howard St',
      city: 'San Francisco',
      capacity: 1200,
      status: 'PUBLISHED',
      cancellationPolicy: 'Cancellations eligible until 72 hours before start.',
      ticketTypes: [
        { name: 'Expo Hall Access', price: 49.0, totalQuantity: 600, maxPerUser: 8 },
        { name: 'All-Access Pass', price: 249.0, totalQuantity: 450, maxPerUser: 4 },
        { name: 'Founder & Investor Access', price: 499.0, totalQuantity: 150, maxPerUser: 2 },
      ],
    },
    {
      title: 'Neon Nights: Electronic Symphony Experience',
      slug: 'neon-nights-electronic-symphony',
      description:
        'An electrifying fusion of a 60-piece live philharmonic orchestra with world-renowned synthesizer artists and modular sound designers, accompanied by immersive laser projection mapping.',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'music',
      startDate: new Date('2026-11-28T20:00:00Z'),
      endDate: new Date('2026-11-28T23:30:00Z'),
      timeZone: 'America/Chicago',
      isOnline: false,
      venueName: 'The Aragon Ballroom',
      venueAddress: '1106 W Lawrence Ave',
      city: 'Chicago',
      capacity: 1500,
      status: 'PUBLISHED',
      cancellationPolicy: 'Tickets are non-refundable after purchase.',
      ticketTypes: [
        { name: 'General Admission Floor', price: 65.0, totalQuantity: 1000, maxPerUser: 6 },
        { name: 'Balcony Reserved Seating', price: 95.0, totalQuantity: 350, maxPerUser: 4 },
        { name: 'VIP Orchestra Box & Merch', price: 180.0, totalQuantity: 150, maxPerUser: 4 },
      ],
    },
    {
      title: 'Acoustic Sunset Series: Indie Artists Live',
      slug: 'acoustic-sunset-series-indie-live',
      description:
        'An intimate open-air twilight concert showcasing rising singer-songwriters, folk trios, and acoustic ensembles beneath the coastal redwoods.',
      bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'music',
      startDate: new Date('2026-12-10T17:30:00Z'),
      endDate: new Date('2026-12-10T21:00:00Z'),
      timeZone: 'America/Los_Angeles',
      isOnline: false,
      venueName: 'Greek Theatre Amphitheater',
      venueAddress: '2001 Gayley Rd',
      city: 'Berkeley',
      capacity: 500,
      status: 'PUBLISHED',
      cancellationPolicy: 'Refunds permitted up to 48 hours before doors open.',
      ticketTypes: [
        { name: 'Lawn Seating', price: 35.0, totalQuantity: 350, maxPerUser: 6 },
        { name: 'Reserved Pavilion Bench', price: 75.0, totalQuantity: 150, maxPerUser: 4 },
      ],
    },
    {
      title: 'Venture Forward: Angel & Seed Capital Forum',
      slug: 'venture-forward-angel-seed-capital-forum',
      description:
        'The definitive quarterly summit bringing together early-stage venture capitalists, active angel syndicates, and seed-stage founders seeking actionable term sheet insights and direct pitch sessions.',
      bannerUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'business',
      startDate: new Date('2026-11-22T08:30:00Z'),
      endDate: new Date('2026-11-22T17:00:00Z'),
      timeZone: 'America/New_York',
      isOnline: false,
      venueName: 'Financial District Harvard Club',
      venueAddress: '27 W 44th St',
      city: 'New York',
      capacity: 350,
      status: 'PUBLISHED',
      cancellationPolicy: 'Strict cancellation policy: 50% refund before 7 days out.',
      ticketTypes: [
        { name: 'Founder Registration', price: 150.0, totalQuantity: 200, maxPerUser: 2 },
        { name: 'Accredited Investor Seat', price: 350.0, totalQuantity: 150, maxPerUser: 2 },
      ],
    },
    {
      title: 'SaaS Metrics & Product-Led Growth Intensive',
      slug: 'saas-metrics-product-led-growth-intensive',
      description:
        'Master retention benchmarks, cohort net expansion, automated onboarding funnels, and enterprise sales efficiency with operators from hyper-growth B2B software companies.',
      bannerUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'business',
      startDate: new Date('2026-12-05T13:00:00Z'),
      endDate: new Date('2026-12-05T18:00:00Z'),
      timeZone: 'UTC',
      isOnline: true,
      venueName: 'Virtual Interactive Stage',
      city: 'Online',
      capacity: 1000,
      status: 'PUBLISHED',
      cancellationPolicy: 'Free cancellation anytime prior to live broadcast start.',
      ticketTypes: [
        { name: 'Free Virtual Pass', price: 0.0, totalQuantity: 700, maxPerUser: 2 },
        { name: 'Workshop Pass + Recordings', price: 89.0, totalQuantity: 300, maxPerUser: 5 },
      ],
    },
    {
      title: 'Full-Stack TypeScript & Cloud Mastery Workshop',
      slug: 'fullstack-typescript-cloud-mastery-workshop',
      description:
        'A comprehensive 8-hour hands-on code laboratory. Build production distributed architectures with Next.js, Prisma, PostgreSQL, Docker, and CI/CD pipelines.',
      bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'education',
      startDate: new Date('2026-11-25T09:00:00Z'),
      endDate: new Date('2026-11-25T17:00:00Z'),
      timeZone: 'America/Los_Angeles',
      isOnline: false,
      venueName: 'DevHub Collaborative Space',
      venueAddress: '488 4th St',
      city: 'San Francisco',
      capacity: 120,
      status: 'PUBLISHED',
      cancellationPolicy: 'Cancellations permitted up to 48h before workshop.',
      ticketTypes: [
        { name: 'General Student Pass', price: 120.0, totalQuantity: 80, maxPerUser: 2 },
        { name: 'Professional Ticket with 1:1 Review', price: 250.0, totalQuantity: 40, maxPerUser: 2 },
      ],
    },
    {
      title: 'Data Engineering & Modern ETL Architectures',
      slug: 'data-engineering-modern-etl-architectures',
      description:
        'A masterclass on real-time streaming, lakehouse storage layers, data quality contracts, and orchestrating robust DAGs for high-scale analytics.',
      bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'education',
      startDate: new Date('2026-12-14T10:00:00Z'),
      endDate: new Date('2026-12-14T16:00:00Z'),
      timeZone: 'America/Denver',
      isOnline: false,
      venueName: 'Colorado Innovation Commons',
      venueAddress: '1600 Wynkoop St',
      city: 'Denver',
      capacity: 150,
      status: 'PUBLISHED',
      cancellationPolicy: 'Full refund up to 72 hours before start.',
      ticketTypes: [
        { name: 'Standard Seat', price: 140.0, totalQuantity: 110, maxPerUser: 3 },
        { name: 'VIP Front Row + Book', price: 210.0, totalQuantity: 40, maxPerUser: 2 },
      ],
    },
    {
      title: 'Metropolis Contemporary Art Biennial 2026',
      slug: 'metropolis-contemporary-art-biennial-2026',
      description:
        'Witness boundary-pushing kinetic sculptures, generative algorithmic visuals, and large-scale physical installations from 45 international contemporary artists.',
      bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'arts-culture',
      startDate: new Date('2026-11-30T10:00:00Z'),
      endDate: new Date('2026-12-06T20:00:00Z'),
      timeZone: 'America/Los_Angeles',
      isOnline: false,
      venueName: 'The Broad Contemporary Hall',
      venueAddress: '221 S Grand Ave',
      city: 'Los Angeles',
      capacity: 3000,
      status: 'PUBLISHED',
      cancellationPolicy: 'Refunds permitted up to 24 hours prior to chosen entry slot.',
      ticketTypes: [
        { name: 'Weekday General Admission', price: 28.0, totalQuantity: 1800, maxPerUser: 6 },
        { name: 'Weekend Priority Entry', price: 42.0, totalQuantity: 900, maxPerUser: 6 },
        { name: 'Curator-Led Private Tour', price: 95.0, totalQuantity: 300, maxPerUser: 4 },
      ],
    },
    {
      title: 'Modern Architecture & Urbanism Symposium',
      slug: 'modern-architecture-urbanism-symposium',
      description:
        'A critical gathering exploring biophilic city design, mass timber high-rises, and climate-adaptive civic infrastructure with leading structural architects.',
      bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'arts-culture',
      startDate: new Date('2026-12-18T14:00:00Z'),
      endDate: new Date('2026-12-19T18:00:00Z'),
      timeZone: 'America/Chicago',
      isOnline: false,
      venueName: 'Chicago Architecture Center',
      venueAddress: '111 E Wacker Dr',
      city: 'Chicago',
      capacity: 400,
      status: 'PUBLISHED',
      cancellationPolicy: 'Standard 48-hour cancellation policy.',
      ticketTypes: [
        { name: 'Symposium Pass', price: 85.0, totalQuantity: 320, maxPerUser: 4 },
        { name: 'Fellowship Student Pass', price: 30.0, totalQuantity: 80, maxPerUser: 2 },
      ],
    },
    // Demonstration events for Admin & Organizer workflows (Draft & Pending)
    {
      title: 'DevOps & Kubernetes World Congress [Pending Review]',
      slug: 'devops-kubernetes-world-congress',
      description:
        'A comprehensive gathering on multi-cluster orchestration, GitOps automation, eBPF telemetry, and zero-trust cloud network security.',
      bannerUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'technology',
      startDate: new Date('2026-12-28T09:00:00Z'),
      endDate: new Date('2026-12-29T17:00:00Z'),
      timeZone: 'America/New_York',
      isOnline: false,
      venueName: 'Boston Convention & Exhibition Center',
      venueAddress: '415 Summer St',
      city: 'Boston',
      capacity: 600,
      status: 'PENDING_APPROVAL', // Waiting in admin moderation queue!
      cancellationPolicy: 'Refunds permitted up to 48 hours before start.',
      ticketTypes: [
        { name: 'Standard Delegate', price: 199.0, totalQuantity: 400, maxPerUser: 4 },
        { name: 'VIP Track', price: 399.0, totalQuantity: 200, maxPerUser: 2 },
      ],
    },
    {
      title: 'Global Fintech & Decentralized Ledger Forum [Draft]',
      slug: 'global-fintech-decentralized-ledger-forum',
      description:
        'Examining the future of cross-border settlements, regulatory compliance in decentralized finance, and automated clearing houses.',
      bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1600&q=80',
      categorySlug: 'business',
      startDate: new Date('2027-01-15T09:00:00Z'),
      endDate: new Date('2027-01-16T18:00:00Z'),
      timeZone: 'Europe/London',
      isOnline: false,
      venueName: 'ExCeL London Exhibition Centre',
      city: 'London',
      capacity: 500,
      status: 'DRAFT', // Organizer working on draft
      cancellationPolicy: 'Full refund up to 72 hours prior to event.',
      ticketTypes: [
        { name: 'Standard Pass', price: 150.0, totalQuantity: 350, maxPerUser: 4 },
        { name: 'VIP Investor', price: 350.0, totalQuantity: 150, maxPerUser: 2 },
      ],
    },
  ];

  for (const item of eventsData) {
    const category = categories[item.categorySlug];
    const { ticketTypes, categorySlug, ...eventFields } = item;

    const event = await prisma.event.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        ...eventFields,
        organizerId: organizer.id,
        categoryId: category.id,
        status: item.status as any,
        ticketTypes: {
          create: ticketTypes.map((tt) => ({
            name: tt.name,
            price: tt.price,
            totalQuantity: tt.totalQuantity,
            maxPerUser: Math.max(tt.maxPerUser || 10, 10),
          })),
        },
      },
      include: {
        ticketTypes: true,
      },
    });

    console.log(`  - Seeded event: "${event.title}" (${event.status})`);
  }

  // 5. Create a sample confirmed booking for Attendee so they have a QR ticket ready to test!
  const firstEvent = await prisma.event.findFirst({
    where: { slug: 'global-software-architecture-summit-2026' },
    include: { ticketTypes: true },
  });

  if (firstEvent && firstEvent.ticketTypes.length > 0) {
    const vipTicketType = firstEvent.ticketTypes.find((t) => t.name.includes('VIP')) || firstEvent.ticketTypes[0];

    const existingBooking = await prisma.booking.findFirst({
      where: { userId: attendee.id, eventId: firstEvent.id },
    });

    if (!existingBooking) {
      const booking = await prisma.booking.create({
        data: {
          bookingReference: 'BKG-DEMO2026',
          userId: attendee.id,
          eventId: firstEvent.id,
          totalAmount: vipTicketType.price,
          status: 'CONFIRMED',
          items: {
            create: [
              {
                ticketTypeId: vipTicketType.id,
                quantity: 1,
                unitPrice: vipTicketType.price,
                subtotal: vipTicketType.price,
              },
            ],
          },
          tickets: {
            create: [
              {
                ticketNumber: 'TKT-DEMO8899',
                ticketToken: 'demo-qr-token-summit-vip-2026',
                ticketTypeId: vipTicketType.id,
                attendeeName: attendee.name,
                attendeeEmail: attendee.email,
                status: 'VALID',
              },
            ],
          },
          payments: {
            create: [
              {
                userId: attendee.id,
                amount: vipTicketType.price,
                currency: 'INR',
                paymentMethod: 'CARD',
                status: 'SUCCESS',
                transactionReference: 'TXN-DEMO7711',
                cardLast4: '4242',
                cardHolder: attendee.name,
              },
            ],
          },
        },
      });

      await prisma.ticketType.update({
        where: { id: vipTicketType.id },
        data: { soldQuantity: { increment: 1 } },
      });

      console.log(`✅ Seeded demo confirmed booking & QR ticket (${booking.bookingReference}) for Attendee.`);
    }
  }

  console.log('\n======================================================');
  console.log('🎉 EVENTRA Database Seed Finished Successfully!');
  console.log('Test Accounts Seeded:');
  console.log('  1. ADMIN:     admin@eventra.com     / AdminPassword123!');
  console.log('  2. ORGANIZER: organizer@eventra.com / OrganizerPassword123!');
  console.log('  3. ATTENDEE:  attendee@eventra.com  / AttendeePassword123!');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
