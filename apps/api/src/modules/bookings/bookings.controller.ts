import { Request, Response, NextFunction } from 'express';
import { bookingsService } from './bookings.service';
import { AppError } from '../../utils/app-error';

export class BookingsController {
  async createReservation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const reservation = await bookingsService.createReservation(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Tickets reserved for 10 minutes. Please complete payment before expiration.',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReservationById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const reservation = await bookingsService.getReservationById(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await bookingsService.processPaymentAndConfirm(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Payment simulated successfully. Booking confirmed!',
        data: result.booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const bookings = await bookingsService.getMyBookings(req.user.id);
      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const booking = await bookingsService.getBookingById(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await bookingsService.cancelBooking(req.params.id, req.user.id, req.body?.reason);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async resendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await bookingsService.resendBookingEmail(req.params.id, req.user.id, req.user.role);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingsController = new BookingsController();
