import { prisma, isDatabaseConnected } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { EventStatus, BookingStatus, TicketStatus, UserRole } from '@eventra/shared';
import { devFallbackStore, isPrismaConnectionError } from '../../config/dev-fallback-store';

export class OrganizersService {
  async getDashboard(organizerId: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getOrganizerDashboard(organizerId);
    }
    try {
      const events = await prisma.event.findMany({
        where: { organizerId },
        include: {
          ticketTypes: true,
          bookings: {
            where: { status: BookingStatus.CONFIRMED },
            include: {
              user: { select: { id: true, name: true, email: true } },
              tickets: { select: { id: true, status: true, checkedInAt: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalEvents = events.length;
      const publishedEvents = events.filter((e) => e.status === EventStatus.PUBLISHED).length;
      const pendingEvents = events.filter((e) => e.status === EventStatus.PENDING_APPROVAL).length;

      let totalSoldTickets = 0;
      let grossRevenue = 0;
      let totalCheckedIn = 0;

      const eventPerformance = events.map((e) => {
        const confirmedBookings = e.bookings;
        const eventRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
        const eventSoldTickets = e.ticketTypes.reduce((sum, tt) => sum + tt.soldQuantity, 0);

        const eventCheckedIn = confirmedBookings.flatMap((b) => b.tickets).filter((t) => t.status === TicketStatus.CHECKED_IN).length;

        totalSoldTickets += eventSoldTickets;
        grossRevenue += eventRevenue;
        totalCheckedIn += eventCheckedIn;

        return {
          id: e.id,
          title: e.title,
          status: e.status,
          revenue: eventRevenue,
          soldTickets: eventSoldTickets,
          capacity: e.capacity,
          checkedIn: eventCheckedIn,
          startDate: e.startDate.toISOString(),
        };
      });

      // Recent 10 bookings across organizer's events
      const recentBookings = await prisma.booking.findMany({
        where: {
          event: { organizerId },
          status: BookingStatus.CONFIRMED,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          event: { select: { id: true, title: true } },
          user: { select: { name: true, email: true } },
          tickets: { select: { id: true, ticketNumber: true, status: true } },
        },
      });

      return {
        summary: {
          totalEvents,
          publishedEvents,
          pendingEvents,
          totalSoldTickets,
          grossRevenue,
          totalCheckedIn,
          checkInRatePercentage: totalSoldTickets > 0 ? Math.round((totalCheckedIn / totalSoldTickets) * 100) : 0,
        },
        eventPerformance,
        recentBookings: recentBookings.map((b) => ({
          id: b.id,
          bookingReference: b.bookingReference,
          eventName: b.event.title,
          attendeeName: b.user.name,
          attendeeEmail: b.user.email,
          ticketsCount: b.tickets.length,
          totalAmount: Number(b.totalAmount),
          createdAt: b.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getOrganizerDashboard(organizerId);
      }
      throw error;
    }
  }

  async getMyEvents(organizerId: string, status?: EventStatus) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getMyEvents(organizerId, status);
    }
    try {
      const where: any = { organizerId };
      if (status) {
        where.status = status;
      }

      const events = await prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          ticketTypes: true,
          _count: {
            select: { bookings: true },
          },
        },
      });

      return events.map((e) => ({
        ...e,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      }));
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getMyEvents(organizerId, status);
      }
      throw error;
    }
  }

  async getEventAttendees(eventId: string, organizerId: string, userRole: UserRole) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getEventAttendees(eventId, organizerId, userRole);
    }
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw AppError.notFound('Event not found');
      }

      if (event.organizerId !== organizerId && userRole !== UserRole.ADMIN) {
        throw AppError.forbidden('You are not authorized to view attendees for this event');
      }

      const tickets = await prisma.ticket.findMany({
        where: {
          booking: {
            eventId,
            status: BookingStatus.CONFIRMED,
          },
        },
        include: {
          ticketType: true,
          booking: {
            select: {
              id: true,
              bookingReference: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        event: {
          id: event.id,
          title: event.title,
          startDate: event.startDate.toISOString(),
        },
        totalAttendees: tickets.length,
        checkedInCount: tickets.filter((t) => t.status === TicketStatus.CHECKED_IN).length,
        attendees: tickets.map((t) => ({
          ticketId: t.id,
          ticketNumber: t.ticketNumber,
          ticketToken: t.ticketToken,
          ticketTypeName: t.ticketType.name,
          attendeeName: t.attendeeName,
          attendeeEmail: t.attendeeEmail,
          status: t.status,
          checkedInAt: t.checkedInAt?.toISOString() || null,
          bookingReference: t.booking.bookingReference,
          issuedAt: t.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getEventAttendees(eventId, organizerId, userRole);
      }
      throw error;
    }
  }
}

export const organizersService = new OrganizersService();
