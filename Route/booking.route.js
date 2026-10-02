const express = require('express');

const {
  cancelBooking,
  createBooking,
  getBookingDetails,
  listAllBookings,
  listActiveRentals,
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
router.get('/overdue', authorize('admin'), listOverdueBookings);
router.get('/active', authorize('admin'), listActiveRentals);
router.get('/:id', authorize('user', 'admin'), getBookingDetails);
router.patch('/:id/cancel', authorize('user', 'admin'), cancelBooking);
router.get('/', authorize('admin'), listAllBookings);
router.patch('/:id/status', authorize('admin'), updateBookingStatus);

module.exports = router;
