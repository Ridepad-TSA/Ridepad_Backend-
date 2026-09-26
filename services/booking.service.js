const { Booking } = require('../Models/BookingModel');
const { AppError } = require('../utils/appError');

async function markOverdueBookings() {
  await Booking.updateMany(
    { status: 'picked_up', returnDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } },
  );
}

const allowedTransitions = {
  requested: ['picked_up', 'cancelled'],
  picked_up: ['returned', 'overdue'],
  overdue: ['returned'],
  returned: [],
  cancelled: [],
};

function assertStatusTransition(current, next) {
  if (!allowedTransitions[current].includes(next)) {
    throw new AppError(400, `Cannot move booking from ${current} to ${next}`);
  }
}

module.exports = { markOverdueBookings, assertStatusTransition };
