const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const index = express();

const connectDb = require("./Config/db");

/* routes */
const userRoute = require("./Route/userRoute");

index.use(express.json());//middleware to parse json request bodies



index.use("/api/users",userRoute);


const PORT = process.env.PORT ||2600;


connectDb();

index.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
});



