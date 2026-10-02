const { AppError } = require('../Utils/appError');

function validateRegistration(request, _response, next) {
  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(new AppError(400, 'Request body is required'));
  }

  const { name, email, password, phone } = body;

  if (typeof name !== 'string' || name.trim().length < 2) {
    return next(new AppError(400, 'name must contain at least 2 characters'));
  }
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return next(new AppError(400, 'email must be valid'));
  }
  if (typeof password !== 'string' || password.length < 8) {
    return next(new AppError(400, 'password must contain at least 8 characters'));
  }
  if (typeof phone !== 'string' || !phone.trim()) {
    return next(new AppError(400, 'phone is required'));
  }

  return next();
}

function validateCar(request, _response, next) {
  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(new AppError(400, 'Request body is required'));
  }

  const { make, model, year, licenceNumber, location, description, seats, pricePerDay } = body;

  if ([make, model, licenceNumber, location, description].some(
    (value) => typeof value !== 'string' || !value.trim()
  )) {
    return next(new AppError(400, 'make, model, licenceNumber, location, and description are required'));
  }
  if (!isValidYear(year)) {
    return next(new AppError(400, 'year must be a valid integer'));
  }
  if (!isNonNegativeNumber(pricePerDay)) {
    return next(new AppError(400, 'pricePerDay must be a non-negative number'));
  }
  if (!isPositiveInteger(seats)) {
    return next(new AppError(400, 'seats must be a positive integer'));
  }

  return next();
}

function isValidYear(value) {
  const year = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return Number.isInteger(year) && year >= 1900 && year <= 2100;
}

function isNonNegativeNumber(value) {
  if ((typeof value !== 'string' && typeof value !== 'number') || (typeof value === 'string' && !value.trim())) {
    return false;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

function isPositiveInteger(value) {
  if ((typeof value !== 'string' && typeof value !== 'number') || (typeof value === 'string' && !value.trim())) {
    return false;
  }
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
}

function validateCarUpdate(request, _response, next) {
  const body = request.body;
  if (body !== undefined && (body === null || typeof body !== 'object' || Array.isArray(body))) {
    return next(new AppError(400, 'Request body must be an object'));
  }

  const updates = body || {};
  const stringFields = ['make', 'model', 'licenceNumber', 'location', 'description'];

  for (const field of stringFields) {
    if (updates[field] !== undefined && (typeof updates[field] !== 'string' || !updates[field].trim())) {
      return next(new AppError(400, `${field} must be a non-empty string`));
    }
  }
  if (updates.year !== undefined && !isValidYear(updates.year)) {
    return next(new AppError(400, 'year must be a valid integer'));
  }
  if (updates.pricePerDay !== undefined && !isNonNegativeNumber(updates.pricePerDay)) {
    return next(new AppError(400, 'pricePerDay must be a non-negative number'));
  }
  if (updates.seats !== undefined && !isPositiveInteger(updates.seats)) {
    return next(new AppError(400, 'seats must be a positive integer'));
  }

  return next();
}

function validateBooking(request, _response, next) {
  const { carId, pickupDate, returnDate } = request.body || {};

  if (typeof carId !== 'string' || !carId.trim()) {
    return next(new AppError(400, 'carId is required'));
  }
  if (typeof pickupDate !== 'string' || typeof returnDate !== 'string') {
    return next(new AppError(400, 'pickupDate and returnDate are required'));
  }

  return next();
}

module.exports = { validateRegistration, validateCar, validateCarUpdate, validateBooking };
