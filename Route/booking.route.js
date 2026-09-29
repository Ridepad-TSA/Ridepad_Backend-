const express = require('express');

const {
  cancelBooking,
  createBooking,
  listAllBookings,
  listMyBookings,
  listOverdueBookings,
  updateBookingStatus,
} = require('../Controller/booking.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateBooking } = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authenticate);
router.post('/', authorize('user', 'admin'), validateBooking, createBooking);
router.get('/mine', authorize('user', 'admin'), listMyBookings);
router.patch('/:id/cancel', authorize('user', 'admin'), cancelBooking);
router.get('/', authorize('admin'), listAllBookings);
router.get('/overdue', authorize('admin'), listOverdueBookings);
router.patch('/:id/status', authorize('admin'), updateBookingStatus);

module.exports = router;
