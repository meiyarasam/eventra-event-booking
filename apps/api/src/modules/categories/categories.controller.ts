import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { AppError } from '../../utils/app-error';

export class CategoriesController {
  async getAllCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.getAllCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.getCategoryBySlug(req.params.slug);
      if (!category) {
        throw AppError.notFound('Category not found');
      }
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
