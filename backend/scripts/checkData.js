require("dotenv").config();
const sql = require("mssql");
const serverEnv = process.env.DB_SERVER || "localhost";
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: serverEnv.split("\\")[0],
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: serverEnv.includes("\\") ? serverEnv.split("\\")[1] : undefined,
  },
};
sql.connect(config).then(async (pool) => {
  const cats = await pool.request().query("SELECT CategoryID, CategoryName FROM MachineryCategories");
  const count = await pool.request().query("SELECT COUNT(*) AS cnt FROM MachineryProducts");
  console.log("Categories:", cats.recordset.length);
  cats.recordset.forEach(c => console.log(`  ${c.CategoryID}: ${c.CategoryName}`));
  console.log("Product count:", count.recordset[0].cnt);
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
