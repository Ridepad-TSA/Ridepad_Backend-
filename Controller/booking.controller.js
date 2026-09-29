const mongoose = require('mongoose');

const { Booking } = require('../Models/BookingModel');
const { Car } = require('../Models/CarModel');
const { AppError } = require('../Utils/appError');
const { ensureValidDateRange, getRentalDays, parseRentalDate } = require('../Utils/date');
const { assertStatusTransition, markOverdueBookings } = require('../services/booking.service');

async function createBooking(request, response, next) {
  const session = await mongoose.startSession();
  try {
    const { carId, pickupDate: rawPickupDate, returnDate: rawReturnDate } = request.body;
    if (!mongoose.Types.ObjectId.isValid(carId)) throw new AppError(400, 'Invalid car id');

    const pickupDate = parseRentalDate(rawPickupDate, 'pickupDate');
    const returnDate = parseRentalDate(rawReturnDate, 'returnDate');
    ensureValidDateRange(pickupDate, returnDate);
    if (pickupDate < new Date()) throw new AppError(400, 'pickupDate cannot be in the past');

    let createdBooking;
    await session.withTransaction(async () => {
      const car = await Car.findOne({ _id: carId, isActive: true }).session(session);
      if (!car) throw new AppError(404, 'Active car not found');

      const conflict = await Booking.exists({
        car: car._id,
        status: { $in: ['requested', 'picked_up', 'overdue'] },
        pickupDate: { $lt: returnDate },
        returnDate: { $gt: pickupDate },
      }).session(session);
      if (conflict) throw new AppError(409, 'Car is already booked for those dates');

      const booking = new Booking({
        user: request.user.userId,
        car: car._id,
        pickupDate,
        returnDate,
        rentalDays: getRentalDays(pickupDate, returnDate),
        totalPrice: getRentalDays(pickupDate, returnDate) * car.pricePerDay,
        status: 'requested',
      });
      createdBooking = await booking.save({ session });
    });

    return response.status(201).json(createdBooking);
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
}

async function listMyBookings(request, response, next) {
  try {
    await markOverdueBookings();
    const bookings = await Booking.find({ user: request.user.userId }).populate('car').sort({ createdAt: -1 });
    return response.json(bookings);
  } catch (error) {
    return next(error);
  }
}

async function listAllBookings(_request, response, next) {
  try {
    await markOverdueBookings();
    const bookings = await Booking.find().populate('user', 'name email').populate('car').sort({ createdAt: -1 });
    return response.json(bookings);
  } catch (error) {
    return next(error);
  }
}

async function listOverdueBookings(_request, response, next) {
  try {
    await markOverdueBookings();
    return response.json(await Booking.find({ status: 'overdue' }).populate('user', 'name email').populate('car'));
  } catch (error) {
    return next(error);
  }
}

async function cancelBooking(request, response, next) {
  try {
    const booking = await Booking.findOne({ _id: request.params.id, user: request.user.userId });
    if (!booking) throw new AppError(404, 'Booking not found');
    assertStatusTransition(booking.status, 'cancelled');
    booking.status = 'cancelled';
    await booking.save();
    return response.json(booking);
  } catch (error) {
    return next(error);
  }
}

async function updateBookingStatus(request, response, next) {
  try {
    const { status } = request.body;
    const validStatuses = ['requested', 'picked_up', 'returned', 'cancelled', 'overdue'];
    if (!validStatuses.includes(status)) throw new AppError(400, 'Invalid booking status');

    const booking = await Booking.findById(request.params.id);
    if (!booking) throw new AppError(404, 'Booking not found');
    assertStatusTransition(booking.status, status);
    booking.status = status;
    await booking.save();
    return response.json(booking);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createBooking,
  listMyBookings,
  listAllBookings,
  listOverdueBookings,
  cancelBooking,
  updateBookingStatus,
};
