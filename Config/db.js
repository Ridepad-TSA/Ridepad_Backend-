const mongoose = require("mongoose");
const dns = require("dns");

// Set the DNS server to use for MongoDB connection
dns.setServers(["8.8.8.8"]);

const connectDb = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI);

        console.log(
            `MongoDB connected: ${connection.connection.host}`
        );
    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        throw error;
    };
}

module.exports = { connectDb };