const mongoose = require("mongoose");


const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Car',
  },
  pickupDate: {
    type: Date,
    required: true,
  },
  returnDate: {
    type: Date,
    required: true,
  },
  rentalDays: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['requested', 'picked_up', 'overdue', 'returned', 'cancelled'],
    default: 'requested',
  },
  pickedUpAt: Date,
  returnedAt: Date,
  cancelledAt: Date,
  overdueAt: Date,
}, { timestamps: true });

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ car: 1, pickupDate: 1, returnDate: 1 });
bookingSchema.index({ status: 1, returnDate: 1 });

const Booking = mongoose.model("Booking",bookingSchema);
module.exports = Booking;
