const { AppError } = require('../Utils/appError');

function validateRegistration(request, _response, next) {
  const { name, email, password } = request.body;

  if (typeof name !== 'string' || name.trim().length < 2) {
    return next(new AppError(400, 'name must contain at least 2 characters'));
  }
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return next(new AppError(400, 'email must be valid'));
  }
  if (typeof password !== 'string' || password.length < 8) {
    return next(new AppError(400, 'password must contain at least 8 characters'));
  }

  return next();
}

function validateCar(request, _response, next) {
  const { make, model, year, pricePerDay } = request.body;

  if (typeof make !== 'string' || !make.trim() || typeof model !== 'string' || !model.trim()) {
    return next(new AppError(400, 'make and model are required'));
  }
  if (!Number.isInteger(Number(year)) || Number(year) < 1900) {
    return next(new AppError(400, 'year must be a valid integer'));
  }
  if (!Number.isFinite(Number(pricePerDay)) || Number(pricePerDay) < 0) {
    return next(new AppError(400, 'pricePerDay must be a non-negative number'));
  }

  return next();
}

function validateBooking(request, _response, next) {
  const { carId, pickupDate, returnDate } = request.body;

  if (typeof carId !== 'string' || !carId.trim()) {
    return next(new AppError(400, 'carId is required'));
  }
  if (typeof pickupDate !== 'string' || typeof returnDate !== 'string') {
    return next(new AppError(400, 'pickupDate and returnDate are required'));
  }

  return next();
}

module.exports = { validateRegistration, validateCar, validateBooking };
