const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
        trim:true
    },
     email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true,
        trim:true
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    
    resetPasswordToken: {
    type: String
},
resetPasswordExpires: {
    type: Date
}



},
{timestamps:true}//time created and updated
);

const User = mongoose.model("User",userSchema);
module.exports  = User;