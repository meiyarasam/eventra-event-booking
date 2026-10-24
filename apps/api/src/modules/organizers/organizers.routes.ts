import { Router } from 'express';
import { organizersController } from './organizers.controller';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/require-role';
import { UserRole } from '@eventra/shared';

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.ORGANIZER, UserRole.ADMIN));

router.get('/dashboard', organizersController.getDashboard);
router.get('/events', organizersController.getMyEvents);
router.get('/events/:id/attendees', organizersController.getEventAttendees);

export const organizersRoutes = router;
