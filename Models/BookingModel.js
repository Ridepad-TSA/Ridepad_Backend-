const mongoose = require("mongoose");


const bookingSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },

    car:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Car",
    },
    pickUpDate:{
        type:Date,
        required:true,
    },
    returnDate:{
        type:Date,
        required:true
    },
    pricePerDay:{
        type:Number,
        required:true
    },

    bookingStatus:{
        type:String,
        enum:["pending","confirmed","overdue","active","returned","pickedup","cancelled"],
        default:"pending"
    },
    rentalDays:{
        type:Number,
        required:true
    },

    pickUpAt:{
        type:Date,
    },
    returnedAt:{
        type:Date,
    },
    cancelledAt:{
        type:Date,
    },
    overdueAt:{
        type:Date,
    }

},
{timestamps:true}//created and update at

);

const Booking = mongoose.model("Booking",bookingSchema);
module.exports = Booking;