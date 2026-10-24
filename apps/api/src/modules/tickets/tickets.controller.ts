import { Request, Response, NextFunction } from 'express';
import { ticketsService } from './tickets.service';
import { AppError } from '../../utils/app-error';

export class TicketsController {
  async getMyTickets(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const tickets = await ticketsService.getMyTickets(req.user.id);
      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const ticket = await ticketsService.getTicketById(req.params.id, req.user.id, req.user.role);
      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  async validateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const token = req.body?.ticketToken || req.query?.ticketToken as string;
      if (!token) throw AppError.badRequest('Ticket token is required');

      const result = await ticketsService.validateTicket(token, req.user.id, req.user.role);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkInTicket(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const token = req.body?.ticketToken;
      if (!token) throw AppError.badRequest('Ticket token or reference is required');

      const result = await ticketsService.checkInTicket(token, req.user.id, req.user.role);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.ticket,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ticketsController = new TicketsController();
