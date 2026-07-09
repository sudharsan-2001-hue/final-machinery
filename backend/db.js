const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const sql = require("mssql");

const serverEnv = process.env.DB_SERVER || "localhost";
const [serverHost, instanceName] = serverEnv.includes("\\")
  ? serverEnv.split("\\")
  : [serverEnv, undefined];

const config = {
  server: serverHost,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    instanceName,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Add user/password only if provided (SQL Server Authentication)
// Otherwise use Windows Authentication
const hasDbUser = process.env.DB_USER && process.env.DB_USER.trim() !== "";
console.log("DB_USER from env:", process.env.DB_USER);
console.log("Has DB_USER:", hasDbUser);

if (hasDbUser) {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
  config.options.trustedConnection = false;
  console.log("Using SQL Server Authentication with user:", config.user);
} else {
  config.options.trustedConnection = true;
  console.log("Using Windows Authentication (Integrated Security)");
}

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("SQL Server connected successfully");
    return pool;
  })
  .catch((err) => {
    console.error("DB Connection Error:", err.message);
    console.error("Ensure SQL Server is running and credentials in .env are correct.");
    throw err;
  });

module.exports = { sql, poolPromise };
