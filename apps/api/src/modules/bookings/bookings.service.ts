import { prisma, isDatabaseConnected } from '../../config/database';
import { AppError } from '../../utils/app-error';
import {
  CreateReservationInput,
  ProcessPaymentInput,
  ReservationStatus,
  BookingStatus,
  TicketStatus,
  PaymentStatus,
  EventStatus,
  UserRole,
} from '@eventra/shared';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { devFallbackStore, isPrismaConnectionError } from '../../config/dev-fallback-store';
import { emailService } from '../../services/email.service';

export class BookingsService {
  private generateReference(prefix: string): string {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${Date.now().toString().slice(-4)}${randomHex}`;
  }

  // Active reservation duration: 10 minutes
  private readonly RESERVATION_TTL_MS = 10 * 60 * 1000;

  async createReservation(userId: string, input: CreateReservationInput) {
    if (!isDatabaseConnected) {
      return devFallbackStore.createReservation(userId, input);
    }
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.RESERVATION_TTL_MS);

      // Interactive Transaction for concurrency safety
      const reservation = await prisma.$transaction(async (tx) => {
      // 1. Validate event eligibility
      const event = await tx.event.findUnique({
        where: { id: input.eventId },
      });

      if (!event) {
        throw AppError.notFound('Event not found');
      }

      if (event.status !== EventStatus.PUBLISHED) {
        throw AppError.badRequest('This event is not currently open for bookings.');
      }

      if (new Date(event.startDate) <= now) {
        throw AppError.badRequest('This event has already started or ended.');
      }

      // 2. Clean up expired reservations for this event to release locked capacity
      await tx.inventoryReservation.updateMany({
        where: {
          eventId: input.eventId,
          status: ReservationStatus.ACTIVE,
          expiresAt: { lte: now },
        },
        data: {
          status: ReservationStatus.EXPIRED,
        },
      });

      // 3. For each requested ticket type, lock and verify availability
      let totalAmount = 0;
      const reservationItemsData: {
        ticketTypeId: string;
        ticketTypeName: string;
        price: number;
        quantity: number;
        subtotal: number;
      }[] = [];

      for (const item of input.items) {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: item.ticketTypeId },
        });

        if (!ticketType || ticketType.eventId !== event.id) {
          throw AppError.badRequest(`Invalid ticket type: ${item.ticketTypeId}`);
        }

        const maxLimit = Math.max(ticketType.maxPerUser || 10, 10);
        if (item.quantity > maxLimit) {
          throw AppError.badRequest(
            `You can select at most ${maxLimit} tickets for ${ticketType.name}.`
          );
        }

        // Calculate active held reservations
        const activeReservationsCount = await tx.reservationItem.aggregate({
          where: {
            ticketTypeId: ticketType.id,
            reservation: {
              status: ReservationStatus.ACTIVE,
              expiresAt: { gt: now },
            },
          },
          _sum: { quantity: true },
        });

        const activeHeld = activeReservationsCount._sum.quantity || 0;
        const available = ticketType.totalQuantity - ticketType.soldQuantity - activeHeld;

        if (available < item.quantity) {
          throw AppError.conflict(
            `Only ${Math.max(0, available)} ticket(s) remaining for '${ticketType.name}'. Cannot reserve ${item.quantity}.`
          );
        }

        const price = Number(ticketType.price);
        const subtotal = price * item.quantity;
        totalAmount += subtotal;

        reservationItemsData.push({
          ticketTypeId: ticketType.id,
          ticketTypeName: ticketType.name,
          price,
          quantity: item.quantity,
          subtotal,
        });
      }

      // 4. Create the reservation record
      const createdReservation = await tx.inventoryReservation.create({
        data: {
          eventId: event.id,
          userId,
          expiresAt,
          status: ReservationStatus.ACTIVE,
          items: {
            create: reservationItemsData.map((item) => ({
              ticketTypeId: item.ticketTypeId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: { ticketType: true },
          },
        },
      });

      return {
        id: createdReservation.id,
        eventId: event.id,
        userId,
        expiresAt: createdReservation.expiresAt.toISOString(),
        status: createdReservation.status,
        items: reservationItemsData,
        totalAmount,
      };
    });

      return reservation;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.createReservation(userId, input);
      }
      throw error;
    }
  }

  async getReservationById(reservationId: string, userId: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getReservationById(reservationId, userId);
    }
    try {
      const reservation = await prisma.inventoryReservation.findUnique({
      where: { id: reservationId },
      include: {
        event: {
          include: { category: true },
        },
        items: {
          include: { ticketType: true },
        },
        booking: true,
      },
    });

    if (!reservation) {
      throw AppError.notFound('Reservation not found');
    }

    if (reservation.userId !== userId) {
      throw AppError.forbidden('Unauthorized access to reservation');
    }

    const now = new Date();
    const isExpired = reservation.status === ReservationStatus.ACTIVE && new Date(reservation.expiresAt) <= now;

    if (isExpired && reservation.status === ReservationStatus.ACTIVE) {
      await prisma.inventoryReservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.EXPIRED },
      });
      reservation.status = ReservationStatus.EXPIRED;
    }

    const totalAmount = reservation.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

      return {
        id: reservation.id,
        eventId: reservation.eventId,
        userId: reservation.userId,
        expiresAt: reservation.expiresAt.toISOString(),
        status: reservation.status,
        event: reservation.event,
        items: reservation.items.map((i) => ({
          ticketTypeId: i.ticketTypeId,
          ticketTypeName: i.ticketType.name,
          price: Number(i.price),
          quantity: i.quantity,
          subtotal: Number(i.price) * i.quantity,
        })),
        totalAmount,
        booking: reservation.booking,
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getReservationById(reservationId, userId);
      }
      throw error;
    }
  }

  async processPaymentAndConfirm(userId: string, input: ProcessPaymentInput) {
    if (!isDatabaseConnected) {
      return devFallbackStore.processPaymentAndConfirm(userId, input);
    }
    try {
      const now = new Date();
      const transactionReference = this.generateReference('TXN');

      const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch and validate reservation
      const reservation = await tx.inventoryReservation.findUnique({
        where: { id: input.reservationId },
        include: {
          event: true,
          items: { include: { ticketType: true } },
          user: true,
        },
      });

      if (!reservation) {
        throw AppError.notFound('Reservation not found');
      }

      if (reservation.userId !== userId) {
        throw AppError.forbidden('Unauthorized payment attempt');
      }

      if (reservation.status === ReservationStatus.CONFIRMED) {
        throw AppError.badRequest('This reservation has already been paid and confirmed.');
      }

      if (reservation.status !== ReservationStatus.ACTIVE || new Date(reservation.expiresAt) <= now) {
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: ReservationStatus.EXPIRED },
        });
        throw AppError.gone('Your ticket reservation has expired. Please select tickets again.');
      }

      // Calculate total amount on server
      const totalAmount = reservation.items.reduce(
        (acc, item) => acc + Number(item.price) * item.quantity,
        0
      );

      // Check if simulated payment should fail
      if (!input.simulateSuccess) {
        await tx.paymentSimulation.create({
          data: {
            bookingId: reservation.id, // temporary reference
            userId,
            amount: totalAmount,
            paymentMethod: input.paymentMethod,
            status: PaymentStatus.FAILED,
            transactionReference,
            failureReason: 'Simulated payment was declined by test bank.',
            cardLast4: input.paymentDetails?.cardLast4 || '4000',
            cardHolder: input.paymentDetails?.cardHolder || 'Cardholder',
            upiId: input.paymentDetails?.upiId || 'test@upi',
          },
        });
        throw AppError.badRequest('Payment simulation failed: The simulated transaction was declined.');
      }

      // 2. Mark reservation as CONFIRMED
      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.CONFIRMED },
      });

      // 3. Create Booking record
      const bookingReference = this.generateReference('BKG');
      const booking = await tx.booking.create({
        data: {
          bookingReference,
          userId,
          eventId: reservation.eventId,
          reservationId: reservation.id,
          totalAmount,
          status: BookingStatus.CONFIRMED,
          items: {
            create: reservation.items.map((item) => ({
              ticketTypeId: item.ticketTypeId,
              quantity: item.quantity,
              unitPrice: item.price,
              subtotal: Number(item.price) * item.quantity,
            })),
          },
        },
      });

      // 4. Update soldQuantity on TicketTypes and generate unique tickets
      const issuedTickets: any[] = [];

      for (const item of reservation.items) {
        // Increment sold count atomically
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            soldQuantity: {
              increment: item.quantity,
            },
          },
        });

        // Create individual ticket records per seat
        for (let i = 0; i < item.quantity; i++) {
          const ticketNumber = this.generateReference('TKT');
          const ticketToken = crypto.randomUUID(); // Opaque, unguessable token for QR verification

          const ticket = await tx.ticket.create({
            data: {
              ticketNumber,
              ticketToken,
              bookingId: booking.id,
              ticketTypeId: item.ticketTypeId,
              attendeeName: reservation.user.name,
              attendeeEmail: reservation.user.email,
              status: TicketStatus.VALID,
            },
            include: {
              ticketType: true,
            },
          });

          issuedTickets.push(ticket);
        }
      }

      // 5. Create PaymentSimulation record
      await tx.paymentSimulation.create({
        data: {
          bookingId: booking.id,
          userId,
          amount: totalAmount,
          currency: 'INR',
          paymentMethod: input.paymentMethod,
          status: PaymentStatus.SUCCESS,
          transactionReference,
          cardLast4: input.paymentDetails?.cardLast4 || '4242',
          cardHolder: input.paymentDetails?.cardHolder || reservation.user.name,
          upiId: input.paymentDetails?.upiId,
        },
      });

      // 6. Create in-app notification for attendee
      await tx.notification.create({
        data: {
          userId,
          title: 'Booking Confirmed!',
          message: `Your booking for "${reservation.event.title}" is confirmed. Booking ref: ${booking.bookingReference}`,
          type: 'BOOKING_CONFIRMED',
          link: `/bookings/${booking.id}`,
        },
      });

      return {
        booking,
        tickets: issuedTickets,
        event: reservation.event,
      };
    });

    // Generate QR codes for each ticket
    const ticketsWithQR = await Promise.all(
      result.tickets.map(async (t) => {
        // QR code embeds the opaque ticket token
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
          eventName: result.event.title,
          eventBannerUrl: result.event.bannerUrl,
          eventStartDate: result.event.startDate.toISOString(),
          venueName: result.event.venueName,
          city: result.event.city,
          isOnline: result.event.isOnline,
          qrCodeUrl,
          createdAt: t.createdAt.toISOString(),
        };
      })
    );

      // Safely dispatch digital tickets via email (non-blocking)
      const attendeeEmail = ticketsWithQR[0]?.attendeeEmail || 'attendee@eventra.com';
      emailService.sendTicketConfirmationEmail(attendeeEmail, {
        bookingReference: result.booking.bookingReference,
        eventTitle: result.event.title,
        eventDate: new Date(result.event.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        eventTime: new Date(result.event.startDate).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        venueName: result.event.venueName || undefined,
        city: result.event.city || undefined,
        isOnline: result.event.isOnline,
        totalAmount: Number(result.booking.totalAmount),
        tickets: ticketsWithQR.map((t) => ({
          ticketNumber: t.ticketNumber,
          ticketToken: t.ticketToken,
          ticketTypeName: t.ticketTypeName,
          attendeeName: t.attendeeName,
          price: t.price,
          qrCodeDataUrl: t.qrCodeUrl,
        })),
      }).catch((err) => {
        console.warn('⚠️ Non-fatal: Failed to send ticket confirmation email:', err.message);
      });

      return {
        booking: {
          id: result.booking.id,
          bookingReference: result.booking.bookingReference,
          userId: result.booking.userId,
          eventId: result.booking.eventId,
          totalAmount: Number(result.booking.totalAmount),
          status: result.booking.status,
          createdAt: result.booking.createdAt.toISOString(),
          event: result.event,
          tickets: ticketsWithQR,
        },
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.processPaymentAndConfirm(userId, input);
      }
      throw error;
    }
  }

  async getMyBookings(userId: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getMyBookings(userId);
    }
    try {
      const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: { category: true },
        },
        items: {
          include: { ticketType: true },
        },
        tickets: {
          include: { ticketType: true },
        },
        payments: true,
      },
    });

    return Promise.all(
      bookings.map(async (b) => {
        const ticketsWithQR = await Promise.all(
          b.tickets.map(async (t) => {
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
              eventName: b.event.title,
              eventBannerUrl: b.event.bannerUrl,
              eventStartDate: b.event.startDate.toISOString(),
              venueName: b.event.venueName,
              city: b.event.city,
              isOnline: b.event.isOnline,
              qrCodeUrl,
              checkedInAt: t.checkedInAt?.toISOString() || null,
              createdAt: t.createdAt.toISOString(),
            };
          })
        );

        return {
          id: b.id,
          bookingReference: b.bookingReference,
          userId: b.userId,
          eventId: b.eventId,
          totalAmount: Number(b.totalAmount),
          status: b.status,
          cancelledAt: b.cancelledAt?.toISOString() || null,
          cancellationReason: b.cancellationReason,
          createdAt: b.createdAt.toISOString(),
          event: b.event,
          tickets: ticketsWithQR,
          payment: b.payments[0]
            ? {
                id: b.payments[0].id,
                paymentMethod: b.payments[0].paymentMethod,
                status: b.payments[0].status,
                transactionReference: b.payments[0].transactionReference,
                createdAt: b.payments[0].createdAt.toISOString(),
              }
            : null,
        };
      })
    );
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return devFallbackStore.getMyBookings(userId);
    }
    throw error;
  }
}

  async getBookingById(bookingId: string, userId: string, userRole?: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.getBookingById(bookingId, userId);
    }
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
        event: {
          include: { category: true, organizer: { select: { id: true, name: true, email: true } } },
        },
        items: {
          include: { ticketType: true },
        },
        tickets: {
          include: { ticketType: true },
        },
        payments: true,
      },
    });

    if (!booking) {
      throw AppError.notFound('Booking not found');
    }

    if (booking.userId !== userId && userRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You are not authorized to view this booking');
    }

    const ticketsWithQR = await Promise.all(
      booking.tickets.map(async (t) => {
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
          seatNumber: (t as any).seatNumber || null,
          status: t.status,
          attendeeName: t.attendeeName,
          attendeeEmail: t.attendeeEmail,
          eventName: booking.event.title,
          eventBannerUrl: booking.event.bannerUrl,
          eventStartDate: booking.event.startDate.toISOString(),
          venueName: booking.event.venueName,
          city: booking.event.city,
          isOnline: booking.event.isOnline,
          qrCodeUrl,
          checkedInAt: t.checkedInAt?.toISOString() || null,
          createdAt: t.createdAt.toISOString(),
        };
      })
    );

    return {
      id: booking.id,
      bookingReference: booking.bookingReference,
      userId: booking.userId,
      eventId: booking.eventId,
      totalAmount: Number(booking.totalAmount),
      status: booking.status,
      cancelledAt: booking.cancelledAt?.toISOString() || null,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt.toISOString(),
      event: booking.event,
      tickets: ticketsWithQR,
      payment: booking.payments[0]
        ? {
            id: booking.payments[0].id,
            paymentMethod: booking.payments[0].paymentMethod,
            status: booking.payments[0].status,
            transactionReference: booking.payments[0].transactionReference,
            createdAt: booking.payments[0].createdAt.toISOString(),
          }
        : null,
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.getBookingById(bookingId, userId);
      }
      throw error;
    }
  }

  async cancelBooking(bookingId: string, userId: string, reason?: string) {
    if (!isDatabaseConnected) {
      return devFallbackStore.cancelBooking(bookingId, userId, reason);
    }
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          event: true,
          items: true,
          tickets: true,
        },
      });

      if (!booking) {
        throw AppError.notFound('Booking not found');
      }

      if (booking.userId !== userId) {
        throw AppError.forbidden('You are not authorized to cancel this booking');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        return { message: 'Booking has already been cancelled', booking };
      }

      if (booking.status !== BookingStatus.CONFIRMED) {
        throw AppError.badRequest(`Booking in status '${booking.status}' cannot be cancelled`);
      }

      // Cancellation Policy Check: Must be cancelled at least 48 hours before event start
      const now = new Date();
      const eventStart = new Date(booking.event.startDate);
      const hoursDifference = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < 48) {
        throw AppError.badRequest(
          'Cancellation is not permitted within 48 hours of the event start time as per event policy.'
        );
      }

      // Check if any ticket is already checked in
      const anyCheckedIn = booking.tickets.some((t) => t.status === TicketStatus.CHECKED_IN);
      if (anyCheckedIn) {
        throw AppError.badRequest('Cannot cancel a booking where tickets have already been checked in.');
      }

      // Transactionally cancel booking and release sold quantity
      const updated = await prisma.$transaction(async (tx) => {
        // 1. Mark booking CANCELLED
        const cancelledBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.CANCELLED,
            cancelledAt: now,
            cancellationReason: reason || 'Cancelled by attendee.',
          },
        });

        // 2. Mark tickets CANCELLED
        await tx.ticket.updateMany({
          where: { bookingId },
          data: { status: TicketStatus.CANCELLED },
        });

        // 3. Decrement sold quantities on ticket types to return capacity to pool
        for (const item of booking.items) {
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: {
              soldQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        // 4. Create notification
        await tx.notification.create({
          data: {
            userId,
            title: 'Booking Cancelled',
            message: `Your booking (${booking.bookingReference}) for "${booking.event.title}" has been cancelled.`,
            type: 'BOOKING_CANCELLED',
            link: `/bookings/${booking.id}`,
          },
        });

        return cancelledBooking;
      });

      return {
        message: 'Booking cancelled successfully. Inventory has been released.',
        booking: updated,
      };
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return devFallbackStore.cancelBooking(bookingId, userId, reason);
      }
      throw error;
    }
  }

  async resendBookingEmail(bookingId: string, userId: string, userRole?: string) {
    const bookingData: any = await this.getBookingById(bookingId, userId, userRole);
    if (!bookingData) {
      throw AppError.notFound('Booking not found');
    }
    if (bookingData.status !== BookingStatus.CONFIRMED) {
      throw AppError.badRequest('Ticket confirmation emails can only be sent for confirmed bookings.');
    }

    const eventTitle = bookingData.event?.title || 'EVENTRA Platform Event';
    const eventStartDate = bookingData.event?.startDate ? new Date(bookingData.event.startDate) : new Date();

    const attendeeEmail = bookingData.tickets?.[0]?.attendeeEmail || 'attendee@eventra.com';
    await emailService.sendTicketConfirmationEmail(attendeeEmail, {
      bookingReference: bookingData.bookingReference,
      eventTitle,
      eventDate: eventStartDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      eventTime: eventStartDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      venueName: bookingData.event?.venueName || undefined,
      city: bookingData.event?.city || undefined,
      isOnline: Boolean(bookingData.event?.isOnline),
      totalAmount: Number(bookingData.totalAmount),
      tickets: (bookingData.tickets || []).map((t: any) => ({
        ticketNumber: t.ticketNumber,
        ticketToken: t.ticketToken,
        ticketTypeName: t.ticketTypeName,
        attendeeName: t.attendeeName,
        price: t.price,
        qrCodeDataUrl: t.qrCodeUrl,
      })),
    });

    return {
      success: true,
      message: `Digital ticket confirmation email sent successfully to ${attendeeEmail}.`,
    };
  }
}

export const bookingsService = new BookingsService();
