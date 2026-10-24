import { Router } from 'express';
import { eventsController } from './events.controller';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/require-role';
import { validate } from '../../middleware/validate';
import { EventSchema, UserRole } from '@eventra/shared';

const router = Router();

// Public routes
router.get('/', eventsController.getEvents);
router.get('/cities', eventsController.getCities);
router.get('/saved', requireAuth, eventsController.getSavedEvents);
router.get('/:idOrSlug', optionalAuth, eventsController.getEventBySlugOrId);

// Authenticated attendee route
router.post('/:id/save', requireAuth, eventsController.toggleSaveEvent);

// Organizer & Admin routes
router.post(
  '/',
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.ADMIN),
  validate(EventSchema),
  eventsController.createEvent
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.ADMIN),
  eventsController.updateEvent
);

router.post(
  '/:id/submit',
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.ADMIN),
  eventsController.submitForApproval
);

router.post(
  '/:id/publish',
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.ADMIN),
  eventsController.publishApprovedEvent
);

router.post(
  '/:id/cancel',
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.ADMIN),
  eventsController.cancelEvent
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.ADMIN),
  eventsController.deleteEvent
);

export const eventsRoutes = router;
