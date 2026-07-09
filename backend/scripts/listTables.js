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
    const tables = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    console.log("TABLES:");
    tables.recordset.forEach((t) => console.log(" -", t.TABLE_NAME));

    for (const name of ["Users", "UserMaster", "Products", "ProductMaster"]) {
      const exists = tables.recordset.find((t) => t.TABLE_NAME === name);
      if (exists) {
        const cols = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = '${name}'
          ORDER BY ORDINAL_POSITION
        `);
        console.log(`\n${name} columns:`);
        cols.recordset.forEach((c) => console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
      }
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("DB Error:", err.message);
    process.exit(1);
  });
