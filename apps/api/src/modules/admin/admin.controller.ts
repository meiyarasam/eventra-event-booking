import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { AppError } from '../../utils/app-error';

export class AdminController {
  async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await adminService.getOverview();
      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingEvents(_req: Request, res: Response, next: NextFunction) {
    try {
      const events = await adminService.getPendingEvents();
      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  async reviewEvent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { status, rejectionReason } = req.body;
      const updated = await adminService.reviewEvent(req.params.id, req.user.id, status, rejectionReason);
      res.status(200).json({
        success: true,
        message: `Event has been ${status.toLowerCase()} successfully.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const options = {
        search: req.query.search as string,
        category: req.query.category as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };
      const result = await adminService.getAllEvents(options);
      res.status(200).json({
        success: true,
        data: result.events,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await adminService.getEventById(req.params.id);
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const event = await adminService.createEvent(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Event created successfully by Admin.',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await adminService.updateEvent(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Event updated successfully.',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEventStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, reason } = req.body;
      const updated = await adminService.updateEventStatus(req.params.id, status, reason);
      res.status(200).json({
        success: true,
        message: `Event status updated to ${status}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteEvent(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
        bookingsAffected: result.bookingsAffected,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrganizerRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as any;
      const requests = await adminService.getOrganizerRequests(status);
      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async reviewOrganizerRequest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { status, rejectionReason } = req.body;
      const result = await adminService.reviewOrganizerRequest(
        req.params.id,
        req.user.id,
        status,
        rejectionReason
      );
      res.status(200).json({
        success: true,
        message: `Organizer request ${status.toLowerCase()} successfully.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const role = req.query.role as any;
      const status = req.query.status as any;

      const result = await adminService.getUsers(page, limit, search, role, status);
      res.status(200).json({
        success: true,
        data: result.users,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminService.getUserDetails(req.params.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const action = (req.query.action || req.body?.action) as any;
      const result = await adminService.deleteUser(req.params.id, req.user.id, { action });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { status, reason } = req.body;
      const user = await adminService.updateUserStatus(req.params.id, req.user.id, status, reason);
      res.status(200).json({
        success: true,
        message: `User account status updated to ${status}.`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const result = await adminService.getAllBookings({ page, limit, search, status });
      res.status(200).json({
        success: true,
        data: result.bookings,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async broadcastNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, message, targetRole } = req.body;
      if (!title || !message) {
        throw AppError.badRequest('Both title and message are required for announcement broadcast.');
      }
      const result = await adminService.broadcastNotification({ title, message, targetRole });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await adminService.getAdminNotifications(page, limit);
      res.status(200).json({
        success: true,
        data: result.notifications,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
