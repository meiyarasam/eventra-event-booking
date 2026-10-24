import { Router } from 'express';
import { adminController } from './admin.controller';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/require-role';
import { validate } from '../../middleware/validate';
import {
  AdminReviewEventSchema,
  AdminReviewOrganizerSchema,
  AdminUpdateUserStatusSchema,
  UserRole,
} from '@eventra/shared';

const router = Router();

// Protect all admin routes
router.use(requireAuth);
router.use(requireRole(UserRole.ADMIN));

router.get('/overview', adminController.getOverview);

// Events Management & Moderation
router.get('/events', adminController.getAllEvents);
router.post('/events', adminController.createEvent);
router.get('/events/pending', adminController.getPendingEvents);
router.get('/events/:id', adminController.getEventById);
router.patch('/events/:id', adminController.updateEvent);
router.put('/events/:id', adminController.updateEvent);
router.patch('/events/:id/status', adminController.updateEventStatus);
router.delete('/events/:id', adminController.deleteEvent);
router.post('/events/:id/review', validate(AdminReviewEventSchema), adminController.reviewEvent);

// Organizer Applications Queue
router.get('/organizer-requests', adminController.getOrganizerRequests);
router.post('/organizer-requests/:id/review', validate(AdminReviewOrganizerSchema), adminController.reviewOrganizerRequest);

// Users Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/status', validate(AdminUpdateUserStatusSchema), adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Platform Bookings & Ticket Oversight
router.get('/bookings', adminController.getAllBookings);

// Platform System Announcements & Notifications
router.get('/notifications', adminController.getNotifications);
router.post('/notifications/broadcast', adminController.broadcastNotification);

export const adminRoutes = router;
