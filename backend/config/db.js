const mongoose = require("mongoose");


const connectDB = async () => {
  try {
    console.log("Mongo URI:", process.env.MONGODB_URI);
    console.log("Node Version:", process.version);

    mongoose.connection.on("connected", () => {
      console.log("✅ Mongo Connected");
    });

    mongoose.connection.on("error", (err) => {
      console.log("❌ Mongo Error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ Mongo Disconnected");
    });

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};


const dns = require("dns");

// Force Node to use public DNS instead of localhost
dns.setServers(["8.8.8.8", "8.8.4.4"]);

console.log("DNS Servers:", dns.getServers());
module.exports = connectDB;