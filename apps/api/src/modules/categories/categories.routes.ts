import { Router } from 'express';
import { categoriesController } from './categories.controller';

const router = Router();

router.get('/', categoriesController.getAllCategories);
router.get('/:slug', categoriesController.getCategoryBySlug);

export const categoriesRoutes = router;
