const mongoose = require("mongoose");
const Car = require("../Models/CarModel");

const requiredCreateFields = [
    "model",
    "year",
    "licenceNumber",
    "pricePerDay",
    "seats",
    "location",
    "description",
    "image"
];

const allowedFields = [
    "model",
    "category",
    "year",
    "licenceNumber",
    "transmission",
    "fuelType",
    "pricePerDay",
    "seats",
    "location",
    "description",
    "image",
    "isActive"
];

const isBlank = (value) => value === undefined || value === null || value === "";

const parsePositiveInteger = (value) => {
    if (typeof value === "string") {
        if (value.trim() === "" || !/^\d+$/.test(value.trim())) return undefined;
    } else if (typeof value !== "number") {
        return undefined;
    }

    const parsedValue = Number(value);
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
};

const parseNonNegativeNumber = (value) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    if (typeof value !== "string" && typeof value !== "number") return undefined;

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : undefined;
};

const getValidationErrors = (error) => {
    if (error.name !== "ValidationError") {
        return undefined;
    }

    return Object.values(error.errors).map((fieldError) => ({
        field: fieldError.path,
        message: fieldError.message
    }));
};

const isDuplicateLicenceNumberError = (error) =>
    error.code === 11000 && Boolean(
        error.keyPattern?.licenceNumber || error.keyValue?.licenceNumber
    );

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validateCarId = (id, res) => {
    if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid car ID" });
        return false;
    }

    return true;
};

/* Get all active cars with optional filters. */
exports.getCars = async (req, res) => {
    try {
        const {
            category,
            location,
            transmission,
            fuelType,
            seats,
            minPrice,
            maxPrice,
            search
        } = req.query;

        const filter = { isActive: true };

        if (category) filter.category = category;
        if (location) filter.location = location;
        if (transmission) filter.transmission = transmission;
        if (fuelType) filter.fuelType = fuelType;

        if (seats !== undefined) {
            const parsedSeats = parsePositiveInteger(seats);
            if (parsedSeats === undefined) {
                return res.status(400).json({ message: "seats must be a positive integer" });
            }
            filter.seats = parsedSeats;
        }

        const hasMinPrice = minPrice !== undefined;
        const hasMaxPrice = maxPrice !== undefined;
        const parsedMinPrice = hasMinPrice ? parseNonNegativeNumber(minPrice) : undefined;
        const parsedMaxPrice = hasMaxPrice ? parseNonNegativeNumber(maxPrice) : undefined;

        if (hasMinPrice && parsedMinPrice === undefined) {
            return res.status(400).json({ message: "minPrice must be a non-negative number" });
        }

        if (hasMaxPrice && parsedMaxPrice === undefined) {
            return res.status(400).json({ message: "maxPrice must be a non-negative number" });
        }

        if (hasMinPrice && hasMaxPrice && parsedMinPrice > parsedMaxPrice) {
            return res.status(400).json({ message: "minPrice cannot be greater than maxPrice" });
        }

        if (hasMinPrice || hasMaxPrice) {
            filter.pricePerDay = {};
            if (hasMinPrice) filter.pricePerDay.$gte = parsedMinPrice;
            if (hasMaxPrice) filter.pricePerDay.$lte = parsedMaxPrice;
        }

        if (search !== undefined) {
            if (typeof search !== "string" || search.trim() === "") {
                return res.status(400).json({ message: "search must be a non-empty string" });
            }

            const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
            filter.$or = [
                { model: searchRegex },
                { location: searchRegex }
            ];
        }

        const cars = await Car.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Cars retrieved successfully",
            count: cars.length,
            cars
        });
    } catch (error) {
        console.error("Error retrieving cars:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/* Get one active car by ID. */
exports.getCarById = async (req, res) => {
    if (!validateCarId(req.params.id, res)) return;

    try {
        const car = await Car.findOne({ _id: req.params.id, isActive: true });

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        return res.status(200).json({ message: "Car retrieved successfully", car });
    } catch (error) {
        console.error("Error retrieving car:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/* Create a car. */
exports.createCar = async (req, res) => {
    const body = req.body || {};
    const missingFields = requiredCreateFields.filter((field) => isBlank(body[field]));

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: "Required car fields are missing",
            fields: missingFields
        });
    }

    const parsedSeats = parsePositiveInteger(body.seats);
    if (parsedSeats === undefined) {
        return res.status(400).json({ message: "seats must be a positive integer" });
    }

    try {
        const carData = {};
        allowedFields.forEach((field) => {
            if (body[field] !== undefined) carData[field] = body[field];
        });
        carData.seats = parsedSeats;

        const car = await Car.create(carData);
        return res.status(201).json({ message: "Car created successfully", car });
    } catch (error) {
        console.error("Error creating car:", error);

        if (isDuplicateLicenceNumberError(error)) {
            return res.status(409).json({ message: "licenceNumber already exists" });
        }

        const validationErrors = getValidationErrors(error);
        if (validationErrors) {
            return res.status(400).json({ message: "Invalid car data", errors: validationErrors });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
};

/* Update a car. */
exports.updateCar = async (req, res) => {
    if (!validateCarId(req.params.id, res)) return;

    const body = req.body || {};
    const updates = {};
    allowedFields.forEach((field) => {
        if (body[field] !== undefined) updates[field] = body[field];
    });

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "At least one car field is required" });
    }

    if (updates.seats !== undefined) {
        const parsedSeats = parsePositiveInteger(updates.seats);
        if (parsedSeats === undefined) {
            return res.status(400).json({ message: "seats must be a positive integer" });
        }
        updates.seats = parsedSeats;
    }

    try {
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true, context: "query" }
        );

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        return res.status(200).json({ message: "Car updated successfully", car });
    } catch (error) {
        console.error("Error updating car:", error);

        if (isDuplicateLicenceNumberError(error)) {
            return res.status(409).json({ message: "licenceNumber already exists" });
        }

        const validationErrors = getValidationErrors(error);
        if (validationErrors) {
            return res.status(400).json({ message: "Invalid car data", errors: validationErrors });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
};

/* Deactivate a car without deleting it. */
exports.deactivateCar = async (req, res) => {
    if (!validateCarId(req.params.id, res)) return;

    try {
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true, runValidators: true }
        );

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        return res.status(200).json({ message: "Car deactivated successfully", car });
    } catch (error) {
        console.error("Error deactivating car:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/* Activate a car. */
exports.activateCar = async (req, res) => {
    if (!validateCarId(req.params.id, res)) return;

    try {
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true, runValidators: true }
        );

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        return res.status(200).json({ message: "Car activated successfully", car });
    } catch (error) {
        console.error("Error activating car:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
