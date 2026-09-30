const express = require("express");
const router = express.Router();

const carController = require("../Controller/CarController");
const protect = require("../middleware/Auth");
const adminOnly = require("../middleware/adminOnly");

router.get("/", carController.getCars);
router.post("/", protect, adminOnly, carController.createCar);
router.put("/:id", protect, adminOnly, carController.updateCar);
router.patch("/:id/deactivate", protect, adminOnly, carController.deactivateCar);
router.patch("/:id/activate", protect, adminOnly, carController.activateCar);
router.get("/:id", carController.getCarById);

module.exports = router;
