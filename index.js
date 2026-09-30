require("dotenv").config();

const app = require("./app");
const { connectDb } = require("./Config/db");
const { seedAdmin } = require("./seedAdmin");

const PORT = process.env.PORT || 5050;

async function startServer() {
    try {
        await connectDb();
        await seedAdmin();

        app.listen(PORT, () => {
            console.log(`API running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();
