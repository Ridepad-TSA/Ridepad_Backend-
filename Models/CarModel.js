const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({

model:{
    type:String,
    required:true,
    trim:true
},
category:{
    type:String,
    enum:["suv","economy","van","mercedes","lamborghini","ferrari"],
    default:"economy"
},
year:{
    type:String,
    required:true,
    trim:true
},
licenceNumber:{
    type:String,
    unique:true,
    required:true,
    trim:true
},
transmission:{
    type:String,
    enum:["automatic","manual"],
    default:"automatic"
},
fuelType:{
    type:String,
    enum:["diesel","petrol","gas","hybrid","electric"],
    default:"petrol"
},
pricePerDay:{
    type:Number,
    required:true,
    min:0
},
seats:{
    type:Number,
    required:true,
    default:4,
},
location:{
    type:String,
    required:true
},
description:{
    type:String,
    required:true,
    trim:true
},

image:{
    type:String,
    required:true
},

isActive:{
    type:Boolean,
    default:true //deactivating instead of deleting
}

},
{timestamps:true}
);

const Car = mongoose.model("Car",carSchema);
module.exports = Car;