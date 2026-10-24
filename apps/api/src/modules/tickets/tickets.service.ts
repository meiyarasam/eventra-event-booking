import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { TicketStatus, UserRole } from '@eventra/shared';
import QRCode from 'qrcode';
import { devFallbackStore, isPrismaConnectionError } from '../../config/dev-fallback-store';

export class TicketsService {
  async getMyTickets(userId: string) {
    try {
      const tickets = await prisma.ticket.findMany({
        where: {
          booking: { userId },
        },
        include: {
          ticketType: true,
          booking: {
            include: {
              event: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return Promise.all(
        tickets.map(async (t) => {
          const qrPayload = JSON.stringify({
            ticketToken: t.ticketToken,
            ticketNumber: t.ticketNumber,
          });
          const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 300,
          });

          return {
            id: t.id,
            ticketNumber: t.ticketNumber,
            ticketToken: t.ticketToken,
            bookingId: t.bookingId,
            ticketTypeId: t.ticketTypeId,
            ticketTypeName: t.ticketType.name,
            price: Number(t.ticketType.price),
            status: t.status,
            attendeeName: t.attendeeName,
            attendeeEmail: t.attendeeEmail,
            eventName: t.booking.event.title,
            eventBannerUrl: t.booking.event.bannerUrl,
            eventStartDate: t.booking.event.startDate.toISOString(),
            venueName: t.booking.event.venueName,
            city: t.booking.event.city,
            isOnline: t.booking.event.isOnline,
            qrCodeUrl,
            checkedInAt: t.checkedInAt?.toISOString() || null,
            createdAt: t.createdAt.toISOString(),
          };
        })
      );
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getMyTickets(userId);
      }
      throw error;
    }
  }

  async getTicketById(ticketId: string, userId: string, userRole: UserRole) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          ticketType: true,
          booking: {
            include: {
              event: true,
            },
          },
        },
      });

      if (!ticket) {
        throw AppError.notFound('Ticket not found');
      }

      const isOwner = ticket.booking.userId === userId;
      const isOrganizer = ticket.booking.event.organizerId === userId;
      const isAdmin = userRole === UserRole.ADMIN;

      if (!isOwner && !isOrganizer && !isAdmin) {
        throw AppError.forbidden('You are not authorized to view this ticket');
      }

      const qrPayload = JSON.stringify({
        ticketToken: ticket.ticketToken,
        ticketNumber: ticket.ticketNumber,
      });
      const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
      });

      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        ticketToken: ticket.ticketToken,
        bookingId: ticket.bookingId,
        ticketTypeId: ticket.ticketTypeId,
        ticketTypeName: ticket.ticketType.name,
        price: Number(ticket.ticketType.price),
        status: ticket.status,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        eventName: ticket.booking.event.title,
        eventBannerUrl: ticket.booking.event.bannerUrl,
        eventStartDate: ticket.booking.event.startDate.toISOString(),
        venueName: ticket.booking.event.venueName,
        city: ticket.booking.event.city,
        isOnline: ticket.booking.event.isOnline,
        qrCodeUrl,
        checkedInAt: ticket.checkedInAt?.toISOString() || null,
        createdAt: ticket.createdAt.toISOString(),
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getTicketById(ticketId, userId, userRole);
      }
      throw error;
    }
  }

  // Parse token string from raw scan or manual entry
  private parseTicketToken(rawInput: string): string {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.ticketToken) return parsed.ticketToken;
      } catch {
        // Fallback to literal string
      }
    }
    return trimmed;
  }

  async validateTicket(tokenOrNumber: string, organizerId: string, userRole: UserRole) {
    try {
      const token = this.parseTicketToken(tokenOrNumber);

      const ticket = await prisma.ticket.findFirst({
        where: {
          OR: [{ ticketToken: token }, { ticketNumber: token }],
        },
        include: {
          ticketType: true,
          booking: {
            include: {
              event: true,
            },
          },
        },
      });

      if (!ticket) {
        throw AppError.notFound('Invalid ticket: No matching ticket found');
      }

      if (ticket.booking.event.organizerId !== organizerId && userRole !== UserRole.ADMIN) {
        throw AppError.forbidden('Access denied: You are not authorized to validate tickets for this event.');
      }

      return {
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          attendeeName: ticket.attendeeName,
          attendeeEmail: ticket.attendeeEmail,
          ticketTypeName: ticket.ticketType.name,
          status: ticket.status,
          checkedInAt: ticket.checkedInAt?.toISOString() || null,
          eventName: ticket.booking.event.title,
        },
        isValid: ticket.status === TicketStatus.VALID,
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.validateTicket(tokenOrNumber);
      }
      throw error;
    }
  }

  async checkInTicket(tokenOrNumber: string, organizerId: string, userRole: UserRole) {
    try {
      const token = this.parseTicketToken(tokenOrNumber);

      const result = await prisma.$transaction(async (tx) => {
        const ticket = await tx.ticket.findFirst({
          where: {
            OR: [{ ticketToken: token }, { ticketNumber: token }],
          },
          include: {
            ticketType: true,
            booking: {
              include: {
                event: true,
              },
            },
          },
        });

        if (!ticket) {
          throw AppError.notFound('Invalid ticket token or reference.');
        }

        if (ticket.booking.event.organizerId !== organizerId && userRole !== UserRole.ADMIN) {
          throw AppError.forbidden('You are not authorized to check in attendees for this event.');
        }

        if (ticket.status === TicketStatus.CHECKED_IN) {
          throw AppError.conflict(
            `Ticket has already been checked in at ${ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString() : 'an earlier time'}. Duplicate check-ins are rejected.`
          );
        }

        if (ticket.status === TicketStatus.CANCELLED) {
          throw AppError.badRequest('This ticket has been CANCELLED and is not valid for entry.');
        }

        if (ticket.status === TicketStatus.EXPIRED) {
          throw AppError.badRequest('This ticket has EXPIRED and is not valid for entry.');
        }

        const now = new Date();
        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status: TicketStatus.CHECKED_IN,
            checkedInAt: now,
            checkedInById: organizerId,
          },
          include: {
            ticketType: true,
            booking: {
              include: { event: true },
            },
          },
        });

        return updatedTicket;
      });

      return {
        message: 'Check-in successful! Ticket validated.',
        ticket: {
          id: result.id,
          ticketNumber: result.ticketNumber,
          attendeeName: result.attendeeName,
          attendeeEmail: result.attendeeEmail,
          ticketTypeName: result.ticketType.name,
          status: result.status,
          checkedInAt: result.checkedInAt?.toISOString(),
          eventName: result.booking.event.title,
        },
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.checkInTicket(tokenOrNumber);
      }
      throw error;
    }
  }
}

export const ticketsService = new TicketsService();
