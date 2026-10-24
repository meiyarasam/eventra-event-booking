import { Router } from 'express';
import { ticketsController } from './tickets.controller';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/require-role';
import { UserRole } from '@eventra/shared';

const router = Router();

router.use(requireAuth);

router.get('/me', ticketsController.getMyTickets);
router.get('/:id', ticketsController.getTicketById);

// Staff / Organizer check-in endpoints
router.post(
  '/validate',
  requireRole(UserRole.ORGANIZER, UserRole.ADMIN),
  ticketsController.validateTicket
);

router.post(
  '/check-in',
  requireRole(UserRole.ORGANIZER, UserRole.ADMIN),
  ticketsController.checkInTicket
);

export const ticketsRoutes = router;
