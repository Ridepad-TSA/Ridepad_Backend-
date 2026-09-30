const bcrypt = require("bcryptjs");

const { adminEmail, adminPassword } = require("./config/env");
const { User } = require("./Models/UserModel");

async function seedAdmin() {

    console.log("User model:", User);
    console.log("User.findOne:", User.findOne);

    const existingAdmin = await User.findOne({
        role: "admin"
    });

    if (existingAdmin) {
        console.log("Admin user already exists");
        return;
    }

    const passwordHash = await bcrypt.hash(
        adminPassword,
        12
    );

    await User.create({
        name: "System Administrator",
        email: adminEmail.toLowerCase().trim(),
        passwordHash,
        phone: "0000000000",
        role: "admin"
    });

    console.log("Admin user created successfully");
}

module.exports = {
    seedAdmin
};