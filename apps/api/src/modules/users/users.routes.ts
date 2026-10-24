import { Router } from 'express';
import { usersController } from './users.controller';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
  OrganizerRequestSchema,
} from '@eventra/shared';

const router = Router();

router.get('/me', requireAuth, usersController.getProfile);
router.patch('/me', requireAuth, validate(UpdateProfileSchema), usersController.updateProfile);
router.patch('/me/password', requireAuth, validate(ChangePasswordSchema), usersController.changePassword);
router.post('/organizer-requests', requireAuth, validate(OrganizerRequestSchema), usersController.submitOrganizerRequest);

export const usersRoutes = router;
