import { Request, Response, NextFunction } from 'express';
import { eventsService } from './events.service';
import { AppError } from '../../utils/app-error';

export class EventsController {
  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      // FIX BUG-012: Sanitize search param — cap length at 200 chars and strip whitespace-only input.
      const rawSearch = (req.query.search as string | undefined) || '';
      const search = rawSearch.trim().slice(0, 200) || undefined;

      const options = {
        search,
        category: req.query.category as string,
        city: req.query.city as string,
        isOnline: req.query.isOnline !== undefined ? req.query.isOnline === 'true' : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        freeOnly: req.query.freeOnly === 'true',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        timeframe: req.query.timeframe as any,
        sortBy: req.query.sortBy as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 12,
      };

      const result = await eventsService.getEvents(options);
      res.status(200).json({
        success: true,
        data: result.events,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCities(req: Request, res: Response, next: NextFunction) {
    try {
      const cities = await eventsService.getCities();
      res.status(200).json({
        success: true,
        data: cities,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventBySlugOrId(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.id;
      const event = await eventsService.getEventBySlugOrId(req.params.idOrSlug, currentUserId);
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
      const event = await eventsService.createEvent(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Event draft created successfully',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const event = await eventsService.updateEvent(req.params.id, req.user.id, req.user.role, req.body);
      res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitForApproval(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const event = await eventsService.submitForApproval(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Event submitted for review',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async publishApprovedEvent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const event = await eventsService.publishApprovedEvent(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Event published to public catalog',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelEvent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const event = await eventsService.cancelEvent(req.params.id, req.user.id, req.user.role, req.body?.reason);
      res.status(200).json({
        success: true,
        message: 'Event cancelled successfully',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleSaveEvent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await eventsService.toggleSaveEvent(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSavedEvents(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const events = await eventsService.getSavedEvents(req.user.id);
      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await eventsService.deleteEvent(req.params.id, req.user.id, req.user.role);
      res.status(200).json({
        success: true,
        message: result.message || 'Event removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const eventsController = new EventsController();
