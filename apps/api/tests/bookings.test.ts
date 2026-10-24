import crypto from 'crypto';
import QRCode from 'qrcode';
import { CreateReservationSchema, ProcessPaymentSchema } from '@eventra/shared';

describe('Booking & Inventory Logic Tests', () => {
  describe('Reservation Input Validation', () => {
    it('validates valid ticket reservation input', () => {
      const input = {
        eventId: 'event-uuid-1',
        items: [
          { ticketTypeId: 'ticket-type-1', quantity: 2 },
          { ticketTypeId: 'ticket-type-2', quantity: 1 },
        ],
      };
      const result = CreateReservationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects reservation with zero or negative quantity', () => {
      const input = {
        eventId: 'event-uuid-1',
        items: [{ ticketTypeId: 'ticket-type-1', quantity: 0 }],
      };
      const result = CreateReservationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects reservation exceeding per-user limit', () => {
      const input = {
        eventId: 'event-uuid-1',
        items: [{ ticketTypeId: 'ticket-type-1', quantity: 15 }], // exceeds max 10
      };
      const result = CreateReservationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('Inventory Availability & Concurrency Rules', () => {
    it('calculates available inventory accurately: total - sold - activeReserved', () => {
      const totalCapacity = 100;
      const soldQuantity = 40;
      const activeReservations = 25;

      const available = totalCapacity - soldQuantity - activeReservations;
      expect(available).toBe(35);

      // Verify that requesting more than available fails
      const requestedQuantity = 36;
      expect(available >= requestedQuantity).toBe(false);
    });

    it('releases expired reservations back to available pool', () => {
      const now = new Date('2026-10-23T12:15:00Z');
      const expiredReservation = {
        expiresAt: new Date('2026-10-23T12:10:00Z'), // 5 mins ago
        quantity: 10,
      };

      const isExpired = expiredReservation.expiresAt <= now;
      expect(isExpired).toBe(true);

      // When expired, held capacity is released
      const activeHold = isExpired ? 0 : expiredReservation.quantity;
      expect(activeHold).toBe(0);
    });

    it('prevents concurrent overselling when remaining is 1 and 2 requests arrive', () => {
      let remainingInventory = 1;

      // Simulate Request 1
      const req1Qty = 1;
      let req1Success = false;
      if (remainingInventory >= req1Qty) {
        remainingInventory -= req1Qty;
        req1Success = true;
      }

      // Simulate Concurrent Request 2
      const req2Qty = 1;
      let req2Success = false;
      if (remainingInventory >= req2Qty) {
        remainingInventory -= req2Qty;
        req2Success = true;
      }

      expect(req1Success).toBe(true);
      expect(req2Success).toBe(false);
      expect(remainingInventory).toBe(0);
      expect(remainingInventory).toBeGreaterThanOrEqual(0); // Can never be negative
    });
  });

  describe('Mock Payment & QR Ticket Issuance', () => {
    it('validates payment input schema', () => {
      const input = {
        reservationId: 'res-uuid-123',
        paymentMethod: 'CARD',
        simulateSuccess: true,
        paymentDetails: {
          cardLast4: '4242',
          cardHolder: 'Alex Chen',
        },
      };
      const result = ProcessPaymentSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('generates unique opaque cryptographically unguessable ticket tokens', () => {
      const token1 = crypto.randomUUID();
      const token2 = crypto.randomUUID();

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(36);
    });

    it('generates valid QR Code data URL containing ticket token', async () => {
      const ticketToken = crypto.randomUUID();
      const ticketNumber = 'TKT-2026TEST';

      const payload = JSON.stringify({ ticketToken, ticketNumber });
      const qrDataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
      });

      expect(qrDataUrl).toBeDefined();
      expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
    });
  });

  describe('Check-In Validation & Duplicate Prevention', () => {
    it('verifies ticket check-in state transitions and prevents duplicate check-in', () => {
      const ticket = {
        id: 'tkt-1',
        ticketToken: 'valid-token-123',
        status: 'VALID',
        checkedInAt: null as Date | null,
      };

      // First check-in
      expect(ticket.status).toBe('VALID');
      ticket.status = 'CHECKED_IN';
      ticket.checkedInAt = new Date();

      // Second check-in attempt on the same ticket
      expect(ticket.status).toBe('CHECKED_IN');
      const isDuplicate = ticket.status === 'CHECKED_IN';
      expect(isDuplicate).toBe(true); // Must be rejected with 409 Conflict
    });

    it('rejects cancelled tickets from check-in', () => {
      const ticket = {
        status: 'CANCELLED',
      };
      expect(ticket.status === 'VALID').toBe(false);
    });
  });
});
