
const bcrypt = require("bcrypt");
const User = require("../Models/UserModel");
const jwt = require("jsonwebtoken")
const crypto = require("crypto");
const sendResetEmail = require("../services/emailSender");

/* Create a user */
exports.createUser = async(req,res) =>{
   try{
    const{name,email,password,phone}= req.body;

    /*check if all the fields were provided */

    if(!name || !email || !password ||!phone){
    return res.status(400).json({message:"name,email,password,phone are all required"});
    }
    /*check if the email aready exist */

    const existingEmail = await User.findOne({email});
    if(existingEmail){
        return res.status(400).json({message:"email already exists"});

    }
    /* check if the phone already exists */

    const existingPhone = await User.findOne({phone});
    if(existingPhone){
        return res.status(400).json({message:"phone already exists"});

    }

    /*hash password so it doesnt store pLain password*/

    const salt =  await bcrypt.genSalt(10);
    const hashedPassword =  await bcrypt.hash(password,salt);

    /* now create a new user */

    const user = new User({
        name:name,
        email:email,
        password:hashedPassword,
        phone:phone

    });
    await user.save();
   const { password: _, ...safeUser } = user.toObject();//hides the password
    return res.status(200).json({message:"User created successfully",safeUser})
}catch(error){
    console.error("error creating user",error);

        if(error.name === "CastError"
        ){
            return res.status(400).json({message:"Invalid user data"})
        }
    return res.status(500).json({message:"Internal server error"})
};



};

/* login user */


exports.loginUser = async (req,res) =>{
    try{
        const {email,password}= req.body;
        if(!email || !password){
            return res.status(400).json({message:"provide email and password"});

        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"invalid email or password"});
        }
       const matchingPassword = await bcrypt.compare(password,user.password);
       if(!matchingPassword){
        return res.status(401).json({message:"Invalid email orpassword"});

       }
       const secret = process.env.JWT_SECRET;
       if(!secret){
        return res.status(500).json({message:"JWT not configured"})

       }
       const token = jwt.sign(
        {
            userId:user._id,
            role:user.role
        },
        secret,
        {
          expiresIn:"1h"
        }
       )
       return res.status(200).json({message:"Login Succesfull",token});

    }catch (error){
        console.error("error logging in a user",error);

        if(error.name ==="CastError"
        ){
        return res.status(400).json({message:"Invalid user data"});
        }
        return res.status(500).json({messgae:"Internal server error"});
    }


};

/*Reset password */

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                message: "New password is required"
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Password reset successful"
        });

    } catch (error) {
        console.error("Error resetting password:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

/* forgot password */

exports.forgotPassword = async (req, res) => {
    try {
        console.log("forgotPassword controller reached");

        const { email } = req.body;

        console.log("Email:", email);

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        console.log("User found:", !!user);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

        await user.save();

        console.log("Reset token saved");

        await sendResetEmail(user.email, resetToken);

        console.log("Reset email function completed");

        return res.status(200).json({
            message: "Password reset link sent successfully"
        });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};