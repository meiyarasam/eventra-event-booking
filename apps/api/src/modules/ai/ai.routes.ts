import { Router } from 'express';
import { aiController } from './ai.controller';
import { optionalAuth, requireAuth } from '../../middleware/auth';

const router = Router();

// Description generation (authenticated organizers & admins)
router.post('/generate-description', requireAuth, aiController.generateDescription);

// Natural-Language event search parser (public)
router.post('/parse-search', aiController.parseSearch);

// Personalized event recommendations (optional auth to personalize based on user history)
router.get('/recommendations', optionalAuth, aiController.getRecommendations);

// AI Platform Chatbot (optional auth to personalize booking information)
router.post('/chat', optionalAuth, aiController.chat);

export const aiRoutes = router;
