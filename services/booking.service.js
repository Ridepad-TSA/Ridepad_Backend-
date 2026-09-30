const Booking = require('../Models/BookingModel');
const { AppError } = require('../Utils/appError');

async function markOverdueBookings() {
  const now = new Date();
  const overdueFilter = { status: 'picked_up', returnDate: { $lt: now } };

  await Booking.updateMany(overdueFilter, { $set: { status: 'overdue' } });
  await Booking.updateMany(
    {
      status: 'overdue',
      returnDate: { $lt: now },
      $or: [{ overdueAt: null }, { overdueAt: { $exists: false } }],
    },
    { $set: { overdueAt: now } },
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
  if (!Object.prototype.hasOwnProperty.call(allowedTransitions, current)) {
    throw new AppError(400, `Invalid current booking status: ${current}`);
  }
  if (!allowedTransitions[current].includes(next)) {
    throw new AppError(400, `Cannot move booking from ${current} to ${next}`);
  }
}

module.exports = { markOverdueBookings, assertStatusTransition };
