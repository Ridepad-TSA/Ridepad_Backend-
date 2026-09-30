const express = require('express');

const { createCar, getCar, listCars, setCarActive, updateCar } = require('../Controller/car.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { carImagesUpload } = require('../middleware/upload.middleware');
const { validateCar, validateCarUpdate } = require('../middleware/validation.middleware');

const router = express.Router();

router.get('/', listCars);
router.get('/:id', getCar);
router.post('/', authenticate, authorize('admin'), carImagesUpload.array('images', 10), validateCar, createCar);
router.patch('/:id', authenticate, authorize('admin'), carImagesUpload.array('images', 10), validateCarUpdate, updateCar);
router.patch('/:id/active', authenticate, authorize('admin'), setCarActive);

module.exports = router;
