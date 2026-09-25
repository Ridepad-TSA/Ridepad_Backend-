const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDb = async() =>{

    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDb Connected Succesfully`);
        console.log(`DATABASE:${conn.connection.name}`);
    }catch(error){
        console.log(`error:${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDb;



