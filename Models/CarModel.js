const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['suv', 'economy', 'van', 'mercedes', 'lamborghini', 'ferrari'],
    default: 'economy',
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: 2100,
  },
  licenceNumber: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  transmission: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'automatic',
  },
  fuelType: {
    type: String,
    enum: ['diesel', 'petrol', 'gas', 'hybrid', 'electric'],
    default: 'petrol',
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0,
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
    default: 4,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);
module.exports = Car;
