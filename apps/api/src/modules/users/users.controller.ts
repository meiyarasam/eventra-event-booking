import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { AppError } from '../../utils/app-error';

export class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const profile = await usersService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const updated = await usersService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await usersService.changePassword(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitOrganizerRequest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const request = await usersService.submitOrganizerRequest(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Organizer request submitted successfully. An administrator will review your application.',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
