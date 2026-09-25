const express = require("express");
const router = express.Router()

/*import the userController */
const userRouter = require("../Controller/UserController");

router.post("/createuser", userRouter.createUser);
router.post("/login", userRouter.loginUser)
router.post("/forgot-password", userRouter.forgotPassword);
router.post("/reset-password/:token", userRouter.resetPassword);

module.exports  = router;