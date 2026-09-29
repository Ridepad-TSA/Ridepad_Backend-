const mongoose = require('mongoose');

const { Booking } = require('../Models/BookingModel');
const { Car } = require('../Models/CarModel');
const { AppError } = require('../Utils/appError');
const { parseRentalDate } = require('../Utils/date');

function uploadedImageUrls(request) {
  const files = request.files || [];
  return files.map((file) => `/uploads/${file.filename}`);
}

async function listCars(request, response, next) {
  try {
    const { make, model, minPrice, maxPrice, availableFrom, availableTo } = request.query;
    const filter = { isActive: true };

    if (typeof make === 'string') filter.make = new RegExp(make, 'i');
    if (typeof model === 'string') filter.model = new RegExp(model, 'i');
    if (minPrice || maxPrice) {
      filter.pricePerDay = {
        ...(minPrice ? { $gte: Number(minPrice) } : {}),
        ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
      };
    }

    let cars = await Car.find(filter).sort({ createdAt: -1 });
    if (availableFrom && availableTo) {
      const pickupDate = parseRentalDate(availableFrom, 'availableFrom');
      const returnDate = parseRentalDate(availableTo, 'availableTo');
      const unavailable = await Booking.find({
        status: { $in: ['requested', 'picked_up', 'overdue'] },
        pickupDate: { $lt: returnDate },
        returnDate: { $gt: pickupDate },
      }).distinct('car');
      const unavailableIds = new Set(unavailable.map((id) => id.toString()));
      cars = cars.filter((car) => !unavailableIds.has(car.id));
    }

    return response.json(cars);
  } catch (error) {
    return next(error);
  }
}

async function getCar(request, response, next) {
  try {
    const car = await Car.findOne({ _id: request.params.id, isActive: true });
    if (!car) throw new AppError(404, 'Car not found');
    return response.json(car);
  } catch (error) {
    return next(error);
  }
}

async function createCar(request, response, next) {
  try {
    const car = await Car.create({
      ...request.body,
      year: Number(request.body.year),
      pricePerDay: Number(request.body.pricePerDay),
      images: uploadedImageUrls(request),
    });
    return response.status(201).json(car);
  } catch (error) {
    return next(error);
  }
}

async function updateCar(request, response, next) {
  try {
    const updates = { ...request.body };
    if (updates.year !== undefined) updates.year = Number(updates.year);
    if (updates.pricePerDay !== undefined) updates.pricePerDay = Number(updates.pricePerDay);
    const newImages = uploadedImageUrls(request);
    if (newImages.length) updates.images = newImages;

    const car = await Car.findByIdAndUpdate(request.params.id, updates, { new: true, runValidators: true });
    if (!car) throw new AppError(404, 'Car not found');
    return response.json(car);
  } catch (error) {
    return next(error);
  }
}

async function setCarActive(request, response, next) {
  try {
    const carId = String(request.params.id);
    if (!mongoose.Types.ObjectId.isValid(carId)) throw new AppError(400, 'Invalid car id');
    const car = await Car.findByIdAndUpdate(
      carId,
      { isActive: Boolean(request.body.isActive) },
      { new: true, runValidators: true },
    );
    if (!car) throw new AppError(404, 'Car not found');
    return response.json(car);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listCars, getCar, createCar, updateCar, setCarActive };
