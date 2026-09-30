
const bcrypt = require("bcryptjs");

const { adminEmail, adminPassword } = require("./config/env");
const User = require("./Models/UserModel");

async function seedAdmin() {
    const existingAdmin = await User.findOne({
        role: "admin"
    });

    if (existingAdmin) {
        console.log("Admin account already exists");
        return;
    }

    const passwordHash = await bcrypt.hash(
        adminPassword,
        12
    );

    await User.create({
        name: "System Administrator",
        email: adminEmail,
        phone: "00000000000",
        passwordHash,
        role: "admin"
    });

    console.log(`Admin account seeded for ${adminEmail}`);
}

module.exports = { seedAdmin };
