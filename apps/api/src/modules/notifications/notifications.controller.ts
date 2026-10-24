import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { AppError } from '../../utils/app-error';

export class NotificationsController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await notificationsService.getMyNotifications(req.user.id);
      res.status(200).json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const notification = await notificationsService.markAsRead(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await notificationsService.markAllAsRead(req.user.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
