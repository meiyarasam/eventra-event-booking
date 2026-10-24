import { Request, Response, NextFunction } from 'express';
import { organizersService } from './organizers.service';
import { AppError } from '../../utils/app-error';

export class OrganizersController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const data = await organizersService.getDashboard(req.user.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyEvents(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const status = req.query.status as any;
      const events = await organizersService.getMyEvents(req.user.id, status);
      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventAttendees(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const attendees = await organizersService.getEventAttendees(
        req.params.id,
        req.user.id,
        req.user.role
      );
      res.status(200).json({
        success: true,
        data: attendees,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const organizersController = new OrganizersController();
