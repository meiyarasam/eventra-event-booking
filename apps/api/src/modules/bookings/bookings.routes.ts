import { Router } from 'express';
import { bookingsController } from './bookings.controller';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { CreateReservationSchema, ProcessPaymentSchema } from '@eventra/shared';

const router = Router();

router.use(requireAuth);

router.post('/reservations', validate(CreateReservationSchema), bookingsController.createReservation);
router.get('/reservations/:id', bookingsController.getReservationById);
router.post('/pay', validate(ProcessPaymentSchema), bookingsController.processPayment);
router.get('/me', bookingsController.getMyBookings);
router.get('/:id', bookingsController.getBookingById);
router.post('/:id/cancel', bookingsController.cancelBooking);
router.post('/:id/resend-email', bookingsController.resendEmail);

export const bookingsRoutes = router;
