require("dotenv").config();
const sql = require("mssql");
const serverEnv = process.env.DB_SERVER || "localhost";
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: serverEnv.split("\\")[0],
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true, instanceName: serverEnv.includes("\\") ? serverEnv.split("\\")[1] : undefined },
};
sql.connect(config).then(async (pool) => {
  const cols = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'AdminActivityLogs' ORDER BY ORDINAL_POSITION
  `);
  console.log(cols.recordset.map(c => c.COLUMN_NAME).join(", "));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
