const { AppError } = require('./appError');

function parseRentalDate(value, fieldName) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new AppError(400, `${fieldName} must be a valid date`);
  }

  return new Date(value);
}

function ensureValidDateRange(pickupDate, returnDate) {
  if (returnDate <= pickupDate) {
    throw new AppError(400, 'returnDate must be after pickupDate');
  }
}

function getRentalDays(pickupDate, returnDate) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((returnDate.getTime() - pickupDate.getTime()) / millisecondsPerDay);
}

module.exports = { parseRentalDate, ensureValidDateRange, getRentalDays };
