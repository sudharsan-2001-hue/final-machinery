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

sql.connect(config).then(async (pool) => {
  const tables = ["MachineryProducts", "MachineryCategories", "Orders", "OrderItems", "CustomerAddresses", "Payments", "ProductImages", "StockHistory"];
  for (const t of tables) {
    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${t}' ORDER BY ORDINAL_POSITION
    `);
    console.log(`\n=== ${t} ===`);
    cols.recordset.forEach(c => console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE}) ${c.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`));
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
