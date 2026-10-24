export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'EVENTRA API Documentation',
    version: '1.0.0',
    description:
      'Production-Quality Event Discovery, Booking, Ticketing, and Concurrency-Safe Inventory API.',
    contact: {
      name: 'EVENTRA Engineering Team',
      email: 'support@eventra.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current Environment API Base URL',
    },
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Health', description: 'System health check' },
    { name: 'Auth', description: 'User registration, login, and session refresh' },
    { name: 'Users', description: 'Attendee and Organizer profile management' },
    { name: 'Events', description: 'Event discovery, filtering, and management' },
    { name: 'Categories', description: 'Event classifications and categories' },
    { name: 'Bookings', description: 'Inventory reservation, mock payment, and checkout' },
    { name: 'Tickets', description: 'Digital QR tickets, lookup, and check-in validation' },
    { name: 'Organizers', description: 'Organizer dashboard, attendee rosters, and sales stats' },
    { name: 'Admin', description: 'Administrative moderation queue, audits, and user controls' },
    { name: 'Notifications', description: 'In-app attendee and organizer notification center' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health status',
        responses: {
          '200': {
            description: 'API service is operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', example: '2026-10-23T12:00:00.000Z' },
                    service: { type: 'string', example: 'eventra-api' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new attendee account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', format: 'email', example: 'jane@example.com' },
                  password: { type: 'string', format: 'password', example: 'Password123!' },
                  phone: { type: 'string', example: '+1234567890' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Registration successful' },
          '400': { description: 'Validation failed' },
          '409': { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and receive session cookies',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'attendee@eventra.com' },
                  password: { type: 'string', format: 'password', example: 'AttendeePassword123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Clear authentication cookies',
        responses: {
          '200': { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user identity and profile',
        responses: {
          '200': { description: 'Authenticated user profile' },
          '401': { description: 'Authentication required' },
        },
      },
    },
    '/events': {
      get: {
        tags: ['Events'],
        summary: 'Browse and filter published events',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'isOnline', in: 'query', schema: { type: 'boolean' } },
          { name: 'freeOnly', in: 'query', schema: { type: 'boolean' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['date_asc', 'date_desc', 'price_asc', 'price_desc'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          '200': { description: 'List of events with pagination meta' },
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Create new event (Organizer/Admin only)',
        responses: {
          '201': { description: 'Event draft created' },
          '403': { description: 'Organizer role required' },
        },
      },
    },
    '/events/{idOrSlug}': {
      get: {
        tags: ['Events'],
        summary: 'Get event details with ticket availability',
        parameters: [
          { name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Event detail and remaining ticket inventory' },
          '404': { description: 'Event not found' },
        },
      },
    },
    '/bookings/reservations': {
      post: {
        tags: ['Bookings'],
        summary: 'Reserve ticket inventory for 10 minutes (Concurrency-safe)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['eventId', 'items'],
                properties: {
                  eventId: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ticketTypeId: { type: 'string' },
                        quantity: { type: 'integer', minimum: 1, maximum: 10 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Inventory held successfully with 10min TTL' },
          '409': { description: 'Sold out or insufficient capacity' },
        },
      },
    },
    '/bookings/pay': {
      post: {
        tags: ['Bookings'],
        summary: 'Complete mock payment and issue QR tickets',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reservationId', 'paymentMethod'],
                properties: {
                  reservationId: { type: 'string' },
                  paymentMethod: { type: 'string', enum: ['CARD', 'UPI'] },
                  simulateSuccess: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Payment successful, tickets issued' },
          '410': { description: 'Reservation expired' },
        },
      },
    },
    '/tickets/check-in': {
      post: {
        tags: ['Tickets'],
        summary: 'Atomically validate and check in attendee ticket via QR token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ticketToken'],
                properties: {
                  ticketToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Check-in validated' },
          '409': { description: 'Already checked in' },
          '403': { description: 'Unauthorized for this event' },
        },
      },
    },
  },
};
