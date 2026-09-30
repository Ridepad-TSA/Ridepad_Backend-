const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
        trim:true
    },
     email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash:{
        type:String,
        required:true,
        select: false
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

// Compare entered password with stored password hash
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model("User", userSchema);
module.exports = { User };