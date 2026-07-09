require("dotenv").config();
const sql = require("mssql");

const serverEnv = process.env.DB_SERVER || "localhost";
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: serverEnv.split("\\")[0],
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT !== "false",
    instanceName: serverEnv.includes("\\") ? serverEnv.split("\\")[1] : undefined,
  },
};

sql
  .connect(config)
  .then(async (pool) => {
    const users = await pool.request().query(`
      SELECT UserID, Username, Email, PhoneNumber, Role, Status, LEFT(Password, 20) AS PasswordPreview
      FROM Users
    `);
    console.log(JSON.stringify(users.recordset, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
