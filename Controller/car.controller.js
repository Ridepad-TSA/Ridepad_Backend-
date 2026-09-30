const mongoose = require('mongoose');

const Booking = require('../Models/BookingModel');
const Car = require('../Models/CarModel');
const { AppError } = require('../Utils/appError');
const { ensureValidDateRange, parseRentalDate } = require('../Utils/date');

const blockingBookingStatuses = ['pending', 'confirmed', 'overdue', 'active', 'pickedup'];
const allowedUpdateFields = [
  'make', 'model', 'category', 'year', 'licenceNumber', 'transmission', 'fuelType',
  'pricePerDay', 'seats', 'location', 'description',
];

function uploadedImageUrls(request) {
  return (request.files || []).map((file) => `/uploads/${file.filename}`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function requireNonBlankQueryString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, `${fieldName} must be a non-empty string`);
  }
  return value.trim();
}

function parseNonNegativeQueryNumber(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, `${fieldName} must be a non-negative number`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(400, `${fieldName} must be a non-negative number`);
  }
  return parsed;
}

function parsePositiveInteger(value, fieldName) {
  if ((typeof value !== 'string' && typeof value !== 'number') || (typeof value === 'string' && !value.trim())) {
    throw new AppError(400, `${fieldName} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, `${fieldName} must be a positive integer`);
  }
  return parsed;
}

function validateCarId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(400, 'Invalid car id');
}

function validationError(error) {
  if (error?.code === 11000 && (error.keyPattern?.licenceNumber || error.keyValue?.licenceNumber)) {
    return new AppError(409, 'licenceNumber already exists');
  }
  if (error?.name === 'ValidationError') return new AppError(400, 'Invalid car data');
  return error;
}

function getCarUpdates(body, imageUrls) {
  const updates = {};
  for (const field of allowedUpdateFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  if (updates.year !== undefined) updates.year = Number(updates.year);
  if (updates.pricePerDay !== undefined) updates.pricePerDay = Number(updates.pricePerDay);
  if (updates.seats !== undefined) updates.seats = Number(updates.seats);
  if (imageUrls.length) updates.images = imageUrls;
  return updates;
}

async function listCars(request, response, next) {
  try {
    const {
      make, model, category, location, transmission, fuelType, seats,
      minPrice, maxPrice, search, availableFrom, availableTo,
    } = request.query;
    const filter = { isActive: true };

    for (const [field, value] of Object.entries({ make, model, location })) {
      if (value !== undefined) filter[field] = new RegExp(escapeRegex(requireNonBlankQueryString(value, field)), 'i');
    }
    for (const [field, value] of Object.entries({ category, transmission, fuelType })) {
      if (value !== undefined) filter[field] = requireNonBlankQueryString(value, field);
    }
    if (seats !== undefined) filter.seats = parsePositiveInteger(seats, 'seats');

    const parsedMinPrice = minPrice !== undefined ? parseNonNegativeQueryNumber(minPrice, 'minPrice') : undefined;
    const parsedMaxPrice = maxPrice !== undefined ? parseNonNegativeQueryNumber(maxPrice, 'maxPrice') : undefined;
    if (parsedMinPrice !== undefined && parsedMaxPrice !== undefined && parsedMinPrice > parsedMaxPrice) {
      throw new AppError(400, 'minPrice cannot exceed maxPrice');
    }
    if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) {
      filter.pricePerDay = {};
      if (parsedMinPrice !== undefined) filter.pricePerDay.$gte = parsedMinPrice;
      if (parsedMaxPrice !== undefined) filter.pricePerDay.$lte = parsedMaxPrice;
    }
    if (search !== undefined) {
      const searchRegex = new RegExp(escapeRegex(requireNonBlankQueryString(search, 'search')), 'i');
      filter.$or = [{ make: searchRegex }, { model: searchRegex }, { location: searchRegex }];
    }

    if ((availableFrom === undefined) !== (availableTo === undefined)) {
      throw new AppError(400, 'availableFrom and availableTo must be supplied together');
    }
    let cars = await Car.find(filter).sort({ createdAt: -1 });
    if (availableFrom !== undefined) {
      const pickupDate = parseRentalDate(availableFrom, 'availableFrom');
      const returnDate = parseRentalDate(availableTo, 'availableTo');
      ensureValidDateRange(pickupDate, returnDate);
      const unavailable = await Booking.find({
        bookingStatus: { $in: blockingBookingStatuses },
        pickUpDate: { $lt: returnDate },
        returnDate: { $gt: pickupDate },
      }).distinct('car');
      const unavailableIds = new Set(unavailable.map((id) => id.toString()));
      cars = cars.filter((car) => !unavailableIds.has(car.id));
    }
    return response.json(cars);
  } catch (error) {
    return next(validationError(error));
  }
}

async function getCar(request, response, next) {
  try {
    validateCarId(request.params.id);
    const car = await Car.findOne({ _id: request.params.id, isActive: true });
    if (!car) throw new AppError(404, 'Car not found');
    return response.json(car);
  } catch (error) {
    return next(validationError(error));
  }
}

async function createCar(request, response, next) {
  try {
    const body = request.body || {};
    const car = await Car.create({
      make: body.make,
      model: body.model,
      category: body.category,
      year: Number(body.year),
      licenceNumber: body.licenceNumber,
      transmission: body.transmission,
      fuelType: body.fuelType,
      pricePerDay: Number(body.pricePerDay),
      seats: Number(body.seats),
      location: body.location,
      description: body.description,
      images: uploadedImageUrls(request),
    });
    return response.status(201).json(car);
  } catch (error) {
    return next(validationError(error));
  }
}

async function updateCar(request, response, next) {
  try {
    validateCarId(request.params.id);
    const updates = getCarUpdates(request.body || {}, uploadedImageUrls(request));
    if (!Object.keys(updates).length) throw new AppError(400, 'At least one car field is required');
    const car = await Car.findByIdAndUpdate(request.params.id, updates, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    if (!car) throw new AppError(404, 'Car not found');
    return response.json(car);
  } catch (error) {
    return next(validationError(error));
  }
}

async function setCarActive(request, response, next) {
  try {
    validateCarId(request.params.id);
    const value = request.body?.isActive;
    const isActive = typeof value === 'boolean'
      ? value
      : typeof value === 'string' && /^(true|false)$/.test(value.trim().toLowerCase())
        ? value.trim().toLowerCase() === 'true'
        : undefined;
    if (isActive === undefined) throw new AppError(400, 'isActive must be a boolean');
    const car = await Car.findByIdAndUpdate(
      request.params.id,
      { isActive },
      { new: true, runValidators: true },
    );
    if (!car) throw new AppError(404, 'Car not found');
    return response.json(car);
  } catch (error) {
    return next(validationError(error));
  }
}

module.exports = { listCars, getCar, createCar, updateCar, setCarActive };
