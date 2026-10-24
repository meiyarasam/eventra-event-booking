import { Request, Response, NextFunction } from 'express';
import { aiService } from './ai.service';
import { AppError } from '../../utils/app-error';

export class AIController {
  async generateDescription(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, categoryName, venueName, city, isOnline, highlights, targetAudience } = req.body;
      if (!title) {
        throw AppError.badRequest('Event title is required to generate description.');
      }
      const description = await aiService.generateEventDescription({
        title,
        categoryName,
        venueName,
        city,
        isOnline,
        highlights,
        targetAudience,
      });
      res.status(200).json({
        success: true,
        data: { description },
      });
    } catch (error) {
      next(error);
    }
  }

  async parseSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        throw AppError.badRequest('A text query is required for natural-language search parsing.');
      }
      const parsed = await aiService.parseNaturalLanguageSearch(query);
      res.status(200).json({
        success: true,
        data: parsed,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.id;
      const recommendations = await aiService.getRecommendations(currentUserId);
      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        throw AppError.badRequest('A chat message is required.');
      }
      const currentUserId = req.user?.id;
      const result = await aiService.chat(message, history, currentUserId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
